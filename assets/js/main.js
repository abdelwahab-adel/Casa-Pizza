/* =============================================================
   كاسا بيتزا — UI behavior v3.0
   ============================================================= */

(function(){
  // ---------- loader ----------
  window.addEventListener("load", () => {
    const l = document.querySelector(".loader");
    if(!l) return;
    setTimeout(()=>l.classList.add("gone"),350);
    setTimeout(()=>l.remove(), 1100);
  });

  // ---------- nav scroll & burger ----------
  const nav = document.querySelector(".nav");
  const onScroll = () => {
    if(!nav) return;
    nav.classList.toggle("scrolled", window.scrollY > 12);
    // Back to top visibility
    const bt = document.querySelector(".back-top");
    if(bt) bt.classList.toggle("vis", window.scrollY > 400);
  };
  document.addEventListener("scroll", onScroll, {passive:true});
  onScroll();

  const burger = document.querySelector(".burger");
  const menuEl = document.querySelector("header .menu");
  if(burger && menuEl){
    burger.addEventListener("click", () => menuEl.classList.toggle("open"));
    // Close on nav link click (mobile)
    menuEl.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
      menuEl.classList.remove("open");
    }));
  }

  // ---------- inject scroll-to-top ----------
  const bt = document.createElement("button");
  bt.className = "back-top no-print";
  bt.setAttribute("aria-label", "العودة للأعلى");
  bt.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>`;
  bt.addEventListener("click", () => window.scrollTo({top:0, behavior:"smooth"}));
  document.body.appendChild(bt);

  // ---------- reveal on scroll ----------
  function initReveal(){
    const els = document.querySelectorAll(".js-reveal:not(.in)");
    if("IntersectionObserver" in window){
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if(e.isIntersecting){
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      }, {threshold:.1, rootMargin:"0px 0px -30px 0px"});
      els.forEach(el => io.observe(el));
    } else {
      els.forEach(el => el.classList.add("in"));
    }
  }
  initReveal();
  window.initReveal = initReveal; // expose for dynamic content

  // ---------- toast ----------
  window.toast = function(msg, duration=2600){
    let el = document.querySelector(".toast");
    if(!el){
      el = document.createElement("div");
      el.className = "toast";
      el.setAttribute("role","status");
      el.setAttribute("aria-live","polite");
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("show");
    // Pulse cart fab when item added
    if(msg.includes("أُضيف")){
      const fab = document.querySelector(".cart-fab");
      if(fab){ fab.classList.remove("pulse"); void fab.offsetWidth; fab.classList.add("pulse"); }
    }
    clearTimeout(el._t);
    el._t = setTimeout(()=>el.classList.remove("show"), duration);
  };

  // ---------- copy code helper ----------
  document.addEventListener("click", (e) => {
    const c = e.target.closest("[data-copy]");
    if(!c) return;
    e.preventDefault();
    const txt = c.getAttribute("data-copy");
    if(navigator.clipboard){
      navigator.clipboard.writeText(txt).then(()=>{
        window.toast("✓ تم نسخ الكود: " + txt);
      });
    } else {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = txt;
      ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      window.toast("✓ تم نسخ الكود: " + txt);
    }
  });

  // ---------- countdown ----------
  function tickCountdowns(){
    document.querySelectorAll("[data-countdown]").forEach(box => {
      const end = new Date(box.getAttribute("data-countdown")).getTime();
      let diff = Math.max(0, end - Date.now());
      const d = Math.floor(diff / 86400000); diff -= d*86400000;
      const h = Math.floor(diff / 3600000); diff -= h*3600000;
      const m = Math.floor(diff / 60000); diff -= m*60000;
      const s = Math.floor(diff / 1000);
      const set = (sel, v) => { const n = box.querySelector(sel); if(n) n.textContent = String(v).padStart(2,"0"); };
      set("[data-d]", d); set("[data-h]", h); set("[data-m]", m); set("[data-s]", s);
    });
  }
  if(document.querySelector("[data-countdown]")){
    tickCountdowns();
    setInterval(tickCountdowns, 1000);
  }

  // ---------- lightbox for gallery ----------
  const lightbox = document.querySelector(".lightbox");
  if(lightbox){
    document.querySelectorAll(".gallery a").forEach(a => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const src = a.getAttribute("href");
        lightbox.querySelector("img").src = src;
        lightbox.classList.add("open");
        document.body.style.overflow = "hidden";
      });
    });
    lightbox.addEventListener("click", (e) => {
      if(e.target === lightbox || e.target.closest("button")){
        lightbox.classList.remove("open");
        document.body.style.overflow = "";
      }
    });
    document.addEventListener("keydown", (e) => {
      if(e.key === "Escape" && lightbox.classList.contains("open")){
        lightbox.classList.remove("open");
        document.body.style.overflow = "";
      }
    });
  }

  // ---------- newsletter & forms (fake submit) ----------
  document.querySelectorAll(".js-fake-form").forEach(f => {
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const msg = f.getAttribute("data-msg") || "تم استلام طلبك بنجاح";
      window.toast("✓ " + msg);
      f.reset();
    });
  });

  // ---------- hero open status dynamic time ----------
  const dot = document.querySelector(".hero-card .dot");
  if(dot){
    const h = new Date().getHours();
    const isOpen = h >= 12 || h < 1; // 12pm to 1am
    if(!isOpen){
      dot.style.background = "#A8362F";
      dot.style.boxShadow = "0 0 0 3px rgba(168,54,47,.25)";
      const label = dot.nextElementSibling;
      if(label) label.textContent = "المطعم مغلق حالياً";
    }
  }

  // ---------- lang switcher (placeholder) ----------
  document.querySelectorAll(".lang-pill").forEach(b => {
    b.addEventListener("click", () => {
      window.toast("ميزة تغيير اللغة قيد التطوير");
    });
  });
})();
