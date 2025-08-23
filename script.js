/* ========== 共通データ定義 ========== */
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

/* ========== DOM読み込み後 ========== */
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
    renderHistory();
  });

  function renderUserCards() {
    userCards.innerHTML = "";
    if (!userAddedCards.length) return;
    userAddedCards.forEach((uc) => {
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

    document.querySelectorAll(".previewBtn").forEach(btn => {
      btn.addEventListener("click", () => {
        const pass = btn.dataset.pass;
        const card = cards.find(c => c.addPass === pass);
        if (!card) return;
        alert(`カード名: ${card.name}\n枠数: ${card.slots}\n背景: ${card.bg || "なし"}`);
      });
    });

    document.querySelectorAll(".deleteBtn").forEach(btn => {
      btn.addEventListener("click", () => {
        const pass = btn.dataset.pass;
        userAddedCards = userAddedCards.filter(c => c.addPass !== pass);
        saveAll();
        renderUserCards();
        renderHistory();
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
  const cardName = document.getElementById("cardName");
  const cardSlots = document.getElementById("cardSlots");
  const addPass = document.getElementById("addPass");
  const notifyMsg = document.getElementById("notifyMsg");
  const maxNotifyMsg = document.getElementById("maxNotifyMsg");
  const cardBG = document.getElementById("cardBG");
  const stampIcon = document.getElementById("stampIcon");

  const previewBtn = document.getElementById("previewCardBtn");
  const previewClearBtn = document.getElementById("previewClearBtn");
  const createBtn = document.getElementById("createCardBtn");

  const adminCards = document.getElementById("adminCards");
  const keywordCardSelect = document.getElementById("keywordCardSelect");
  const keywordInput = document.getElementById("keywordInput");
  const addKeywordBtn = document.getElementById("addKeywordBtn");
  const keywordList = document.getElementById("keywordList");

  const updateInput = document.getElementById("updateInput");
  const addUpdateBtn = document.getElementById("addUpdateBtn");
  const adminUpdateLogs = document.getElementById("adminUpdateLogs");

  const previewArea = document.getElementById("previewArea");

  function renderAdminCards() {
    adminCards.innerHTML = "";
    keywordCardSelect.innerHTML = "";
    cards.forEach(c => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span class="info">${c.name} / ${c.addPass}</span>
        <div class="btns">
          <button class="previewBtn" data-pass="${c.addPass}">プレビュー</button>
          <button class="deleteBtn" data-pass="${c.addPass}">消去</button>
        </div>
      `;
      adminCards.appendChild(li);

      const option = document.createElement("option");
      option.value = c.addPass;
      option.textContent = c.name;
      keywordCardSelect.appendChild(option);
    });

    document.querySelectorAll(".previewBtn").forEach(btn => {
      btn.addEventListener("click", () => {
        const card = cards.find(c => c.addPass === btn.dataset.pass);
        if (!card) return;
        previewArea.innerHTML = `<div class="card" style="background:${card.bg || '#fff0f5'}">
          <strong>${card.name}</strong><br>
          枠数: ${card.slots}
        </div>`;
      });
    });

    document.querySelectorAll(".deleteBtn").forEach(btn => {
      btn.addEventListener("click", () => {
        cards = cards.filter(c => c.addPass !== btn.dataset.pass);
        saveJSON(LS_KEYS.cards, cards);
        renderAdminCards();
      });
    });
  }

  previewBtn.addEventListener("click", () => {
    previewArea.innerHTML = `<div class="card" style="background:${cardBG.value}">
      <strong>${cardName.value}</strong><br>
      枠数: ${cardSlots.value}
    </div>`;
  });

  previewClearBtn.addEventListener("click", () => previewArea.innerHTML = "");

  createBtn.addEventListener("click", () => {
    if (!cardName.value || !addPass.value || !cardSlots.value) { alert("名前・パス・枠数は必須"); return; }
    cards.push({
      name: cardName.value,
      addPass: addPass.value,
      slots: Number(cardSlots.value),
      notifyMsg: notifyMsg.value,
      maxNotifyMsg: maxNotifyMsg.value,
      bg: cardBG.value,
      stampIcon: stampIcon.value
    });
    saveJSON(LS_KEYS.cards, cards);
    renderAdminCards();
  });

  addKeywordBtn.addEventListener("click", () => {
    if (!keywordInput.value || !keywordCardSelect.value) return;
    keywords.push({ pass: keywordCardSelect.value, keyword: keywordInput.value });
    saveJSON(LS_KEYS.keywords, keywords);
    renderKeywords();
  });

  function renderKeywords() {
    keywordList.innerHTML = "";
    keywords.forEach(k => {
      const li = document.createElement("li");
      li.textContent = `カード: ${cards.find(c=>c.addPass===k.pass)?.name || k.pass} / キーワード: ${k.keyword}`;
      keywordList.appendChild(li);
    });
  }

  addUpdateBtn.addEventListener("click", () => {
    if (!updateInput.value) return;
    updates.push(updateInput.value);
    saveJSON(LS_KEYS.updates, updates);
    renderUpdates();
  });

  function renderUpdates() {
    adminUpdateLogs.innerHTML = "";
    updates.forEach(u => {
      const div = document.createElement("div");
      div.textContent = u;
      adminUpdateLogs.appendChild(div);
    });
  }

  renderAdminCards();
  renderKeywords();
  renderUpdates();
}