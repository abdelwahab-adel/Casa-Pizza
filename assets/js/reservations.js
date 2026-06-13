/* =============================================================
   كاسا بيتزا — Reservations with localStorage persistence
   ============================================================= */
(function(){
  const STORE = "saffron_reservations_v1";
  
  function load(){ try{ return JSON.parse(localStorage.getItem(STORE)) || []; } catch(e){ return []; } }
  function save(data){ localStorage.setItem(STORE, JSON.stringify(data)); }
  function genId(){ return "RV-2026-" + String(Math.floor(1000 + Math.random()*9000)); }

  const form = document.querySelector(".form.res-form");
  if(!form) return;

  // Set min date to today
  const dateInput = document.getElementById("r-date");
  if(dateInput){
    const today = new Date().toISOString().split("T")[0];
    dateInput.setAttribute("min", today);
    dateInput.value = today;
  }

  // Generate booking reference
  const bkNo = document.getElementById("bk-no");
  let currentId = genId();
  if(bkNo) bkNo.textContent = currentId;

  form.addEventListener("submit", function(e){
    e.preventDefault();
    const data = load();
    const reservation = {
      id: currentId,
      name: form.querySelector("[name='r-name']")?.value || form.querySelectorAll("input[type='text']")[0]?.value || "",
      phone: form.querySelector("[name='r-phone']")?.value || form.querySelectorAll("input[type='tel']")[0]?.value || "",
      date: form.querySelector("[name='r-date'], #r-date")?.value || "",
      time: form.querySelector("select[name='r-time']")?.value || form.querySelectorAll("select")[0]?.value || "",
      guests: form.querySelector("select[name='r-guests']")?.value || form.querySelectorAll("select")[1]?.value || "",
      area: form.querySelector("select[name='r-area']")?.value || form.querySelectorAll("select")[2]?.value || "",
      notes: form.querySelector("textarea")?.value || "",
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    data.push(reservation);
    save(data);

    window.toast && window.toast("✓ تم تأكيد طلب الحجز — سيصلك تأكيد واتساب خلال 5 دقائق");
    form.reset();
    currentId = genId();
    if(bkNo) bkNo.textContent = currentId;
    if(dateInput) dateInput.value = new Date().toISOString().split("T")[0];
  });

  // Expose for admin
  window.SaffronReservations = { load, save, genId };
})();
