// --- データ ---
let userName = localStorage.getItem("userName") || "";
let cards = JSON.parse(localStorage.getItem("cards")) || [];
let keywords = JSON.parse(localStorage.getItem("keywords")) || [];
let updates = JSON.parse(localStorage.getItem("updates")) || [];
let userStampHistory = JSON.parse(localStorage.getItem("userStampHistory")) || [];

// --- 保存 ---
function saveAll() {
  localStorage.setItem("userName", userName);
  localStorage.setItem("cards", JSON.stringify(cards));
  localStorage.setItem("keywords", JSON.stringify(keywords));
  localStorage.setItem("updates", JSON.stringify(updates));
  localStorage.setItem("userStampHistory", JSON.stringify(userStampHistory));
}

// --- 初期化 ---
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("setNameBtn")) initUser();
  if (document.getElementById("createCardBtn")) initAdmin();
});

// --- ユーザー画面 ---
function initUser() {
  const nameModal = document.getElementById("nameModal");
  const setNameBtn = document.getElementById("setNameBtn");
  const userNameInput = document.getElementById("userNameInput");
  const cardTitle = document.getElementById("cardTitle");
  const addCardBtn = document.getElementById("addCardBtn");
  const addCardPass = document.getElementById("addCardPass");
  const userCards = document.getElementById("userCards");
  const historyList = document.getElementById("stampHistory");
  const updateLogs = document.getElementById("updateLogs");
  const debugNameBtn = document.getElementById("debugNameBtn");

  function showNameModal() {
    userNameInput.value = userName;
    nameModal.style.display = "flex";
  }

  if (!userName) showNameModal();
  else cardTitle.textContent = `${userName}のスタンプカード`;

  setNameBtn.onclick = () => {
    if (userNameInput.value.trim()) {
      userName = userNameInput.value.trim();
      saveAll();
      cardTitle.textContent = `${userName}のスタンプカード`;
      nameModal.style.display = "none";
    }
  };

  if (debugNameBtn) debugNameBtn.onclick = showNameModal;

  addCardBtn.onclick = () => {
    const pass = addCardPass.value.trim();
    if (!pass) { alert("追加パスを入力してください"); return; }

    const card = cards.find(c => c.addPass === pass);
    if (!card) { alert("パスが間違っています"); return; }

    // すでに追加済みかチェック
    if (!userCards.querySelector(`[data-id='${card.id}']`)) {
      renderUserCards();
    } else {
      alert("すでに追加済みです");
    }
  };

  function renderUserCards() {
    userCards.innerHTML = "";
    cards.forEach((c, i) => {
      // ユーザーが追加パスを入力して追加したカードのみ表示
      if (!userCards.querySelector(`[data-id='${c.id}']`)) return;

      const div = document.createElement("div");
      div.className = "card";
      div.dataset.id = c.id;
      div.innerHTML = `<h3>${c.name}</h3>`;
      for (let j = 0; j < c.slots; j++) {
        const slot = document.createElement("div");
        slot.className = "stamp-slot