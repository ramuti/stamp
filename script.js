/* ============================
   script.js — ユーザー＋管理者 共通（安定版）
   - ユーザー画面用に完全対応
   - 管理者関連・コピー関係は触っていない
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

/* ============================
   localStorage読み書きヘルパー
============================ */
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

/* ============================
   配列・履歴マージ関数（他タブ対策）
============================ */
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

/* ============================
   全データ保存
============================ */
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

/* ============================
   グローバル状態
============================ */
let userName = localStorage.getItem(LS_KEYS.userName) || "";
let cards = loadJSON(LS_KEYS.cards, []);
let keywords = loadJSON(LS_KEYS.keywords, []);
let updates = loadJSON(LS_KEYS.updates, []);
let userAddedCards = loadJSON(LS_KEYS.userAddedCards, []);
let userStampHistory = loadJSON(LS_KEYS.userStampHistory, []);
let userUIColors = loadJSON(LS_KEYS.userUIColors, {text:"#c44a7b",bg:"#fff0f5",btn:"#ff99cc"});
let userCardSerials = loadJSON(LS_KEYS.userCardSerials, {});

/* ============================
   DOM読み込み後
============================ */
document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  if (body.classList.contains("user")) initUser();
  if (body.classList.contains("admin")) initAdmin(); // 管理者初期化（変更なし）
});

/* ============================
   ユーザー画面初期化
============================ */
function initUser() {
  const userNameInput = document.getElementById("userNameInput");
  const setNameBtn = document.getElementById("setNameBtn");
  const addCardPassInput = document.getElementById("addCardPass");
  const addCardBtn = document.getElementById("addCardBtn");
  const userCardsDiv = document.getElementById("userCards");
  const stampHistoryList = document.getElementById("stampHistory");

  const textColorPicker = document.getElementById("textColor");
  const bgColorPicker = document.getElementById("bgColor");
  const btnColorPicker = document.getElementById("btnColor");

  /* ============================
     カラー設定適用
  ============================ */
  function applyUserColors() {
    document.body.style.background = userUIColors.bg;
    document.body.style.color = userUIColors.text;
    document.querySelectorAll("button").forEach(btn => {
      btn.style.background = userUIColors.btn;
      btn.style.color = userUIColors.text;
    });
    userNameInput.style.color = userUIColors.text;
    addCardPassInput.style.color = userUIColors.text;
  }
  textColorPicker?.addEventListener("input", () => { userUIColors.text = textColorPicker.value; saveAll(); applyUserColors(); });
  bgColorPicker?.addEventListener("input", () => { userUIColors.bg = bgColorPicker.value; saveAll(); applyUserColors(); });
  btnColorPicker?.addEventListener("input", () => { userUIColors.btn = btnColorPicker.value; saveAll(); applyUserColors(); });
  applyUserColors();

  /* ============================
     ユーザー名設定
  ============================ */
  userNameInput.value = userName || "";
  const userCardsTitle = document.createElement("h2");
  userCardsTitle.id = "userCardsTitle";
  userCardsTitle.style.marginBottom = "16px";
  userCardsDiv.parentNode.insertBefore(userCardsTitle, userCardsDiv);

  function updateUserCardsTitle() {
    userCardsTitle.textContent = userName ? `${userName}のスタンプカード` : "スタンプカード";
  }
  updateUserCardsTitle();

  setNameBtn.addEventListener("click", () => {
    const val = userNameInput.value.trim();
    if(!val) return alert("名前を入力してください");
    userName = val;
    saveAll();
    renderUserID();
    updateUserCardsTitle();
  });

  /* ============================
     右下ユーザーID表示
  ============================ */
  function renderUserID() {
    let el = document.getElementById("userIDDisplay");
    if(!el){
      el = document.createElement("div");
      el.id = "userIDDisplay";
      el.style.position = "fixed";
      el.style.right = "8px";
      el.style.bottom = "8px";
      el.style.fontSize = "0.75em";
      el.style.color = "#999";
      document.body.appendChild(el);
    }
    el.textContent = `ユーザー: ${userName}`;
  }
  renderUserID();

  /* ============================
     カード追加（追加パス使用）
  ============================ */
  addCardBtn.addEventListener("click", () => {
    const pass = addCardPassInput.value.trim();
    if(!pass) return alert("追加パスを入力してください");

    const matchedCard = cards.find(c => c.addPass === pass);
    if(!matchedCard) return alert("追加パスが違います");

    if(userAddedCards.includes(matchedCard.id)) return alert("このカードは既に追加済みです");

    userAddedCards.push(matchedCard.id);
    saveAll();
    addCardPassInput.value = "";
    renderUserCards();
    renderStampHistory();
  });

  /* ============================
     ユーザーのカード描画＋スタンプ押印
     - 押印時は管理者設定の「合言葉」を使用
     - 合言葉は 1 端末につき 1 回だけ使用可能
  ============================ */
  function renderUserCards() {
    userCardsDiv.innerHTML = "";
    userAddedCards = userAddedCards.filter(cid => cards.some(c => c.id === cid));

    userAddedCards.forEach(cid => {
      const c = cards.find(x => x.id === cid);
      if(!c) return;

      const div = document.createElement("div");
      div.className = "card";
      div.style.background = c.bg || "#fff0f5";
      div.innerHTML = `<div>${c.name}</div>`;

      const slotsDiv = document.createElement("div");
      for(let i=0;i<c.slots;i++){
        const span = document.createElement("span");
        span.className = "stamp-slot";
        const filled = userStampHistory.find(s => s.cardId===cid && s.slot===i);
        if(filled) span.classList.add("stamp-filled");
        slotsDiv.appendChild(span);
      }
      div.appendChild(slotsDiv);

      const stampBtn = document.createElement("button");
      stampBtn.textContent = "スタンプ押す";
      stampBtn.style.display="block";
      stampBtn.style.marginTop="8px";
      stampBtn.addEventListener("click", () => {
        const inputWord = prompt("スタンプ合言葉を入力してください");
        if(!inputWord) return;

        // このカードの有効な合言葉一覧
        const matchedKeyword = keywords.find(k => k.cardId===cid && k.word===inputWord && k.enabled);
        if(!matchedKeyword) return alert("合言葉が違います");

        // すでにこの端末で使ったかチェック
        const alreadyUsed = userStampHistory.some(s => s.cardId===cid && s.word===inputWord);
        if(alreadyUsed) return alert("この合言葉は既に使われました");

        const stampedCount = userStampHistory.filter(s=>s.cardId===cid).length;
        if(stampedCount >= c.slots) {
          if(c.maxNotifyMsg) alert(c.maxNotifyMsg);
          return alert("もう押せません");
        }

        // 押印記録
        userStampHistory.push({
          cardId: cid,
          slot: stampedCount,
          word: inputWord,
          datetime: new Date().toISOString()
        });

        if(c.notifyMsg) alert(c.notifyMsg);

        userStampHistory = userStampHistory.filter(s => cards.some(c => c.id === s.cardId));

        saveAll();
        renderUserCards();
        renderStampHistory();
      });
      div.appendChild(stampBtn);

      userCardsDiv.appendChild(div);
    });
  }

  /* ============================
     スタンプ履歴描画
  ============================ */
  function renderStampHistory() {
    stampHistoryList.innerHTML = "";
    userStampHistory.slice().reverse().forEach(s=>{
      const cardExists = cards.find(c => c.id === s.cardId);
      if(!cardExists) return;
      const li = document.createElement("li");
      const cName = cardExists.name || s.cardId;
      const dt = new Date(s.datetime).toLocaleString();
      li.textContent = `${cName} スロット${s.slot+1} ${dt}`;
      stampHistoryList.appendChild(li);
    });
  }

  renderUserCards();
  renderStampHistory();

  /* ============================
     更新履歴描画
  ============================ */
  const updateLogsList = document.getElementById("updateLogs");
  function renderUpdates() {
    updateLogsList.innerHTML = "";
    updates.forEach(u=>{
      const li = document.createElement("li");
      li.textContent = `${u.date} ${u.msg}`;
      updateLogsList.appendChild(li);
    });
  }
  renderUpdates();
}

  /* ============================
     スタンプ履歴描画
  ============================ */
  function renderStampHistory() {
    stampHistoryList.innerHTML = "";
    userStampHistory.slice().reverse().forEach(s=>{
      const cardExists = cards.find(c => c.id === s.cardId);
      if(!cardExists) return;
      const li = document.createElement("li");
      const cName = cardExists.name || s.cardId;
      const dt = new Date(s.datetime).toLocaleString();
      li.textContent = `${cName} スロット${s.slot+1} ${dt}`;
      stampHistoryList.appendChild(li);
    });
  }

  renderUserCards();
  renderStampHistory();

  /* ============================
     更新履歴描画
  ============================ */
  const updateLogsList = document.getElementById("updateLogs");
  function renderUpdates() {
    updateLogsList.innerHTML = "";
    updates.forEach(u=>{
      const li = document.createElement("li");
      li.textContent = `${u.date} ${u.msg}`;
      updateLogsList.appendChild(li);
    });
  }
  renderUpdates();
}

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