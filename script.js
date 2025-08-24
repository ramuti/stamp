/* ============================
   script.js — ユーザー＋管理者 共通（完全版）
   - 仕様は変更なし
   - 管理者コピー機能統合済み
============================ */

const LS_KEYS = {
  appVersion: "appVersion",
  userName: "userName",
  cards: "cards",
  keywords: "keywords",
  updates: "updates",
  userAddedCards: "userAddedCards",
  userStampHistory: "userStampHistory",
  userUIColors: "userUIColors",
  userCardSerials: "userCardSerials"
};

const APP_VERSION = "v1.6.0";

/* --- localStorage helpers --- */
function loadJSON(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch (e) { return fallback; }
}
function saveJSON(key, obj) { localStorage.setItem(key, JSON.stringify(obj)); }

/* --- merge helpers --- */
function mergeUniqueArray(existingArray, newArray) {
  const set = new Set(existingArray || []);
  (newArray || []).forEach(v => set.add(v));
  return Array.from(set);
}
function mergeStampHistories(existing, current) {
  const map = new Map();
  (existing || []).forEach(e => { map.set(`${e.cardId}||${e.slot}||${e.word||""}||${e.datetime||""}`, e); });
  (current || []).forEach(e => { const key = `${e.cardId}||${e.slot}||${e.word||""}||${e.datetime||""}`; if (!map.has(key)) map.set(key, e); });
  return Array.from(map.values());
}
function mergeUserCardSerials(existing, current) {
  const merged = JSON.parse(JSON.stringify(existing || {}));
  for (const user in (current || {})) {
    if (!merged[user]) merged[user] = {};
    for (const cid in current[user]) {
      if (merged[user][cid] === undefined || merged[user][cid] === null) merged[user][cid] = current[user][cid];
    }
  }
  return merged;
}

/* --- central save function --- */
function saveAll() {
  try {
    localStorage.setItem(LS_KEYS.appVersion, APP_VERSION);
    localStorage.setItem(LS_KEYS.userName, userName);

    saveJSON(LS_KEYS.cards, cards);
    saveJSON(LS_KEYS.keywords, keywords);
    saveJSON(LS_KEYS.updates, updates);

    const existingUserAdded = loadJSON(LS_KEYS.userAddedCards, []);
    const mergedUserAdded = mergeUniqueArray(existingUserAdded, userAddedCards);
    saveJSON(LS_KEYS.userAddedCards, mergedUserAdded);
    userAddedCards = mergedUserAdded;

    const existingHistory = loadJSON(LS_KEYS.userStampHistory, []);
    const mergedHistory = mergeStampHistories(existingHistory, userStampHistory);
    saveJSON(LS_KEYS.userStampHistory, mergedHistory);
    userStampHistory = mergedHistory;

    const existingSerials = loadJSON(LS_KEYS.userCardSerials, {});
    const mergedSerials = mergeUserCardSerials(existingSerials, userCardSerials);
    saveJSON(LS_KEYS.userCardSerials, mergedSerials);
    userCardSerials = mergedSerials;

    const existingColors = loadJSON(LS_KEYS.userUIColors, {text:"#c44a7b",bg:"#fff0f5",btn:"#ff99cc"});
    const mergedColors = Object.assign({}, existingColors, userUIColors || {});
    saveJSON(LS_KEYS.userUIColors, mergedColors);
    userUIColors = mergedColors;

  } catch (e) { alert("データ保存に失敗"); console.error(e); }
}

/* --- global state --- */
let userName = localStorage.getItem(LS_KEYS.userName) || "";
let cards = loadJSON(LS_KEYS.cards, []);
let keywords = loadJSON(LS_KEYS.keywords, []);
let updates = loadJSON(LS_KEYS.updates, []);
let userAddedCards = loadJSON(LS_KEYS.userAddedCards, []);
let userStampHistory = loadJSON(LS_KEYS.userStampHistory, []);
let userUIColors = loadJSON(LS_KEYS.userUIColors, {text:"#c44a7b",bg:"#fff0f5",btn:"#ff99cc"});
let userCardSerials = loadJSON(LS_KEYS.userCardSerials, {});

/* --- DOM ready --- */
document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  if (body.classList.contains("user")) initUser();
  if (body.classList.contains("admin")) initAdmin();
});

/* =========================
   管理者用コピー関数
========================= */
function generateUpdateData() {
  return JSON.stringify({
    cards: cards.map(c => ({
      id: c.id, name: c.name, slots: c.slots, addPass: c.addPass,
      bg: c.bg, stampIcon: c.stampIcon, notifyMsg: c.notifyMsg, maxNotifyMsg: c.maxNotifyMsg
    })),
    keywords: keywords.map(k => ({ cardId: k.cardId, word: k.word, enabled: k.enabled }))
  }, null, 2);
}
function addCopyButton() {
  if (document.getElementById("copyUpdateDataBtn")) return;

  const container = document.createElement("div");
  container.style.margin = "16px 0"; container.style.textAlign = "center";

  const btn = document.createElement("button");
  btn.id = "copyUpdateDataBtn"; btn.textContent = "カード・合言葉データをコピー";
  btn.style.padding = "8px 16px"; btn.style.fontSize = "14px"; btn.style.cursor = "pointer";

  btn.addEventListener("click", () => {
    if (typeof generateUpdateData === "function") {
      navigator.clipboard.writeText(generateUpdateData())
        .then(() => alert("コピーしました！\nこの内容を generateUpdateData.js に上書きコミットしてください"))
        .catch(err => alert("コピー失敗: " + err));
    } else alert("generateUpdateData 関数が定義されていません");
  });

  container.appendChild(btn);
  document.body.appendChild(container);
}

/* =========================
   ユーザー画面
========================= */
function initUser() {
  const setNameBtn = document.getElementById("setNameBtn");
  const userNameInput = document.getElementById("userNameInput");
  const cardTitle = document.getElementById("cardTitle");
  const addCardBtn = document.getElementById("addCardBtn");
  const addCardPass = document.getElementById("addCardPass");
  const userCards = document.getElementById("userCards");
  const historyList = document.getElementById("stampHistory");
  const updateLogs = document.getElementById("updateLogs");

  const textColorPicker = document.getElementById("textColor");
  const bgColorPicker = document.getElementById("bgColor");
  const btnColorPicker = document.getElementById("btnColor");

  cardTitle.textContent = userName ? `${userName}のスタンプカード` : "スタンプカード";
  userNameInput.value = userName;
  textColorPicker.value = userUIColors.text || "#c44a7b";
  bgColorPicker.value = userUIColors.bg || "#fff0f5";
  btnColorPicker.value = userUIColors.btn || "#ff99cc";
  applyUserColors();

  setNameBtn.addEventListener("click", () => {
    const v = userNameInput.value.trim();
    if (!v) { alert("名前を入力してください"); return; }
    userName = v; saveAll(); cardTitle.textContent = `${userName}のスタンプカード`;
  });

  addCardBtn.addEventListener("click", () => {
    const pass = addCardPass.value.trim();
    if (!pass) { alert("追加パスを入力してください"); return; }
    const card = cards.find(c => c.addPass === pass);
    if (!card) { alert("パスが違います"); return; }
    if (!userAddedCards.includes(card.id)) {
      userAddedCards.push(card.id);
      if (!userCardSerials[userName]) userCardSerials[userName] = {};
      if (!userCardSerials[userName][card.id]) {
        const existingSerials = Object.values(userCardSerials).map(u => u[card.id] || 0);
        const maxSerial = existingSerials.length ? Math.max(...existingSerials) : 0;
        userCardSerials[userName][card.id] = maxSerial + 1;
      }
      saveAll(); renderUserCards(); addCardPass.value = "";
    } else alert("すでに追加済みです");
  });

  function applyUserColors() {
    document.body.style.background = userUIColors.bg;
    document.body.style.color = userUIColors.text;
    cardTitle.style.color = userUIColors.text;
    document.querySelectorAll("button").forEach(btn => { btn.style.background = userUIColors.btn; btn.style.color = userUIColors.text; });
  }

  textColorPicker.addEventListener("input", () => { userUIColors.text = textColorPicker.value; saveAll(); applyUserColors(); });
  bgColorPicker.addEventListener("input", () => { userUIColors.bg = bgColorPicker.value; saveAll(); applyUserColors(); });
  btnColorPicker.addEventListener("input", () => { userUIColors.btn = btnColorPicker.value; saveAll(); applyUserColors(); });

  function renderUserCard(card) {
    const container = document.createElement("div"); container.className = "card"; container.dataset.id = card.id;
    if (card.bg) container.style.background = card.bg;
    const title = document.createElement("h3"); title.textContent = card.name; container.appendChild(title);
    const grid = document.createElement("div"); grid.style.marginBottom = "8px";
    for (let i=0;i<card.slots;i++) {
      const slot = document.createElement("span"); slot.className = "stamp-slot"; grid.appendChild(slot);
    }
    container.appendChild(grid);
    userCards.appendChild(container);
  }

  function renderUserCards() {
    userCards.innerHTML = "";
    userAddedCards.forEach(cid => {
      const card = cards.find(c => c.id === cid);
      if (card) renderUserCard(card);
    });
  }

  renderUserCards();

  // 更新履歴
  if (updates.length) {
    updateLogs.innerHTML = updates.map(u => `<li>${u}</li>`).join("");
  }
}

/* =========================
   管理者画面
========================= */
function initAdmin() {
  const cardName = document.getElementById("cardName");
  const cardSlots = document.getElementById("cardSlots");
  const addPass = document.getElementById("addPass");
  const notifyMsg = document.getElementById("notifyMsg");
  const maxNotifyMsg = document.getElementById("maxNotifyMsg");
  const cardBG = document.getElementById("cardBG");
  const stampIcon = document.getElementById("stampIcon");
  const createCardBtn = document.getElementById("createCardBtn");
  const previewCardBtn = document.getElementById("previewCardBtn");
  const previewClearBtn = document.getElementById("previewClearBtn");
  const adminCards = document.getElementById("adminCards");
  const keywordCardSelect = document.getElementById("keywordCardSelect");
  const keywordInput = document.getElementById("keywordInput");
  const addKeywordBtn = document.getElementById("addKeywordBtn");
  const keywordList = document.getElementById("keywordList");
  const updateInput = document.getElementById("updateInput");
  const addUpdateBtn = document.getElementById("addUpdateBtn");
  const adminUpdateLogs = document.getElementById("adminUpdateLogs");
  const previewArea = document.getElementById("previewArea");

  function renderCards() {
    adminCards.innerHTML = "";
    keywordCardSelect.innerHTML = "";
    cards.forEach(c => {
      const li = document.createElement("li");
      li.innerHTML = `<span class="info">${c.name} (枠:${c.slots})</span>
      <button class="deleteBtn">削除</button>`;
      li.querySelector(".deleteBtn").addEventListener("click", () => {
        if (confirm("削除しますか？")) {
          cards = cards.filter(x => x.id!==c.id);
          keywords = keywords.filter(k => k.cardId !== c.id);
          saveAll(); renderCards(); renderKeywords();
        }
      });
      adminCards.appendChild(li);

      const opt = document.createElement("option"); opt.value = c.id; opt.textContent = c.name; keywordCardSelect.appendChild(opt);
    });
  }

  function renderKeywords() {
    keywordList.innerHTML = "";
    keywords.forEach(k => {
      const li = document.createElement("li");
      li.textContent = `[${k.cardId}] ${k.word}`;
      const delBtn = document.createElement("button"); delBtn.textContent = "削除";
      delBtn.addEventListener("click", () => { keywords = keywords.filter(x => x !== k); saveAll(); renderKeywords(); });
      li.appendChild(delBtn); keywordList.appendChild(li);
    });
  }

  function renderUpdates() {
    adminUpdateLogs.innerHTML = updates.map(u => `<li>${u}</li>`).join("");
  }

  createCardBtn.addEventListener("click", () => {
    const name = cardName.value.trim(); if (!name) { alert("カード名を入力"); return; }
    const slots = parseInt(cardSlots.value); if (!slots || slots<1) { alert("枠数を正しく"); return; }
    const pass = addPass.value.trim(); if (!pass) { alert("追加パスを入力"); return; }
    const id = Date.now().toString();
    const c = {id,name,slots,addPass:pass,bg:cardBG.value,stampIcon:stampIcon.value,notifyMsg:notifyMsg.value,maxNotifyMsg:maxNotifyMsg.value};
    cards.push(c); saveAll(); renderCards();
  });

  addKeywordBtn.addEventListener("click", () => {
    const cid = keywordCardSelect.value; const word = keywordInput.value.trim();
    if (!cid || !word) { alert("カードと合言葉を設定"); return; }
    keywords.push({cardId: cid, word, enabled:true}); saveAll(); renderKeywords(); keywordInput.value="";
  });

  addUpdateBtn.addEventListener("click", () => {
    const text = updateInput.value.trim(); if (!text) return;
    updates.push(text); saveAll(); renderUpdates(); updateInput.value="";
  });

  previewCardBtn.addEventListener("click", () => {
    const name = cardName.value || "カード名"; const slots = parseInt(cardSlots.value)||5;
    const bg = cardBG.value; const icon = stampIcon.value;
    previewArea.innerHTML = "";
    const div = document.createElement("div"); div.className="card"; div.style.background=bg;
    div.innerHTML=`<h3>${name}</h3>`; const grid = document.createElement("div");
    for(let i=0;i<slots;i++){ const s=document.createElement("span"); s.className="stamp-slot"; grid.appendChild(s); }
    div.appendChild(grid); previewArea.appendChild(div);
  });

  previewClearBtn.addEventListener("click", ()=>{previewArea.innerHTML="";});

  renderCards(); renderKeywords(); renderUpdates();

  // 管理者用コピー用ボタン
  addCopyButton();
}