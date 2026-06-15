/* =============================================================
   CASA PIZZA — Cart System
   Side Drawer · WhatsApp Checkout · Quick View Modal
   ============================================================= */

(function(){
  "use strict";
  if(window.SaffronCart) return; // singleton

  const D = window.SAFFRON_DATA;
  const R = D.restaurant;
  const P = D.pizza;
  const DELIVERY_FEE = 30;
  const MIN_ORDER = 150;

  /* -----------------------------------------------------------
     State
     ----------------------------------------------------------- */
  let cart = [];
  try {
    const saved = localStorage.getItem("casa_cart");
    if(saved) cart = JSON.parse(saved);
  } catch(e) {}

  /* -----------------------------------------------------------
     Coupon codes — validated against the live offers in data.js
     so the codes promoted on offers.html always work in the cart.
     Only whole-order discounts/free-delivery offers are eligible.
     ----------------------------------------------------------- */
  const CART_COUPON_TYPES = {
    "WELCOME25": "percent",
    "WEEKDAY20": "percent",
    "STUDENT15": "percent",
    "EID30":     "percent",
    "FREEDEL":   "freeDelivery",
  };
  const getCoupon = (code) => {
    code = (code || "").trim().toUpperCase();
    if(!code || !CART_COUPON_TYPES[code]) return null;
    const offer = (D.offers || []).find(o => o.code === code);
    if(!offer) return null;
    if(offer.endsAt && new Date(offer.endsAt).getTime() < Date.now()) return null;
    return { code, type: CART_COUPON_TYPES[code], value: offer.discount, title: offer.title };
  };

  let coupon = null;
  try {
    const savedCode = localStorage.getItem("casa_coupon");
    if(savedCode) coupon = getCoupon(savedCode);
  } catch(e) {}

  const save = () => {
    try { localStorage.setItem("casa_cart", JSON.stringify(cart)); } catch(e) {}
    try {
      if(coupon) localStorage.setItem("casa_coupon", coupon.code);
      else localStorage.removeItem("casa_coupon");
    } catch(e) {}
    updateFab();
    renderCart();
  };

  const money = (n) => `${n} ${D.pizza.currency}`;

  /* -----------------------------------------------------------
     Build shell: FAB + Drawer + Toast wrap
     ----------------------------------------------------------- */
  const fab = document.createElement("button");
  fab.className = "cart-fab";
  fab.setAttribute("aria-label", "سلة المشتريات");
  fab.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>
    <span class="badge-count" style="display:none">0</span>`;
  document.body.appendChild(fab);

  const drawer = document.createElement("div");
  drawer.className = "cart-drawer";
  drawer.innerHTML = `
    <aside class="cart-panel" role="dialog" aria-label="سلة المشتريات">
      <div class="cart-head">
        <h3>🛒 السلة <span class="count">0</span></h3>
        <button class="cart-close" aria-label="إغلاق">×</button>
      </div>
      <div class="cart-body"></div>
      <div class="cart-foot">
        <div class="coupon-box">
          <div class="coupon-row">
            <input type="text" class="coupon-input" placeholder="هل لديك كود خصم؟" maxlength="20" dir="ltr" autocomplete="off">
            <button class="btn btn-ghost btn-sm coupon-apply" type="button">تطبيق</button>
          </div>
          <div class="coupon-applied" hidden>
            <span class="coupon-applied-text"></span>
            <button class="coupon-remove" type="button" aria-label="إزالة كود الخصم">×</button>
          </div>
        </div>
        <div class="row"><span>المجموع الفرعي</span><span class="subtotal">0 ج.م</span></div>
        <div class="row discount" hidden><span>خصم الكوبون</span><span class="discount-amount">0 ج.م</span></div>
        <div class="row"><span>رسوم التوصيل</span><span class="delivery">${money(DELIVERY_FEE)}</span></div>
        <div class="row total"><span>الإجمالي</span><span class="grand">0 ج.م</span></div>
        <button class="btn btn-gold btn-block btn-lg checkout" type="button">💬 إتمام عبر واتساب</button>
        <p style="font-size:11.5px;color:var(--muted);text-align:center;margin-top:10px">الحد الأدنى للطلب ${money(MIN_ORDER)} · التوصيل خلال 30-45 دقيقة</p>
      </div>
    </aside>`;
  document.body.appendChild(drawer);

  fab.addEventListener("click", () => drawer.classList.add("open"));
  drawer.querySelector(".cart-close").addEventListener("click", () => drawer.classList.remove("open"));
  drawer.addEventListener("click", (e) => { if(e.target === drawer) drawer.classList.remove("open"); });

  const body = drawer.querySelector(".cart-body");
  const countEl = drawer.querySelector(".count");
  const subEl = drawer.querySelector(".subtotal");
  const discountRow = drawer.querySelector(".row.discount");
  const discountEl = drawer.querySelector(".discount-amount");
  const deliveryEl = drawer.querySelector(".delivery");
  const grandEl = drawer.querySelector(".grand");
  const fabBadge = fab.querySelector(".badge-count");
  const couponInput = drawer.querySelector(".coupon-input");
  const couponApplyBtn = drawer.querySelector(".coupon-apply");
  const couponAppliedBox = drawer.querySelector(".coupon-applied");
  const couponAppliedText = drawer.querySelector(".coupon-applied-text");
  const couponRemoveBtn = drawer.querySelector(".coupon-remove");

  /* -----------------------------------------------------------
     Coupon apply / remove
     ----------------------------------------------------------- */
  const applyCoupon = () => {
    const found = getCoupon(couponInput.value);
    if(!found){
      window.CasaToast && window.CasaToast("كود الخصم غير صحيح أو غير متاح", "error");
      return;
    }
    coupon = found;
    couponInput.value = "";
    save();
    window.CasaToast && window.CasaToast(`تم تطبيق كود الخصم ${found.code} 🎉`, "success");
  };
  couponApplyBtn.addEventListener("click", applyCoupon);
  couponInput.addEventListener("keydown", (e) => {
    if(e.key === "Enter"){ e.preventDefault(); applyCoupon(); }
  });
  couponRemoveBtn.addEventListener("click", () => {
    coupon = null;
    save();
    window.CasaToast && window.CasaToast("تم إزالة كود الخصم", "");
  });

  /* -----------------------------------------------------------
     Update FAB badge
     ----------------------------------------------------------- */
  const updateFab = () => {
    const count = cart.reduce((s, l) => s + l.qty, 0);
    fabBadge.textContent = count;
    fabBadge.style.display = count > 0 ? "grid" : "none";
    countEl.textContent = count;
  };

  /* -----------------------------------------------------------
     Totals — applies the active coupon (if any) and refreshes
     the subtotal / discount / delivery / grand-total rows plus
     the coupon UI state.
     ----------------------------------------------------------- */
  const updateTotals = (sub) => {
    let discount = 0;
    let deliveryFee = DELIVERY_FEE;

    if(coupon){
      if(coupon.type === "percent"){
        discount = Math.round(sub * coupon.value / 100);
      } else if(coupon.type === "freeDelivery"){
        deliveryFee = 0;
      }
      couponAppliedText.textContent = coupon.type === "percent"
        ? `✓ تم تطبيق ${coupon.code} — خصم ${coupon.value}%`
        : `✓ تم تطبيق ${coupon.code} — توصيل مجاني`;
      couponAppliedBox.hidden = false;
      couponInput.closest(".coupon-row").hidden = true;
    } else {
      couponAppliedBox.hidden = true;
      couponInput.closest(".coupon-row").hidden = false;
    }

    const total = Math.max(sub - discount + deliveryFee, 0);

    subEl.textContent = money(sub);
    if(discount > 0){
      discountRow.hidden = false;
      discountEl.textContent = `- ${money(discount)}`;
    } else {
      discountRow.hidden = true;
    }
    deliveryEl.innerHTML = (deliveryFee === 0 && DELIVERY_FEE > 0)
      ? `<s>${money(DELIVERY_FEE)}</s> مجاني`
      : money(deliveryFee);
    grandEl.textContent = money(total);

    return { discount, deliveryFee, total };
  };

  /* -----------------------------------------------------------
     Render cart
     ----------------------------------------------------------- */
  const renderCart = () => {
    if(!cart.length){
      body.innerHTML = `
        <div class="cart-empty">
          <div class="icon">🛒</div>
          <h4 style="margin-bottom:8px">سلتك فاضية</h4>
          <p style="font-size:13.5px;margin-bottom:18px">ابدأ بإضافة أصنافك المفضلة من القائمة</p>
          <a class="btn btn-gold btn-sm" href="menu.html">تصفح القائمة</a>
        </div>`;
      updateTotals(0);
      return;
    }

    body.innerHTML = cart.map((line, idx) => {
      const isPizza = !!line.type;
      const title = isPizza ? `🍕 ${line.name}` : line.name;
      let meta = "";
      if(isPizza){
        const sz = P.sizes.find(s => s.id === line.size);
        meta = `${sz ? sz.ar : line.size}`;
        if(line.half && line.half !== line.type) meta += ` · نصف ${P.types.find(p => p.id === line.half).name}`;
        if(line.toppings && line.toppings.length){
          const tops = line.toppings.map(t => P.toppings.find(x => x.id === t.id).name).join("، ");
          meta += ` · +${tops}`;
        }
      } else {
        meta = `صنف من القائمة`;
      }
      return `
        <div class="cart-item" data-idx="${idx}">
          <img src="${line.img}" alt="${title}">
          <div class="info">
            <div class="name">${title}</div>
            <div class="meta">${meta}</div>
            <div class="qty">
              <button class="dec" aria-label="إنقاص">−</button>
              <span>${line.qty}</span>
              <button class="inc" aria-label="زيادة">+</button>
            </div>
          </div>
          <div class="price">${line.lineTotal}<small>${D.pizza.currency}</small></div>
          <button class="remove" aria-label="حذف">×</button>
        </div>`;
    }).join("");

    const sub = cart.reduce((s, l) => s + l.lineTotal * l.qty, 0);
    updateTotals(sub);

    // Listeners
    body.querySelectorAll(".cart-item").forEach(el => {
      const i = parseInt(el.dataset.idx);
      el.querySelector(".inc").addEventListener("click", () => { cart[i].qty++; save(); });
      el.querySelector(".dec").addEventListener("click", () => {
        cart[i].qty--;
        if(cart[i].qty <= 0) cart.splice(i, 1);
        save();
      });
      el.querySelector(".remove").addEventListener("click", () => { cart.splice(i, 1); save(); });
    });
  };

  /* -----------------------------------------------------------
     Add to cart
     ----------------------------------------------------------- */
  const addLine = (line) => {
    cart.push(line);
    save();
    window.CasaToast && window.CasaToast(`أُضيف ${line.name} للسلة`, "success");
    // Briefly open drawer
    drawer.classList.add("open");
  };

  // Add menu item
  window.SaffronCart = {
    addMenu(itemId){
      const item = D.items.find(i => i.id === itemId);
      if(!item) return;
      addLine({
        kind: "menu",
        id: item.id,
        name: item.name,
        img: item.img,
        price: item.price,
        lineTotal: item.price,
        qty: 1
      });
    },
    // Pizza with customizer
    openPizza(pizzaId){
      const pz = P.types.find(p => p.id === pizzaId);
      if(!pz) return;
      const pModal = buildPizzaModal(pz);
      pModal.classList.add("open");
    },
    // Get cart contents (for checkout page)
    getCart(){ return cart; },
    clear(){ cart = []; save(); }
  };

  /* -----------------------------------------------------------
     Pizza customizer modal
     ----------------------------------------------------------- */
  const buildPizzaModal = (pz) => {
    // Remove existing
    const old = document.querySelector(".qv-overlay");
    if(old) old.remove();

    const overlay = document.createElement("div");
    overlay.className = "qv-overlay";
    const cur = { size: "M", half: null, toppings: [] };
    const sizeMap = pz.prices;

    const renderPizzaModal = () => {
      const basePrice = sizeMap[cur.size];
      const topsPrice = cur.toppings.reduce((s, t) => s + P.toppings.find(x => x.id === t.id).price, 0);
      const halfFee = cur.half && cur.half !== pz.id ? 15 : 0;
      const total = basePrice + topsPrice + halfFee;

      overlay.innerHTML = `
        <div class="qv-modal">
          <button class="close" aria-label="إغلاق">×</button>
          <div class="img"><img src="${pz.img}" alt="${pz.name}"></div>
          <div class="body">
            <span class="eyebrow">بيتزا إيطالية</span>
            <h3>${pz.emoji} ${pz.name}</h3>
            <div class="meta">
              <span class="stars">★ ${(4.7).toFixed(1)}</span>
              <span>· 4.7 من 5 تقييم</span>
              <span>· ${pz.tag === "veg" ? "🌿 نباتي" : pz.tag === "hot" ? "🔥 حار" : ""}</span>
            </div>
            <p class="desc">${pz.desc}</p>

            <div>
              <div class="label" style="font-size:12.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:8px">اختر الحجم</div>
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                ${P.sizes.map(s => `
                  <button class="size-btn ${cur.size === s.id ? "active" : ""}" data-size="${s.id}"
                    style="padding:10px 14px;border-radius:12px;border:1.5px solid ${cur.size === s.id ? "var(--ink)" : "var(--line)"};background:${cur.size === s.id ? "var(--ink)" : "#fff"};color:${cur.size === s.id ? "var(--cream)" : "var(--ink)"};font-size:13px;font-weight:600;cursor:pointer;transition:all .22s;display:flex;flex-direction:column;align-items:center;gap:2px">
                    <span>${s.ar}</span>
                    <span style="font-size:11px;opacity:.8">${s.cm}</span>
                    <span style="font-family:var(--font-num);font-size:1.1rem;color:${cur.size === s.id ? "var(--saffron)" : "var(--saffron-2)"}">${sizeMap[s.id]} ${D.pizza.currency}</span>
                  </button>`).join("")}
              </div>
            </div>

            <div>
              <div class="label" style="font-size:12.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin:14px 0 8px">نصفين مختلفين (اختياري · +15 ج.م)</div>
              <select class="half-select" style="width:100%;padding:11px 14px;border:1px solid var(--line);border-radius:12px;background:#fff;font-size:13.5px;outline:none">
                <option value="">نفس البيتزا كاملة</option>
                ${P.types.filter(p => p.id !== pz.id).map(p => `<option value="${p.id}" ${cur.half === p.id ? "selected" : ""}>نصف ${p.name}</option>`).join("")}
              </select>
            </div>

            <div>
              <div class="label" style="font-size:12.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin:14px 0 8px">إضافات (اختياري)</div>
              <div style="display:flex;gap:6px;flex-wrap:wrap">
                ${P.toppings.map(t => `
                  <button class="top-btn" data-top="${t.id}"
                    style="padding:7px 12px;border-radius:99px;border:1.5px solid ${cur.toppings.find(x => x.id === t.id) ? "var(--saffron)" : "var(--line)"};background:${cur.toppings.find(x => x.id === t.id) ? "rgba(201,162,78,.15)" : "#fff"};font-size:12.5px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px">
                    ${t.emoji} ${t.name} <span style="color:var(--saffron-2);font-family:var(--font-num)">+${t.price}</span>
                  </button>`).join("")}
              </div>
            </div>

            <div class="price-line" style="margin-top:auto;padding-top:14px;border-top:1px dashed var(--line)">
              <span class="price">${total}<small>${D.pizza.currency}</small></span>
              <span style="font-size:13px;color:var(--muted)">الإجمالي</span>
            </div>
            <div class="actions">
              <button class="btn btn-ghost add-half" type="button">أضف نصف آخر للسلة</button>
              <button class="btn btn-gold add-full" type="button">🛒 أضف للسلة</button>
            </div>
          </div>
        </div>`;

      // listeners
      overlay.querySelector(".close").addEventListener("click", () => overlay.classList.remove("open"));
      overlay.addEventListener("click", (e) => { if(e.target === overlay) overlay.classList.remove("open"); });
      overlay.querySelectorAll(".size-btn").forEach(b => b.addEventListener("click", () => {
        cur.size = b.dataset.size;
        renderPizzaModal();
      }));
      overlay.querySelector(".half-select").addEventListener("change", (e) => {
        cur.half = e.target.value || null;
        renderPizzaModal();
      });
      overlay.querySelectorAll(".top-btn").forEach(b => b.addEventListener("click", () => {
        const id = b.dataset.top;
        const ex = cur.toppings.find(x => x.id === id);
        if(ex) cur.toppings = cur.toppings.filter(x => x.id !== id);
        else cur.toppings.push({id});
        renderPizzaModal();
      }));

      const addToCart = (asHalf) => {
        const line = {
          kind: "pizza",
          type: pz.id,
          name: pz.name + (asHalf ? " (نصفين)" : ""),
          img: pz.img,
          price: total,
          lineTotal: total,
          qty: 1,
          size: cur.size,
          half: cur.half,
          toppings: [...cur.toppings]
        };
        if(asHalf){
          // actually add as TWO half items
          line.name = `${pz.name} / ${P.types.find(p => p.id === cur.half).name}`;
        }
        addLine(line);
        overlay.classList.remove("open");
      };

      overlay.querySelector(".add-full").addEventListener("click", () => addToCart(false));
      overlay.querySelector(".add-half").addEventListener("click", () => {
        if(cur.half){
          addToCart(true);
        } else {
          window.CasaToast("اختر نوع النصف الثاني أولاً", "error");
        }
      });
    };

    document.body.appendChild(overlay);
    renderPizzaModal();
    return overlay;
  };

  /* -----------------------------------------------------------
     Quick view (regular items)
     ----------------------------------------------------------- */
  const buildQuickView = (item) => {
    const old = document.querySelector(".qv-overlay");
    if(old) old.remove();
    const overlay = document.createElement("div");
    overlay.className = "qv-overlay";
    overlay.innerHTML = `
      <div class="qv-modal">
        <button class="close" aria-label="إغلاق">×</button>
        <div class="img"><img src="${item.img}" alt="${item.name}"></div>
        <div class="body">
          <span class="eyebrow">${(D.cats.find(c => c.id === item.cat) || {name:""}).name}</span>
          <h3>${item.name}</h3>
          <div class="meta">
            <span class="stars">★ ${item.rating.toFixed(1)}</span>
            <span>· ${item.reviews} تقييم</span>
          </div>
          <p class="desc">${item.desc}</p>
          ${(item.tags || []).map(t => `<span class="tag ${t}">${({hot:"🔥 حار",veg:"🌿 نباتي",new:"✨ جديد"})[t] || t}</span>`).join(" ")}
          <div class="price-line" style="margin-top:auto;padding-top:14px;border-top:1px dashed var(--line)">
            <span class="price">${item.price}<small>${D.pizza.currency}</small></span>
            <span style="font-size:13px;color:var(--muted)">السعر</span>
          </div>
          <div class="actions">
            <button class="btn btn-ghost close-modal" type="button">إغلاق</button>
            <button class="btn btn-gold" type="button" data-add="${item.id}">🛒 أضف للسلة</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.classList.add("open");
    const close = () => overlay.classList.remove("open");
    overlay.querySelector(".close").addEventListener("click", close);
    overlay.querySelector(".close-modal").addEventListener("click", close);
    overlay.addEventListener("click", (e) => { if(e.target === overlay) close(); });
    overlay.querySelector("[data-add]").addEventListener("click", () => {
      window.SaffronCart.addMenu(item.id);
      close();
    });
  };
  window.SaffronCart.quickView = (id) => {
    const item = D.items.find(i => i.id === id);
    if(item) buildQuickView(item);
  };

  /* -----------------------------------------------------------
     Checkout → WhatsApp
     ----------------------------------------------------------- */
  drawer.querySelector(".checkout").addEventListener("click", () => {
    if(!cart.length){
      window.CasaToast && window.CasaToast("سلتك فاضية — أضف أصناف أولاً", "error");
      return;
    }
    const sub = cart.reduce((s, l) => s + l.lineTotal * l.qty, 0);
    const { discount, deliveryFee, total } = updateTotals(sub);

    if(sub < MIN_ORDER){
      window.CasaToast && window.CasaToast(`الحد الأدنى للطلب ${money(MIN_ORDER)}`, "error");
      return;
    }

    let msg = `*🍕 طلب جديد — كاسا بيتزا*\n`;
    msg += `━━━━━━━━━━━━━━━━━\n\n`;
    let table = null;
    try { table = sessionStorage.getItem("casa_table"); } catch(e) {}
    if(table) msg += `🪑 رقم الطاولة: *${table}*\n\n`;
    cart.forEach((l, i) => {
      const sz = l.size ? P.sizes.find(s => s.id === l.size) : null;
      msg += `*${i+1}.* ${l.name}\n`;
      if(sz) msg += `   📐 ${sz.ar} (${sz.cm})\n`;
      if(l.half && l.half !== l.type){
        const h = P.types.find(p => p.id === l.half);
        msg += `   🔀 نصف ${h.name}\n`;
      }
      if(l.toppings && l.toppings.length){
        const tops = l.toppings.map(t => P.toppings.find(x => x.id === t.id).name).join("، ");
        msg += `   ➕ ${tops}\n`;
      }
      msg += `   🔢 الكمية: ${l.qty}\n`;
      msg += `   💰 ${l.lineTotal * l.qty} ${D.pizza.currency}\n\n`;
    });
    msg += `━━━━━━━━━━━━━━━━━\n`;
    msg += `📦 المجموع الفرعي: *${sub} ${D.pizza.currency}*\n`;
    if(coupon){
      msg += `🏷️ كود الخصم: *${coupon.code}*`;
      if(discount > 0) msg += ` (خصم ${discount} ${D.pizza.currency})`;
      else if(coupon.type === "freeDelivery") msg += ` (توصيل مجاني)`;
      msg += `\n`;
    }
    msg += `🏍️ التوصيل: *${deliveryFee === 0 ? "مجاني" : deliveryFee + " " + D.pizza.currency}*\n`;
    msg += `💵 *الإجمالي: ${total} ${D.pizza.currency}*\n\n`;
    msg += `📍 سأرسل العنوان بعد تأكيد الطلب\n`;
    msg += `🕐 وقت التوصيل المتوقع: ${D.stats.deliveryTime} دقيقة\n\n`;
    msg += `_تم الإرسال من موقع كاسا بيتزا 🌐_`;

    const url = `https://wa.me/${R.whatsapp}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  });

  /* -----------------------------------------------------------
     Initial render
     ----------------------------------------------------------- */
  updateFab();
  renderCart();

  /* -----------------------------------------------------------
     Make add buttons work
     ----------------------------------------------------------- */
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-add-item]");
    if(btn){
      const id = parseInt(btn.dataset.addItem);
      window.SaffronCart.addMenu(id);
      btn.classList.add("added");
      const orig = btn.innerHTML;
      btn.innerHTML = "✓ أُضيف";
      setTimeout(() => { btn.innerHTML = orig; btn.classList.remove("added"); }, 1200);
    }
  });

})();
