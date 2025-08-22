// ====== v8 修正版 ======

// LocalStorageのキー
const STORAGE_KEY = "userCards";

// ロード処理（ユーザー側の永続化されたカードを取得）
function loadUserCards() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
}

// セーブ処理（ユーザー側のカードを永続化）
function saveUserCards(cards) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

// カードを描画する処理（管理者のカード + ユーザーのカード）
function renderCards(adminCards, userCards) {
  const container = document.getElementById("cardContainer");
  container.innerHTML = "";

  // 管理者のカードを表示（ただしユーザーに追加されるのは「パス入力時のみ」）
  adminCards.forEach(card => {
    const cardDiv = document.createElement("div");
    cardDiv.className = "card admin";
    cardDiv.innerHTML = `<h3>${card.title}</h3><p>${card.description}</p>`;
    container.appendChild(cardDiv);
  });

  // ユーザーのカードを表示（永続化されたもののみ）
  userCards.forEach(card => {
    const cardDiv = document.createElement("div");
    cardDiv.className = "card user";
    cardDiv.innerHTML = `<h3>${card.title}</h3><p>${card.description}</p>`;
    container.appendChild(cardDiv);
  });
}

// 初期化処理
function init(adminCards) {
  const userCards = loadUserCards();
  renderCards(adminCards, userCards);
}

// カードを追加する処理（追加パスでのみ呼ばれる）
function addUserCard(newCard) {
  const userCards = loadUserCards();
  userCards.push(newCard);
  saveUserCards(userCards);

  // 最新状態を描画
  renderCards(currentAdminCards, userCards);
}

// === 使用例 ===
// 管理者カード（例）
let currentAdminCards = [
  { title: "管理カード1", description: "説明1" },
  { title: "管理カード2", description: "説明2" }
];

// 初期化（リロード時）
window.onload = () => {
  init(currentAdminCards);
};

// パスを入力して追加する例
document.getElementById("addPassBtn").addEventListener("click", () => {
  const inputPass = document.getElementById("passInput").value;

  // パスが一致した場合にだけユーザーに追加
  if (inputPass === "abc123") {
    addUserCard({ title: "a", description: "これはaのカード" });
  } else if (inputPass === "xyz789") {
    addUserCard({ title: "b", description: "これはbのカード" });
  }
});