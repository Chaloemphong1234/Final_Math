/* ================== GLOBAL SETTINGS ================== */
let students = {}
let answers = {}
// URL ของ Google Apps Script ที่คุณสร้างไว้
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwYKGrdngUyxOTNLNbNWjaM1P-CfSAw2qqdrAj6GBHT754J5asnODzh8KtUwwW0_TCmmA/exec";

const correctAnswers = {
  1: "ก", 2: "ข", 3: "ก", 4: "ค", 5: "ง", 6: "ก", 7: "ก", 8: "ค", 9: "ก", 10: "ก",
  11: "ข", 12: "ข", 13: "ง", 14: "ก", 15: "ข", 16: "ก", 17: "ง", 18: "ก", 19: "ข", 20: "ข",
  21: "ข", 22: "ข", 23: "ข", 24: "ค", 25: "ก", 26: "ก", 27: "ข", 28: "ข", 29: "ง", 30: "ค",
  31: "ข", 32: "ค", 33: "ง", 34: "ก", 35: "ข", 36: "ค", 37: "ก", 38: "ข", 39: "ข", 40: "ก",
  41: "ง", 42: "ข", 43: "ข", 44: "ก", 45: "ง", 46: "ก", 47: "ข", 48: "ข", 49: "ง", 50: "ก",
  51: "ข", 52: "ค", 53: "ง", 54: "ง", 55: "ข", 56: "ง", 57: "ง", 58: "ก", 59: "ข", 60: "ก"
}

const TOTAL_QUESTIONS = 60
const PASS_SCORE = 30
let timeLeft = 90 * 60 
let timerInterval

// ตั้งค่าวันเวลาที่เริ่มสอบจริง: 25 มกราคม 2569 เวลา 18:05:00
const EXAM_START_TIME = new Date(2026, 0, 25, 18, 50, 0);

/* ================== CUSTOM POPUP SYSTEM ================== */
function showModal(title, message, icon = '⚠️', callback = null) {
  let modal = document.getElementById('customModal');
  if (!modal) {
    const modalHTML = `
      <div id="customModal" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-icon" id="modalIcon"></div>
          <h2 id="modalTitle" style="margin:0 0 10px 0;"></h2>
          <p id="modalMsg" style="margin-bottom:25px; line-height:1.6;"></p>
          <button class="btn-login" id="modalBtn">ตกลง</button>
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
  if(!students[id]) return showModal("ไม่พบข้อมูล", "ไม่พบรหัสนักศึกษานี้ในระบบ", "❌");

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
      document.getElementById("studentName").innerText = "ผู้เข้าสอบ: " + sname
      initSecurity()
      checkExamTimeStatus() 
  }
}

// แก้ไขส่วนนี้ตามที่คุณต้องการ: ซ่อนทุกอย่างยกเว้นแถบบน และแสดงเลขนับถอยหลัง
function checkExamTimeStatus() {
  const examContainer = document.getElementById("examContainer");
  
  const timerLoop = setInterval(() => {
    const now = new Date();
    
    if (now < EXAM_START_TIME) {
      // 1. ซ่อนเนื้อหาข้อสอบทั้งหมด
      if(examContainer) examContainer.style.display = "none";
      
      // 2. สร้างหน้าจอรอสอบ (Wait Message) ถ้ายังไม่มี
      if (!document.getElementById("waitMessage")) {
        const waitHTML = `
          <div id="waitMessage" style="text-align:center; margin-top:100px; padding:40px;">
            <div style="font-size: 5rem; margin-bottom: 20px;">⏳</div>
            <h2 style="color:#f39c12; font-size: 2rem;">ยังไม่ถึงเวลาเริ่มการทดสอบ</h2>
            <p style="font-size: 1.2rem; color: #666;">ข้อสอบและกระดาษคำตอบจะปรากฏอัตโนมัติเมื่อถึงเวลา 18:05 น.</p>
            <div id="countdownDisplay" style="font-weight:bold; font-size:2.5rem; color:#2c3e50; margin-top:20px;"></div>
          </div>`;
        document.body.insertAdjacentHTML('beforeend', waitHTML);
      }

      // 3. อัปเดตตัวเลขวินาทีถอยหลัง
      const diff = EXAM_START_TIME - now;
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      const countdown = document.getElementById("countdownDisplay");
      if(countdown) countdown.innerText = `เริ่มสอบในอีก ${mins} นาที ${secs} วินาที`;

    } else {
      // --- เมื่อถึงเวลาเริ่มสอบ ---
      clearInterval(timerLoop); // หยุดการวนซ้ำเช็คเวลา
      
      const wm = document.getElementById("waitMessage");
      if(wm) wm.remove(); // ลบหน้าจอรอสอบออก
      
      if(examContainer) {
        examContainer.style.display = "flex"; // แสดงข้อสอบและกระดาษคำตอบทันที
        startTimer(); // เริ่มเดินเวลาสอบ 90 นาที
      }
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
    return showModal("ทำไม่ครบ!", `กรุณาทำให้ครบทั้ง ${TOTAL_QUESTIONS} ข้อ`, "📝");
  }

  window.onbeforeunload = null
  localStorage.setItem("userAnswers", JSON.stringify(answers))

  if(auto){
    location.href = "processing.html"
  } else {
    showModal("ยืนยันการส่ง", "คุณมั่นใจหรือไม่ที่จะส่งข้อสอบ?", "❓", () => {
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
      <div style="text-align:center; padding: 20px;">
        <div style="font-size: 5rem; margin-bottom: 20px;">📝</div>
        <h2 style="color:var(--primary)">ส่งข้อสอบเรียบร้อยแล้ว</h2>
        <hr style="border:1px solid #eee; margin:20px 0;">
        <p style="font-size:1.2rem;">นักศึกษา: <b>${localStorage.getItem("sname")}</b></p>
        <p style="color: #666; margin-bottom: 30px;">
          ระบบได้บันทึกคำตอบและคะแนนของนักศึกษาเรียบร้อยแล้ว<br>
          นักศึกษาสามารถปิดหน้าต่างนี้หรือออกจากห้องสอบได้ทันที
        </p>
        <button class="btn-login" onclick="localStorage.clear(); location.href='index.html'">กลับหน้าหลัก</button>
      </div>
    `
  }
}