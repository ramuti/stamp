// データ初期化
let cards = JSON.parse(localStorage.getItem("cards")) || [];
let secrets = JSON.parse(localStorage.getItem("secrets")) || {};
let updates = JSON.parse(localStorage.getItem("updates")) || [];
let users = JSON.parse(localStorage.getItem("users")) || {};
let currentUser = localStorage.getItem("currentUser") || "";

// -------------------
// ユーザー画面
// -------------------
function showUserNameDialog() {
  const dialog = document.getElementById("userNameDialog");
  const okBtn = document.getElementById("okUserName");
  if(!currentUser){
    dialog.style.display = "flex";
    okBtn.onclick = ()=>{
      const name = document.getElementById("userNameInput").value.trim();
      if(!name) return alert("名前を入力してください");
      currentUser = name;
      localStorage.setItem("currentUser", currentUser);
      users[currentUser] = users[currentUser] || {};
      localStorage.setItem("users", JSON.stringify(users));
      dialog.style.display = "none";
      renderUserTitle();
      renderUserCards();
      renderUserUpdates();
    };
  } else {
    renderUserTitle();
    renderUserCards();
    renderUserUpdates();
  }
}

function renderUserTitle(){
  document.getElementById("userTitle").textContent = `${currentUser}のスタンプカード`;
}

function renderUserCards(){
  const container = document.getElementById("userCards");
  container.innerHTML="";
  cards.forEach((card, idx)=>{
    const div = document.createElement("div");
    div.className="userCard";
    if(card.bg) div.style.backgroundImage=`url(${card.bg})`;
    div.innerHTML=`<h3>${card.title}</h3>`;
    // 枠
    const rows = Math.ceil(card.slots/5);
    for(let r=0;r<rows;r++){
      const rowDiv = document.createElement("div");
      rowDiv.className="stampRow";
      for(let c=0;c<5;c++){
        const slotIdx = r*5+c;
        if(slotIdx>=card.slots) break;
        const slot = document.createElement("div");
        slot.className="stampSlot";
        rowDiv.appendChild(slot);
      }
      div.appendChild(rowDiv);
    }
    // ボタン
    const btn = document.createElement("button");
    btn.textContent="スタンプを押す";
    btn.className="stampButton";
    btn.onclick=()=>pressStamp(idx);
    div.appendChild(btn);
    // シリアル
    const serial = document.createElement("div");
    serial.className="serialNumber";
    serial.textContent="00001";
    div.appendChild(serial);

    container.appendChild(div);
  });
}

function renderUserUpdates(){
  const list = document.getElementById("userUpdateList");
  list.innerHTML="";
  updates.forEach(u=>{
    const div=document.createElement("div");
    div.textContent=u;
    list.appendChild(div);
  });
}

// カード追加
document.getElementById("userAddCardBtn").onclick=()=>{
  const pass = document.getElementById("userAddPass").value.trim();
  const card = cards.find(c=>c.pass===pass);
  if(!card) return alert("カードが見つかりません");
  users[currentUser][card.title]=users[currentUser][card.title]||0;
  localStorage.setItem("users", JSON.stringify(users));
  renderUserCards();
};

// スタンプ処理（簡易）
function pressStamp(cardIdx){
  const pass = prompt("合言葉を入力してください");
  if(!pass) return;
  const card = cards[cardIdx];
  const cardSecrets = secrets[card.title] || [];
  const secret = cardSecrets.find(s=>s.secret===pass);
  if(!secret) return alert("無効の合言葉です");
  alert(card.notify||"スタンプを押したよ");
}

// -------------------
// 管理者画面
// -------------------
function renderAdminCards(){
  const container = document.getElementById("cardsList");
  container.innerHTML="";
  cards.forEach((card, idx)=>{
    const div = document.createElement("div");
    div.innerHTML=`${card.title} / ${card.pass} / ${card.slots}`;
    const del = document.createElement("button");
    del.textContent="削除";
    del.onclick=()=>{
      cards.splice(idx,1);
      localStorage.setItem("cards", JSON.stringify(cards));
      // 合言葉も削除
      delete secrets[card.title];
      localStorage.setItem("secrets", JSON.stringify(secrets));
      renderAdminCards();
    };
    div.appendChild(del);
    container.appendChild(div);
  });
}

document.getElementById("createCardBtn").onclick=()=>{
  const title=document.getElementById("cardTitle").value.trim();
  const pass=document.getElementById("cardPass").value.trim();
  const slots=parseInt(document.getElementById("cardSlots").value)||1;
  const notify=document.getElementById("notifyText").value.trim()||"スタンプを押したよ";
  const maxNotify=document.getElementById("maxNotifyText").value.trim()||"スタンプがMAXになりました スクショして管理者にお知らせしましょう";
  const bg=document.getElementById("bgImageInput").files[0]?URL.createObjectURL(document.getElementById("bgImageInput").files[0]):"";
  const stamp=document.getElementById("stampImageInput").files[0]?URL.createObjectURL(document.getElementById("stampImageInput").files[0]):"";
  if(!title||!pass) return alert("カード名と追加パスは必須");
  cards.push({title,pass,slots,notify,maxNotify,bg,stamp});
  localStorage.setItem("cards", JSON.stringify(cards));
  renderAdminCards();
};

// 合言葉作成
document.getElementById("addSecretBtn").onclick=()=>{
  const card = document.getElementById("selectCard").value;
  const secret=document.getElementById("stampSecretInput").value.trim();
  if(!card || !secret) return alert("カードと合言葉を入力してください");
  secrets[card]=secrets[card]||[];
  secrets[card].push({secret,enabled:true});
  localStorage.setItem("secrets", JSON.stringify(secrets));
  alert("作成しました");
};

// 管理者更新履歴
document.getElementById("addUpdateBtn").onclick=()=>{
  const text = document.getElementById("updateInput").value.trim();
  if(!text) return;
  updates.push(`${new Date().toLocaleDateString()} ${text}`);
  localStorage.setItem("updates", JSON.stringify(updates));
  document.getElementById("updateInput").value="";
  document.getElementById("updateList").innerHTML="";
  updates.forEach(u=>{
    const div=document.createElement("div");
    div.textContent=u;
    document.getElementById("updateList").appendChild(div);
  });
};

// 初期レンダリング
showUserNameDialog();
if(document.getElementById("cardsList")) renderAdminCards();