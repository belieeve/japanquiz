// ゲームの状態管理
let currentQuestion = null;
let correctCount = 0;
let incorrectCount = 0;
let usedPrefectures = new Set();
let selectedRegion = null;
let regionPrefectures = [];

// DOM要素
const regionSelectScreen = document.getElementById('region-select');
const gameScreen = document.getElementById('game-screen');
const regionButtons = document.querySelectorAll('.region-btn');
const backButton = document.getElementById('back-button');
const regionTitle = document.getElementById('region-title');
const mapImage = document.getElementById('japan-map');
const clickCanvas = document.getElementById('click-canvas');
const questionElement = document.getElementById('question');
const correctElement = document.getElementById('correct');
const incorrectElement = document.getElementById('incorrect');
const popup = document.getElementById('popup');
const popupTitle = document.getElementById('popup-title');
const popupMessage = document.getElementById('popup-message');
const nextButton = document.getElementById('next-button');

let ctx;

// 初期化
function init() {
    // 地方選択ボタンのイベント
    regionButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const region = btn.dataset.region;
            startRegionGame(region);
        });
    });

    // 戻るボタン
    backButton.addEventListener('click', () => {
        gameScreen.classList.add('hidden');
        regionSelectScreen.classList.remove('hidden');
        resetGame();
    });

    // 画像が読み込まれたら準備完了
    if (mapImage.complete) {
        setupCanvas();
    } else {
        mapImage.onload = function() {
            setupCanvas();
        };
    }
}

// 地方別ゲーム開始
function startRegionGame(region) {
    selectedRegion = region;
    regionPrefectures = prefectures.filter(p => p.region === region);

    // 画面切り替え
    regionSelectScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');

    // タイトル設定
    regionTitle.textContent = regions[region].name;

    // キャンバスを確実にセットアップ
    if (!ctx || clickCanvas.width === 0) {
        setupCanvas();
    }

    // ゲーム開始
    resetGame();
    startNewQuestion();
}

// ゲームリセット
function resetGame() {
    correctCount = 0;
    incorrectCount = 0;
    usedPrefectures.clear();
    correctElement.textContent = '0';
    incorrectElement.textContent = '0';
    if (ctx) {
        ctx.clearRect(0, 0, clickCanvas.width, clickCanvas.height);
    }
}

// キャンバスのセットアップ
function setupCanvas() {
    clickCanvas.width = mapImage.width;
    clickCanvas.height = mapImage.height;
    ctx = clickCanvas.getContext('2d');

    // キャンバスのクリックイベント
    clickCanvas.addEventListener('click', handleCanvasClick);
    clickCanvas.addEventListener('touchstart', handleCanvasClick);
}

// キャンバスクリックの処理
function handleCanvasClick(e) {
    e.preventDefault();

    if (!selectedRegion) return; // ゲーム開始前は反応しない

    const rect = clickCanvas.getBoundingClientRect();
    const scaleX = clickCanvas.width / rect.width;
    const scaleY = clickCanvas.height / rect.height;

    let x, y;
    if (e.type === 'touchstart') {
        x = (e.touches[0].clientX - rect.left) * scaleX;
        y = (e.touches[0].clientY - rect.top) * scaleY;
    } else {
        x = (e.clientX - rect.left) * scaleX;
        y = (e.clientY - rect.top) * scaleY;
    }

    console.log('クリック座標:', x, y, 'キャンバスサイズ:', clickCanvas.width, clickCanvas.height);

    // クリックされた都道府県を探す
    const clickedPref = prefectures.find(pref => {
        const coords = pref.coords.split(',').map(Number);
        const isInside = x >= coords[0] && x <= coords[2] && y >= coords[1] && y <= coords[3];
        if (isInside) {
            console.log('ヒット:', pref.name, coords);
        }
        return isInside;
    });

    if (clickedPref) {
        handlePrefectureClick(clickedPref);
    } else {
        console.log('どの都道府県にもヒットしませんでした');
    }
}

// 新しい問題を開始
function startNewQuestion() {
    if (!selectedRegion || regionPrefectures.length === 0) return;

    // その地方の都道府県を使い切ったらリセット
    if (usedPrefectures.size >= regionPrefectures.length) {
        usedPrefectures.clear();
    }

    // まだ使っていない都道府県をランダムに選択
    let availablePrefectures = regionPrefectures.filter(p => !usedPrefectures.has(p.id));

    if (availablePrefectures.length === 0) {
        // 全問正解！
        showCompletionMessage();
        return;
    }

    currentQuestion = availablePrefectures[Math.floor(Math.random() * availablePrefectures.length)];
    usedPrefectures.add(currentQuestion.id);

    // 問題文を更新（ひらがな）
    questionElement.textContent = `「${currentQuestion.name}」はどこですか？`;

    // キャンバスをクリア
    if (ctx) {
        ctx.clearRect(0, 0, clickCanvas.width, clickCanvas.height);
    }
}

// 全問正解時のメッセージ
function showCompletionMessage() {
    popup.classList.remove('hidden');
    popupTitle.textContent = 'おめでとう！';
    popupTitle.className = 'correct-title';
    popupMessage.textContent = `すべてせいかいしました！\nせいかい: ${correctCount}\nまちがい: ${incorrectCount}`;
    nextButton.textContent = 'もどる';
    nextButton.style.display = 'block';

    nextButton.onclick = () => {
        popup.classList.add('hidden');
        gameScreen.classList.add('hidden');
        regionSelectScreen.classList.remove('hidden');
        nextButton.textContent = 'つぎのもんだい';
        nextButton.onclick = () => {
            popup.classList.add('hidden');
            startNewQuestion();
        };
    };
}

// 都道府県がクリックされた時の処理
function handlePrefectureClick(clickedPref) {
    if (!currentQuestion) return;

    // 正解判定
    const isCorrect = clickedPref.id === currentQuestion.id;

    if (isCorrect) {
        // 正解の場合
        correctCount++;
        correctElement.textContent = correctCount;

        // 正解エリアを緑で表示
        highlightArea(clickedPref, '#4caf50');

        showPopup(true, clickedPref.name);
    } else {
        // 不正解の場合 - 正解するまで続ける
        incorrectCount++;
        incorrectElement.textContent = incorrectCount;

        // 不正解エリアを赤で一時表示
        highlightArea(clickedPref, '#f44336');

        // 1秒後に消す（正解するまで続けるため）
        setTimeout(() => {
            ctx.clearRect(0, 0, clickCanvas.width, clickCanvas.height);
        }, 800);

        showPopup(false, clickedPref.name, currentQuestion.name, true);
    }
}

// エリアをハイライト表示
function highlightArea(pref, color) {
    const coords = pref.coords.split(',').map(Number);
    const x = coords[0];
    const y = coords[1];
    const width = coords[2] - coords[0];
    const height = coords[3] - coords[1];

    ctx.fillStyle = color;
    ctx.globalAlpha = 0.4;
    ctx.fillRect(x, y, width, height);
    ctx.globalAlpha = 1.0;

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);
}

// ポップアップを表示
function showPopup(isCorrect, clickedName, correctName = null, continueUntilCorrect = false) {
    if (isCorrect) {
        // 正解の場合のみポップアップを表示
        popup.classList.remove('hidden');
        popupTitle.textContent = 'せいかい！';
        popupTitle.className = 'correct-title';
        popupMessage.textContent = `「${clickedName}」せいかいです！`;
        nextButton.style.display = 'block';
    } else if (continueUntilCorrect) {
        // 不正解の場合は小さい通知のみ（ポップアップは表示しない）
        popup.classList.remove('hidden');
        popupTitle.textContent = 'ざんねん...';
        popupTitle.className = 'incorrect-title';
        popupMessage.textContent = `「${clickedName}」ではありません。もういちどチャレンジ！`;
        nextButton.style.display = 'none';

        // 1秒後に自動的に閉じる
        setTimeout(() => {
            popup.classList.add('hidden');
        }, 1500);
    }
}

// 初期のnextButtonイベント
nextButton.addEventListener('click', () => {
    popup.classList.add('hidden');
    startNewQuestion();
});

// ゲーム開始
init();
