let userName = localStorage.getItem("userName") || "";
let cards = JSON.parse(localStorage.getItem("cards")) || [];
let keywords = JSON.parse(localStorage.getItem("keywords")) || [];
let updates = JSON.parse(localStorage.getItem("updates")) || [];

function saveAll() {
  localStorage.setItem("userName", userName);
  localStorage.setItem("cards", JSON.stringify(cards));
  localStorage.setItem("keywords", JSON.stringify(keywords));
  localStorage.setItem("updates", JSON.stringify(updates));
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("setNameBtn")) initUser();
  if (document.getElementById("createCardBtn")) initAdmin();
});

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

  if (!userName) {
    nameModal.style.display = "flex";
  } else {
    cardTitle.textContent = `${userName}のスタンプカード`;
  }

  setNameBtn.onclick = () => {
    if (userNameInput.value.trim()) {
      userName = userNameInput.value.trim();
      saveAll();
      cardTitle.textContent = `${userName}のスタンプカード`;
      nameModal.style.display = "none";
    }
  };

  addCardBtn.onclick = () => {
    const pass = addCardPass.value.trim();
    const card = cards.find(c => c.addPass === pass);
    if (card) {
      alert("カードを追加しました！");
      renderUserCards();
    } else {
      alert("パスが間違っています");
    }
  };

  function renderUserCards() {
    userCards.innerHTML = "";
    cards.forEach((c, i) => {
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `<h3>${c.name}</h3>`;
      for (let j = 0; j < c.slots; j++) {
        const slot = document.createElement("div");
        slot.className = "stamp-slot";
        div.appendChild(slot);
        if ((c.stamps || []).includes(j)) {
          slot.style.background = `url(${c