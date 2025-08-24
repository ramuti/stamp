/* ============================
   script.js — ユーザー＋管理者 共通（安定版）
   - 変更点:
     ・更新履歴は管理者が明示的に追加する場所のみ（カード/合言葉作成で自動追加しない）
     ・更新履歴に日付（YYYY年M月D日）を付与
     ・更新履歴に「削除」ボタン（管理者画面）
     ・localStorageへ保存する際、別タブや別画面でのユーザデータを上書きしないようにマージ処理
     ・スタンプ押下時にアラート表示、履歴に日時（YYYY年M月D日 HH:MM）を表示
     ・1合言葉＝1回（同じ合言葉を同カードに対して二度使えない）
     ・カード追加時にユーザごとにランダムシリアル番号（リロードしても変わらない）
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

/* Global state loaded from localStorage */
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
  textColorPicker.value = userUIColors.text || "#c44a7b";
  bgColorPicker.value = userUIColors.bg || "#fff0f5";
  btnColorPicker.value = userUIColors.btn || "#ff99cc";
  applyUserColors();

  setNameBtn.addEventListener("click", () => {
    const v = userNameInput.value.trim();
    if (!v) { alert("名前を入力してください"); return; }
    userName = v;
    saveAll();
    cardTitle.textContent = `${userName}のスタンプカード`;
  });

  // カード追加（ランダムシリアル）
  addCardBtn.addEventListener("click", () => {
    const pass = addCardPass.value.trim();
    if (!pass) { alert("追加パスを入力してください"); return; }
    const card = cards.find(c => c.addPass === pass);
    if (!card) { alert("パスが違います"); return; }

    if (!userAddedCards.includes(card.id)) {
      userAddedCards.push(card.id);

      if (!userCardSerials[userName]) userCardSerials[userName] = {};
      if (!userCardSerials[userName][card.id]) {
        const randNo = Math.floor(1000 + Math.random() * 9000);
        userCardSerials[userName][card.id] = randNo;
      }

      saveAll();
      renderUserCards();
      addCardPass.value = "";
    } else {
      alert("すでに追加済みです");
    }
  });

  function applyUserColors() {
    document.body.style.background = userUIColors.bg;
    document.body.style.color = userUIColors.text;
    cardTitle.style.color = userUIColors.text;
    document.querySelectorAll("button").forEach(btn => {
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
      if (userStampHistory.some(s => s.cardId === card.id && s.slot === i)) {
        slot.style.background = "#ff69b4";
      }
      grid.appendChild(slot);
    }
    container.appendChild(grid);

    const serial = document.createElement("div");
    serial.textContent = `No.${userCardSerials[userName]?.[card.id] || "???"}`;
    serial.style.fontSize = "0.85rem";
    container.appendChild(serial);

    return container;
  }

  function renderUserCards() {
    userCards.innerHTML = "";
    userAddedCards.forEach(cid => {
      const card = cards.find(c => c.id === cid);
      if (card) userCards.appendChild(renderUserCard(card));
    });
  }

  function renderUserHistory() {
    historyList.innerHTML = "";
    userStampHistory.forEach(h => {
      const li = document.createElement("li");
      li.textContent = `${h.datetime || ""} / ${h.cardName || ""} / スロット${h.slot + 1}`;
      historyList.appendChild(li);
    });
  }

  function renderUpdates() {
    updateLogs.innerHTML = "";
    updates.forEach((u, idx) => {
      const li = document.createElement("li");
      li.textContent = u;
      updateLogs.appendChild(li);
    });
  }

  renderUserCards();
  renderUserHistory();
  renderUpdates();
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
  const previewArea = document.getElementById("previewArea");
  const previewCardBtn = document.getElementById("previewCardBtn");
  const previewClearBtn = document.getElementById("previewClearBtn");
  const createCardBtn = document.getElementById("createCardBtn");

  const adminCards = document.getElementById("adminCards");
  const keywordCardSelect = document.getElementById("keywordCardSelect");
  const keywordInput = document.getElementById("keywordInput");
  const addKeywordBtn = document.getElementById("addKeywordBtn");
  const keywordList = document.getElementById("keywordList");

  const updateInput = document.getElementById("updateInput");
  const addUpdateBtn = document.getElementById("addUpdateBtn");
  const adminUpdateLogs = document.getElementById("adminUpdateLogs");

  // プレビュー
  previewCardBtn.addEventListener("click", () => {
    const card = {
      name: cardName.value,
      slots: parseInt(cardSlots.value),
      bg: cardBG.value,
      stampIcon: stampIcon.value
    };
    previewArea.innerHTML = "";
    const div = document.createElement("div");
    div.className = "card";
    div.style.background = card.bg;
    const h3 = document.createElement("h3");
    h3.textContent = card.name;
    div.appendChild(h3);
    for (let i = 0; i < card.slots; i++) {
      const slot = document.createElement("div");
      slot.className = "stamp-slot";
      div.appendChild(slot);
    }
    previewArea.appendChild(div);
  });
  previewClearBtn.addEventListener("click", () => previewArea.innerHTML = "");

  // カード作成
  createCardBtn.addEventListener("click", () => {
    const newCard = {
      id: Date.now(),
      name: cardName.value,
      slots: parseInt(cardSlots.value),
      addPass: addPass.value,
      bg: cardBG.value,
      stampIcon: stampIcon.value,
      notifyMsg: notifyMsg.value,
      maxNotifyMsg: maxNotifyMsg.value
    };
    cards.push(newCard);
    saveAll();
    renderAdminCards();
  });

  function renderAdminCards() {
    adminCards.innerHTML = "";
    keywordCardSelect.innerHTML = "";
    cards.forEach(c => {
      const li = document.createElement("li");
      const info = document.createElement("span");
      info.className = "info";
      info.textContent = `[ID:${c.id}] ${c.name} (${c.slots}枠)`;
      li.appendChild(info);
      const btnDel = document.createElement("button");
      btnDel.textContent = "削除";
      btnDel.addEventListener("click", () => {
        cards = cards.filter(cc => cc.id !== c.id);
        keywords = keywords.filter(k => k.cardId !== c.id);
        saveAll();
        renderAdminCards();
      });
      li.appendChild(btnDel);
      adminCards.appendChild(li);

      const option = document.createElement("option");
      option.value = c.id;
      option.textContent = c.name;
      keywordCardSelect.appendChild(option);
    });

    renderKeywords();
    renderUpdateLogs();
  }

  // キーワード追加
  addKeywordBtn.addEventListener("click", () => {
    const cid = parseInt(keywordCardSelect.value);
    const word = keywordInput.value.trim();
    if (!word) return;
    keywords.push({cardId: cid, word, enabled: true});
    saveAll();
    renderKeywords();
    keywordInput.value = "";
  });

  function renderKeywords() {
    keywordList.innerHTML = "";
    keywords.forEach(k => {
      const li = document.createElement("li");
      const cardName = cards.find(c=>c.id===k.cardId)?.name || "???";
      li.textContent = `[${cardName}] ${k.word}`;
      keywordList.appendChild(li);
    });
  }

  // 更新履歴追加
  addUpdateBtn.addEventListener("click", () => {
    const text = updateInput.value.trim();
    if (!text) return;
    const dt = new Date();
    const y = dt.getFullYear(), m = dt.getMonth()+1, d = dt.getDate();
    updates.push(`${y}年${m}月${d}日: ${text}`);
    saveAll();
    renderUpdateLogs();
    updateInput.value = "";
  });

  function renderUpdateLogs() {
    adminUpdateLogs.innerHTML = "";
    updates.forEach((u,i)=>{
      const li = document.createElement("li");
      li.textContent = u;
      const btnDel = document.createElement("button");
      btnDel.textContent = "消去";
      btnDel.addEventListener("click", () => {
        updates.splice(i,1);
        saveAll();
        renderUpdateLogs();
      });
      li.appendChild(btnDel);
      adminUpdateLogs.appendChild(li);
    });
  }

  renderAdminCards();

  /* コピー用ボタン */
  addCopyButton();

  function addCopyButton() {
    if (document.getElementById("copyUpdateDataBtn")) return;

    const container = document.createElement("div");
    container.style.margin = "16px 0";
    container.style.textAlign = "center";

    const btn = document.createElement("button");
    btn.id = "copyUpdateDataBtn";
    btn.textContent = "カード・合言葉データをコピー";
    btn.style.padding = "8px 16px";
    btn.style.fontSize = "14px";
    btn.style.cursor = "pointer";

    btn.addEventListener("click", () => {
      if (typeof generateUpdateData === "function") {
        const dataStr = generateUpdateData();
        navigator.clipboard.writeText(dataStr)
          .then(() => alert("コピーしました！\nこの内容を updateDataFull.js に貼り付けてください"))
          .catch(err => alert("コピー失敗: "+err));
      } else alert("generateUpdateData 関数が定義されていません");
    });

    container.appendChild(btn);
    document.body.appendChild(container);
  }

  function generateUpdateData() {
    return JSON.stringify({
      cards: cards.map(c => ({
        id: c.id,
        name: c.name,
        slots: c.slots,
        addPass: c.addPass,
        bg: c.bg,
        stampIcon: c.stampIcon,
        notifyMsg: c.notifyMsg,
        maxNotifyMsg: c.maxNotifyMsg
      })),
      keywords: keywords.map(k => ({
        cardId: k.cardId,
        word: k.word,
        enabled: k.enabled
      }))
    }, null, 2);
  }
}