/* ============================
   script.js — ユーザー＋管理者 共通（updateDataFull.js参照版）
============================ */

// LocalStorageキー定義（ユーザー専用データだけ）
const LS_KEYS = {
  userName: "userName",
  userAddedCards: "userAddedCards",
  userStampHistory: "userStampHistory",
  userUIColors: "userUIColors",
  userCardSerials: "userCardSerials"
};

// JSON読み書き補助
function loadJSON(key, fallback){ try{ const v=localStorage.getItem(key); return v?JSON.parse(v):fallback; }catch(e){ return fallback; } }
function saveJSON(key, obj){ localStorage.setItem(key, JSON.stringify(obj)); }

// --------------------
// ローカルデータ初期化
// --------------------
let userName=localStorage.getItem(LS_KEYS.userName)||"";
let userAddedCards=loadJSON(LS_KEYS.userAddedCards,[]);
let userStampHistory=loadJSON(LS_KEYS.userStampHistory,[]);
let userUIColors=loadJSON(LS_KEYS.userUIColors,{text:"#c44a7b",bg:"#fff0f5",btn:"#ff99cc"});
let userCardSerials=loadJSON(LS_KEYS.userCardSerials,{});

// updateDataFull.js のデータを返す
function getCards(){ return (window.updateDataFull && updateDataFull.cards)||[]; }
function getKeywords(){ return (window.updateDataFull && updateDataFull.keywords)||[]; }
function getUpdates(){ return (window.updateDataFull && updateDataFull.updates)||[]; }

// 保存
function saveAll(){
  saveJSON(LS_KEYS.userAddedCards,userAddedCards);
  saveJSON(LS_KEYS.userStampHistory,userStampHistory);
  saveJSON(LS_KEYS.userUIColors,userUIColors);
  saveJSON(LS_KEYS.userCardSerials,userCardSerials);
  localStorage.setItem(LS_KEYS.userName,userName);
}

// --------------------
// DOMContentLoaded
// --------------------
document.addEventListener("DOMContentLoaded",()=>{
  const body=document.body;
  if(body.classList.contains("user")) initUser();
  if(body.classList.contains("admin")) initAdmin();
});

// --------------------
// ユーザー画面初期化
// --------------------
function initUser(){
  const userNameInput=document.getElementById("userNameInput");
  const setNameBtn=document.getElementById("setNameBtn");
  const addCardPassInput=document.getElementById("addCardPass");
  const addCardBtn=document.getElementById("addCardBtn");
  const userCardsDiv=document.getElementById("userCards");
  const stampHistoryList=document.getElementById("stampHistory");
  const updateLogsList=document.getElementById("updateLogs");

  const textColorPicker=document.getElementById("textColor");
  const bgColorPicker=document.getElementById("bgColor");
  const btnColorPicker=document.getElementById("btnColor");

  // 色適用
  function applyUserColors(){
    document.body.style.background=userUIColors.bg;
    document.body.style.color=userUIColors.text;
    document.querySelectorAll("button").forEach(btn=>{
      btn.style.background=userUIColors.btn;
    });
  }
  applyUserColors();
  textColorPicker?.addEventListener("input",()=>{ userUIColors.text=textColorPicker.value; saveAll(); applyUserColors(); });
  bgColorPicker?.addEventListener("input",()=>{ userUIColors.bg=bgColorPicker.value; saveAll(); applyUserColors(); });
  btnColorPicker?.addEventListener("input",()=>{ userUIColors.btn=btnColorPicker.value; saveAll(); applyUserColors(); });

  // ユーザー名設定
  userNameInput.value=userName;
  setNameBtn.addEventListener("click",()=>{
    if(!userNameInput.value.trim()) return alert("名前を入力してください");
    userName=userNameInput.value.trim();
    saveAll();
    renderCards();
    renderHistory();
  });

  // カード追加
  addCardBtn.addEventListener("click",()=>{
    const pass=addCardPassInput.value.trim();
    if(!pass) return alert("追加パスを入力してください");

    const matched=getCards().find(c=>c.addPass===pass);
    if(!matched) return alert("合言葉が違います");
    if(userAddedCards.includes(matched.id)) return alert("このカードは既に追加済みです");

    userAddedCards.push(matched.id);
    if(!userCardSerials[userName]) userCardSerials[userName]={};
    if(!userCardSerials[userName][matched.id]){
      userCardSerials[userName][matched.id]=String(Math.floor(Math.random()*1_000_000)).padStart(6,"0");
    }
    saveAll();
    addCardPassInput.value="";
    renderCards();
  });

  // カード描画
  function renderCards(){
    userCardsDiv.innerHTML="";
    const cards=getCards();

    // 存在しないカードは履歴ごと削除
    userAddedCards=userAddedCards.filter(cid=>cards.some(c=>c.id===cid));
    userStampHistory=userStampHistory.filter(s=>cards.some(c=>c.id===s.cardId));
    saveAll();

    userAddedCards.forEach(cid=>{
      const c=cards.find(x=>x.id===cid);
      if(!c) return;

      const div=document.createElement("div");
      div.className="card";
      div.style.background=c.bg||"#fff0f5";

      const title=document.createElement("h3");
      title.textContent=c.name;
      div.appendChild(title);

      // スタンプスロット
      const slots=document.createElement("div");
      const stampedCount=userStampHistory.filter(s=>s.cardId===cid).length;
      for(let i=0;i<c.slots;i++){
        const span=document.createElement("span");
        span.className="stamp-slot";
        if(i<stampedCount) span.classList.add("stamp-filled");
        slots.appendChild(span);
      }
      div.appendChild(slots);

      // ボタン＋シリアル
      const btn=document.createElement("button");
      btn.textContent="スタンプ押す";
      btn.onclick=()=>{
        const input=prompt("スタンプ合言葉を入力してください");
        if(!input) return;
        const kw=getKeywords().find(k=>k.cardId===cid && k.word===input && k.enabled);
        if(!kw) return alert("合言葉が違います");
        if(userStampHistory.some(s=>s.cardId===cid && s.word===input)){
          return alert("この合言葉では既に押しています");
        }
        if(stampedCount>=c.slots) return alert(c.maxNotifyMsg||"もう押せません");

        userStampHistory.push({cardId:cid, slot:stampedCount, word:input, datetime:new Date().toISOString()});
        saveAll();
        renderCards();
        renderHistory();
        alert(c.notifyMsg||"スタンプを押しました！");
      };

      const serial=document.createElement("span");
      serial.textContent=`シリアル: ${userCardSerials[userName]?.[cid]||"------"}`;
      serial.className="serial";

      const flex=document.createElement("div");
      flex.style.display="flex"; flex.style.justifyContent="space-between";
      flex.appendChild(btn); flex.appendChild(serial);
      div.appendChild(flex);

      userCardsDiv.appendChild(div);
    });
  }

  // 履歴描画
  function renderHistory(){
    stampHistoryList.innerHTML="";
    userStampHistory.slice().reverse().forEach(s=>{
      const c=getCards().find(c=>c.id===s.cardId);
      if(!c) return;
      const li=document.createElement("li");
      li.textContent=`${c.name} スロット${s.slot+1} ${new Date(s.datetime).toLocaleString()}`;
      stampHistoryList.appendChild(li);
    });
  }

  // 更新履歴
  function renderUpdates(){
    updateLogsList.innerHTML="";
    getUpdates().forEach(u=>{
      const li=document.createElement("li");
      li.textContent=`${u.date} ${u.msg}`;
      updateLogsList.appendChild(li);
    });
  }

  renderCards();
  renderHistory();
  renderUpdates();
}

// --------------------
// 管理者画面（管理は updateDataFull.js を編集する前提）
// --------------------
function initAdmin(){
  // ここではカードの追加/削除などのUIだけ提供
  // 実際に反映させるには updateDataFull.js を更新・コミットする必要あり
  const btn=document.createElement("button");
  btn.textContent="カード・合言葉データをコピー";
  btn.onclick=()=>{
    const data={cards:getCards(),keywords:getKeywords(),updates:getUpdates()};
    navigator.clipboard.writeText(JSON.stringify(data,null,2));
    alert("コピーしました。updateDataFull.js に貼り付けてコミットしてください。");
  };
  document.body.prepend(btn);
}