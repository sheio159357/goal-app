// ==========================
// 🟢 基本變數
// ==========================
let currentUser = null, currentTab = "goal", levelRules = [0,100,300,600,1000];
const SECRET_KEY = "my_super_secret_key"; // AES 加密用

// ==========================
// 📦 Storage
// ==========================
function saveUsers(users){ localStorage.setItem("users", JSON.stringify(users)) }
function loadUsers(){ return JSON.parse(localStorage.getItem("users") || "{}") }

// ==========================
// 📝 Register / Login
// ==========================
function register(){
    const u = username.value, p = password.value;
    let users = loadUsers();
    if(users[u]) return alert("帳號已存在");
    users[u] = { password: p, points: 0, goals: [], rewards: [], lastResetDate: "" };
    saveUsers(users);
    alert("註冊成功");
}

function login(){
    const u = username.value, p = password.value;
    let users = loadUsers();
    if(!users[u] || users[u].password !== p) return alert("登入失敗");

    currentUser = u;

    // ✅ 記憶帳密
    if(document.getElementById("rememberMe").checked){
        localStorage.setItem("rememberUser", u);
        const encryptedPass = CryptoJS.AES.encrypt(p, SECRET_KEY).toString();
        localStorage.setItem("rememberPass", encryptedPass);
    } else {
        localStorage.removeItem("rememberUser");
        localStorage.removeItem("rememberPass");
    }

    loginPage.classList.add("hidden");
    appPage.classList.remove("hidden");
    dailyReset();
    render();
}

function logout(){ location.reload() }

function resetAccount(){
    if(!confirm("確定重設帳號？")) return;
    let users = loadUsers();
    users[currentUser] = { password: users[currentUser].password, points: 0, goals: [], rewards: [], lastResetDate: "" };
    saveUsers(users);
    render();
}

// ==========================
// 📊 Data Helpers
// ==========================
function getData(){ return loadUsers()[currentUser] }
function setData(data){ let users=loadUsers(); users[currentUser]=data; saveUsers(users) }

// ==========================
// 🌞 Daily Reset
// ==========================
function dailyReset(){
    let data=getData(), today=new Date().toDateString();
    if(data.lastResetDate!==today){
        data.goals.forEach(g=>{ if(g.daily) g.completed=false });
        data.lastResetDate = today;
        setData(data);
    }
}

// ==========================
// 🏆 Level
// ==========================
function getLevel(points){
    let lvl=1;
    for(let i=0;i<levelRules.length;i++)
        if(points>=levelRules[i]) lvl=i+1;
    return lvl;
}

// ==========================
// 🖌 Render
// ==========================
function render(){
    let data=getData(), level=getLevel(data.points), next=levelRules[level]||levelRules[levelRules.length-1], prev=levelRules[level-1]||0;
    let percent = ((data.points-prev)/(next-prev))*100;
    userInfo.innerHTML = `${currentUser}｜Lv.${level}｜${data.points}點｜${Math.floor(percent)}%`;
    levelBar.style.width = percent+"%";
    renderGoals(); renderRewards();
}

// ==========================
// ✅ Goals / Rewards Render
// ==========================
function renderGoals(){ 
    let data=getData(); goalSection.innerHTML="";
    data.goals.forEach(g=>{
        let card = document.createElement("div"); card.className="card goal"; card.draggable=true;
        card.ondragstart = e => e.dataTransfer.setData("id", g.id);
        card.ondragover = e => e.preventDefault();
        card.ondrop = e => dropGoal(e,g.id);
        card.innerHTML = `<div><input type="checkbox" ${g.completed?"checked":""} onclick="toggleGoal('${g.id}')">${g.name} (+${g.points}) ${g.daily?"●":""}</div><button onclick="deleteGoal('${g.id}')">🗑</button>`;
        goalSection.appendChild(card);
    });
}

function renderRewards(){
    let data=getData(); rewardSection.innerHTML="";
    data.rewards.forEach(r=>{
        let redeemed = r.redeemed||false, disabled = !redeemed && data.points<r.cost;
        let card = document.createElement("div"); card.className="card reward"; card.draggable=true;
        card.ondragstart = e => e.dataTransfer.setData("id", r.id);
        card.ondragover = e => e.preventDefault();
        card.ondrop = e => dropReward(e,r.id);
        card.innerHTML = `<div class="${redeemed?"redeemed":""}"><button ${disabled?"disabled":""} onclick="toggleRedeem('${r.id}')">${redeemed?"退回":"兌換"}</button>${r.name} (${r.cost})</div><button onclick="deleteReward('${r.id}')">🗑</button>`;
        rewardSection.appendChild(card);
    });
}

// ==========================
// 🔀 Drag & Drop
// ==========================
function dropGoal(e,targetId){
    let data=getData(), fromId=e.dataTransfer.getData("id"), list=data.goals;
    let fromIndex=list.findIndex(x=>x.id===fromId), toIndex=list.findIndex(x=>x.id===targetId);
    let item=list.splice(fromIndex,1)[0]; list.splice(toIndex,0,item); setData(data); render();
}

function dropReward(e,targetId){
    let data=getData(), fromId=e.dataTransfer.getData("id"), list=data.rewards;
    let fromIndex=list.findIndex(x=>x.id===fromId), toIndex=list.findIndex(x=>x.id===targetId);
    let item=list.splice(fromIndex,1)[0]; list.splice(toIndex,0,item); setData(data); render();
}

// ==========================
// 🔄 Toggle / Delete
// ==========================
function toggleGoal(id){
    let data=getData(), g=data.goals.find(x=>x.id===id);
    if(!g.completed){ data.points+=g.points } else { data.points-=g.points }
    g.completed=!g.completed; setData(data); render();
}

function deleteGoal(id){ let data=getData(), g=data.goals.find(x=>x.id===id); if(g.completed) return alert("已完成不可刪除"); data.goals=data.goals.filter(x=>x.id!==id); setData(data); render(); }
function deleteReward(id){ let data=getData(); data.rewards=data.rewards.filter(x=>x.id!==id); setData(data); render(); }

function toggleRedeem(id){
    let data=getData(), r=data.rewards.find(x=>x.id===id);
    if(!r.redeemed){
        if(data.points<r.cost) return;
        data.points-=r.cost; r.redeemed=true;
    } else { data.points+=r.cost; r.redeemed=false; }
    setData(data); render();
}

// ==========================
// ➕ Add Goal / Reward
// ==========================
function openForm(){
    let name = prompt("名稱"); if(!name) return;
    if(currentTab==="goal"){
        let points = parseInt(prompt("點數"))||10, daily = confirm("每日？"), data=getData();
        data.goals.push({ id:Date.now()+"", name, daily, completed:false, points });
        setData(data);
    } else {
        let cost = parseInt(p
