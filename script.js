// ========== 共通データ ==========
let userName = localStorage.getItem("userName") || "";
let stampCards = JSON.parse(localStorage.getItem("stampCards")) || [];
let keywords = JSON.parse(localStorage.getItem("keywords")) || [];

// ========== ユーザー画面 ==========
window.addEventListener("DOMContentLoaded", () => {
  const nameModal = document.getElementById("nameModal");
  const setNameBtn = document.getElementById("setNameBtn");
  const userNameInput = document.getElementById("userNameInput");
  const cardTitle = document.getElementById("cardTitle");
  const createCardBtn = document.getElementById("createCardBtn");
  const stampCardsDiv = document.getElementById("stampCards");

  // 名前入力
  if (nameModal && !userName) {
    nameModal.style.display = "flex";
  }

  if (setNameBtn) {
    setNameBtn.addEventListener("click", () => {
      const name = userNameInput.value.trim();
      if (name) {
        userName = name;
        localStorage.setItem("userName", userName);
        cardTitle.textContent = `${userName}のスタンプカード`;
        nameModal.style.display = "none";
      }
    });
  }

  if (cardTitle && userName) {
    cardTitle.textContent = `${userName}のスタンプカード`;
  }

  // カード作成
  if (createCardBtn) {
    createCardBtn.addEventListener("click", () => {
      const newCard = { id: Date.now(), stamps: 0 };
      stampCards.push(newCard);
      localStorage.setItem("stampCards", JSON.stringify(stampCards));
      renderCards();
    });
  }

  function renderCards() {
    if (!stampCardsDiv) return;
    stampCardsDiv.innerHTML = "";
    stampCards.forEach(card => {
      const cardDiv = document.createElement("div");
      cardDiv.className = "card";
      cardDiv.textContent = `カードID: ${card.id} / スタンプ数: ${card.stamps}`;
      stampCardsDiv.appendChild(cardDiv);
    });
  }

  renderCards();
});

// ========== 管理者画面 ==========
window.addEventListener("DOMContentLoaded", () => {
  const keywordInput = document.getElementById("keywordInput");
  const addKeywordBtn = document.getElementById("addKeywordBtn");
  const keywordList = document.getElementById("keywordList");
  const adminStampCards = document.getElementById("adminStampCards");

  if (addKeywordBtn) {
    addKeywordBtn.addEventListener("click", () => {
      const keyword = keywordInput.value.trim();
      if (keyword) {
        keywords.push(keyword);
        localStorage.setItem("keywords", JSON.stringify(keywords));
        keywordInput.value = "";
        renderKeywords();
      }
    });
  }

  function renderKeywords() {
    if (!keywordList) return;
    keywordList.innerHTML = "";
    keywords.forEach((kw, index) => {
      const li = document.createElement("li");
      li.textContent = kw;
      const delBtn = document.createElement("button");
      delBtn.textContent = "削除";
      delBtn.onclick = () => {
        keywords.splice(index, 1);
        localStorage.setItem("keywords", JSON.stringify(keywords));
        renderKeywords();
      };
      li.appendChild(delBtn);
      keywordList.appendChild(li);
    });
  }

  function renderAdminCards() {
    if (!adminStampCards) return;
    adminStampCards.innerHTML = "";
    stampCards.forEach((card, index) => {
      const li = document.createElement("li");
      li.textContent = `カードID: ${card.id} / スタンプ数: ${card.stamps}`;
      const delBtn = document.createElement("button");
      delBtn.textContent = "削除";
      delBtn.onclick = () => {
        stampCards.splice(index, 1);
        localStorage.setItem("stampCards", JSON.stringify(stampCards));
        renderAdminCards();
      };
      li.appendChild(delBtn);
      adminStampCards.appendChild(li);
    });
  }

  renderKeywords();
  renderAdminCards();
});