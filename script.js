/* ============================
   script.js — ユーザー＋管理者 共通（安定版）
   - 変更点:
     ・更新履歴は管理者が明示的に追加する場所のみ
     ・更新履歴の削除ボタンは確認なしで即削除
     ・コピー用ボタンを管理者画面に追加
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

/* Merge helpers to avoid overwriting concurrent changes from other tabs */
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

/* DOM ready */
document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  if (body.classList.contains("user")) initUser();
  if (body.classList.contains("admin")) initAdmin();
});

/* =========================
   ユーザー画面
========================= */
function initUser() {
  const cardTitle = document.getElementById("cardTitle");
  const userCards = document.getElementById("userCards");
  const historyList = document.getElementById("stampHistory");
  const textColorPicker = document.getElementById("textColor");
  const bgColorPicker = document.getElementById("bgColor");
  const btnColorPicker = document.getElementById("btnColor");
  const addCardBtn = document.getElementById("addCardBtn");
  const addCardPassInput = document.getElementById("addCardPass");

  // 色変更反映
  function applyUserColors() {
    document.body.style.background = userUIColors.bg;
    document.body.style.color = userUIColors.text;
    if(cardTitle) cardTitle.style.color = userUIColors.text;
    document.querySelectorAll("button").forEach(btn => {
      btn.style.background = userUIColors.btn;
      btn.style.color = userUIColors.text;
    });
  }

  textColorPicker?.addEventListener("input", () => {
    userUIColors.text = textColorPicker.value; saveAll(); applyUserColors();
  });
  bgColorPicker?.addEventListener("input", () => {
    userUIColors.bg = bgColorPicker.value; saveAll(); applyUserColors();
  });
  btnColorPicker?.addEventListener("input", () => {
    userUIColors.btn = btnColorPicker.value; saveAll(); applyUserColors();
  });

  applyUserColors();

  // カード追加処理（追加パス用）
  addCardBtn?.addEventListener("click", ()=>{
    const pass = addCardPassInput.value.trim();
    if(!pass) return alert("追加パスを入力してください");

    const matchedCard = cards.find(c => c.addPass === pass);
    if(!matchedCard) return alert("カード追加パスが違います");

    if(userAddedCards.includes(matchedCard.id)) return alert("このカードは既に追加済みです");

    userAddedCards.push(matchedCard.id);
    saveAll();
    renderUserCards();
    addCardPassInput.value = "";
  });

  // カード描画関数
  function renderUserCards() {
    userCards.innerHTML = "";
    userAddedCards.forEach(cid => {
      const card = cards.find(c => c.id === cid);
      if(!card) return;

      const div = document.createElement("div");
      div.className = "card";
      div.style.background = card.bg;

      const name = document.createElement("div");
      name.textContent = card.name;
      div.appendChild(name);

      // スタンプ枠
      for(let i=0; i<card.slots; i++){
        const span = document.createElement("span");
        span.className = "stamp-slot";
        const stamped = userStampHistory.find(s => s.cardId===cid && s.slot===i);
        if(stamped) span.classList.add("stamp-filled");
        div.appendChild(span);
      }

      // スタンプボタン
      const btn = document.createElement("button");
      btn.textContent = "スタンプを押す";
      btn.style.display = "block";
      btn.style.marginTop = "8px";
      btn.addEventListener("click", ()=>{
        const code = prompt("スタンプの合言葉を入力してください");
        if(!code) return;

        // 合言葉一致カードかチェック
        if(code !== card.addPass) return alert("合言葉が違います");

        // 空きスロットを探して押す
        for(let i=0; i<card.slots; i++){
          const exists = userStampHistory.find(s => s.cardId===cid && s.slot===i);
          if(!exists){
            userStampHistory.push({cardId: cid, slot: i, datetime: new Date().toISOString()});
            saveAll();
            renderUserCards();
            break;
          }
          if(i === card.slots - 1){
            alert("全ての枠にスタンプ済みです");
          }
        }
      });

      div.appendChild(btn);
      userCards.appendChild(div);
    });
  }

  renderUserCards();
}

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

  /* Render admin cards */
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

  /* Render keywords */
  function renderKeywords() {
    keywordList.innerHTML = "";
    keywords.forEach((k, idx) => {
      const li = document.createElement("li");
      const cName = cards.find(c => c.id === k.cardId)?.name || k.cardId;
      li.textContent = `${cName}: ${k.word}`;
      const delBtn = document.createElement("button");
      delBtn.textContent = "削除";
      delBtn.addEventListener("click", () => {
        keywords.splice(idx,1); saveAll(); renderKeywords();
      });
      li.appendChild(delBtn);
      keywordList.appendChild(li);
    });
  }

  /* Render updates */
  function renderUpdates() {
    adminUpdateLogs.innerHTML = "";
    updates.forEach((u, idx) => {
      const li = document.createElement("li");
      li.textContent = `${u.date} ${u.msg}`;
      const delBtn = document.createElement("button");
      delBtn.textContent = "削除";
      delBtn.addEventListener("click", () => {
        // 確認なしで即削除
        updates.splice(idx,1); saveAll(); renderUpdates();
      });
      li.appendChild(delBtn);
      adminUpdateLogs.appendChild(li);
    });
  }

  /* Preview */
  previewCardBtn.addEventListener("click", () => {
    const c = {
      name: cardName.value,
      slots: parseInt(cardSlots.value)||5,
      bg: cardBG.value,
      stampIcon: stampIcon.value
    };
    previewArea.innerHTML = `<div class="card" style="background:${c.bg}">${c.name}<br>` +
      Array.from({length:c.slots}).map(_=>`<span class="stamp-slot"></span>`).join("") + `</div>`;
  });
  previewClearBtn.addEventListener("click", () => { previewArea.innerHTML=""; });

  /* Create card */
  createCardBtn.addEventListener("click", () => {
    const id = `card_${Date.now()}`;
    cards.push({
      id,
      name: cardName.value,
      slots: parseInt(cardSlots.value)||5,
      addPass: addPass.value,
      bg: cardBG.value,
      stampIcon: stampIcon.value,
      notifyMsg: notifyMsg.value,
      maxNotifyMsg: maxNotifyMsg.value
    });
    saveAll(); renderAdminCards(); renderKeywords();
  });

  /* Add keyword */
  addKeywordBtn.addEventListener("click", () => {
    if(!keywordInput.value) return;
    keywords.push({cardId:keywordCardSelect.value, word:keywordInput.value, enabled:true});
    keywordInput.value="";
    saveAll(); renderKeywords();
  });

  /* Add update log */
  addUpdateBtn.addEventListener("click", () => {
    if(!updateInput.value) return;
    const now = new Date();
    updates.push({date: now.toLocaleString(), msg:updateInput.value});
    updateInput.value="";
    saveAll(); renderUpdates();
  });

  /* Copy button */
  addCopyButton();

  /* Initial render */
  renderAdminCards();
  renderKeywords();
  renderUpdates();
}

/* =========================
   Copy button function
========================= */
function addCopyButton() {
  if (document.getElementById("copyUpdateDataBtn")) return;

  const container = document.createElement("div");
  container.style.margin = "16px 0"; container.style.textAlign = "center";

  const btn = document.createElement("button");
  btn.id = "copyUpdateDataBtn";
  btn.textContent = "カード・合言葉データをコピー";
  btn.style.padding="8px 16px";
  btn.style.fontSize="14px"; btn.style.cursor="pointer";

  btn.addEventListener("click", () => {
    if (typeof generateUpdateData === "function") {
      const dataStr = generateUpdateData();
      navigator.clipboard.writeText(dataStr)
        .then(()=>alert("コピーしました！\nこの内容を updateDataFull.js に上書きコミットしてください"))
        .catch(err=>alert("コピー失敗: "+err));
    } else {
      alert("generateUpdateData 関数が定義されていません");
    }
  });

  container.appendChild(btn);
  document.body.appendChild(container);
}

/* =========================
   Generate data for copy
========================= */
function generateUpdateData() {
  const data = {
    cards: cards.map(c => ({
      id:c.id, name:c.name, slots:c.slots, addPass:c.addPass,
      bg:c.bg, stampIcon:c.stampIcon, notifyMsg:c.notifyMsg, maxNotifyMsg:c.maxNotifyMsg
    })),
    keywords: keywords.map(k => ({
      cardId:k.cardId, word:k.word, enabled:k.enabled
    }))
  };
  return JSON.stringify(data,null,2);
}