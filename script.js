// ローカルデータ取得・保存
function getData(){
  return JSON.parse(localStorage.getItem('stampData')||'{}');
}

function saveData(data){
  localStorage.setItem('stampData',JSON.stringify(data));
}

// ユーザー名設定
function setUserName(){
  const name=document.getElementById('userNameInput').value.trim();
  if(!name){ alert('名前を入力してください'); return; }
  const data=getData();
  data.userName=name;
  saveData(data);
  document.getElementById('displayUserName').innerText=name+' : のスタンプカード';
  document.getElementById('usernameDialog').style.display='none';
  document.getElementById('mainUserContent').style.display='block';
  renderUserCards();
}

// 管理者：カード作成
function createCard(){
  const name=document.getElementById('cardName').value.trim();
  const max=parseInt(document.getElementById('cardMax').value);
  const notice=document.getElementById('cardNotice').value.trim()||'スタンプを押したよ';
  const noticeMax=document.getElementById('cardNoticeMax').value.trim()||'スタンプがMAXになりました';
  const addPass=document.getElementById('cardAddPass').value.trim();
  const bg=document.getElementById('cardBg').value.trim();
  const icon=document.getElementById('cardIcon').value.trim();
  if(!name||!max||!addPass){ alert('必須項目を入力してください'); return; }

  const data=getData();
  if(!data.cards) data.cards={};
  const cid='card'+Date.now();
  data.cards[cid]={name,max,notice,noticeMax,addPass,bg,icon,stamped:{},serial:{}};
  saveData(data);
  loadAdminUI();
}

// 管理者：カード一覧表示
function loadAdminUI(){
  const data=getData();
  const list=document.getElementById('cardsAdminList');
  list.innerHTML='';
  const select=document.getElementById('selectCardForSecret');
  select.innerHTML='';
  if(!data.cards) return;
  for(const cid in data.cards){
    const card=data.cards[cid];
    select.innerHTML+='<option value="'+cid+'">'+card.name+'</option>';
    const div=document.createElement('div');
    div.className='card';
    div.innerHTML=`${card.name} <br> パス:${card.addPass} 枠数:${card.max}
      <button onclick="deleteCard('${cid}')">消去</button>`;
    list.appendChild(div);
  }
  renderSecrets();
}

// 管理者：カード削除
function deleteCard(cid){
  const data=getData();
  delete data.cards[cid];
  // 紐づく合言葉も削除
  if(data.secrets){
    for(const sec in data.secrets){
      if(data.secrets[sec].cardId===cid) delete data.secrets[sec];
    }
  }
  saveData(data);
  loadAdminUI();
}

// 管理者：合言葉作成
function createSecret(){
  const cid=document.getElementById('selectCardForSecret').value;
  const secret=document.getElementById('newSecret').value.trim();
  if(!secret||!cid){ alert('カードと合言葉を入力'); return; }
  const data=getData();
  if(!data.secrets) data.secrets={};
  data.secrets[secret]={cardId:cid,active:true};
  saveData(data);
  renderSecrets();
}

// 管理者：合言葉一覧
function renderSecrets(){
  const list=document.getElementById('secretList');
  list.innerHTML='';
  const data=getData();
  if(!data.secrets) return;
  for(const sec in data.secrets){
    const s=data.secrets[sec];
    const cardName=data.cards[s.cardId]?data.cards[s.cardId].name:'削除済';
    const div=document.createElement('div');
    div.innerHTML=`${cardName} : ${sec} 状態:${s.active?'有効':'無効'}
      <button onclick="toggleSecret('${sec}')">切替</button>
      <button onclick="deleteSecret('${sec}')">消去</button>`;
    list.appendChild(div);
  }
}

// 管理者：合言葉切替
function toggleSecret(sec){
  const data=getData();
  data.secrets[sec].active=!data.secrets[sec].active;
  saveData(data);
  renderSecrets();
}

// 管理者：合言葉消去
function deleteSecret(sec){
  const data=getData();
  delete data.secrets[sec];
  saveData(data);
  renderSecrets();
}

// 管理者：更新履歴追加
function addUpdate(){
  const txt=document.getElementById('updateInput').value.trim();
  if(!txt) return;
  const data=getData();
  if(!data.updates) data.updates=[];
  data.updates.push(txt);
  saveData(data);
  renderUpdates();
}

// ユーザー：カード追加（パス入力）
function addCardByPass(){
  const pass=document.getElementById('addCardPass').value.trim();
  const data=getData();
  if(!data.cards||!pass) return alert('入力してください');
  for(const cid in data.cards){
    const c=data.cards[cid];
    if(c.addPass===pass){
      if(!c.addedUsers) c.addedUsers=[];
      if(!c.addedUsers.includes(data.userName)) c.addedUsers.push(data.userName);
      // シリアル作成
      if(!c.serial) c.serial={};
      if(!c.serial[data.userName]) c.serial[data.userName]=('00000'+(Object.keys(c.serial).length+1)).slice(-5);
      saveData(data);
      renderUserCards();
      return;
    }
  }
  alert('合言葉が違います');
}

// ユーザー：カード描画
function renderUserCards(){
  const data=getData();
  const container=document.getElementById('cardsContainer');
  container.innerHTML='';
  if(!data.cards) return;
  for(const cid in data.cards){
    const card = data.cards[cid];
    if(!card.addedUsers||!card.addedUsers.includes(data.userName)) continue;

    const div=document.createElement('div');
    div.className='card';
    div.style.backgroundImage = card.bg ? `url(${card.bg})` : '';
    div.style.backgroundColor = card.bg ? '' : '#ffe4e1';

    let stampsHtml='';
    for(let i=0;i<card.max;i++){
      const stamped=(card.stamped&&card.stamped[data.userName]&&card.stamped[data.userName].includes(i));
      stampsHtml+=`<div class="stampBox">${stamped?'<img src="'+card.icon+'">':''}</div>`;
    }

    div.innerHTML=`<h3>${card.name}</h3>
      <div class="stampRow">${stampsHtml}</div>
      <button onclick="stampCard('${cid}')">スタンプを押す</button>
      <div style="position:absolute;bottom:5px;right:5px;font-size:14px;">${card.serial[data.userName]}</div>`;
    container.appendChild(div);
  }

  renderUpdates();
  renderStampHistory();
}

// ユーザー：スタンプ押す処理
function stampCard(cid){
  const data=getData();
  const card=data.cards[cid];
  const sec=prompt('合言葉を入力してください');
  if(!sec) return;
  if(!data.secrets||!data.secrets[sec]) return alert('無効の合言葉だよ');
  if(!data.secrets[sec].active) return alert('無効の合言葉だよ');
  if(data.secrets[sec].cardId!==cid) return alert('スタンプ合言葉が違うみたい');

  if(!card.stamped) card.stamped={};
  if(!card.stamped[data.userName]) card.stamped[data.userName]=[];

  if(card.stamped[data.userName].length>=card.max) return alert(card.noticeMax||'MAXになりました');
  card.stamped[data.userName].push(card.stamped[data.userName].length);
  saveData(data);
  alert(card.notice||'スタンプを押したよ');
  renderUserCards();
}

// 更新履歴表示
function renderUpdates(){
  const log=document.getElementById('updateLog');
  log.innerHTML='';
  const data=getData();
  if(data.updates){
    data.updates.forEach(u=>log.innerHTML+='<div>'+u+'</div>');
  }
}

// スタンプ履歴表示
function renderStampHistory(){
  const hist=document.getElementById('stampHistory');
  hist.innerHTML='';
  const data=getData();
  if(!data.cards) return;
  for(const cid in data.cards){
    const card=data.cards[cid];
    if(!card.stamped||!card.stamped[data.userName]) continue;
    card.stamped[data.userName].forEach((i,index)=>{
      hist.innerHTML+='<div>'+card.name+'  '+new Date().toLocaleString()+' に押しました</div>';
    });
  }
}

// 初期ロード
window.onload=function(){
  const data=getData();
  if(!data.userName){
    document.getElementById('usernameDialog').style.display='block';
  }else{
    setUserName();
  }
  if(document.getElementById('cardsAdminList')) loadAdminUI();
};