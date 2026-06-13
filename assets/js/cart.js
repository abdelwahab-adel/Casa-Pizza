/* =============================================================
   كاسا بيتزا — Cart + WhatsApp Ordering v3.0
   - Supports BOTH regular menu items AND pizza
   - Pizza customizer (size, toppings, half&half, quantity)
   - Cart drawer (edit qty, remove, totals)
   - WhatsApp checkout (compose message & open wa.me link)
   - Persists cart in localStorage
   ============================================================= */

(function(){
  const D = window.SAFFRON_DATA;
  if(!D) return;
  const P = D.pizza || {};
  const STORAGE = "saffron_cart_v2";
  const NUM_KEY  = "saffron_wa_v1";

  // ---------- helpers ----------
  const fmt = n => Number(n).toLocaleString("ar-EG", { maximumFractionDigits:0 });
  const $   = (sel, root=document) => root.querySelector(sel);
  const $$  = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const findPz    = id => (P.types||[]).find(t => t.id === id);
  const findSize  = id => (P.sizes||[]).find(s => s.id === id);
  const findTop   = id => (P.toppings||[]).find(t => t.id === id);
  const findItem  = id => (D.items||[]).find(i => i.id === id);
  const currency  = P.currency || "ر.س";

  // ---------- cart state ----------
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem(STORAGE)) || []; } catch(e){ cart = []; }
  function persist(){ localStorage.setItem(STORAGE, JSON.stringify(cart)); }

  // ---------- coupon state ----------
  let appliedCoupon = null; // { code, discount, title }

  function validateCoupon(code){
    const offers = D.offers || [];
    const upper = code.trim().toUpperCase();
    const offer = offers.find(o => o.code && o.code.toUpperCase() === upper);
    if(!offer) return { valid: false, msg: "الكود غير صحيح أو منتهي الصلاحية" };
    if(offer.endsAt && new Date(offer.endsAt) < new Date()) return { valid: false, msg: "انتهت صلاحية هذا الكود" };
    return { valid: true, offer };
  }

  function applyCoupon(code){
    const result = validateCoupon(code);
    if(!result.valid){ window.toast && window.toast("❌ " + result.msg); return false; }
    appliedCoupon = { code: result.offer.code, discount: result.offer.discount, title: result.offer.title };
    window.toast && window.toast(`✅ تم تطبيق كوبون ${result.offer.title} — خصم ${result.offer.discount}%`);
    renderChrome();
    return true;
  }

  function removeCoupon(){
    appliedCoupon = null;
    renderChrome();
    window.toast && window.toast("تم إزالة الكوبون");
  }

  function discountedTotal(){
    const sub = cartTotal();
    if(!appliedCoupon) return sub;
    return Math.round(sub * (1 - appliedCoupon.discount / 100));
  }

  function lineSubtotal(it){
    if(it.kind === "menu"){
      const item = findItem(it.itemId);
      if(!item) return 0;
      return item.price * it.qty;
    }
    if(it.kind === "pizza"){
      const pz = findPz(it.pzId);
      const sz = it.sizeId;
      if(!pz || !findSize(sz)) return 0;
      let base = pz.prices[sz];
      if(it.half){
        const pz2 = findPz(it.half);
        if(pz2){ base = Math.max(base, pz2.prices[sz]) + 5; }
      }
      const tops = (it.toppings||[]).reduce((s,id) => s + (findTop(id)?.price || 0), 0);
      return (base + tops) * it.qty;
    }
    return 0;
  }
  function cartTotal(){ return cart.reduce((s,i) => s + lineSubtotal(i), 0); }
  function cartCount(){ return cart.reduce((s,i) => s + i.qty, 0); }

  // ---------- floating button + drawer (auto-injected) ----------
  function injectChrome(){
    if($(".cart-fab")) return;
    const fab = document.createElement("button");
    fab.className = "cart-fab";
    fab.type = "button";
    fab.setAttribute("aria-label", "سلة الطلبات");
    fab.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>
      </svg>
      <span>سلة الطلب</span>
      <span class="badge" data-count>0</span>
      <span class="tot" data-tot>0 ${currency}</span>`;
    fab.addEventListener("click", openDrawer);
    document.body.appendChild(fab);

    const drawer = document.createElement("div");
    drawer.className = "drawer";
    drawer.innerHTML = `
      <div class="panel">
        <div class="head">
          <h3>سلة الطلب <small style="font-family:var(--font-num);color:var(--saffron-2);font-size:13px" data-cnt></small></h3>
          <button class="x" type="button" aria-label="إغلاق">×</button>
        </div>
        <div class="items" data-items></div>
        <div class="foot" data-foot></div>
      </div>`;
    drawer.addEventListener("click", e => { if(e.target === drawer || e.target.closest(".x")) closeDrawer(); });
    document.body.appendChild(drawer);
    renderChrome();
  }

  function renderChrome(){
    const fab = $(".cart-fab");
    if(!fab) return;
    const n = cartCount();
    fab.classList.toggle("on", n > 0);
    fab.querySelector("[data-count]").textContent = n;
    fab.querySelector("[data-tot]").textContent = fmt(cartTotal()) + " " + currency;
    if($(".drawer.open")) renderDrawer();
  }

  function openDrawer(){
    injectChrome();
    renderDrawer();
    $(".drawer").classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeDrawer(){
    $(".drawer")?.classList.remove("open");
    document.body.style.overflow = "";
  }

  function renderDrawer(){
    const drawer = $(".drawer");
    if(!drawer) return;
    const items = drawer.querySelector("[data-items]");
    const foot  = drawer.querySelector("[data-foot]");
    const cnt   = drawer.querySelector("[data-cnt]");
    cnt.textContent = cart.length ? `(${cartCount()} عنصر)` : "";

    if(!cart.length){
      items.innerHTML = `
        <div class="empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>
          <p style="margin:0;font-size:14.5px;color:var(--ink)">سلتك فارغة</p>
          <p style="margin:6px 0 0;font-size:13px">أضف أصنافاً من القائمة أو البيتزا لتبدأ طلبك.</p>
          <div style="display:flex;gap:8px;justify-content:center;margin-top:18px;flex-wrap:wrap">
            <a href="menu.html" class="btn btn-ghost btn-sm">القائمة<span class="arrow">←</span></a>
            <a href="pizza.html" class="btn btn-gold btn-sm">البيتزا<span class="arrow">←</span></a>
          </div>
        </div>`;
      foot.innerHTML = "";
      return;
    }

    items.innerHTML = cart.map((it, idx) => {
      let img = "", title = "", meta = "";
      if(it.kind === "menu"){
        const item = findItem(it.itemId);
        if(!item) return "";
        img = item.img;
        title = item.name;
        const catName = (D.cats||[]).find(c => c.id === item.cat)?.name || "";
        meta = catName;
      } else if(it.kind === "pizza"){
        const pz = findPz(it.pzId);
        if(!pz) return "";
        const sz = findSize(it.sizeId);
        const half = it.half ? findPz(it.half) : null;
        const tops = (it.toppings||[]).map(id => findTop(id)?.name).filter(Boolean);
        img = pz.img;
        title = half ? `نصف ${pz.name} + نصف ${half.name}` : `${pz.emoji || "🍕"} ${pz.name}`;
        meta = [
          `الحجم: <strong>${sz?.ar} (${sz?.name})</strong>`,
          tops.length ? `إضافات: ${tops.join("، ")}` : null,
        ].filter(Boolean).join(" · ");
      }
      return `<div class="it" data-idx="${idx}">
        <img src="${img}" alt="" loading="lazy">
        <div>
          <div class="n">${title}</div>
          <div class="meta">${meta}</div>
          <div class="row2">
            <div class="qty">
              <button type="button" data-dec aria-label="-">−</button>
              <span class="v">${it.qty}</span>
              <button type="button" data-inc aria-label="+">+</button>
            </div>
            <div class="price">${fmt(lineSubtotal(it))} ${currency}</div>
          </div>
        </div>
        <button class="rm" type="button" data-rm aria-label="حذف" title="حذف">✕</button>
      </div>`;
    }).join("");

    const sub = cartTotal();
    const disc = discountedTotal();
    const saved = sub - disc;
    foot.innerHTML = `
      <div class="sum"><span>عدد العناصر</span><span>${cartCount()}</span></div>
      <div class="sum"><span>الإجمالي قبل الخصم</span><span>${fmt(sub)} ${currency}</span></div>
      ${appliedCoupon ? `
      <div class="sum coupon-row"><span>كوبون <strong>${appliedCoupon.code}</strong> (${appliedCoupon.discount}%)</span><span style="color:var(--saffron-2)">− ${fmt(saved)} ${currency}</span></div>
      ` : ''}
      <div class="sum total"><span>الإجمالي${appliedCoupon ? ' بعد الخصم' : ''}</span><span>${fmt(disc)} ${currency}</span></div>

      <div class="coupon-box">
        ${appliedCoupon ? `
          <div class="coupon-applied">
            <span>🎉 كوبون مطبّق: <strong>${appliedCoupon.title}</strong> — خصم ${appliedCoupon.discount}%</span>
            <button type="button" id="coupon-remove" class="coupon-remove-btn" aria-label="إزالة الكوبون">✕</button>
          </div>
        ` : `
          <div class="coupon-input-row">
            <input type="text" id="coupon-code" placeholder="أدخل كود الكوبون…" autocomplete="off" spellcheck="false" style="text-transform:uppercase">
            <button type="button" id="coupon-apply" class="btn btn-ghost btn-sm">تطبيق</button>
          </div>
          <p class="coupon-hint">لديك كوبون خصم؟ أدخله هنا للاستفادة من الخصم</p>
        `}
      </div>

      <div class="who">
        <input type="text" id="ck-name" placeholder="الاسم *" required>
        <input type="tel"  id="ck-phone" placeholder="رقم الجوال *" required>
        <textarea id="ck-addr" placeholder="العنوان بالتفصيل (شارع، حي، علامة مميزة) *" required></textarea>
      </div>
      <button class="send" type="button" id="ck-send">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 3.5A11 11 0 0 0 3 17l-1 5 5-1A11 11 0 1 0 20 3.5z"/></svg>
        أرسل الطلب عبر واتساب
      </button>
      <p class="hint">سيتم فتح واتساب برسالة جاهزة. تأكيد الطلب يتم من المطعم خلال 5 دقائق.</p>`;

    items.querySelectorAll(".it").forEach(el => {
      const idx = +el.dataset.idx;
      el.querySelector("[data-inc]").addEventListener("click", () => updateQty(idx, +1));
      el.querySelector("[data-dec]").addEventListener("click", () => updateQty(idx, -1));
      el.querySelector("[data-rm]").addEventListener("click", () => removeItem(idx));
    });
    foot.querySelector("#ck-send").addEventListener("click", sendWhatsApp);

    // coupon events
    const applyBtn = foot.querySelector("#coupon-apply");
    const removeBtn = foot.querySelector("#coupon-remove");
    if(applyBtn){
      applyBtn.addEventListener("click", () => {
        const val = foot.querySelector("#coupon-code").value;
        if(applyCoupon(val)) renderDrawer();
      });
      const codeInput = foot.querySelector("#coupon-code");
      codeInput && codeInput.addEventListener("keydown", e => {
        if(e.key === "Enter"){ e.preventDefault(); if(applyCoupon(codeInput.value)) renderDrawer(); }
      });
    }
    if(removeBtn){
      removeBtn.addEventListener("click", () => { removeCoupon(); renderDrawer(); });
    }
  }

  function updateQty(idx, delta){
    if(!cart[idx]) return;
    cart[idx].qty = Math.max(1, cart[idx].qty + delta);
    persist(); renderChrome();
  }
  function removeItem(idx){
    cart.splice(idx, 1);
    persist(); renderChrome();
  }

  // ---------- add to cart (generic) ----------
  function addItem(it){
    let key;
    if(it.kind === "menu"){
      key = JSON.stringify({k:"menu", id:it.itemId});
    } else {
      key = JSON.stringify({k:it.kind,p:it.pzId,s:it.sizeId,h:it.half||"",t:[...(it.toppings||[])].sort()});
    }
    const same = cart.findIndex(x => {
      if(it.kind === "menu" && x.kind === "menu") return x.itemId === it.itemId;
      if(it.kind === "pizza" && x.kind === "pizza"){
        return JSON.stringify({k:x.kind,p:x.pzId,s:x.sizeId,h:x.half||"",t:[...(x.toppings||[])].sort()}) === key;
      }
      return false;
    });
    if(same >= 0) cart[same].qty += it.qty;
    else cart.push(it);
    persist();
    injectChrome(); renderChrome();
    window.toast && window.toast(`أُضيف للسلة · ${cartCount()} عنصر`);
  }

  // ---------- add regular menu item ----------
  function addMenuItemById(itemId){
    const item = findItem(itemId);
    if(!item){ window.toast && window.toast("الصنف غير موجود"); return; }
    addItem({ kind:"menu", itemId, qty:1 });
  }

  // ---------- pizza customizer modal ----------
  function openCustomizer(pzId){
    const pz = findPz(pzId);
    if(!pz) return;
    let modal = $(".modal.pz-modal");
    if(!modal){
      modal = document.createElement("div");
      modal.className = "modal pz-modal";
      modal.innerHTML = `<div class="sheet">
        <button class="x" type="button" aria-label="إغلاق">×</button>
        <div data-body></div>
      </div>`;
      modal.addEventListener("click", e => { if(e.target === modal || e.target.closest(".x")) closeCustomizer(); });
      document.body.appendChild(modal);
    }
    const state = { pzId, sizeId:"M", toppings:[], half:null, qty:1 };

    function calc(){
      const base = pz.prices[state.sizeId];
      let main = base;
      if(state.half){
        const pz2 = findPz(state.half);
        main = Math.max(base, pz2.prices[state.sizeId]) + 5;
      }
      const tops = state.toppings.reduce((s,id) => s + (findTop(id)?.price || 0), 0);
      return (main + tops) * state.qty;
    }

    function render(){
      modal.querySelector("[data-body]").innerHTML = `
        <div class="cust-head">
          <img src="${pz.img}" alt="${pz.name}" loading="lazy">
          <div>
            <h2>${pz.emoji || "🍕"} ${pz.name}</h2>
            <p>${pz.desc}</p>
          </div>
        </div>
        <div class="cust-body">
          <h4>اختر الحجم <span class="pill">سعر مختلف لكل حجم</span></h4>
          <div class="size-row" data-sizes>
            ${(P.sizes||[]).map(s => `
              <button type="button" class="size-opt ${s.id===state.sizeId?'on':''}" data-size="${s.id}">
                <div class="n">${s.name}</div>
                <div class="a">${s.ar}</div>
                <div class="p">${fmt(pz.prices[s.id])}<small style="font-size:11px;color:var(--muted);font-family:var(--font-body);margin-inline-start:3px">${currency}</small></div>
                <div class="s">${s.serves}</div>
              </button>`).join("")}
          </div>

          <h4>نصفين مختلفين (اختياري)</h4>
          <label class="half-tog">
            <input type="checkbox" data-half-tog ${state.half?'checked':''}>
            <div>
              <div class="t">اطلب نصفين بنكهتين مختلفتين</div>
              <div class="s">يُحتسب سعر النصف الأغلى + 5 ${currency} رسوم تجهيز</div>
            </div>
          </label>
          <div class="half-pick ${state.half?'on':''}" data-half-pick>
            <label>اختر النكهة الثانية</label>
            <select data-half-sel>
              <option value="">— اختر نكهة —</option>
              ${(P.types||[]).filter(t => t.id !== pzId).map(t => `<option value="${t.id}" ${state.half===t.id?'selected':''}>${t.emoji||"🍕"} ${t.name} — ${fmt(t.prices[state.sizeId])} ${currency}</option>`).join("")}
            </select>
            <div class="note">سيتم تقديم البيتزا مقسومة إلى نصفين بنكهتين متمايزتين</div>
          </div>

          <h4>إضافات (Extra Toppings) <span class="pill">اختياري</span></h4>
          <div class="top-grid" data-tops>
            ${(P.toppings||[]).map(t => `
              <button type="button" class="top-opt ${state.toppings.includes(t.id)?'on':''}" data-top="${t.id}">
                <span class="em">${t.emoji}</span>
                <span class="n">${t.name}</span>
                <span class="p">+${t.price}</span>
                <span class="check"></span>
              </button>`).join("")}
          </div>
        </div>
        <div class="cust-foot">
          <div class="qty">
            <button type="button" data-q-dec aria-label="-">−</button>
            <span class="v" data-q-v>${state.qty}</span>
            <button type="button" data-q-inc aria-label="+">+</button>
          </div>
          <div class="totalbox">
            <div class="l">الإجمالي</div>
            <div class="t" data-total>${fmt(calc())}<small>${currency}</small></div>
          </div>
          <button class="btn btn-gold btn-add" type="button" data-add>أضف للسلة<span class="arrow">←</span></button>
        </div>
      `;
      bind();
    }

    function bind(){
      modal.querySelectorAll("[data-size]").forEach(b => b.addEventListener("click", () => {
        state.sizeId = b.dataset.size; render();
      }));
      modal.querySelectorAll("[data-top]").forEach(b => b.addEventListener("click", () => {
        const id = b.dataset.top;
        const i  = state.toppings.indexOf(id);
        if(i >= 0) state.toppings.splice(i, 1); else state.toppings.push(id);
        render();
      }));
      const tog = modal.querySelector("[data-half-tog]");
      tog.addEventListener("change", () => {
        if(!tog.checked){ state.half = null; }
        else { state.half = state.half || (P.types||[]).find(t => t.id !== pzId)?.id || null; }
        render();
      });
      modal.querySelector("[data-half-sel]")?.addEventListener("change", e => {
        state.half = e.target.value || null; render();
      });
      modal.querySelector("[data-q-dec]").addEventListener("click", () => {
        state.qty = Math.max(1, state.qty - 1);
        modal.querySelector("[data-q-v]").textContent = state.qty;
        modal.querySelector("[data-total]").innerHTML = fmt(calc()) + `<small>${currency}</small>`;
      });
      modal.querySelector("[data-q-inc]").addEventListener("click", () => {
        state.qty++;
        modal.querySelector("[data-q-v]").textContent = state.qty;
        modal.querySelector("[data-total]").innerHTML = fmt(calc()) + `<small>${currency}</small>`;
      });
      modal.querySelector("[data-add]").addEventListener("click", () => {
        if(modal.querySelector("[data-half-tog]").checked && !state.half){
          window.toast && window.toast("اختر النكهة الثانية أولاً");
          return;
        }
        addItem({ kind:"pizza", pzId, sizeId:state.sizeId, half:state.half, toppings:[...state.toppings], qty:state.qty });
        closeCustomizer();
      });
    }

    modal.classList.add("open");
    document.body.style.overflow = "hidden";
    render();
  }
  function closeCustomizer(){
    $(".pz-modal")?.classList.remove("open");
    document.body.style.overflow = "";
  }

  // ---------- whatsapp checkout ----------
  function getWaNumber(){ return localStorage.getItem(NUM_KEY) || P.whatsapp || "201068300432"; }
  function setWaNumber(n){ localStorage.setItem(NUM_KEY, String(n).replace(/[^\d]/g,"")); }

  function composeMessage(name, phone, addr){
    const lines = [];
    lines.push("🍕 طلب جديد — كاسا بيتزا");
    lines.push("");
    lines.push(`👤 الاسم: ${name}`);
    lines.push(`📞 الهاتف: ${phone}`);
    lines.push(`📍 العنوان: ${addr}`);
    lines.push("");
    lines.push("🍽️ تفاصيل الطلب:");
    lines.push("─────────────────");
    cart.forEach((it, i) => {
      if(it.kind === "menu"){
        const item = findItem(it.itemId);
        if(!item) return;
        lines.push(`${i+1}. ${item.name} × ${it.qty} — ${fmt(lineSubtotal(it))} ${currency}`);
      } else if(it.kind === "pizza"){
        const pz = findPz(it.pzId);
        if(!pz) return;
        const sz = findSize(it.sizeId);
        const half = it.half ? findPz(it.half) : null;
        const title = half ? `نصف ${pz.name} + نصف ${half.name}` : pz.name;
        lines.push(`${i+1}. ${pz.emoji||"🍕"} ${title} (${sz?.name||it.sizeId}/${sz?.ar||""}) × ${it.qty} — ${fmt(lineSubtotal(it))} ${currency}`);
        if((it.toppings||[]).length){
          const tops = it.toppings.map(id => findTop(id)?.name).filter(Boolean).join("، ");
          lines.push(`   ➕ إضافات: ${tops}`);
        }
      }
    });
    lines.push("─────────────────");
    const rawTotal = cartTotal();
    if(appliedCoupon){
      const discAmt = rawTotal - discountedTotal();
      lines.push(`💸 المجموع قبل الخصم: ${fmt(rawTotal)} ${currency}`);
      lines.push(`🎁 كوبون الخصم (${appliedCoupon.code}): − ${fmt(discAmt)} ${currency} (${appliedCoupon.discount}% خصم)`);
      lines.push(`💰 إجمالي الطلب بعد الخصم: ${fmt(discountedTotal())} ${currency}`);
    } else {
      lines.push(`💰 إجمالي الطلب: ${fmt(rawTotal)} ${currency}`);
    }
    lines.push("");
    lines.push("شكراً جزيلاً 🙏");
    return lines.join("\n");
  }

  function sendWhatsApp(){
    const name  = $("#ck-name")?.value.trim();
    const phone = $("#ck-phone")?.value.trim();
    const addr  = $("#ck-addr")?.value.trim();
    if(!name || !phone || !addr){
      window.toast && window.toast("أكمل الاسم والجوال والعنوان قبل الإرسال");
      return;
    }
    if(!cart.length){ window.toast && window.toast("السلة فارغة"); return; }
    const msg = composeMessage(name, phone, addr);
    const url = `https://wa.me/${getWaNumber()}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener");
    window.toast && window.toast("تم فتح واتساب — أرسل الرسالة لتأكيد الطلب");
  }

  // ---------- public API ----------
  window.SaffronCart = {
    add: addItem,
    addMenu: addMenuItemById,
    open: openDrawer,
    close: closeDrawer,
    openPizza: openCustomizer,
    state: () => ({ items: cart.slice(), total: cartTotal(), count: cartCount() }),
    clear: () => { cart = []; persist(); renderChrome(); },
    getWa: getWaNumber,
    setWa: setWaNumber,
    compose: composeMessage,
    applyCoupon,
    removeCoupon,
    getCoupon: () => appliedCoupon,
    discountedTotal,
  };

  // boot
  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", injectChrome);
  } else injectChrome();
})();
