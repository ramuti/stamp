/* ============================
   script.js — ユーザー＋管理者 共通
   ============================ */

/* --- 初期ロードするデータ／キー --- */
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

/* load helper */
function loadJSON(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch(e){ return fallback; }
}
function saveJSON(key, obj) { localStorage.setItem(key, JSON.stringify(obj)); }

/* app state */
let userName = localStorage.getItem(LS_KEYS.userName) || "";
let cards = loadJSON(LS_KEYS.cards, []);
let keywords = loadJSON(LS_KEYS.keywords, []);
let updates = loadJSON(LS_KEYS.updates, []);
let userAddedCards = loadJSON(LS_KEYS.userAddedCards, []);
let userStampHistory = loadJSON(LS_KEYS.userStampHistory, []);

/* save all */
function saveAll() {
  try {
    localStorage.setItem(LS_KEYS.userName, userName);
    saveJSON(LS_KEYS.cards, cards);
    saveJSON(LS_KEYS.keywords, keywords);
    saveJSON(LS_KEYS.updates, updates);
    saveJSON(LS_KEYS.userAddedCards, userAddedCards);
    saveJSON(LS_KEYS.userStampHistory, userStampHistory);
    localStorage.setItem(LS_KEYS.appVersion, APP_VERSION);
  } catch (e) {
    alert("データ保存に失敗しました。");
    console.error(e);
  }
}

/* DOM ready init */
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

  cardTitle.textContent = userName ? `${userName}のスタンプカード` : "スタンプカード";
  userNameInput.value = userName;

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
    if (!userAddedCards.includes(card.id)) {
      userAddedCards.push(card.id);
      saveJSON(LS_KEYS.userAddedCards, userAddedCards);
      renderUserCards();
      addCardPass.value = "";
    } else { alert("すでに追加済みです"); }
  });

  function renderUserCard(card) {
    const container = document.createElement("div");
    container.className = "card";
    container.dataset.id = card.id;

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
      if (kw === null) return;
      const word = kw.trim();
      if (!word) { alert("合言葉を入力してください"); return; }

      const keywordObj = keywords.find(k => String(k.cardId) === String(card.id) && k.word === word && k.active);
      if (!keywordObj) { alert("合言葉が違うか無効です"); return; }

      const usedSameKeyword = userStampHistory.some(s => s.cardId === card.id && s.keyword === word);
      if (usedSameKeyword) { alert("もう押してあります"); return; }

      let nextSlot = 0;
      while (userStampHistory.some(s => s.cardId === card.id && s.slot === nextSlot)) nextSlot++;
      if (nextSlot >= card.slots) { alert(card.maxNotifyMsg || "スタンプがMAXです"); return; }

      userStampHistory.push({ cardId: card.id, slot: nextSlot, keyword: word, date: new Date().toLocaleString() });
      saveJSON(LS_KEYS.userStampHistory, userStampHistory);
      renderUserCards();
      updateHistory();
      alert(card.notifyMsg || "スタンプを押しました！");
    });
    container.appendChild(btn);

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
      updateHistory();
    });
    container.appendChild(delBtn);

    return container;
  }

  function renderUserCards() {
    userCards.innerHTML = "";
    userAddedCards.forEach(id => {
      const card = cards.find(c => c.id === id);
      if (card) userCards.appendChild(renderUserCard(card));
    });
  }

  function updateHistory() {
    historyList.innerHTML = "";
    [...userStampHistory].reverse().forEach(h => {
      const card = cards.find(c => c.id === h.cardId);
      if (!card) return;
      const li = document.createElement("li");
      li.textContent = `${card.name} — ${h.date}`;
      historyList.appendChild(li);
    });
    updateLogs.innerHTML = "";
    updates.slice().reverse().forEach(u => {
      const div = document.createElement("div");
      div.textContent = u;
      updateLogs.appendChild(div);
    });
  }

  function genSerialForUser() { return (userStampHistory.length + 1).toString().padStart(5, "0"); }

  renderUserCards();
  updateHistory();
}

/* ============================
   管理者側
   ============================ */
function initAdmin() {
  const cardName = document.getElementById("cardName");
  const cardSlots = document.getElementById("cardSlots");
  const notifyMsg = document.getElementById("notifyMsg");
  const maxNotifyMsg = document.getElementById("maxNotifyMsg");
  const addPass = document.getElementById("addPass");
  const cardBG = document.getElementById("cardBG");
  const stampIcon = document.getElementById("stampIcon");
  const createCardBtn = document.getElementById("createCardBtn");
  const previewArea = document.getElementById("previewArea");
  const adminCards = document.getElementById("adminCards");
  const keywordCardSelect = document.getElementById("keywordCardSelect");
  const keywordInput = document.getElementById("keywordInput");
  const addKeywordBtn = document.getElementById("addKeywordBtn");
  const keywordList = document.getElementById("keywordList");
  const updateInput = document.getElementById("updateInput");
  const addUpdateBtn = document.getElementById("addUpdateBtn");
  const adminUpdateLogs = document.getElementById("adminUpdateLogs");
  const previewClearBtn = document.getElementById("previewClearBtn");

  function refreshCardListUI() {
    adminCards.innerHTML = "";
    cards.forEach(c => {
      const li = document.createElement("li");
      const left = document.createElement("div");
      left.style.flex = "1";
      left.innerText = `${c.name} | パス:${c.addPass} | 枠:${c.slots}`;
      li.appendChild(left);

      const btns = document.createElement("div");

      const pbtn = document.createElement("button");
      pbtn.textContent = "プレビュー";
      pbtn.style.background = "#ff7f7f";
      pbtn.addEventListener("click", () => { renderPreview(c); });
      btns.appendChild(pbtn);

      const copyBtn = document.createElement("button");
      copyBtn.textContent = "コピー";
      copyBtn.style.background = "#4a90e2";
      copyBtn.addEventListener("click", () => { navigator.clipboard.writeText(c.addPass).then(()=> alert("追加パスをコピーしました")); });
      btns.appendChild(copyBtn);

      const delBtn = document.createElement("button");
      delBtn.textContent = "消去";
      delBtn.style.background = "#999";
      delBtn.addEventListener("click", () => {
        if (!confirm("このカードを完全に削除しますか？")) return;
        cards = cards.filter(x => x.id !== c.id);
        keywords = keywords.filter(k => k.cardId !== c.id);
        userAddedCards = userAddedCards.filter(id => id !== c.id);
        userStampHistory = userStampHistory.filter(h => h.cardId !== c.id);
        saveAll();
        refreshCardListUI();
        refreshKeywordList();
        refreshUpdates();
      });
      btns.appendChild(delBtn);

      li.appendChild(btns);
      adminCards.appendChild(li);
    });

    keywordCardSelect.innerHTML = "";
    cards.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.name;
      keywordCardSelect.appendChild(opt);
    });
  }

  function renderPreview(card) {
    previewArea.innerHTML = "";
    const d = document.createElement("div");
    d.className = "card";
    d.innerHTML = `<h3>${card.name}（プレビュー）</h3>`;
    const slotWrap = document.createElement("div");
    for (let i=0;i<card.slots;i++){
      const s = document.createElement("div");
      s.className = "stamp-slot";
      slotWrap.appendChild(s);
    }
    d.appendChild(slotWrap);
    previewArea.appendChild(d);
  }

  function refreshKeywordList(){
    keywordList.innerHTML = "";
    keywords.forEach(k => {
      const li = document.createElement("li");
      const card = cards.find(c => c.id === k.cardId);
      li.innerHTML = `<div style="flex:1">${card ? card.name : "(カードなし)"} | ${k.word} | ${k.active ? "有効" : "無効"}</div>`;
      const btns = document.createElement("div");
      const toggle = document.createElement("button");
      toggle.textContent = k.active ? "無効化" : "有効化";
      toggle.addEventListener("click", () => { k.active=!k.active; saveAll(); refreshKeywordList(); });
      btns.appendChild(toggle);
      const del = document.createElement("button");
      del.textContent = "消去";
      del.style.background = "#999";
      del.addEventListener("click", () => {
        const removeStamps = confirm("この合言葉で押されたユーザーのスタンプも削除しますか？");
        if(removeStamps) userStampHistory = userStampHistory.filter(h => h.keyword!==k.word || h.cardId!==k.cardId);
        keywords = keywords.filter(x=>x!==k);
        saveAll(); refreshKeywordList();
      });
      btns.appendChild(del);
      li.appendChild(btns);
      keywordList.appendChild(li);
    });
  }

  function refreshUpdates(){
    adminUpdateLogs.innerHTML = "";
    updates.slice().reverse().forEach(u=>{
      const d = document.createElement("div"); d.textContent=u;
      adminUpdateLogs.appendChild(d);
    });
  }

  createCardBtn.addEventListener("click",()=>{
    const name = (cardName.value||"").trim();
    const slots = parseInt(cardSlots.value,10);
    const pass = (addPass.value||"").trim();
    if(!name){ alert("カード名を入力してください"); return; }
    if(!slots||slots<=0){ alert("枠数を正しく入力してください"); return; }
    if(!pass){ alert("追加パスは必須です"); return; }
    if(cards.some(c=>c.addPass===pass)){ alert("その追加パスは既に使われています"); return; }

    const newCard = { id: Date.now(), name, slots, addPass: pass,
      notifyMsg:(notifyMsg.value||"").trim(),
      maxNotifyMsg:(maxNotifyMsg.value||"").trim(),
      bg:(cardBG.value||"").trim(),
      stampImg:(stampIcon.value||"").trim() };

    cards.push(newCard);
    saveJSON(LS_KEYS.cards, cards); 
    refreshCardListUI();
    refreshKeywordList();
    refreshUpdates();

    cardName.value=""; cardSlots.value="5"; addPass.value=""; notifyMsg.value=""; maxNotifyMsg.value=""; cardBG.value=""; stampIcon.value="";
  });

  addKeywordBtn.addEventListener("click",()=>{
    const cardId = parseInt(keywordCardSelect.value);
    const word = (keywordInput.value||"").trim();
    if(!word){ alert("合言葉を入力してください"); return; }
    if(!cards.some(c=>c.id===cardId)){ alert("カードが見つかりません"); return; }
    keywords.push({ cardId, word, active:true });
    saveJSON(LS_KEYS.keywords, keywords); 
    keywordInput.value="";
    refreshKeywordList();
  });

  addUpdateBtn.addEventListener("click",()=>{
    const val = (updateInput.value||"").trim();
    if(!val) return;
    updates.push(val); saveJSON(LS_KEYS.updates, updates); updateInput.value="";
    refreshUpdates();
  });

  previewClearBtn.addEventListener("click",()=>{ previewArea.innerHTML=""; });

  refreshCardListUI(); refreshKeywordList(); refreshUpdates();
}