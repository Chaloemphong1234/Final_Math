/* ================== GLOBAL SETTINGS ================== */
let students = {}
let answers = {}
// URL ของ Google Apps Script ที่คุณสร้างไว้
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwYKGrdngUyxOTNLNbNWjaM1P-CfSAw2qqdrAj6GBHT754J5asnODzh8KtUwwW0_TCmmA/exec";

const correctAnswers = {
  1: "ก", 2: "ข", 3: "ก", 4: "ค", 5: "ง", 6: "ก", 7: "ก", 8: "ค", 9: "ก", 10: "ก",
  11: "ข", 12: "ข", 13: "ง", 14: "ก", 15: "ข", 16: "ก", 17: "ง", 18: "ก", 19: "ข", 20: "ข",
}

const TOTAL_QUESTIONS = 20
const PASS_SCORE = 10
let timeLeft = 40 * 60 
let timerInterval

// ตั้งค่าวันเวลาที่เริ่มสอบจริง (ปี-เดือน-วัน เวลา) เช่น "2026-06-02T13:00:00"
const EXAM_START_TIME = new Date("2026-06-06T10:00:00"); 
const LATE_LIMIT_MINUTES = 10;

/* ================== CUSTOM POPUP SYSTEM ================== */
function showModal(title, message, icon = '⚠️', callback = null) {
  let modal = document.getElementById('customModal');
  if (!modal) {
    const modalHTML = `
      <div id="customModal" class="modal-overlay">
        <div class="modal-content-custom">
          <div class="modal-icon" id="modalIcon" style="font-size: 4rem; margin-bottom: 15px;"></div>
          <h4 id="modalTitle" class="fw-bold text-primary mb-2"></h4>
          <p id="modalMsg" class="text-muted mb-4"></p>
          <button class="btn btn-primary w-100 rounded-pill py-2 fw-bold" id="modalBtn" style="font-size: 1.1rem;">ตกลง</button>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    modal = document.getElementById('customModal');
  }

  document.getElementById('modalTitle').innerText = title;
  document.getElementById('modalMsg').innerText = message;
  document.getElementById('modalIcon').innerText = icon;
  modal.classList.add('active');

  document.getElementById('modalBtn').onclick = () => {
    modal.classList.remove('active');
    if (callback) callback();
  };
}

/* ================== DATABASE SENDING ================== */
async function sendDataToSheet(score, total, status) {
  const data = {
    sid: localStorage.getItem("sid"),
    name: localStorage.getItem("sname"),
    score: score,
    total: total,
    status: status
  };

  try {
    await fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors", 
      cache: "no-cache",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการส่งข้อมูล:", error);
  }
}

/* ================== LOAD STUDENTS ================== */
if (document.getElementById("sid") || location.pathname.includes("exam.html")) {
  fetch("students.json")
    .then(res => res.json())
    .then(data => students = data)
    .catch(err => console.log("รอโหลดไฟล์นักศึกษา..."))
}

/* ================== LOGIN PAGE ================== */
function checkStudent(){
  const id = document.getElementById("sid").value.trim()
  if(!students[id]) return showModal("ไม่พบข้อมูล", "ไม่พบข้อมูลนักศึกษานี้ในระบบ", "❌");

  localStorage.clear(); 
  localStorage.setItem("sid", id)
  localStorage.setItem("sname", students[id])
  location.href = "exam.html"
}

/* ================== EXAM PAGE ================== */
if(location.pathname.includes("exam.html")){
  const sname = localStorage.getItem("sname")
  if(!sname) {
      location.href = "index.html";
  } else {
      document.getElementById("studentName").innerText = "ผู้รับการทดสอบ : " + sname
      initSecurity()
      checkExamTimeStatus() 
  }
}

function checkExamTimeStatus() {
  const examContainer = document.getElementById("examContainer");

  const timerLoop = setInterval(() => {
    const now = new Date();

    // ====== ยังไม่ถึงเวลาเริ่มสอบ ======
    if (now < EXAM_START_TIME) {
      if (examContainer) examContainer.style.display = "none";

      if (!document.getElementById("waitMessage")) {
        const waitHTML = `
          <div id="waitMessage" style="text-align:center; margin-top:100px; padding:40px;">
            <div style="font-size: 5rem; margin-bottom: 20px;">⏳</div>
            <h2 class="text-warning fw-bold mb-3">ยังไม่ถึงเวลาเริ่มการทดสอบ</h2>
            <div id="countdownDisplay" class="fw-bold text-dark" style="font-size:2.5rem; margin-top:20px;">
            </div>
          </div>`;
        document.body.insertAdjacentHTML('beforeend', waitHTML);
      }

      const diff = EXAM_START_TIME - now;
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      const countdown = document.getElementById("countdownDisplay");
      if (countdown) {
        countdown.innerText = `เริ่มสอบในอีก ${mins} นาที ${secs} วินาที`;
      }
      return;
    }

    // ====== ถึงเวลาแล้ว : ตรวจสอบมาสาย ======
    const lateMinutes = Math.floor((now - EXAM_START_TIME) / 60000);

    // ❌ มาสายเกิน 10 นาที
    if (lateMinutes > LATE_LIMIT_MINUTES) {
      clearInterval(timerLoop);

      if (examContainer) examContainer.style.display = "none";
      const wm = document.getElementById("waitMessage");
      if (wm) wm.remove();

      document.body.insertAdjacentHTML("beforeend", `
        <div style="text-align:center; margin-top:120px;">
          <div style="font-size:5rem;">❌</div>
          <h2 class="text-danger fw-bold">นักศึกษาไม่มาสอบตามเวลาที่กำหนด</h2>
          <p class="fs-4 text-muted mt-3">
            มาสาย <b>${lateMinutes}</b> นาที<br>
            เกินเวลาที่อนุญาต ${LATE_LIMIT_MINUTES} นาที
          </p>
          <h3 class="text-secondary mt-4">หมดสิทธิ์เข้าสอบ</h3>
        </div>
      `);
      return;
    }

    // ✅ มาสายแต่ยังอยู่ในเวลาที่อนุญาต (≤ 10 นาที)
    clearInterval(timerLoop);

    const wm = document.getElementById("waitMessage");
    if (wm) wm.remove();

    if (examContainer) {
      examContainer.style.display = "block";

      // ====== หักเวลาที่มาช้าออกจากเวลาสอบ ======
      const EXAM_DURATION_MINUTES = 40;
      timeLeft = (EXAM_DURATION_MINUTES * 60) - (lateMinutes * 60);

      if (timeLeft < 0) timeLeft = 0;

      startTimer(); // ใช้ระบบจับเวลาเดิมทั้งหมด
    }

  }, 1000);
}

/* ================== TIMER ================== */
function startTimer(){
  updateTimer()
  timerInterval = setInterval(()=>{
    timeLeft--
    updateTimer()
    if(timeLeft <= 0){
      clearInterval(timerInterval)
      submitExam(true)
    }
  },1000)
}

function updateTimer(){
  let m = Math.floor(timeLeft/60)
  let s = timeLeft % 60
  const t = document.getElementById("timer")
  if(t) {
    t.innerText = `${m}:${s.toString().padStart(2,"0")}`
    if(timeLeft <= 300) t.style.color = "#ff4444";
  }
}

/* ================== ANSWER ================== */
function mark(q, a, btn){
  answers[q] = a
  const parent = btn.parentElement;
  parent.querySelectorAll("button").forEach(b => b.classList.remove("active"))
  btn.classList.add("active")
}

/* ================== SUBMIT ================== */
function submitExam(auto){
  if(!auto && Object.keys(answers).length < TOTAL_QUESTIONS){
    return showModal("ทำข้อสอบยังไม่ครบ!", `กรุณาทำให้ครบทั้ง ${TOTAL_QUESTIONS} ข้อ`, "📝");
  }

  window.onbeforeunload = null
  localStorage.setItem("userAnswers", JSON.stringify(answers))

  if(auto){
    location.href = "processing.html"
  } else {
    showModal("ยืนยันการส่ง", "คุณมั่นใจหรือไม่ที่จะส่งข้อสอบ", "❓", () => {
        location.href = "processing.html"
    });
  }
}

/* ================== SECURITY ================== */
function initSecurity(){
  window.onbeforeunload = () => "คุณกำลังทำข้อสอบอยู่"

  document.addEventListener("visibilitychange",()=>{
    if(document.hidden) submitExam(true);
  })

  document.addEventListener("contextmenu", e => e.preventDefault())
  
  document.addEventListener("keydown", (e) => {
      if(e.ctrlKey || e.metaKey || e.altKey || e.key.startsWith('F')) {
          e.preventDefault();
      }
      // ลบส่วนที่บล็อกการทำงานปกติออกเพื่อให้ปุ่มกดได้ แต่ยังกันปุ่มลัด
  }, true);
}

/* ================== RESULT PAGE (คำนวณคะแนน) ================== */
if(location.pathname.includes("result.html")){
  const userAns = JSON.parse(localStorage.getItem("userAnswers") || "{}")
  let score = 0
  for(let i=1; i<=TOTAL_QUESTIONS; i++){
    if(userAns[i]?.toString() === correctAnswers[i]) score++
  }

  const isPass = score >= PASS_SCORE
  const statusText = isPass ? "ผ่านการทดสอบ" : "ไม่ผ่านการทดสอบ"

  if(!localStorage.getItem("dataSent")){
      sendDataToSheet(score, TOTAL_QUESTIONS, statusText);
      localStorage.setItem("dataSent", "true");
  }

  const resultBox = document.getElementById("resultBox");
  if(resultBox) {
    resultBox.innerHTML = `
      <div class="text-center">
        <div style="font-size: 5rem; margin-bottom: 15px;">🎉</div>
        <h3 class="fw-bold text-primary mb-3">ส่งข้อสอบเรียบร้อยแล้ว</h3>
        <hr class="text-muted my-4">
        <h5 class="fw-bold text-dark mb-3">นักศึกษา: <span class="text-primary">${localStorage.getItem("sname")}</span></h5>
        <p class="text-muted" style="line-height: 1.6;">
          ระบบได้บันทึกคำตอบและคะแนนของคุณเข้าสู่ระบบกลางเรียบร้อยแล้ว<br>
          <span class="fw-bold text-success">ขอบคุณที่ตั้งใจทำข้อสอบ ขอให้โชคดีครับ!</span>
        </p>
        <div class="mt-4 p-3 bg-light rounded text-muted small">
          คุณสามารถปิดหน้าต่างนี้หรือออกจากห้องสอบได้ทันที
        </div>
      </div>
    `
  }
}