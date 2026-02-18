let currentUser = null
let currentTab = "goal"
const levelRules = [0,100,300,600,1000]

// ------------------------
// Storage
// ------------------------
function saveUsers(users){ localStorage.setItem("users",JSON.stringify(users)) }
function loadUsers(){ return JSON.parse(localStorage.getItem("users")||"{}") }

// ------------------------
// 註冊 / 登入
// ------------------------
function register(){
    const u=username.value, p=password.value
    let users = loadUsers()
    if(users[u]) return alert("帳號已存在")
    users[u] = {password:p,points:0,goals:[],rewards:[],lastResetDate:""}
    saveUsers(users)
    alert("註冊成功")
}

function login(){
    const u = username.value, p = password.value
    let users = loadUsers()
    if(!users[u] || users[u].password !== p) return alert("登入失敗")

    currentUser = u
    localStorage.setItem("currentUser", u) // 保持登入
    localStorage.setItem("lastUser", u)    // 記住帳號

    document.getElementById("loginPage").classList.add("hidden")
    document.getElementById("appPage").classList.remove("hidden")
    dailyReset()
    render()
}

function showLogin(){
    document.getElementById("loginPage").classList.remove("hidden")
    document.getElementById("appPage").classList.add("hidden")
}

// ------------------------
// 登出 / 重設
// ------------------------
function logout(){
    localStorage.removeItem("currentUser")
    location.reload()
}

function resetAccount(){
    if(!confirm("確定重設帳號？所有資料將清除")) return
    let users=loadUsers()
    users[currentUser]={password:users[currentUser].password,points:0,goals:[],rewards:[],lastResetDate:""}
    saveUsers(users)
    render()
}

// ------------------------
// 資料存取
// ------------------------
function getData(){ return loadUsers()[currentUser] }
function setData(data){ let users=loadUsers(); users[currentUser]=data; saveUsers(users) }

// ------------------------
// 每日重置
// ------------------------
function dailyReset(){
    let data = getData()
    let today = new Date().toDateString()
    if(data.lastResetDate!==today){
        data.goals.forEach(g=>{if(g.daily) g.completed=false})
        data.lastResetDate = today
        setData(data)
    }
}

// ------------------------
// 等級計算
// ------------------------
function getLevel(points){
    let lvl=1
    for(let i=0;i<levelRules.length;i++) if(points>=levelRules[i]) lvl=i+1
    return lvl
}

// ------------------------
// 畫面渲染
// ------------------------
function render(){
    let data = getData()
    let level = getLevel(data.points)
    let next = levelRules[level] || levelRules[levelRules.length-1]
    let prev = levelRules[level-1] || 0
    let percent = ((data.points-prev)/(next-prev))*100
    document.getElementById("userInfo").innerHTML = `${currentUser}｜Lv.${level}｜${data.points}點`
    document.getElementById("levelBar").style.width = percent+"%"

    renderGoals()
    renderRewards()
}

// ------------------------
// 渲染目標
// ------------------------
function renderGoals(){
    let data=getData()
    let el=document.getElementById("goalSection")
    let elDone=document.getElementById("goalCompletedSection")
    el.innerHTML=""
    elDone.innerHTML=""
    
    data.goals.forEach(g=>{
        let card=document.createElement("div")
        card.className="card goal"
        card.innerHTML=`
        <div class="goal-left">
            <input type="checkbox" ${g.completed?"checked":""} onclick="toggleGoal('${g.id}')">
            <span>${g.name} (+${g.points})</span>
            ${g.daily?'<span class="dot">●</span>':""}
        </div>
        <div>
            <button onclick="deleteGoal('${g.id}')">🗑</button>
        </div>`
        if(g.completed) elDone.appendChild(card)
        else el.appendChild(card)
    })
}

function renderRewards(){
    let data=getData()
    let el=document.getElementById("rewardSection")
    let elRedeemed=document.getElementById("rewardRedeemedSection")
    el.innerHTML=""
    elRedeemed.innerHTML=""

    data.rewards.forEach(r=>{
        let redeemed=r.redeemed||false
        let disabled=!redeemed && data.points<r.cost
        let card=document.createElement("div")
        card.className="card reward"
        card.innerHTML=`
        <div class="${redeemed?"redeemed":""}">
            <button ${disabled?"disabled":""} onclick="toggleRedeem('${r.id}')">
            ${redeemed?"退回":"兌換"}
            </button>
            ${r.name} (${r.cost})
        </div>
        <div>
            <button onclick="deleteReward('${r.id}')">🗑</button>
        </div>`
        if(redeemed) elRedeemed.appendChild(card)
        else el.appendChild(card)
    })
}

// ------------------------
// 互動功能
// ------------------------
function toggleGoal(id){
    let data=getData()
    let g=data.goals.find(x=>x.id===id)
    if(!g.completed){ data.points+=g.points }else{ data.points-=g.points }
    g.completed=!g.completed
    setData(data)
    render()
}

function deleteGoal(id){
    let data=getData()
    let g=data.goals.find(x=>x.id===id)
    if(g.completed) return alert("已完成目標不可刪除")
    data.goals=data.goals.filter(x=>x.id!==id)
    setData(data)
    render()
}

function deleteReward(id){
    let data=getData()
    data.rewards=data.rewards.filter(x=>x.id!==id)
    setData(data)
    render()
}

function toggleRedeem(id){
    let data=getData()
    let r=data.rewards.find(x=>x.id===id)
    if(!r.redeemed){
        if(data.points<r.cost) return
        data.points-=r.cost
        r.redeemed=true
    }else{
        data.points+=r.cost
        r.redeemed=false
    }
    setData(data)
    render()
}

// ------------------------
// 新增目標 / 獎勵
// ------------------------
function openForm(){
    let name = prompt("名稱")
    if(!name) return
    if(currentTab==="goal"){
        let points=parseInt(prompt("完成可得點數"))||10
        let daily=confirm("每日重複？")
        let data=getData()
        data.goals.push({id:Date.now()+"",name,daily,completed:false,points})
        setData(data)
    }else{
        let cost=parseInt(prompt("所需點數"))
        let data=getData()
        data.rewards.push({id:Date.now()+"",name,cost,redeemed:false})
        setData(data)
    }
    render()
}

// ------------------------
// Tab 切換
// ------------------------
function showTab(tab){
    currentTab=tab
    goalSection.classList.toggle("hidden", tab!=="goal")
    goalCompletedSection.classList.toggle("hidden", tab!=="goal")
    rewardSection.classList.toggle("hidden", tab!=="reward")
    rewardRedeemedSection.classList.toggle("hidden", tab!=="reward")
    goalTab.classList.toggle("active", tab==="goal")
    rewardTab.classList.toggle("active", tab==="reward")
}

// ------------------------
// 顯示 / 隱藏已完成列
// ------------------------
function toggleCompleted(type){
    if(type==="goal") document.getElementById("goalCompletedSection").classList.toggle("hidden")
    if(type==="reward") document.getElementById("rewardRedeemedSection").classList.toggle("hidden")
}

// ------------------------
// 自動登入檢查
// ------------------------
window.addEventListener("DOMContentLoaded", ()=>{
    const savedUser = localStorage.getItem("currentUser")
    if(savedUser && loadUsers()[savedUser]){
        currentUser = savedUser
        document.getElementById("loginPage").classList.add("hidden")
        document.getElementById("appPage").classList.remove("hidden")
        dailyReset()
        render()
    } else {
        const lastUser = localStorage.getItem("lastUser")
        if(lastUser) username.value = lastUser
        document.getElementById("loginPage").classList.remove("hidden")
        document.getElementById("appPage").classList.add("hidden")
    }
})

// ------------------------
// PWA Service Worker
// ------------------------
if("serviceWorker" in navigator){
    const swVersion = "v1-" + new Date().getTime()
    const swCode=`
    self.addEventListener('install', e=>{
        self.skipWaiting()
        console.log("SW ${swVersion} installed")
    })
    self.addEventListener('activate', e=>{
        self.clients.claim()
        console.log("SW ${swVersion} activated")
    })
    self.addEventListener('fetch', e=>{})
    `
    const blob=new Blob([swCode],{type:"text/javascript"})
    navigator.serviceWorker.register(URL.createObjectURL(blob))
}

// ------------------------
// Manifest
// ------------------------
const manifest={
    name:"Goal Reward App",
    short_name:"Goals",
    start_url:".?v="+new Date().getTime(),
    display:"standalone",
    background_color:"#ffffff",
    theme_color:"#4a90e2",
    icons:[
        {src:"icon-192.png?v="+new Date().getTime(),sizes:"192x192",type:"image/png"},
        {src:"icon-512.png?v="+new Date().getTime(),sizes:"512x512",type:"image/png"}
    ]
}
const manifestBlob=new Blob([JSON.stringify(manifest)],{type:"application/json"})
document.getElementById("manifestPlaceholder").setAttribute("href",URL.createObjectURL(manifestBlob))
