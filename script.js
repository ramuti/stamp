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
  userStampHistory: "userStampHistory"
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

function saveAll() {
  try {
    localStorage.setItem(LS_KEYS.userName, userName);
    saveJSON(LS_KEYS.cards, cards);
    saveJSON(LS_KEYS.keywords, keywords);
    saveJSON(LS_KEYS.updates, updates);
    saveJSON(LS_KEYS.userAddedCards, userAddedCards);
    saveJSON(LS_KEYS.userStampHistory, userStampHistory);
    localStorage.setItem(LS_KEYS.appVersion, APP_VERSION);
  } catch (e) { alert("データ保存に失敗しました。"); console.error(e); }
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

  const bgPicker = document.getElementById("bgColorPicker");
  const textPicker = document.getElementById("textColorPicker");
  const btnPicker = document.getElementById("buttonColorPicker");

  cardTitle.textContent = userName ? `${userName}のスタンプカード` : "スタンプカード";
  userNameInput.value = userName;

  function applyColors() {
    document.body.style.backgroundColor = bgPicker.value;
    document.body.style.color = textPicker.value;
    document.querySelectorAll("button").forEach(b => b.style.backgroundColor = btnPicker.value);
  }

  bgPicker.addEventListener("input", applyColors);
  textPicker.addEventListener("input", applyColors);
  btnPicker.addEventListener("input", applyColors);

  applyColors();

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
    if (userAddedCards.some(c => c.addPass === pass)) { alert("既に追加済みです"); return; }
    userAddedCards.push({ addPass: pass });
    saveAll();
    renderUserCards();
  });

  function renderUserCards() {
    userCards.innerHTML = "";
    if (!userAddedCards.length) return; // スタンプカードがない場合は履歴も描画しない

    userAddedCards.forEach((uc, idx) => {
      const card = cards.find(c => c.addPass === uc.addPass);
      if (!card) return;
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <div>
          <strong>${card.name}</strong>
          <span style="margin-left: 12px;">追加パス: ${uc.addPass}</span>
        </div>
        <div>
          <button data-pass="${uc.addPass}" class="previewBtn">プレビュー表示</button>
          <button data-pass="${uc.addPass}" class="deleteBtn">消去</button>
        </div>
      `;
      userCards.appendChild(div);
    });

    // プレビュー表示
    document.querySelectorAll(".previewBtn").forEach(btn => {
      btn.addEventListener("click", () => {
        const pass = btn.dataset.pass;
        const card = cards.find(c => c.addPass === pass);
        if (!card) return;
        alert(`カード名: ${card.name}\n枠数: ${card.slots}\n背景: ${card.bg || "なし"}`);
      });
    });

    // 削除
    document.querySelectorAll(".deleteBtn").forEach(btn => {
      btn.addEventListener("click", () => {
        const pass = btn.dataset.pass;
        userAddedCards = userAddedCards.filter(c => c.addPass !== pass);
        saveAll();
        renderUserCards();
      });
    });
  }

  function renderHistory() {
    historyList.innerHTML = "";
    if (!userAddedCards.length) return;
    userAddedCards.forEach(c => {
      const card = cards.find(cc => cc.addPass === c.addPass);
      if (!card) return;
      const history = userStampHistory.filter(s => s.addPass === c.addPass);
      history.forEach(s => {
        const li = document.createElement("li");
        li.textContent = `${card.name} - スタンプ枠: ${s.slot + 1}`;
        historyList.appendChild(li);
      });
    });
  }

  function renderUpdates() {
    updateLogs.innerHTML = "";
    updates.forEach(u => {
      const div = document.createElement("div");
      div.textContent = u;
      updateLogs.appendChild(div);
    });
  }

  renderUserCards();
  renderHistory();
  renderUpdates();
}

/* ============================
   管理者側
   ============================ */
function initAdmin() {
  const cardNameInput = document.getElementById("cardName");
  const cardSlotsInput = document.getElementById("cardSlots");
  const addPassInput = document.getElementById("addPass");
  const notifyMsgInput = document.getElementById("notifyMsg");
  const maxNotifyMsgInput = document.getElementById("maxNotifyMsg");
  const cardBGInput = document.getElementById("cardBG");
  const stampIconInput = document.getElementById("stampIcon");
  const createCardBtn = document.getElementById("createCardBtn");
  const adminCardsList = document.getElementById("adminCards");
  const previewArea = document.getElementById("previewArea");

  const updateInput = document.getElementById("updateInput");
  const addUpdateBtn = document.getElementById("addUpdateBtn");
  const adminUpdateLogs = document.getElementById("adminUpdateLogs");

  function renderAdminCards() {
    adminCardsList.innerHTML = "";
    cards.forEach(c => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span>${c.name} (#${c.addPass})</span>
        <button data-pass="${c.addPass}" class="deleteCardBtn">消去</button>
      `;
      adminCardsList.appendChild(li);
    });

    document.querySelectorAll(".deleteCardBtn").forEach(btn => {
      btn.addEventListener("click", () => {
        const pass = btn.dataset.pass;
        cards = cards.filter(c => c.addPass !== pass);
        saveAll();
        renderAdminCards();
      });
    });
  }

  createCardBtn.addEventListener("click", () => {
    const name = cardNameInput.value.trim();
    const slots = parseInt(cardSlotsInput.value) || 5;
    const addPass = addPassInput.value.trim();
    if (!name || !addPass) { alert("カード名と追加パスは必須"); return; }
    if (cards.some(c => c.addPass === addPass)) { alert("追加パスが重複しています"); return; }

    const card = {
      name,
      slots,
      addPass,
      notifyMsg: notifyMsgInput.value,
      maxNotifyMsg: maxNotifyMsgInput.value,
      bg: cardBGInput.value,
      icon: stampIconInput.value
    };
    cards.push(card);
    saveAll();
    renderAdminCards();
    previewArea.innerHTML = `
      <div class="card" style="background:${card.bg || "#fff0f5"};">
        <strong>${card.name}</strong> 枠数: ${card.slots}
      </div>
    `;
  });

  addUpdateBtn.addEventListener("click", () => {
    const val = updateInput.value.trim();
    if (!val) return;
    updates.push(val);
    saveAll();
    renderAdminUpdates();
    updateInput.value = "";
  });

  function renderAdminUpdates() {
    adminUpdateLogs.innerHTML = "";
    updates.forEach(u => {
      const div = document.createElement("div");
      div.textContent = u;
      adminUpdateLogs.appendChild(div);
    });
  }

  renderAdminCards();
  renderAdminUpdates();
}