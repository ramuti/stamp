/* ============================
   script.js — ユーザー＋管理者 共通（安定版）
   - 変更点:
     ・更新履歴は管理者が明示的に追加する場所のみ（カード/合言葉作成で自動追加しない）
     ・更新履歴に日付（YYYY年M月D日）を付与
     ・更新履歴に「削除」ボタンを復帰（管理者画面）
     ・localStorageへ保存する際、別タブや別画面でのユーザデータを上書きしないようにマージ処理を導入（ユーザが追加したカードが消えない）
     ・スタンプ押下時にアラート表示、履歴に日時（YYYY年M月D日 HH:MM）を表示
     ・1合言葉＝1回（同じ合言葉を同カードに対して二度使えない）
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
  // Unique by cardId + slot + word + datetime (if datetime present)
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
  // Keep existing values where present; add missing ones from current.
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

/* Central save function that merges critical user-specific data to avoid overwrites */
function saveAll() {
  try {
    // Always save these straightforward things (cards/keywords/updates should reflect current admin actions)
    localStorage.setItem(LS_KEYS.appVersion, APP_VERSION);
    localStorage.setItem(LS_KEYS.userName, userName);

    // Save cards/keywords/updates as-is (admin pages intentionally modify these)
    saveJSON(LS_KEYS.cards, cards);
    saveJSON(LS_KEYS.keywords, keywords);
    saveJSON(LS_KEYS.updates, updates);

    // For user-specific structures, merge with existing localStorage to avoid overwriting changes from other tabs
    // userAddedCards:
    const existingUserAdded = loadJSON(LS_KEYS.userAddedCards, []);
    const mergedUserAdded = mergeUniqueArray(existingUserAdded, userAddedCards);
    saveJSON(LS_KEYS.userAddedCards, mergedUserAdded);
    userAddedCards = mergedUserAdded;

    // userStampHistory:
    const existingHistory = loadJSON(LS_KEYS.userStampHistory, []);
    const mergedHistory = mergeStampHistories(existingHistory, userStampHistory);
    saveJSON(LS_KEYS.userStampHistory, mergedHistory);
    userStampHistory = mergedHistory;

    // userCardSerials:
    const existingSerials = loadJSON(LS_KEYS.userCardSerials, {});
    const mergedSerials = mergeUserCardSerials(existingSerials, userCardSerials);
    saveJSON(LS_KEYS.userCardSerials, mergedSerials);
    userCardSerials = mergedSerials;

    // userUIColors - merge so other pages' colors don't get lost; current page's choice takes precedence
    const existingColors = loadJSON(LS_KEYS.userUIColors, {text:"#c44a7b",bg:"#fff0f5",btn:"#ff99cc"});
    const mergedColors = Object.assign({}, existingColors, userUIColors || {});
    saveJSON(LS_KEYS.userUIColors, mergedColors);
    userUIColors = mergedColors;

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
   ユーザー画面（initUser）
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

  // Initialize UI values
  cardTitle.textContent = userName ? `${userName}のスタンプカード` : "スタンプカード";
  userNameInput.value = userName;
  textColorPicker.value = userUIColors.text || "#c44a7b";
  bgColorPicker.value = userUIColors.bg || "#fff0f5";
  btnColorPicker.value = userUIColors.btn || "#ff99cc";
  applyUserColors();

  // 名前変更
  setNameBtn.addEventListener("click", () => {
    const v = userNameInput.value.trim();
    if (!v) { alert("名前を入力してください"); return; }
    userName = v;
    saveAll();
    cardTitle.textContent = `${userName}のスタンプカード`;
  });

  // カード追加（追加パス）
  addCardBtn.addEventListener("click", () => {
    const pass = addCardPass.value.trim();
    if (!pass) { alert("追加パスを入力してください"); return; }
    // find card by addPass (exact match)
    const card = cards.find(c => c.addPass === pass);
    if (!card) { alert("パスが違います"); return; }
    if (!userAddedCards.includes(card.id)) {
      // Add card id
      userAddedCards.push(card.id);

      // generate user-specific serial if not exists
      if (!userCardSerials[userName]) userCardSerials[userName] = {};
      if (!userCardSerials[userName][card.id]) {
        // compute max serial among existing entries for that card.id across users
        const existingSerials = Object.values(userCardSerials).map(u => u[card.id] || 0);
        const maxSerial = existingSerials.length ? Math.max(...existingSerials) : 0;
        userCardSerials[userName][card.id] = maxSerial + 1;
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

  // Color pickers change
  textColorPicker.addEventListener("input", () => {
    userUIColors.text = textColorPicker.value; saveAll(); applyUserColors();
  });
  bgColorPicker.addEventListener("input", () => {
    userUIColors.bg = bgColorPicker.value; saveAll(); applyUserColors();
  });
  btnColorPicker.addEventListener("input", () => {
    userUIColors.btn = btnColorPicker.value; saveAll(); applyUserColors();
  });

  // render a single card for user
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
    const serialNum = (userCardSerials[userName] && userCardSerials[userName][card.id]) ? userCardSerials[userName][card.id] : 0;
    serial.textContent = `No.${serialNum}`;
    container.appendChild(serial);

    // スタンプボタン
    const btn = document.createElement("button");
    btn.textContent = "スタンプを押す";
    btn.style.marginTop = "8px";
    btn.addEventListener("click", () => {
      const kw = prompt("スタンプ合言葉を入力してください");
      if (kw === null) return;
      const word = kw.trim();
      if (!word) { alert("合言葉を入力してください"); return; }

      // find keyword for this card with exact match and check enabled
      const keywordObj = keywords.find(k => String(k.cardId) === String(card.id) && k.word === word);
      if (!keywordObj) {
        alert("合言葉が違います");
        return;
      }
      if (!keywordObj.enabled) {
        alert("この合言葉は無効です");
        return;
      }

      // 1合言葉1回：同じ合言葉が同カードですでに使われていないか（この端末の履歴に対して）
      if (userStampHistory.some(s => s.cardId === card.id && s.word === word)) {
        alert("この合言葉は既に使用済みです");
        return;
      }

      // next available slot (append behavior)
      const nextSlot = userStampHistory.filter(s => s.cardId === card.id).length;
      if (nextSlot >= card.slots) { alert("すでにMAXです"); return; }

      // datetime formatted
      const now = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      const datetime = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日 ${pad(now.getHours())}:${pad(now.getMinutes())}`;

      // push stamp record
      userStampHistory.push({ cardId: card.id, slot: nextSlot, word: word, datetime: datetime });
      saveAll();

      alert("スタンプを押しました");

      renderUserCards();
      renderHistory();
    });
    container.appendChild(btn);

    return container;
  }

  // Render all user cards (and clean up stale ones)
  function renderUserCards() {
    // Remove userAddedCards entries for cards that no longer exist
    userAddedCards = userAddedCards.filter(id => cards.some(c => c.id === id));
    // Remove stampHistory entries that belong to non-existing cards
    userStampHistory = userStampHistory.filter(s => cards.some(c => c.id === s.cardId));
    saveAll();

    userCards.innerHTML = "";
    userAddedCards.forEach(id => {
      const card = cards.find(c => c.id === id);
      if (card) userCards.appendChild(renderUserCard(card));
    });

    renderHistory();
  }

  // Render history list
  function renderHistory() {
    historyList.innerHTML = "";
    userStampHistory.forEach(s => {
      const card = cards.find(c => c.id === s.cardId);
      if (card) {
        const li = document.createElement("li");
        li.textContent = `${card.name} スタンプ${s.slot+1} ${s.datetime || ""}`;
        historyList.appendChild(li);
      }
    });
  }

  // Render updates (read-only on user side)
  function renderUpdates() {
    updateLogs.innerHTML = "";
    updates.forEach(u => {
      const li = document.createElement("li");
      li.textContent = `${u.date} ${u.msg}`;
      updateLogs.appendChild(li);
    });
  }

  // initial render
  renderUserCards();
  renderUpdates();
}

/* =========================
   管理者画面（initAdmin）
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

  // Render card list and options
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
        if (!confirm("削除しますか？")) return;
        // Remove card from cards
        cards = cards.filter(x => x.id !== c.id);
        // Also reflect on user side: remove card from userAddedCards, remove card serials and stamps
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

      // add option to select for keyword creation
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.name;
      keywordCardSelect.appendChild(opt);
    });
  }

  // Render keywords list with toggle and delete
  function renderKeywords() {
    keywordList.innerHTML = "";
    keywords.forEach((k, idx) => {
      const li = document.createElement("li");
      const cardName = cards.find(c => c.id === k.cardId)?.name || k.cardId;
      li.textContent = `[${cardName}] ${k.word} (${k.enabled ? "有効" : "無効"})`;

      const toggleBtn = document.createElement("button");
      toggleBtn.textContent = k.enabled ? "無効にする" : "有効にする";
      toggleBtn.addEventListener("click", () => {
        k.enabled = !k.enabled;
        saveAll();
        renderKeywords();
      });
      li.appendChild(toggleBtn);

      const delBtn = document.createElement("button");
      delBtn.textContent = "削除";
      delBtn.addEventListener("click", () => {
        if (!confirm("削除しますか？")) return;
        keywords.splice(idx, 1);
        saveAll();
        renderKeywords();
      });
      li.appendChild(delBtn);

      keywordList.appendChild(li);
    });
  }

  // Render updates with delete button (admin only)
  function renderUpdates() {
    adminUpdateLogs.innerHTML = "";
    updates.forEach((u, idx) => {
      const li = document.createElement("li");
      li.textContent = `${u.date} ${u.msg}`;

      const delBtn = document.createElement("button");
      delBtn.textContent = "削除";
      delBtn.addEventListener("click", () => {
        if (!confirm("この更新履歴を削除しますか？")) return;
        updates.splice(idx, 1);
        saveAll();
        renderUpdates();
      });
      li.appendChild(delBtn);

      adminUpdateLogs.appendChild(li);
    });
  }

  // preview handlers
  previewCardBtn.addEventListener("click", () => {
    previewArea.innerHTML = "";
    const div = document.createElement("div");
    div.className = "card"; div.style.background = cardBG.value;
    const h3 = document.createElement("h3"); h3.textContent = cardName.value; div.appendChild(h3);
    for (let i = 0; i < cardSlots.value; i++) {
      const s = document.createElement("div"); s.className = "stamp-slot"; div.appendChild(s);
    }
    previewArea.appendChild(div);
  });
  previewClearBtn.addEventListener("click", () => { previewArea.innerHTML = ""; });

  // create card (DO NOT create updates automatically)
  createCardBtn.addEventListener("click", () => {
    if (!cardName.value.trim() || !addPass.value.trim()) { alert("カード名と追加パスは必須"); return; }
    const id = "c" + Date.now().toString();
    cards.push({
      id,
      name: cardName.value.trim(),
      slots: Number(cardSlots.value) || 5,
      addPass: addPass.value.trim(),
      bg: cardBG.value,
      stampIcon: stampIcon.value || "",
      notifyMsg: notifyMsg.value.trim(),
      maxNotifyMsg: maxNotifyMsg.value.trim()
    });
    // saveAll merges user data so user-added cards are not overwritten by admin actions
    saveAll();
    renderAdminCards();
  });

  // add keyword (DO NOT create updates automatically)
  addKeywordBtn.addEventListener("click", () => {
    const cardId = keywordCardSelect.value;
    const word = keywordInput.value.trim();
    if (!cardId || !word) { alert("カードと合言葉を指定してください"); return; }
    keywords.push({ cardId: cardId, word: word, enabled: true });
    saveAll();
    renderKeywords();
    keywordInput.value = "";
  });

  // add update (admin explicit action — this is the only way to add updates)
  addUpdateBtn.addEventListener("click", () => {
    const msg = updateInput.value.trim();
    if (!msg) { alert("更新内容を入力してください"); return; }
    const now = new Date();
    const dateStr = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日`;
    updates.push({ date: dateStr, msg: msg });
    saveAll();
    renderUpdates();
    updateInput.value = "";
  });

    // initial render
  renderAdminCards();
  renderKeywords();
  renderUpdates();

 // ——— コピー用ボタン追加 ———
addCopyButton();

// コピー用ボタン関数（ページ下部に追加される版）
function addCopyButton() {
  if (document.getElementById("copyUpdateDataBtn")) return; // すでにあればスキップ

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
      const dataStr = generateUpdateData(); // 文字列生成
      navigator.clipboard.writeText(dataStr)
        .then(() => alert("コピーしました！\nこの内容を generateUpdateData.js に上書きコミットしてください"))
        .catch(err => alert("コピー失敗: " + err));
    } else {
      alert("generateUpdateData 関数が定義されていません");
    }
  });

  container.appendChild(btn);

  // ページの一番下に追加
  document.body.appendChild(container);
}

// ——— コピー用データ生成関数 ———
function generateUpdateData() {
  const data = {
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
  };
  return JSON.stringify(data, null, 2);
}