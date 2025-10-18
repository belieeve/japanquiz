// ゲームの状態管理
let currentQuestion = null;
let correctCount = 0;
let incorrectCount = 0;
let usedPrefectures = new Set();

// DOM要素
const mapSvg = document.getElementById('japan-map');
const questionElement = document.getElementById('question');
const correctElement = document.getElementById('correct');
const incorrectElement = document.getElementById('incorrect');
const popup = document.getElementById('popup');
const popupTitle = document.getElementById('popup-title');
const popupMessage = document.getElementById('popup-message');
const nextButton = document.getElementById('next-button');

// 初期化
function init() {
    createMap();
    startNewQuestion();
}

// SVG地図を作成
function createMap() {
    prefectures.forEach(pref => {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pref.path);
        path.setAttribute('class', 'prefecture');
        path.setAttribute('data-id', pref.id);
        path.setAttribute('data-name', pref.name);

        // クリックイベント
        path.addEventListener('click', () => handlePrefectureClick(pref));

        mapSvg.appendChild(path);
    });
}

// 新しい問題を開始
function startNewQuestion() {
    // すべての都道府県を使い切ったらリセット
    if (usedPrefectures.size >= prefectures.length) {
        usedPrefectures.clear();
    }

    // まだ使っていない都道府県をランダムに選択
    let availablePrefectures = prefectures.filter(p => !usedPrefectures.has(p.id));
    currentQuestion = availablePrefectures[Math.floor(Math.random() * availablePrefectures.length)];
    usedPrefectures.add(currentQuestion.id);

    // 問題文を更新
    questionElement.textContent = `${currentQuestion.name}はどこですか？`;

    // すべての都道府県をリセット
    document.querySelectorAll('.prefecture').forEach(path => {
        path.classList.remove('correct', 'incorrect');
    });
}

// 都道府県がクリックされた時の処理
function handlePrefectureClick(clickedPref) {
    if (!currentQuestion) return;

    const clickedPath = document.querySelector(`[data-id="${clickedPref.id}"]`);
    const correctPath = document.querySelector(`[data-id="${currentQuestion.id}"]`);

    // 正解判定
    const isCorrect = clickedPref.id === currentQuestion.id;

    if (isCorrect) {
        // 正解の場合
        correctCount++;
        correctElement.textContent = correctCount;

        clickedPath.classList.add('correct');

        showPopup(true, clickedPref.name);
    } else {
        // 不正解の場合
        incorrectCount++;
        incorrectElement.textContent = incorrectCount;

        clickedPath.classList.add('incorrect');
        correctPath.classList.add('correct');

        showPopup(false, clickedPref.name, currentQuestion.name);
    }
}

// ポップアップを表示
function showPopup(isCorrect, clickedName, correctName = null) {
    popup.classList.remove('hidden');

    if (isCorrect) {
        popupTitle.textContent = '正解！';
        popupTitle.className = 'correct-title';
        popupMessage.textContent = `${clickedName}、正解です！`;
    } else {
        popupTitle.textContent = '不正解...';
        popupTitle.className = 'incorrect-title';
        popupMessage.textContent = `${clickedName}ではありません。正解は${correctName}でした。`;
    }
}

// ポップアップを閉じて次の問題へ
nextButton.addEventListener('click', () => {
    popup.classList.add('hidden');
    startNewQuestion();
});

// ゲーム開始
init();
