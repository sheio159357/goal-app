let userInfo, levelBar
let currentUser=null
let currentTab="goal"

// 每100經驗升一級（用 exp）
function getLevel(exp){
  return Math.floor(exp/100)+1
}

// ===== 徽章 =====
function getBadge(level){
  if(level>=100) return "👑"
  if(level>=90) return "⚙️"
  if(level>=80) return "⛰️"
  if(level>=70) return "🎯"
  if(level>=60) return "⚡"
  if(level>=50) return "⬆️"
  if(level>=40) return "🔥"
  if(level>=30) return "🔗"
  if(level>=20) return "👣"
  if(level>=10) return "🧭"
  return "🌱"
}

// ===== 稱謂 =====
function getTitle(level){
  if(level>=100) return "傳奇實踐者"
  if(level>=90) return "系統化達人"
  if(level>=80) return "巔峰行動者"
  if(level>=70) return "目標掌控者"
  if(level>=60) return "高效實踐者"
  if(level>=50) return "成長推進者"
  if(level>=40) return "自律挑戰者"
  if(level>=30) return "習慣建立者"
  if(level>=20) return "行動執行者"
  if(level>=10) return "目標探索者"
  return "新手學徒"
}

function saveUsers(users){localStorage.setItem("users",JSON.stringify(users))}
function loadUsers(){return JSON.parse(localStorage.getItem("users")||"{}")}

function getData(){
  let data=loadUsers()[currentUser]

  // ⭐ 舊帳號自動補 exp
  if(data.exp===undefined){
    data.exp=data.points||0
  }

  return data
}

function setData(data){
  let users=loadUsers()
  users[currentUser]=data
  saveUsers(users)
}

document.addEventListener("DOMContentLoaded",initApp)

function initApp(){
  userInfo = document.getElementById("userInfo")
  levelBar = document.getElementById("levelBar")
  
  const savedUser=localStorage.getItem("currentUser")
  const users=loadUsers()
  if(savedUser && users[savedUser]){
    currentUser=savedUser
    showApp()
  }else{
    showLogin()
  }
}

function showLogin(){
  loginPage.classList.remove("hidden")
  appPage.classList.add("hidden")
}

function showApp(){
  loginPage.classList.add("hidden")
  appPage.classList.remove("hidden")
  dailyReset()
  renderAll()
}

function register(){
  const u=username.value.trim()
  const p=password.value.trim()
  if(!u||!p)return alert("請輸入帳密")

  let users=loadUsers()
  if(users[u])return alert("帳號已存在")

  users[u]={
    password:p,
    points:0,   // 可用點數
    exp:0,      // ⭐ 累積經驗
    goals:[],
    rewards:[],
    lastResetDate:""
  }

  saveUsers(users)
  alert("註冊成功")
}

function login(){
  const u=username.value.trim()
  const p=password.value.trim()
  let users=loadUsers()

  if(!users[u]||users[u].password!==p)return alert("登入失敗")

  currentUser=u
  localStorage.setItem("currentUser",u)
  showApp()
}

function logout(){
  localStorage.removeItem("currentUser")
  location.reload()
}

function resetAccount(){
  if(!confirm("確定重設帳號？所有資料將清除"))return
  let users=loadUsers()

  users[currentUser]={
    password:users[currentUser].password,
    points:0,
    exp:0,
    goals:[],
    rewards:[],
    lastResetDate:""
  }

  saveUsers(users)
  renderAll()
}

function dailyReset(){
  let data=getData()
  let today=new Date().toDateString()
  if(data.lastResetDate!==today){
    data.goals.forEach(g=>{if(g.daily)g.completed=false})
    data.lastResetDate=today
    setData(data)
  }
}

function renderAll(){
  renderHeader()
  renderGoals()
  renderRewards()
}

function renderHeader(){
  let data=getData()
  let level=getLevel(data.exp)
  let title=getTitle(level)
  let badge=getBadge(level)

  let prev=(level-1)*100
  let percent=((data.exp-prev)/100)*100
  let percentText=Math.floor(percent)

  userInfo.innerHTML=`
    <div style="text-align:center; line-height:1.4;">
      <div>${currentUser}｜${badge} ${title} Lv.${level}</div>
      <div>EXP ${data.exp} (${percentText}%)｜P ${data.points}</div>
    </div>
  `

  levelBar.style.width=percent+"%"
}

function renderGoals(){
  let data=getData()
  let el=goalSection
  el.innerHTML=""

  const active=data.goals.filter(g=>!g.completed)
  const done=data.goals.filter(g=>g.completed)

  active.forEach(g=>{
    let card=document.createElement("div")
    card.className="card goal"
    card.innerHTML=`
    <div class="goal-left">
      <input type="checkbox" onclick="toggleGoal('${g.id}')">
      <span>${g.name} (+${g.points})</span>
      ${g.daily?'<span class="dot">●</span>':""}
    </div>
    <div><button onclick="deleteGoal('${g.id}')">🗑</button></div>`
    makeDraggable(card,g.id,"goal")
    el.appendChild(card)
  })

  if(done.length){
    el.appendChild(createToggleHeader("已完成目標","completedGoals"))
    const box=document.createElement("div")
    box.id="completedGoals"
    box.classList.add("hidden")

    done.forEach(g=>{
      let card=document.createElement("div")
      card.className="card goal redeemed"
      card.innerHTML=`
      <div class="goal-left">
        <input type="checkbox" checked onclick="toggleGoal('${g.id}')">
        <span>${g.name} (+${g.points})</span>
      </div>`
      box.appendChild(card)
    })
    el.appendChild(box)
  }
}

function renderRewards(){
  let data=getData()
  let el=rewardSection
  el.innerHTML=""

  const active=data.rewards.filter(r=>!r.redeemed)
  const done=data.rewards.filter(r=>r.redeemed)

  active.forEach(r=>{
    let disabled=data.points<r.cost
    let card=document.createElement("div")
    card.className="card reward"
    card.innerHTML=`
    <div>
      <button ${disabled?"disabled":""} onclick="toggleRedeem('${r.id}')">兌換</button>
      ${r.name} (${r.cost})
    </div>
    <div><button onclick="deleteReward('${r.id}')">🗑</button></div>`
    makeDraggable(card,r.id,"reward")
    el.appendChild(card)
  })

  if(done.length){
    el.appendChild(createToggleHeader("已兌換獎勵","redeemedRewards"))
    const box=document.createElement("div")
    box.id="redeemedRewards"
    box.classList.add("hidden")

    done.forEach(r=>{
      let card=document.createElement("div")
      card.className="card reward redeemed"
      card.innerHTML=`
      <div>
        <button onclick="toggleRedeem('${r.id}')">退回</button>
        ${r.name} (${r.cost})
      </div>`
      box.appendChild(card)
    })
    el.appendChild(box)
  }
}

function createToggleHeader(text,targetId){
  const btn=document.createElement("div")
  btn.className="card toggle-header"
  btn.innerText="▶ "+text
  btn.onclick=()=>{
    const box=document.getElementById(targetId)
    box.classList.toggle("hidden")
    btn.innerText=(box.classList.contains("hidden")?"▶ ":"▼ ")+text
  }
  return btn
}

// ⭐ 完成目標：加 exp + points
function toggleGoal(id){
  let data=getData()
  let g=data.goals.find(x=>x.id===id)

  if(!g.completed){
    data.points+=g.points
    data.exp+=g.points
  }else{
    data.points-=g.points
    data.exp-=g.points
  }

  g.completed=!g.completed
  setData(data)
  renderAll()
}

// ⭐ 兌換只扣 points，不動 exp
function toggleRedeem(id){
  let data=getData()
  let r=data.rewards.find(x=>x.id===id)

  if(!r.redeemed){
    if(data.points<r.cost)return
    data.points-=r.cost
    r.redeemed=true
  }else{
    data.points+=r.cost
    r.redeemed=false
  }

  setData(data)
  renderAll()
}

function deleteGoal(id){
  let data=getData()
  let g=data.goals.find(x=>x.id===id)
  if(g.completed)return alert("已完成目標不可刪除")
  data.goals=data.goals.filter(x=>x.id!==id)
  setData(data)
  renderAll()
}

function deleteReward(id){
  let data=getData()
  data.rewards=data.rewards.filter(x=>x.id!==id)
  setData(data)
  renderAll()
}

function makeDraggable(card,id,type){
  card.draggable=true
  card.ondragstart=e=>e.dataTransfer.setData("id",id)
  card.ondragover=e=>e.preventDefault()
  card.ondrop=e=>{
    e.preventDefault()
    const dragId=e.dataTransfer.getData("id")
    reorder(type,dragId,id)
  }
}

function reorder(type,dragId,targetId){
  let data=getData()
  let list=type==="goal"?data.goals:data.rewards
  const from=list.findIndex(x=>x.id===dragId)
  const to=list.findIndex(x=>x.id===targetId)
  list.splice(to,0,list.splice(from,1)[0])
  setData(data)
  renderAll()
}

function openForm(){
  let name=prompt("名稱")
  if(!name)return

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
  renderAll()
}

function showTab(tab){
  currentTab=tab
  goalSection.classList.toggle("hidden",tab!=="goal")
  rewardSection.classList.toggle("hidden",tab!=="reward")
  goalTab.classList.toggle("active",tab==="goal")
  rewardTab.classList.toggle("active",tab==="reward")
}
