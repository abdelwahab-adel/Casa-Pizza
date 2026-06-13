/* =============================================================
   دار الزعفران — Admin dashboard renderer (static demo)
   ============================================================= */

(function(){
  const D = window.SAFFRON_DATA;
  const main = document.getElementById("admin-main");
  if(!main || !D) return;

  // --- mock metrics ---
  const today = new Date().toLocaleDateString("ar-SA", { weekday:"long", day:"numeric", month:"long", year:"numeric" });

  // sparkline helper
  function spark(values, color){
    const w = 120, h = 32, max = Math.max(...values), min = Math.min(...values);
    const pts = values.map((v,i) => {
      const x = (i/(values.length-1))*w;
      const y = h - ((v-min)/(max-min || 1))*h*0.8 - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
      <polyline fill="none" stroke="${color}" stroke-width="1.5" points="${pts}"/>
      <polyline fill="${color}" fill-opacity=".08" stroke="none" points="0,${h} ${pts} ${w},${h}"/>
    </svg>`;
  }

  const seriesVisits = [220, 245, 198, 312, 289, 340, 410, 388, 420, 465, 502, 488, 530, 612];
  const seriesOrders = [148, 162, 140, 188, 175, 210, 245, 232, 258, 272, 290, 285, 302, 348];
  const seriesQR     = [42, 48, 55, 62, 70, 78, 91, 88, 102, 118, 132, 128, 145, 168];
  const seriesRev    = [16, 18, 14, 22, 21, 28, 32, 30, 34, 38, 42, 41, 46, 54]; // in K ج.م

  // most viewed/ordered items
  const mostViewed = [...D.items].sort((a,b) => b.reviews - a.reviews).slice(0,6);
  const mostOrdered = [...D.items].sort((a,b) => b.rating*10 + b.reviews/100 - (a.rating*10 + a.reviews/100)).slice(0,5);
  const totalScans = D.tables.reduce((s,t) => s + t.scans, 0);

  // mock reservations
  const reservations = [
    { id:"RV-2026-0184", name:"أحمد المنشاوي", time:"الليلة 8:30 م", ppl:4, area:"الصالة الداخلية", status:"ok" },
    { id:"RV-2026-0183", name:"سارة عبد العزيز",        time:"الليلة 9:00 م", ppl:2, area:"بجانب الشباك",  status:"ok" },
    { id:"RV-2026-0182", name:"محمد الحسيني",     time:"الليلة 9:30 م", ppl:6, area:"التراس الخارجي", status:"wait" },
    { id:"RV-2026-0181", name:"نورا خالد",      time:"الليلة 10:00 م", ppl:3, area:"الصالة الداخلية", status:"ok" },
    { id:"RV-2026-0180", name:"عائلة فتحي",      time:"الليلة 10:30 م", ppl:8, area:"VIP", status:"wait" },
    { id:"RV-2026-0179", name:"كريم محمود",      time:"غداً 1:30 م",  ppl:2, area:"بجانب الشباك",  status:"ok" },
    { id:"RV-2026-0178", name:"منة سامي",        time:"غداً 8:00 م",  ppl:5, area:"التراس الخارجي", status:"no" },
  ];

  main.innerHTML = `
    <div class="toolbar">
      <div>
        <h1>أهلاً، الشيف سامر <span style="font-family:var(--font-display);color:var(--saffron-2)">.</span></h1>
        <div class="sub">${today} · المطعم مفتوح الآن — 42 ضيفاً في الموقع</div>
      </div>
      <div class="actions">
        <button class="btn btn-ghost btn-sm">تصدير تقرير اليوم</button>
        <button class="btn btn-gold btn-sm">+ صنف جديد</button>
      </div>
    </div>

    <!-- KPI cards -->
    <div class="stat-grid">
      <div class="stat">
        <div class="label">زيارات اليوم</div>
        <div class="val">612</div>
        <div class="delta up">▲ 18.4% مقابل أمس</div>
        ${spark(seriesVisits, "#C9A24E")}
      </div>
      <div class="stat">
        <div class="label">طلبات الطعام</div>
        <div class="val">348</div>
        <div class="delta up">▲ 12.1%</div>
        ${spark(seriesOrders, "#6A2A2A")}
      </div>
      <div class="stat">
        <div class="label">مسحات QR</div>
        <div class="val">168</div>
        <div class="delta up">▲ 9.2%</div>
        ${spark(seriesQR, "#5F6B3A")}
      </div>
      <div class="stat">
        <div class="label">إيراد اليوم (ج.م)</div>
        <div class="val">54,210</div>
        <div class="delta up">▲ 14.8%</div>
        ${spark(seriesRev, "#B0883A")}
      </div>
    </div>

    <!-- Panels: most viewed + occupancy -->
    <div class="panels">
      <div class="panel">
        <div class="panel-head">
          <h3>أكثر الأصناف مشاهدة</h3>
          <div class="ddl">آخر 7 أيام ⌄</div>
        </div>
        ${mostViewed.map((it,i) => {
          const pct = Math.round((it.reviews / mostViewed[0].reviews) * 100);
          return `<div class="bar-row">
            <div class="label">${i+1}. ${it.name}</div>
            <div class="bar"><span style="width:${pct}%"></span></div>
            <div class="v">${it.reviews}</div>
          </div>`;
        }).join("")}
      </div>

      <div class="panel">
        <div class="panel-head">
          <h3>إشغال المناطق الآن</h3>
          <div class="ddl">تحديث آلي ⌄</div>
        </div>
        ${[
          ["الصالة الداخلية", 75],
          ["بجانب الشباك", 92],
          ["التراس الخارجي", 64],
          ["زاوية VIP", 50],
        ].map(([n,p]) => `<div class="bar-row">
          <div class="label">${n}</div>
          <div class="bar"><span style="width:${p}%;background:linear-gradient(90deg,${p>85?'#A8362F':p>65?'#B0883A':'#5F6B3A'},${p>85?'#C9433A':p>65?'#C9A24E':'#7A8A4A'})"></span></div>
          <div class="v">${p}%</div>
        </div>`).join("")}

        <div style="margin-top:18px;padding-top:14px;border-top:1px dashed var(--line);font-size:13px;color:var(--muted);display:flex;justify-content:space-between">
          <span>متوسط مدة الطاولة</span>
          <span style="font-family:var(--font-num);color:var(--ink);font-size:16px">1س 52د</span>
        </div>
      </div>
    </div>

    <!-- Panels: reservations + offers performance -->
    <div class="panels">
      <div class="panel">
        <div class="panel-head">
          <h3>حجوزات الليلة وغداً</h3>
          <a href="#" class="ddl" style="color:var(--saffron-2)">عرض الكل ←</a>
        </div>
        <table class="tbl">
          <thead><tr><th>الرقم</th><th>الاسم</th><th>الموعد</th><th>الضيوف</th><th>المنطقة</th><th>الحالة</th></tr></thead>
          <tbody>
            ${reservations.map(r => `
              <tr>
                <td style="font-family:var(--font-num);color:var(--burgundy)">${r.id}</td>
                <td style="font-weight:600">${r.name}</td>
                <td>${r.time}</td>
                <td>${r.ppl}</td>
                <td style="color:var(--muted)">${r.area}</td>
                <td><span class="status ${r.status}">${({ok:"مؤكّد", wait:"بانتظار التأكيد", no:"ملغى"})[r.status]}</span></td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>

      <div class="panel">
        <div class="panel-head">
          <h3>أداء العروض النشطة</h3>
          <div class="ddl">منذ بداية الشهر</div>
        </div>
        ${D.offers.map(o => {
          const used = Math.floor(40 + Math.random()*220);
          const cap = 350;
          const pct = Math.min(100, Math.round(used/cap*100));
          return `<div style="padding:12px 0;border-bottom:1px dashed var(--line)">
            <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
              <div style="font-weight:600;font-size:14px">${o.title}</div>
              <div style="font-family:var(--font-num);font-size:14px;color:var(--saffron-2)">${o.code}</div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 60px;gap:10px;align-items:center;margin-top:8px">
              <div class="bar" style="height:6px;background:var(--paper-2);border-radius:999px;overflow:hidden">
                <span style="display:block;height:100%;background:linear-gradient(90deg,var(--burgundy),#9A3F3F);width:${pct}%"></span>
              </div>
              <div style="text-align:end;font-size:12px;color:var(--muted)">${used} / ${cap}</div>
            </div>
          </div>`;
        }).join("")}
      </div>
    </div>

    <!-- Tables performance + reviews -->
    <div class="panels">
      <div class="panel">
        <div class="panel-head">
          <h3>أداء أكواد QR (آخر 30 يوماً)</h3>
          <div class="ddl">إجمالي ${totalScans} مسحة</div>
        </div>
        <table class="tbl">
          <thead><tr><th>الطاولة</th><th>الموقع</th><th>المسحات</th><th>المسار</th></tr></thead>
          <tbody>
            ${D.tables.map(t => {
              const max = Math.max(...D.tables.map(x => x.scans));
              const pct = Math.round(t.scans/max*100);
              return `<tr>
                <td style="font-family:var(--font-num);color:var(--burgundy);font-weight:600">${t.id}</td>
                <td>${t.label.replace(/^طاولة \\d+ — /, "")}</td>
                <td style="font-family:var(--font-num);font-size:15px">${t.scans}</td>
                <td><div class="bar" style="height:6px;background:var(--paper-2);border-radius:999px;overflow:hidden;min-width:120px"><span style="display:block;height:100%;width:${pct}%;background:linear-gradient(90deg,var(--saffron-2),var(--saffron))"></span></div></td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>

      <div class="panel">
        <div class="panel-head">
          <h3>آخر مراجعات الضيوف</h3>
          <a href="#" class="ddl" style="color:var(--saffron-2)">إدارة المراجعات ←</a>
        </div>
        ${D.reviews.map(r => `
          <div style="padding:14px 0;border-bottom:1px dashed var(--line);display:flex;gap:12px;align-items:flex-start">
            <img src="${r.img}" alt="" style="width:38px;height:38px;border-radius:50%;flex-shrink:0">
            <div style="flex:1;min-width:0">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
                <div style="font-weight:600;font-size:14px">${r.name}</div>
                <div style="color:var(--saffron-2);font-size:13px">${"★".repeat(r.rating)}</div>
              </div>
              <p style="margin:6px 0 0;color:var(--muted);font-size:13px;line-height:1.7">${r.text}</p>
            </div>
          </div>`).join("")}
      </div>
    </div>

    <!-- Items management -->
    <div class="panel" style="margin-bottom:24px">
      <div class="panel-head">
        <h3>إدارة الأصناف — أعلى 5 طلباً</h3>
        <div class="actions" style="display:flex;gap:8px">
          <button class="btn btn-ghost btn-sm">تصفية ⌄</button>
          <button class="btn btn-gold btn-sm">+ إضافة صنف</button>
        </div>
      </div>
      <table class="tbl">
        <thead><tr><th></th><th>الصنف</th><th>التصنيف</th><th>السعر</th><th>التقييم</th><th>الحالة</th><th></th></tr></thead>
        <tbody>
          ${mostOrdered.map(it => {
            const cat = D.cats.find(c => c.id === it.cat)?.name || it.cat;
            return `<tr>
              <td><img src="${it.img}" alt="" style="width:42px;height:42px;border-radius:8px;object-fit:cover"></td>
              <td style="font-weight:600">${it.name}<div style="font-size:12px;color:var(--muted);font-weight:400">${it.desc.slice(0,60)}…</div></td>
              <td style="color:var(--muted)">${cat}</td>
              <td style="font-family:var(--font-num);color:var(--burgundy);font-size:16px">${it.price} ج.م</td>
              <td>★ ${it.rating} <small style="color:var(--muted)">(${it.reviews})</small></td>
              <td><span class="status ok">منشور</span></td>
              <td style="text-align:end"><a href="#" style="color:var(--saffron-2);font-weight:600;font-size:13px">تعديل</a></td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>

    <div style="text-align:center;color:var(--muted);font-size:12px;padding:24px 0">
      كاسا بيتزا مصر — لوحة الإدارة · إصدار 2.6.1 · القاهرة الجديدة
    </div>
  `;

  // ============================================================
  //  PIZZA MANAGEMENT SECTION (appended)
  // ============================================================
  if(!D.pizza) return;
  const P = D.pizza;
  const fmt = n => Number(n).toLocaleString("ar-EG");

  const waCurrent = (window.SaffronCart?.getWa?.()) || P.whatsapp;

  const pzPanel = document.createElement("div");
  pzPanel.innerHTML = `
    <div class="toolbar" style="margin-top:24px">
      <div>
        <h1 style="font-size:22px">إدارة قسم البيتزا 🍕</h1>
        <div class="sub">8 أنواع · 4 أحجام · 7 إضافات · مرتبط بطلبات واتساب</div>
      </div>
      <div class="actions">
        <a href="pizza.html" class="btn btn-ghost btn-sm">معاينة قسم البيتزا ←</a>
        <button class="btn btn-gold btn-sm">+ نوع بيتزا جديد</button>
      </div>
    </div>

    <!-- WhatsApp settings -->
    <div class="panel" style="margin-bottom:24px">
      <div class="panel-head">
        <h3>إعدادات الطلب عبر واتساب</h3>
        <div class="ddl">يُطبق على جميع الطلبات الجديدة</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div class="field">
          <label>رقم واتساب الاستقبال (بصيغة دولية بدون +)</label>
          <input type="tel" id="pz-wa" value="${waCurrent}" placeholder="201068300432" style="font-family:var(--font-num);letter-spacing:.08em">
        </div>
        <div class="field">
          <label>سياسة سعر "نصف ونصف"</label>
          <select disabled style="background:var(--paper)">
            <option>سعر النصف الأغلى + 15 ${P.currency} رسوم تجهيز</option>
          </select>
        </div>
      </div>
      <div style="margin-top:14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <button class="btn btn-gold btn-sm" id="pz-wa-save">حفظ رقم واتساب</button>
        <span class="hint" id="pz-wa-status"></span>
      </div>
    </div>

    <!-- Pizza types -->
    <div class="panel" style="margin-bottom:24px">
      <div class="panel-head">
        <h3>أنواع البيتزا · أسعار الأحجام</h3>
        <div class="actions" style="display:flex;gap:8px">
          <button class="btn btn-ghost btn-sm">تصدير CSV</button>
          <button class="btn btn-gold btn-sm">+ إضافة نوع</button>
        </div>
      </div>
      <table class="tbl">
        <thead><tr><th></th><th>الاسم</th>
          ${P.sizes.map(s => `<th>${s.name} (${s.ar})</th>`).join("")}
          <th>الحالة</th><th></th></tr></thead>
        <tbody>
          ${P.types.map(t => `
            <tr>
              <td><img src="${t.img}" alt="" style="width:40px;height:40px;border-radius:8px;object-fit:cover"></td>
              <td style="font-weight:600">${t.emoji} ${t.name}<div style="font-size:12px;color:var(--muted);font-weight:400">${t.desc.slice(0,55)}…</div></td>
              ${P.sizes.map(s => `<td style="font-family:var(--font-num);color:var(--burgundy);font-weight:600">${fmt(t.prices[s.id])} <small style="color:var(--muted);font-family:var(--font-body)">${P.currency}</small></td>`).join("")}
              <td><span class="status ok">منشور</span></td>
              <td style="text-align:end"><a href="#" style="color:var(--saffron-2);font-weight:600;font-size:13px">تعديل</a></td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>

    <!-- Sizes + Toppings panels -->
    <div class="panels">
      <div class="panel">
        <div class="panel-head">
          <h3>الأحجام المتاحة</h3>
          <button class="btn btn-gold btn-sm">+ حجم جديد</button>
        </div>
        <table class="tbl">
          <thead><tr><th>الرمز</th><th>الاسم</th><th>الوصف العربي</th><th>يكفي</th><th></th></tr></thead>
          <tbody>
            ${P.sizes.map(s => `
              <tr>
                <td style="font-family:var(--font-num);color:var(--burgundy);font-weight:700">${s.id}</td>
                <td style="font-weight:600">${s.name}</td>
                <td>${s.ar}</td>
                <td style="color:var(--muted)">${s.serves}</td>
                <td style="text-align:end"><a href="#" style="color:var(--saffron-2);font-weight:600;font-size:13px">تعديل</a></td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>

      <div class="panel">
        <div class="panel-head">
          <h3>الإضافات (Toppings)</h3>
          <button class="btn btn-gold btn-sm">+ إضافة</button>
        </div>
        <table class="tbl">
          <thead><tr><th></th><th>الاسم</th><th>السعر</th><th>الحالة</th><th></th></tr></thead>
          <tbody>
            ${P.toppings.map(t => `
              <tr>
                <td style="font-size:18px">${t.emoji}</td>
                <td style="font-weight:600">${t.name}</td>
                <td style="font-family:var(--font-num);color:var(--burgundy);font-weight:600">+${t.price} <small style="color:var(--muted);font-family:var(--font-body)">${P.currency}</small></td>
                <td><span class="status ok">مفعّل</span></td>
                <td style="text-align:end"><a href="#" style="color:var(--saffron-2);font-weight:600;font-size:13px">تعديل</a></td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Mock recent pizza orders -->
    <div class="panel">
      <div class="panel-head">
        <h3>آخر طلبات البيتزا عبر واتساب</h3>
        <div class="ddl">آخر 6 طلبات</div>
      </div>
      <table class="tbl">
        <thead><tr><th>الرقم</th><th>العميل</th><th>الطلب</th><th>الإجمالي</th><th>الحالة</th></tr></thead>
        <tbody>
          ${[
            ["#PZ-1042","محمد عبدالحميد","مارجريتا L × 2 + بيبروني M × 1", 565, "ok"],
            ["#PZ-1041","سارة كمال","نصف سي فود + نصف ميكس جبن (F) × 1", 440, "wait"],
            ["#PZ-1040","أحمد رضوان","سوبر سوبريم F × 1 + جبنة إضافية", 415, "ok"],
            ["#PZ-1039","نهى فؤاد","تشيكن رانش M × 2 + هالبينو", 446, "ok"],
            ["#PZ-1038","يوسف حسن","مكسيكانو L × 1 + لحم إضافي", 315, "no"],
            ["#PZ-1037","رنا الحسيني","دجاج باربكيو F × 2", 760, "ok"],
          ].map(([id,name,detail,tot,st]) => `
            <tr>
              <td style="font-family:var(--font-num);color:var(--burgundy);font-weight:600">${id}</td>
              <td style="font-weight:600">${name}</td>
              <td style="color:var(--muted);font-size:13px">${detail}</td>
              <td style="font-family:var(--font-num);font-size:15px">${tot} ${P.currency}</td>
              <td><span class="status ${st}">${({ok:"مسلَّم", wait:"قيد التحضير", no:"ملغى"})[st]}</span></td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;
  main.appendChild(pzPanel);

  // wire WA save
  const waInput = document.getElementById("pz-wa");
  document.getElementById("pz-wa-save").addEventListener("click", () => {
    const v = waInput.value.trim();
    if(!/^\d{8,15}$/.test(v)){
      window.toast && window.toast("الرقم يجب أن يكون من 8 إلى 15 رقم بصيغة دولية بدون +");
      return;
    }
    window.SaffronCart?.setWa(v);
    document.getElementById("pz-wa-status").textContent = "✓ تم الحفظ — جميع الطلبات الجديدة ستذهب لهذا الرقم";
    document.getElementById("pz-wa-status").style.color = "#2E7D44";
    window.toast && window.toast("تم تحديث رقم واتساب المستقبل");
  });
})();

// ============================================================
//  RESERVATIONS MANAGEMENT (appended v3.0)
// ============================================================
(function(){
  const STORE = "saffron_reservations_v1";
  function loadRes(){ try{ return JSON.parse(localStorage.getItem(STORE)) || []; } catch(e){ return []; } }
  function saveRes(d){ localStorage.setItem(STORE, JSON.stringify(d)); }

  const resSection = document.createElement("div");
  resSection.id = "admin-reservations";

  function renderResPanel(){
    const reservations = loadRes();
    // Merge with mock data if empty
    const mockData = [
      { id:"RV-2026-0184", name:"أحمد المنشاوي", phone:"01068300432", date:"2026-06-13", time:"8:30 م", guests:"4 ضيوف", area:"الصالة الداخلية", status:"pending", createdAt:new Date().toISOString() },
      { id:"RV-2026-0183", name:"سارة عبد العزيز", phone:"01012345678", date:"2026-06-13", time:"9:00 م", guests:"2 ضيف", area:"بجانب الشباك", status:"confirmed", createdAt:new Date().toISOString() },
      { id:"RV-2026-0182", name:"محمد الحسيني", phone:"01098765432", date:"2026-06-14", time:"9:30 م", guests:"6 ضيوف", area:"التراس الخارجي", status:"pending", createdAt:new Date().toISOString() },
    ];
    const allRes = [...reservations, ...(reservations.length === 0 ? mockData : [])];

    const statusMap = { pending:"بانتظار التأكيد", confirmed:"مؤكّد", cancelled:"ملغى" };
    const statusClass = { pending:"wait", confirmed:"ok", cancelled:"no" };

    resSection.innerHTML = `
      <div class="toolbar" style="margin-top:28px">
        <div>
          <h1 style="font-size:22px">إدارة الحجوزات 📅</h1>
          <div class="sub">إجمالي الحجوزات المسجلة: ${allRes.length}</div>
        </div>
        <div class="actions">
          <button class="btn btn-ghost btn-sm" id="admin-res-export">تصدير CSV ←</button>
          <button class="btn btn-gold btn-sm" id="admin-res-clear">مسح بيانات الاختبار</button>
        </div>
      </div>
      <div class="panel" style="margin-bottom:24px">
        <div class="panel-head">
          <h3>قائمة الحجوزات</h3>
          <div style="display:flex;gap:8px">
            <select id="res-filter-status" style="padding:6px 10px;border:1px solid var(--line);border-radius:8px;font-size:13px;background:#fff">
              <option value="all">الكل</option>
              <option value="pending">بانتظار التأكيد</option>
              <option value="confirmed">مؤكّدة</option>
              <option value="cancelled">ملغاة</option>
            </select>
          </div>
        </div>
        ${allRes.length === 0 ? `<p style="color:var(--muted);text-align:center;padding:32px">لا توجد حجوزات مسجلة بعد. سيظهر الحجوز هنا بعد تعبئة نموذج الحجز.</p>` : `
        <table class="tbl" id="res-table">
          <thead><tr><th>الرقم</th><th>الاسم</th><th>الهاتف</th><th>التاريخ</th><th>الوقت</th><th>الضيوف</th><th>المنطقة</th><th>الحالة</th><th></th></tr></thead>
          <tbody>
            ${allRes.map((r,idx) => `
              <tr data-idx="${idx}">
                <td style="font-family:var(--font-num);color:var(--burgundy);font-weight:600">${r.id}</td>
                <td style="font-weight:600">${r.name}</td>
                <td style="font-size:13px;color:var(--muted)">${r.phone||"—"}</td>
                <td>${r.date||"—"}</td>
                <td>${r.time||"—"}</td>
                <td>${r.guests||"—"}</td>
                <td style="color:var(--muted);font-size:13px">${r.area||"—"}</td>
                <td>
                  <select class="res-status-sel" data-idx="${idx}" style="padding:4px 8px;border:1px solid var(--line);border-radius:6px;font-size:12.5px;background:#fff">
                    <option value="pending" ${(r.status||"pending")==="pending"?"selected":""}>بانتظار</option>
                    <option value="confirmed" ${r.status==="confirmed"?"selected":""}>مؤكّد</option>
                    <option value="cancelled" ${r.status==="cancelled"?"selected":""}>ملغى</option>
                  </select>
                </td>
                <td style="text-align:end">
                  <button class="res-delete" data-idx="${idx}" style="color:#A8362F;font-size:12px;font-weight:600;padding:4px 8px;border:1px solid rgba(168,54,47,.2);border-radius:6px">حذف</button>
                </td>
              </tr>`).join("")}
          </tbody>
        </table>`}
      </div>
    `;

    const m = document.getElementById("admin-main");
    if(m){
      const existing = document.getElementById("admin-reservations");
      if(existing) existing.remove();
      m.appendChild(resSection);
    }

    // Wire events
    resSection.querySelectorAll(".res-status-sel").forEach(sel => {
      sel.addEventListener("change", () => {
        const idx = +sel.dataset.idx;
        const d = loadRes();
        if(d[idx]) d[idx].status = sel.value;
        saveRes(d);
        window.toast && window.toast("✓ تم تحديث حالة الحجز");
      });
    });
    resSection.querySelectorAll(".res-delete").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = +btn.dataset.idx;
        const d = loadRes();
        if(d[idx]){ d.splice(idx, 1); saveRes(d); renderResPanel(); window.toast && window.toast("تم حذف الحجز"); }
        else { renderResPanel(); window.toast && window.toast("حُدِّثت البيانات"); }
      });
    });
    const clearBtn = document.getElementById("admin-res-clear");
    if(clearBtn){
      clearBtn.addEventListener("click", () => {
        if(confirm("هل تريد مسح بيانات الاختبار؟")){ localStorage.removeItem("saffron_reservations_v1"); renderResPanel(); }
      });
    }
    const exportBtn = document.getElementById("admin-res-export");
    if(exportBtn){
      exportBtn.addEventListener("click", () => {
        const d = loadRes();
        if(!d.length){ window.toast && window.toast("لا توجد بيانات للتصدير"); return; }
        const headers = ["الرقم","الاسم","الهاتف","التاريخ","الوقت","الضيوف","المنطقة","الحالة","تاريخ الإنشاء"];
        const rows = d.map(r => [r.id,r.name,r.phone,r.date,r.time,r.guests,r.area,r.status,r.createdAt]);
        const csv = [headers,...rows].map(r => r.map(c => `"${(c||"").toString().replace(/"/g,'""')}"`).join(",")).join("\n");
        const blob = new Blob(["\uFEFF"+csv], {type:"text/csv;charset=utf-8"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "reservations.csv"; a.click();
        URL.revokeObjectURL(url);
      });
    }
  }

  // Run after DOM is ready
  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", renderResPanel);
  } else {
    setTimeout(renderResPanel, 200);
  }
})();
