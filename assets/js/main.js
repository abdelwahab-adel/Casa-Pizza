/* =============================================================
   CASA PIZZA — Main JS (premium effects, navigation, animations)
   ============================================================= */

(function(){
  "use strict";

  /* -----------------------------------------------------------
     0. Shared utility-bar & footer population
     (keeps every page's utility bar + footer in sync with data.js,
      regardless of whether the page also sets these itself)
     ----------------------------------------------------------- */
  (function populateFooter(){
    const D = window.SAFFRON_DATA;
    if(!D) return;
    const R = D.restaurant;

    const setHTML = (id, html) => { const el = document.getElementById(id); if(el) el.innerHTML = html; };
    const setText = (id, text) => { const el = document.getElementById(id); if(el) el.textContent = text; };

    setHTML("util-addr",
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ${R.address}`);
    setHTML("util-phone",
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.33 1.85.57 2.81.7a2 2 0 0 1 1.72 2.03z"/></svg> ${R.phoneDisplay}`);
    setHTML("util-hours",
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> ${R.hours}`);

    setText("footer-about",
      `بيتزا إيطالية حقيقية في ${R.address}. عجينة طازجة يومية، مكونات مستوردة، وتوصيل سريع منذ ${R.since}.`);
    setHTML("footer-contact-list", `
      <li>${R.addressFull}</li>
      <li><a href="tel:${R.phone}">${R.phoneDisplay}</a></li>
      <li><a href="mailto:${R.email}">${R.email}</a></li>
    `);
    setText("hours-weekday", R.hours);
    setText("hours-weekend", R.hoursWeekend);
  })();

  /* -----------------------------------------------------------
     1. Loader
     ----------------------------------------------------------- */
  window.addEventListener("load", () => {
    const loader = document.querySelector(".loader");
    if(!loader) return;
    setTimeout(() => loader.classList.add("hide"), 350);
    setTimeout(() => loader.remove(), 1200);
  });

  /* -----------------------------------------------------------
     2. Sticky Nav + scrolled state + active section indicator
     ----------------------------------------------------------- */
  const nav = document.querySelector(".nav");
  const onScroll = () => {
    if(!nav) return;
    if(window.scrollY > 30) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  };
  window.addEventListener("scroll", onScroll, {passive:true});
  onScroll();

  /* -----------------------------------------------------------
     3. Mobile burger
     ----------------------------------------------------------- */
  const burger = document.querySelector(".burger");
  if(burger){
    let drawer = document.querySelector(".mobile-drawer");
    if(!drawer){
      drawer = document.createElement("div");
      drawer.className = "mobile-drawer";
      drawer.innerHTML = `
        <div class="mobile-drawer-panel">
          <button class="close-x" aria-label="إغلاق">×</button>
          <a href="index.html">🏠 الرئيسية</a>
          <a href="menu.html">📋 القائمة</a>
          <a href="offers.html">🎁 العروض</a>
          <a href="reservations.html">📅 الحجوزات</a>
          <a href="location.html">📍 الموقع</a>
          <a href="gallery.html">📸 المعرض</a>
          <a href="qr.html">📱 QR Menu</a>
          <a href="contact.html">📞 التواصل</a>
          <a href="faq.html">❓ الأسئلة الشائعة</a>
          <a class="btn btn-gold btn-block" href="menu.html">🍕 اطلب الآن</a>
        </div>`;
      document.body.appendChild(drawer);
      drawer.querySelector(".close-x").addEventListener("click", () => {
        drawer.classList.remove("open");
        burger.classList.remove("is-open");
      });
      drawer.addEventListener("click", (e) => {
        if(e.target === drawer){
          drawer.classList.remove("open");
          burger.classList.remove("is-open");
        }
      });
    }
    // Mark active link in drawer
    const currentPage = location.pathname.split("/").pop() || "index.html";
    drawer.querySelectorAll("a").forEach(a => {
      if(a.getAttribute("href") === currentPage) a.classList.add("active");
    });
    burger.addEventListener("click", () => {
      const isOpen = drawer.classList.toggle("open");
      burger.classList.toggle("is-open", isOpen);
    });
  }

  /* -----------------------------------------------------------
     4. Reveal-on-scroll
     ----------------------------------------------------------- */
  const reveals = document.querySelectorAll(".js-reveal:not(.in)");
  if("IntersectionObserver" in window && reveals.length){
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if(e.isIntersecting){
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, {threshold:0.08, rootMargin:"0px 0px -50px 0px"});
    reveals.forEach((el, i) => {
      if(!el.dataset.delay && i < 6) el.dataset.delay = (i % 6) + 1;
      io.observe(el);
    });
  } else {
    reveals.forEach(el => el.classList.add("in"));
  }

  /* -----------------------------------------------------------
     5. Count-up animation
     ----------------------------------------------------------- */
  const counters = document.querySelectorAll("[data-countup]");
  if("IntersectionObserver" in window && counters.length){
    const cio = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if(!e.isIntersecting) return;
        const el = e.target;
        const target = parseFloat(el.dataset.countup);
        const suffix = el.dataset.suffix || "";
        const duration = 1600;
        const start = performance.now();
        const animate = (now) => {
          const t = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          const v = target * eased;
          el.textContent = (Number.isInteger(target) ? Math.round(v) : v.toFixed(1)) + suffix;
          if(t < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
        cio.unobserve(el);
      });
    }, {threshold:0.4});
    counters.forEach(c => cio.observe(c));
  }

  /* -----------------------------------------------------------
     6. Back to top button
     ----------------------------------------------------------- */
  const backTop = document.createElement("button");
  backTop.className = "back-top";
  backTop.setAttribute("aria-label", "العودة للأعلى");
  backTop.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>`;
  document.body.appendChild(backTop);
  backTop.addEventListener("click", () => window.scrollTo({top:0, behavior:"smooth"}));
  window.addEventListener("scroll", () => {
    if(window.scrollY > 600) backTop.classList.add("show");
    else backTop.classList.remove("show");
  }, {passive:true});

  /* -----------------------------------------------------------
     7. Floating WhatsApp button
     ----------------------------------------------------------- */
  const R = (window.SAFFRON_DATA && window.SAFFRON_DATA.restaurant) || {whatsapp:"201068300432"};
  if(!document.querySelector(".fab-whats")){
    const fab = document.createElement("a");
    fab.className = "fab-whats";
    fab.href = `https://wa.me/${R.whatsapp}?text=${encodeURIComponent("مرحبًا، أريد الاستفسار عن القائمة والطلب من كاسا بيتزا 🍕")}`;
    fab.target = "_blank";
    fab.rel = "noopener";
    fab.setAttribute("aria-label", "تواصل واتساب");
    fab.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 3.5A11 11 0 0 0 3 17l-1 5 5-1A11 11 0 1 0 20 3.5zm-8 18a9 9 0 0 1-4.6-1.3l-.3-.2-3 .8.8-3-.2-.3A9 9 0 1 1 12 21.5zm5-6.7c-.3-.1-1.7-.8-2-1s-.5-.1-.7.2l-1 1c-.2.2-.3.2-.6.1a7 7 0 0 1-2-1.3 8 8 0 0 1-1.5-1.8c-.2-.3 0-.5.1-.6l.4-.5.3-.5c.1-.1 0-.3 0-.5l-1-2.3c-.2-.5-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4a3 3 0 0 0-.9 2.2c0 1.3.9 2.5 1 2.7s1.9 3 4.7 4.1c.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.1-1.4l-.5-.3z"/></svg>`;
    document.body.appendChild(fab);
  }

  /* -----------------------------------------------------------
     8. Cart floating button (count)
     ----------------------------------------------------------- */
  if(!document.querySelector(".cart-fab") && document.querySelector(".cart-drawer") === null){
    // Only add fab if cart drawer is not part of page
    // (most pages will use the global cart)
  }

  /* -----------------------------------------------------------
     9. Smooth scroll for hash links
     ----------------------------------------------------------- */
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href^='#']");
    if(!a) return;
    const id = a.getAttribute("href");
    if(id.length < 2) return;
    const target = document.querySelector(id);
    if(target){
      e.preventDefault();
      target.scrollIntoView({behavior:"smooth", block:"start"});
    }
  });

  /* -----------------------------------------------------------
     10. Lightbox for gallery
     ----------------------------------------------------------- */
  const gallery = document.querySelector(".gallery");
  const lightbox = document.querySelector(".lightbox");
  if(gallery && lightbox){
    const lbImg = lightbox.querySelector("img");
    const lbClose = lightbox.querySelector("button");
    gallery.querySelectorAll("a").forEach(a => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        lbImg.src = a.href;
        lightbox.classList.add("open");
      });
    });
    const closeLb = () => lightbox.classList.remove("open");
    lbClose.addEventListener("click", closeLb);
    lightbox.addEventListener("click", (e) => { if(e.target === lightbox) closeLb(); });
    document.addEventListener("keydown", (e) => { if(e.key === "Escape") closeLb(); });
  }

  /* -----------------------------------------------------------
     11. Coupon copy
     ----------------------------------------------------------- */
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".coupon-copy");
    if(!btn) return;
    const code = btn.dataset.copy;
    if(!code) return;
    if(navigator.clipboard){
      navigator.clipboard.writeText(code).then(() => {
        const orig = btn.textContent;
        btn.textContent = "✓ تم النسخ";
        setTimeout(() => btn.textContent = orig, 1500);
      });
    }
  });

  /* -----------------------------------------------------------
     12. Toast helper (global)
     ----------------------------------------------------------- */
  window.CasaToast = function(message, type = ""){
    let wrap = document.querySelector(".toast-wrap");
    if(!wrap){
      wrap = document.createElement("div");
      wrap.className = "toast-wrap";
      document.body.appendChild(wrap);
    }
    const t = document.createElement("div");
    t.className = "toast " + type;
    const icon = type === "success" ? "✓" : type === "error" ? "✕" : "🔔";
    t.innerHTML = `<span class="icon">${icon}</span><span>${message}</span>`;
    wrap.appendChild(t);
    setTimeout(() => {
      t.classList.add("out");
      setTimeout(() => t.remove(), 300);
    }, 2600);
  };

  /* -----------------------------------------------------------
     13. Form fake-submit
     ----------------------------------------------------------- */
  document.addEventListener("submit", (e) => {
    const f = e.target.closest(".js-fake-form");
    if(!f) return;
    e.preventDefault();
    const msg = f.dataset.msg || "تم الإرسال بنجاح";
    window.CasaToast(msg, "success");
    f.reset();
  });

  /* -----------------------------------------------------------
     14. Active nav link in main menu
     ----------------------------------------------------------- */
  const current = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll(".menu a").forEach(a => {
    const href = (a.getAttribute("href") || "").toLowerCase();
    if(href === current) a.classList.add("active");
  });

  /* -----------------------------------------------------------
     15. Offer countdown timers
     ----------------------------------------------------------- */
  const timers = document.querySelectorAll("[data-countdown]");
  if(timers.length){
    const update = () => {
      const now = Date.now();
      timers.forEach(t => {
        const end = new Date(t.dataset.countdown).getTime();
        const diff = Math.max(0, end - now);
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        const fmt = (n) => String(n).padStart(2, "0");
        const dd = t.querySelector("[data-d]");
        const hh = t.querySelector("[data-h]");
        const mm = t.querySelector("[data-m]");
        const ss = t.querySelector("[data-s]");
        if(dd) dd.textContent = fmt(d);
        if(hh) hh.textContent = fmt(h);
        if(mm) mm.textContent = fmt(m);
        if(ss) ss.textContent = fmt(s);
      });
    };
    update();
    setInterval(update, 1000);
  }

  /* -----------------------------------------------------------
     16. Prevent horizontal overflow from animations
     ----------------------------------------------------------- */
  document.documentElement.classList.add("no-flash");
  setTimeout(() => document.documentElement.classList.remove("no-flash"), 100);

  /* -----------------------------------------------------------
     17. Parallax hero (subtle)
     ----------------------------------------------------------- */
  const heroBg = document.querySelector(".hero-bg");
  if(heroBg && window.matchMedia("(min-width: 900px)").matches){
    window.addEventListener("scroll", () => {
      const y = window.scrollY;
      if(y < 800) heroBg.style.transform = `translateY(${y * 0.2}px) scale(1.05)`;
    }, {passive:true});
  }

})();
