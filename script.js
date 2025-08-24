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
  userUIColors: "userUIColors",
  userCardSerials: "userCardSerials"
};

const APP_VERSION = "v1.5.1";

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

let userName = localStorage.getItem(LS_KEYS.userName) || "";
let cards = loadJSON(LS_KEYS.cards, []);
let keywords = loadJSON(LS_KEYS.keywords, []);
let updates = loadJSON(LS_KEYS.updates, []); // array of {date: "YYYY年M月D日", text: "..."}, only admin adds
let userAddedCards = loadJSON(LS_KEYS.userAddedCards, []); // array of card.id (strings)
let userStampHistory = loadJSON(LS_KEYS.userStampHistory, []); // array of {cardId, slot, keyword, date}
let userUIColors = loadJSON(LS_KEYS.userUIColors, { text: "#c44a7b", bg: "#fff0f5", btn: "#ff99cc" });
let userCardSerials = loadJSON(LS_KEYS.userCardSerials, {}); // { userName: { cardId: serialNumber } }

function saveAll() {
  try {
    localStorage.setItem(LS_KEYS.userName, userName);
    saveJSON(LS_KEYS.cards, cards);
    saveJSON(LS_KEYS.keywords, keywords);
    saveJSON(LS_KEYS.updates, updates);
    saveJSON(LS_KEYS.userAddedCards, userAddedCards);
    saveJSON(LS_KEYS.userStampHistory, userStampHistory);
    saveJSON(LS_KEYS.userUIColors, userUIColors);
    saveJSON(LS_KEYS.userCardSerials, userCardSerials);
    localStorage.setItem(LS_KEYS.appVersion, APP_VERSION);
  } catch (e) {
    alert("データ保存に失敗しました");
    console.error(e);
  }
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

  // 初期表示
  cardTitle.textContent = userName ? `${userName}のスタンプカード` : "スタンプカード";
  userNameInput.value = userName;

  textColorPicker.value = userUIColors.text;
  bgColorPicker.value = userUIColors.bg;
  btnColorPicker.value = userUIColors.btn;

  applyUserColors();

  // 名前設定
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

    const card = cards.find(c => c.addPass === pass);
    if (!card) { alert("パスが違います"); return; }

    if (userAddedCards.includes(card.id)) {
      alert("すでに追加済みです");
      return;
    }

    // ユーザの追加カードリストに card.id を保存
    userAddedCards.push(card.id);

    // ユーザごとのカードシリアル（他ユーザと重複しない連番）
    if (!userCardSerials[userName]) userCardSerials[userName] = {};
    if (!userCardSerials[userName][card.id]) {
      // そのカードについて既に割り振られているシリアルの最大値を取り、+1する
      let max = 0;
      for (const uname in userCardSerials) {
        if (userCardSerials[uname] && userCardSerials[uname][card.id]) {
          const v = Number(userCardSerials[uname][card.id]) || 0;
          if (v > max) max = v;
        }
      }
      userCardSerials[userName][card.id] = max + 1;
    }

    saveAll();
    addCardPass.value = "";
    renderUserCards();
    renderHistory();
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

  // 1枚分のカード表示要素を作る（元のレイアウトを保つ）
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
      // 当該ユーザのスタンプ履歴にslotがあるか？
      if (userStampHistory.some(s => s.cardId === card.id && s.slot === i)) slot.classList.add("stamp-filled");
      grid.appendChild(slot);
    }
    container.appendChild(grid);

    const serial = document.createElement("div");
    serial.className = "serial";
    const sn = (userCardSerials[userName] && userCardSerials[userName][card.id]) ? userCardSerials[userName][card.id] : 0;
    serial.textContent = `No.${sn}`;
    container.appendChild(serial);

    const btn = document.createElement("button");
    btn.textContent = "スタンプを押す";
    btn.style.marginTop = "8px";
    btn.addEventListener("click", () => {
      const kw = prompt("スタンプ合言葉を入力してください");
      if (kw === null) return;
      const word = kw.trim();
      if (!word) { alert("合言葉を入力してください"); return; }

      // 合言葉オブジェクトをカードID基準で探す
      const keywordObj = keywords.find(k => String(k.cardId) === String(card.id) && k.word === word);
      if (!keywordObj) { alert("合言葉が違います"); return; }
      if (!keywordObj.enabled) { alert("この合言葉は無効です"); return; }

      // その合言葉で既に押してないか（1合言葉につき1回）
      if (userStampHistory.some(s => s.cardId === card.id && s.keyword === word)) {
        alert("この合言葉は既に使用済みです"); return;
      }

      // 空きスロットを探す（0から順に）
      let nextSlot = 0;
      while (userStampHistory.some(s => s.cardId === card.id && s.slot === nextSlot)) nextSlot++;
      if (nextSlot >= card.slots) { alert(card.maxNotifyMsg || "スタンプがMAXです"); return; }

      // 追加
      const now = new Date();
      const dateStr = now.toLocaleString();
      userStampHistory.push({ cardId: card.id, slot: nextSlot, keyword: word, date: dateStr });
      saveAll();
      alert(card.notifyMsg || "スタンプを押しました");
      renderUserCards();
      renderHistory();
    });
    container.appendChild(btn);

    // カードを自分の端末から削除するボタン（履歴も消す）
    const delBtn = document.createElement("button");
    delBtn.textContent = "カードを削除";
    delBtn.style.background = "#999";
    delBtn.style.marginLeft = "8px";
    delBtn.addEventListener("click", () => {
      if (!confirm("このカードを自分の端末から削除しますか？（履歴も消えます）")) return;
      userAddedCards = userAddedCards.filter(id => id !== card.id);
      userStampHistory = userStampHistory.filter(h => h.cardId !== card.id);
      saveAll();
      renderUserCards();
      renderHistory();
    });
    container.appendChild(delBtn);

    return container;
  }

  function renderUserCards() {
    // 管理者がカードを削除した場合など、存在しないカードIDは除去
    userAddedCards = userAddedCards.filter(id => cards.some(c => c.id === id));
    // 存在しないカードに紐づく履歴は消す
    userStampHistory = userStampHistory.filter(h => cards.some(c => c.id === h.cardId));
    saveAll();

    userCards.innerHTML = "";
    userAddedCards.forEach(id => {
      const card = cards.find(c => c.id === id);
      if (card) userCards.appendChild(renderUserCard(card));
    });
  }

  function renderHistory() {
    historyList.innerHTML = "";
    // 最新順で表示（後ろが新しい）
    [...userStampHistory].slice().reverse().forEach(s => {
      const card = cards.find(c => c.id === s.cardId);
      if (!card) return; // カードが存在しないなら履歴にも出さない
      const li = document.createElement("li");
      li.textContent = `${card.name} — ${s.date}`;
      historyList.appendChild(li);
    });
  }

  function renderUpdates() {
    updateLogs.innerHTML = "";
    updates.forEach(u => {
      const li = document.createElement("li");
      li.textContent = `${u.date} ${u.text}`;
      updateLogs.appendChild(li);
    });
  }

  // 初回レンダリング
  renderUserCards();
  renderHistory();
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

  const previewArea = document.getElementById("previewArea");

  function renderCardSelect() {
    keywordCardSelect.innerHTML = "";
    cards.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.name;
      keywordCardSelect.appendChild(opt);
    });
  }

  function renderAdminCards() {
    adminCards.innerHTML = "";
    cards.forEach(card => {
      const li = document.createElement("li");

      // info部分（元の見た目に合わせる）
      const info = document.createElement("div");
      info.className = "info";
      info.textContent = `${card.name} | ${card.addPass}`;

      li.appendChild(info);

      // 削除ボタン（管理者用） — これが無くなってた件、ここでしっかり出す
      const delBtn = document.createElement("button");
      delBtn.textContent = "削除";
      delBtn.addEventListener("click", () => {
        if (!confirm("このカードを削除しますか？（カードに紐づく合言葉・ユーザ履歴も削除されます）")) return;
        // カード削除
        cards = cards.filter(c => c.id !== card.id);
        // カードに紐づくキーワード削除
        keywords = keywords.filter(k => String(k.cardId) !== String(card.id));
        // ユーザ追加済みカードからも除去
        userAddedCards = userAddedCards.filter(id => id !== card.id);
        // ユーザスタンプ履歴からも除去
        userStampHistory = userStampHistory.filter(h => h.cardId !== card.id);
        // ユーザシリアル情報からも除去
        for (const uname in userCardSerials) {
          if (userCardSerials[uname] && userCardSerials[uname][card.id]) {
            delete userCardSerials[uname][card.id];
          }
        }
        saveAll();
        renderAdminCards();
        renderCardSelect();
      });
      li.appendChild(delBtn);

      adminCards.appendChild(li);
    });
  }

  function renderKeywordList() {
    keywordList.innerHTML = "";
    keywords.forEach((k, idx) => {
      const li = document.createElement("li");
      const cardName = (cards.find(c => c.id === k.cardId) || {}).name || k.cardId;
      li.textContent = `${cardName} : ${k.word} `;

      // 有効/無効のチェックボックス
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = !!k.enabled;
      checkbox.addEventListener("change", () => {
        k.enabled = checkbox.checked;
        saveAll();
      });
      li.appendChild(checkbox);

      // 削除ボタン
      const delBtn = document.createElement("button");
      delBtn.textContent = "削除";
      delBtn.addEventListener("click", () => {
        if (!confirm("この合言葉を削除しますか？")) return;
        keywords.splice(idx, 1);
        saveAll();
        renderKeywordList();
      });
      li.appendChild(delBtn);

      keywordList.appendChild(li);
    });
  }

  function renderUpdateLogs() {
    adminUpdateLogs.innerHTML = "";
    updates.forEach((u, idx) => {
      const div = document.createElement("div");
      div.textContent = `${u.date} ${u.text}`;

      // 管理者用：更新を消すボタン（ユーザー側でも反映される）
      const delBtn = document.createElement("button");
      delBtn.textContent = "消去";
      delBtn.style.marginLeft = "8px";
      delBtn.addEventListener("click", () => {
        if (!confirm("この更新を削除しますか？")) return;
        updates.splice(idx, 1);
        saveAll();
        renderUpdateLogs();
      });
      div.appendChild(delBtn);

      adminUpdateLogs.appendChild(div);
    });
  }

  previewCardBtn.addEventListener("click", () => {
    previewArea.innerHTML = "";
    const div = document.createElement("div");
    div.className = "card";
    if (cardBG.value) div.style.background = cardBG.value;
    const h3 = document.createElement("h3");
    h3.textContent = cardName.value || "プレビュー";
    div.appendChild(h3);
    const sCount = Number(cardSlots.value) || 5;
    for (let i = 0; i < sCount; i++) {
      const s = document.createElement("div");
      s.className = "stamp-slot";
      div.appendChild(s);
    }
    previewArea.appendChild(div);
  });

  previewClearBtn.addEventListener("click", () => { previewArea.innerHTML = ""; });

  createCardBtn.addEventListener("click", () => {
    if (!cardName.value.trim() || !addPass.value.trim()) { alert("カード名と追加パスは必須です"); return; }
    if (cards.find(c => c.addPass === addPass.value.trim())) { alert("追加パスが重複しています"); return; }
    const id = Date.now().toString();
    cards.push({
      id,
      name: cardName.value.trim(),
      slots: Number(cardSlots.value) || 5,
      addPass: addPass.value.trim(),
      notifyMsg: notifyMsg.value.trim(),
      maxNotifyMsg: maxNotifyMsg.value.trim(),
      bg: cardBG.value || "",
      stampIcon: stampIcon.value || ""
    });
    saveAll();
    renderAdminCards();
    renderCardSelect();
    alert("作成しました");
  });

  addKeywordBtn.addEventListener("click", () => {
    const selectedCardId = keywordCardSelect.value;
    const word = keywordInput.value.trim();
    if (!selectedCardId || !word) { alert("カードと合言葉を指定してください"); return; }
    // キーワードは cardId を参照する
    keywords.push({ cardId: selectedCardId, word: word, enabled: true });
    saveAll();
    renderKeywordList();
    keywordInput.value = "";
  });

  addUpdateBtn.addEventListener("click", () => {
    const text = updateInput.value.trim();
    if (!text) { alert("更新内容を入力してください"); return; }
    const now = new Date();
    const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
    updates.push({ date: dateStr, text: text });
    saveAll();
    renderUpdateLogs();
    updateInput.value = "";
  });

  // 初回レンダリング
  renderAdminCards();
  renderCardSelect();
  renderKeywordList();
  renderUpdateLogs();
}