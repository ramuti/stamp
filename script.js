// データ保存用
let cards = [];
let userData = {};
let secrets = [];

function initUserUI() {
    if(!localStorage.getItem('userName')){
        document.getElementById('userDialog').style.display='block';
    } else {
        renderUserCards();
    }
}

function saveUserName() {
    const name = document.getElementById('userNameInput').value.trim();
    if(name==='') return alert('名前を入力してください');
    localStorage.setItem('userName', name);
    document.getElementById('userDialog').style.display='none';
    renderUserCards();
}

function renderUserCards() {
    const container = document.getElementById('cardsContainer');
    container.innerHTML='';
    const name = localStorage.getItem('userName');
    cards.forEach(card=>{
        if(card.addedUsers && card.addedUsers.includes(name)){
            const div = document.createElement('div');
            div.className='card';
            div.style.backgroundImage = card.bg ? `url(${card.bg})` : 'url(images/base.png)';
            div.innerHTML=`
                <h3>${card.name}</h3>
                <div class="stamp-box" id="stamps_${card.id}"></div>
                <button onclick="pushStamp('${card.id}')">スタンプを押す</button>
                <div class="serial">${card.serial || '00001'}</div>
            `;
            container.appendChild(div);
            renderStamps(card);
        }
    });
}

function addCardByPass(){
    const pass = document.getElementById('addCardPass').value.trim();
    const name = localStorage.getItem('userName');
    const card = cards.find(c=>c.addPass===pass);
    if(!card) { alert('追加パスが違います'); return; }
    if(!card.addedUsers) card.addedUsers=[];
    if(!card.addedUsers.includes(name)) card.addedUsers.push(name);
    renderUserCards();
    document.getElementById('addCardDialog').style.display='none';
}

function pushStamp(cardId){
    const input = prompt('スタンプの合言葉を入力してください');
    const card = cards.find(c=>c.id===cardId);
    const secret = secrets.find(s=>s.cardId===cardId && s.word===input && s.enabled);
    const name = localStorage.getItem('userName');
    if(!secret) { showNotice('スタンプ合言葉が違うみたい'); return; }
    if(!card.stamped) card.stamped={};
    if(card.stamped[input] && card.stamped[input].includes(name)) { showNotice('もう押してあるよ'); return; }
    if(!card.stamped[input]) card.stamped[input]=[];
    card.stamped[input].push(name);
    showNotice(card.notice || 'スタンプを押しました！');
    renderStamps(card);
}

function renderStamps(card){
    const container = document.getElementById('stamps_'+card.id);
    if(!container) return;
    container.innerHTML='';
    const total = card.max || 5;
    const name = localStorage.getItem('userName');
    for(let i=0;i<total;i++){
        const span = document.createElement('span');
        if(card.stamped){
            let count=0;
            for(let k in card.stamped){
                if(card.stamped[k].includes(name)) count+=card.stamped[k].length;
            }
            if(i<count){
                const img = document.createElement('img');
                img.src = card.icon || 'images/stamp.png';
                img.className='stamp-icon';
                span.appendChild(img);
                setTimeout(()=>{ img.style.transform='scale(1.5)'; setTimeout(()=>img.style.transform='scale(1)',300); },100);
                img.style.display='block';
            }
        }
        container.appendChild(span);
    }
}

function showNotice(text){
    const n = document.getElementById('notice');
    document.getElementById('noticeText').innerText=text;
    n.style.display='block';
}

function closeNotice(){ document.getElementById('notice').style.display='none'; }

/* --- 管理者側 --- */
function initAdminUI(){
    updateCardList();
    updateSecretList();
}

function createCard(){
    const name=document.getElementById('newCardName').value.trim();
    const max=parseInt(document.getElementById('newCardMax').value);
    const notice=document.getElementById('newCardNotice').value;
    const maxMsg=document.getElementById('newCardMaxMsg').value;
    const addPass=document.getElementById('newCardAddPass').value.trim();
    if(!name || !max || !addPass) { alert('カード名・枠数・追加パスは必須'); return; }
    const bgInput=document.getElementById('newCardBG');
    const iconInput=document.getElementById('newCardIcon');
    const readerBg=new FileReader();
    readerBg.onload=function(e){
        const bg=e.target.result;
        const readerIcon=new FileReader();
        readerIcon.onload=function(e2){
            const icon=e2.target.result;
            const id='c'+(cards.length+1);
            cards.push({id,name,max,notice,maxMsg,addPass,bg,icon,addedUsers:[],serial:('0000'+(cards.length+1)).slice(-5)});
            updateCardList();
            updateCardSelect();
        };
        if(iconInput.files[0]) readerIcon.readAsDataURL(iconInput.files[0]);
        else {
            const id='c'+(cards.length+1);
            cards.push({id,name,max,notice,maxMsg,addPass,bg,icon:'images/stamp.png',addedUsers:[],serial:('0000'+(cards.length+1)).slice(-5)});
            updateCardList();
            updateCardSelect();
        }
    };
    if(bgInput.files[0]) readerBg.readAsDataURL(bgInput.files[0]);
    else {
        const id='c'+(cards.length+1);
        cards.push({id,name,max,notice,maxMsg,addPass,bg:'images/base.png',icon:'images/stamp.png',addedUsers:[],serial:('0000'+(cards.length+1)).slice(-5)});
        updateCardList();
        updateCardSelect();
    }
}

function updateCardList(){
    const list=document.getElementById('cardsAdminList');
    if(!list) return;
    list.innerHTML='';
    cards.forEach(c=>{
        const div=document.createElement('div');
        div.textContent=`${c.name} 追加パス:${c.addPass} 枠数:${c.max}`;
        list.appendChild(div);
    });
}

function updateCardSelect(){
    const sel=document.getElementById('selectCardForSecret');
    if(!sel) return;
    sel.innerHTML='';
    cards.forEach(c=>{
        const opt=document.createElement('option');
        opt.value=c.id;
        opt.textContent=c.name;
        sel.appendChild(opt);
    });
}

function createSecret(){
    const cardId=document.getElementById('selectCardForSecret').value;
    const word=document.getElementById('newSecretWord').value.trim();
    if(!word) return alert('合言葉を入力');
    secrets.push({cardId,word,enabled:true});
    updateSecretList();
}

function updateSecretList(){
    const container=document.getElementById('secretList');
    if(!container) return;
    container.innerHTML='';
    secrets.forEach((s,i)=>{
        const div=document.createElement('div');
        div.innerHTML=`カード:${s.cardId} 合言葉:${s.word} 状態:${s.enabled?'有効':'無効'}
        <button onclick="toggleSecret(${i})">切替</button>
        <button onclick="deleteSecret(${i})">削除</button>`;
        container.appendChild(div);
    });
}

function toggleSecret(i){ secrets[i].enabled=!secrets[i].enabled; updateSecretList(); }
function deleteSecret(i){ secrets.splice(i,1); updateSecretList(); }