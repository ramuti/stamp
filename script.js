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
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch(e){ return fallback; }
}
function saveJSON(key, obj) { localStorage.setItem(key, JSON.stringify(obj)); }

/* Merge helpers */
function mergeUniqueArray(existingArray, newArray) {
  const set = new Set(existingArray || []);
  (newArray || []).forEach(v=>set.add(v));
  return Array.from(set);
}
function mergeStampHistories(existing,current){
  const map=new Map();
  (existing||[]).forEach(e=>{
    const key=`${e.cardId}||${e.slot}||${e.word||""}||${e.datetime||""}`;
    map.set(key,e);
  });
  (current||[]).forEach(e=>{
    const key=`${e.cardId}||${e.slot}||${e.word||""}||${e.datetime||""}`;
    if(!map.has(key)) map.set(key,e);
  });
  return Array.from(map.values());
}
function mergeUserCardSerials(existing,current){
  const merged = JSON.parse(JSON.stringify(existing||{}));
  for(const user in (current||{})){
    if(!merged[user]) merged[user]={};
    for(const cid in current[user]){
      if(merged[user][cid]===undefined||merged[user][cid]===null){
        merged[user][cid]=current[user][cid];
      }
    }
  }
  return merged;
}

/* Central save function */
function saveAll(){
  try{
    localStorage.setItem(LS_KEYS.appVersion, APP_VERSION);
    localStorage.setItem(LS_KEYS.userName, userName);
    saveJSON(LS_KEYS.cards, cards);
    saveJSON(LS_KEYS.keywords, keywords);
    saveJSON(LS_KEYS.updates, updates);

    const existingUserAdded = loadJSON(LS_KEYS.userAddedCards,[]);
    userAddedCards = mergeUniqueArray(existingUserAdded,userAddedCards);
    saveJSON(LS_KEYS.userAddedCards,userAddedCards);

    const existingHistory = loadJSON(LS_KEYS.userStampHistory,[]);
    userStampHistory = mergeStampHistories(existingHistory,userStampHistory);
    saveJSON(LS_KEYS.userStampHistory,userStampHistory);

    const existingSerials = loadJSON(LS_KEYS.userCardSerials,{});
    userCardSerials = mergeUserCardSerials(existingSerials,userCardSerials);
    saveJSON(LS_KEYS.userCardSerials,userCardSerials);

    const existingColors = loadJSON(LS_KEYS.userUIColors,{text:"#c44a7b",bg:"#fff0f5",btn:"#ff99cc"});
    userUIColors = Object.assign({},existingColors,userUIColors||{});
    saveJSON(LS_KEYS.userUIColors,userUIColors);

  } catch(e){ alert("データ保存に失敗"); console.error(e);}
}

/* Global state */
let userName = localStorage.getItem(LS_KEYS.userName) || "";
let cards = loadJSON(LS_KEYS.cards,[]);
let keywords = loadJSON(LS_KEYS.keywords,[]);
let updates = loadJSON(LS_KEYS.updates,[]);
let userAddedCards = loadJSON(LS_KEYS.userAddedCards,[]);
let userStampHistory = loadJSON(LS_KEYS.userStampHistory,[]);
let userUIColors = loadJSON(LS_KEYS.userUIColors,{text:"#c44a7b",bg:"#fff0f5",btn:"#ff99cc"});
let userCardSerials = loadJSON(LS_KEYS.userCardSerials,{});

/* DOM ready */
document.addEventListener("DOMContentLoaded",()=>{
  const body = document.body;
  if(body.classList.contains("user")) initUser();
  if(body.classList.contains("admin")) initAdmin();
});

/* =========================
   ユーザー画面
========================= */
function initUser(){
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

  cardTitle.textContent = userName?`${userName}のスタンプカード`:"スタンプカード";
  userNameInput.value = userName;
  textColorPicker.value = userUIColors.text;
  bgColorPicker.value = userUIColors.bg;
  btnColorPicker.value = userUIColors.btn;
  applyUserColors();

  setNameBtn.addEventListener("click",()=>{
    const v = userNameInput.value.trim();
    if(!v){alert("名前を入力してください");return;}
    userName = v;
    saveAll();
    cardTitle.textContent=`${userName}のスタンプカード`;
  });

  addCardBtn.addEventListener("click",()=>{
    const pass = addCardPass.value.trim();
    if(!pass){alert("追加パスを入力してください"); return;}
    const card = cards.find(c=>c.addPass===pass);
    if(!card){alert("パスが違います"); return;}
    if(!userAddedCards.includes(card.id)){
      userAddedCards.push(card.id);
      if(!userCardSerials[userName]) userCardSerials[userName]={};
      if(!userCardSerials[userName][card.id]){
        const existingSerials = Object.values(userCardSerials).map(u=>u[card.id]||0);
        const maxSerial = existingSerials.length?Math.max(...existingSerials):0;
        userCardSerials[userName][card.id]=maxSerial+1;
      }
      saveAll(); renderUserCards(); addCardPass.value="";
    } else { alert("すでに追加済みです"); }
  });

  function applyUserColors(){
    document.body.style.background=userUIColors.bg;
    document.body.style.color=userUIColors.text;
    cardTitle.style.color=userUIColors.text;
    document.querySelectorAll("button").forEach(btn=>{
      btn.style.background=userUIColors.btn;
      btn.style.color=userUIColors.text;
    });
  }

  textColorPicker.addEventListener("input",()=>{userUIColors.text=textColorPicker.value; saveAll(); applyUserColors();});
  bgColorPicker.addEventListener("input",()=>{userUIColors.bg=bgColorPicker.value; saveAll(); applyUserColors();});
  btnColorPicker.addEventListener("input",()=>{userUIColors.btn=btnColorPicker.value; saveAll(); applyUserColors();});

  function renderUserCard(card){
    const container = document.createElement("div");
    container.className="card"; container.dataset.id=card.id;
    if(card.bg) container.style.background=card.bg;

    const title=document.createElement("h3"); title.textContent=card.name; container.appendChild(title);

    const grid=document.createElement("div"); grid.style.marginBottom="8px";
    for(let i=0;i<card.slots;i++){
      const slot=document.createElement("div");
      slot.className="stamp-slot";
      if(userStampHistory.some(s=>s.cardId===card.id && s.slot===i)) slot.classList.add("stamp-filled");
      grid.appendChild(slot);
    }
    container.appendChild(grid);

    const serial=document.createElement("div"); serial.className="serial";
    const serialNum=(userCardSerials[userName]&&userCardSerials[userName][card.id])?userCardSerials[userName][card.id]:0;
    serial.textContent=`No.${serialNum}`;
    container.appendChild(serial);

    const btn=document.createElement("button"); btn.textContent="スタンプを押す";
    btn.style.marginTop="8px";
    btn.addEventListener("click",()=>{
      const kw = prompt("スタンプ合言葉を入力してください"); if(kw===null) return;
      const word = kw.trim(); if(!word){alert("合言葉を入力してください"); return;}
      const keywordObj = keywords.find(k=>String(k.cardId)===String(card.id)&&k.word===word);
      if(!keywordObj){alert("合言葉が違います"); return;}
      if(!keywordObj.enabled){alert("この合言葉は無効です"); return;}
      if(userStampHistory.some(s=>s.cardId===card.id && s.word===word)){alert("この合言葉は既に使用済みです"); return;}
      const nextSlot = userStampHistory.filter(s=>s.cardId===card.id).length;
      if(nextSlot>=card.slots){alert("すでにMAXです"); return;}
      const now=new Date(); const pad=n=>String(n).padStart(2,"0");
      const datetime=`${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日 ${pad(now.getHours())}:${pad(now.getMinutes())}`;
      userStampHistory.push({cardId:card.id,slot:nextSlot,word,datetime}); saveAll(); renderUserCards();
      alert(`スタンプ押印: ${datetime}`);
    });
    container.appendChild(btn);

    return container;
  }

  function renderUserCards(){
    userCards.innerHTML="";
    userAddedCards.forEach(cid=>{
      const card = cards.find(c=>c.id===cid);
      if(card) userCards.appendChild(renderUserCard(card));
    });
  }

  renderUserCards();

  /* 更新履歴表示 */
  function renderUpdateLogs(){
    updateLogs.innerHTML="";
    updates.forEach((upd,i)=>{
      const li=document.createElement("li");
      li.textContent=`${upd.date} ${upd.text}`;
      const delBtn=document.createElement("button"); delBtn.textContent="消去";
      delBtn.addEventListener("click",()=>{
        updates.splice(i,1); saveAll(); renderUpdateLogs();
      });
      li.appendChild(delBtn); updateLogs.appendChild(li);
    });
  }
  renderUpdateLogs();
}

/* =========================
   管理者画面
========================= */
function initAdmin(){
  const cardNameInput = document.getElementById("cardName");
  const cardSlotsInput = document.getElementById("cardSlots");
  const addPassInput = document.getElementById("addPass");
  const notifyMsgInput = document.getElementById("notifyMsg");
  const maxNotifyMsgInput = document.getElementById("maxNotifyMsg");
  const cardBGInput = document.getElementById("cardBG");
  const stampIconInput = document.getElementById("stampIcon");

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

  /* ---------- プレビュー ---------- */
  function renderPreviewCard(){
    previewArea.innerHTML="";
    const card = {
      name: cardNameInput.value.trim()||"カード名",
      slots: parseInt(cardSlotsInput.value)||5,
      addPass: addPassInput.value.trim(),
      bg: cardBGInput.value,
      stampIcon: stampIconInput.value.trim(),
      notifyMsg: notifyMsgInput.value.trim(),
      maxNotifyMsg: maxNotifyMsgInput.value.trim()
    };
    const div = document.createElement("div"); div.className="card"; div.style.background=card.bg;
    const h3=document.createElement("h3"); h3.textContent=card.name; div.appendChild(h3);
    const grid=document.createElement("div"); grid.style.marginBottom="8px";
    for(let i=0;i<card.slots;i++){ const slot=document.createElement("div"); slot.className="stamp-slot"; grid.appendChild(slot); }
    div.appendChild(grid);
    previewArea.appendChild(div);
  }
  previewCardBtn.addEventListener("click",renderPreviewCard);
  previewClearBtn.addEventListener("click",()=>{previewArea.innerHTML="";});

  /* ---------- カード作成 ---------- */
  function renderAdminCards(){
    adminCards.innerHTML=""; keywordCardSelect.innerHTML="";
    cards.forEach((c,i)=>{
      const li=document.createElement("li");
      const info=document.createElement("span"); info.className="info";
      info.textContent=`${c.name} / 枠:${c.slots} / パス:${c.addPass}`;
      li.appendChild(info);

      const delBtn=document.createElement("button"); delBtn.textContent="削除";
      delBtn.addEventListener("click",()=>{ cards.splice(i,1); saveAll(); renderAdminCards(); });
      li.appendChild(delBtn);
      adminCards.appendChild(li);

      const opt=document.createElement("option"); opt.value=c.id; opt.textContent=c.name;
      keywordCardSelect.appendChild(opt);
    });
  }
  renderAdminCards();

  createCardBtn.addEventListener("click",()=>{
    const card={
      id:Date.now(),
      name:cardNameInput.value.trim()||"カード名",
      slots:parseInt(cardSlotsInput.value)||5,
      addPass:addPassInput.value.trim(),
      bg:cardBGInput.value,
      stampIcon:stampIconInput.value.trim(),
      notifyMsg:notifyMsgInput.value.trim(),
      maxNotifyMsg:maxNotifyMsgInput.value.trim()
    };
    cards.push(card); saveAll(); renderAdminCards(); renderPreviewCard();
  });

  /* ---------- キーワード管理 ---------- */
  function renderKeywordList(){
    keywordList.innerHTML="";
    keywords.forEach((k,i)=>{
      const li=document.createElement("li");
      const info=document.createElement("span"); info.className="info";
      const c = cards.find(c=>c.id==k.cardId);
      info.textContent=`${c?c.name:"-"} / 合言葉:${k.word} / 有効:${k.enabled}`;
      li.appendChild(info);
      const delBtn=document.createElement("button"); delBtn.textContent="削除";
      delBtn.addEventListener("click",()=>{ keywords.splice(i,1); saveAll(); renderKeywordList(); });
      li.appendChild(delBtn);
      keywordList.appendChild(li);
    });
  }
  renderKeywordList();

  addKeywordBtn.addEventListener("click",()=>{
    const word = keywordInput.value.trim();
    const cardId = parseInt(keywordCardSelect.value);
    if(!word){alert("合言葉を入力してください"); return;}
    if(!cardId){alert("カードを選択してください"); return;}
    keywords.push({cardId,word,enabled:true}); saveAll(); renderKeywordList();
    keywordInput.value="";
  });

  /* ---------- 更新履歴 ---------- */
  function renderAdminUpdates(){
    adminUpdateLogs.innerHTML="";
    updates.forEach((upd,i)=>{
      const li=document.createElement("li");
      li.textContent=`${upd.date} ${upd.text}`;
      const delBtn=document.createElement("button"); delBtn.textContent="消去";
      delBtn.addEventListener("click",()=>{
        updates.splice(i,1); saveAll(); renderAdminUpdates();
      });
      li.appendChild(delBtn);
      adminUpdateLogs.appendChild(li);
    });
  }
  renderAdminUpdates();

  addUpdateBtn.addEventListener("click",()=>{
    const text = updateInput.value.trim();
    if(!text){alert("更新内容を入力してください"); return;}
    const now=new Date(); const pad=n=>String(n).padStart(2,"0");
    const date = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日`;
    updates.push({date,text}); saveAll(); renderAdminUpdates();
    updateInput.value="";
  });

  /* ---------- コピー用ボタン ---------- */
  function addCopyButton(){
    if(document.getElementById("copyUpdateDataBtn")) return;
    const container = document.createElement("div");
    container.style.margin="16px 0"; container.style.textAlign="center";
    const btn=document.createElement("button");
    btn.id="copyUpdateDataBtn"; btn.textContent="カード・合言葉データをコピー";
    btn.style.padding="8px 16px"; btn.style.fontSize="14px"; btn.style.cursor="pointer";
    btn.addEventListener("click",()=>{
      if(typeof generateUpdateData==="function"){
        const dataStr = generateUpdateData();
        navigator.clipboard.writeText(dataStr)
          .then(()=>alert("コピーしました！\nこの内容を updateDataFull.js に貼り付けてください"))
          .catch(err=>alert("コピー失敗: "+err));
      } else { alert("generateUpdateData 関数が定義されていません"); }
    });
    container.appendChild(btn);
    document.body.appendChild(container);
  }
  addCopyButton();

  function generateUpdateData(){
    const data={
      cards: cards.map(c=>({
        id:c.id,name:c.name,slots:c.slots,addPass:c.addPass,
        bg:c.bg,stampIcon:c.stampIcon,notifyMsg:c.notifyMsg,maxNotifyMsg:c.maxNotifyMsg
      })),
      keywords: keywords.map(k=>({cardId:k.cardId,word:k.word,enabled:k.enabled}))
    };
    return JSON.stringify(data,null,2);
  }
}