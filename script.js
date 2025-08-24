/* ============================
   script.js — ユーザー＋管理者 共通（安定版）
   - 管理者用コピーボタンも含む
   - 既存仕様は変更なし
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
  if(userNameInput) userNameInput.value = userName;
  applyUserColors();

  if(setNameBtn){
    setNameBtn.addEventListener("click", () => {
      const v = userNameInput.value.trim();
      if (!v) { alert("名前を入力してください"); return; }
      userName = v;
      saveAll();
      cardTitle.textContent = `${userName}のスタンプカード`;
    });
  }

  if(addCardBtn){
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

        saveAll();
        renderUserCards();
        addCardPass.value = "";
      } else alert("すでに追加済みです");
    });
  }

  function applyUserColors() {
    document.body.style.background = userUIColors.bg;
    document.body.style.color = userUIColors.text;
    if(cardTitle) cardTitle.style.color = userUIColors.text;
    document.querySelectorAll("button").forEach(btn => {
      btn.style.background = userUIColors.btn;
      btn.style.color = userUIColors.text;
    });
  }

  [textColorPicker,bgColorPicker,btnColorPicker].forEach(picker=>{
    if(!picker) return;
    picker.addEventListener("input", ()=>{
      if(picker===textColorPicker) userUIColors.text=picker.value;
      if(picker===bgColorPicker) userUIColors.bg=picker.value;
      if(picker===btnColorPicker) userUIColors.btn=picker.value;
      saveAll(); applyUserColors();
    });
  });

  function renderUserCard(card){
    const container = document.createElement("div");
    container.className="card"; container.dataset.id=card.id;
    if(card.bg) container.style.background=card.bg;

    const title = document.createElement("h3");
    title.textContent = card.name;
    container.appendChild(title);

    const grid = document.createElement("div"); grid.style.marginBottom="8px";
    for(let i=0;i<card.slots;i++){
      const slot = document.createElement("div");
      slot.className="stamp-slot";
      if(userStampHistory.some(s=>s.cardId===card.id && s.slot===i)) slot.classList.add("stamp-filled");
      grid.appendChild(slot);
    }
    container.appendChild(grid);

    const serial = document.createElement("div"); serial.className="serial";
    const serialNum=(userCardSerials[userName] && userCardSerials[userName][card.id]) ? userCardSerials[userName][card.id] : 0;
    serial.textContent=`No.${serialNum}`;
    container.appendChild(serial);

    const btn = document.createElement("button"); btn.textContent="スタンプを押す"; btn.style.marginTop="8px";
    btn.addEventListener("click", ()=>{
      const kw = prompt("スタンプ合言葉を入力してください"); if(kw===null) return;
      const word = kw.trim(); if(!word){ alert("合言葉を入力してください"); return; }

      const keywordObj=keywords.find(k=>String(k.cardId)===String(card.id) && k.word===word);
      if(!keywordObj){ alert("合言葉が違います"); return; }
      if(!keywordObj.enabled){ alert("この合言葉は無効です"); return; }
      if(userStampHistory.some(s=>s.cardId===card.id && s.word===word)){ alert("この合言葉は既に使用済みです"); return; }

      const nextSlot=userStampHistory.filter(s=>s.cardId===card.id).length;
      if(nextSlot>=card.slots){ alert("すでにMAXです"); return; }

      const now=new Date(); const pad=n=>String(n).padStart(2,"0");
      const datetime=`${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日 ${pad(now.getHours())}:${pad(now.getMinutes())}`;
      userStampHistory.push({cardId:card.id,slot:nextSlot,word:word,datetime:datetime});
      saveAll(); alert("スタンプを押しました");

      renderUserCards(); renderHistory();
    });
    container.appendChild(btn);

    return container;
  }

  function renderUserCards(){
    userAddedCards=userAddedCards.filter(id=>cards.some(c=>c.id===id));
    userStampHistory=userStampHistory.filter(s=>cards.some(c=>c.id===s.cardId));
    saveAll();

    if(!userCards) return; userCards.innerHTML="";
    userAddedCards.forEach(id=>{
      const card=cards.find(c=>c.id===id);
      if(card) userCards.appendChild(renderUserCard(card));
    });

    renderHistory();
  }

  function renderHistory(){
    if(!historyList) return; historyList.innerHTML="";
    userStampHistory.forEach(s=>{
      const card=cards.find(c=>c.id===s.cardId);
      if(card){
        const li=document.createElement("li");
        li.textContent=`${card.name} スタンプ${s.slot+1} ${s.datetime||""}`;
        historyList.appendChild(li);
      }
    });
  }

  function renderUpdates(){
    if(!updateLogs) return; updateLogs.innerHTML="";
    updates.forEach(u=>{
      const li=document.createElement("li"); li.textContent=`${u.date} ${u.msg}`;
      updateLogs.appendChild(li);
    });
  }

  renderUserCards(); renderUpdates();
}

/* =========================
   管理者画面
========================= */
function initAdmin(){
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
  const adminCardsList = document.getElementById("adminCards");
  const keywordCardSelect = document.getElementById("keywordCardSelect");
  const keywordInput = document.getElementById("keywordInput");
  const addKeywordBtn = document.getElementById("addKeywordBtn");
  const adminKeywordList = document.getElementById("keywordList");
  const updateInput = document.getElementById("updateInput");
  const addUpdateBtn = document.getElementById("addUpdateBtn");
  const adminUpdateLogs = document.getElementById("adminUpdateLogs");

  function renderCardPreview(card){
    previewArea.innerHTML="";
    const div=document.createElement("div"); div.className="card"; div.style.background=card.bg;
    const h=document.createElement("h3"); h.textContent=card.name; div.appendChild(h);
    const grid=document.createElement("div");
    for(let i=0;i<card.slots;i++){ const s=document.createElement("div"); s.className="stamp-slot"; grid.appendChild(s); }
    div.appendChild(grid);
    if(card.stampIcon){ const img=document.createElement("img"); img.src=card.stampIcon; img.style.width="24px"; img.style.height="24px"; div.appendChild(img); }
    previewArea.appendChild(div);
  }

  if(previewCardBtn){
    previewCardBtn.addEventListener("click", ()=>{
      const card={name:cardName.value,slots:Number(cardSlots.value),bg:cardBG.value,stampIcon:stampIcon.value};
      renderCardPreview(card);
    });
  }
  if(previewClearBtn) previewClearBtn.addEventListener("click", ()=>{ previewArea.innerHTML=""; });

  function renderAdminCards(){
    adminCardsList.innerHTML="";
    keywordCardSelect.innerHTML="";
    cards.forEach(c=>{
      const li=document.createElement("li");
      const info=document.createElement("span"); info.className="info"; info.textContent=`${c.name} (枠:${c.slots})`;
      li.appendChild(info);

      const delBtn=document.createElement("button"); delBtn.textContent="削除";
      delBtn.addEventListener("click", ()=>{
        if(!confirm("削除してもよいですか？")) return;
        cards=cards.filter(x=>x.id!==c.id);
        keywords=keywords.filter(k=>k.cardId!==c.id);
        saveAll(); renderAdminCards(); renderAdminKeywords();
      });
      li.appendChild(delBtn);
      adminCardsList.appendChild(li);

      const option=document.createElement("option"); option.value=c.id; option.textContent=c.name;
      keywordCardSelect.appendChild(option);
    });
  }

  function renderAdminKeywords(){
    adminKeywordList.innerHTML="";
    keywords.forEach(k=>{
      const li=document.createElement("li");
      const cardName = cards.find(c=>c.id===k.cardId)?.name || "(削除済み)";
      li.textContent=`${cardName} : ${k.word} [${k.enabled?"有効":"無効"}]`;

      const toggleBtn=document.createElement("button"); toggleBtn.textContent="切替";
      toggleBtn.addEventListener("click", ()=>{
        k.enabled=!k.enabled; saveAll(); renderAdminKeywords();
      });
      li.appendChild(toggleBtn);

      const delBtn=document.createElement("button"); delBtn.textContent="削除";
      delBtn.addEventListener("click", ()=>{
        if(!confirm("削除してもよいですか？")) return;
        keywords=keywords.filter(x=>x!==k); saveAll(); renderAdminKeywords();
      });
      li.appendChild(delBtn);

      adminKeywordList.appendChild(li);
    });
  }

  function renderAdminUpdates(){
    adminUpdateLogs.innerHTML="";
    updates.forEach(u=>{
      const li=document.createElement("li"); li.textContent=`${u.date} ${u.msg}`;
      adminUpdateLogs.appendChild(li);
    });
  }

  if(createCardBtn){
    createCardBtn.addEventListener("click", ()=>{
      const name=cardName.value.trim();
      if(!name){ alert("カード名を入力してください"); return; }
      const slots=Number(cardSlots.value); if(!slots){ alert("枠数を入力してください"); return; }
      const id=Date.now().toString();
      const newCard={id,name,slots,addPass:addPass.value.trim(),bg:cardBG.value,stampIcon:stampIcon.value,notifyMsg:notifyMsg.value,maxNotifyMsg:maxNotifyMsg.value};
      cards.push(newCard); saveAll(); renderAdminCards();
    });
  }

  if(addKeywordBtn){
    addKeywordBtn.addEventListener("click", ()=>{
      const cardId=keywordCardSelect.value;
      const word=keywordInput.value.trim();
      if(!cardId||!word){ alert("カードと合言葉を入力してください"); return; }
      keywords.push({cardId,word,enabled:true}); saveAll(); renderAdminKeywords();
    });
  }

  if(addUpdateBtn){
    addUpdateBtn.addEventListener("click", ()=>{
      const msg=updateInput.value.trim(); if(!msg){ alert("更新内容を入力してください"); return; }
      const now=new Date(); const pad=n=>String(n).padStart(2,"0");
      const date=`${now.getFullYear()}/${pad(now.getMonth()+1)}/${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
      updates.push({date,msg}); saveAll(); renderAdminUpdates();
    });
  }

  /* コピー用ボタン */
  addCopyButton();

  renderAdminCards(); renderAdminKeywords(); renderAdminUpdates();
}

/* =========================
   コピー用ボタン関数
========================= */
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
        .then(() => alert("コピーしました！\nこの内容を generateUpdateData.js に上書きコミットしてください"))
        .catch(err => alert("コピー失敗: " + err));
    } else alert("generateUpdateData 関数が定義されていません");
  });

  container.appendChild(btn);
  document.body.appendChild(container);
}

/* コピー用データ生成 */
function generateUpdateData() {
  const data = {
    cards: cards.map(c=>({
      id:c.id,name:c.name,slots:c.slots,addPass:c.addPass,bg:c.bg,
      stampIcon:c.stampIcon,notifyMsg:c.notifyMsg,maxNotifyMsg:c.maxNotifyMsg
    })),
    keywords: keywords.map(k=>({
      cardId:k.cardId,word:k.word,enabled:k.enabled
    }))
  };
  return JSON.stringify(data,null,2);
}