/* ============================
   script.js — 管理者＋ユーザー 共通
   - 既存表示形式を維持
   - ボタン・コピー・消去すべて動作
   - ユーザー用カードシリアル固定ランダム
============================ */

const LS_KEYS = {
  cards: "cards",
  keywords: "keywords",
  updates: "updates",
  userAddedCards: "userAddedCards",
  userStampHistory: "userStampHistory",
  userCardSerials: "userCardSerials",
  userUIColors: "userUIColors",
  userName: "userName"
};

let cards = JSON.parse(localStorage.getItem(LS_KEYS.cards) || "[]");
let keywords = JSON.parse(localStorage.getItem(LS_KEYS.keywords) || "[]");
let updates = JSON.parse(localStorage.getItem(LS_KEYS.updates) || "[]");
let userAddedCards = JSON.parse(localStorage.getItem(LS_KEYS.userAddedCards) || "[]");
let userStampHistory = JSON.parse(localStorage.getItem(LS_KEYS.userStampHistory) || "[]");
let userCardSerials = JSON.parse(localStorage.getItem(LS_KEYS.userCardSerials) || "{}");
let userUIColors = JSON.parse(localStorage.getItem(LS_KEYS.userUIColors) || '{}');
let userName = localStorage.getItem(LS_KEYS.userName) || "";

/* =========================
   共通保存関数
========================= */
function saveAll() {
  localStorage.setItem(LS_KEYS.cards, JSON.stringify(cards));
  localStorage.setItem(LS_KEYS.keywords, JSON.stringify(keywords));
  localStorage.setItem(LS_KEYS.updates, JSON.stringify(updates));
  localStorage.setItem(LS_KEYS.userAddedCards, JSON.stringify(userAddedCards));
  localStorage.setItem(LS_KEYS.userStampHistory, JSON.stringify(userStampHistory));
  localStorage.setItem(LS_KEYS.userCardSerials, JSON.stringify(userCardSerials));
  localStorage.setItem(LS_KEYS.userUIColors, JSON.stringify(userUIColors));
  localStorage.setItem(LS_KEYS.userName, userName);
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
  const adminCardsList = document.getElementById("adminCards");

  const keywordCardSelect = document.getElementById("keywordCardSelect");
  const keywordInput = document.getElementById("keywordInput");
  const addKeywordBtn = document.getElementById("addKeywordBtn");
  const keywordList = document.getElementById("keywordList");

  const updateInput = document.getElementById("updateInput");
  const addUpdateBtn = document.getElementById("addUpdateBtn");
  const updateList = document.getElementById("adminUpdateLogs");

  /* ---- カードプレビュー ---- */
  previewCardBtn.addEventListener("click", ()=>{
    const name = cardName.value.trim();
    const slots = Number(cardSlots.value) || 5;
    const bg = cardBG.value || "#fff0f5";
    const icon = stampIcon.value.trim();
    const container = document.getElementById("previewArea");
    container.innerHTML = "";
    const div = document.createElement("div"); div.className="card"; div.style.background=bg;
    const title = document.createElement("h3"); title.textContent=name; div.appendChild(title);
    const grid = document.createElement("div"); 
    for(let i=0;i<slots;i++){ const slot=document.createElement("div"); slot.className="stamp-slot"; grid.appendChild(slot);}
    div.appendChild(grid);
    if(icon){ const img=document.createElement("img"); img.src=icon; img.style.width="24px"; img.style.height="24px"; div.appendChild(img);}
    container.appendChild(div);
  });

  previewClearBtn.addEventListener("click",()=>{ document.getElementById("previewArea").innerHTML=""; });

  /* ---- カード作成 ---- */
  createCardBtn.addEventListener("click", ()=>{
    const name = cardName.value.trim();
    if(!name){ alert("カード名を入力してください"); return; }
    const slots = Number(cardSlots.value) || 5;
    const pass = addPass.value.trim();
    if(!pass){ alert("追加パスを入力してください"); return; }

    const newCard = {
      id: Date.now(),
      name:name,
      slots:slots,
      addPass:pass,
      bg:cardBG.value||"#fff0f5",
      stampIcon:stampIcon.value.trim(),
      notifyMsg:notifyMsg.value.trim(),
      maxNotifyMsg:maxNotifyMsg.value.trim()
    };
    cards.push(newCard); saveAll(); renderAdminCards();
  });

  /* ---- カード一覧 ---- */
  function renderAdminCards() {
    adminCardsList.innerHTML="";
    cards.forEach(c=>{
      const li=document.createElement("li");
      li.style.display="flex"; li.style.justifyContent="space-between"; li.style.alignItems="center"; li.style.gap="8px";
      li.style.padding="8px 10px"; li.style.margin="6px 0"; li.style.background="#ffe6f0"; li.style.borderRadius="10px"; li.style.border="1px solid #ffb6c1";
      const info=document.createElement("div"); info.className="info"; info.textContent=`ID:${c.id} ${c.name} slots:${c.slots} pass:${c.addPass}`;
      li.appendChild(info);
      adminCardsList.appendChild(li);
    });

    keywordCardSelect.innerHTML="";
    cards.forEach(c=>{ const opt=document.createElement("option"); opt.value=c.id; opt.textContent=c.name; keywordCardSelect.appendChild(opt); });
  }
  renderAdminCards();

  /* ---- キーワード管理 ---- */
  addKeywordBtn.addEventListener("click", ()=>{
    const cardId=keywordCardSelect.value;
    const word=keywordInput.value.trim(); if(!word) return;
    keywords.push({cardId:Number(cardId), word:word, enabled:true}); saveAll(); renderKeywords();
    keywordInput.value="";
  });

  function renderKeywords() {
    keywordList.innerHTML="";
    keywords.forEach(k=>{
      const li=document.createElement("li");
      li.style.display="flex"; li.style.justifyContent="space-between"; li.style.alignItems="center"; li.style.gap="8px";
      li.style.padding="8px 10px"; li.style.margin="6px 0"; li.style.background="#ffe6f0"; li.style.borderRadius="10px"; li.style.border="1px solid #ffb6c1";
      li.textContent=`[CardID:${k.cardId}] ${k.word} (${k.enabled?"有効":"無効"})`;
      keywordList.appendChild(li);
    });
  }
  renderKeywords();

  /* ---- 更新履歴 ---- */
  addUpdateBtn.addEventListener("click", ()=>{
    const val = updateInput.value.trim(); if(!val) return;
    updates.push({text:val, datetime:new Date().toISOString()}); saveAll(); renderUpdates();
    updateInput.value="";
  });

  function renderUpdates() {
    updateList.innerHTML="";
    updates.forEach((u,i)=>{
      const li=document.createElement("li");
      li.style.display="flex"; li.style.justifyContent="space-between"; li.style.alignItems="center"; li.style.gap="8px";
      li.style.padding="8px 10px"; li.style.margin="6px 0"; li.style.background="#ffe6f0"; li.style.borderRadius="10px"; li.style.border="1px solid #ffb6c1";
      li.textContent=`[${u.datetime}] ${u.text}`;
      const delBtn = document.createElement("button"); delBtn.textContent="消去";
      delBtn.addEventListener("click", ()=>{ updates.splice(i,1); saveAll(); renderUpdates(); });
      li.appendChild(delBtn);
      updateList.appendChild(li);
    });
  }
  renderUpdates();

  /* ---- コピー用ボタン ---- */
  if(!document.getElementById("copyUpdateDataBtn")){
    const container=document.createElement("div"); container.style.margin="16px 0"; container.style.textAlign="center";
    const btn=document.createElement("button"); btn.id="copyUpdateDataBtn"; btn.textContent="カード・合言葉データをコピー";
    btn.style.padding="8px 16px"; btn.style.fontSize="14px"; btn.style.cursor="pointer";
    btn.addEventListener("click", ()=>{
      const dataStr = JSON.stringify({cards:cards, keywords:keywords}, null, 2);
      navigator.clipboard.writeText(dataStr).then(()=>alert("コピーしました！updateDataFull.js に貼り付けてください")).catch(err=>alert("コピー失敗:"+err));
    });
    container.appendChild(btn);
    document.body.appendChild(container);
  }
}

/* =========================
   ユーザー画面（カード追加・スタンプ押し）
========================= */
function initUser() {
  const addCardBtn = document.getElementById("addCardBtn");
  const addCardPass = document.getElementById("addCardPass");
  const userCards = document.getElementById("userCards");

  function renderUserCards(){
    if(!userCards) return;
    userCards.innerHTML="";
    userAddedCards.forEach(cid=>{
      const card = cards.find(c=>c.id===cid);
      if(!card) return;
      const container=document.createElement("div"); container.className="card"; container.style.background=card.bg||"#fff0f5";
      const title=document.createElement("h3"); title.textContent=card.name; container.appendChild(title);

      const grid=document.createElement("div"); grid.style.marginBottom="8px";
      for(let i=0;i<card.slots;i++){
        const slot=document.createElement("div"); slot.className="stamp-slot";
        if(userStampHistory.some(s=>s.cardId===card.id && s.slot===i)) slot.classList.add("stamp-filled");
        grid.appendChild(slot);
      }
      container.appendChild(grid);

      const serial=document.createElement("div"); serial.className="serial"; serial.textContent=`No.${(userCardSerials[userName]||{})[card.id]||0}`;
      container.appendChild(serial);

      const btn=document.createElement("button"); btn.textContent="スタンプを押す"; btn.style.marginTop="8px";
      btn.addEventListener("click", ()=>{
        const kw = prompt("スタンプ合言葉を入力してください");
        if(!kw) return;
        const word=kw.trim(); if(!word){ alert("合言葉を入力してください"); return; }
        const keywordObj = keywords.find(k=>k.cardId===card.id && k.word===word);
        if(!keywordObj){ alert("合言葉が違います"); return; }
        if(!keywordObj.enabled){ alert("この合言葉は無効です"); return; }
        if(userStampHistory.some(s=>s.cardId===card.id && s.word===word)){ alert("既に使用済み"); return; }
        const nextSlot=userStampHistory.filter(s=>s.cardId===card.id).length;
        userStampHistory.push({cardId:card.id, slot:nextSlot, word:word, datetime:new Date().toISOString()});
        saveAll(); renderUserCards(); alert("スタンプ押しました！");
      });
      container.appendChild(btn);
      userCards.appendChild(container);
    });
  }

  addCardBtn.addEventListener("click", ()=>{
    const pass = addCardPass.value.trim();
    if(!pass){ alert("追加パスを入力してください"); return; }
    const card = cards.find(c=>c.addPass===pass);
    if(!card){ alert("パスが違います"); return; }
    if(!userAddedCards.includes(card.id)){
      userAddedCards.push(card.id);
      if(!userCardSerials[userName]) userCardSerials[userName]={};
      if(!userCardSerials[userName][card.id]) userCardSerials[userName][card.id]=Math.floor(Math.random()*1000)+1;
      saveAll(); renderUserCards();
      addCardPass.value="";
    } else { alert("すでに追加済みです"); }
  });

  renderUserCards();
}

/* =========================
   DOM ready
========================= */
document.addEventListener("DOMContentLoaded", ()=>{
  const body=document.body;
  if(body.classList.contains("admin")) initAdmin();
  if(body.classList.contains("user")) initUser();
});