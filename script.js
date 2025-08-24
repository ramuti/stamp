const LS_KEYS={
  appVersion:"appVersion",
  userName:"userName",
  cards:"cards",
  keywords:"keywords",
  updates:"updates",
  userAddedCards:"userAddedCards",
  userStampHistory:"userStampHistory",
  userUIColors:"userUIColors",
  userCardSerials:"userCardSerials"
};
const APP_VERSION="v1.1.2";

function loadJSON(key,fallback){try{const v=localStorage.getItem(key);return v?JSON.parse(v):fallback}catch(e){return fallback;}}
function saveJSON(key,obj){localStorage.setItem(key,JSON.stringify(obj));}

let userName=localStorage.getItem(LS_KEYS.userName)||"";
let cards=loadJSON(LS_KEYS.cards,[]);
let keywords=loadJSON(LS_KEYS.keywords,[]);
let updates=loadJSON(LS_KEYS.updates,[]);
let userAddedCards=loadJSON(LS_KEYS.userAddedCards,[]);
let userStampHistory=loadJSON(LS_KEYS.userStampHistory,[]);
let userUIColors=loadJSON(LS_KEYS.userUIColors,{text:"#c44a7b",bg:"#fff0f5",btn:"#ff99cc"});
let userCardSerials=loadJSON(LS_KEYS.userCardSerials,{}); // ユーザごとのカード番号

function saveAll(){
  try{
    localStorage.setItem(LS_KEYS.userName,userName);
    saveJSON(LS_KEYS.cards,cards);
    saveJSON(LS_KEYS.keywords,keywords);
    saveJSON(LS_KEYS.updates,updates);
    saveJSON(LS_KEYS.userAddedCards,userAddedCards);
    saveJSON(LS_KEYS.userStampHistory,userStampHistory);
    saveJSON(LS_KEYS.userUIColors,userUIColors);
    saveJSON(LS_KEYS.userCardSerials,userCardSerials);
    localStorage.setItem(LS_KEYS.appVersion,APP_VERSION);
  }catch(e){alert("データ保存に失敗");console.error(e);}
}

document.addEventListener("DOMContentLoaded",()=>{
  const body=document.body;
  if(body.classList.contains("user")) initUser();
  if(body.classList.contains("admin")) initAdmin();
});

/* ===== ユーザー画面 ===== */
function initUser(){
  const setNameBtn=document.getElementById("setNameBtn");
  const userNameInput=document.getElementById("userNameInput");
  const cardTitle=document.getElementById("cardTitle");
  const addCardBtn=document.getElementById("addCardBtn");
  const addCardPass=document.getElementById("addCardPass");
  const userCards=document.getElementById("userCards");
  const historyList=document.getElementById("stampHistory");
  const updateLogs=document.getElementById("updateLogs");
  const textColorPicker=document.getElementById("textColor");
  const bgColorPicker=document.getElementById("bgColor");
  const btnColorPicker=document.getElementById("btnColor");

  cardTitle.textContent=userName?`${userName}のスタンプカード`:"スタンプカード";
  userNameInput.value=userName;
  textColorPicker.value=userUIColors.text;
  bgColorPicker.value=userUIColors.bg;
  btnColorPicker.value=userUIColors.btn;
  applyUserColors();

  setNameBtn.addEventListener("click",()=>{
    const v=userNameInput.value.trim();
    if(!v){alert("名前を入力してください");return;}
    userName=v; saveAll();
    cardTitle.textContent=`${userName}のスタンプカード`;
  });

  addCardBtn.addEventListener("click",()=>{
    const pass=addCardPass.value.trim();
    if(!pass){alert("追加パスを入力"); return;}
    const cardObj=cards.find(c=>c.addPass===pass);
    if(!cardObj){alert("該当カードが存在しません"); return;}
    const userKey=userName||"guest";
    if(!userAddedCards.includes(userKey+"_"+cardObj.id)){
      userAddedCards.push(userKey+"_"+cardObj.id);
      // シリアル番号割り当て
      if(!userCardSerials[userKey]) userCardSerials[userKey]={};
      if(!userCardSerials[userKey][cardObj.id]){
        const maxSerial=Math.max(0,...Object.values(userCardSerials[userKey]||{}));
        userCardSerials[userKey][cardObj.id]=maxSerial+1;
      }
      saveAll();
      renderUserCards();
    }else{
      alert("すでに追加済みのカードです");
    }
  });

  function applyUserColors(){
    document.body.style.color=userUIColors.text;
    document.body.style.background=userUIColors.bg;
    document.querySelectorAll("button").forEach(b=>b.style.background=userUIColors.btn);
  }

  textColorPicker.addEventListener("change",()=>{userUIColors.text=textColorPicker.value; saveAll(); applyUserColors();});
  bgColorPicker.addEventListener("change",()=>{userUIColors.bg=bgColorPicker.value; saveAll(); applyUserColors();});
  btnColorPicker.addEventListener("change",()=>{userUIColors.btn=btnColorPicker.value; saveAll(); applyUserColors();});

  function renderUserCards(){
    userCards.innerHTML="";
    const userKey=userName||"guest";
    const addedCards=cards.filter(c=>userAddedCards.includes(userKey+"_"+c.id));
    addedCards.forEach(card=>{
      const div=document.createElement("div");
      div.className="card";
      div.innerHTML=`<strong>${card.name}</strong>`;

      // スタンプスロット
      for(let i=0;i<card.slots;i++){
        const slot=document.createElement("span");
        slot.className="stamp-slot";
        const used=userStampHistory.filter(s=>s.cardId===card.id).length;
        if(i<used) slot.classList.add("stamp-filled");
        div.appendChild(slot);
      }

      // シリアル
      const serialSpan=document.createElement("div");
      serialSpan.className="serial";
      serialSpan.textContent=`カード番号: ${userCardSerials[userKey][card.id]}`;
      div.appendChild(serialSpan);

      // スタンプボタン
      const btn=document.createElement("button");
      btn.textContent="スタンプ押す";
      btn.addEventListener("click",()=>{
        const kw=prompt("スタンプ合言葉を入力してください");
        if(kw===null) return;
        const word=kw.trim();
        if(!word){alert("合言葉を入力してください"); return;}
        const keywordObj=keywords.find(k=>String(k.cardId)===String(card.id) && k.word===word);
        if(!keywordObj){
          alert("合言葉が違います");
          return;
        }
        if(!keywordObj.enabled){
          alert("この合言葉は無効です");
          return;
        }
        const usedSlots=userStampHistory.filter(s=>s.cardId===card.id && s.word===word);
        if(usedSlots.length>0){
          alert("この合言葉は既に使用済みです");
          return;
        }
        const nextSlot=userStampHistory.filter(s=>s.cardId===card.id).length;
        if(nextSlot>=card.slots){alert("すでにMAXです"); return;}
        const now=new Date();
        const stampRecord={
          cardId:card.id,
          slot:nextSlot,
          word:word,
          timestamp:now.toISOString()
        };
        userStampHistory.push(stampRecord);
        saveAll();
        renderUserCards();
        renderHistory();
        alert("スタンプを押しました！");
      });
      div.appendChild(btn);
      userCards.appendChild(div);
    });
  }

  function renderHistory(){
    historyList.innerHTML="";
    userStampHistory.forEach(stamp=>{
      const cardObj=cards.find(c=>c.id===stamp.cardId);
      if(!cardObj) return; // カード消えた場合履歴も消える
      const li=document.createElement("li");
      const date=new Date(stamp.timestamp);
      const ts=`${date.getFullYear()}年${date.getMonth()+1}月${date.getDate()}日 ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
      li.textContent=`[${ts}] ${cardObj.name} : ${stamp.word}`;
      historyList.appendChild(li);
    });
  }

  function renderUpdateLogs(){
    updateLogs.innerHTML="";
    updates.forEach(u=>{
      updateLogs.innerHTML+=`<div>${u.date} : ${u.text}</div>`;
    });
  }

  renderUserCards();
  renderHistory();
  renderUpdateLogs();
}

/* ===== 管理者画面 ===== */
function initAdmin(){
  const createCardBtn=document.getElementById("createCardBtn");
  const cardNameInput=document.getElementById("cardName");
  const cardSlotsInput=document.getElementById("cardSlots");
  const addPassInput=document.getElementById("addPass");
  const notifyInput=document.getElementById("notifyMsg");
  const maxNotifyInput=document.getElementById("maxNotifyMsg");
  const cardBGInput=document.getElementById("cardBG");
  const stampIconInput=document.getElementById("stampIcon");
  const adminCardsList=document.getElementById("adminCards");

  const keywordCardSelect=document.getElementById("keywordCardSelect");
  const keywordInput=document.getElementById("keywordInput");
  const keywordList=document.getElementById("keywordList");

  const addUpdateBtn=document.getElementById("addUpdateBtn");
  const updateInput=document.getElementById("updateInput");
  const adminUpdateLogs=document.getElementById("adminUpdateLogs");

  const previewArea=document.getElementById("previewArea");
  const previewCardBtn=document.getElementById("previewCardBtn");
  const previewClearBtn=document.getElementById("previewClearBtn");

  function renderAdminCards(){
    adminCardsList.innerHTML="";
    cards.forEach(c=>{
      const li=document.createElement("li");
      li.innerHTML=`<div class="info">${c.name} (枠:${c.slots}) 追加パス:${c.addPass}</div>`;
      const btns=document.createElement("div");
      btns.className="btns";

      const delBtn=document.createElement("button");
      delBtn.textContent="削除";
      delBtn.addEventListener("click",()=>{
        if(confirm("削除してもよろしいですか？")){
          cards=cards.filter(cc=>cc.id!==c.id);
          keywords=keywords.filter(k=>k.cardId!==c.id);
          for(const user in userCardSerials){ delete userCardSerials[user][c.id]; }
          userAddedCards=userAddedCards.filter(uc=>!uc.endsWith("_"+c.id));
          userStampHistory=userStampHistory.filter(s=>s.cardId!==c.id);
          saveAll();
          renderAdminCards();
        }
      });

      btns.appendChild(delBtn);
      li.appendChild(btns);
      adminCardsList.appendChild(li);
    });
    keywordCardSelect.innerHTML="";
    cards.forEach(c=>{ const opt=document.createElement("option"); opt.value=c.id; opt.textContent=c.name; keywordCardSelect.appendChild(opt); });
  }

  function renderKeywordList(){
    keywordList.innerHTML="";
    keywords.forEach(k=>{
      const li=document.createElement("li");
      li.innerHTML=`${cards.find(c=>c.id===k.cardId)?.name||"?"} : ${k.word} <label>有効:<input type="checkbox"${k.enabled?' checked':''}></label>`;
      const cb=li.querySelector("input[type=checkbox]");
      cb.addEventListener("change",()=>{k.enabled=cb.checked; saveAll();});
      keywordList.appendChild(li);
    });
  }

  createCardBtn.addEventListener("click",()=>{
    const name=cardNameInput.value.trim();
    if(!name){alert("カード名必須"); return;}
    const slots=parseInt(cardSlotsInput.value);
    if(isNaN(slots)||slots<1){alert("枠数は1以上"); return;}
    const addPass=addPassInput.value.trim();
    if(!addPass){alert("追加パス必須"); return;}
    const card={
      id:Date.now(),
      name:name,
      slots:slots,
      addPass:addPass,
      notify:notifyInput.value.trim(),
      maxNotify:maxNotifyInput.value.trim(),
      bg:cardBGInput.value,
      stampIcon:stampIconInput.value.trim()
    };
    cards.push(card);
    saveAll();
    renderAdminCards();
  });

  document.getElementById("addKeywordBtn").addEventListener("click",()=>{
    const cardId=parseInt(keywordCardSelect.value);
    const word=keywordInput.value.trim();
    if(!word){alert("合言葉を入力"); return;}
    keywords.push({cardId:cardId,word:word,enabled:true});
    saveAll();
    renderKeywordList();
  });

  addUpdateBtn.addEventListener("click",()=>{
    const txt=updateInput.value.trim();
    if(!txt){alert("更新内容を入力"); return;}
    const now=new Date();
    const d=`${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日`;
    updates.push({text:txt,date:d});
    saveAll();
    renderAdminUpdateLogs();
  });

  function renderAdminUpdateLogs(){
    adminUpdateLogs.innerHTML="";
    updates.forEach(u=>{
      const div=document.createElement("div");
      div.textContent=`${u.date} : ${u.text}`;
      adminUpdateLogs.appendChild(div);
    });
  }

  previewCardBtn.addEventListener("click",()=>{previewArea.innerHTML=`<div class="card"><strong>${cardNameInput.value}</strong></div>`;});
  previewClearBtn.addEventListener("click",()=>{previewArea.innerHTML="";});

  renderAdminCards();
  renderKeywordList();
  renderAdminUpdateLogs();
}