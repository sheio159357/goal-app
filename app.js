let currentUser=null
let currentTab="goal"
const levelRules=[0,100,300,600,1000]

// 🔹 Storage
function saveUsers(users){localStorage.setItem("users",JSON.stringify(users))}
function loadUsers(){return JSON.parse(localStorage.getItem("users")||"{}")}
function getData(){return loadUsers()[currentUser]}
function setData(data){
  let users=loadUsers()
  users[currentUser]=data
  saveUsers(users)
}

// 🔹 帳號
function register(){
  const u=username.value,p=password.value
  let users=loadUsers()
  if(users[u])return alert("帳號已存在")
  users[u]={password:p,points:0,goals:[],rewards:[],lastResetDate:""}
  saveUsers(users)
  alert("註冊成功")
}

function login(){
  const u=username.value,p=password.value
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

function showLogin(){
  document.getElementById("loginPage").classList.remove("hidden")
  document.getElementById("appPage").classList.add("hidden")
}

function showApp(){
  document.getElementById("loginPage").classList.add("hidden")
  document.getElementById("appPage").classList.remove("hidden")
  dailyReset()
  render()
}

function resetAccount(){
  if(!confirm("確定重設帳號？"))return
  let users=loadUsers()
  users[currentUser]={password:users[currentUser].password,points:0,goals:[],rewards:[],lastResetDate:""}
  saveUsers(users)
  render()
}

// 🔹 每日重置
function dailyReset(){
  let data=getData()
  let today=new Date().toDateString()
  if(data.lastResetDate!==today){
    data.goals.forEach(g=>{
      if(g.daily && g.completed){
        g.completed=false
      }
    })
    data.lastResetDate=today
    setData(data)
  }
}

// 🔹 等級
function getLevel(points){
  let lvl=1
  for(let i=0;i<levelRules.length;i++)if(points>=levelRules[i])lvl=i+1
  return lvl
}

// 🔹 Render
function render(){
  let data=getData()
  let level=getLevel(data.points)
  let next=levelRules[level]||levelRules[levelRules.length-1]
  let prev=levelRules[level-1]||0
  let percent=((data.points-prev)/(next-prev))*100

  document.getElementById("userInfo").innerHTML=`${currentUser}｜Lv.${level}｜${data.points}點｜${Math.floor(percent)}%`
  document.getElementById("levelBar").style.width=percent+"%"

  renderGoals()
  renderRewards()
}

// 🔹 目標
function renderGoals(){
  let data=getData()
  let today=new Date().toDateString()

  const active=data.goals.filter(g=>!g.completed)
  const completed=data.goals.filter(g=>g.completed)

  let el=goalSection
  el.innerHTML=""

  active.forEach(g=>el.appendChild(goalCard(g,false)))

  if(completed.length){
    el.appendChild(toggleHeader("已完成目標","completedGoals"))
    const box=document.createElement("div")
    box.id="completedGoals"
    box.classList.add("hidden")
    completed.forEach(g=>box.appendChild(goalCard(g,true)))
    el.appendChild(box)
  }
}

function goalCard(g,isDone){
  let card=document.createElement("div")
  card.className="card goal"
  card.innerHTML=`
  <div class="goal-left">
  <input type="checkbox" ${g.completed?"checked":""} onclick="toggleGoal('${g.id}')">
  <span>${g.name} (+${g.points})</span>
  ${g.daily?"●":""}
  </div>
  <button onclick="deleteGoal('${g.id}')">🗑</button>`
  if(!isDone)card.draggable=true
  card.ondragstart=e=>e.dataTransfer.setData("id",g.id)
  card.ondragover=e=>e.preventDefault()
  card.ondrop=e=>reorderGoal(e,g.id)
  return card
}

function toggleGoal(id){
  let data=getData()
  let g=data.goals.find(x=>x.id===id)
  if(!g.completed){data.points+=g.points;g.completed=true}
  else{data.points-=g.points;g.completed=false}
  setData(data);render()
}

function deleteGoal(id){
  let data=getData()
  data.goals=data.goals.filter(x=>x.id!==id)
  setData(data);render()
}

function reorderGoal(e,targetId){
  const dragId=e.dataTransfer.getData("id")
  let data=getData()
  const from=data.goals.findIndex(x=>x.id===dragId)
  const to=data.goals.findIndex(x=>x.id===targetId)
  const item=data.goals.splice(from,1)[0]
  data.goals.splice(to,0,item)
  setData(data);render()
}

// 🔹 獎勵
function renderRewards(){
  let data=getData()
  const active=data.rewards.filter(r=>!r.redeemed)
  const done=data.rewards.filter(r=>r.redeemed)

  let el=rewardSection
  el.innerHTML=""

  active.forEach(r=>el.appendChild(rewardCard(r,false)))

  if(done.length){
    el.appendChild(toggleHeader("已兌換獎勵","doneRewards"))
    const box=document.createElement("div")
    box.id="doneRewards"
    box.classList.add("hidden")
    done.forEach(r=>box.appendChild(rewardCard(r,true)))
    el.appendChild(box)
  }
}

function rewardCard(r,isDone){
  let data=getData()
  let disabled=!isDone && data.points<r.cost
  let card=document.createElement("div")
  card.className="card reward"
  card.innerHTML=`
  <div class="${isDone?"redeemed":""}">
  <button ${disabled?"disabled":""} onclick="toggleRedeem('${r.id}')">
  ${isDone?"退回":"兌換"}
  </button>
  ${r.name} (${r.cost})
  </div>
  <button onclick="deleteReward('${r.id}')">🗑</button>`
  if(!isDone)card.draggable=true
  card.ondragstart=e=>e.dataTransfer.setData("id",r.id)
  card.ondragover=e=>e.preventDefault()
  card.ondrop=e=>reorderReward(e,r.id)
  return card
}

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
  setData(data);render()
}

function deleteReward(id){
  let data=getData()
  data.rewards=data.rewards.filter(x=>x.id!==id)
  setData(data);render()
}

function reorderReward(e,targetId){
  const dragId=e.dataTransfer.getData("id")
  let data=getData()
  const from=data.rewards.findIndex(x=>x.id===dragId)
  const to=data.rewards.findIndex(x=>x.id===targetId)
  const item=data.rewards.splice(from,1)[0]
  data.rewards.splice(to,0,item)
  setData(data);render()
}

// 🔹 收合標題
function toggleHeader(text,id){
  const btn=document.createElement("div")
  btn.className="toggle"
  btn.innerText="▶ "+text
  btn.onclick=()=>{
    const box=document.getElementById(id)
    box.classList.toggle("hidden")
    btn.innerText=(box.classList.contains("hidden")?"▶ ":"▼ ")+text
  }
  return btn
}

// 🔹 新增
function openForm(){
  let name=prompt("名稱")
  if(!name)return
  if(currentTab==="goal"){
    let points=parseInt(prompt("完成可得點數"))||10
    let daily=confirm("每日重複？")
    let data=getData()
    data.goals.push({id:Date.now()+"",name,points,daily,completed:false})
    setData(data)
  }else{
    let cost=parseInt(prompt("所需點數"))
    let data=getData()
    data.rewards.push({id:Date.now()+"",name,cost,redeemed:false})
    setData(data)
  }
  render()
}

// 🔹 分頁
function showTab(tab){
  currentTab=tab
  goalSection.classList.toggle("hidden",tab!=="goal")
  rewardSection.classList.toggle("hidden",tab!=="reward")
  goalTab.classList.toggle("active",tab==="goal")
  rewardTab.classList.toggle("active",tab==="reward")
}

// 🔹 自動登入
window.addEventListener("DOMContentLoaded",()=>{
  const savedUser=localStorage.getItem("currentUser")
  if(savedUser && loadUsers()[savedUser]){
    currentUser=savedUser
    showApp()
  }else{
    showLogin()
  }
})

// 🔹 PWA 防快取 SW
if("serviceWorker"in navigator){
  const swCode=`
  self.addEventListener('install',e=>self.skipWaiting())
  self.addEventListener('activate',e=>self.clients.claim())
  self.addEventListener('fetch',e=>{})
  `
  const blob=new Blob([swCode],{type:"text/javascript"})
  navigator.serviceWorker.register(URL.createObjectURL(blob))
}

// 🔹 Manifest
const manifest={
  name:"Goal Reward App",
  short_name:"Goals",
  start_url:".",
  display:"standalone",
  background_color:"#ffffff",
  theme_color:"#4a90e2",
  icons:[
    {src:"icon-192.png",sizes:"192x192",type:"image/png"},
    {src:"icon-512.png",sizes:"512x512",type:"image/png"}
  ]
}
const manifestBlob=new Blob([JSON.stringify(manifest)],{type:"application/json"})
manifestPlaceholder.setAttribute("href",URL.createObjectURL(manifestBlob))
