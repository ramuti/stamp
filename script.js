/* ============================
   script.js — ユーザー＋管理者 完全版
   - 更新履歴・カード・キーワード・ユーザー追加対応
   - カードシリアル番号ランダム生成（リロード保持）
   - localStorage保存・マージ対応
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

/* helpers */
function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch(e){return fallback;}
}
function saveJSON(key, obj) { localStorage.setItem(key, JSON.stringify(obj)); }

function mergeUniqueArray(existing, current) {
  const set = new Set(existing || []);
  (current || []).forEach(v => set.add(v));
  return Array.from(set);
}
function mergeStampHistories(existing, current) {
  const map = new Map();
  (existing||[]).concat(current||[]).forEach(e=>{
    const key = `${e.cardId}||${e.slot}||${e.word||""}||${e.datetime||""}`;
    if(!map.has(key)) map.set(key,e);
  });
  return Array.from(map.values());
}
function mergeUserCardSerials(existing, current) {
  const merged = JSON.parse(JSON.stringify(existing||{}));
  for(const user in (current||{})){
    if(!merged[user]) merged[user]={};
    for(const cid in current[user]){
      if(merged[user][cid]===undefined || merged[user][cid]===null){
        merged[user][cid]=current[user][cid];
      }
    }
  }
  return merged;
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

/* Save all data */
function saveAll(){
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
  userUIColors = Object.assign({}, existingColors, userUIColors||{});
  saveJSON(LS_KEYS.userUIColors, userUIColors);
}

/* DOM ready */
document.addEventListener("DOMContentLoaded", ()=>{
  const body = document.body;
  if(body.classList.contains("user")) initUser();
  if(body.classList.contains("admin")) initAdmin();
});

/* =========================
   ユーザー画面
========================= */
function initUser(){
  const userNameInput = document.getElementById("userNameInput");
  const setNameBtn = document.getElementById("setNameBtn");
  const cardTitle = document.getElementById("cardTitle");
  const addCardPass = document.getElementById("addCardPass");
  const addCardBtn = document.getElementById("addCardBtn");
  const userCards = document.getElementById("userCards");
  const historyList = document.getElementById("stampHistory");
  const updateLogs = document.getElementById("updateLogs");

  const textColorPicker = document.getElementById("textColor");
  const bgColorPicker = document.getElementById("bgColor");
  const btnColorPicker = document.getElementById("btnColor");

  if(userNameInput) userNameInput.value = userName;
  if(cardTitle) cardTitle.textContent = userName?`${userName}のスタンプカード`:"スタンプカード";

  function applyUserColors(){
    document.body.style.background = userUIColors.bg;
    document.body.style.color = userUIColors.text;
    if(cardTitle) cardTitle.style.color = userUIColors.text;
    document.querySelectorAll("button").forEach(btn=>{
      btn.style.background = userUIColors.btn;
      btn.style.color = userUIColors.text;
    });
  }
  applyUserColors();

  if(textColorPicker) textColorPicker.addEventListener("input", ()=>{userUIColors.text=textColorPicker.value;saveAll();applyUserColors();});
  if(bgColorPicker) bgColorPicker.addEventListener("input", ()=>{userUIColors.bg=bgColorPicker.value;saveAll();applyUserColors();});
  if(btnColorPicker) btnColorPicker.addEventListener("input", ()=>{userUIColors.btn=btnColorPicker.value;saveAll();applyUserColors();});

  if(setNameBtn && userNameInput){
    setNameBtn.addEventListener("click", ()=>{
      const v = userNameInput.value.trim();
      if(!v){alert("名前を入力してください");return;}
      userName = v; saveAll();
      if(cardTitle) cardTitle.textContent=`${userName}のスタンプカード`;
    });
  }

  function renderUserCard(card){
    const container = document.createElement("div");
    container.className="card";
    container.dataset.id=card.id;
    if(card.bg) container.style.background=card.bg;

    const title=document.createElement("h3");
    title.textContent=card.name;
    container.appendChild(title);

    const grid=document.createElement("div");
    grid.style.marginBottom="8px";
    for(let i=0;i<card.slots;i++){
      const slot=document.createElement("div");
      slot.className="stamp-slot";
      if(userStampHistory.some(s=>s.cardId===card.id && s.slot===i)) slot.style.background="#ff69b4";
      grid.appendChild(slot);
    }
    container.appendChild(grid);

    const serial = document.createElement("div");
    serial.textContent=`No.${userCardSerials[userName]?.[card.id] || "???"}`;
    serial.style.fontSize="0.85rem";
    container.appendChild(serial);

    return container;
  }

  function renderUserCards(){
    if(!userCards) return;
    userCards.innerHTML="";
    userAddedCards.forEach(cid=>{
      const card = cards.find(c=>c.id===cid);
      if(card) userCards.appendChild(renderUserCard(card));
    });
  }

  function renderUserHistory(){
    if(!historyList) return;
    historyList.innerHTML="";
    userStampHistory.forEach(h=>{
      const li=document.createElement("li");
      li.textContent=`${h.datetime||""} / ${h.cardName||""} / スロット${h.slot+1}`;
      historyList.appendChild(li);
    });
  }

  function renderUpdates(){
    if(!updateLogs) return;
    updateLogs.innerHTML="";
    updates.forEach(u=>{
      const li=document.createElement("li"); li.textContent=u;
      updateLogs.appendChild(li);
    });
  }

  if(addCardBtn && addCardPass){
    addCardBtn.addEventListener("click", ()=>{
      const pass = addCardPass.value.trim();
      if(!pass){alert("追加パスを入力してください");return;}
      const card = cards.find(c=>c.addPass===pass);
      if(!card){alert("パスが違います");return;}

      if(!userAddedCards.includes(card.id)){
        userAddedCards.push(card.id);
        if(!userCardSerials[userName]) userCardSerials[userName]={};
        if(!userCardSerials[userName][card.id]){
          const randNo = Math.floor(1000+Math.random()*9000);
          userCardSerials[userName][card.id]=randNo;
        }
        saveAll(); renderUserCards();
        addCardPass.value="";
      } else alert("すでに追加済みです");
    });
  }

  renderUserCards();
  renderUserHistory();
  renderUpdates();
}

/* =========================
   管理者画面
========================= */
function initAdmin(){
  const cardName=document.getElementById("cardName");
  const cardSlots=document.getElementById("cardSlots");
  const addPass=document.getElementById("addPass");
  const notifyMsg=document.getElementById("notifyMsg");
  const maxNotifyMsg=document.getElementById("maxNotifyMsg");
  const cardBG=document.getElementById("cardBG");
  const stampIcon=document.getElementById("stampIcon");
  const previewArea=document.getElementById("previewArea");
  const previewCardBtn=document.getElementById("previewCardBtn");
  const previewClearBtn=document.getElementById("previewClearBtn");
  const createCardBtn=document.getElementById("createCardBtn");

  const adminCards=document.getElementById("adminCards");
  const keywordCardSelect=document.getElementById("keywordCardSelect");
  const keywordInput=document.getElementById("keywordInput");
  const addKeywordBtn=document.getElementById("addKeywordBtn");
  const keywordList=document.getElementById("keywordList");

  const updateInput=document.getElementById("updateInput");
  const addUpdateBtn=document.getElementById("addUpdateBtn");
  const adminUpdateLogs=document.getElementById("adminUpdateLogs");

  // プレビュー
  if(previewCardBtn) previewCardBtn.addEventListener("click", ()=>{
    const card={name:cardName.value,slots:parseInt(cardSlots.value),bg:cardBG.value,stampIcon:stampIcon.value};
    previewArea.innerHTML="";
    const div=document.createElement("div");
    div.className="card"; div.style.background=card.bg;
    const h3=document.createElement("h3"); h3.textContent=card.name; div.appendChild(h3);
    for(let i=0;i<card.slots;i++){
      const slot=document.createElement("div"); slot.className="stamp-slot"; div.appendChild(slot);
    }
    previewArea.appendChild(div);
  });
  if(previewClearBtn) previewClearBtn.addEventListener("click", ()=>previewArea.innerHTML="");

  // カード作成
  if(createCardBtn) createCardBtn.addEventListener("click", ()=>{
    const newCard={
      id:Date.now(),
      name:cardName.value,
      slots:parseInt(cardSlots.value),
      addPass:addPass.value,
      bg:cardBG.value,
      stampIcon:stampIcon.value,
      notifyMsg:notifyMsg.value,
      maxNotifyMsg:maxNotifyMsg.value
    };
    cards.push(newCard); saveAll(); renderAdminCards();
  });

  function renderAdminCards(){
    if(!adminCards) return;
    adminCards.innerHTML="";
    if(!keywordCardSelect) return;
    keywordCardSelect.innerHTML="";
    cards.forEach(c=>{
      const li=document.createElement("li");
      const info=document.createElement("span"); info.className="info";
      info.textContent=`[ID:${c.id}] ${c.name} (${c.slots}枠)`; li.appendChild(info);
      const btnDel=document.createElement("button"); btnDel.textContent="削除";
      btnDel.addEventListener("click", ()=>{
        cards=cards.filter(cc=>cc.id!==c.id);
        keywords=keywords.filter(k=>k.cardId!==c.id);
        saveAll(); renderAdminCards();
      });
      li.appendChild(btnDel); adminCards.appendChild(li);

      const option=document.createElement("option");
      option.value=c.id; option.textContent=c.name; keywordCardSelect.appendChild(option);
    });
    renderKeywords(); renderUpdateLogs();
  }

  // キーワード追加
  if(addKeywordBtn && keywordCardSelect && keywordInput){
    addKeywordBtn.addEventListener("click", ()=>{
      const cid=parseInt(keywordCardSelect.value);
      const word=keywordInput.value.trim(); if(!word) return;
      keywords.push({cardId:cid,word,enabled:true});
      saveAll(); renderKeywords(); keywordInput.value="";
    });
  }

  function renderKeywords(){
    if(!keywordList) return; keywordList.innerHTML="";
    keywords.forEach(k=>{
      const li=document.createElement("li");
      const cName=cards.find(c=>c.id===k.cardId)?.name||"???";
      li.textContent=`[${cName}] ${k.word}`;
      keywordList.appendChild(li);
    });
  }

  // 更新履歴追加
  if(addUpdateBtn && updateInput && adminUpdateLogs){
    addUpdateBtn.addEventListener("click", ()=>{
      const text=updateInput.value.trim(); if(!text) return;
      const dt=new Date();
      const y=dt.getFullYear(), m=dt.getMonth()+1, d=dt.getDate();
      updates.push(`${y}年${m}月${d}日: ${text}`);
      saveAll(); renderUpdateLogs(); updateInput.value="";
    });
  }

  function renderUpdateLogs(){
    if(!adminUpdateLogs) return; adminUpdateLogs.innerHTML="";
    updates.forEach((u,i)=>{
      const li=document.createElement("li"); li.textContent=u;
      const btnDel=document.createElement("button"); btnDel.textContent="消去";
      btnDel.addEventListener("click", ()=>{
        updates.splice(i,1); saveAll(); renderUpdateLogs();
      });
      li.appendChild(btnDel); adminUpdateLogs.appendChild(li);
    });
  }

  renderAdminCards();

  // コピー用ボタン
  addCopyButton();
  function addCopyButton(){
    if(document.getElementById("copyUpdateDataBtn")) return;
    const container=document.createElement("div");
    container.style.margin="16px 0"; container.style.textAlign="center";
    const btn=document.createElement("button"); btn.id="copyUpdateDataBtn";
    btn.textContent="カード・合言葉データをコピー"; btn.style.padding="8px 16px";
    btn.style.fontSize="14px"; btn.style.cursor="pointer";
    btn.addEventListener("click", ()=>{
      const dataStr=generateUpdateData();
      navigator.clipboard.writeText(dataStr)
        .then(()=>alert("コピーしました！\nこの内容を updateDataFull.js に貼り付けてください"))
        .catch(err=>alert("コピー失敗: "+err));
    });
    container.appendChild(btn); document.body.appendChild(container);
  }

  function generateUpdateData(){
    return JSON.stringify({
      cards: cards.map(c=>({
        id:c.id,name:c.name,slots:c.slots,addPass:c.addPass,bg:c.bg,
        stampIcon:c.stampIcon,notifyMsg:c.notifyMsg,maxNotifyMsg:c.maxNotifyMsg
      })),
      keywords: keywords.map(k=>({cardId:k.cardId,word:k.word,enabled:k.enabled}))
    },null,2);
  }
}