/* ============================
   script.js — ユーザー＋管理者 共通（フル）
   ============================ */

const LS_KEYS = {
  appVersion: "appVersion",
  userName: "userName",
  cards: "cards",
  keywords: "keywords",
  updates: "updates",
  userAddedCards: "userAddedCards",
  userStampHistory: "userStampHistory",
  userUIColors: "userUIColors"
};

const APP_VERSION = "v1.1.2"; // 修正版

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
let userUIColors = loadJSON(LS_KEYS.userUIColors, {text:"#c44a7b",bg:"#fff0f5",btn:"#ff99cc"});

function saveAll() {
  try {
    localStorage.setItem(LS_KEYS.userName, userName);
    saveJSON(LS_KEYS.cards, cards);
    saveJSON(LS_KEYS.keywords, keywords);
    saveJSON(LS_KEYS.updates, updates);
    saveJSON(LS_KEYS.userAddedCards, userAddedCards);
    saveJSON(LS_KEYS.userStampHistory, userStampHistory);
    saveJSON(LS_KEYS.userUIColors, userUIColors);
    localStorage.setItem(LS_KEYS.appVersion, APP_VERSION);
  } catch (e) { alert("データ保存に失敗"); console.error(e); }
}

document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  if (body.classList.contains("user")) initUser();
  if (body.classList.contains("admin")) initAdmin();
});

/* =========================
   ユーザー画面
   ========================= */
function initUser() {
  const setNameBtn   = document.getElementById("setNameBtn");
  const userNameInput= document.getElementById("userNameInput");
  const cardTitle    = document.getElementById("cardTitle");
  const addCardBtn   = document.getElementById("addCardBtn");
  const addCardPass  = document.getElementById("addCardPass");
  const userCards    = document.getElementById("userCards");
  const historyList  = document.getElementById("stampHistory");
  const updateLogs   = document.getElementById("updateLogs");

  const textColorPicker = document.getElementById("textColor");
  const bgColorPicker = document.getElementById("bgColor");
  const btnColorPicker = document.getElementById("btnColor");

  cardTitle.textContent = userName ? `${userName}のスタンプカード` : "スタンプカード";
  userNameInput.value = userName;

  textColorPicker.value = userUIColors.text;
  bgColorPicker.value = userUIColors.bg;
  btnColorPicker.value = userUIColors.btn;

  applyUserColors();

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
    if (!card) { alert("パスが違います"); return; }
    if (!userAddedCards.includes(card.id)) {
      userAddedCards.push(card.id);
      saveJSON(LS_KEYS.userAddedCards, userAddedCards);
      renderUserCards();
      addCardPass.value = "";
    } else alert("すでに追加済みです");
  });

  function applyUserColors() {
    document.body.style.background = userUIColors.bg;
    document.body.style.color = userUIColors.text;
    cardTitle.style.color = userUIColors.text;
    document.querySelectorAll("button").forEach(btn=>{
      btn.style.background = userUIColors.btn;
      btn.style.color = userUIColors.text;
    });
  }

  textColorPicker.addEventListener("input", () => {
    userUIColors.text = textColorPicker.value; saveAll(); applyUserColors();
  });
  bgColorPicker.addEventListener("input", () => {
    userUIColors.bg = bgColorPicker.value; saveAll(); applyUserColors();
  });
  btnColorPicker.addEventListener("input", () => {
    userUIColors.btn = btnColorPicker.value; saveAll(); applyUserColors();
  });

  function renderUserCard(card) {
    const container = document.createElement("div");
    container.className = "card";
    container.dataset.id = card.id;
    if (card.bg) container.style.background = card.bg;

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
    btn.addEventListener("click", () => {
      const kw = prompt("スタンプ合言葉を入力してください");
      if(kw===null) return;
      const keyword = keywords.find(k => k.word === kw);
      if(!keyword) { alert("合言葉が違います"); return; }
      if(!keyword.enabled) { alert("無効の合言葉です"); return; }

      // 適当な空きスロットを埋める
      const filledSlot = userStampHistory.filter(s=>s.cardId===card.id).length;
      if(filledSlot >= card.slots) { alert("スタンプは満タンです"); return; }
      userStampHistory.push({cardId:card.id, slot: filledSlot, date:new Date().toISOString()});
      saveJSON(LS_KEYS.userStampHistory, userStampHistory);
      renderUserCards();
    });
    container.appendChild(btn);

    return container;
  }

  function genSerialForUser() {
    return Math.floor(Math.random()*900000+100000);
  }

  function renderUserCards() {
    userCards.innerHTML = "";
    userAddedCards.forEach(cid=>{
      const card = cards.find(c=>c.id===cid);
      if(card) userCards.appendChild(renderUserCard(card));
    });
  }

  function renderUpdateLogs() {
    updateLogs.innerHTML = "";
    updates.forEach(u=>{
      const div = document.createElement("div");
      div.textContent = u;
      updateLogs.appendChild(div);
    });
  }

  renderUserCards();
  renderUpdateLogs();
}

/* =========================
   管理者画面
   ========================= */
function initAdmin() {
  const cardName      = document.getElementById("cardName");
  const cardSlots     = document.getElementById("cardSlots");
  const addPass       = document.getElementById("addPass");
  const notifyMsg     = document.getElementById("notifyMsg");
  const maxNotifyMsg  = document.getElementById("maxNotifyMsg");
  const cardBG        = document.getElementById("cardBG");
  const stampIcon     = document.getElementById("stampIcon");

  const previewArea   = document.getElementById("previewArea");
  const adminCards    = document.getElementById("adminCards");

  const keywordCardSelect = document.getElementById("keywordCardSelect");
  const keywordInput      = document.getElementById("keywordInput");
  const addKeywordBtn     = document.getElementById("addKeywordBtn");
  const keywordList       = document.getElementById("keywordList");

  const updateInput       = document.getElementById("updateInput");
  const addUpdateBtn      = document.getElementById("addUpdateBtn");
  const adminUpdateLogs   = document.getElementById("adminUpdateLogs");

  const previewCardBtn    = document.getElementById("previewCardBtn");
  const previewClearBtn   = document.getElementById("previewClearBtn");
  const createCardBtn     = document.getElementById("createCardBtn");

  function renderAdminCards() {
    adminCards.innerHTML = "";
    keywordCardSelect.innerHTML = "";
    cards.forEach(c=>{
      const li = document.createElement("li");
      const info = document.createElement("div");
      info.className = "info";
      info.textContent = `ID:${c.id} ${c.name}（枠:${c.slots}）`;
      li.appendChild(info);
      adminCards.appendChild(li);

      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.name;
      keywordCardSelect.appendChild(opt);
    });
  }

  function renderKeywords() {
    keywordList.innerHTML = "";
    keywords.forEach((k,i)=>{
      const li = document.createElement("li");
      li.textContent = `[${k.cardId}] ${k.word}`;
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = k.enabled;
      checkbox.addEventListener("change", () => {
        k.enabled = checkbox.checked;
        saveJSON(LS_KEYS.keywords, keywords);
      });
      li.appendChild(checkbox);
      keywordList.appendChild(li);
    });
  }

  function renderUpdateLogs() {
    adminUpdateLogs.innerHTML = "";
    updates.forEach(u=>{
      const div = document.createElement("div");
      div.textContent = u;
      adminUpdateLogs.appendChild(div);
    });
  }

  previewCardBtn.addEventListener("click", () => {
    previewArea.innerHTML = "";
    const div = document.createElement("div");
    div.className = "card";
    div.style.background = cardBG.value;
    div.textContent = `${cardName.value}（枠:${cardSlots.value}）`;
    previewArea.appendChild(div);
  });
  previewClearBtn.addEventListener("click", ()=>previewArea.innerHTML="");

  createCardBtn.addEventListener("click", ()=>{
    const id = Date.now();
    const card = {id, name:cardName.value, slots:parseInt(cardSlots.value), addPass:addPass.value, bg:cardBG.value};
    cards.push(card);
    saveJSON(LS_KEYS.cards, cards);
    renderAdminCards();
    alert("カードを作成しました");
  });

  addKeywordBtn.addEventListener("click", ()=>{
    const word = keywordInput.value.trim();
    const cardId = parseInt(keywordCardSelect.value);
    if(!word) return alert("合言葉を入力");
    if(!cardId) return alert("カードを選択");
    keywords.push({word, cardId, enabled:true});
    saveJSON(LS_KEYS.keywords, keywords);
    renderKeywords();
    keywordInput.value = "";
  });

  addUpdateBtn.addEventListener("click", ()=>{
    const text = updateInput.value.trim();
    if(!text) return;
    updates.push(text);
    saveJSON(LS_KEYS.updates, updates);
    renderUpdateLogs();
    updateInput.value = "";
  });

  renderAdminCards();
  renderKeywords();
  renderUpdateLogs();
}