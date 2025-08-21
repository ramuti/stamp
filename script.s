
// ===== データ管理 =====
function getData(){ return JSON.parse(localStorage.getItem("stampCardData")||"{}"); }
function saveData(data){ localStorage.setItem("stampCardData", JSON.stringify(data)); }

// ===== ユーザー名 =====
function saveUserName(){
  const name=document.getElementById("userName").value.trim();
  if(!name) return alert("名前を入力してください");
  const data=getData();
  data.userName=name;
  saveData(data);
  loadUserUI();
}

// ===== 音設定 =====
function loadSoundSettings(){
  const data=getData();
  data.soundSettings=data.soundSettings||{on:true, volume:0.5};
  saveData(data);
  if(document.getElementById("soundOn")) document.getElementById("soundOn").checked=data.soundSettings.on;
  if(document.getElementById("soundVolume")) document.getElementById("soundVolume").value=data.soundSettings.volume;
}
function toggleSound(){
  const data=getData();
  data.soundSettings.on=document.getElementById("soundOn").checked;
  saveData(data);
}
function changeVolume(val){
  const data=getData();
  data.soundSettings.volume=parseFloat(val);
  saveData(data);
}
function playStampSound(){
  const data=getData();
  if(!data.soundSettings?.on) return;
  const audio=document.getElementById("stampSound");
  if(audio){ audio.volume=data.soundSettings.volume; audio.play(); }
}

// ===== ユーザー画面UI =====
function loadUserUI(){
  const data=getData();
  const container=document.getElementById("cardsContainer");
  if(!container) return;
  container.innerHTML="";
  if(!data.userName) return;
  if(!data.cards) return;
  for(const cardId in data.cards){
    const card=data.cards[cardId];
    const div=document.createElement("div");
    div.className="card";
    div.innerHTML=`<img id="stampIcon_${cardId}" src="${card.stampIcon}" width="50">
      <div>
      <h4>${card.name}</h4>
      <p>スタンプ: ${card.stamps||0}/${card.max}</p>
      </div>`;
    container.appendChild(div);
  }
}

// ===== スタンプ追加 =====
function addStamp(cardId){
  const data=getData();
  if(!data.cards[cardId]) return;
  const card=data.cards[cardId];
  if(!card.stamps) card.stamps=0;
  card.stamps++;
  const now=new Date();
  if(!card.history) card.history=[];
  card.history.push(now.toISOString().replace('T',' ').split('.')[0]);
  saveData(data);

  const notice=card.noticeMessage||"スタンプを押しました！";
  showNotice(notice);

  const stampEl=document.getElementById(`stampIcon_${cardId}`);
  if(stampEl){ stampEl.classList.add("stamp-animate");
    setTimeout(()=>{ stampEl.classList.remove("stamp-animate"); },600);
  }

  playStampSound();

  if(card.stamps>=card.max && card.maxMsg) alert(card.maxMsg);

  loadUserUI();
}

// ===== 通知表示 =====
function showNotice(msg){
  const el=document.getElementById("notice");
  if(!el) return;
  el.textContent=msg;
  el.style.display="block";
  setTimeout(()=>{ el.style.display="none"; },1500);
}

// ===== URL処理 =====
function handleURLStamp(){
  const params=new URLSearchParams(window.location.search);
  const u=params.get("u");
  if(!u) return;
  const data=getData();
  if(!data.urls || !data.urls[u]) return alert("無効なURLです");
  const urlInfo=data.urls[u];
  if(!urlInfo.active) return alert("このURLは終了しています");
  addStamp(urlInfo.cardId);
  urlInfo.active=false;
  saveData(data);
}

// ===== 管理者画面UI =====
function loadAdminUI(){
  const data=getData();
  const container=document.getElementById("urlList");
  if(container) container.innerHTML="";
  if(data.urls) for(const urlId in data.urls){
    const url=data.urls[urlId];
    const card=data.cards[url.cardId];
    const div=document.createElement("div");
    div.className="admin-box";
    div.innerHTML=`${url.user||"未指定"} - ${card.name} - ${urlId} - 状態: ${url.active?"有効":"無効"}
      <input value="${location.origin}/user/index.html?u=${urlId}" readonly style="width:60%;">`;
    if(container){
      const copyBtn=document.createElement("button");
      copyBtn.textContent="コピー";
      copyBtn.onclick=()=>{ navigator.clipboard.writeText(location.origin+"/user/index.html?u="+urlId); alert("コピーしました"); };
      div.appendChild(copyBtn);
      const toggleBtn=document.createElement("button");
      toggleBtn.textContent=url.active?"無効化":"再有効化";
      toggleBtn.onclick=()=>{ url.active=!url.active; saveData(data); loadAdminUI(); };
      div.appendChild(toggleBtn);
      container.appendChild(div);
    }
  }

  const cContainer=document.getElementById("cardsAdminList");
  if(cContainer) cContainer.innerHTML="";
  if(data.cards) for(const cid in data.cards){
    const c=data.cards[cid];
    const div=document.createElement("div");
    div.className="admin-box";
    div.textContent=`${c.name}（管理者題名: ${c.internalName}） スタンプ: ${c.stamps||0}/${c.max}`;
    cContainer.appendChild(div);
  }
}

// ===== カード作成 =====
function createCard(){
  const name=document.getElementById("newCardName").value.trim();
  const internalName=document.getElementById("newCardInternalName").value.trim();
  const max=parseInt(document.getElementById("newCardMax").value)||5;
  const notice=document.getElementById("newCardNotice").value.trim();
  const maxMsg=document.getElementById("newCardMaxMsg").value.trim();
  const bg=document.getElementById("newCardBG").value.trim();
  const icon=document.getElementById("newCardIcon").value.trim();
  if(!name || !internalName) return alert("カード名と管理者題名必須");
  const data=getData();
  const id="card_"+Date.now();
  data.cards=data.cards||{};
  data.cards[id]={name, internalName, max, noticeMessage:notice, maxMsg, bg, stampIcon:icon, stamps:0, history:[]};
  saveData(data);
  loadAdminUI();
  alert("カード作成完了");
}

// ===== URL作成 =====
function generateURL(cardId, user){
  const data=getData();
  data.urls=data.urls||{};
  const id="url_"+Date.now();
  data.urls[id]={cardId, user, active:true};
  saveData(data);
  alert("URL発行: "+location.origin+"/user/index.html?u="+id+" （自動コピー済み）");
  navigator.clipboard.writeText(location.origin+"/user/index.html?u="+id);
  loadAdminUI();
}