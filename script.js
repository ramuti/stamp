/* ============================
   script.js — ユーザー＋管理者共通
   ============================ */

/* --- 初期ロードするデータ／キー --- */
const LS_KEYS = {
  appVersion:"appVersion",
  userName:"userName",
  cards:"cards",
  keywords:"keywords",
  updates:"updates",
  userAddedCards:"userAddedCards",
  userStampHistory:"userStampHistory"
};
const APP_VERSION="v1.0.0";

/* load/save */
function loadJSON(key,fallback){try{const v=localStorage.getItem(key);return v?JSON.parse(v):fallback}catch(e){return fallback;}}
function saveJSON(key,obj){localStorage.setItem(key,JSON.stringify(obj));}

let userName=localStorage.getItem(LS_KEYS.userName)||"";
let cards=loadJSON(LS_KEYS.cards,[]);
let keywords=loadJSON(LS_KEYS.keywords,[]);
let updates=loadJSON(LS_KEYS.updates,[]);
let userAddedCards=loadJSON(LS_KEYS.userAddedCards,[]);
let userStampHistory=loadJSON(LS_KEYS.userStampHistory,[]);

function saveAll(){
  try{
    localStorage.setItem(LS_KEYS.userName,userName);
    saveJSON(LS_KEYS.cards,cards);
    saveJSON(LS_KEYS.keywords,keywords);
    saveJSON(LS_KEYS.updates,updates);
    saveJSON(LS_KEYS.userAddedCards,userAddedCards);
    saveJSON(LS_KEYS.userStampHistory,userStampHistory);
    localStorage.setItem(LS_KEYS.appVersion,APP_VERSION);
  }catch(e){alert("データ保存に失敗しました。");console.error(e);}
}

document.addEventListener("DOMContentLoaded",()=>{
  const body=document.body;
  if(body.classList.contains("user")) initUser();
  if(body.classList.contains("admin")) initAdmin();
});

/* ============================
   ユーザー側
   ============================ */
function initUser(){
  const setNameBtn=document.getElementById("setNameBtn");
  const userNameInput=document.getElementById("userNameInput");
  const cardTitle=document.getElementById("cardTitle");
  const addCardBtn=document.getElementById("addCardBtn");
  const addCardPass=document.getElementById("addCardPass");
  const userCards=document.getElementById("userCards");
  const historyList=document.getElementById("stampHistory");
  const updateLogs=document.getElementById("updateLogs");

  const bgPicker=document.getElementById("bgColorPicker");
  const textPicker=document.getElementById("textColorPicker");
  const btnPicker=document.getElementById("btnColorPicker");

  cardTitle.textContent=userName?`${userName}のスタンプカード`:"スタンプカード";
  userNameInput.value=userName;

  setNameBtn.addEventListener("click",()=>{
    const v=userNameInput.value.trim();
    if(!v){alert("名前を入力してください");return;}
    userName=v;
    saveAll();
    cardTitle.textContent=`${userName}のスタンプカード`;
  });

  addCardBtn.addEventListener("click",()=>{
    const pass=addCardPass.value.trim();
    if(!pass){alert("追加パスを入力してください");return;}
    const card=cards.find(c=>c.addPass===pass);
    if(!card){alert("パスが間違っています");return;}
    if(!userAddedCards.includes(card.id)){
      userAddedCards.push(card.id);
      saveJSON(LS_KEYS.userAddedCards,userAddedCards);
      renderUserCards();
      addCardPass.value="";
    }else{alert("すでに追加済みです");}
  });

  function renderUserCard(card){
    const container=document.createElement("div");
    container.className="card";
    if(card.bg) container.style.background=card.bg;

    const title=document.createElement("h3");
    title.textContent=card.name;
    container.appendChild(title);

    const grid=document.createElement("div");
    grid.style.marginBottom="8px";
    for(let i=0;i<card.slots;i++){
      const slot=document.createElement("div");
      slot.className="stamp-slot";
      if(userStampHistory.some(s=>s.cardId===card.id&&s.slot===i)) slot.classList.add("stamp-filled");
      grid.appendChild(slot);
    }
    container.appendChild(grid);

    const serial=document.createElement("div");
    serial.className="serial";
    serial.textContent=genSerialForUser();
    container.appendChild(serial);

    const btn=document.createElement("button");
    btn.textContent="スタンプを押す";
    btn.style.marginTop="8px";
    btn.addEventListener("click",()=>{
      const kw=prompt("スタンプ合言葉を入力してください");
      if(kw===null)return;
      const word=kw.trim();
      if(!word){alert("合言葉を入力してください");return;}
      const keywordObj=keywords.find(k=>String(k.cardId)===String(card.id)&&k.word===word&&k.active);
      if(!keywordObj){alert("合言葉が違うか無効です");return;}
      if(userStampHistory.some(s=>s.cardId===card.id&&s.keyword===word)){alert("すでに押しています");return;}
      const nextSlot=userStampHistory.filter(s=>s.cardId===card.id).length;
      if(nextSlot>=card.slots){alert(card.maxNotify||"これ以上押せません");return;}
      userStampHistory.push({cardId:card.id,slot:nextSlot,keyword:word,time:Date.now()});
      saveJSON(LS_KEYS.userStampHistory,userStampHistory);
      renderUserCards();
      alert(card.notify||"スタンプを押しました");
    });
    container.appendChild(btn);

    return container;
  }

  function renderUserCards(){
    userCards.innerHTML="";
    userAddedCards.forEach(cid=>{
      const card=cards.find(c=>c.id===cid);
      if(card) userCards.appendChild(renderUserCard(card));
    });
  }

  function genSerialForUser(){
    return Math.random().toString(36).substring(2,10).toUpperCase();
  }

  renderUserCards();

  // 更新履歴表示
  updateLogs.innerHTML="";
  updates.forEach(u=>{
    const d=document.createElement("div");
    d.textContent=u;
    updateLogs.appendChild(d);
  });

  // カラーパレット反映
  function applyColors(){
    document.body.style.background=bgPicker.value;
    document.body.style.color=textPicker.value;
    document.querySelectorAll("button").forEach(b=>b.style.background=btnPicker.value);
  }

  [bgPicker,textPicker,btnPicker].forEach(p=>{
    p.addEventListener("input",applyColors);
  });
  applyColors();
}

/* ============================
   管理者側
   ============================ */
function initAdmin(){
  const cardName=document.getElementById("cardName");
  const cardSlots=document.getElementById("cardSlots");
  const addPass=document.getElementById("addPass");
  const notifyMsg=document.getElementById("notifyMsg");
  const maxNotifyMsg=document.getElementById("maxNotifyMsg");
  const cardBG=document.getElementById("cardBG");
  const stampIcon=document.getElementById("stampIcon");
  const createCardBtn=document.getElementById("createCardBtn");
  const previewArea=document.getElementById("previewArea");
  const adminCards=document.getElementById("adminCards");
  const previewClearBtn=document.getElementById("previewClearBtn");

  const keywordCardSelect=document.getElementById("keywordCardSelect");
  const keywordInput=document.getElementById("keywordInput");
  const addKeywordBtn=document.getElementById("addKeywordBtn");
  const keywordList=document.getElementById("keywordList");

  const updateInput=document.getElementById("updateInput");
  const addUpdateBtn=document.getElementById("addUpdateBtn");
  const adminUpdateLogs=document.getElementById("adminUpdateLogs");

  function renderAdminCards(){
    adminCards.innerHTML="";
    cards.forEach(c=>{
      const li=document.createElement("li");

      const spanName=document.createElement("span");
      spanName.textContent=c.name;
      li.appendChild(spanName);

      const spanPass=document.createElement("span");
      spanPass.textContent=c.addPass;
      li.appendChild(spanPass);

      const previewBtn=document.createElement("button");
      previewBtn.textContent="プレビュー";
      previewBtn.addEventListener("click",()=>renderPreview(c));
      li.appendChild(previewBtn);

      const delBtn=document.createElement("button");
      delBtn.textContent="消去";
      delBtn.addEventListener("click",()=>{
        if(confirm("削除しますか？")){
          cards=cards.filter(cc=>cc.id!==c.id);
          saveJSON(LS_KEYS.cards,cards);
          renderAdminCards();
        }
      });
      li.appendChild(delBtn);

      adminCards.appendChild(li);
    });

    // キーワードセレクト更新
    keywordCardSelect.innerHTML="";
    cards.forEach(c=>{
      const opt=document.createElement("option");
      opt.value=c.id;
      opt.textContent=c.name;
      keywordCardSelect.appendChild(opt);
    });
  }

  function renderPreview(card){
    previewArea.innerHTML="";
    const div=document.createElement("div");
    div.className="card";
    div.style.background=card.bg||"#fff0f5";
    const h3=document.createElement("h3");
    h3.textContent=card.name;
    div.appendChild(h3);
    for(let i=0;i<card.slots;i++){
      const slot=document.createElement("div");
      slot.className="stamp-slot";
      div.appendChild(slot);
    }
    previewArea.appendChild(div);
  }

  createCardBtn.addEventListener("click",()=>{
    const name=cardName.value.trim();
    const slots=parseInt(cardSlots.value);
    const pass=addPass.value.trim();
    if(!name||!slots||!pass){alert("必須項目を入力してください");return;}
    const newCard={
      id:Date.now(),
      name:name,
      slots:slots,
      addPass:pass,
      notify:notifyMsg.value,
      maxNotify:maxNotifyMsg.value,
      bg:cardBG.value,
      stampIcon:stampIcon.value
    };
    cards.push(newCard);
    saveJSON(LS_KEYS.cards,cards);
    renderAdminCards();
    cardName.value=cardSlots.value=addPass.value=notifyMsg.value=maxNotifyMsg.value=cardBG.value=stampIcon.value="";
  });

  previewClearBtn.addEventListener("click",()=>previewArea.innerHTML="");

  renderAdminCards();

  // キーワード追加
  addKeywordBtn.addEventListener("click",()=>{
    const kw=keywordInput.value.trim();
    const cid=keywordCardSelect.value;
    if(!kw||!cid){alert("カードと合言葉を選択してください");return;}
    keywords.push({cardId:cid,word:kw,active:true});
    saveJSON(LS_KEYS.keywords,keywords);
    renderKeywordList();
    keywordInput.value="";
  });

  function renderKeywordList(){
    keywordList.innerHTML="";
    keywords.forEach((k,i)=>{
      const li=document.createElement("li");
      li.textContent=`${cards.find(c=>c.id==k.cardId)?.name||k.cardId} : ${k.word}`;
      const del=document.createElement("button");
      del.textContent="消去";
      del.addEventListener("click",()=>{keywords.splice(i,1); saveJSON(LS_KEYS.keywords,keywords); renderKeywordList();});
      li.appendChild(del);
      keywordList.appendChild(li);
    });
  }
  renderKeywordList();

  // 更新履歴
  addUpdateBtn.addEventListener("click",()=>{
    const txt=updateInput.value.trim();
    if(!txt)return;
    updates.push(txt);
    saveJSON(LS_KEYS.updates,updates);
    renderUpdateLogs();
    updateInput.value="";
  });

  function renderUpdateLogs(){
    adminUpdateLogs.innerHTML="";
    updates.forEach(u=>{
      const d=document.createElement("div");
      d.textContent=u;
      adminUpdateLogs.appendChild(d);
    });
  }
  renderUpdateLogs();
}