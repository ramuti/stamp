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
  userStampHistory: "userStampHistory",
  userUIColors: "userUIColors"
};

const APP_VERSION = "v1.0.0";

/* load/save helper */
function loadJSON(key, fallback){
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch(e){ return fallback; }
}
function saveJSON(key,obj){ localStorage.setItem(key, JSON.stringify(obj)); }

/* app state */
let userName = localStorage.getItem(LS_KEYS.userName) || "";
let cards = loadJSON(LS_KEYS.cards, []);
let keywords = loadJSON(LS_KEYS.keywords, []);
let updates = loadJSON(LS_KEYS.updates, []);
let userAddedCards = loadJSON(LS_KEYS.userAddedCards, []);
let userStampHistory = loadJSON(LS_KEYS.userStampHistory, []);

/* UIカラー設定 */
let userUIColors = loadJSON(LS_KEYS.userUIColors, {
  background: "#fff0f5",
  button: "#ff99cc",
  text: "#c44a7b"
});

/* save all */
function saveAll(){
  try{
    localStorage.setItem(LS_KEYS.userName,userName);
    saveJSON(LS_KEYS.cards,cards);
    saveJSON(LS_KEYS.keywords,keywords);
    saveJSON(LS_KEYS.updates,updates);
    saveJSON(LS_KEYS.userAddedCards,userAddedCards);
    saveJSON(LS_KEYS.userStampHistory,userStampHistory);
    saveJSON(LS_KEYS.userUIColors,userUIColors);
    localStorage.setItem(LS_KEYS.appVersion,APP_VERSION);
  }catch(e){ console.error(e); alert("データ保存に失敗しました"); }
}

/* DOM ready init */
document.addEventListener("DOMContentLoaded",()=>{
  const body=document.body;
  body.style.backgroundColor=userUIColors.background;

  if(body.classList.contains("user")) initUser();
  if(body.classList.contains("admin")) initAdmin();
});

/* ============================
   ユーザー側
   ============================ */
function initUser(){
  const setNameBtn = document.getElementById("setNameBtn");
  const userNameInput = document.getElementById("userNameInput");
  const cardTitle = document.getElementById("cardTitle");
  const addCardBtn = document.getElementById("addCardBtn");
  const addCardPass = document.getElementById("addCardPass");
  const userCards = document.getElementById("userCards");
  const historyList = document.getElementById("stampHistory");
  const updateLogs = document.getElementById("updateLogs");

  const bgPicker = document.getElementById("bgColorPicker");
  const btnColorPicker = document.getElementById("btnColorPicker");
  const textColorPicker = document.getElementById("textColorPicker");

  // 初期UI色
  document.body.style.backgroundColor = userUIColors.background;
  setGlobalButtonColor(userUIColors.button);
  setGlobalTextColor(userUIColors.text);

  cardTitle.textContent = userName ? `${userName}のスタンプカード` : "スタンプカード";
  userNameInput.value = userName;

  setNameBtn.addEventListener("click",()=>{
    const v = userNameInput.value.trim();
    if(!v){ alert("名前を入力してください"); return; }
    userName = v; saveAll();
    cardTitle.textContent = `${userName}のスタンプカード`;
  });

  addCardBtn.addEventListener("click",()=>{
    const pass = addCardPass.value.trim();
    if(!pass){ alert("パスを入力してください"); return; }
    const card = cards.find(c=>c.addPass===pass);
    if(!card){ alert("パスが間違っています"); return; }
    if(!userAddedCards.includes(card.id)){
      userAddedCards.push(card.id);
      saveJSON(LS_KEYS.userAddedCards,userAddedCards);
      renderUserCards();
      addCardPass.value="";
    } else { alert("すでに追加済みです"); }
  });

  /* ====================
     カード表示
     ==================== */
  function renderUserCard(card){
    const container = document.createElement("div");
    container.className = "card";
    container.dataset.id = card.id;
    container.style.background = card.bg || "#fff0f5";

    const title = document.createElement("h3");
    title.textContent = card.name;
    container.appendChild(title);

    const grid = document.createElement("div");
    grid.style.marginBottom = "8px";
    for(let i=0;i<card.slots;i++){
      const slot = document.createElement("div");
      slot.className = "stamp-slot";
      if(userStampHistory.some(s=>s.cardId===card.id && s.slot===i)) slot.classList.add("stamp-filled");
      grid.appendChild(slot);
    }
    container.appendChild(grid);

    const serial = document.createElement("div");
    serial.className="serial";
    serial.textContent=genSerialForUser();
    container.appendChild(serial);

    const btn = document.createElement("button");
    btn.textContent="スタンプを押す";
    btn.style.marginTop="8px";
    btn.style.backgroundColor = userUIColors.button;
    btn.style.color = userUIColors.text;
    btn.addEventListener("click",()=>{
      const kw = prompt("スタンプ合言葉を入力してください");
      if(kw===null) return;
      const word = kw.trim();
      if(!word){ alert("合言葉を入力してください"); return; }

      const keywordObj = keywords.find(k=>String(k.cardId)===String(card.id) && k.word===word && k.active);
      if(!keywordObj){ alert("合言葉が違うか無効です"); return; }

      const usedSameKeyword = userStampHistory.some(s=>s.cardId===card.id && s.keyword===word);
      if(usedSameKeyword){ alert("もう押してあります"); return; }

      let nextSlot = 0;
      while(userStampHistory.some(s=>s.cardId===card.id && s.slot===nextSlot)) nextSlot++;
      if(nextSlot >= card.slots){ alert(card.maxNotifyMsg||"スタンプがMAXです"); return; }

      userStampHistory.push({ cardId: card.id, slot: nextSlot, keyword: word, date: new Date().toLocaleString() });
      saveJSON(LS_KEYS.userStampHistory,userStampHistory);
      renderUserCards();
      renderStampHistory();
      renderUpdateLogs();
      alert(card.notifyMsg||"スタンプを押しました！");
    });
    container.appendChild(btn);

    const delBtn = document.createElement("button");
    delBtn.textContent="カードを削除";
    delBtn.style.background="#999";
    delBtn.style.marginLeft="8px";
    delBtn.style.color="#fff";
    delBtn.addEventListener("click",()=>{
      if(!confirm("このカードを自分の端末から削除しますか？（履歴も消えます）")) return;
      userAddedCards=userAddedCards.filter(id=>id!==card.id);
      userStampHistory=userStampHistory.filter(h=>h.cardId!==card.id);
      saveAll();
      renderUserCards();
      renderStampHistory();
    });
    container.appendChild(delBtn);

    return container;
  }

  function renderUserCards(){
    userCards.innerHTML="";
    userAddedCards.forEach(id=>{
      const card = cards.find(c=>c.id===id);
      if(card) userCards.appendChild(renderUserCard(card));
    });
  }

  /* ====================
     履歴表示
     ==================== */
  function renderStampHistory(){
    historyList.innerHTML="";
    [...userStampHistory].reverse().forEach(h=>{
      const card = cards.find(c=>c.id===h.cardId);
      if(!card) return;
      const li = document.createElement("li");
      li.textContent = `${card.name} — ${h.date}`;
      li.style.color = userUIColors.text; // ← 文字色適用
      historyList.appendChild(li);
    });
  }

  function renderUpdateLogs(){
    updateLogs.innerHTML="";
    [...updates].reverse().forEach(u=>{
      const div=document.createElement("div");
      div.textContent=u;
      div.style.color = userUIColors.text; // ← 文字色適用
      updateLogs.appendChild(div);
    });
  }

  /* ====================
     UIカラー変更
     ==================== */
  function setGlobalButtonColor(color){
    document.querySelectorAll("button").forEach(b=>{
      b.style.backgroundColor=color;
    });
  }

  function setGlobalTextColor(color){
    // タイトル、履歴、ボタン文字など
    document.body.style.color=color;
    document.querySelectorAll("button").forEach(b=>{
      b.style.color=color;
    });
    renderStampHistory();
    renderUpdateLogs();
  }

  /* ====================
     カラーピッカーイベント
     ==================== */
  bgPicker.addEventListener("input",(e)=>{
    userUIColors.background=e.target.value;
    document.body.style.backgroundColor=e.target.value;
    saveJSON(LS_KEYS.userUIColors,userUIColors);
  });
  btnColorPicker.addEventListener("input",(e)=>{
    userUIColors.button=e.target.value;
    setGlobalButtonColor(e.target.value);
    saveJSON(LS_KEYS.userUIColors,userUIColors);
  });
  textColorPicker.addEventListener("input",(e)=>{
    userUIColors.text=e.target.value;
    setGlobalTextColor(e.target.value);
    saveJSON(LS_KEYS.userUIColors,userUIColors);
  });

  function genSerialForUser(){ return (userStampHistory.length+1).toString().padStart(5,"0"); }

  renderUserCards();
  renderStampHistory();
  renderUpdateLogs();
}

/* ============================
   管理者側
   ============================ */
function initAdmin(){
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
  const previewCardBtn = document.getElementById("previewCardBtn");

  /* -------------------------
      カード一覧更新
     ------------------------- */
  function refreshCardListUI(){
    adminCards.innerHTML="";
    cards.forEach(c=>{
      const li = document.createElement("li");

      const info = document.createElement("div");
      info.className="info";
      info.textContent=`${c.name} | ${c.addPass}`;
      li.appendChild(info);

      const btns = document.createElement("div");
      btns.className="btns";

      const pbtn = document.createElement("button");
      pbtn.textContent="プレビュー";
      pbtn.style.background="#ff7f7f";
      pbtn.addEventListener("click",()=>{ renderPreview(c); });
      btns.appendChild(pbtn);

      const delBtn = document.createElement("button");
      delBtn.textContent="消去";
      delBtn.style.background="#999";
      delBtn.addEventListener("click",()=>{
        if(!confirm("このカードを完全に削除しますか？")) return;
        cards = cards.filter(x=>x.id!==c.id);
        keywords = keywords.filter(k=>k.cardId!==c.id);
        userAddedCards = userAddedCards.filter(id=>id!==c.id);
        userStampHistory = userStampHistory.filter(h=>h.cardId!==c.id);
        saveAll();
        refreshCardListUI();
        refreshKeywordList();
        refreshUpdates();
      });
      btns.appendChild(delBtn);

      li.appendChild(btns);
      adminCards.appendChild(li);
    });

    keywordCardSelect.innerHTML="";
    cards.forEach(c=>{
      const opt = document.createElement("option");
      opt.value=c.id;
      opt.textContent=c.name;
      keywordCardSelect.appendChild(opt);
    });
  }

  /* -------------------------
      プレビュー表示
     ------------------------- */
  function renderPreview(card){
    previewArea.innerHTML="";
    const div = document.createElement("div");
    div.className="card";
    div.style.background=card.bg||"#fff0f5";

    const title = document.createElement("h3");
    title.textContent=card.name;
    div.appendChild(title);

    for(let i=0;i<card.slots;i++){
      const slot=document.createElement("div");
      slot.className="stamp-slot";
      div.appendChild(slot);
    }

    previewArea.appendChild(div);
  }

  previewCardBtn.addEventListener("click",()=>{
    const c = {
      name: cardName.value,
      slots: Number(cardSlots.value),
      bg: cardBG.value
    };
    renderPreview(c);
  });
  previewClearBtn.addEventListener("click",()=>{ previewArea.innerHTML=""; });

  createCardBtn.addEventListener("click",()=>{
    if(!cardName.value.trim()){ alert("カード名を入力してください"); return; }
    const newCard = {
      id: Date.now(),
      name: cardName.value.trim(),
      slots: Number(cardSlots.value),
      notifyMsg: notifyMsg.value,
      maxNotifyMsg: maxNotifyMsg.value,
      addPass: addPass.value.trim(),
      bg: cardBG.value,
      stampIcon: stampIcon.value
    };
    cards.push(newCard);
    saveAll();
    refreshCardListUI();
    cardName.value=""; cardSlots.value=5; notifyMsg.value=""; maxNotifyMsg.value=""; addPass.value=""; cardBG.value="#fff0f5"; stampIcon.value="";
  });

  /* -------------------------
      キーワード管理
     ------------------------- */
  function refreshKeywordList(){
    keywordList.innerHTML="";
    keywords.forEach(k=>{
      const li=document.createElement("li");
      const card = cards.find(c=>c.id===k.cardId);
      li.textContent=`${card?card.name:"(削除済み)"}: ${k.word}`;
      const delBtn=document.createElement("button");
      delBtn.textContent="消去";
      delBtn.style.background="#999";
      delBtn.style.color="#fff";
      delBtn.addEventListener("click",()=>{ keywords = keywords.filter(x=>x!==k); saveJSON(LS_KEYS.keywords,keywords); refreshKeywordList(); });
      li.appendChild(delBtn);
      keywordList.appendChild(li);
    });
  }
  addKeywordBtn.addEventListener("click",()=>{
    const cardId=Number(keywordCardSelect.value);
    const word=keywordInput.value.trim();
    if(!word){ alert("合言葉を入力してください"); return; }
    keywords.push({cardId,word,active:true});
    saveJSON(LS_KEYS.keywords,keywords);
    refreshKeywordList();
    keywordInput.value="";
  });

  /* -------------------------
      更新履歴管理
     ------------------------- */
  function refreshUpdates(){
    adminUpdateLogs.innerHTML="";
    updates.forEach(u=>{
      const div=document.createElement("div");
      div.textContent=u;
      adminUpdateLogs.appendChild(div);
    });
  }
  addUpdateBtn.addEventListener("click",()=>{
    const text=updateInput.value.trim();
    if(!text){ alert("入力してください"); return; }
    updates.push(text);
    saveJSON(LS_KEYS.updates,updates);
    refreshUpdates();
    updateInput.value="";
  });

  refreshCardListUI();
  refreshKeywordList();
  refreshUpdates();
}