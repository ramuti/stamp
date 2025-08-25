/* ============================
   script.js — ユーザー＋管理者 共通（安定版）
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

/* Helpers for localStorage */
function loadJSON(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch (e) {
    return fallback;
  }
}
function saveJSON(key, obj) {
  localStorage.setItem(key, JSON.stringify(obj));
}

/* Merge helpers */
function mergeUniqueArray(existingArray, newArray) {
  const set = new Set(existingArray || []);
  (newArray || []).forEach(v => set.add(v));
  return Array.from(set);
}
function mergeStampHistories(existing, current) {
  const map = new Map();
  (existing || []).forEach(e => {
    const key = `${e.cardId}||${e.slot}||${e.word||""}||${e.datetime||""}`;
    map.set(key, e);
  });
  (current || []).forEach(e => {
    const key = `${e.cardId}||${e.slot}||${e.word||""}||${e.datetime||""}`;
    if (!map.has(key)) map.set(key, e);
  });
  return Array.from(map.values());
}
function mergeUserCardSerials(existing, current) {
  const merged = JSON.parse(JSON.stringify(existing || {}));
  for (const user in (current || {})) {
    if (!merged[user]) merged[user] = {};
    for (const cid in current[user]) {
      if (merged[user][cid] === undefined || merged[user][cid] === null) {
        merged[user][cid] = current[user][cid];
      }
    }
  }
  return merged;
}

/* Central save function */
function saveAll() {
  try {
    localStorage.setItem(LS_KEYS.appVersion, APP_VERSION);
    localStorage.setItem(LS_KEYS.userName, userName);

    saveJSON(LS_KEYS.cards, cards);
    saveJSON(LS_KEYS.keywords, keywords);
    saveJSON(LS_KEYS.updates, updates);

    const existingUserAdded = loadJSON(LS_KEYS.userAddedCards, []);
    userAddedCards = mergeUniqueArray(existingUserAdded, userAddedCards);
    saveJSON(LS_KEYS.userAddedCards, userAddedCards);

    const existingHistory = loadJSON(LS_KEYS.userStampHistory, []);
    userStampHistory = mergeStampHistories(existingHistory, userStampHistory);
    saveJSON(LS_KEYS.userStampHistory, userStampHistory);

    const existingSerials = loadJSON(LS_KEYS.userCardSerials, {});
    userCardSerials = mergeUserCardSerials(existingSerials, userCardSerials);
    saveJSON(LS_KEYS.userCardSerials, userCardSerials);

    const existingColors = loadJSON(LS_KEYS.userUIColors, {text:"#c44a7b",bg:"#fff0f5",btn:"#ff99cc"});
    userUIColors = Object.assign({}, existingColors, userUIColors || {});
    saveJSON(LS_KEYS.userUIColors, userUIColors);

  } catch (e) {
    alert("データ保存に失敗");
    console.error(e);
  }
}

/* Global state */
let userName = localStorage.getItem(LS_KEYS.userName) || "";
let cards = loadJSON(LS_KEYS.cards, []);
let keywords = loadJSON(LS_KEYS.keywords, []);
let updates = loadJSON(LS_KEYS.updates, []);
let userAddedCards = loadJSON(LS_KEYS.userAddedCards, []);
let userStampHistory = loadJSON(LS_KEYS.userStampHistory, []);
let userUIColors = loadJSON(LS_KEYS.userUIColors, {text:"#c44a7b",bg:"#fff0f5",btn:"#ff99cc"});
let userCardSerials = loadJSON(LS_KEYS.userCardSerials, {});

/* =========================
   DOM ready
========================= */
document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  if (body.classList.contains("user")) initUser();
  if (body.classList.contains("admin")) initAdmin();
});

/* =========================
   ユーザー画面
========================= */

// ユーザー名を保存してタイトルに反映
function saveUserName() {
  const userName = document.getElementById("userName").value.trim();
  if (userName) {
    localStorage.setItem("userName", userName);
    document.title = `${userName}のスタンプカード`;
    document.getElementById("pageTitle").innerText = `${userName}のスタンプカード`;
  }
}

// ユーザー名を復元
function loadUserName() {
  const savedName = localStorage.getItem("userName");
  if (savedName) {
    document.getElementById("userName").value = savedName;
    document.title = `${savedName}のスタンプカード`;
    document.getElementById("pageTitle").innerText = `${savedName}のスタンプカード`;
  }
}

// カードを描画
function renderCards(cards) {
  const container = document.getElementById("userCards");
  container.innerHTML = "";
  cards.forEach(card => {
    const cardEl = document.createElement("div");
    cardEl.className = "card";
    cardEl.style.background = card.bg || "#fff";

    // シリアル番号
    const serial = card.serial || generateSerial();
    card.serial = serial;

    const title = document.createElement("h3");
    title.textContent = `${card.name}（No.${serial}）`;
    cardEl.appendChild(title);

    // スタンプボタン
    const button = document.createElement("button");
    button.textContent = "スタンプを押す";
    button.onclick = () => addStamp(card.id);
    cardEl.appendChild(button);

    // スタンプ数表示
    const slots = document.createElement("p");
    slots.textContent = `スタンプ：${card.stamps || 0}/${card.slots}`;
    cardEl.appendChild(slots);

    container.appendChild(cardEl);
  });

  saveCards(cards);
}

// カード追加（追加パスの入力はボタン押下時のみ判定）
function tryAddCard() {
  const passInput = document.getElementById("addPassInput").value.trim();
  if (!passInput) return;

  const cards = loadCards();
  // 管理側で設定したパスワード一致判定
  const adminCards = JSON.parse(localStorage.getItem("adminCards")) || [];
  const target = adminCards.find(c => c.addPass === passInput);
  if (target) {
    // すでに追加済みならスキップ
    if (cards.some(c => c.id === target.id)) {
      alert("このカードはすでに追加されています。");
    } else {
      const newCard = { ...target, stamps: 0, serial: generateSerial() };
      cards.push(newCard);
      renderCards(cards);
      alert(`${newCard.name} を追加しました！`);
    }
  } else {
    alert("追加パスが間違っています。");
  }
  document.getElementById("addPassInput").value = "";
}

// ランダムシリアル番号
function generateSerial() {
  return Math.floor(100000 + Math.random() * 900000); // 6桁
}

// カード保存
function saveCards(cards) {
  localStorage.setItem("userCards", JSON.stringify(cards));
}

// カード読み込み
function loadCards() {
  return JSON.parse(localStorage.getItem("userCards")) || [];
}

// スタンプを押す
function addStamp(cardId) {
  const cards = loadCards();
  const card = cards.find(c => c.id === cardId);
  if (card) {
    if (!card.stamps) card.stamps = 0;
    if (card.stamps < card.slots) {
      card.stamps++;
    } else {
      alert("スタンプがいっぱいです！");
    }
    renderCards(cards);
  }
}

// 初期化
window.addEventListener("DOMContentLoaded", () => {
  loadUserName();
  renderCards(loadCards());
});

/* =========================
   管理者画面
========================= */
function initAdmin() {
  const cardName       = document.getElementById("cardName");
  const cardSlots      = document.getElementById("cardSlots");
  const addPass        = document.getElementById("addPass");
  const notifyMsg      = document.getElementById("notifyMsg");
  const maxNotifyMsg   = document.getElementById("maxNotifyMsg");
  const cardBG         = document.getElementById("cardBG");
  const stampIcon      = document.getElementById("stampIcon");
  const previewCardBtn = document.getElementById("previewCardBtn");
  const previewClearBtn= document.getElementById("previewClearBtn");
  const createCardBtn  = document.getElementById("createCardBtn");
  const adminCardsList = document.getElementById("adminCards");
  const keywordCardSelect = document.getElementById("keywordCardSelect");
  const keywordInput   = document.getElementById("keywordInput");
  const addKeywordBtn  = document.getElementById("addKeywordBtn");
  const keywordList    = document.getElementById("keywordList");
  const updateInput    = document.getElementById("updateInput");
  const addUpdateBtn   = document.getElementById("addUpdateBtn");
  const adminUpdateLogs= document.getElementById("adminUpdateLogs");
  const previewArea    = document.getElementById("previewArea");

  function renderAdminCards() {
    adminCardsList.innerHTML = "";
    keywordCardSelect.innerHTML = "";
    cards.forEach(c => {
      const li = document.createElement("li");
      const info = document.createElement("div"); info.className = "info";
      info.textContent = `${c.name}（枠:${c.slots} 追加パス:${c.addPass}）`;
      li.appendChild(info);

      const delBtn = document.createElement("button");
      delBtn.textContent = "削除";
      delBtn.addEventListener("click", () => {
        cards = cards.filter(x => x.id !== c.id);
        userAddedCards = userAddedCards.filter(x => x !== c.id);
        for (const uname in userCardSerials) {
          if (userCardSerials[uname] && userCardSerials[uname][c.id]) {
            delete userCardSerials[uname][c.id];
          }
        }
        userStampHistory = userStampHistory.filter(s => s.cardId !== c.id);
        saveAll();
        renderAdminCards();
      });
      li.appendChild(delBtn);

      adminCardsList.appendChild(li);

      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.name;
      keywordCardSelect.appendChild(opt);
    });
  }

  function renderKeywords() {
    keywordList.innerHTML = "";
    keywords.forEach((k, idx) => {
      const li = document.createElement("li");
      const cName = cards.find(c => c.id === k.cardId)?.name || k.cardId;
      const info = document.createElement("span");
      info.textContent = `${cName} : ${k.word} : 状態:${k.enabled ? "有効" : "無効"}`;
      li.appendChild(info);

      const toggleBtn = document.createElement("button");
      toggleBtn.textContent = k.enabled ? "無効にする" : "有効にする";
      toggleBtn.addEventListener("click", () => { k.enabled=!k.enabled; saveAll(); renderKeywords(); });
      li.appendChild(toggleBtn);

      const delBtn = document.createElement("button");
      delBtn.textContent = "消去";
      delBtn.addEventListener("click", () => { keywords.splice(idx,1); saveAll(); renderKeywords(); });
      li.appendChild(delBtn);

      keywordList.appendChild(li);
    });
  }

  function renderUpdates() {
    adminUpdateLogs.innerHTML = "";
    updates.forEach((u, idx) => {
      const li = document.createElement("li");
      li.textContent = `${u.date} ${u.msg}`;
      const delBtn = document.createElement("button");
      delBtn.textContent = "削除";
      delBtn.addEventListener("click", () => { updates.splice(idx,1); saveAll(); renderUpdates(); });
      li.appendChild(delBtn);
      adminUpdateLogs.appendChild(li);
    });
  }

  previewCardBtn.addEventListener("click", () => {
    const c = { name: cardName.value, slots: parseInt(cardSlots.value)||5, bg: cardBG.value, stampIcon: stampIcon.value };
    previewArea.innerHTML = `<div class="card" style="background:${c.bg}">${c.name}<br>` +
      Array.from({length:c.slots}).map(_=>`<span class="stamp-slot"></span>`).join("") + `</div>`;
  });
  previewClearBtn.addEventListener("click",()=>{ previewArea.innerHTML=""; });

  createCardBtn.addEventListener("click", ()=>{
    const id = `card_${Date.now()}`;
    cards.push({ id, name: cardName.value, slots: parseInt(cardSlots.value)||5, addPass:addPass.value, bg:cardBG.value, stampIcon:stampIcon.value, notifyMsg:notifyMsg.value, maxNotifyMsg:maxNotifyMsg.value });
    saveAll(); renderAdminCards(); renderKeywords();
  });

  addKeywordBtn.addEventListener("click", ()=>{
    if(!keywordInput.value) return;
    keywords.push({cardId:keywordCardSelect.value, word:keywordInput.value, enabled:true});
    keywordInput.value="";
    saveAll(); renderKeywords();
  });

  addUpdateBtn.addEventListener("click", ()=>{
    if(!updateInput.value) return;
    const now = new Date();
    updates.push({date: now.toLocaleString(), msg:updateInput.value});
    updateInput.value="";
    saveAll(); renderUpdates();
  });

  addCopyButton();

  renderAdminCards(); renderKeywords(); renderUpdates();
}

/* =========================
   Copy button & generate
========================= */
function addCopyButton() {
  if (document.getElementById("copyUpdateDataBtn")) return;
  const container = document.createElement("div");
  container.style.margin="16px 0"; container.style.textAlign="center";
  const btn = document.createElement("button");
  btn.id="copyUpdateDataBtn"; btn.textContent="カード・合言葉データをコピー";
  btn.style.padding="8px 16px"; btn.style.fontSize="14px"; btn.style.cursor="pointer";
  btn.addEventListener("click", ()=>{
    if(typeof generateUpdateData==="function"){
      navigator.clipboard.writeText(generateUpdateData())
        .then(()=>alert("コピーしました！\nこの内容を updateDataFull.js に上書きコミットしてください"))
        .catch(err=>alert("コピー失敗: "+err));
    }else alert("generateUpdateData 関数が定義されていません");
  });
  container.appendChild(btn);
  document.body.appendChild(container);
}

function generateUpdateData() {
  return JSON.stringify({
    cards: cards.map(c=>({id:c.id,name:c.name,slots:c.slots,addPass:c.addPass,bg:c.bg,stampIcon:c.stampIcon,notifyMsg:c.notifyMsg,maxNotifyMsg:c.maxNotifyMsg})),
    keywords: keywords.map(k=>({cardId:k.cardId,word:k.word,enabled:k.enabled}))
  },null,2);
}