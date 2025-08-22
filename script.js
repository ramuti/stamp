// ----------------------
// データ管理用
// ----------------------
let userName = localStorage.getItem("userName") || "";
let stampCards = JSON.parse(localStorage.getItem("stampCards")) || [];
let keywords = JSON.parse(localStorage.getItem("keywords")) || [];

// ----------------------
// DOM取得
// ----------------------
const userNameDialog = document.getElementById("userNameDialog");
const userNameInput = document.getElementById("userNameInput");
const setNameBtn = document.getElementById("setNameBtn");
const userTitle = document.getElementById("userTitle");

const createCardBtn = document.getElementById("createCardBtn");
const cardList = document.getElementById("cardList");

// ----------------------
// 初期表示処理
// ----------------------
window.onload = function () {
  // 名前が未設定なら入力ダイアログを表示
  if (!userName) {
    userNameDialog.style.display = "block";
  } else {
    userTitle.textContent = `${userName}のスタンプカード`;
  }
  renderCards();
};

// ----------------------
// 名前設定
// ----------------------
setNameBtn.addEventListener("click", () => {
  const name = userNameInput.value.trim();
  if (name) {
    userName = name;
    localStorage.setItem("userName", userName);
    userTitle.textContent = `${userName}のスタンプカード`;
    userNameDialog.style.display = "none"; // OKで閉じる
  } else {
    alert("名前を入力してください");
  }
});

// ----------------------
// カード作成
// ----------------------
createCardBtn.addEventListener("click", () => {
  const newCard = {
    id: Date.now(),
    stamps: []
  };
  stampCards.push(newCard);
  localStorage.setItem("stampCards", JSON.stringify(stampCards));
  renderCards();
});

// ----------------------
// カード描画
// ----------------------
function renderCards() {
  cardList.innerHTML = "";
  stampCards.forEach((card) => {
    const cardDiv = document.createElement("div");
    cardDiv.className = "stamp-card";

    // スタンプを表示
    for (let i = 0; i < 10; i++) {
      const stamp = document.createElement("span");
      stamp.className = "stamp";
      if (card.stamps.includes(i)) {
        stamp.textContent = "★"; // 押されたスタンプ
      } else {
        stamp.textContent = "☆"; // 空のスタンプ
      }
      cardDiv.appendChild(stamp);
    }

    // 削除ボタン
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "削除";
    deleteBtn.onclick = () => {
      deleteCard(card.id);
    };
    cardDiv.appendChild(deleteBtn);

    cardList.appendChild(cardDiv);
  });
}

// ----------------------
// カード削除
// ----------------------
function deleteCard(id) {
  stampCards = stampCards.filter((c) => c.id !== id);
  localStorage.setItem("stampCards", JSON.stringify(stampCards));

  // 合言葉管理からも削除
  keywords = keywords.filter((k) => k.cardId !== id);
  localStorage.setItem("keywords", JSON.stringify(keywords));

  renderCards();
}