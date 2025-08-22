// ----- ユーザー情報 -----
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

// ----- 初期化 -----
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("setNameBtn")) initUser();
});

// ----- ユーザー画面初期化 -----
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

  // すでに名前があればモーダル非表示
  if (!userName) {
    nameModal.style.display = "flex";
  } else {
    cardTitle.textContent = `${userName}のスタンプカード`;
  }

  // 名前OKボタン
  setNameBtn.onclick = () => {
    const inputVal = userNameInput.value.trim();
    if (inputVal) {
      userName = inputVal;
      saveAll();
      cardTitle.textContent = `${userName}のスタンプカード`;
      nameModal.style.display = "none";
    } else {
      alert("名前を入力してください");
    }
  };

  // カード追加
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

  // カード表示関数
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
      }
      const serial = document.createElement("div");
      serial.className = "serial";
      serial.textContent = String(i + 1).padStart(5, "0");
      div.appendChild(serial);
      userCards.appendChild(div);
    });
  }

  renderUserCards();

  // 更新履歴表示
  updateLogs.innerHTML = "";
  updates.forEach(u => {
    const div = document.createElement("div");
    div.textContent = u;
    updateLogs.appendChild(div);
  });
}