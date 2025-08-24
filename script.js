/* ============================
   script.js — ユーザー＋管理者 完全版
   - 既存仕様を変更しない
   - 管理側表示:
      ・カード一覧 … 「カード名 \ 追加パス \ [削除]」
      ・合言葉 … 「カード名 合言葉名 [有効/無効] [削除]」
      ・更新履歴 … 「YYYY年M月D日 更新内容 [消去]」※確認ダイアログなし
   - ユーザー側:
      ・名前変更/追加パス追加ボタンが反応
      ・カード追加時 No.は乱数(4桁)をユーザー×カードで一度だけ割当＆保持
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

/* ---------- helpers ---------- */
function loadJSON(key, fallback){
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } 
  catch(e){ return fallback; }
}
function saveJSON(key,obj){ localStorage.setItem(key, JSON.stringify(obj)); }
function mergeUniqueArray(existing,current){ return Array.from(new Set((existing||[]).concat(current||[]))); }
function mergeStampHistories(existing,current){
  const map=new Map();
  (existing||[]).concat(current||[]).forEach(e=>{
    const key=`${e.cardId}||${e.slot}||${e.word||""}||${e.datetime||""}`;
    if(!map.has(key)) map.set(key,e);
  });
  return Array.from(map.values());
}
function mergeUserCardSerials(existing,current){
  const merged=JSON.parse(JSON.stringify(existing||{}));
  for(const user in (current||{})){
    if(!merged[user]) merged[user]={};
    for(const cid in current[user]){
      if(merged[user][cid]===undefined) merged[user][cid]=current[user][cid];
    }
  }
  return merged;
}

/* ---------- Global state ---------- */
let userName = localStorage.getItem(LS_KEYS.userName) || "";
let cards = loadJSON(LS_KEYS.cards, []);
let keywords = loadJSON(LS_KEYS.keywords, []);
let updates = loadJSON(LS_KEYS.updates, []);
let userAddedCards = loadJSON(LS_KEYS.userAddedCards, []);
let userStampHistory = loadJSON(LS_KEYS.userStampHistory, []);
let userUIColors = loadJSON(LS_KEYS.userUIColors,{text:"#c44a7b",bg:"#fff0f5",btn:"#ff99cc"});
let userCardSerials = loadJSON(LS_KEYS.userCardSerials, {});

/* ---------- Save all ---------- */
function saveAll(){
  localStorage.setItem(LS_KEYS.appVersion, APP_VERSION);
  localStorage.setItem(LS_KEYS.userName,userName);
  saveJSON(LS_KEYS.cards,cards);
  saveJSON(LS_KEYS.keywords,keywords);
  saveJSON(LS_KEYS.updates,updates);
  userAddedCards=mergeUniqueArray(loadJSON(LS_KEYS.userAddedCards,[]),userAddedCards);
  saveJSON(LS_KEYS.userAddedCards,userAddedCards);
  userStampHistory=mergeStampHistories(loadJSON(LS_KEYS.userStampHistory,[]),userStampHistory);
  saveJSON(LS_KEYS.userStampHistory,userStampHistory);
  userCardSerials=mergeUserCardSerials(loadJSON(LS_KEYS.userCardSerials,{}),userCardSerials);
  saveJSON(LS_KEYS.userCardSerials,userCardSerials);
  userUIColors=Object.assign({},loadJSON(LS_KEYS.userUIColors,{text:"#c44a7b",bg:"#fff0f5",btn:"#ff99cc"}),userUIColors||{});
  saveJSON(LS_KEYS.userUIColors,userUIColors);
}

/* ---------- DOM Ready ---------- */
document.addEventListener("DOMContentLoaded",()=>{
  const body=document.body;
  if(body.classList.contains("user")) initUser();
  if(body.classList.contains("admin")) initAdmin();
});

/* =========================
   ユーザー画面
========================= */
function initUser(){
  const el={
    userNameInput:document.getElementById("userNameInput"),
    setNameBtn:document.getElementById("setNameBtn"),
    cardTitle:document.getElementById("cardTitle"),
    addCardPass:document.getElementById("addCardPass"),
    addCardBtn:document.getElementById("addCardBtn"),
    userCards:document.getElementById("userCards"),
    historyList:document.getElementById("stampHistory"),
    updateLogs:document.getElementById("updateLogs"),
    textColor:document.getElementById("textColor"),
    bgColor:document.getElementById("bgColor"),
    btnColor:document.getElementById("btnColor")
  };

  if(el.userNameInput) el.userNameInput.value=userName;
  if(el.cardTitle) el.cardTitle.textContent=userName?`${userName}のスタンプカード`:"スタンプカード";

  function applyUserColors(){
    document.body.style.background=userUIColors.bg;
    document.body.style.color=userUIColors.text;
    if(el.cardTitle) el.cardTitle.style.color=userUIColors.text;
    document.querySelectorAll("button").forEach(b=>{ b.style.background=userUIColors.btn; b.style.color=userUIColors.text; });
  }
  applyUserColors();
  if(el.textColor) el.textColor.addEventListener("input",()=>{ userUIColors.text=el.textColor.value; saveAll(); applyUserColors(); });
  if(el.bgColor) el.bgColor.addEventListener("input",()=>{ userUIColors.bg=el.bgColor.value; saveAll(); applyUserColors(); });
  if(el.btnColor) el.btnColor.addEventListener("input",()=>{ userUIColors.btn=el.btnColor.value; saveAll(); applyUserColors(); });

  if(el.setNameBtn && el.userNameInput){
    el.setNameBtn.addEventListener("click",()=>{
      const v=el.userNameInput.value.trim();
      if(!v){ alert("名前を入力してください"); return; }
      userName=v; saveAll();
      if(el.cardTitle) el.cardTitle.textContent=`${userName}のスタンプカード`;
      renderUserCards();
    });
  }

  function ensureSerialOnce(cardId){
    if(!userName) return 0;
    if(!userCardSerials[userName]) userCardSerials[userName]={};
    if(!userCardSerials[userName][cardId]){
      userCardSerials[userName][cardId]=Math.floor(1000+Math.random()*9000);
      saveAll();
    }
    return userCardSerials[userName][cardId];
  }

  function renderUserCard(card){
    const box=document.createElement("div");
    box.className="card"; box.dataset.id=card.id;
    if(card.bg) box.style.background=card.bg;
    const h3=document.createElement("h3"); h3.textContent=card.name; box.appendChild(h3);

    const grid=document.createElement("div"); grid.style.marginBottom="8px";
    for(let i=0;i<card.slots;i++){
      const s=document.createElement("div"); s.className="stamp-slot";
      if(userStampHistory.some(x=>x.cardId===card.id&&x.slot===i)) s.style.background="#ff69b4";
      grid.appendChild(s);
    }
    box.appendChild(grid);
    const serial=document.createElement("div"); serial.textContent=`No.${ensureSerialOnce(card.id)||"????"}`; serial.style.fontSize="0.85rem";
    box.appendChild(serial);
    return box;
  }

  function renderUserCards(){
    if(!el.userCards) return;
    userAddedCards=userAddedCards.filter(id=>cards.some(c=>c.id===id));
    saveAll();
    el.userCards.innerHTML="";
    userAddedCards.forEach(cid=>{
      const c=cards.find(x=>x.id===cid);
      if(c) el.userCards.appendChild(renderUserCard(c));
    });
  }

  function renderHistory(){
    if(!el.historyList) return;
    el.historyList.innerHTML="";
    userStampHistory.forEach(h=>{
      const li=document.createElement("li");
      const cardName=(cards.find(c=>c.id===h.cardId)?.name)||"";
      li.textContent=`${cardName} スタンプ${(h.slot||0)+1} ${h.datetime||""}`;
      el.historyList.appendChild(li);
    });
  }

  function renderUpdates(){
    if(!el.updateLogs) return;
    el.updateLogs.innerHTML="";
    (updates||[]).forEach(u=>{
      let text=typeof u==="string"?u:`${u.date||""} ${u.msg||""}`;
      const li=document.createElement("li"); li.textContent=text;
      el.updateLogs.appendChild(li);
    });
  }

  if(el.addCardBtn && el.addCardPass){
    el.addCardBtn.addEventListener("click",()=>{
      const pass=el.addCardPass.value.trim();
      if(!pass){ alert("追加パスを入力してください"); return; }
      const card=cards.find(c=>c.addPass===pass);
      if(!card){ alert("パスが違います"); return; }
      if(!userAddedCards.includes(card.id)){
        userAddedCards.push(card.id);
        ensureSerialOnce(card.id);
        saveAll(); renderUserCards(); el.addCardPass.value="";
      } else alert("すでに追加済みです");
    });
  }

  renderUserCards(); renderHistory(); renderUpdates();
}

/* =========================
   管理者画面
========================= */
function initAdmin(){
  const el={
    cardName:document.getElementById("cardName"),
    cardSlots:document.getElementById("cardSlots"),
    addPass:document.getElementById("addPass"),
    notifyMsg:document.getElementById("notifyMsg"),
    maxNotifyMsg:document.getElementById("maxNotifyMsg"),
    cardBG:document.getElementById("cardBG"),
    stampIcon:document.getElementById("stampIcon"),
    previewCardBtn:document.getElementById("previewCardBtn"),
    previewClearBtn:document.getElementById("previewClearBtn"),
    createCardBtn:document.getElementById("createCardBtn"),
    adminCards:document.getElementById("adminCards"),
    keywordCardSelect:document.getElementById("keywordCardSelect"),
    keywordInput:document.getElementById("keywordInput"),
    addKeywordBtn:document.getElementById("addKeywordBtn"),
    keywordList:document.getElementById("keywordList"),
    updateInput:document.getElementById("updateInput"),
    addUpdateBtn:document.getElementById("addUpdateBtn"),
    adminUpdateLogs:document.getElementById("adminUpdateLogs"),
    previewArea:document.getElementById("previewArea")
  };

  /* --- プレビュー --- */
  if(el.previewCardBtn){
    el.previewCardBtn.addEventListener("click",()=>{
      if(!el.previewArea) return;
      el.previewArea.innerHTML="";
      const div=document.createElement("div");
      div.className="card"; div.style.background=el.cardBG?.value||"#fff0f5";
      const h3=document.createElement("h3"); h3.textContent=el.cardName?.value||""; div.appendChild(h3);
      const slots=parseInt(el.cardSlots?.value||"5",10);
      for(let i=0;i<slots;i++){ const s=document.createElement("div"); s.className="stamp-slot"; div.appendChild(s); }
      el.previewArea.appendChild(div);
    });
  }
  if(el.previewClearBtn) el.previewClearBtn.addEventListener("click",()=>{ if(el.previewArea) el.previewArea.innerHTML=""; });

  /* --- カード作成 --- */
  if(el.createCardBtn){
    el.createCardBtn.addEventListener("click",()=>{
      const name=(el.cardName?.value||"").trim();
      const pass=(el.addPass?.value||"").trim();
      if(!name||!pass){ alert("カード名と追加パスは必須"); return; }
      const newCard={ id:Date.now(), name, slots:parseInt(el.cardSlots?.value||"5",10), addPass:pass,
        bg:el.cardBG?.value||"#fff0f5", stampIcon:el.stampIcon?.value||"", notifyMsg:(el.notifyMsg?.value||"").trim(), maxNotifyMsg:(el.maxNotifyMsg?.value||"").trim()
      };
      cards.push(newCard); saveAll(); renderAdminCards();
    });
  }

  /* --- レンダ --- */
  function renderAdminCards(){
    if(!el.adminCards||!el.keywordCardSelect) return;
    el.adminCards.innerHTML=""; el.keywordCardSelect.innerHTML="";
    cards.forEach(c=>{
      const li=document.createElement("li");
      const info=document.createElement("div"); info.className="info"; info.textContent=`${c.name} \\ ${c.addPass} \\`; li.appendChild(info);

      const btnDel=document.createElement("button"); btnDel.textContent="削除";
      btnDel.addEventListener("click",()=>{
        cards=cards.filter(x=>x.id!==c.id);
        keywords=keywords.filter(k=>k.cardId!==c.id);
        userAddedCards=userAddedCards.filter(id=>id!==c.id);
        for(const uname in userCardSerials) if(userCardSerials[uname]) delete userCardSerials[uname][c.id];
        userStampHistory=userStampHistory.filter(s=>s.cardId!==c.id);
        saveAll(); renderAdminCards();
      });
      li.appendChild(btnDel); el.adminCards.appendChild(li);

      const opt=document.createElement("option"); opt.value=c.id; opt.textContent=c.name; el.keywordCardSelect.appendChild(opt);
    });
    renderKeywords(); renderUpdateLogs();
  }

  function renderKeywords(){
    if(!el.keywordList) return;
    el.keywordList.innerHTML="";
    keywords.forEach((k,idx)=>{
      const li=document.createElement("li");
      const cname=(cards.find(c=>c.id===k.cardId)?.name)||k.cardId;
      const span=document.createElement("span"); span.className="info"; span.textContent=`${cname} ${k.word}`; li.appendChild(span);
      const toggle=document.createElement("button"); toggle.textContent=k.enabled?"無効":"有効";
      toggle.addEventListener("click",()=>{ k.enabled=!k.enabled; saveAll(); renderKeywords(); }); li.appendChild(toggle);
      const del=document.createElement("button"); del.textContent="削除"; del.addEventListener("click",()=>{ keywords.splice(idx,1); saveAll(); renderKeywords(); });
      li.appendChild(del); el.keywordList.appendChild(li);
    });
  }

  function renderUpdateLogs(){
    if(!el.adminUpdateLogs) return;
    el.adminUpdateLogs.innerHTML="";
    (updates||[]).forEach((u,idx)=>{
      const text=typeof u==="string"?u:`${u.date||""} ${u.msg||""}`;
      const li=document.createElement("li");
      const info=document.createElement("span"); info.className="info"; info.textContent=text; li.appendChild(info);
      const del=document.createElement("button"); del.textContent="消去"; del.addEventListener("click",()=>{ updates.splice(idx,1); saveAll(); renderUpdateLogs(); });
      li.appendChild(del); el.adminUpdateLogs.appendChild(li);
    });
  }

  /* --- 合言葉追加 --- */
  if(el.addKeywordBtn){
    el.addKeywordBtn.addEventListener("click",()=>{
      const cid=parseInt(el.keywordCardSelect?.value||"",10);
      const word=(el.keywordInput?.value||"").trim();
      if(!cid||!word){ alert("カードと合言葉を指定してください"); return; }
      keywords.push({cardId:cid, word, enabled:true}); saveAll(); renderKeywords();
      if(el.keywordInput) el.keywordInput.value="";
    });
  }

  /* --- 更新履歴追加 --- */
  if(el.addUpdateBtn){
    el.addUpdateBtn.addEventListener("click",()=>{
      const msg=(el.updateInput?.value||"").trim();
      if(!msg){ alert("更新内容を入力してください"); return; }
      const now=new Date();
      const dateStr=`${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日`;
      updates.push({date:dateStr,msg}); saveAll(); renderUpdateLogs();
      if(el.updateInput) el.updateInput.value="";
    });
  }

  renderAdminCards();

  /* --- コピー用ボタン --- */
  addCopyButton();
  function addCopyButton(){
    if(document.getElementById("copyUpdateDataBtn")) return;
    const container=document.createElement("div"); container.style.margin="16px 0"; container.style.textAlign="center";
    const btn=document.createElement("button"); btn.id="copyUpdateDataBtn"; btn.textContent="カード・合言葉データをコピー";
    btn.style.padding="8px 16px"; btn.style.fontSize="14px"; btn.style.cursor="pointer";
    btn.addEventListener("click",()=>{
      const dataStr=generateUpdateData();
      navigator.clipboard.writeText(dataStr).then(()=>alert("コピーしました！\nupdateDataFull.js に貼り付けてください")).catch(err=>alert("コピー失敗:"+err));
    });
    container.appendChild(btn);
    const target=document.getElementById("adminUpdateLogs");
    if(target&&target.parentNode) target.parentNode.insertBefore(container,target);
    else document.body.appendChild(container);
  }

  function generateUpdateData(){
    return JSON.stringify({
      cards:cards.map(c=>({id:c.id,name:c.name,slots:c.slots,addPass:c.addPass,bg:c.bg,stampIcon:c.stampIcon,notifyMsg:c.notifyMsg,maxNotifyMsg:c.maxNotifyMsg})),
      keywords:keywords.map(k=>({cardId:k.cardId,word:k.word,enabled:k.enabled}))
    },null,2);
  }
}