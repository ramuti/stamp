// ===== データ管理 =====
function getData(){ return JSON.parse(localStorage.getItem("stampCardData")||"{}"); }
function saveData(data){ localStorage.setItem("stampCardData", JSON.stringify(data)); }

// ===== ユーザー名 =====
function initUserUI(){
  const data=getData();
  if(!data.userName){
    document.getElementById('nameDialog').style.display='block';
    document.getElementById('userUI').style.display='none';
  } else {
    document.getElementById('nameDialog').style.display='none';
    document.getElementById('userUI').style.display='block';
    document.getElementById('userTitle').textContent=data.userName+' のスタンプカード';
    renderUserCards();
    renderStampHistory();
    renderUpdates();
  }
}

function saveUserName(){
  const name=document.getElementById('userNameInput').value.trim();
  if(!name){ alert('名前を入力'); return; }
  const data=getData();
  data.userName=name;
  saveData(data);
  initUserUI();
}

// ===== ユーザー画面 =====
function renderUserCards(){
  const data=getData();
  const container=document.getElementById('cardsContainer');
  container.innerHTML='';
  if(!data.cards) return;

  for(const cid in data.cards){
    const card = data.cards[cid];
    if(!card.addedUsers || !card.addedUsers.includes(data.userName)) continue;

    const div=document.createElement('div');
    div.className='card';
    div.style.backgroundImage=`url(${card.bg || 'images/base.png'})`;

    // 枠作成
    let stampsHtml='';
    for(let i=0;i<card.max;i++){
      const stamped=(card.stamped && card.stamped[data.userName] && card.stamped[data.userName].includes(i));
      stampsHtml+=`<div class="stampBox">${stamped?'<img src="'+card.icon+'">':''}</div>`;
    }

    div.innerHTML=`<h3>${card.name}</h3><div class="stampRow">${stampsHtml}</div>
      <button onclick="stampCard('${cid}')">スタンプを押す</button>
      <div style="position:absolute;bottom:5px;right:5px;font-size:12px;">${card.serial[data.userName]}</div>`;
    container.appendChild(div);
  }
}

function addCardByPass(){
  const pass=document.getElementById('addCardPass').value.trim();
  if(!pass) return alert('追加パスを入力');
  const data=getData();
  let found=false;
  for(const cid in data.cards){
    const card = data.cards[cid];
    if(card.addPass===pass){
      card.addedUsers=card.addedUsers||[];
      if(!card.addedUsers.includes(data.userName)){
        card.addedUsers.push(data.userName);
        card.serial=card.serial||{};
        card.serial[data.userName]=''+(Math.floor(Math.random()*90000)+10000); // 5桁
      }
      found=true;
    }
  }
  if(!found) return alert('カードが見つかりません');
  saveData(data);
  renderUserCards();
}

// ===== スタンプ押下 =====
function stampCard(cid){
  const secret=prompt('スタンプ合言葉を入力してください');
  if(!secret) return;
  const data=getData();
  const card=data.cards[cid];
  if(!data.secrets || !data.secrets[secret]){
    showNotice('スタンプ合言葉が違うみたい');
    return;
  }
  const s=data.secrets[secret];
  if(s.cardId!==cid){ showNotice('無効の合言葉だよ'); return; }
  if(!s.active){ showNotice('無効の合言葉だよ'); return; }

  card.stamped=card.stamped||{};
  card.stamped[data.userName]=card.stamped[data.userName]||[];
  if(card.stamped[data.userName].length>=card.max){
    showNotice(card.maxMsg||'MAXに達しました');
    return;
  }

  const idx=card.stamped[data.userName].length;
  card.stamped[data.userName].push(idx);
  saveData(data);
  showNotice(card.notice||'スタンプを押したよ');
  renderUserCards();
  addStampHistory(card.name);
}

// ===== スタンプ履歴 =====
function addStampHistory(cardName){
  const data=getData();
  if(!data.history) data.history=[];
  const now=new Date();
  data.history.push({card:cardName,user:data.userName,time:now.toLocaleString()});
  saveData(data);
  renderStampHistory();
}
function renderStampHistory(){
  const data=getData();
  const container=document.getElementById('stampHistory');
  container.innerHTML='';
  if(!data.history) return;
  for(const h of data.history){
    if(h.user===data.userName) container.innerHTML+='<div>'+h.card+' '+h.time+' に押しました</div>';
  }
}

// ===== 更新履歴 =====
function renderUpdates(){
  const data=getData();
  const container=document.getElementById('updateLog');
  container.innerHTML='';
  if(!data.updates) return;
  for(const u of data.updates){
    container.innerHTML+='<div>'+u+'</div>';
  }
}

// ===== 通知 =====
function showNotice(text){
  const popup=document.getElementById('noticePopup');
  document.getElementById('noticeText').textContent=text;
  popup.style.display='block';
}
function closeNotice(){ document.getElementById('noticePopup').style.display='none'; }

// ===== 管理者画面 =====
function loadAdminUI(){
  const data=getData();
  if(!data.cards) data.cards={};
  if(!data.secrets) data.secrets={};
  if(!data.updates) data.updates=[];
  renderAdminCards();
  renderSecrets();
}

function createCard(){
  const name=document.getElementById('newCardName').value.trim();
  const max=parseInt(document.getElementById('newCardMax').value);
  const notice=document.getElementById('newCardNotice').value.trim();
  const maxMsg=document.getElementById('newCardMaxMsg').value.trim();
  const addPass=document.getElementById('newCardPass').value.trim();
  const bg=document.getElementById('newCardBG').value.trim()||'images/base.png';
  const icon=document.getElementById('newCardIcon').value.trim()||'images/stamp.png';
  if(!name||!max||!addPass){ alert('必須項目を入力'); return; }

  const data=getData();
  const id='c'+Date.now();
  data.cards[id]={id,name,max,notice,maxMsg,addPass,bg,icon,addedUsers:[],serial:{},stamped:{}};
  saveData(data);
  loadAdminUI();
}

function renderAdminCards(){
  const data=getData();
  const container=document.getElementById('cardsAdminList');
  container.innerHTML='';
  for(const cid in data.cards){
    const card=data.cards[cid];
    const div=document.createElement('div');
    div.className='card';
    div.innerHTML=`${card.name} (枠:${card.max}, 追加パス:${card.addPass}) <button onclick="deleteCard('${cid}')">消去</button>`;
    container.appendChild(div);

    const sel=document.getElementById('selectCardForSecret');
    const option=document.createElement('option');
    option.value=cid;
    option.textContent=card.name;
    sel.appendChild(option);
  }
}

function deleteCard(cid){
  const data=getData();
  delete data.cards[cid];
  for(const sec in data.secrets){
    if(data.secrets[sec].cardId===cid) delete data.secrets[sec];
  }
  saveData(data);
  loadAdminUI();
}

// スタンプ合言葉
function createSecret(){
  const cid=document.getElementById('selectCardForSecret').value;
  const secret=document.getElementById('newSecret').value.trim();
  if(!secret||!cid) return;
  const data=getData();
  data.secrets[secret]={cardId:cid,active:true};
  saveData(data);
  renderSecrets();
}

function renderSecrets(){
  const data=getData();
  const container=document.getElementById('secretList');
  container.innerHTML='';
  for(const sec in data.secrets){
    const s=data.secrets[sec];
    const div=document.createElement('div');
    div.innerHTML=`カード:${data.cards[s.cardId]?data.cards[s.cardId].name:'削除済'} 合言葉:${sec} 状態:${s.active?'有効':'無効'} 
      <button onclick="toggleSecret('${sec}')">切替</button>
      <button onclick="deleteSecret('${sec}')">削除</button>`;
    container.appendChild(div);
  }
}
function toggleSecret(sec){
  const data=getData();
  data.secrets[sec].active=!data.secrets[sec].active;
  saveData(data);
  renderSecrets();
}
function deleteSecret(sec){
  const data=getData();
  delete data.secrets[sec];
  saveData(data);
  renderSecrets();
}

// 更新履歴
function addUpdate(){
  const text=document.getElementById('updateInput').value.trim();
  if(!text) return;
  const data=getData();
  const today=new Date();
  const dstr=`${today.getFullYear()}/${(today.getMonth()+1).toString().padStart(2,'0')}/${today.getDate().toString().padStart(2,'0')} ${text}`;
  data.updates.push(dstr);
  saveData(data);
  document.getElementById('updateInput').value='';
}