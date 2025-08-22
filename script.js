let userName = localStorage.getItem("userName") || "";
let cards = JSON.parse(localStorage.getItem("cards")) || [];
let keywords = JSON.parse(localStorage.getItem("keywords")) || [];
let updates = JSON.parse(localStorage.getItem("updates")) || [];
let userStampHistory = JSON.parse(localStorage.getItem("userStampHistory")) || [];
let userAddedCards = JSON.parse(localStorage.getItem("userAddedCards")) || [];

function saveAll() {
  localStorage.setItem("userName", userName);
  localStorage.setItem("cards", JSON.stringify(cards));
  localStorage.setItem("keywords", JSON.stringify(keywords));
  localStorage.setItem("updates", JSON.stringify(updates));
  localStorage.setItem("userStampHistory", JSON.stringify(userStampHistory));
  localStorage.setItem("userAddedCards", JSON.stringify(userAddedCards));
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.classList.contains("user")) initUser();
  if (document.body.classList.contains("admin")) initAdmin();
});

// --- ユーザー ---
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

  debugNameBtn.onclick = showNameModal;

  addCardBtn.onclick = () => {
    const pass = addCardPass.value.trim();
    if (!pass) { alert("追加パスを入力してください"); return; }
    const card = cards.find(c => c.addPass === pass);
    if (!card) { alert("パスが間違っています"); return; }
    if (!userAddedCards.includes(card.id)) {
      userAddedCards.push(card.id);
      saveAll();
      renderUserCard(card);
    } else { alert("すでに追加済みです"); }
  };

  function renderUserCard(card) {
    const div = document.createElement("div");
    div.className = "card";
    div.dataset.id = card.id;
    div.innerHTML = `<h3>${card.name}</h3>`;
    for (let i = 0; i < card.slots; i++) {
      const slot = document.createElement("div");
      slot.className = "stamp-slot";
      // スタンプ押されてたら色を付ける
      if (userStampHistory.some(s => s.cardId===card.id && s.slot===i)) slot.classList.add("stamp-filled");
      div.appendChild(slot);
    }
    const serial = document.createElement("div");
    serial.className = "serial";
    serial.textContent = "00001";
    div.appendChild(serial);

    const btn = document.createElement("button");
    btn.textContent = "スタンプを押す";
    btn.onclick = () => {
      const keyword = prompt("合