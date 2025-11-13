// Feature flags
const ENABLE_CUSTOM_CURSOR = true; // enable custom cursor (optimized)
const ENABLE_PERF_LITE = true;    // reduce heavy effects (blur/animations) for smoother cursor/scroll
const ENABLE_HERO_PARALLAX = false; // disable pointer-driven parallax in hero to avoid lag
const ENABLE_HIER_INTRO = false;  // skip hierarchical intro animations for above-the-fold smoothness
// Keep updates in requestAnimationFrame to avoid event-rate DOM writes
const PINPOINT_DOT_IMMEDIATE = true; // dot snaps to pointer each frame (match native speed)

// Product data with brand and id (slug)
const products = [
  {id:'galaxy-a55', name:'Galaxy A55', price:300, category:'mobile', brand:'Samsung', image:'mobile/p1.jfif', popular:4, selling:5, offer:false},
  {id:'iphone-14', name:'iPhone 14', price:900, category:'mobile', brand:'Apple', image:'mobile/p2.jfif', popular:5, selling:4, offer:true},
  {id:'redmi-note-13', name:'Redmi Note 13', price:250, category:'mobile', brand:'Xiaomi', image:'mobile/p3.jfif', popular:3, selling:3, offer:true},
  {id:'oneplus-12', name:'OnePlus 12', price:700, category:'mobile', brand:'OnePlus', image:'mobile/p4.jfif', popular:4, selling:5, offer:false},
  {id:'pixel-8', name:'Pixel 8', price:650, category:'mobile', brand:'Google', image:'mobile/p5.jfif', popular:5, selling:4, offer:true},
  {id:'galaxy-buds', name:'Galaxy Buds', price:120, category:'airbuds', brand:'Samsung', image:'airbuds/a1.jfif'},
  {id:'airpods-pro', name:'AirPods Pro', price:200, category:'airbuds', brand:'Apple', image:'airbuds/a2.jfif'},
  {id:'redmi-airdots', name:'Redmi AirDots', price:50, category:'airbuds', brand:'Xiaomi', image:'airbuds/a3.jfif'},
  {id:'oneplus-buds-z2', name:'OnePlus Buds Z2', price:80, category:'airbuds', brand:'OnePlus', image:'airbuds/a4.jfif'},
  {id:'boat-airdopes', name:'Boat Airdopes', price:60, category:'airbuds', brand:'Boat', image:'airbuds/a5.jfif'},
  {id:'samsung-charger', name:'Samsung Charger', price:25, category:'charger', brand:'Samsung', image:'charger/c1.jfif'},
  {id:'apple-fast-charger', name:'Apple Fast Charger', price:35, category:'charger', brand:'Apple', image:'charger/c2.jfif'},
  {id:'mi-charger', name:'Mi Charger', price:20, category:'charger', brand:'Xiaomi', image:'charger/c3.jfif'},
  {id:'anker-charger', name:'Anker Charger', price:40, category:'charger', brand:'Anker', image:'charger/c4.jfif'},
  {id:'baseus-charger', name:'Baseus Charger', price:30, category:'charger', brand:'Baseus', image:'charger/c5.jfif'}
];

// Global offer discount rate (30% off). Adjust if needed. Made mutable so we can adjust at runtime if required.
let OFFER_DISCOUNT_RATE = 0.30;
function getEffectivePriceUSD(p){
  return p.offer ? +(p.price * (1 - OFFER_DISCOUNT_RATE)).toFixed(2) : p.price;
}

// Curated list of "best" mobiles to feature first (ordered)
const BEST_MOBILE_IDS = ['iphone-14','oneplus-12','pixel-8','galaxy-a55','redmi-note-13'];

// Currency/Language settings
const currencyConfig = {
  USD: { symbol: '$', rate: 1 },
  EUR: { symbol: '€', rate: 0.93 },
  GBP: { symbol: '£', rate: 0.81 },
  PKR: { symbol: '₨', rate: 278 },
  INR: { symbol: '₹', rate: 84 },
  JPY: { symbol: '¥', rate: 150 },
  CNY: { symbol: '¥', rate: 7.2 },
  AED: { symbol: 'د.إ', rate: 3.67 },
  CAD: { symbol: 'C$', rate: 1.37 },
  AUD: { symbol: 'A$', rate: 1.55 },
  SAR: { symbol: '﷼', rate: 3.75 }
};
let appSettings = {
  currency: localStorage.getItem('appCurrency') || 'USD',
  language: localStorage.getItem('appLanguage') || 'English'
};
function formatPrice(usd){
  const cfg = currencyConfig[appSettings.currency] || currencyConfig.USD;
  const v = usd * cfg.rate; // simple demo conversion
  return cfg.symbol + v.toFixed(0);
}

// Filtering, sorting, and search
const productGrid = document.getElementById('productGrid');
const filterCategory = document.getElementById('filterCategory');
const filterBrand = document.getElementById('filterBrand');
const filterPrice = document.getElementById('filterPrice');
const priceValue = document.getElementById('priceValue');
const sortSelect = document.getElementById('sortSelect');
const searchInput = document.querySelector('.search');
const filterReset = document.getElementById('filterReset');
const sortPillButtons = Array.from(document.querySelectorAll('.sort-pills .pill'));

let state = {
  category: 'all',
  brand: 'all',
  price: 1000,
  sort: 'default',
  search: ''
};

function renderProducts(){
  productGrid.innerHTML = '';
  let filtered = products.filter(p => {
    if(state.category !== 'all' && p.category !== state.category) return false;
    if(state.brand !== 'all' && p.brand !== state.brand) return false;
    if(getEffectivePriceUSD(p) > state.price) return false;
    if(state.search && !p.name.toLowerCase().includes(state.search.toLowerCase())) return false;
    return true;
  });
  if(state.sort === 'az') filtered.sort((a,b)=>a.name.localeCompare(b.name));
  if(state.sort === 'lowhigh') filtered.sort((a,b)=>getEffectivePriceUSD(a)-getEffectivePriceUSD(b));
  if(state.sort === 'highlow') filtered.sort((a,b)=>getEffectivePriceUSD(b)-getEffectivePriceUSD(a));
  if(state.sort === 'popular') filtered.sort((a,b)=>getEffectivePriceUSD(b)-getEffectivePriceUSD(a));

  // Use fm-card template for exact parity with Featured Mobiles
  const shopTemplate = document.getElementById('shopFmCardTemplate') || document.getElementById('fmCardTemplate');
  filtered.forEach((p,i) =>{
    if(!shopTemplate){ return; }
    const eff = getEffectivePriceUSD(p);
    const node = shopTemplate.content.firstElementChild.cloneNode(true);
    node.setAttribute('data-id', p.id);
    // Defensive inline sizing to ensure row integrity even if CSS cache misses
    try{ node.style.flex = '0 0 260px'; node.style.minWidth = '260px'; }catch{}
    // Media + badge
    const media = node.querySelector('.fm-media');
    const img = media.querySelector('img');
    const badge = media.querySelector('.fm-badge-offer');
    const href = `product.html?id=${p.id}`;
    media.setAttribute('href', href);
    img.src = p.image; img.alt = p.name;
    if(p.offer){ badge.hidden = false; }
    // Info/name/brand
    const nameLink = node.querySelector('.fm-name a');
    nameLink.textContent = p.name; nameLink.href = href;
    const brandEl = node.querySelector('.fm-brand');
    if(brandEl){ brandEl.textContent = p.brand; }
    // Price
    const oldEl = node.querySelector('.fm-price-old');
    const newEl = node.querySelector('.fm-price-new');
    if(p.offer){ if(oldEl){ oldEl.textContent = formatPrice(p.price); oldEl.hidden = false; } if(newEl){ newEl.textContent = formatPrice(eff); } }
    else { if(oldEl){ oldEl.hidden = true; } if(newEl){ newEl.textContent = formatPrice(eff); } }
    // Actions
    const viewBtn = node.querySelector('.fm-view');
    const addBtn = node.querySelector('.fm-add');
    if(viewBtn){ viewBtn.addEventListener('click', ()=>{ window.location.href = href; }); }
    if(addBtn){ addBtn.addEventListener('click', ()=> addToCart(p.id)); }
    // Animation parity
    node.classList.add('reveal-up');
    node.style.setProperty('--delay', (i*0.03)+'s');
    productGrid.appendChild(node);
  });
}

// cart
let cart = [];
function addToCart(id){
  const p = products.find(x=>x.id===id);
  if(!p) return;
  const found = cart.find(i=>i.id===id);
  const eff = getEffectivePriceUSD(p);
  if(found) found.qty++;
  else cart.push({id, name:p.name, price:eff, qty:1, img:p.image});
  saveCart();
  // Friendly toast
  try{ notifySuccess(`${p.name} added to cart`); }catch{}
}
function saveCart(){
  localStorage.setItem('kcart', JSON.stringify(cart));
  updateCartCount();
  renderCartItems();
}
function loadCart(){ cart = JSON.parse(localStorage.getItem('kcart')||'[]'); updateCartCount(); }
// After load, normalize any legacy cart item prices to current effective price
try{
  cart.forEach(it=>{
    const prod = products.find(p=>p.id===it.id);
    if(prod){ it.price = getEffectivePriceUSD(prod); }
  });
}catch{}
function updateCartCount(){ document.getElementById('cartCount').textContent = cart.reduce((s,i)=>s+i.qty,0); }

// render cart
function renderCartItems(){
  const container = document.getElementById('cartItems'); container.innerHTML='';
  // Ensure an Empty Cart button exists under the total section
  try{
    const panel = document.getElementById('cartPanel');
    if(panel && !panel.querySelector('#emptyCartBtn')){
      const totalRow = panel.querySelector('.cart-total');
      const btn = document.createElement('button');
      btn.id = 'emptyCartBtn';
      btn.className = 'btn';
      btn.textContent = 'Empty Cart';
      btn.style.cssText = 'margin-top:8px; width:100%; background:#fff; color:var(--primary); border:1px solid var(--primary); border-radius:10px; padding:10px 12px; font-weight:800;';
      totalRow && totalRow.insertAdjacentElement('afterend', btn);
      btn.addEventListener('click', ()=>{ cart = []; saveCart(); renderCartItems(); });
    }
  }catch{}

  if(!cart.length){ container.innerHTML='<p style="margin:8px 0; color:#6b7280; font-weight:700;">Your cart is empty</p>'; }
  let total=0;
  cart.forEach(item=>{
    const prod = products.find(p=>p.id===item.id) || { price: item.price || 0, offer:false };
    const unit = getEffectivePriceUSD(prod);
    total += unit*item.qty;
    const el = document.createElement('div'); el.className='cart-item';
    el.innerHTML = `
      <img src="${item.img}" alt="${item.name}">
      <div style="flex:1; min-width:0;">
        <strong style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.name}</strong>
        <div>${prod.offer ? `<span class="price-old">${formatPrice(prod.price)}</span> <span class="price-new">${formatPrice(unit)}</span>` : `${formatPrice(unit)}`}</div>
      </div>
      <div class="si-qty" style="display:inline-flex; align-items:center; gap:6px;">
        <button class="si-minus" data-id="${item.id}" aria-label="Decrease" style="width:28px; height:28px; border:1px solid #e5e7eb; border-radius:6px; background:#fff; font-weight:800;">−</button>
        <input type="number" min="1" value="${item.qty}" data-id="${item.id}" style="width:56px; text-align:center; border:1px solid #e5e7eb; border-radius:8px; padding:6px 6px; font-weight:700;">
        <button class="si-plus" data-id="${item.id}" aria-label="Increase" style="width:28px; height:28px; border:1px solid #e5e7eb; border-radius:6px; background:#fff; font-weight:800;">+</button>
      </div>
      <button class="si-remove" data-id="${item.id}" aria-label="Remove" style="width:28px; height:28px; border:1px solid #f1f5f9; border-radius:6px; background:#fff; font-weight:800; color:#ef4444;">×</button>
    `;
    container.appendChild(el);
  });
  const cfg = currencyConfig[appSettings.currency] || currencyConfig.USD;
  document.getElementById('cartTotal').textContent = (cfg.symbol) + (total * cfg.rate).toFixed(0);

  // Delegated events for plus/minus/remove and qty input
  container.addEventListener('click', onCartPanelClicks, { once:true });
  function onCartPanelClicks(ev){
    const plus = ev.target.closest('.si-plus');
    const minus = ev.target.closest('.si-minus');
    const rem = ev.target.closest('.si-remove');
    if(plus){ addToCart(plus.dataset.id); renderCartItems(); return; }
    if(minus){
      const id = minus.dataset.id; const it = cart.find(i=>i.id===id); if(!it) return;
      it.qty -= 1; if(it.qty<=0){ cart = cart.filter(i=> i.id!==id); }
      saveCart(); renderCartItems(); return;
    }
    if(rem){ cart = cart.filter(i=> i.id!==rem.dataset.id); saveCart(); renderCartItems(); return; }
  }
  container.querySelectorAll('input[type="number"]').forEach(inp=>{
    inp.addEventListener('change', (e)=>{
      const id = e.target.dataset.id; let v = Number(e.target.value);
      if(v<=0){ cart = cart.filter(i=>i.id!==id); } else { const it = cart.find(i=>i.id===id); if(it) it.qty = v; }
      saveCart(); renderCartItems();
    });
  });
}
// UI handlers
const cartBtn = document.getElementById('cartBtn'); const cartPanel = document.getElementById('cartPanel'); const overlay = document.getElementById('overlay'); const closeCart = document.getElementById('closeCart');
if(cartBtn && cartPanel && overlay && closeCart){
  cartBtn.addEventListener('click', ()=>{ cartPanel.classList.add('open'); overlay.classList.remove('hidden'); overlay.style.display='block'; cartPanel.setAttribute('aria-hidden','false'); });
  closeCart.addEventListener('click', ()=>{ cartPanel.classList.remove('open'); overlay.classList.add('hidden'); overlay.style.display='none'; cartPanel.setAttribute('aria-hidden','true'); });
  overlay.addEventListener('click', ()=>{ closeCart.click(); });
}

// delegate add buttons
if(productGrid){
  productGrid.addEventListener('click', (e)=>{
    const addBtn = e.target.closest('button.add, .fm-add');
    if(!addBtn) return;
    const id = addBtn.dataset.id;
    if(!id){
      // fm-add doesn't carry data-id; infer from closest fm-card
      const card = addBtn.closest('.fm-card');
      if(card){ addToCart(card.getAttribute('data-id')); }
      return;
    }
    addToCart(id);
  });
}

// Mobile nav toggle
const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.getElementById('siteNav');
function closeMobileNav(){
  if(!siteNav) return;
  siteNav.classList.remove('open');
  if(menuToggle){ menuToggle.setAttribute('aria-expanded','false'); }
  document.body.classList.remove('nav-open');
  const bd = document.getElementById('navBackdrop');
  if(bd) bd.remove();
}
function ensureNavBackdrop(){
  let el = document.getElementById('navBackdrop');
  if(!el){
    el = document.createElement('div');
    el.id = 'navBackdrop';
    el.className = 'nav-backdrop';
    el.addEventListener('click', closeMobileNav);
    document.body.appendChild(el);
  }
  return el;
}
if(menuToggle && siteNav){
  menuToggle.addEventListener('click', (e)=>{
    e.stopPropagation();
    const isOpen = siteNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    if(isOpen){ document.body.classList.add('nav-open'); ensureNavBackdrop(); }
    else { closeMobileNav(); }
  });
  // Close menu when clicking outside on mobile
  document.addEventListener('click', (e)=>{
    if(!siteNav.classList.contains('open')) return;
    if(e.target.closest('#siteNav') || e.target.closest('.menu-toggle')) return;
    closeMobileNav();
  });
  // Close when a nav link is clicked (for same-page anchors or navigation)
  siteNav.addEventListener('click', (e)=>{
    const a = e.target.closest('a');
    if(a){ closeMobileNav(); }
  });
  // Close on Escape
  document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') closeMobileNav(); });
  // Close on resize back to desktop
  window.addEventListener('resize', ()=>{
    if(window.innerWidth > 900 && siteNav.classList.contains('open')){
      closeMobileNav();
    }
  });
}

// Dropdown menus (Pages/Shop/Blog) similar to demo
(function dropdowns(){
  const dropdownEls = Array.from(document.querySelectorAll('.dropdown'));
  if(!dropdownEls.length) return;
  const isHoverDevice = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Close all helper
  const closeAll = ()=> dropdownEls.forEach(d=> d.classList.remove('open'));

  dropdownEls.forEach(d => {
    const toggle = d.querySelector('.dropdown-toggle');
    const menu = d.querySelector('.dropdown-menu');
    if(!toggle || !menu) return;

    // Click toggle (works on mobile and desktop)
    toggle.addEventListener('click', (e)=>{
      e.stopPropagation();
      const willOpen = !d.classList.contains('open');
      closeAll();
      if(willOpen){ d.classList.add('open'); toggle.setAttribute('aria-expanded','true'); }
      else { d.classList.remove('open'); toggle.setAttribute('aria-expanded','false'); }
    });

    // Hover open for desktop
    if(isHoverDevice){
      d.addEventListener('mouseenter', ()=>{ d.classList.add('open'); toggle.setAttribute('aria-expanded','true'); });
      d.addEventListener('mouseleave', ()=>{ d.classList.remove('open'); toggle.setAttribute('aria-expanded','false'); });
    }
  });

  // Click outside and Escape to close
  document.addEventListener('click', (e)=>{
    if(!e.target.closest('.dropdown')) closeAll();
  });
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape') closeAll();
  });
})();

// Product detail page rendering
const productDetail = document.getElementById('productDetail');
if(productDetail){
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const p = products.find(x=>x.id===id) || products[0];
  productDetail.innerHTML = `
    <div class="pd-gallery">
      <div class="pd-media">
        <img src="${p.image}" alt="${p.name}">
        <span class="pd-shadow" aria-hidden="true"></span>
      </div>
      <!-- thumbnails will be injected here -->
    </div>
    <div class="pd-info">
      <div class="pd-eyebrow">${p.category || 'Product'}</div>
      <h1>${p.name}</h1>
      <div class="brand">${p.brand}</div>
      <div class="pd-rating" aria-label="Product rating">
        <span class="stars" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
          <svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
          <svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
          <svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
          <svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
        </span>
        <span>4.9 • 112 reviews</span>
      </div>
  <div class="pd-price-badge">${p.offer ? `<span class="price-old">${formatPrice(p.price)}</span> <span class="price-new">${formatPrice(getEffectivePriceUSD(p))}</span>` : `${formatPrice(p.price)}`}</div>
      <p class="pd-desc">Quality electronics at the best price. Experience performance and reliability designed for everyday use.</p>
      <ul class="pd-features">
        <li>Genuine brand warranty</li>
        <li>Fast delivery</li>
        <li>Easy returns</li>
        <li>Secure payments</li>
      </ul>
      <div class="pd-meta">
        <span class="meta-chip">Brand: ${p.brand}</span>
        <span class="meta-chip">Category: ${p.category}</span>
      </div>
      <div class="pd-qty">
        <label for="qty">Qty</label>
        <div class="pd-stepper" role="group" aria-label="Quantity selector">
          <button type="button" class="pd-minus" aria-label="Decrease quantity">−</button>
          <input id="qty" type="number" min="1" value="1" aria-live="polite">
          <button type="button" class="pd-plus" aria-label="Increase quantity">+</button>
        </div>
      </div>
      <div class="pd-actions">
        <button class="add-cart-btn" data-id="${p.id}">Add to Cart</button>
        <a href="checkout.html" class="buy-now-btn">Buy Now</a>
      </div>
      <div class="pd-trust" aria-label="Trust badges">
        <div class="trust-item"><div class="trust-icon">🔒</div> Secure checkout</div>
        <div class="trust-item"><div class="trust-icon">⚡</div> Fast shipping</div>
        <div class="trust-item"><div class="trust-icon">✅</div> Original product</div>
      </div>
    </div>`;
  // Quantity stepper and Add to Cart
  const qtyInput = productDetail.querySelector('#qty');
  const minus = productDetail.querySelector('.pd-minus');
  const plus = productDetail.querySelector('.pd-plus');
  minus.addEventListener('click', ()=>{ const v=Math.max(1, (parseInt(qtyInput.value)||1)-1); qtyInput.value=v; });
  plus.addEventListener('click', ()=>{ const v=(parseInt(qtyInput.value)||1)+1; qtyInput.value=v; });
  const addBtn = productDetail.querySelector('.add-cart-btn');
  addBtn.addEventListener('click', ()=>{
    const q = Number(qtyInput.value)||1;
    for(let i=0;i<q;i++) addToCart(p.id);
    notifySuccess('Added to cart');
  });

  // Build a simple image gallery with thumbnails based on category pool
  try{
    const pools = {
      mobile: ['mobile/p1.jfif','mobile/p2.jfif','mobile/p3.jfif','mobile/p4.jfif','mobile/p5.jfif'],
      airbuds: ['airbuds/a1.jfif','airbuds/a2.jfif','airbuds/a3.jfif','airbuds/a4.jfif','airbuds/a5.jfif'],
      charger: ['charger/c1.jfif','charger/c2.jfif','charger/c3.jfif','charger/c4.jfif','charger/c5.jfif']
    };
    const pool = pools[p.category] || [p.image];
    const imgs = [p.image, ...pool.filter(src=> src !== p.image)].slice(0,5);
    const media = productDetail.querySelector('.pd-media');
    const gallery = productDetail.querySelector('.pd-gallery');
    const mainImg = media.querySelector('img');
    const thumbs = document.createElement('div'); thumbs.className = 'pd-thumbs';
    imgs.forEach((src, i)=>{
      const t = document.createElement('div'); t.className = 'pd-thumb' + (i===0 ? ' active' : '');
      const im = document.createElement('img'); im.src = src; im.alt = p.name + ' thumbnail';
      t.appendChild(im);
      t.addEventListener('click', ()=>{
        if(mainImg.getAttribute('src') === src) return;
        // Fade-out, preload, then swap and fade-in
        try{ mainImg.style.transition = 'opacity .22s ease'; }catch{}
        mainImg.style.opacity = '0';
        const pre = new Image();
        pre.onload = ()=>{
          mainImg.src = src;
          requestAnimationFrame(()=>{ mainImg.style.opacity = '1'; });
        };
        pre.onerror = ()=>{ mainImg.style.opacity = '1'; };
        pre.src = src;
        thumbs.querySelectorAll('.pd-thumb').forEach(el=> el.classList.remove('active'));
        t.classList.add('active');
      });
      thumbs.appendChild(t);
    });
    if(gallery) gallery.appendChild(thumbs);
  }catch{}

  // Populate product tabs content
  try{
    const desc = document.getElementById('pd-desc');
    const info = document.getElementById('pd-info');
    const reviews = document.getElementById('pd-reviews');
    if(desc){
      desc.innerHTML = `<p style="margin:0 0 10px; color:#4b5563;">${p.name} by <strong>${p.brand}</strong> delivers dependable performance, great build quality, and value for money. Perfect for daily use, entertainment, and productivity.</p>
      <ul style="margin:8px 0 0 18px; color:#4b5563; line-height:1.6;">
        <li>Original brand warranty</li>
        <li>Secure checkout and fast shipping</li>
        <li>Hassle-free returns</li>
      </ul>`;
    }
    if(info){
      const eff = getEffectivePriceUSD(p);
      info.innerHTML = `
        <div style="display:grid; grid-template-columns:160px 1fr; gap:10px;">
          <div><strong>Brand</strong></div><div>${p.brand}</div>
          <div><strong>Category</strong></div><div>${p.category}</div>
          <div><strong>Model ID</strong></div><div>${p.id}</div>
          <div><strong>Price</strong></div><div>${p.offer ? `<span class="price-old">${formatPrice(p.price)}</span> <span class="price-new">${formatPrice(eff)}</span>` : `${formatPrice(eff)}`}</div>
          <div><strong>Warranty</strong></div><div>1 Year Brand Warranty</div>
        </div>`;
    }
    if(reviews){
      reviews.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:12px;">
          <div style="background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:12px;">
            <strong>Ali</strong> <span style="color:#f59e0b">★★★★★</span>
            <p style="margin:6px 0 0; color:#4b5563;">Great product for the price. Delivery was quick and packaging was neat.</p>
          </div>
          <p style="color:#6b7280; font-weight:700; margin:0;">More reviews coming soon.</p>
        </div>`;
    }
    const tabButtons = Array.from(document.querySelectorAll('.pd-tab'));
    const panels = { desc: document.getElementById('pd-desc'), info: document.getElementById('pd-info'), reviews: document.getElementById('pd-reviews') };
    const activate = (key)=>{
      tabButtons.forEach(b=>{ const on = (b.dataset.tab===key); b.classList.toggle('active', on); b.setAttribute('aria-selected', on?'true':'false'); });
      Object.entries(panels).forEach(([k,el])=>{ if(!el) return; if(k===key){ el.hidden = false; } else { el.hidden = true; } });
    };
    tabButtons.forEach(btn=> btn.addEventListener('click', ()=> activate(btn.dataset.tab)));
    activate('desc');
  }catch{}

  // Related products
  function renderRelated(){
    try{
      const grid = document.getElementById('relatedGrid');
      const tpl = document.getElementById('relCardTemplate');
      if(!grid || !tpl) return;
      grid.innerHTML = '';
      const list = products.filter(x=> x.category===p.category && x.id!==p.id).slice(0,6);
      list.forEach((item, i)=>{
        const node = tpl.content.firstElementChild.cloneNode(true);
        node.setAttribute('data-id', item.id);
        const media = node.querySelector('.fm-media');
        const img = media.querySelector('img');
        const offerBadge = media.querySelector('.fm-badge-offer');
        const href = `product.html?id=${item.id}`;
        media.setAttribute('href', href); img.src = item.image; img.alt = item.name;
        if(item.offer){ offerBadge.hidden = false; }
        // Info
        node.querySelector('.fm-name a').textContent = item.name;
        node.querySelector('.fm-name a').href = href;
        const brandEl = node.querySelector('.fm-brand'); if(brandEl) brandEl.textContent = item.brand;
        const eff = getEffectivePriceUSD(item);
        const oldEl = node.querySelector('.fm-price-old');
        const newEl = node.querySelector('.fm-price-new');
        if(item.offer){ if(oldEl){ oldEl.textContent = formatPrice(item.price); oldEl.hidden = false; } if(newEl){ newEl.textContent = formatPrice(eff); } }
        else { if(oldEl){ oldEl.hidden = true; } if(newEl){ newEl.textContent = formatPrice(eff); } }
        // Actions
        const viewBtn = node.querySelector('.fm-view'); if(viewBtn){ viewBtn.addEventListener('click', ()=>{ window.location.href = href; }); }
        const addBtn = node.querySelector('.fm-add'); if(addBtn){ addBtn.addEventListener('click', ()=> addToCart(item.id)); }
        // Reveal animation
        node.classList.add('reveal-up'); node.style.setProperty('--delay', (i*0.04)+'s');
        grid.appendChild(node);
      });
      try{ document.dispatchEvent(new Event('cards-added')); }catch{}
    }catch{}
  }
  renderRelated();
  // Expose for currency refresh
  window.renderRelated = renderRelated;
}

// Sidebar filter handlers
if(filterCategory) filterCategory.addEventListener('change', e=>{ state.category = e.target.value; renderProducts(); });
if(filterBrand) filterBrand.addEventListener('change', e=>{ state.brand = e.target.value; renderProducts(); });
// Price range is handled in modernShopFilters for the shop page to avoid duplicate listeners
if(sortSelect) sortSelect.addEventListener('change', e=>{ state.sort = e.target.value; updateSortPills && updateSortPills(); renderProducts(); });
if(searchInput) searchInput.addEventListener('input', e=>{ state.search = e.target.value; renderProducts(); });

// Reset filters
if(filterReset){
  filterReset.addEventListener('click', ()=>{
    state = { category:'all', brand:'all', price:1000, sort:'default', search:'' };
    if(filterCategory) filterCategory.value = 'all';
    if(filterBrand) filterBrand.value = 'all';
    if(filterPrice) filterPrice.value = 1000;
  if(priceValue) priceValue.textContent = formatPrice(1000);
    if(sortSelect) sortSelect.value = 'default';
    if(searchInput) searchInput.value = '';
    updateSortPills();
    if(productGrid) renderProducts();
  });
}

// Sort pills interactions
function updateSortPills(){
  if(!sortPillButtons.length) return;
  sortPillButtons.forEach(btn=>{
    const isActive = btn.dataset.sort === state.sort;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}
if(sortPillButtons.length){
  sortPillButtons.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const value = btn.dataset.sort;
      if(!value) return;
      state.sort = value;
      if(sortSelect) sortSelect.value = value;
      updateSortPills();
      renderProducts();
    });
  });
  // Initialize state on load
  updateSortPills();
}

// Initialize from URL before first render (so shop can open filtered)
(function initFromUrl(){
  try{
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('cat');
    if(cat){ state.category = cat; }
    // Shop layout controls: grid / left / right
    const layout = params.get('layout');
    if(layout){
      const body = document.body;
      body.classList.remove('shop-layout-grid','shop-layout-right');
      if(layout === 'grid') body.classList.add('shop-layout-grid');
      if(layout === 'right') body.classList.add('shop-layout-right');
      // 'left' is the default layout; no class needed
      // Ensure the compact filters toolbar only appears in grid layout
      const toolbar = document.querySelector('.filters-toolbar');
      if(toolbar){
        const isGrid = body.classList.contains('shop-layout-grid');
        toolbar.style.display = isGrid ? 'block' : 'none';
        toolbar.setAttribute('aria-hidden', isGrid ? 'false' : 'true');
      }
    }
    // If cart=open is present, open the cart panel on load
    const cartOpen = params.get('cart');
    if(cartOpen === 'open'){
      setTimeout(()=>{ try{ if(cartPanel && overlay){ cartPanel.classList.add('open'); overlay.classList.remove('hidden'); overlay.style.display='block'; cartPanel.setAttribute('aria-hidden','false'); } }catch{} }, 0);
    }
  }catch{ /* no-op */ }
})();

// init
loadCart(); if(productGrid) renderProducts(); renderCartItems();

// Enable performance-lite mode on home page (reduces blur/animations above the fold)
(function enablePerfLite(){
  try{
    if(!ENABLE_PERF_LITE) return;
    if(document.body.classList.contains('home')){
      document.body.classList.add('perf-lite');
    }
  }catch{}
})();

// Custom cursor (dot + ring) for non-touch devices
(function initCustomCursor(){
  if(!ENABLE_CUSTOM_CURSOR) return; // bail out if disabled
  try{
    const supportsHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if(!supportsHover) return;
    if(document.querySelector('.cursor-dot') || document.querySelector('.cursor-ring')) return;

    const dot = document.createElement('div'); dot.className = 'cursor-dot';
    const ring = document.createElement('div'); ring.className = 'cursor-ring';
    document.body.appendChild(dot); document.body.appendChild(ring);
    document.body.classList.add('custom-cursor');

    // target mouse position
    let mx = -100, my = -100;
    // rendered positions
  let dx = -100, dy = -100; // smoothed dot position
  let rx = -100, ry = -100; // ring position (trails)
  // Dynamic easing: ramps up with distance for speed while keeping close-in motion silky
  const DOT_BASE = 0.32;   // base ease for dot (higher = faster)
  // Make the ring catch up faster while keeping a slight trail
  const RING_BASE = 0.34;  // increased base for snappier follow
    // When true, ring snaps to pointer like the native cursor
    const INSTANT_RING = true;
    let rafId = null;

    // pointer tracking (passive, store coords only)
    const onMove = (e)=>{ mx = e.clientX; my = e.clientY; };
    // Use a single event to avoid double-firing on some browsers
    document.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('mouseleave', ()=>{ document.body.classList.add('cursor-hidden'); });
    document.addEventListener('mouseenter', ()=>{ document.body.classList.remove('cursor-hidden'); });

    function frame(){
      // dot: smooth follow with distance-based ramp for fast-but-smooth feel (all in RAF)
      const ddx = (mx - dx), ddy = (my - dy);
      const dd = Math.hypot(ddx, ddy);
      // Ramp ease up when far, cap to avoid overshoot
      const dotEase = Math.min(0.60, DOT_BASE + (dd / 110) * 0.28);
      dx = PINPOINT_DOT_IMMEDIATE ? mx : (dx + ddx * dotEase);
      dy = PINPOINT_DOT_IMMEDIATE ? my : (dy + ddy * dotEase);
      dot.style.transform = `translate3d(${dx}px, ${dy}px, 0) translate(-50%, -50%)`;
      // ring: follow policy — instant when matching native speed
      if(INSTANT_RING){
        rx = mx; ry = my;
      } else {
        const distX = mx - rx, distY = my - ry;
        const dist = Math.hypot(distX, distY);
        if(dist < 0.2){
          rx = mx; ry = my;
        } else {
          // Ramp ring ease with distance but keep it slightly slower than the dot
          const ringEase = Math.min(0.50, RING_BASE + (dist / 140) * 0.28);
          rx += distX * ringEase;
          ry += distY * ringEase;
        }
      }

      // translate3d to trigger GPU acceleration; avoid layout reads
      const rScale = ringHover ? 1.28 : 1;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%) scale(${rScale})`;
      rafId = requestAnimationFrame(frame);
    }
    rafId = requestAnimationFrame(frame);

    const interactive = 'a, button, .nav-link, .card .btn, .card .add, .hero-btn, .cart-btn, .checkout-btn, input, select, .menu-toggle';
    let ringHover = false;
    document.addEventListener('mouseover', (e)=>{
      const over = !!e.target.closest(interactive);
      ringHover = over;
      if(over) ring.classList.add('hover'); else ring.classList.remove('hover');
    });
    document.addEventListener('mousedown', ()=>{ ring.classList.add('down'); });
    document.addEventListener('mouseup', ()=>{ ring.classList.remove('down'); });

    // Cleanup on navigation (SPA-friendly)
    window.addEventListener('beforeunload', ()=>{ try{ cancelAnimationFrame(rafId); }catch{} });
  }catch(err){ /* no-op */ }
})();

// Make topbar "Buy now" open the Shop Grid in the same tab
document.addEventListener('click', (e)=>{
  const cta = e.target.closest && e.target.closest('.market-cta');
  if(!cta) return;
  e.preventDefault();
  const isShop = /\/shop\.html$/i.test(location.pathname);
  if(isShop){
    // Ensure grid layout and scroll into view
    try{
      document.body.classList.add('shop-layout-grid');
      const toolbar = document.querySelector('.filters-toolbar');
      if(toolbar) toolbar.style.display = 'block';
      const grid = document.getElementById('productGrid');
      if(grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }catch{}
  } else {
    // Navigate to Shop Grid in same tab
    window.location.href = 'shop.html?layout=grid';
  }
});

// Open cart from any link with data-open-cart
document.addEventListener('click', (e)=>{
  const link = e.target.closest('a[data-open-cart]');
  if(!link) return;
  e.preventDefault();
  if(cartPanel && overlay){
    cartPanel.classList.add('open');
    overlay.classList.remove('hidden');
    overlay.style.display = 'block';
    cartPanel.setAttribute('aria-hidden','false');
  } else {
    // Fallback: navigate to shop and request cart open
    window.location.href = 'shop.html?cart=open';
  }
});

// Swap banner image to first available local candidate or a data-src attribute
(function trySwapBanner(){
  const bannerImg = document.getElementById('bannerImg');
  if(!bannerImg) return;
  const given = bannerImg.getAttribute('data-src');
  const candidates = [
    given,
    'assets/banner-phones.jpg',
    'assets/banner.jpg',
    'assets/banner.jfif',
    'images/banner-phones.jpg',
    'images/banner.jpg',
    'images/banner.jfif',
    'banner-phones.jpg',
    'banner.jpg',
    'banner.jfif'
  ].filter(Boolean);
  if(!candidates.length) return;
  const tryNext = (i)=>{
    if(i>=candidates.length) return;
    const url = candidates[i];
    const test = new Image();
    test.onload = ()=>{ bannerImg.src = url; bannerImg.alt = 'Latest phones banner'; };
    test.onerror = ()=> tryNext(i+1);
    test.src = url + '?v=' + Date.now();
  };
  tryNext(0);
})();

// Header shrink on scroll
(function headerScroll(){
  const header = document.querySelector('.header');
  if(!header) return;
  const onScroll = ()=>{
    if(window.scrollY > 4) header.classList.add('scrolled'); else header.classList.remove('scrolled');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
})();

// Reveal animations using IntersectionObserver
(function revealOnScroll(){
  const revealEls = Array.from(document.querySelectorAll('.reveal-up, .reveal-right'));
  if(!revealEls.length) return;
  const runObserver = ()=>{
    if(!('IntersectionObserver' in window)) return revealEls.forEach(el=> el.classList.add('in'));
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){ entry.target.classList.add('in'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el=> io.observe(el));
  };
  // If hierarchical intro is active, delay attaching observer until it signals done
  if(window.__hierIntroActive){
    document.addEventListener('hier-intro-done', runObserver, { once:true });
  } else {
    runObserver();
  }
})();

// Enhance product cards: add reveal class after render
function markCardsForReveal(){
  if(!productGrid) return;
  productGrid.querySelectorAll('.card, .fm-card').forEach((card, i)=>{
    card.classList.add('reveal-up');
    card.style.setProperty('--delay', (i * 0.03).toFixed(2)+'s');
  });
  // Trigger observer for newly added elements
  const event = new Event('cards-added');
  document.dispatchEvent(event);
}

// Hook into renderProducts to also mark cards
const _renderProducts = renderProducts;
renderProducts = function(){
  _renderProducts();
  markCardsForReveal();
};

// Re-run observer when new cards land
document.addEventListener('cards-added', ()=>{
  const revealEls = Array.from(document.querySelectorAll('.reveal-up:not(.in), .reveal-right:not(.in)'));
  if(!('IntersectionObserver' in window) || !revealEls.length) return revealEls.forEach(el=>el.classList.add('in'));
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{ if(entry.isIntersecting){ entry.target.classList.add('in'); io.unobserve(entry.target); } });
  }, { threshold: 0.12 });
  revealEls.forEach(el=> io.observe(el));
});

// Subtle parallax/tilt on hero image
// Optimized: cache rects, throttle with RAF, and use translate3d
(function heroParallax(){
  if(!ENABLE_HERO_PARALLAX) return; // hard-disable to eliminate pointer-driven jank in top section
  const hero = document.querySelector('.hero');
  const img = document.querySelector('.hero-img img');
  if(!hero || !img) return;

  let rect = hero.getBoundingClientRect();
  let targetX = 0, targetY = 0; // -0.5..0.5
  let tx = 0, ty = 0; // px
  let raf = null, needsUpdate = false;

  const recalc = ()=>{ rect = hero.getBoundingClientRect(); };
  const onMove = (e)=>{
    if(!rect.width || !rect.height) return;
    targetX = (e.clientX - rect.left) / rect.width - 0.5;
    targetY = (e.clientY - rect.top) / rect.height - 0.5;
    needsUpdate = true;
    if(!raf) raf = requestAnimationFrame(step);
  };
  const step = ()=>{
    // small easing toward target to keep it silky
    const max = 8; // max px translate
    const destX = targetX * max;
    const destY = targetY * max;
    tx += (destX - tx) * 0.16;
    ty += (destY - ty) * 0.16;
    img.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
    if(needsUpdate && (Math.abs(destX - tx) > 0.1 || Math.abs(destY - ty) > 0.1)){
      raf = requestAnimationFrame(step);
    } else { raf = null; needsUpdate = false; }
  };

  hero.addEventListener('pointermove', onMove, { passive: true });
  hero.addEventListener('mouseleave', ()=>{
    targetX = targetY = 0; needsUpdate = true; if(!raf) raf = requestAnimationFrame(step);
  });
  window.addEventListener('resize', recalc);
  window.addEventListener('scroll', recalc, { passive:true });
})();

// Hierarchical initial load animation (home page only)
(function hierarchicalIntro(){
  if(!document.body.classList.contains('home')) return; // only on landing page
  if(!ENABLE_HIER_INTRO) return; // disabled for smoother initial interaction
  // Avoid re-run if navigation cached
  if(window.__hierIntroRan) return;
  window.__hierIntroRan = true;
  window.__hierIntroActive = true;

  const sequence = [];
  // Define groups in display order (top hero -> mosaic -> marquee -> spotlight -> benefits -> trust -> chooser -> featured -> editorial -> newsletter -> tabs -> stats -> testimonials -> faq)
  const pushGroup = sel => {
    const nodes = Array.from(document.querySelectorAll(sel)).filter(n=> !n.classList.contains('in'));
    if(nodes.length) sequence.push(nodes);
  };
  pushGroup('.hero-badge, .hero-headline, .hero-sub, .hero-feature-list, .hero-cta-row, .hero-stats');
  pushGroup('.hero-media');
  pushGroup('.hero-side-cards .hero-highlight');
  pushGroup('.mosaic .tile');
  // New short about section
  pushGroup('.about-mini');
  pushGroup('.brand-marquee');
  pushGroup('.spotlight .spot-card');
  pushGroup('.benefits .benefit');
  pushGroup('.trust-logos');
  pushGroup('.featured .card');
  pushGroup('.collab');
  pushGroup('.newsletter');
  pushGroup('.tabs-section');
  // New product image slider before footer
  pushGroup('.product-slider');
  pushGroup('.stats .stat-card');
  pushGroup('.testimonials');
  pushGroup('.faq details');

  // Slow global duration for intro, revert later
  document.documentElement.style.setProperty('--reveal-dur', '1.05s');

  const BASE_DELAY = 90; // ms between groups
  const STAGGER_IN_GROUP = 70; // ms between elements in the same group
  let groupIndex = 0;

  const applyGroup = (els, startDelayMs)=>{
    els.forEach((el,i)=>{
      // assign delay via CSS var for smooth transition
      el.style.setProperty('--delay', ((startDelayMs + i*STAGGER_IN_GROUP)/1000).toFixed(2)+'s');
      requestAnimationFrame(()=> el.classList.add('in'));
    });
  };

  const runNext = ()=>{
    if(groupIndex >= sequence.length){
      // cleanup: remove custom reveal duration after a short grace period
      setTimeout(()=>{
        document.documentElement.style.removeProperty('--reveal-dur');
        window.__hierIntroActive = false;
        document.dispatchEvent(new Event('hier-intro-done'));
      }, 1200);
      return;
    }
    const group = sequence[groupIndex];
    applyGroup(group, 0);
    groupIndex++;
    setTimeout(runNext, BASE_DELAY + group.length*STAGGER_IN_GROUP);
  };

  // Use DOMContentLoaded to ensure elements exist
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', runNext);
  } else {
    runNext();
  }
})();

// Product slider: infinite loop with directional hover control
(function directionalProductSlider(){
  const slider = document.querySelector('.product-slider');
  const track = slider ? slider.querySelector('.ps-track') : null;
  if(!slider || !track) return;

  // Ensure we have enough items duplicated for seamless loop
  // If only one sequence exists, clone its children and append
  const items = Array.from(track.children);
  if(items.length && items.length < 16){
    const clone = items.map(n=> n.cloneNode(true));
    clone.forEach(n=> track.appendChild(n));
  }

  let dir = -1; // -1 => left, +1 => right
  let speed = 0.5; // px per frame baseline
  let rafId = null;
  let running = false;

  // Set initial transform
  let x = 0;

  // Measure total scrollable width (half the track because of duplication)
  function measureUnitWidth(){
    const w = track.scrollWidth;
    return w/2; // because we duplicated sequence
  }
  let unit = 0;
  const measure = ()=>{ unit = measureUnitWidth(); };
  measure();
  window.addEventListener('resize', ()=>{ measure(); });

  function step(){
    // Move
    x += dir * speed;
    // Wrap seamlessly in both directions
    if(x <= -unit) x += unit; // moved a full sequence to left
    if(x >= 0) x -= unit;     // moved a full sequence to right
    track.style.transform = `translate3d(${x}px,0,0)`;
    if(running) rafId = requestAnimationFrame(step);
  }
  function start(){ if(running) return; running = true; rafId = requestAnimationFrame(step); }
  function stop(){ running = false; if(rafId){ cancelAnimationFrame(rafId); rafId = null; } }

  // Only run when slider is visible
  if('IntersectionObserver' in window){
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{ if(entry.target===slider){ entry.isIntersecting ? start() : stop(); } });
    }, { threshold: 0.1 });
    io.observe(slider);
  } else {
    start();
  }

  // Hover zones to control direction
  const leftZone = slider.querySelector('.ps-hover-zone.left');
  const rightZone = slider.querySelector('.ps-hover-zone.right');

  const setLeft = ()=>{ dir = -1; };
  const setRight = ()=>{ dir = 1; };
  const speedUp = ()=>{ speed = 1.4; };
  const speedNormal = ()=>{ speed = 0.5; };

  // If zones exist, use them; otherwise infer from mouse position
  if(leftZone && rightZone){
    leftZone.addEventListener('mouseenter', ()=>{ setLeft(); speedUp(); });
    rightZone.addEventListener('mouseenter', ()=>{ setRight(); speedUp(); });
    slider.addEventListener('mouseleave', speedNormal);
  } else {
    slider.addEventListener('mousemove', (e)=>{
      const rect = slider.getBoundingClientRect();
      const rel = (e.clientX - rect.left) / rect.width; // 0 .. 1
      if(rel < 0.5) setLeft(); else setRight();
      speed = 0.8 + Math.abs(rel - 0.5) * 1.2; // faster near edges
    });
    slider.addEventListener('mouseleave', ()=>{ speedNormal(); });
  }
})();

// Hover-controlled motion for category emoji slider
// Category section now static (no slider behavior)
(function categoryEmojiStatic(){
  const wrap = document.querySelector('.cat-slider.static');
  if(!wrap) return;
  wrap.removeAttribute('tabindex');
  wrap.removeAttribute('aria-label');
})();

// Hero rotating words (Customizable / Affordable / Premium)
(function heroRotatingWords(){
  const wrap = document.querySelector('.hero-rotate');
  if(!wrap) return; const words = Array.from(wrap.querySelectorAll('.hero-word')); if(words.length<2) return;
  let i = 0; let timer = null; const cycle = ()=>{ words.forEach((w,idx)=> w.classList.toggle('active', idx===i)); i = (i+1)%words.length; };
  const start = ()=>{ if(timer) return; cycle(); timer = setInterval(cycle, 2600); };
  const stop = ()=>{ if(timer){ clearInterval(timer); timer = null; } };
  if('IntersectionObserver' in window){
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{ if(e.target===wrap){ e.isIntersecting ? start() : stop(); } });
    }, { threshold: 0.2 });
    io.observe(wrap);
  } else {
    start();
  }
})();

// Hero side cards subtle auto-highlight (pulse border)
(function heroHighlightPulse(){
  const cards = Array.from(document.querySelectorAll('.hero-highlight'));
  if(!cards.length) return; let index = 0; let timer = null; const tick = ()=>{
    cards.forEach((c,i)=> c.style.outline = (i===index? '2px solid rgba(255,255,255,0.55)' : 'none'));
    index = (index+1)%cards.length;
  };
  const start = ()=>{ if(timer || document.body.classList.contains('perf-lite')) return; timer = setInterval(tick, 4000); };
  const stop = ()=>{ if(timer){ clearInterval(timer); timer = null; } };
  if('IntersectionObserver' in window){
    const wrap = document.querySelector('.hero-side-cards');
    if(wrap){
      const io = new IntersectionObserver((entries)=>{
        entries.forEach(e=>{ if(e.target===wrap){ e.isIntersecting ? start() : stop(); } });
      }, { threshold: 0.2 });
      io.observe(wrap);
    } else { start(); }
  } else { start(); }
})();

// Open YouTube in a lightweight modal instead of navigating away
(function videoLightbox(){
  document.addEventListener('click', (e)=>{
    const link = e.target.closest('a.play-badge');
    if(!link) return;
    const href = link.getAttribute('href');
    if(!href) return;
    e.preventDefault();

    const toEmbed = (url)=>{
      try{
        // Support youtu.be/, watch?v=, and embed/
        const u = new URL(url);
        let id = '';
        if(u.hostname.includes('youtu.be')){
          id = u.pathname.replace('/', '');
        } else if(u.searchParams.get('v')){
          id = u.searchParams.get('v');
        } else if(u.pathname.includes('/embed/')){
          id = u.pathname.split('/embed/')[1];
        }
        if(!id) return null;
        return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
      }catch{ return null; }
    };

    const embed = toEmbed(href);
    if(!embed){ window.open(href, '_blank', 'noopener'); return; }

    const overlay = document.createElement('div'); overlay.className = 'video-overlay'; overlay.setAttribute('role','dialog'); overlay.setAttribute('aria-label','Video player');
    const modal = document.createElement('div'); modal.className = 'video-modal';
    const close = document.createElement('button'); close.className = 'video-close'; close.setAttribute('aria-label','Close video'); close.textContent = '×';
    const iframe = document.createElement('iframe'); iframe.src = embed; iframe.allow = 'autoplay; encrypted-media'; iframe.allowFullscreen = true; iframe.title = 'YouTube video player';
    modal.appendChild(close); modal.appendChild(iframe); overlay.appendChild(modal); document.body.appendChild(overlay);

    const remove = ()=>{ try{ overlay.remove(); }catch{} };
    overlay.addEventListener('click', (ev)=>{ if(ev.target === overlay) remove(); });
    close.addEventListener('click', remove);
    document.addEventListener('keydown', function onEsc(ev){ if(ev.key==='Escape'){ remove(); document.removeEventListener('keydown', onEsc); } });
  });
})();

// Small helper to show SweetAlerts with graceful fallback
function notifySuccess(message){
  if(window.Swal && Swal.fire){
    Swal.fire({
      icon: 'success',
      title: message,
      confirmButtonText: 'OK',
      confirmButtonColor: '#2563eb',
      timer: 1600
    });
  } else {
    alert(message);
  }
}

// Newsletter popup on page load with 'Do not show again'
(function newsletterPopup(){
  try{
    // Only show on home page
    if(!document.body.classList.contains('home')) return;
    // Only trigger on real reloads (F5/Refresh/Hard refresh), not link navigation
    const isReload = ()=>{
      try{
        const navs = performance.getEntriesByType && performance.getEntriesByType('navigation');
        if(navs && navs.length){ return navs[0].type === 'reload'; }
        if(performance && performance.navigation){ return performance.navigation.type === 1; }
      }catch{}
      return false;
    };
    if(!isReload()) return;
    // Respect user preference
    const HIDE_KEY = 'nlpHide';
    if(localStorage.getItem(HIDE_KEY) === '1') return;

    const show = ()=>{
      const overlay = document.createElement('div'); overlay.className = 'nlp-overlay'; overlay.setAttribute('role','dialog'); overlay.setAttribute('aria-label','Subscribe to our newsletter');
      const modal = document.createElement('div'); modal.className = 'nlp-modal';
  const left = document.createElement('div'); left.className = 'nlp-left'; left.innerHTML = `<img src="airbuds/a1.jfif" alt="Shopping">`;
      const right = document.createElement('div'); right.className = 'nlp-right';
      const close = document.createElement('button'); close.className = 'nlp-close'; close.setAttribute('aria-label','Close'); close.textContent = '×';

      right.innerHTML = `
        <h2 class="nlp-title">Subscribe To Our <span class="accent">Newsletter</span></h2>
        <p class="nlp-desc">Subscribe to our newsletter and save your <strong style="color:var(--accent)">20% money</strong> with discount code today.</p>
        <form class="nlp-form" aria-label="Newsletter form">
          <input type="email" name="email" placeholder="Enter your email" required>
          <button type="submit" class="hero-btn">Subscribe</button>
        </form>
        <label class="nlp-footer"><input id="nlpNoShow" type="checkbox"> Do not show this window</label>
      `;

      modal.appendChild(left); modal.appendChild(right); modal.appendChild(close); overlay.appendChild(modal); document.body.appendChild(overlay);
      document.body.classList.add('modal-open');

      const remove = ()=>{ try{ overlay.remove(); document.body.classList.remove('modal-open'); }catch{} };
      // Close interactions
      close.addEventListener('click', remove);
      overlay.addEventListener('click', (e)=>{ if(e.target === overlay) remove(); });
      document.addEventListener('keydown', function onEsc(ev){ if(ev.key==='Escape'){ remove(); document.removeEventListener('keydown', onEsc); } });

  // Form handler (demo only)
      const form = right.querySelector('.nlp-form');
  form.addEventListener('submit', (e)=>{ e.preventDefault(); const email = form.querySelector('input[type="email"]').value.trim(); if(email){ notifySuccess('Thanks for subscribing!'); remove(); } });

      // Preference checkbox
      const chk = right.querySelector('#nlpNoShow');
      chk.addEventListener('change', ()=>{ if(chk.checked) localStorage.setItem(HIDE_KEY, '1'); else localStorage.removeItem(HIDE_KEY); });
    };

    // Slight delay after load so it feels natural
    if(document.readyState === 'complete' || document.readyState === 'interactive'){
      setTimeout(show, 800);
    } else {
      document.addEventListener('DOMContentLoaded', ()=> setTimeout(show, 800));
    }
  }catch(err){ /* no-op */ }
})();

// Checkout popup overlay (intercepts checkout links) - INLINE VERSION
(function checkoutOverlay(){
  function openOverlay(){
    // Build overlay with INLINE form (no iframe)
    const overlay = document.createElement('div'); overlay.className='checkout-overlay'; overlay.setAttribute('role','dialog'); overlay.setAttribute('aria-label','Checkout');
    const modal = document.createElement('div'); modal.className='checkout-modal';
    const close = document.createElement('button'); close.className='checkout-close'; close.setAttribute('aria-label','Close checkout'); close.textContent='×';

    const content = document.createElement('div'); content.className='checkout-inline-content';
    content.innerHTML = `
      <div style="padding:36px 44px 30px; overflow-y:auto; height:100%;">
        <h2 style="margin:0 0 24px; font-size:2rem; letter-spacing:.5px; background:linear-gradient(90deg,var(--primary),var(--accent)); -webkit-background-clip:text; background-clip:text; color:transparent;">Checkout</h2>

        <div class="co-cart-wrap" style="background:#f9fafb; border:1px solid var(--border); border-radius:14px; padding:14px 14px; margin:0 0 18px 0;">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:10px;">
            <h3 style="margin:0; font-size:1.1rem; font-weight:800; color:#111827;">Order Summary</h3>
            <button type="button" class="util-btn co-empty" style="padding:7px 12px; font-size:.82rem; font-weight:800;">Empty Cart</button>
          </div>
          <div id="co_cartItems" style="display:flex; flex-direction:column; gap:10px;"></div>
          <div style="display:flex; align-items:center; justify-content:flex-end; gap:8px; margin-top:10px; font-weight:800; font-size:1.05rem;">
            <span>Total:</span> <span id="co_total">$0</span>
          </div>
        </div>

        <form class="checkout-form" id="inlineCheckoutForm" style="display:grid; gap:18px; grid-template-columns:repeat(auto-fit,minmax(240px,1fr));">
          <div style="display:flex; flex-direction:column; gap:8px;">
            <label for="co_name">Full Name</label>
            <input id="co_name" name="fullname" required type="text" placeholder="Jane Doe" style="padding:12px 14px; border-radius:10px; border:1px solid #e5e7eb; font-size:1rem;">
          </div>
          <div style="display:flex; flex-direction:column; gap:8px;">
            <label for="co_email">Email</label>
            <input id="co_email" name="email" required type="email" placeholder="you@example.com" style="padding:12px 14px; border-radius:10px; border:1px solid #e5e7eb; font-size:1rem;">
          </div>
          <div style="display:flex; flex-direction:column; gap:8px; grid-column:1/-1;">
            <label for="co_address">Address</label>
            <input id="co_address" name="address" required type="text" placeholder="123 Main St" style="padding:12px 14px; border-radius:10px; border:1px solid #e5e7eb; font-size:1rem;">
          </div>
          <div style="display:flex; flex-direction:column; gap:8px;">
            <label for="co_card">Card Number</label>
            <input id="co_card" name="card" required type="text" inputmode="numeric" placeholder="•••• •••• •••• ••••" style="padding:12px 14px; border-radius:10px; border:1px solid #e5e7eb; font-size:1rem;">
          </div>
          <div style="display:flex; flex-direction:column; gap:8px;">
            <label for="co_exp">Expiry</label>
            <input id="co_exp" required type="text" placeholder="MM/YY" style="padding:12px 14px; border-radius:10px; border:1px solid #e5e7eb; font-size:1rem;">
          </div>
          <div style="display:flex; flex-direction:column; gap:8px;">
            <label for="co_cvc">CVC</label>
            <input id="co_cvc" required type="text" placeholder="123" style="padding:12px 14px; border-radius:10px; border:1px solid #e5e7eb; font-size:1rem;">
          </div>
          <div style="grid-column:1/-1; display:flex; flex-direction:column; gap:12px; margin-top:10px;">
            <button type="submit" class="hero-btn" style="width:100%; background:linear-gradient(135deg, var(--primary), var(--accent)); color:#fff; border:0; padding:14px; border-radius:12px; font-weight:700; font-size:1.05rem;">Place Order</button>
            <button type="button" class="hero-btn" id="co_cancel" style="width:100%; background:#fff; color:var(--primary); border:2px solid var(--primary);">Cancel</button>
          </div>
        </form>
        <div style="margin-top:28px; display:grid; gap:14px; grid-template-columns:repeat(auto-fit,minmax(160px,1fr));">
          <div style="display:flex; align-items:center; gap:10px; padding:12px; background:#f9fafb; border-radius:10px;"><span style="font-size:20px;">🔒</span> Secure payment</div>
          <div style="display:flex; align-items:center; gap:10px; padding:12px; background:#f9fafb; border-radius:10px;"><span style="font-size:20px;">⚡</span> Fast processing</div>
          <div style="display:flex; align-items:center; gap:10px; padding:12px; background:#f9fafb; border-radius:10px;"><span style="font-size:20px;">✅</span> Verified products</div>
        </div>
      </div>
    `;

    modal.appendChild(close); modal.appendChild(content); overlay.appendChild(modal); document.body.appendChild(overlay);
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';

    function remove(){ try{ overlay.remove(); document.documentElement.style.overflow = prevOverflow || ''; }catch{} }
    close.addEventListener('click', remove);
    overlay.addEventListener('click', (ev)=>{ if(ev.target===overlay) remove(); });
    document.addEventListener('keydown', function onEsc(ev){ if(ev.key==='Escape'){ remove(); document.removeEventListener('keydown', onEsc); } });

    // Cart controls in overlay
    const placeBtn = content.querySelector('#inlineCheckoutForm button[type="submit"]');
    const listEl = content.querySelector('#co_cartItems');
    const totalEl = content.querySelector('#co_total');
  function overlayTotal(){ const cfg = currencyConfig[appSettings.currency] || currencyConfig.USD; const total = cart.reduce((s,i)=> { const prod = products.find(p=>p.id===i.id) || { price: i.price||0, offer:false }; const unit = getEffectivePriceUSD(prod); return s + unit*i.qty; }, 0) * cfg.rate; return cfg.symbol + total.toFixed(0); }
    function renderOverlayCart(){
      if(!listEl || !totalEl) return;
      if(!cart.length){
        listEl.innerHTML = '<p style="margin:0; padding:8px; background:#fff; border:1px dashed #e5e7eb; border-radius:10px; text-align:center; color:#6b7280; font-weight:700;">Your cart is empty</p>';
        totalEl.textContent = overlayTotal();
        if(placeBtn) placeBtn.disabled = true; return;
      }
      if(placeBtn) placeBtn.disabled = false;
      listEl.innerHTML = cart.map(it=>{
        const prod = products.find(p=>p.id===it.id) || { price: it.price||0, offer:false, name: it.name };
        const unit = getEffectivePriceUSD(prod);
        const sub = unit * it.qty;
        const unitHtml = prod.offer ? `<span class="price-old">${formatPrice(prod.price)}</span> <span class="price-new">${formatPrice(unit)}</span>` : `${formatPrice(unit)}`;
        return `
        <div class="co-row" data-id="${it.id}" style="display:grid; grid-template-columns: 54px 1fr auto auto auto; align-items:center; gap:10px; background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:8px 10px;">
          <img src="${it.img}" alt="${it.name}" style="width:46px; height:46px; object-fit:cover; border-radius:10px;">
          <div class="co-info" style="display:flex; flex-direction:column; gap:2px;">
            <strong style="font-size:.95rem;">${it.name}</strong>
            <span class="co-price" style="color:#6b7280; font-weight:700;">${unitHtml}</span>
          </div>
          <div class="co-qty" style="display:inline-flex; align-items:center; gap:6px;">
            <button type="button" class="co-qty-minus" data-id="${it.id}" aria-label="Decrease" style="width:32px; height:32px; border:1px solid #e5e7eb; border-radius:8px; background:#fff; font-weight:800;">−</button>
            <input type="number" min="1" value="${it.qty}" data-id="${it.id}" style="width:56px; text-align:center; border:1px solid #e5e7eb; border-radius:8px; padding:6px 6px; font-weight:700;">
            <button type="button" class="co-qty-plus" data-id="${it.id}" aria-label="Increase" style="width:32px; height:32px; border:1px solid #e5e7eb; border-radius:8px; background:#fff; font-weight:800;">+</button>
          </div>
          <div class="co-sub" style="font-weight:800; color:var(--primary); min-width:68px; text-align:right;">${formatPrice(sub)}</div>
          <button type="button" class="co-remove" data-id="${it.id}" aria-label="Remove" style="width:32px; height:32px; border:1px solid #f1f5f9; border-radius:8px; background:#fff; font-weight:800; color:#ef4444;">×</button>
        </div>`;
      }).join('');
      totalEl.textContent = overlayTotal();
    }
    function setQty(id, qty){ qty = Math.max(1, parseInt(qty||1,10)); const it = cart.find(i=> i.id===id); if(!it) return; it.qty = qty; saveCart(); renderOverlayCart(); }
    function inc(id){ addToCart(id); renderOverlayCart(); }
    function dec(id){ const it = cart.find(i=> i.id===id); if(!it) return; it.qty -= 1; if(it.qty<=0){ cart = cart.filter(i=> i.id!==id); } saveCart(); renderOverlayCart(); }
    function removeItem(id){ cart = cart.filter(i=> i.id!==id); saveCart(); renderOverlayCart(); }
    content.addEventListener('click', (ev)=>{
      const plus = ev.target.closest('.co-qty-plus'); const minus = ev.target.closest('.co-qty-minus'); const rem = ev.target.closest('.co-remove'); const empty = ev.target.closest('.co-empty');
      if(plus){ inc(plus.dataset.id); }
      else if(minus){ dec(minus.dataset.id); }
      else if(rem){ removeItem(rem.dataset.id); }
      else if(empty){ cart = []; saveCart(); renderOverlayCart(); }
    });
    content.addEventListener('change', (ev)=>{ const inp = ev.target.closest('.co-qty input[type="number"]'); if(!inp) return; setQty(inp.dataset.id, inp.value); });
    renderOverlayCart();

    // Form submit
    const form = content.querySelector('#inlineCheckoutForm');
    form.addEventListener('submit', (ev)=>{
      ev.preventDefault();
      if(!cart.length){ notifySuccess('Your cart is empty'); return; }
      // Generate a simple unique order id
      const orderId = (function generateOrderId(){
        try{
          const t = Date.now().toString(36).toUpperCase();
          const r = Math.floor(Math.random()*1e8).toString(36).toUpperCase();
          return 'MM-' + t.slice(-6) + '-' + r.slice(-4);
        }catch{ return 'MM-' + Math.floor(Math.random()*1e9); }
      })();
      // Persist last order id (optional)
      try{ localStorage.setItem('lastOrderId', orderId); }catch{}
      // Clear cart after successful order
      cart = [];
      saveCart();
      renderOverlayCart();
      // Close the checkout popup immediately, then show the SweetAlert on top
      remove();
      // Show SweetAlert with order id, fallback to alert
      if(window.Swal && Swal.fire){
        Swal.fire({
          icon:'success',
          title:'Order placed successfully!',
          html:`<div style="font-size:1rem; font-weight:700;">Your Order ID</div><div style="margin-top:6px; font-family:monospace; font-size:1.1rem; background:#f1f5f9; padding:8px 10px; border-radius:8px; display:inline-block;">${orderId}</div>`,
          confirmButtonText:'OK',
          confirmButtonColor:'#7c3aed'
        });
      } else {
        alert('Order placed successfully!\nOrder ID: ' + orderId);
      }
    });
    // Cancel
    content.querySelector('#co_cancel').addEventListener('click', remove);
  }

  // Expose programmatic opener for post-login
  window.openCheckoutOverlay = openOverlay;

  // Intercept checkout links, require login first
  document.addEventListener('click', (e)=>{
    const link = e.target.closest('a[href*="checkout.html"]');
    if(!link) return;
    if(window.location.pathname.endsWith('checkout.html')) return;
    e.preventDefault();
    const loggedIn = !!localStorage.getItem('authEmail');
    if(!loggedIn){
      sessionStorage.setItem('checkoutAfterLogin','1');
      // Open login modal above anything else
      if(window.openLoginModal){ window.openLoginModal(); }
      else {
        const btn = document.getElementById('loginBtn');
        if(btn) btn.click(); else notifySuccess('Please log in to proceed to checkout.');
      }
      return;
    }
    openOverlay();
  });
})();

// Fallback: If a native checkout page is used (not the overlay), empty the cart on submit
document.addEventListener('submit', (e)=>{
  try{
    const form = e.target;
    if(!(form && form.classList && form.classList.contains('checkout-form'))) return;
    // Ignore overlay's inline checkout form; it has its own handler
    if(form.id === 'inlineCheckoutForm' || form.closest('.checkout-overlay')) return;
    e.preventDefault();
    if(!cart.length){ notifySuccess('Your cart is empty'); return; }
    const orderId = (function generateOrderId(){
      try{
        const t = Date.now().toString(36).toUpperCase();
        const r = Math.floor(Math.random()*1e8).toString(36).toUpperCase();
        return 'MM-' + t.slice(-6) + '-' + r.slice(-4);
      }catch{ return 'MM-' + Math.floor(Math.random()*1e9); }
    })();
    try{ localStorage.setItem('lastOrderId', orderId); }catch{}
    cart = [];
    saveCart();
    if(window.Swal && Swal.fire){
      Swal.fire({ icon:'success', title:'Order placed successfully!', html:`<div style="font-size:1rem; font-weight:700;">Your Order ID</div><div style=\"margin-top:6px; font-family:monospace; font-size:1.1rem; background:#f1f5f9; padding:8px 10px; border-radius:8px; display:inline-block;\">${orderId}</div>`, confirmButtonText:'OK', confirmButtonColor:'#7c3aed' });
    } else {
      alert('Order placed successfully!\nOrder ID: ' + orderId);
    }
  }catch{}
});

// Home page: Featured Mobiles v2 (modular markup + template)
(function featuredOnHomeV2(){
  const grid = document.getElementById('featuredMobilesGrid');
  const template = document.getElementById('fmCardTemplate');
  const filterBar = document.querySelector('#featured-mobiles .fm-filters');
  const filterButtons = Array.from(document.querySelectorAll('#featured-mobiles .fm-filter'));
  const prevBtn = document.querySelector('#featured-mobiles .fm-prev');
  const nextBtn = document.querySelector('#featured-mobiles .fm-next');
  if(!grid || !template || !filterButtons.length) return;

  let currentFilter = 'popular';

  function topMobiles(filter){
    let list = products.filter(p=> p.category==='mobile');
    if(filter === 'popular') list.sort((a,b)=> (b.popular||0) - (a.popular||0));
    else if(filter === 'selling') list.sort((a,b)=> (b.selling||0) - (a.selling||0));
    else if(filter === 'offer') list = list.filter(p=> p.offer).sort((a,b)=> getEffectivePriceUSD(b) - getEffectivePriceUSD(a));
  return list.slice(0,6);
  }

  function buildCard(p){
    const eff = getEffectivePriceUSD(p);
    const node = template.content.firstElementChild.cloneNode(true);
    node.setAttribute('data-id', p.id);
    // Enforce fixed card width inline to guarantee single-row layout even if external CSS is cached/misses
    try{ node.style.flex = '0 0 260px'; node.style.minWidth = '260px'; }catch{}
    // media
    const media = node.querySelector('.fm-media');
    const img = media.querySelector('img');
    const badge = media.querySelector('.fm-badge-offer');
    const href = `product.html?id=${p.id}`;
    media.setAttribute('href', href);
    img.src = p.image; img.alt = p.name;
    if(p.offer){ badge.hidden = false; }
    // info
    const nameLink = node.querySelector('.fm-name a');
    nameLink.textContent = p.name; nameLink.href = href;
    node.querySelector('.fm-brand').textContent = p.brand;
    const oldEl = node.querySelector('.fm-price-old');
    const newEl = node.querySelector('.fm-price-new');
    if(p.offer){ oldEl.textContent = formatPrice(p.price); oldEl.hidden = false; newEl.textContent = formatPrice(eff); }
    else { oldEl.hidden = true; newEl.textContent = formatPrice(eff); }
    // actions
    node.querySelector('.fm-view').addEventListener('click', ()=>{ window.location.href = href; });
    node.querySelector('.fm-add').addEventListener('click', ()=> addToCart(p.id));
    return node;
  }

  function render(filter){
    currentFilter = filter;
    grid.innerHTML = '';
    grid.setAttribute('data-current', filter);
    topMobiles(filter).forEach((p,i)=>{
      const card = buildCard(p);
      // reveal animation hook
      card.classList.add('reveal-up');
      card.style.setProperty('--delay', (i*0.04)+'s');
      grid.appendChild(card);
    });
    try{ document.dispatchEvent(new Event('cards-added')); }catch{}
  }

  // Filters UI
  filterButtons.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const filter = btn.dataset.filter || 'popular';
      filterButtons.forEach(b=>{ const on = b===btn; b.classList.toggle('is-active', on); b.setAttribute('aria-selected', on? 'true':'false'); });
      render(filter);
    });
  });

  // Init
  render('popular');

  // Horizontal scroll controls
  function scrollByCards(dir){
    const card = grid.querySelector('.fm-card');
    const delta = card ? (card.getBoundingClientRect().width + 18) * dir : 300 * dir;
    grid.scrollBy({ left: delta, behavior: 'smooth' });
  }
  function updateNavDisabled(){
    const max = grid.scrollWidth - grid.clientWidth - 1; // tolerance
    if(prevBtn) prevBtn.disabled = grid.scrollLeft <= 0;
    if(nextBtn) nextBtn.disabled = grid.scrollLeft >= max;
  }
  if(prevBtn){ prevBtn.addEventListener('click', ()=>{ scrollByCards(-1); }); }
  if(nextBtn){ nextBtn.addEventListener('click', ()=>{ scrollByCards(1); }); }
  grid.addEventListener('scroll', updateNavDisabled, { passive:true });
  setTimeout(updateNavDisabled, 50);

  // Expose for currency refresh
  window.renderFeaturedHome = ()=> render(currentFilter);
})();

// Quick preview modal for product cards (optional enhancement)
(function quickPreview(){
  document.addEventListener('click', (e)=>{
    const view = e.target.closest('.card .btn');
    if(!view) return; // keep default navigation for now; preview on modifier key
    if(!e.shiftKey) return; // Hold Shift and click View to open preview
    e.preventDefault();
    const url = new URL(view.getAttribute('href'), window.location.href);
    const id = url.searchParams.get('id');
    const p = products.find(x=>x.id===id);
    if(!p) return;
    const overlay = document.createElement('div'); overlay.className='preview-overlay'; overlay.setAttribute('role','dialog'); overlay.setAttribute('aria-label',p.name);
    const modal = document.createElement('div'); modal.className='preview-modal';
    const eff = getEffectivePriceUSD(p);
    const priceHtml = p.offer ? `<div class="price"><span class="price-old">${formatPrice(p.price)}</span> <span class="price-new">${formatPrice(eff)}</span></div>` : `<div class="price">${formatPrice(eff)}</div>`;
    modal.innerHTML = `
      <button class="close-preview" aria-label="Close">×</button>
      <img src="${p.image}" alt="${p.name}">
      <div>
        <h2>${p.name}</h2>
        <div class="brand">${p.brand}</div>
        ${priceHtml}
        <p>Top-tier quality and performance. Perfect for power users and creators.</p>
        <div style="display:flex; gap:10px; margin-top:12px;">
          <a class="btn" href="product.html?id=${p.id}">Full Details</a>
          <button class="btn btn-primary add-temp" data-id="${p.id}">Add to Cart</button>
        </div>
      </div>`;
    overlay.appendChild(modal); document.body.appendChild(overlay);
    const close = ()=> overlay.remove();
    overlay.addEventListener('click', (ev)=>{ if(ev.target===overlay) close(); });
    modal.querySelector('.close-preview').addEventListener('click', close);
    modal.querySelector('.add-temp').addEventListener('click', (ev)=>{ addToCart(ev.target.dataset.id); close(); });
    document.addEventListener('keydown', function onEsc(ev){ if(ev.key==='Escape'){ close(); document.removeEventListener('keydown', onEsc); } });
  });
})();

// Shop page: chip-based filters
(function modernShopFilters(){
  const catChips = Array.from(document.querySelectorAll('#catChips .chip[data-cat]'));
  const brandChips = Array.from(document.querySelectorAll('#brandChips .chip[data-brand]'));
  const priceRange = document.getElementById('filterPrice');
  const priceLabel = document.getElementById('priceValue');
  // Top toolbar controls (visible in grid layout)
  const filterCategoryTop = document.getElementById('filterCategoryTop');
  const filterBrandTop = document.getElementById('filterBrandTop');
  const sortSelectTop = document.getElementById('sortSelectTop');
  const filterPriceTop = document.getElementById('filterPriceTop');
  const priceValueTop = document.getElementById('priceValueTop');
  const filterResetTop = document.getElementById('filterResetTop');
  // Show toolbar only when in grid layout (defense in depth over CSS)
  const toolbar = document.querySelector('.filters-toolbar');
  if(toolbar){
    const isGrid = document.body.classList.contains('shop-layout-grid');
    toolbar.style.display = isGrid ? 'block' : 'none';
    toolbar.setAttribute('aria-hidden', isGrid ? 'false' : 'true');
  }
  // Initialize price label to current currency on load
  if(priceRange && priceLabel){ priceLabel.textContent = formatPrice(Number(priceRange.value || 1000)); }
  if(filterPriceTop && priceValueTop){ priceValueTop.textContent = formatPrice(Number(filterPriceTop.value || 1000)); }

  // Initialize top toolbar selects to state (in case state was set from URL)
  if(filterCategoryTop){ filterCategoryTop.value = state.category || 'all'; }
  if(filterBrandTop){ filterBrandTop.value = state.brand || 'all'; }
  if(sortSelectTop){ sortSelectTop.value = state.sort || 'default'; }
  const syncChips = ()=>{
    if(catChips.length){ catChips.forEach(ch=> ch.classList.toggle('active', (ch.dataset.cat||'all')===state.category)); }
    if(brandChips.length){ brandChips.forEach(ch=> ch.classList.toggle('active', (ch.dataset.brand||'all')===state.brand)); }
  };
  // Reflect URL-initialized state
  syncChips();
  if(productGrid) renderProducts();
  if(catChips.length){
    catChips.forEach(ch=> ch.addEventListener('click', ()=>{
      state.category = ch.dataset.cat || 'all';
      catChips.forEach(c=> c.classList.toggle('active', c===ch));
      // Sync top toolbar select
      if(filterCategoryTop) filterCategoryTop.value = state.category;
      if(productGrid) renderProducts();
    }));
  }
  if(brandChips.length){
    brandChips.forEach(ch=> ch.addEventListener('click', ()=>{
      state.brand = ch.dataset.brand || 'all';
      brandChips.forEach(c=> c.classList.toggle('active', c===ch));
      // Sync top toolbar select
      if(filterBrandTop) filterBrandTop.value = state.brand;
      if(productGrid) renderProducts();
    }));
  }
  if(priceRange && priceLabel){
    priceRange.addEventListener('input', (e)=>{
      state.price = Number(e.target.value);
      priceLabel.textContent = formatPrice(state.price);
      // Sync top toolbar price
      if(filterPriceTop){ filterPriceTop.value = String(state.price); }
      if(priceValueTop){ priceValueTop.textContent = formatPrice(state.price); }
      if(productGrid) renderProducts();
    });
  }
  // Top toolbar: category/brand/sort/price listeners
  if(filterCategoryTop){
    filterCategoryTop.addEventListener('change', (e)=>{
      state.category = e.target.value || 'all';
      syncChips();
      if(productGrid) renderProducts();
    });
  }
  if(filterBrandTop){
    filterBrandTop.addEventListener('change', (e)=>{
      state.brand = e.target.value || 'all';
      syncChips();
      if(productGrid) renderProducts();
    });
  }
  if(sortSelectTop){
    sortSelectTop.addEventListener('change', (e)=>{
      state.sort = e.target.value || 'default';
      // Sync sidebar select if present and pills
      const localSortSelect = document.getElementById('sortSelect');
      if(localSortSelect) localSortSelect.value = state.sort;
      if(typeof updateSortPills === 'function') updateSortPills();
      if(productGrid) renderProducts();
    });
  }
  if(filterPriceTop && priceValueTop){
    filterPriceTop.addEventListener('input', (e)=>{
      state.price = Number(e.target.value);
      priceValueTop.textContent = formatPrice(state.price);
      // Sync sidebar price range and label
      if(priceRange) priceRange.value = String(state.price);
      if(priceLabel) priceLabel.textContent = formatPrice(state.price);
      if(productGrid) renderProducts();
    });
  }
  // Enhance reset to also clear chips
  const resetBtn = document.getElementById('filterReset');
  if(resetBtn){
    resetBtn.addEventListener('click', ()=>{
      if(catChips.length){ catChips.forEach((c,i)=> c.classList.toggle('active', i===0)); }
      if(brandChips.length){ brandChips.forEach((c,i)=> c.classList.toggle('active', i===0)); }
      if(priceRange && priceLabel){ priceRange.value = 1000; priceLabel.textContent = formatPrice(1000); }
      // Sync top toolbar on sidebar reset
      if(filterCategoryTop) filterCategoryTop.value = 'all';
      if(filterBrandTop) filterBrandTop.value = 'all';
      if(filterPriceTop) filterPriceTop.value = '1000';
      if(priceValueTop) priceValueTop.textContent = formatPrice(1000);
      if(sortSelectTop) sortSelectTop.value = 'default';
      if(typeof updateSortPills === 'function') updateSortPills();
      if(productGrid) renderProducts();
    });
  }
  if(filterResetTop){
    filterResetTop.addEventListener('click', ()=>{
      // Reset state
      state = { category:'all', brand:'all', price:1000, sort:'default', search: state.search || '' };
      // Sync toolbar controls
      if(filterCategoryTop) filterCategoryTop.value = 'all';
      if(filterBrandTop) filterBrandTop.value = 'all';
      if(filterPriceTop) filterPriceTop.value = '1000';
      if(priceValueTop) priceValueTop.textContent = formatPrice(1000);
      if(sortSelectTop) sortSelectTop.value = 'default';
      // Sync sidebar controls
      if(catChips.length){ catChips.forEach((c,i)=> c.classList.toggle('active', i===0)); }
      if(brandChips.length){ brandChips.forEach((c,i)=> c.classList.toggle('active', i===0)); }
      if(priceRange && priceLabel){ priceRange.value = 1000; priceLabel.textContent = formatPrice(1000); }
      const localSortSelect = document.getElementById('sortSelect'); if(localSortSelect) localSortSelect.value = 'default';
      if(typeof updateSortPills === 'function') updateSortPills();
      if(productGrid) renderProducts();
    });
  }
})();

// Inline newsletter form on the page (CTA section)
(function bindInlineNewsletter(){
  const form = document.getElementById('newsletterForm');
  if(!form) return;
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const email = form.querySelector('input[type="email"]').value.trim();
    if(!email) return;
    notifySuccess('Thanks for subscribing!');
    try{ form.reset(); }catch{}
  });
})();

// Landing: Tabs for categories (Mobiles/Airbuds/Chargers)
(function landingTabs(){
  const grid = document.getElementById('tabGrid');
  const tabs = Array.from(document.querySelectorAll('.tabs .tab[data-cat]'));
  const template = document.getElementById('catCardTemplate');
  if(!grid || !tabs.length || !template) return;
  let currentCat = 'mobile';

  function buildCatCard(p){
    const eff = getEffectivePriceUSD(p);
    const node = template.content.firstElementChild.cloneNode(true);
    node.setAttribute('data-id', p.id);
    // Guarantee single-row width inline as defensive fallback
    try{ node.style.flex = '0 0 260px'; node.style.minWidth = '260px'; }catch{}
    const media = node.querySelector('.fm-media');
    const img = media.querySelector('img');
    const offerBadge = media.querySelector('.fm-badge-offer');
    const href = `product.html?id=${p.id}`;
    media.setAttribute('href', href);
    img.src = p.image; img.alt = p.name;
    if(p.offer){ offerBadge.hidden = false; }
    // Info
    const nameLink = node.querySelector('.fm-name a');
    nameLink.textContent = p.name; nameLink.href = href;
    node.querySelector('.fm-brand').textContent = p.brand;
    const oldEl = node.querySelector('.fm-price-old');
    const newEl = node.querySelector('.fm-price-new');
    if(p.offer){ oldEl.textContent = formatPrice(p.price); oldEl.hidden = false; newEl.textContent = formatPrice(eff); }
    else { oldEl.hidden = true; newEl.textContent = formatPrice(eff); }
    // Actions
    node.querySelector('.fm-view').addEventListener('click', ()=>{ window.location.href = href; });
    node.querySelector('.fm-add').addEventListener('click', ()=> addToCart(p.id));
    return node;
  }

  function render(cat){
    currentCat = cat;
    grid.innerHTML = '';
    const list = products.filter(p=> p.category === cat).slice(0,6);
    list.forEach((p,i)=>{
      const card = buildCatCard(p);
      card.classList.add('reveal-up');
      card.style.setProperty('--delay', (i*0.04)+'s');
      grid.appendChild(card);
    });
    try{ document.dispatchEvent(new Event('cards-added')); }catch{}
  }

  function activate(btn){
    tabs.forEach(b=>{ const on = b===btn; b.classList.toggle('active', on); b.setAttribute('aria-selected', on? 'true':'false'); });
    const cat = btn.getAttribute('data-cat');
    render(cat);
  }

  tabs.forEach(btn=> btn.addEventListener('click', ()=> activate(btn)));
  activate(tabs[0]);

  // Expose for currency refresh
  window.renderLandingTabs = ()=> render(currentCat);
})();

// Landing: Animated counters for stats
(function statsCounters(){
  const els = Array.from(document.querySelectorAll('.stat-number[data-count]'));
  if(!els.length) return;
  const ease = (t)=> 1 - Math.pow(1 - t, 3);
  const animateEl = (el)=>{
    const target = Number(el.dataset.count);
    const isFloat = String(el.dataset.count).includes('.');
    const start = performance.now();
    const dur = 1200;
    function frame(now){
      const p = Math.min(1, (now - start)/dur);
      const v = target * ease(p);
      el.textContent = isFloat ? v.toFixed(1) : Math.floor(v).toLocaleString();
      if(p<1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  };
  if('IntersectionObserver' in window){
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{ if(e.isIntersecting){ animateEl(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.4 });
    els.forEach(el=> io.observe(el));
  } else {
    els.forEach(animateEl);
  }
})();

// Landing: Simple testimonials carousel
(function testimonials(){
  const track = document.querySelector('.t-track');
  const items = track ? Array.from(track.children) : [];
  const prev = document.querySelector('.t-prev');
  const next = document.querySelector('.t-next');
  if(!track || !items.length) return;
  let i = 0; let timer; let active = false;
  const go = (idx)=>{
    i = (idx + items.length) % items.length;
    track.style.transform = `translateX(-${i*100}%)`;
    items.forEach((it,ix)=> it.classList.toggle('active', ix===i));
    if(active) restart();
  };
  const restart = ()=>{ clearInterval(timer); timer = setInterval(()=> go(i+1), 5000); };
  const stop = ()=>{ clearInterval(timer); timer = null; };
  if(prev) prev.addEventListener('click', ()=> go(i-1));
  if(next) next.addEventListener('click', ()=> go(i+1));
  // Run only when visible
  if('IntersectionObserver' in window){
    const wrap = document.querySelector('.testimonials');
    if(wrap){
      const io = new IntersectionObserver((entries)=>{
        entries.forEach(e=>{
          if(e.target===wrap){
            if(e.isIntersecting){ active = true; restart(); }
            else { active = false; stop(); }
          }
        });
      }, { threshold: 0.2 });
      io.observe(wrap);
    } else {
      active = true; restart();
    }
  } else {
    active = true; restart();
  }
})();

// Lazy-load non-critical images to reduce main-thread work during scroll
(function lazyLoadImages(){
  try{
    const imgs = Array.from(document.querySelectorAll('img'));
    imgs.forEach(img=>{
      if(img.closest('.hero-img')) return; // keep hero eager
      if(!img.hasAttribute('loading')) img.setAttribute('loading','lazy');
      img.setAttribute('decoding','async');
      // lower fetch priority for large galleries
      if(img.closest('.product-slider') || img.closest('#featured-mobiles') || img.closest('.tabs-section')){
        img.setAttribute('fetchpriority','low');
      }
    });
  }catch{}
})();
// Utility bar: language & currency dropdowns + login modal
(function utilityBar(){
  const updateLabels = ()=>{
    const curEl = document.querySelector('.current-currency');
    const langEl = document.querySelector('.current-language');
    if(curEl){ curEl.textContent = (currencyConfig[appSettings.currency]?.symbol || '$') + appSettings.currency; }
    if(langEl){ langEl.textContent = appSettings.language; }
    // RTL handling for Arabic/Urdu
    const rtl = ['Arabic','Urdu'];
    document.documentElement.setAttribute('dir', rtl.includes(appSettings.language) ? 'rtl' : 'ltr');
  };
  updateLabels();

  // Delegate clicks for menu items
  document.addEventListener('click', (e)=>{
    const cur = e.target.closest('[data-currency]');
    if(cur){
      e.preventDefault();
      appSettings.currency = cur.getAttribute('data-currency');
      localStorage.setItem('appCurrency', appSettings.currency);
      updateLabels();
      // Refresh price views
      if(typeof window.renderFeaturedHome === 'function') window.renderFeaturedHome();
        if(typeof window.renderLandingTabs === 'function') window.renderLandingTabs();
      if(productGrid) renderProducts();
      renderCartItems();
      // product detail price refresh
      const pdWrap = document.querySelector('#productDetail .pd-price-badge');
      if(pdWrap){
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        const p = products.find(x=>x.id===id) || products[0];
        const eff = getEffectivePriceUSD(p);
        pdWrap.innerHTML = p.offer ? `<span class="price-old">${formatPrice(p.price)}</span> <span class="price-new">${formatPrice(eff)}</span>` : `${formatPrice(eff)}`;
        // Also refresh related products prices if present
        if(typeof window.renderRelated === 'function') window.renderRelated();
      }
      return;
    }
    const lg = e.target.closest('[data-lang]');
    if(lg){
      e.preventDefault();
      appSettings.language = lg.getAttribute('data-lang');
      localStorage.setItem('appLanguage', appSettings.language);
      updateLabels();
    }
  });

  // Login modal
  const loginBtn = document.getElementById('loginBtn');
  const AUTH_KEY = 'authEmail';
  const setLoginLabel = ()=>{ if(loginBtn){ loginBtn.textContent = localStorage.getItem(AUTH_KEY) ? '🚪 Log Out' : '👤 Log In'; } };
  setLoginLabel();

  // Expose a robust opener that sits above all overlays
  window.openLoginModal = function openLoginModal(){
    const existing = localStorage.getItem(AUTH_KEY);
    if(existing){ localStorage.removeItem(AUTH_KEY); setLoginLabel(); notifySuccess('Logged out'); return; }

    try{
      // Remove any existing overlays so auth modal is unobstructed
      document.querySelectorAll('.checkout-overlay, .nlp-overlay, .video-overlay').forEach(el=>{ try{ el.remove(); }catch{} });
    }catch{}

    const overlay = document.createElement('div'); overlay.className = 'nlp-overlay'; overlay.setAttribute('role','dialog'); overlay.setAttribute('aria-label','Authentication');
    // High, but leave headroom for custom cursor to sit above
    overlay.style.zIndex = '2147483000';
    const modal = document.createElement('div'); modal.className = 'nlp-modal login-simple';
    modal.style.zIndex = '2147483001';
    const right = document.createElement('div'); right.className = 'nlp-right';
    const close = document.createElement('button'); close.className = 'nlp-close'; close.setAttribute('aria-label','Close'); close.textContent = '×';

      right.innerHTML = `
        <div class="auth-tabs" role="tablist" style="display:flex; gap:8px; margin-bottom:10px;">
          <button class="btn auth-tab active" data-view="login" role="tab" aria-selected="true" style="flex:1">Log In</button>
          <button class="btn auth-tab" data-view="register" role="tab" aria-selected="false" style="flex:1">Register</button>
        </div>
        <div class="auth-views">
          <div class="view login-view">
            <h2 class="nlp-title">Log In</h2>
            <form id="loginForm" class="nlp-form auth-form" aria-label="Login form" style="flex-direction:column">
              <div class="input-wrap">
                <span class="input-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 8l9 6 9-6"/></svg>
                </span>
                <input type="email" name="email" placeholder="Email address" required>
              </div>
              <div class="input-wrap">
                <span class="input-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input id="loginPassword" type="password" name="password" placeholder="Password" required>
                <button type="button" class="toggle-pass" aria-label="Show password">Show</button>
              </div>
              <div class="auth-row">
                <label class="remember"><input id="rememberMe" type="checkbox"> Remember Me</label>
                <a class="forgot" href="#">Forgot Password?</a>
              </div>
              <button id="loginSubmit" type="submit" class="btn btn-primary" style="width:100%" disabled>Log In</button>
            </form>
            <div class="auth-or">Or login with</div>
            <div class="auth-providers">
              <button type="button" class="btn btn-provider facebook"><span class="ico" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="#1877F2"><path d="M22 12a10 10 0 1 0-11.5 9.9v-7h-2v-3h2v-2.3c0-2 1.2-3.2 3-3.2.9 0 1.8.1 1.8.1v2h-1c-1 0-1.3.6-1.3 1.2V12h2.3l-.4 3h-1.9v7A10 10 0 0 0 22 12"/></svg>
              </span> FACEBOOK</button>
              <button type="button" class="btn btn-provider google"><span class="ico" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#EA4335" d="M12 10.2v3.6h5.1c-.2 1.2-1.5 3.6-5.1 3.6-3.1 0-5.7-2.6-5.7-5.8S8.9 5.8 12 5.8c1.8 0 3 .8 3.7 1.5l2.5-2.4C16.9 3.6 14.7 2.8 12 2.8 6.9 2.8 2.8 6.9 2.8 12S6.9 21.2 12 21.2c6.2 0 8.6-4.3 8.6-6.5 0-.4 0-.7-.1-1H12z"/></svg>
              </span> GOOGLE</button>
            </div>
          </div>
          <div class="view register-view" style="display:none;">
            <h2 class="nlp-title">Create Account</h2>
            <form id="registerForm" class="nlp-form auth-form" aria-label="Register form" style="flex-direction:column">
              <div class="input-wrap">
                <span class="input-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><circle cx="12" cy="7" r="4"/><path d="M6 21v-2a6 6 0 0 1 12 0v2"/></svg>
                </span>
                <input type="text" name="name" placeholder="Full name" required>
              </div>
              <div class="input-wrap">
                <span class="input-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 8l9 6 9-6"/></svg>
                </span>
                <input type="email" name="email" placeholder="Email address" required>
              </div>
              <div class="input-wrap">
                <span class="input-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input id="regPassword" type="password" name="password" placeholder="Password" required>
                <button type="button" class="toggle-pass" aria-label="Show password">Show</button>
              </div>
              <div class="input-wrap">
                <span class="input-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input id="regConfirm" type="password" name="confirm" placeholder="Confirm password" required>
                <button type="button" class="toggle-pass" aria-label="Show password">Show</button>
              </div>
              <button id="registerSubmit" type="submit" class="btn btn-primary" style="width:100%" disabled>Create Account</button>
            </form>
          </div>
        </div>`;
    modal.appendChild(right); modal.appendChild(close); overlay.appendChild(modal); document.body.appendChild(overlay);
    document.body.classList.add('modal-open');
    const remove = ()=>{ try{ overlay.remove(); document.body.classList.remove('modal-open'); }catch{} };
    close.addEventListener('click', remove);
    overlay.addEventListener('click', (e)=>{ if(e.target===overlay) remove(); });
    document.addEventListener('keydown', function onEsc(ev){ if(ev.key==='Escape'){ remove(); document.removeEventListener('keydown', onEsc);} });
      // Tabs logic
      const tabs = Array.from(right.querySelectorAll('.auth-tab'));
      const views = {
        login: right.querySelector('.login-view'),
        register: right.querySelector('.register-view')
      };
      const activate = (key)=>{
        tabs.forEach(t=>{
          const on = t.dataset.view===key; t.classList.toggle('active', on); t.setAttribute('aria-selected', on?'true':'false');
        });
        Object.entries(views).forEach(([k,el])=> el.style.display = (k===key? 'block' : 'none'));
      };
      tabs.forEach(t=> t.addEventListener('click', ()=> activate(t.dataset.view)));
      activate('login');

      // Login validation
      const loginForm = right.querySelector('#loginForm');
      const emailInput = loginForm.querySelector('input[type="email"]');
      const passInput = loginForm.querySelector('#loginPassword');
      const submitBtn = loginForm.querySelector('#loginSubmit');
      const toggleBtn = loginForm.querySelector('.toggle-pass');
      const syncValid = ()=>{ submitBtn.disabled = !(emailInput.value.trim() && passInput.value.trim()); };
      emailInput.addEventListener('input', syncValid);
      passInput.addEventListener('input', syncValid);
      toggleBtn.addEventListener('click', ()=>{
        const isPwd = passInput.type === 'password';
        passInput.type = isPwd ? 'text' : 'password';
        toggleBtn.textContent = isPwd ? 'Hide' : 'Show';
        toggleBtn.setAttribute('aria-label', isPwd ? 'Hide password' : 'Show password');
      });
      syncValid();
      // Focus email for quick entry
      try{ emailInput.focus(); }catch{}
      loginForm.addEventListener('submit', (e)=>{
        e.preventDefault();
        const email = loginForm.email.value.trim();
        const pass = loginForm.password.value.trim();
        if(!email || !pass) return;
        localStorage.setItem(AUTH_KEY, email);
        remove(); setLoginLabel(); notifySuccess('Logged in successfully');
        // If checkout was requested pre-login, open it now
        try{
          if(sessionStorage.getItem('checkoutAfterLogin')==='1'){
            sessionStorage.removeItem('checkoutAfterLogin');
            setTimeout(()=>{ if(window.openCheckoutOverlay) window.openCheckoutOverlay(); }, 150);
          }
        }catch{}
      });

      // Register validation
      const regForm = right.querySelector('#registerForm');
      const regEmail = regForm.querySelector('input[type="email"]');
      const regName = regForm.querySelector('input[name="name"]');
      const regPass = regForm.querySelector('#regPassword');
      const regConfirm = regForm.querySelector('#regConfirm');
      const regSubmit = regForm.querySelector('#registerSubmit');
      const regToggles = Array.from(regForm.querySelectorAll('.toggle-pass'));
      const syncReg = ()=>{
        const ok = regEmail.value.trim() && regName.value.trim() && regPass.value.trim() && regConfirm.value.trim() && (regPass.value === regConfirm.value);
        regSubmit.disabled = !ok;
      };
      [regEmail, regName, regPass, regConfirm].forEach(i=> i.addEventListener('input', syncReg));
      regToggles.forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const input = btn.previousElementSibling; // the input before toggle button
          if(!input) return; const isPwd = input.type==='password';
          input.type = isPwd? 'text' : 'password';
          btn.textContent = isPwd? 'Hide' : 'Show';
          btn.setAttribute('aria-label', isPwd? 'Hide password' : 'Show password');
        });
      });
      syncReg();
      regForm.addEventListener('submit', (e)=>{
        e.preventDefault();
        if(regSubmit.disabled) return;
        const email = regEmail.value.trim();
        // Demo: treat registration as authenticated session
        localStorage.setItem(AUTH_KEY, email);
        remove(); setLoginLabel(); notifySuccess('Account created');
        // Resume checkout if it was requested
        try{
          if(sessionStorage.getItem('checkoutAfterLogin')==='1'){
            sessionStorage.removeItem('checkoutAfterLogin');
            setTimeout(()=>{ if(window.openCheckoutOverlay) window.openCheckoutOverlay(); }, 150);
          }
        }catch{}
      });
    return overlay;
  };

  if(loginBtn){
    loginBtn.addEventListener('click', ()=>{
      // Delegate to the robust opener (it handles logout if already logged in)
      window.openLoginModal();
    });
  }
})();

// Theme toggle (persisted across pages)
(function themeToggle(){
  try{
    const btn = document.getElementById('themeToggle');
    const apply = (mode)=>{
      document.body.setAttribute('data-theme', mode);
      localStorage.setItem('appTheme', mode);
      if(btn){
        const dark = mode === 'dark';
        btn.textContent = dark ? '☀️ Light' : '🌙 Dark';
        btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
        btn.title = dark ? 'Switch to light theme' : 'Switch to dark theme';
      }
    };
    const saved = localStorage.getItem('appTheme') || 'light';
    apply(saved);
    if(btn){
      btn.addEventListener('click', ()=>{
        const current = document.body.getAttribute('data-theme') || 'light';
        apply(current === 'dark' ? 'light' : 'dark');
      });
    }
  }catch{ /* no-op */ }
})();

// Ensure shop grid toolbar visibility on load even if earlier script missed (defensive)
document.addEventListener('DOMContentLoaded', ()=>{
  try{
    const toolbar = document.querySelector('.filters-toolbar');
    if(toolbar){
      const isGrid = document.body.classList.contains('shop-layout-grid');
      toolbar.style.display = isGrid ? 'block' : 'none';
      toolbar.setAttribute('aria-hidden', isGrid ? 'false' : 'true');
    }
  }catch{}
});

// Image overlap interactions: click to bring forward/overlap
(function imageOverlapClicks(){
  // Bring clicked about photo to front
  document.addEventListener('click', (e)=>{
    const aboutImg = e.target.closest('.about-photos img');
    if(aboutImg){
      const wrap = aboutImg.closest('.about-photos');
      if(wrap){ wrap.querySelectorAll('img').forEach(img=> img.classList.remove('top')); }
      aboutImg.classList.add('top');
      return; // allow default behavior otherwise
    }
  });

  // Raise clicked slider item above neighbors briefly
  document.addEventListener('mousedown', (e)=>{
    const item = e.target.closest('.product-slider .ps-item');
    if(!item) return;
    const track = item.parentElement;
    // clear current raise
    Array.from(track.children).forEach(ch=> ch.classList && ch.classList.remove('raise'));
    item.classList.add('raise');
    // auto-remove after a short while to avoid sticky state
    setTimeout(()=>{ try{ item.classList.remove('raise'); }catch{} }, 900);
  });
})();
