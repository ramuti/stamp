// ===== データ管理 =====
function getData(){ return JSON.parse(localStorage.getItem("stampCardData")||"{}"); }
function saveData(data){ localStorage.setItem("stampCardData", JSON.stringify(data)); }

// ===== ユーザー処理 =====
function initUser(){
  const data=getData();
  if(!data.userName){
    document.getElementById("nameDialog").style.display="block";
  }else{
    loadUserUI();
  }
}

function saveUserName(){
  const name=document.getElementById("userNameInput").value.trim();
  if(!name) return alert("名前を入力してください");
  const data=getData();
  data.userName=name;
  saveData(data);
  document.getElementById("nameDialog").style.display="none";
  loadUserUI();
}

function loadUserUI(){
  const data=getData();
  document.getElementById("userMain").style.display="block";
  document.getElementById("displayName").textContent=data.userName+"'s スタンプカード";
  const container=document.getElementById("cardsContainer");
  container.innerHTML="";
  if(!data.cards) return;
  for(const cardId in data.cards){
    const card=data.cards[cardId];
    if(!card.users) card.users={};
    if(!card.users[data.userName]) continue; // 追加パスで追加していないカードは非表示
    const cardDiv=document.createElement("div");
    cardDiv.className="card";
    cardDiv.style.backgroundImage=card.bg?"url('"+card.bg+"')":"none";
    cardDiv.innerHTML=`<h4>${card.name}</h4>
      <div class="stamp-row" id="stampRow_${cardId}"></div>
      <button onclick="stampCard('${cardId}')">スタンプを押す</button>
      <div style="position:absolute; bottom:5px; right:5px; font-size:10px;">${card.users[data.userName].serial}</div>`;
    container.appendChild(cardDiv);

    // 枠生成
    const row=document.getElementById("stampRow_"+cardId);
    row.innerHTML="";
    const stamps=card.users[data.userName].stamps||0;
    for(let i=0;i<card.max;i++){
      const box=document.createElement("div");
      box.className="stamp-box";
      if(i<stamps){
        const img=document.createElement("img");
        img.src=card.icon;
        img.className="stamp-icon";
        box.appendChild(img);
      }
      row.appendChild(box);
    }
  }
}

function addCardByPass(){
  const pass=document.getElementById("addCardPass").value.trim();
  if(!pass) return;
  const data=getData();
  for(const cardId in data.cards){
    const card=data.cards[cardId];
    if(card.pass!==pass) continue;
    if(!card.users) card.users={};
    const userName=data.userName;
    if(card.users[userName]) return showNotice("すでに追加済み");
    card.users[userName]={stamps:0, serial:('00000'+Object.keys(card.users).length+1).slice(-5)};
    saveData(data);
    loadUserUI();
    showNotice("カード追加完了");
    return;
  }
  showNotice("追加パスが違うみたい");
}

function stampCard(cardId){
  const pass=prompt("スタンプ合言葉を入力してください");
  if(!pass) return;
  const data=getData();
  const card=data.cards[cardId];
  const userName=data.userName;
  if(!card.users[userName]) return;
  if(!card.passMap) card.passMap={};
  if(card.passMap[pass]){
    showNotice("もう押してあるよ");
    return;
  }
  if(!card.validPass || card.validPass!==pass){
    showNotice("スタンプ合言葉が違うみたい");
    return;
  }
  card.passMap[pass]=true;
  card.users[userName].stamps=(card.users[userName].stamps||0)+1;
  saveData(data);
  loadUserUI();
  showNotice(card.noticeMessage||"スタンプを押したよ");
}

// ===== 通知 =====
function showNotice(msg){
  const el=document.getElementById("noticeDialog");
  document.getElementById("noticeMsg").textContent=msg;
  el.style.display="block";
}
function closeNotice(){
  document.getElementById("noticeDialog").style.display="none";
}

// ===== 管理者処理 =====
function loadAdminUI(){
  const data=getData();
  // カード一覧
  const container=document.getElementById("cardsAdminList");
  container.innerHTML="";
  for(const cardId in data.cards){
    const card=data.cards[cardId];
    const div=document.createElement("div");
    div.className="card";
    div.innerHTML=`<strong>${card.name}</strong> 
      枠:${card.max} 追加パス:${card.pass} 
      <button onclick="deleteCard('${cardId}')">消去</button>`;
    container.appendChild(div);
  }

  // カード選択用セレクト
  const sel=document.getElementById("selectCardForPass");
  sel.innerHTML="";
  for(const cardId in data.cards){
    const opt=document.createElement("option");
    opt.value=cardId;
    opt.textContent=data.cards[cardId].name;
    sel.appendChild(opt);
  }
}

function createCard(){
  const name=document.getElementById("newCardName").value.trim();
  const max=parseInt(document.getElementById("newCardMax").value);
  const pass=document.getElementById("newCardPass").value.trim();
  if(!name || !max || !pass) return alert("必須項目を入力してください");
  const notice=document.getElementById("newCardNotice").value;
  const maxMsg=document.getElementById("newCardMaxMsg").value;
  const bgInput=document.getElementById("newCardBG");
  const iconInput=document.getElementById("newCardIcon");

  const readerBG = bgInput.files[0] ? URL.createObjectURL(bgInput.files[0]) : null;
  const readerIcon = iconInput.files[0] ? URL.createObjectURL(iconInput.files[0]) : null;

  const data=getData();
  if(!data.cards) data.cards={};
  const id="card_"+Date.now();
  data.cards[id]={name:name, max:max, pass:pass, noticeMessage:notice, maxMessage:maxMsg, bg:readerBG, icon:readerIcon, users:{}};
  saveData(data);
  loadAdminUI();
  alert("カード作成完了");
}

function deleteCard(cardId){
  const data=getData();
  if(confirm("カードを消去すると、ユーザー側からも消えます。本当によろしいですか？")){
    delete data.cards[cardId];
    saveData(data);
    loadAdminUI();
  }
}

function createStampPass(){
  const sel=document.getElementById("selectCardForPass");
  const cardId=sel.value;
  const pass=document.getElementById("newStampPass").value.trim();
  if(!cardId || !pass) return;
  const data=getData();
  const card=data.cards[cardId];
  card.validPass=pass;
  saveData(data);
  alert("合言葉作成完了");
}