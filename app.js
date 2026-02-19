let currentUser = localStorage.getItem("currentUser")
if (!currentUser) {
  currentUser = "guest"
  localStorage.setItem("currentUser", currentUser)
}

function loadData() {
  return JSON.parse(localStorage.getItem(currentUser) || '{"goals":[],"rewards":[],"points":0}')
}

function saveData(data) {
  localStorage.setItem(currentUser, JSON.stringify(data))
}

/* ========= 等級系統 ========= */

function getLevel(points) {
  return Math.floor(points / 100) + 1
}

function getTitle(level) {
  if (level >= 100) return "傳奇實踐者"
  if (level >= 90) return "系統化達人"
  if (level >= 80) return "巔峰行動者"
  if (level >= 70) return "目標掌控者"
  if (level >= 60) return "高效實踐者"
  if (level >= 50) return "成長推進者"
  if (level >= 40) return "自律挑戰者"
  if (level >= 30) return "習慣建立者"
  if (level >= 20) return "行動執行者"
  if (level >= 10) return "目標探索者"
  return "新手學徒"
}

function updateLevelUI() {
  const data = loadData()
  const level = getLevel(data.points)
  const title = getTitle(level)
  const current = data.points % 100
  const need = 100

  document.getElementById("levelText").innerText = `等級 Lv.${level}`
  document.getElementById("titleText").innerText = title
  document.getElementById("pointText").innerText = `${current} / ${need}`
}

/* ========= 分頁 ========= */

function showTab(tab) {
  document.getElementById("goalsTab").style.display = tab === "goals" ? "block" : "none"
  document.getElementById("rewardsTab").style.display = tab === "rewards" ? "block" : "none"
}

/* ========= 目標 ========= */

function addGoal() {
  const text = document.getElementById("goalInput").value
  const point = parseInt(document.getElementById("goalPoint").value)

  if (!text || !point) return

  const data = loadData()
  data.goals.push({ text, point, done: false, date: new Date().toDateString() })
  saveData(data)

  document.getElementById("goalInput").value = ""
  document.getElementById("goalPoint").value = ""

  renderGoals()
}

function completeGoal(index) {
  const data = loadData()
  if (data.goals[index].done) return

  data.goals[index].done = true
  data.points += data.goals[index].point

  saveData(data)
  renderGoals()
  updateLevelUI()
}

function renderGoals() {
  const data = loadData()
  const goalList = document.getElementById("goalList")
  const completedList = document.getElementById("completedGoalList")

  goalList.innerHTML = ""
  completedList.innerHTML = ""

  const today = new Date().toDateString()

  data.goals.forEach((g, i) => {
    const li = document.createElement("li")
    li.innerText = `${g.text} (+${g.point})`

    if (!g.done) {
      const btn = document.createElement("button")
      btn.innerText = "完成"
      btn.onclick = () => completeGoal(i)
      li.appendChild(btn)
      goalList.appendChild(li)
    } else {
      if (g.date !== today) {
        completedList.appendChild(li)
      } else {
        goalList.appendChild(li)
      }
    }
  })
}

/* ========= 獎勵 ========= */

function addReward() {
  const text = document.getElementById("rewardInput").value
  const cost = parseInt(document.getElementById("rewardCost").value)

  if (!text || !cost) return

  const data = loadData()
  data.rewards.push({ text, cost, done: false, date: new Date().toDateString() })
  saveData(data)

  document.getElementById("rewardInput").value = ""
  document.getElementById("rewardCost").value = ""

  renderRewards()
}

function redeemReward(index) {
  const data = loadData()
  const reward = data.rewards[index]

  if (data.points < reward.cost) {
    alert("點數不足")
    return
  }

  reward.done = true
  data.points -= reward.cost

  saveData(data)
  renderRewards()
  updateLevelUI()
}

function renderRewards() {
  const data = loadData()
  const rewardList = document.getElementById("rewardList")
  const completedList = document.getElementById("completedRewardList")

  rewardList.innerHTML = ""
  completedList.innerHTML = ""

  const today = new Date().toDateString()

  data.rewards.forEach((r, i) => {
    const li = document.createElement("li")
    li.innerText = `${r.text} (-${r.cost})`

    if (!r.done) {
      const btn = document.createElement("button")
      btn.innerText = "兌換"
      btn.onclick = () => redeemReward(i)
      li.appendChild(btn)
      rewardList.appendChild(li)
    } else {
      if (r.date !== today) {
        completedList.appendChild(li)
      } else {
        rewardList.appendChild(li)
      }
    }
  })
}

/* ========= 隱藏/顯示 ========= */

function toggleCompleted(type) {
  if (type === "goal") {
    const el = document.getElementById("completedGoalList")
    el.style.display = el.style.display === "none" ? "block" : "none"
  } else {
    const el = document.getElementById("completedRewardList")
    el.style.display = el.style.display === "none" ? "block" : "none"
  }
}

/* ========= 登出 ========= */

function logout() {
  localStorage.removeItem("currentUser")
  location.reload()
}

/* ========= 初始化 ========= */

renderGoals()
renderRewards()
updateLevelUI()
