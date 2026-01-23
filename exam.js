/* ================== GLOBAL SETTINGS ================== */
let students = {}
let answers = {}

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

/* ================== CUSTOM POPUP SYSTEM ================== */
// ฟังก์ชันสร้างและแสดง Popup แทนการใช้ alert
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
  if(!students[id]) return showModal("ไม่พบข้อมูล", "ไม่พบรหัสนักศึกษานี้ในระบบ กรุณาตรวจสอบอีกครั้ง", "❌");

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
      startTimer()
      initSecurity()
  }
}

/* ================== TIMER ================== */
function startTimer(){
  updateTimer()
  timerInterval = setInterval(()=>{
    timeLeft--
    updateTimer()
    
    // ระบบแจ้งเตือนตามเงื่อนไข (เวลาเป็นวินาที)
    if(timeLeft === 1800) alert("⚠ เหลือเวลา 30 นาที");
    if(timeLeft === 600)  alert("⚠ เหลือเวลา 10 นาที");
    if(timeLeft === 300)  alert("⚠ เหลือเวลา 5 นาที");
    if(timeLeft === 60)   alert("⚠ เหลือเวลาสุดท้ายเพียง 1 นาที!");
    
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
    return showModal("ทำไม่ครบ!", `คุณเพิ่งทำไป ${Object.keys(answers).length} ข้อ กรุณาทำให้ครบทั้ง ${TOTAL_QUESTIONS} ข้อ`, "📝");
  }

  window.onbeforeunload = null

  if(auto){
    localStorage.setItem("userAnswers", JSON.stringify(answers))
    location.href = "processing.html"
  } else {
    // ใช้ Popup ยืนยันก่อนส่ง
    showModal("ยืนยันการส่ง", "คุณมั่นใจหรือไม่ที่จะส่งข้อสอบ? เมื่อส่งแล้วจะไม่สามารถกลับมาแก้ไขได้", "❓", () => {
        localStorage.setItem("userAnswers", JSON.stringify(answers))
        location.href = "processing.html"
    });
  }
}

/* ================== SECURITY ================== */
function initSecurity(){
  window.onbeforeunload = () => "คุณกำลังทำข้อสอบอยู่"

  document.addEventListener("visibilitychange",()=>{
    if(document.hidden){
      // แจ้งเตือนแล้วส่งทันที
      showModal("ตรวจพบความผิดปกติ", "คุณออกจากหน้าจอสอบ ระบบจะทำการส่งข้อสอบโดยอัตโนมัติ", "🚫", () => {
          submitExam(true);
      });
      // ป้องกันกรณีไม่กดตกลง ให้ส่งใน 2 วิ
      setTimeout(() => submitExam(true), 2500);
    }
  })

  document.addEventListener("contextmenu", e => e.preventDefault())
  document.addEventListener("keydown", e => {
      if(e.ctrlKey || e.metaKey || e.altKey || e.key.startsWith('F')) e.preventDefault();
  })
}
// เพิ่มส่วนนี้ลงไปใน exam.js เพื่อล็อกคีย์บอร์ดทุกหน้า
document.addEventListener("keydown", (e) => {
  // ยกเว้นปุ่ม F5 หรือปุ่มที่จำเป็นจริงๆ (ถ้าต้องการ) แต่ในที่นี้คือล็อก 100%
  e.preventDefault();
  return false;
}, true);
/* ================== RESULT PAGE ================== */
if(location.pathname.includes("result.html")){
  const userAns = JSON.parse(localStorage.getItem("userAnswers") || "{}")
  let score = 0
  for(let i=1; i<=TOTAL_QUESTIONS; i++){
    if(userAns[i]?.toString() === correctAnswers[i]) score++
  }

  const percent = (score / TOTAL_QUESTIONS) * 100
  const isPass = score >= PASS_SCORE
  const color = isPass ? "#2e7d32" : "#c62828"

  const resultBox = document.getElementById("resultBox");
  if(resultBox) {
    resultBox.innerHTML = `
      <h2 style="color:var(--primary)">ประกาศผลการสอบ</h2>
      <hr style="border:1px solid #eee; margin:20px 0;">
      <p style="font-size:1.1rem;">นักศึกษา: <b>${localStorage.getItem("sname")}</b></p>
      <div style="font-size:5rem; font-weight:bold; color:${color}; margin:10px 0;">
        ${score}<span style="font-size:1.5rem; color:#888;"> / ${TOTAL_QUESTIONS}</span>
      </div>
      <p style="font-size:1.2rem;">คิดเป็นร้อยละ: ${percent.toFixed(2)}%</p>
      <div style="padding:15px; border-radius:15px; background:${color}11; color:${color}; font-size:1.5rem; font-weight:bold; margin-bottom:30px;">
        ${isPass ? "🎉 ผ่านการทดสอบ" : "❌ ไม่ผ่านการทดสอบ"}
      </div>
      <button class="btn-login" onclick="location.href='index.html'">กลับหน้าหลัก</button>
    `
  }
}