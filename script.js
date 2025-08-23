/* ============================
   script.js — ユーザー＋管理者 共通
   ============================ */

const LS_KEYS = {
  appVersion: "appVersion",
  userName: "userName",
  cards: "cards",
  keywords: "keywords",
  updates: "updates",
  userAddedCards: "userAddedCards",
  userStampHistory: "userStampHistory",
  userStyles: "userStyles"
};

const APP_VERSION = "v1.0.0";

function loadJSON(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch(e){ return fallback; }
}
function saveJSON(key, obj) { localStorage.setItem(key, JSON.stringify(obj)); }

let userName = localStorage.getItem(LS_KEYS.userName) || "";
let cards = loadJSON(LS_KEYS.cards, []);
let keywords = loadJSON(LS_KEYS.keywords, []);
let updates = loadJSON(LS_KEYS.updates, []);
let userAddedCards = loadJSON(LS_KEYS.userAddedCards, []);
let userStampHistory = loadJSON(LS_KEYS.userStampHistory, []);
let userStyles = loadJSON(LS_KEYS.userStyles, {
  bgColor: "#fff0f5",
  textColor: "#ff69b4",
  buttonColor: "#ff99cc"
});

function saveAll() {
  try {
    localStorage.setItem(LS_KEYS.userName, userName);
    saveJSON(LS_KEYS.cards, cards);
    saveJSON(LS_KEYS.keywords, keywords);
    saveJSON(LS_KEYS.updates, updates);
    saveJSON(LS_KEYS.userAddedCards, userAddedCards);
    saveJSON(LS_KEYS.userStampHistory, userStampHistory);
    saveJSON(LS_KEYS.userStyles, userStyles);
    localStorage.setItem(LS_KEYS.appVersion, APP_VERSION);
  } catch (e) { console.error(e); }
}

document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  if (body.classList.contains("user")) initUser();
  if (body.classList.contains("admin")) initAdmin();
});

/* ============================
   ユーザー側
   ============================ */
function initUser() {
  const setNameBtn = document.getElementById("setNameBtn");
  const userNameInput = document.getElementById("userNameInput");
  const cardTitle = document.getElementById("cardTitle");
  const addCardBtn = document.getElementById("addCardBtn");
  const addCardPass = document.getElementById("addCardPass");
  const userCards = document.getElementById("userCards");
  const historyList = document.getElementById("stampHistory");
  const updateLogs = document.getElementById("updateLogs");

  cardTitle.textContent = userName ? `${userName}のスタンプカード` : "スタンプカード";
  userNameInput.value = userName;

  setNameBtn.addEventListener("click", () => {
    const v = userNameInput.value.trim();
    if (!v) { alert("名前を入力してください"); return; }
    userName = v;
    saveAll();
    cardTitle.textContent = `${userName}のスタンプカード`;
  });

  addCardBtn.addEventListener("click", () => {
    const pass = addCardPass.value.trim();
    if (!pass) { alert("追加パスを入力してください"); return; }
    const card = cards.find(c => c.addPass === pass);
    if (!card) { alert("パスが間違っています"); return; }
    if (!userAddedCards.includes(card.id)) {
      userAddedCards.push(card.id);
      saveAll();
      addCardPass.value = "";
      renderUserCards();
      updateHistory();
    } else { alert("すでに追加済みです"); }
  });

  function renderUserCard(card) {
    const container = document.createElement("div");
    container.className = "card";
    container.dataset.id = card.id;
    container.style.background = card.bg || userStyles.bgColor;

    const title = document.createElement("h3");
    title.textContent = card.name;
    container.appendChild(title);

    const grid = document.createElement("div");
    grid.style.marginBottom = "8px";
    for (let i = 0; i < card.slots; i++) {
      const slot = document.createElement("div");
      slot.className = "stamp-slot";
      if (userStampHistory.some(s => s.cardId === card.id && s.slot === i)) slot.classList.add("stamp-filled");
      grid.appendChild(slot);
    }
    container.appendChild(grid);

    const serial = document.createElement("div");
    serial.className = "serial";
    serial.textContent = genSerialForUser();
    container.appendChild(serial);

    const btn = document.createElement("button");
    btn.textContent = "スタンプを押す";
    btn.style.marginTop = "8px";
    btn.style.background = userStyles.buttonColor;
    btn.style.color = "#fff";
    btn.addEventListener("click", () => {
      const kw = prompt("スタンプ合言葉を入力してください");
      if (!kw) return;
      const word = kw.trim();
      if (!word) { alert("合言葉を入力してください"); return; }
      const keywordObj = keywords.find(k => String(k.cardId) === String(card.id) && k.word === word && k.active);
      if (!keywordObj) { alert("合言葉が違うか無効です"); return; }
      if (userStampHistory.some(s => s.cardId === card.id && s.keyword === word)) { alert("もう押してあります"); return; }
      let nextSlot = 0;
      while (userStampHistory.some(s => s.cardId === card.id && s.slot === nextSlot)) nextSlot++;
      if (nextSlot >= card.slots) { alert(card.maxNotifyMsg || "スタンプがMAXです"); return; }
      userStampHistory.push({ cardId: card.id, slot: nextSlot, keyword: word, date: new Date().toLocaleString() });
      saveAll();
      renderUserCards();
      updateHistory();
      alert(card.notifyMsg || "スタンプを押しました！");
    });
    container.appendChild(btn);

    const delBtn = document.createElement("button");
    delBtn.textContent = "カードを削除";
    delBtn.style.background = "#999";
    delBtn.style.marginLeft = "8px";
    delBtn.addEventListener("click", () => {
      if (!confirm("このカードを自分の端末から削除しますか？（履歴も消えます）")) return;
      userAddedCards = userAddedCards.filter(id => id !== card.id);
      userStampHistory = userStampHistory.filter(h => h.cardId !== card.id); // カード削除で履歴も消す
      saveAll();
      renderUserCards();
      updateHistory();
    });
    container.appendChild(delBtn);

    return container;
  }

  function renderUserCards() {
    userCards.innerHTML = "";
    userAddedCards.forEach(id => {
      const card = cards.find(c => c.id === id);
      if (!card) return;
      const el = renderUserCard(card);
      userCards.appendChild(el);
    });
    applyUserStyles();
  }

  function updateHistory() {
    historyList.innerHTML = "";
    userStampHistory.forEach(h => {
      const c = cards.find(c => c.id === h.cardId);
      if(!c) return; // カードが削除された場合、履歴残さない
      const li = document.createElement("li");
      li.textContent = `${c.name} - スロット${h.slot + 1} (${h.keyword}) ${h.date}`;
      historyList.appendChild(li);
    });
  }

  function genSerialForUser() { return Math.floor(Math.random() * 9999999999999); }

  renderUserCards();
  updateHistory();

  /* ============================
     ユーザ見た目設定（カラーパレット対応）
     ============================ */
  const bgColorPicker = document.getElementById("bgColorPicker");
  const textColorPicker = document.getElementById("textColorPicker");
  const buttonColorPicker = document.getElementById("buttonColorPicker");

  function applyUserStyles() {
    document.body.style.background = userStyles.bgColor;
    document.body.style.color = userStyles.textColor;
    document.querySelectorAll("button").forEach(b => {
      if (b.textContent === "カードを削除" || b.textContent === "削除") return;
      b.style.background = userStyles.buttonColor;
    });
    document.querySelectorAll(".card").forEach(c => {
      c.style.background = userStyles.bgColor;
    });
  }

  bgColorPicker.value = userStyles.bgColor;
  textColorPicker.value = userStyles.textColor;
  buttonColorPicker.value = userStyles.buttonColor;

  bgColorPicker.addEventListener("input", () => { userStyles.bgColor = bgColorPicker.value; saveAll(); applyUserStyles(); });
  textColorPicker.addEventListener("input", () => { userStyles.textColor = textColorPicker.value; saveAll(); applyUserStyles(); });
  buttonColorPicker.addEventListener("input", () => { userStyles.buttonColor = buttonColorPicker.value; saveAll(); applyUserStyles(); });
}