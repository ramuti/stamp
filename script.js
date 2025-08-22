// ===== データ管理 =====
function getData(){ return JSON.parse(localStorage.getItem("stampCardData")||"{}"); }
function saveData(data){ localStorage.setItem("stampCardData", JSON.stringify(data)); }

// ===== ユーザー名保存 =====
function initUserUI(){
  const data = getData();
  if(!data.userName){
    document.getElementById("userDialog").style.display="block";
  } else {
    loadUserCards();
  }
}

function saveUserName(){
  const name=document.getElementById("userNameInput").value.trim();
  if(!name) return alert("名前を入力してください");
  const data=getData();
  data.userName=name;
  saveData(data);
  document.getElementById("userDialog").style.display="none";
  loadUserCards();
}

// ===== カード追加 =====
function addCardByPass(){
  const pass=document.getElementById("addCardPass").value.trim();
  const data=getData();
  if(!pass || !data.cards) return alert("無効なパス");
  let found=false;
  for(const id in data.cards){
    const card = data.cards[id];
    if(card.addPass === pass){
      data.userCards = data.userCards||{};
      if(!data.userCards[id]){
        data.userCards[id] = {stamps:0, serial:Math.floor(Math.random()*100000)};
        saveData(data);
        loadUserCards();
        showNotice("カード追加完了");
      } else {
        showNotice("すでにカードがあります");
      }
      found=true;
      break;
    }
  }
  if(!found) showNotice("パスが違うみたい");
  document.getElementById("addCardPass").value="";
  document.getElementById("addCardDialog").style.display="none";
}

// ===== ユーザー画面 =====
function loadUserCards(){
  const data=getData();
  const container=document.getElementById("cardsContainer");
  container.innerHTML="";
  if(!data.cards || !data.userCards) return;
  for(const id in data.userCards){
    const card=data.cards[id];
    const userCard = data.userCards[id];
    const div=document.createElement("div");
    div.className="card";
    div.style.backgroundImage = card.bg ? `url(${card.bg})` : "";
    div.innerHTML=`<h4>${card.name}</h4>
    ${generateStampRows(card, userCard)}
    <button onclick="promptStamp('${id}')">スタンプを押す</button>
    <div class="card-serial">${userCard.serial}</div>`;
    container.appendChild(div);
  }
}

// ===== スタンプ列生成 =====
function generateStampRows(card,userCard){
  const total = card.max || 5;
  let html="";
  const rowSize = 5;
  for(let i=0;i<Math.ceil(total/rowSize);i++){
    html+='<div class="stamp-row">';
    for(let j=0;j<rowSize;j++){
      const idx=i*rowSize+j;
      if(idx>=total) break;
      html+='<div class="stamp">';
      if(userCard.stamps>idx){
        html+=`<img src="${card.stamp}" />`;
      }
      html+='</div>';
    }
    html+='</div>';
  }
  return html;
}

// ===== スタンプ押下 =====
function promptStamp(cardId){
  const pass=prompt("スタンプの合言葉を入力してください");
  if(pass===null) return;
  const data=getData();
  if(!data.stampPasses || !data.stampPasses[pass]){
    showNotice("スタンプ合言葉が違うみたい");
    return;
  }
  const targetCardId = data.stampPasses[pass];
  if(targetCardId!==cardId){
    showNotice("スタンプ合言葉が違うみたい");
    return;
  }
  data.userCards = data.userCards||{};
  const card = data.userCards[cardId];
  card.stamps=card.stamps||0;
  if(card.lastPass===pass){
    showNotice("もう押してあるよ");
    return;
  }
  card.stamps++;
  card.lastPass=pass;
  saveData(data);
  showNotice(data.cards[cardId].notice || "スタンプを押しました！");
  loadUserCards();
}

// ===== 通知 =====
function showNotice(msg){
  const el=document.getElementById("notice");
  document.getElementById("noticeText").textContent=msg;
  el.style.display="block";
}
function closeNotice(){
  document.getElementById("notice").style.display="none";
}