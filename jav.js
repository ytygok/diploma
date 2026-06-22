// ============================================================
//  CHRISTIAN JEWELRY — Main JS  v6
//  USE_SERVER = false  →  localStorage
//  USE_SERVER = true   →  REST API localhost:3000
// ============================================================

const USE_SERVER = false;
const API_URL    = 'http://localhost:3000/api';

// ════════════════════════════════════════════════════════════
//  DB LAYER
// ════════════════════════════════════════════════════════════
const DB = USE_SERVER ? {
    _userId: () => { const u=JSON.parse(sessionStorage.getItem('cj_current')||'null'); return u?u.id:null; },
    _headers() { const h={'Content-Type':'application/json'}; const id=this._userId(); if(id) h['x-user-id']=id; return h; },
    async getProducts(cat){ const u=cat?`${API_URL}/products?category=${cat}`:`${API_URL}/products`; return (await fetch(u)).json(); },
    async addProduct(d){ return (await fetch(`${API_URL}/products`,{method:'POST',headers:this._headers(),body:JSON.stringify(d)})).json(); },
    async updateProduct(id,d){ return (await fetch(`${API_URL}/products/${id}`,{method:'PUT',headers:this._headers(),body:JSON.stringify(d)})).json(); },
    async deleteProduct(id){ return (await fetch(`${API_URL}/products/${id}`,{method:'DELETE',headers:this._headers()})).json(); },
    async login(e,p){ return (await fetch(`${API_URL}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:e,password:p})})).json(); },
    async register(d){ return (await fetch(`${API_URL}/auth/register`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)})).json(); },
    async updateProfile(id,d){ return (await fetch(`${API_URL}/users/${id}`,{method:'PUT',headers:this._headers(),body:JSON.stringify(d)})).json(); },
    async getUsers(){ return (await fetch(`${API_URL}/users`,{headers:this._headers()})).json(); },
    async getOrders(){ return (await fetch(`${API_URL}/orders`,{headers:this._headers()})).json(); },
    async getUserOrders(uid){ return (await fetch(`${API_URL}/orders?userId=${uid}`,{headers:this._headers()})).json(); },
    async addOrder(d){ return (await fetch(`${API_URL}/orders`,{method:'POST',headers:this._headers(),body:JSON.stringify(d)})).json(); },
    async updateOrder(id,d){ return (await fetch(`${API_URL}/orders/${id}`,{method:'PATCH',headers:this._headers(),body:JSON.stringify(d)})).json(); },
    async cancelOrder(id){ return (await fetch(`${API_URL}/orders/${id}/cancel`,{method:'POST',headers:this._headers()})).json(); },
    async addHistory(productId){ return (await fetch(`${API_URL}/history`,{method:'POST',headers:this._headers(),body:JSON.stringify({productId})})).json(); },
    async getHistory(){ return (await fetch(`${API_URL}/history`,{headers:this._headers()})).json(); },
    // Wishlist, Reviews, Messages — server stubs (implement on backend as needed)
    async toggleWishlist(pid){ return (await fetch(`${API_URL}/wishlist/${pid}`,{method:'POST',headers:this._headers()})).json(); },
    async getWishlist(){ return (await fetch(`${API_URL}/wishlist`,{headers:this._headers()})).json(); },
    async addReview(d){ return (await fetch(`${API_URL}/reviews`,{method:'POST',headers:this._headers(),body:JSON.stringify(d)})).json(); },
    async getReviews(pid){ return (await fetch(`${API_URL}/reviews?productId=${pid}`)).json(); },
    async sendMessage(d){ return (await fetch(`${API_URL}/messages`,{method:'POST',headers:this._headers(),body:JSON.stringify(d)})).json(); },
    async getMessages(uid){ return (await fetch(`${API_URL}/messages?userId=${uid}`,{headers:this._headers()})).json(); },
    async getAllMessages(){ return (await fetch(`${API_URL}/messages`,{headers:this._headers()})).json(); },
} : {
    _get: k => JSON.parse(localStorage.getItem(k)||'[]'),
    _set: (k,v) => localStorage.setItem(k,JSON.stringify(v)),

    async getProducts(cat){ const all=this._get('cj_products'); return cat?all.filter(p=>p.category===cat):all; },
    async addProduct(d){ const list=this._get('cj_products'); const p={id:uid(),...d,createdAt:now()}; list.push(p); this._set('cj_products',list); return {success:true,product:p}; },
    async updateProduct(id,d){ const list=this._get('cj_products'); const i=list.findIndex(p=>p.id===id); if(i<0) return {error:'Не знайдено'}; list[i]={...list[i],...d,updatedAt:now()}; this._set('cj_products',list); return {success:true,product:list[i]}; },
    async deleteProduct(id){ this._set('cj_products',this._get('cj_products').filter(p=>p.id!==id)); return {success:true}; },

    async login(email,password){
        const u=this._get('cj_users').find(u=>u.email===email&&u.password===password);
        if(!u) return {error:'Невірний email або пароль'};
        const {password:_,...safe}=u; return {success:true,user:safe};
    },
    async register(d){
        const users=this._get('cj_users');
        if(users.find(u=>u.email===d.email)) return {error:'Цей email вже зареєстрований'};
        const nu={id:uid(),...d,role:'user',createdAt:now()};
        users.push(nu); this._set('cj_users',users);
        const {password:_,...safe}=nu; return {success:true,user:safe};
    },
    async updateProfile(id,d){
        const users=this._get('cj_users');
        const i=users.findIndex(u=>u.id===id); if(i<0) return {error:'Не знайдено'};
        if(!d.password) d.password=users[i].password;
        users[i]={...users[i],...d,updatedAt:now()};
        this._set('cj_users',users);
        const {password:_,...safe}=users[i]; return {success:true,user:safe};
    },
    async getUsers(){ return this._get('cj_users').filter(u=>u.role!=='admin').map(({password:_,...u})=>u); },

    async getOrders(){ return this._get('cj_orders'); },
    async getUserOrders(uid){ return this._get('cj_orders').filter(o=>o.userId===uid); },
    async addOrder(d){
        const orders=this._get('cj_orders');
        const o={id:uid(),...d,status:'new',createdAt:now()};
        orders.push(o); this._set('cj_orders',orders); return {success:true,orderId:o.id};
    },
    async updateOrder(id,d){
        const orders=this._get('cj_orders');
        const i=orders.findIndex(o=>o.id===id); if(i<0) return {error:'Не знайдено'};
        if(orders[i].status!=='new') return {error:'Замовлення вже в роботі — зміни неможливі'};
        orders[i]={...orders[i],...d,updatedAt:now()};
        this._set('cj_orders',orders); return {success:true,order:orders[i]};
    },
    async cancelOrder(id){
        const orders=this._get('cj_orders');
        const i=orders.findIndex(o=>o.id===id); if(i<0) return {error:'Не знайдено'};
        if(orders[i].status==='done') return {error:'Виконане замовлення не можна скасувати'};
        orders[i].status='cancelled'; orders[i].updatedAt=now();
        this._set('cj_orders',orders); return {success:true};
    },

    // ── Wishlist ─────────────────────────────────────────────
    async toggleWishlist(productId){
        if(!currentUser) return {error:'Не авторизовано'};
        const key=`cj_wishlist_${currentUser.id}`;
        let list=JSON.parse(localStorage.getItem(key)||'[]');
        const idx=list.indexOf(productId);
        if(idx>=0) list.splice(idx,1); else list.unshift(productId);
        localStorage.setItem(key,JSON.stringify(list));
        return {success:true, added:idx<0};
    },
    async getWishlist(){
        if(!currentUser) return [];
        const key=`cj_wishlist_${currentUser.id}`;
        const ids=JSON.parse(localStorage.getItem(key)||'[]');
        const products=this._get('cj_products');
        return ids.map(id=>products.find(p=>p.id===id)).filter(Boolean);
    },
    isWishlisted(productId){
        if(!currentUser) return false;
        const key=`cj_wishlist_${currentUser.id}`;
        const list=JSON.parse(localStorage.getItem(key)||'[]');
        return list.includes(productId);
    },

    // ── Reviews ──────────────────────────────────────────────
    async addReview(d){
        const reviews=this._get('cj_reviews');
        // один відгук на продукт від одного користувача
        const existing=reviews.findIndex(r=>r.productId===d.productId&&r.userId===d.userId);
        if(existing>=0){ reviews[existing]={...reviews[existing],...d,updatedAt:now()}; }
        else { reviews.push({id:uid(),...d,createdAt:now()}); }
        this._set('cj_reviews',reviews); return {success:true};
    },
    async getReviews(productId){
        return this._get('cj_reviews').filter(r=>r.productId===productId);
    },

    // ── Messages (user ↔ admin) ───────────────────────────────
    async sendMessage(d){
        const msgs=this._get('cj_messages');
        msgs.push({id:uid(),...d,read:false,createdAt:now()});
        this._set('cj_messages',msgs); return {success:true};
    },
    async getMessages(userId){
        return this._get('cj_messages').filter(m=>m.userId===userId);
    },
    async getAllMessages(){
        return this._get('cj_messages');
    },
    async markMessagesRead(userId){
        // mark admin replies as read by user
        const msgs=this._get('cj_messages');
        msgs.forEach(m=>{ if(m.userId===userId&&m.fromAdmin) m.read=true; });
        this._set('cj_messages',msgs); return {success:true};
    },

    // ── History ──────────────────────────────────────────────
    async addHistory(productId){
        if(!currentUser) return;
        const key=`cj_history_${currentUser.id}`;
        let hist=JSON.parse(localStorage.getItem(key)||'[]');
        hist=hist.filter(h=>h.productId!==productId);
        hist.unshift({productId,viewedAt:now()});
        if(hist.length>50) hist=hist.slice(0,50);
        localStorage.setItem(key,JSON.stringify(hist));
        return {success:true};
    },
    async getHistory(){
        if(!currentUser) return [];
        const key=`cj_history_${currentUser.id}`;
        const hist=JSON.parse(localStorage.getItem(key)||'[]');
        const products=this._get('cj_products');
        return hist.map(h=>({...h,product:products.find(p=>p.id===h.productId)||null})).filter(h=>h.product);
    },
    async clearHistory(){
        if(!currentUser) return;
        localStorage.removeItem(`cj_history_${currentUser.id}`);
        return {success:true};
    },

    exportJSON(){
        const data={exportedAt:now(),users:this._get('cj_users'),products:this._get('cj_products'),orders:this._get('cj_orders')};
        const a=document.createElement('a');
        a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
        a.download='cj_backup_'+new Date().toISOString().slice(0,10)+'.json'; a.click();
    }
};

// ════════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════════
function uid()  { return Date.now().toString(36)+Math.random().toString(36).slice(2); }
function now()  { return new Date().toISOString(); }
function esc(s) { if(!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function fmtDate(iso)     { return iso ? new Date(iso).toLocaleDateString('uk-UA',{day:'2-digit',month:'2-digit',year:'numeric'}) : '—'; }
function fmtDateTime(iso) { return iso ? new Date(iso).toLocaleString('uk-UA',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—'; }

// ════════════════════════════════════════════════════════════
//  SEED ADMIN
// ════════════════════════════════════════════════════════════
if(!USE_SERVER){
    const users=JSON.parse(localStorage.getItem('cj_users')||'[]');
    if(!users.find(u=>u.email==='admin@christianjewelry.ua')){
        users.push({id:'admin',name:'Адмін',surname:'',phone:'',email:'admin@christianjewelry.ua',password:'admin123',role:'admin',createdAt:now()});
        localStorage.setItem('cj_users',JSON.stringify(users));
    }
}

// ════════════════════════════════════════════════════════════
//  SESSION
// ════════════════════════════════════════════════════════════
let currentUser = JSON.parse(sessionStorage.getItem('cj_current')||'null');

// ════════════════════════════════════════════════════════════
//  CATEGORIES
// ════════════════════════════════════════════════════════════
const CATEGORIES = {
    rings:'Каблучки / Перстні', earrings:'Сережки', pendants:'Підвіски',
    bracelets:'Браслети', necklaces:"Коль'є", brooches:'Брошки', custom:'Індивідуальне',
};
let currentCategory = null;

// ════════════════════════════════════════════════════════════
//  PAGES + HISTORY API
// ════════════════════════════════════════════════════════════
function showPage(name, pushState=true) {
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    document.querySelectorAll('.nav__link').forEach(l=>l.classList.remove('active'));
    const page=document.getElementById('page-'+name);
    if(page) page.classList.add('active');
    // highlight nav
    document.querySelectorAll('.nav__link').forEach(l=>{
        if(l.getAttribute('onclick')&&l.getAttribute('onclick').includes(`'${name}'`)) l.classList.add('active');
    });
    window.scrollTo(0,0);
    if(name==='home') renderHomeCatalog();
    if(name==='profile') renderProfilePage();
    if(pushState) history.pushState({page:name,category:null},'','#'+name);
}

function showCategory(catKey, pushState=true){
    currentCategory=catKey;
    document.getElementById('categoryTitle').textContent=CATEGORIES[catKey]||catKey;
    // set category filter and load
    document.getElementById('filterCategory').value=catKey;
    renderCategoryProducts(catKey);
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    document.getElementById('page-category').classList.add('active');
    window.scrollTo(0,0);
    if(pushState) history.pushState({page:'category',category:catKey},'','#category-'+catKey);
}

window.addEventListener('popstate',e=>{
    const s=e.state;
    if(!s){showPage('home',false);return;}
    if(s.page==='category'&&s.category) showCategory(s.category,false);
    else showPage(s.page||'home',false);
});

// ════════════════════════════════════════════════════════════
//  CARD BUILDER
// ════════════════════════════════════════════════════════════
const PLACEHOLDER=`data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><rect fill='%23f0f0f0' width='400' height='400'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23bbb' font-size='60'>✦</text></svg>`;

function getMedia(p){ if(p.media&&p.media.length) return p.media; if(p.img) return [{type:'image',src:p.img}]; return []; }

function buildCard(p, showBadge) {
    const role=currentUser?currentUser.role:'guest';
    const badge=showBadge?`<div class="product-card__cat-badge">${esc(CATEGORIES[p.category]||p.category)}</div>`:'';
    const orderBtn=role!=='guest'&&role!=='admin'?`<button class="btn-sm" onclick="openOrderModal('${esc(p.name)}')">Замовити</button>`:'';
    const editBtn=role==='admin'?`<button class="btn-sm warning" onclick="openEditModal('${esc(p.id)}')">Редагувати</button>`:'';
    const delBtn=role==='admin'?`<button class="btn-sm danger" onclick="deleteProduct('${esc(p.id)}')">Видалити</button>`:'';
    const actions=(orderBtn||editBtn||delBtn)?`<div class="product-card__actions">${orderBtn}${editBtn}${delBtn}</div>`:'';
    const price=p.price?`<div class="product-card__price">${Number(p.price).toLocaleString('uk-UA')} грн</div>`:'';
    const media=getMedia(p);
    const firstSrc=media.length?media[0].src:PLACEHOLDER;
    const isVideo=media.length&&media[0].type==='video';
    const countBadge=media.length>1?`<div class="product-card__media-count">▶ ${media.length} фото/відео</div>`:'';
    const mediaEl=isVideo
        ?`<video src="${esc(firstSrc)}" muted playsinline preload="metadata" style="width:100%;height:100%;object-fit:cover;"></video>`
        :`<img src="${esc(firstSrc)}" alt="${esc(p.name)}" onerror="this.src='${PLACEHOLDER}'">`;

    // Wishlist button — тільки для авторизованих користувачів (не адмін)
    const isWished=currentUser&&currentUser.role!=='admin'&&DB.isWishlisted&&DB.isWishlisted(p.id);
    const wishBtn=(currentUser&&currentUser.role!=='admin')?
        `<button class="product-card__wishlist${isWished?' active':''}" id="wb-${esc(p.id)}" onclick="toggleWishlist('${esc(p.id)}',this)" title="${isWished?'Прибрати з вибраного':'Додати до вибраного'}">${isWished?'♥':'♡'}</button>`:'';

    return `<div class="product-card" data-id="${esc(p.id)}">
        ${badge}
        ${wishBtn}
        <div class="product-card__img" onclick="trackAndOpenLightbox('${esc(p.id)}')">
            ${mediaEl}${countBadge}
        </div>
        <div class="product-card__info">
            <div class="product-card__name">${esc(p.name)}</div>
            ${p.material?`<div class="product-card__material">${esc(p.material)}</div>`:''}
            ${p.desc?`<div class="product-card__desc">${esc(p.desc)}</div>`:''}
            ${price}${actions}
        </div>
    </div>`;
}

// Записуємо перегляд і відкриваємо лайтбокс
async function trackAndOpenLightbox(productId) {
    if(currentUser) await DB.addHistory(productId);
    openLightbox(productId, 0);
}

// ════════════════════════════════════════════════════════════
//  WISHLIST
// ════════════════════════════════════════════════════════════
async function toggleWishlist(productId, btnEl) {
    if(!currentUser){ showNotif('Для додавання до вибраного потрібно увійти','error'); openAuthModal(); return; }
    const r=await DB.toggleWishlist(productId);
    if(r.error){ showNotif(r.error,'error'); return; }
    const added=r.added;
    // Оновлюємо всі кнопки для цього продукту на сторінці
    document.querySelectorAll(`#wb-${productId}`).forEach(btn=>{
        btn.textContent=added?'♥':'♡';
        btn.title=added?'Прибрати з вибраного':'Додати до вибраного';
        btn.classList.toggle('active',added);
    });
    showNotif(added?'Додано до вибраного ♥':'Видалено з вибраного','success');
}

async function renderMyWishlist(container){
    const items=await DB.getWishlist();
    if(!items.length){
        container.innerHTML=`<div class="profile-empty"><p>У вас поки немає вибраних виробів.</p><p style="font-size:12px;margin-top:8px;color:var(--text-muted)">Натисніть ♡ на будь-якому виробі щоб зберегти його тут.</p></div>`;
        return;
    }
    const cards=items.map(p=>{
        const media=getMedia(p);
        const src=media.length?media[0].src:PLACEHOLDER;
        return `<div class="history-card">
            <div class="history-card__img" onclick="trackAndOpenLightbox('${esc(p.id)}')">
                <img src="${esc(src)}" alt="${esc(p.name)}" onerror="this.src='${PLACEHOLDER}'">
            </div>
            <div class="history-card__info">
                <div class="history-card__name">${esc(p.name)}</div>
                ${p.price?`<div class="history-card__price">${Number(p.price).toLocaleString('uk-UA')} грн</div>`:''}
                ${p.material?`<div class="history-card__time">${esc(p.material)}</div>`:''}
                <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;">
                    <button class="btn-sm" onclick="openOrderModal('${esc(p.name)}')">Замовити</button>
                    <button class="btn-sm danger" onclick="toggleWishlist('${esc(p.id)}',this);renderProfileTab('wishlist')">♡ Прибрати</button>
                </div>
            </div>
        </div>`;
    }).join('');
    container.innerHTML=`<div class="history-grid">${cards}</div>`;
}

// ════════════════════════════════════════════════════════════
//  LIGHTBOX
// ════════════════════════════════════════════════════════════
let _lbProducts=[]; let _lbMedia=[]; let _lbIndex=0; let _lbCurrentProductId=null;

async function openLightbox(productId, startIndex) {
    if(!_lbProducts.length) _lbProducts=await DB.getProducts();
    const p=_lbProducts.find(x=>x.id===productId); if(!p) return;
    _lbMedia=getMedia(p); if(!_lbMedia.length) return;
    _lbCurrentProductId=productId;
    _lbIndex=startIndex||0; renderLightbox(); openModal('lightboxModal');
    document.addEventListener('keydown',_lbKeyHandler);
    renderLightboxReviews(productId);
}

function closeLightbox(){
    closeModal('lightboxModal');
    document.removeEventListener('keydown',_lbKeyHandler);
    const vid=document.querySelector('#lightboxMedia video'); if(vid) vid.pause();
    _lbCurrentProductId=null;
}
function _lbKeyHandler(e){ if(e.key==='ArrowLeft') lightboxNav(-1); if(e.key==='ArrowRight') lightboxNav(1); if(e.key==='Escape') closeLightbox(); }
function lightboxNav(dir){ _lbIndex=(_lbIndex+dir+_lbMedia.length)%_lbMedia.length; renderLightbox(); }
function lightboxGoTo(idx){ _lbIndex=idx; renderLightbox(); }

function renderLightbox(){
    const item=_lbMedia[_lbIndex];
    const mediaEl=document.getElementById('lightboxMedia');
    const oldVid=mediaEl.querySelector('video'); if(oldVid) oldVid.pause();
    mediaEl.innerHTML=item.type==='video'
        ?`<video src="${esc(item.src)}" controls autoplay playsinline style="max-width:100%;max-height:72vh;"></video>`
        :`<img src="${esc(item.src)}" alt="Фото" style="max-width:100%;max-height:72vh;object-fit:contain;">`;
    document.getElementById('lightboxCounter').textContent=`${_lbIndex+1} / ${_lbMedia.length}`;
    document.getElementById('lightboxThumbs').innerHTML=_lbMedia.map((m,i)=>
        m.type==='video'
            ?`<div class="lightbox__thumb-video ${i===_lbIndex?'active':''}" onclick="lightboxGoTo(${i})">▶</div>`
            :`<img class="lightbox__thumb ${i===_lbIndex?'active':''}" src="${esc(m.src)}" onclick="lightboxGoTo(${i})">`
    ).join('');
    document.querySelector('.lightbox__nav--prev').style.display=_lbMedia.length>1?'':'none';
    document.querySelector('.lightbox__nav--next').style.display=_lbMedia.length>1?'':'none';
}

// ════════════════════════════════════════════════════════════
//  REVIEWS (in lightbox)
// ════════════════════════════════════════════════════════════
let _reviewRating=5;

async function renderLightboxReviews(productId){
    const wrap=document.getElementById('lbReviews');
    const reviews=await DB.getReviews(productId);

    const stars=n=>['★','★','★','★','★'].map((s,i)=>`<span style="color:${i<n?'var(--gold)':'rgba(255,255,255,.2)'}">${s}</span>`).join('');

    const reviewsHtml=reviews.length
        ? reviews.map(r=>`
            <div class="review-card">
                <div class="review-card__head">
                    <span class="review-card__author">${esc(r.userName)}</span>
                    <span class="review-card__date">${fmtDate(r.createdAt||r.updatedAt)}</span>
                </div>
                <div class="review-card__stars">${stars(r.rating||5)}</div>
                <div class="review-card__text">${esc(r.text)}</div>
            </div>`).join('')
        : '<p style="font-size:12px;color:rgba(255,255,255,.3);margin-bottom:12px;">Відгуків ще немає — будьте першим!</p>';

    const formHtml=currentUser&&currentUser.role!=='admin'?`
        <div class="review-form">
            <div class="review-form__title">Залишити відгук</div>
            <div class="review-stars-input" id="reviewStars">
                ${[1,2,3,4,5].map(n=>`<button class="review-star${n<=_reviewRating?' active':''}" onclick="setReviewRating(${n},this.parentNode)">${n<=_reviewRating?'★':'☆'}</button>`).join('')}
            </div>
            <textarea class="review-text-input" id="reviewText" placeholder="Ваш відгук про виріб..."></textarea>
            <button class="review-submit" onclick="submitReview('${esc(productId)}')">✓ Опублікувати відгук</button>
        </div>` : '';

    wrap.innerHTML=`
        <div class="lb-reviews__title">Відгуки (${reviews.length})</div>
        ${reviewsHtml}
        ${formHtml}`;
    _reviewRating=5;
}

function setReviewRating(n, container){
    _reviewRating=n;
    container.querySelectorAll('.review-star').forEach((btn,i)=>{
        btn.textContent=i<n?'★':'☆';
        btn.classList.toggle('active',i<n);
    });
}

async function submitReview(productId){
    if(!currentUser){ showNotif('Потрібно увійти','error'); return; }
    const text=document.getElementById('reviewText').value.trim();
    if(!text){ showNotif('Напишіть текст відгуку','error'); return; }
    await DB.addReview({productId,userId:currentUser.id,userName:currentUser.name+' '+currentUser.surname,text,rating:_reviewRating});
    showNotif('Відгук опубліковано!','success');
    renderLightboxReviews(productId);
}

// ════════════════════════════════════════════════════════════
//  FILTER FUNCTIONS - ДОМАШНЯ СТОРІНКА
// ════════════════════════════════════════════════════════════

function populateMaterialFilterHome(products){
    const sel=document.getElementById('homeFilterMaterial');
    const cur=sel.value;
    const materials=[...new Set(products.map(p=>p.material).filter(Boolean))].sort();
    sel.innerHTML='<option value="">Усі матеріали</option>'+materials.map(m=>`<option value="${m}">${m}</option>`).join('');
    if(materials.includes(cur)) sel.value=cur;
}

function populateGemstonesFilterHome(products){
    const sel=document.getElementById('homeFilterGemstones');
    const cur=sel.value;
    const gemstones=[...new Set(products
        .map(p=>(p.extras||'').split(',').map(e=>e.trim()).filter(Boolean))
        .flat()
    )].sort();
    sel.innerHTML='<option value="">Усі камені</option>'+gemstones.map(g=>`<option value="${g}">${g}</option>`).join('');
    if(gemstones.includes(cur)) sel.value=cur;
}

function applyHomeFilters(){
    const catFilter=(document.getElementById('homeFilterCategory').value||'').toLowerCase();
    const matFilter=(document.getElementById('homeFilterMaterial').value||'').toLowerCase();
    const minPrice=parseFloat(document.getElementById('homeFilterPriceMin').value)||0;
    const maxPrice=parseFloat(document.getElementById('homeFilterPriceMax').value)||Infinity;

    let filtered=_lbProducts.filter(p=>{
        const price=p.price?Number(p.price):0;
        const catOk=!catFilter||( p.category&&p.category.toLowerCase().includes(catFilter) );
        const matOk=!matFilter||( p.material&&p.material.toLowerCase().includes(matFilter) );
        const priceOk=price>=minPrice&&price<=maxPrice;
        return catOk&&matOk&&priceOk;
    });

    const grid=document.getElementById('homeCatalogGrid');
    const countEl=document.getElementById('homeFilterCount');
    if(!filtered.length){
        grid.innerHTML=`<div class="empty-state" style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);"><h3>Нічого не знайдено</h3><p>Спробуйте змінити параметри фільтра.</p></div>`;
        countEl.textContent='';
    } else {
        grid.innerHTML=filtered.map(p=>buildCard(p,true)).join('');
        countEl.textContent=`Знайдено: ${filtered.length} виріб${filtered.length===1?'':'ів'}`;
    }
}

function resetHomeFilters(){
    document.getElementById('homeFilterMaterial').value='';
    document.getElementById('homeFilterGemstones').value='';
    document.getElementById('homeFilterPriceMin').value='';
    document.getElementById('homeFilterPriceMax').value='';
    applyHomeFilters();
}

// ════════════════════════════════════════════════════════════
//  HOME CATALOG
// ════════════════════════════════════════════════════════════
async function renderHomeCatalog(){
    const grid=document.getElementById('homeCatalogGrid');
    grid.innerHTML='<div class="home-catalog__empty"><p>Завантаження...</p></div>';
    try{
        const products=await DB.getProducts();
        _lbProducts=products;
        if(!products.length){ grid.innerHTML=`<div class="home-catalog__empty"><h3>Каталог порожній</h3><p>Адміністратор ще не додав жодного виробу.</p></div>`; return; }
        // Заповнюємо фільтри та показуємо товари
        populateMaterialFilterHome(products);
        applyHomeFilters();
    }catch(e){ grid.innerHTML='<div class="home-catalog__empty"><p>Помилка завантаження.</p></div>'; }
}

// ════════════════════════════════════════════════════════════
//  CATEGORY PAGE + FILTERS
// ════════════════════════════════════════════════════════════
let _allCategoryProducts = [];

async function renderCategoryProducts(catKey){
    const grid=document.getElementById('productsGrid');
    grid.innerHTML='<div class="empty-state"><p>Завантаження...</p></div>';
    try{
        // Якщо є конкретна категорія — грузимо її, інакше всі
        const products=catKey?await DB.getProducts(catKey):await DB.getProducts();
        _allCategoryProducts=products;
        products.forEach(p=>{ if(!_lbProducts.find(x=>x.id===p.id)) _lbProducts.push(p); });

        // Заповнюємо список матеріалів
        populateMaterialFilter(products);
        applyFilters();
    }catch(e){ grid.innerHTML='<div class="empty-state"><p>Помилка завантаження.</p></div>'; }
}

function populateMaterialFilter(products){
    const sel=document.getElementById('filterMaterial');
    const cur=sel.value;
    const materials=[...new Set(products.map(p=>p.material).filter(Boolean))].sort();
    sel.innerHTML='<option value="">Усі матеріали</option>'+materials.map(m=>`<option value="${esc(m)}">${esc(m)}</option>`).join('');
    if(materials.includes(cur)) sel.value=cur;
}

function applyFilters(){
    const catFilter=document.getElementById('filterCategory').value;
    const matFilter=document.getElementById('filterMaterial').value.toLowerCase();
    const minPrice=parseFloat(document.getElementById('filterPriceMin').value)||0;
    const maxPrice=parseFloat(document.getElementById('filterPriceMax').value)||Infinity;

    // Якщо категорія змінилась — підвантажуємо нові товари
    const loadCat=catFilter||null;
    if(loadCat!==currentCategory){
        currentCategory=loadCat;
        document.getElementById('categoryTitle').textContent=loadCat?(CATEGORIES[loadCat]||loadCat):'Усі вироби';
        // Перезавантаження без рекурсії через флаг
        _allCategoryProducts=[];
        renderCategoryProducts(loadCat);
        return;
    }

    let filtered=_allCategoryProducts.filter(p=>{
        const price=p.price?Number(p.price):0;
        const matOk=!matFilter||( p.material&&p.material.toLowerCase().includes(matFilter) );
        const priceOk=price>=minPrice&&price<=maxPrice;
        return matOk&&priceOk;
    });

    const grid=document.getElementById('productsGrid');
    const countEl=document.getElementById('filterCount');
    if(!filtered.length){
        grid.innerHTML=`<div class="empty-state"><h3>Нічого не знайдено</h3><p>Спробуйте змінити параметри фільтра.</p></div>`;
        countEl.textContent='';
    } else {
        grid.innerHTML=filtered.map(p=>buildCard(p,!catFilter)).join('');
        countEl.textContent=`Знайдено: ${filtered.length} виріб${filtered.length===1?'':'ів'}`;
    }
}

function resetFilters(){
    document.getElementById('filterMaterial').value='';
    document.getElementById('filterPriceMin').value='';
    document.getElementById('filterPriceMax').value='';
    // Не скидаємо категорію — лише матеріал і ціну
    applyFilters();
}

// ════════════════════════════════════════════════════════════
//  PROFILE PAGE
// ════════════════════════════════════════════════════════════
async function renderProfilePage(){
    if(!currentUser){ showPage('home'); return; }
    const activeTab=document.querySelector('.profile-tab.active');
    const tab=activeTab?activeTab.dataset.tab:'orders';
    renderProfileTab(tab);
}

function switchProfileTab(tab){
    document.querySelectorAll('.profile-tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===tab));
    renderProfileTab(tab);
}

async function renderProfileTab(tab){
    document.getElementById('profileName').textContent=`${currentUser.name} ${currentUser.surname}`;
    document.getElementById('profileEmail').textContent=currentUser.email;
    document.getElementById('profilePhone').textContent=currentUser.phone||'—';

    const content=document.getElementById('profileContent');
    content.innerHTML='<p style="padding:20px;color:var(--text-muted)">Завантаження...</p>';

    if(tab==='orders')   await renderMyOrders(content);
    if(tab==='wishlist') await renderMyWishlist(content);
    if(tab==='history')  await renderMyHistory(content);
    if(tab==='settings') renderMySettings(content);
}

// ── МОЇ ЗАМОВЛЕННЯ ──────────────────────────────────────────
const STATUS_LABEL = {new:'🆕 Нове',in_progress:'🔧 В роботі',done:'✅ Виконано',cancelled:'❌ Скасовано'};
const STATUS_COLOR = {new:'var(--accent)',in_progress:'var(--gold)',done:'var(--green)',cancelled:'var(--red)'};

async function renderMyOrders(container){
    const orders=await DB.getUserOrders(currentUser.id);
    if(!orders.length){
        container.innerHTML=`<div class="profile-empty"><p>У вас ще немає замовлень.</p><button class="form-submit" style="max-width:240px;margin-top:16px" onclick="openOrderModal()">Зробити замовлення</button></div>`;
        return;
    }
    container.innerHTML=[...orders].reverse().map(o=>`
        <div class="order-card" id="oc-${o.id}">
            <div class="order-card__head">
                <div>
                    <span class="order-card__id">№ ${o.id.slice(-6).toUpperCase()}</span>
                    <span class="order-card__date">${fmtDateTime(o.createdAt)}</span>
                </div>
                <span class="order-card__status" style="color:${STATUS_COLOR[o.status]||'var(--text-muted)'}">
                    ${STATUS_LABEL[o.status]||o.status}
                </span>
            </div>
            <div class="order-card__body">
                <div class="order-card__row"><span>Виріб:</span><b>${esc(o.product)}</b></div>
                <div class="order-card__row"><span>Матеріал:</span><b>${esc(o.material)}</b></div>
                <div class="order-card__row"><span>Стиль:</span><b>${esc(o.style)}</b></div>
                ${o.extras?`<div class="order-card__row"><span>Додатково:</span><b>${esc(o.extras)}</b></div>`:''}
                ${o.notes?`<div class="order-card__row"><span>Нотатки:</span><b>${esc(o.notes)}</b></div>`:''}
            </div>
            ${o.status==='new'?`
            <div class="order-card__actions">
                <button class="btn-sm warning" onclick="openEditOrderModal('${o.id}')">✎ Редагувати</button>
                <button class="btn-sm danger"  onclick="doCancelOrder('${o.id}')">✕ Скасувати</button>
            </div>`:''}
        </div>
    `).join('');
}

async function doCancelOrder(orderId){
    if(!confirm('Скасувати це замовлення?')) return;
    const r=await DB.cancelOrder(orderId);
    if(r.error){ showNotif(r.error,'error'); return; }
    showNotif('Замовлення скасовано');
    renderProfileTab('orders');
}

// ── РЕДАГУВАННЯ ЗАМОВЛЕННЯ ───────────────────────────────────
let _editingOrderId=null;

function openEditOrderModal(orderId){
    _editingOrderId=orderId;
    DB.getUserOrders(currentUser.id).then(orders=>{
        const o=orders.find(x=>x.id===orderId); if(!o) return;
        const sel=document.getElementById('editOrderProduct');
        for(let i=0;i<sel.options.length;i++) if(sel.options[i].text===o.product||sel.options[i].value===o.product){sel.selectedIndex=i;break;}
        const selM=document.getElementById('editOrderMaterial');
        for(let i=0;i<selM.options.length;i++) if(selM.options[i].text===o.material){selM.selectedIndex=i;break;}
        const selS=document.getElementById('editOrderStyle');
        for(let i=0;i<selS.options.length;i++) if(selS.options[i].text===o.style){selS.selectedIndex=i;break;}
        document.getElementById('editOrderExtras').value=o.extras||'';
        document.getElementById('editOrderNotes').value=o.notes||'';
        document.getElementById('editOrderError').style.display='none';
        openModal('editOrderModal');
    });
}

async function submitEditOrder(){
    const product=document.getElementById('editOrderProduct').value;
    const material=document.getElementById('editOrderMaterial').value;
    const style=document.getElementById('editOrderStyle').value;
    const extras=document.getElementById('editOrderExtras').value;
    const notes=document.getElementById('editOrderNotes').value;
    if(!product||!material||!style){ showNotif("Заповніть всі обов'язкові поля",'error'); return; }
    const r=await DB.updateOrder(_editingOrderId,{product,material,style,extras,notes});
    if(r.error){ document.getElementById('editOrderError').textContent=r.error; document.getElementById('editOrderError').style.display='block'; return; }
    closeModal('editOrderModal');
    showNotif('Замовлення оновлено!','success');
    renderProfileTab('orders');
}

// ── ІСТОРІЯ ПЕРЕГЛЯДІВ ───────────────────────────────────────
async function renderMyHistory(container){
    const hist=await DB.getHistory();
    if(!hist.length){
        container.innerHTML=`<div class="profile-empty"><p>Ви ще не переглядали жодного виробу.</p></div>`;
        return;
    }
    const cards=hist.map(h=>{
        const p=h.product;
        const media=getMedia(p);
        const src=media.length?media[0].src:PLACEHOLDER;
        return `<div class="history-card" onclick="trackAndOpenLightbox('${esc(p.id)}')">
            <div class="history-card__img"><img src="${esc(src)}" alt="${esc(p.name)}" onerror="this.src='${PLACEHOLDER}'"></div>
            <div class="history-card__info">
                <div class="history-card__name">${esc(p.name)}</div>
                ${p.price?`<div class="history-card__price">${Number(p.price).toLocaleString('uk-UA')} грн</div>`:''}
                <div class="history-card__time">Переглянуто: ${fmtDateTime(h.viewedAt)}</div>
            </div>
        </div>`;
    }).join('');
    container.innerHTML=`
        <div style="display:flex;justify-content:flex-end;margin-bottom:12px;">
            <button class="btn-sm danger" style="flex:0;min-width:160px" onclick="doClearHistory()">✕ Очистити історію</button>
        </div>
        <div class="history-grid">${cards}</div>`;
}

async function doClearHistory(){
    if(!confirm('Очистити всю історію переглядів?')) return;
    await DB.clearHistory();
    showNotif('Історію очищено');
    renderProfileTab('history');
}

// ── НАЛАШТУВАННЯ ПРОФІЛЮ ─────────────────────────────────────
function renderMySettings(container){
    container.innerHTML=`
        <div class="settings-form">
            <h3 class="settings-section">Особисті дані</h3>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <div class="form-group"><label>Ім'я</label><input id="sName" value="${esc(currentUser.name)}"></div>
                <div class="form-group"><label>Прізвище</label><input id="sSurname" value="${esc(currentUser.surname||'')}"></div>
            </div>
            <div class="form-group"><label>Телефон</label><input id="sPhone" type="tel" value="${esc(currentUser.phone||'')}"></div>
            <div class="form-group"><label>Email</label><input id="sEmail" type="email" value="${esc(currentUser.email)}" disabled style="opacity:.5;cursor:not-allowed;"></div>

            <h3 class="settings-section" style="margin-top:20px">Змінити пароль</h3>
            <div class="form-group"><label>Новий пароль (залиш порожнім, щоб не змінювати)</label><input id="sPass" type="password" placeholder="••••••••"></div>
            <div class="form-group"><label>Підтвердити пароль</label><input id="sPass2" type="password" placeholder="••••••••"></div>

            <div class="form-error" id="settingsError"></div>
            <button class="form-submit" onclick="saveSettings()">Зберегти зміни</button>
        </div>`;
}

async function saveSettings(){
    const name=document.getElementById('sName').value.trim();
    const surname=document.getElementById('sSurname').value.trim();
    const phone=document.getElementById('sPhone').value.trim();
    const pass=document.getElementById('sPass').value;
    const pass2=document.getElementById('sPass2').value;
    const errEl=document.getElementById('settingsError');
    errEl.style.display='none';
    if(!name||!surname){ errEl.textContent="Ім'я та прізвище обов'язкові"; errEl.style.display='block'; return; }
    if(pass&&pass.length<6){ errEl.textContent='Пароль мінімум 6 символів'; errEl.style.display='block'; return; }
    if(pass&&pass!==pass2){ errEl.textContent='Паролі не збігаються'; errEl.style.display='block'; return; }
    const update={name,surname,phone};
    if(pass) update.password=pass;
    const r=await DB.updateProfile(currentUser.id,update);
    if(r.error){ errEl.textContent=r.error; errEl.style.display='block'; return; }
    currentUser={...currentUser,...r.user};
    sessionStorage.setItem('cj_current',JSON.stringify(currentUser));
    renderAuthArea();
    showNotif('Профіль оновлено!','success');
    document.getElementById('profileName').textContent=`${currentUser.name} ${currentUser.surname}`;
    document.getElementById('profilePhone').textContent=currentUser.phone||'—';
}

// ════════════════════════════════════════════════════════════
//  CHAT (user ↔ admin)
// ════════════════════════════════════════════════════════════
async function openChatModal(){
    if(!currentUser){ showNotif('Потрібно увійти','error'); openAuthModal(); return; }
    openModal('chatModal');
    await renderChatMessages();
    // Позначаємо повідомлення від адміна як прочитані
    if(!USE_SERVER) await DB.markMessagesRead(currentUser.id);
    updateChatBadge();
}

async function renderChatMessages(){
    const wrap=document.getElementById('chatMessages');
    const msgs=await DB.getMessages(currentUser.id);
    if(!msgs.length){
        wrap.innerHTML=`<div style="text-align:center;padding:30px;color:rgba(255,255,255,.3);font-size:13px;">
            Надішліть повідомлення — адміністратор відповість якнайшвидше.
        </div>`;
        return;
    }
    wrap.innerHTML=msgs.map(m=>`
        <div class="chat-msg ${m.fromAdmin?'chat-msg--admin':'chat-msg--user'}">
            ${esc(m.text)}
            <div class="chat-msg__meta">${m.fromAdmin?'Адміністратор · ':''} ${fmtDateTime(m.createdAt)}</div>
        </div>`).join('');
    wrap.scrollTop=wrap.scrollHeight;
}

async function sendChatMessage(){
    const inp=document.getElementById('chatInput');
    const text=inp.value.trim();
    if(!text) return;
    inp.value='';
    await DB.sendMessage({userId:currentUser.id,userName:currentUser.name+' '+currentUser.surname,text,fromAdmin:false});
    await renderChatMessages();
}

async function updateChatBadge(){
    if(!currentUser||currentUser.role==='admin') return;
    const msgs=await DB.getMessages(currentUser.id);
    const unread=msgs.filter(m=>m.fromAdmin&&!m.read).length;
    const badge=document.getElementById('chatFabBadge');
    if(badge){ badge.style.display=unread>0?'flex':'none'; badge.textContent=unread; }
}

// ── Адмін: перегляд та відповідь ─────────────────────────────
async function openAdminMessagesModal(){
    openModal('adminMsgModal');
    await renderAdminMessagesList();
}

async function renderAdminMessagesList(){
    const wrap=document.getElementById('adminMsgWrap');
    wrap.innerHTML='<p style="padding:12px;color:var(--text-muted);font-size:13px">Завантаження...</p>';
    const allMsgs=await DB.getAllMessages();
    if(!allMsgs.length){
        wrap.innerHTML='<p style="padding:16px;color:var(--text-muted);font-size:13px">Повідомлень немає.</p>';
        return;
    }
    // Групуємо по userId
    const byUser={};
    allMsgs.forEach(m=>{ if(!byUser[m.userId]) byUser[m.userId]={msgs:[],userName:m.userName,userId:m.userId}; byUser[m.userId].msgs.push(m); });
    const items=Object.values(byUser).map(u=>{
        const last=u.msgs[u.msgs.length-1];
        const unread=u.msgs.filter(m=>!m.fromAdmin&&!m.read).length;
        return `<div class="msg-user-item" onclick="adminOpenThread('${esc(u.userId)}','${esc(u.userName)}')">
            <div>
                <div class="msg-user-item__name">${esc(u.userName)}</div>
                <div class="msg-user-item__preview">${esc(last.text.slice(0,60))}${last.text.length>60?'…':''}</div>
            </div>
            ${unread>0?`<span class="msg-user-item__badge">${unread} нових</span>`:''}
        </div>`;
    }).join('');
    wrap.innerHTML=`<div class="msg-user-list">${items}</div>`;

    // Оновлюємо бейдж на кнопці
    const totalUnread=allMsgs.filter(m=>!m.fromAdmin&&!m.read).length;
    const badge=document.getElementById('adminMsgBadge');
    if(badge){ badge.style.display=totalUnread>0?'inline-flex':'none'; badge.textContent=totalUnread; }
}

let _adminThreadUserId=null;
async function adminOpenThread(userId,userName){
    _adminThreadUserId=userId;
    const wrap=document.getElementById('adminMsgWrap');
    const msgs=await DB.getMessages(userId);
    const msgsHtml=msgs.map(m=>`
        <div class="chat-msg ${m.fromAdmin?'chat-msg--user':'chat-msg--admin'}">
            ${esc(m.text)}
            <div class="chat-msg__meta">${m.fromAdmin?'Адміністратор':esc(m.userName)} · ${fmtDateTime(m.createdAt)}</div>
        </div>`).join('');

    wrap.innerHTML=`
        <button class="msg-back" onclick="renderAdminMessagesList()">← Назад до списку</button>
        <div style="font-size:13px;font-weight:700;color:var(--text-primary);margin-bottom:10px">Переписка з: ${esc(userName)}</div>
        <div class="msg-thread">${msgsHtml||'<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:12px">Немає повідомлень</div>'}</div>
        <div class="msg-reply-row">
            <input class="msg-reply-input" type="text" id="adminReplyInput" placeholder="Написати відповідь..." onkeydown="if(event.key==='Enter')adminSendReply()">
            <button class="chat-send" onclick="adminSendReply()">Відповісти</button>
        </div>`;
    const thread=wrap.querySelector('.msg-thread'); if(thread) thread.scrollTop=thread.scrollHeight;
}

async function adminSendReply(){
    const inp=document.getElementById('adminReplyInput'); if(!inp) return;
    const text=inp.value.trim(); if(!text) return;
    inp.value='';
    await DB.sendMessage({userId:_adminThreadUserId,userName:'Адміністратор',text,fromAdmin:true});
    await adminOpenThread(_adminThreadUserId,'');
    showNotif('Відповідь надіслано','success');
}

// ════════════════════════════════════════════════════════════
//  PRODUCT CRUD (admin)
// ════════════════════════════════════════════════════════════
let _adminMedia=[];
let _cachedProducts=[];

function openAddProductModal(){
    document.getElementById('addProductTitle').textContent='Додати виріб';
    document.getElementById('saveProductBtn').textContent='+ Зберегти виріб';
    document.getElementById('editProductId').value='';
    ['addName','addDesc','addMaterial','addPrice','addMediaUrl'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('addCat').value='rings';
    _adminMedia=[]; renderMediaPreview(); openModal('addProductModal');
}

async function openEditModal(id){
    _cachedProducts=await DB.getProducts();
    const p=_cachedProducts.find(x=>x.id===id);
    if(!p){ showNotif('Виріб не знайдено','error'); return; }
    document.getElementById('addProductTitle').textContent='Редагувати виріб';
    document.getElementById('saveProductBtn').textContent='✓ Зберегти зміни';
    document.getElementById('editProductId').value=id;
    document.getElementById('addCat').value=p.category||'rings';
    document.getElementById('addName').value=p.name||'';
    document.getElementById('addDesc').value=p.desc||'';
    document.getElementById('addMaterial').value=p.material||'';
    document.getElementById('addPrice').value=p.price||'';
    document.getElementById('addMediaUrl').value='';
    _adminMedia=getMedia(p).map(m=>({...m}));
    renderMediaPreview(); openModal('addProductModal');
}

function handleMediaFiles(input){
    Array.from(input.files).forEach(file=>{
        const type=file.type.startsWith('video')?'video':'image';
        const r=new FileReader();
        r.onload=e=>{ _adminMedia.push({type,src:e.target.result}); renderMediaPreview(); };
        r.readAsDataURL(file);
    }); input.value='';
}

function addMediaUrl(){
    const input=document.getElementById('addMediaUrl');
    const url=input.value.trim(); if(!url) return;
    const isVideo=/\.(mp4|mov|webm|ogg)(\?|$)/i.test(url);
    _adminMedia.push({type:isVideo?'video':'image',src:url});
    input.value=''; renderMediaPreview();
}

function removeMedia(idx){ _adminMedia.splice(idx,1); renderMediaPreview(); }

function renderMediaPreview(){
    const list=document.getElementById('mediaPreviewList');
    if(!_adminMedia.length){ list.innerHTML=''; return; }
    list.innerHTML=_adminMedia.map((m,i)=>`
        <div class="media-thumb">
            ${m.type==='video'?`<video src="${esc(m.src)}" muted preload="metadata"></video><span class="media-thumb__type">відео</span>`:`<img src="${esc(m.src)}">`}
            <button class="media-thumb__remove" onclick="removeMedia(${i})">✕</button>
        </div>`).join('');
}

async function adminSaveProduct(){
    const id=document.getElementById('editProductId').value;
    const category=document.getElementById('addCat').value;
    const name=document.getElementById('addName').value.trim();
    const desc=document.getElementById('addDesc').value.trim();
    const material=document.getElementById('addMaterial').value.trim();
    const price=document.getElementById('addPrice').value;
    if(!name){ showNotif('Введіть назву виробу','error'); return; }
    const firstImg=_adminMedia.find(m=>m.type==='image');
    const data={category,name,desc,material,price:price||null,img:firstImg?firstImg.src:'',media:_adminMedia};
    const r=id?await DB.updateProduct(id,data):await DB.addProduct(data);
    if(r.error){ showNotif(r.error,'error'); return; }
    showNotif(id?'Зміни збережено!':'Виріб додано!','success');
    _lbProducts=[]; closeModal('addProductModal'); refreshAll();
}

async function deleteProduct(id){
    if(!confirm('Видалити цей виріб?')) return;
    const r=await DB.deleteProduct(id);
    if(r.error){ showNotif(r.error,'error'); return; }
    showNotif('Виріб видалено','success'); _lbProducts=[]; refreshAll();
}

function refreshAll(){ renderHomeCatalog(); if(currentCategory) renderCategoryProducts(currentCategory); }
function exportDB(){ if(USE_SERVER){ showNotif('Недоступно в серверному режимі','error'); return; } DB.exportJSON(); showNotif('Базу даних експортовано!','success'); }

// ════════════════════════════════════════════════════════════
//  ADMIN PANEL
// ════════════════════════════════════════════════════════════
async function openUsersModal(){
    const wrap=document.getElementById('usersTableWrap');
    wrap.innerHTML='<p style="padding:16px;color:var(--text-muted);font-size:13px">Завантаження...</p>';
    openModal('usersModal');
    const [users,orders]=await Promise.all([DB.getUsers(),DB.getOrders()]);
    let html='';

    html+=`<div class="admin-panel-tabs">
        <button class="admin-panel-tab active" onclick="adminSwitchTab('users',this)">👥 Користувачі (${users.length})</button>
        <button class="admin-panel-tab" onclick="adminSwitchTab('orders',this)">📦 Замовлення (${orders.length})</button>
    </div>`;

    html+=`<div id="adminTabUsers">`;
    if(!users.length){ html+='<p style="padding:16px;color:var(--text-muted);font-size:13px">Немає користувачів.</p>'; }
    else {
        html+=`<table class="users-table"><thead><tr><th>Ім'я</th><th>Email</th><th>Телефон</th><th>Замовл.</th><th>Переглядів</th><th>Реєстр.</th></tr></thead><tbody>`;
        html+=users.map(u=>{
            const cnt=orders.filter(o=>o.userId===u.id).length;
            const hist=JSON.parse(localStorage.getItem(`cj_history_${u.id}`)||'[]').length;
            return `<tr><td>${esc(u.name)} ${esc(u.surname)}</td><td>${esc(u.email)}</td><td>${esc(u.phone)||'—'}</td><td>${cnt}</td><td>${hist}</td><td>${fmtDate(u.createdAt)}</td></tr>`;
        }).join('');
        html+=`</tbody></table>`;
    }
    html+=`</div>`;

    const statusLabel={new:'🆕 Нове',in_progress:'🔧 В роботі',done:'✅ Виконано',cancelled:'❌ Скасовано'};
    html+=`<div id="adminTabOrders" style="display:none">`;
    if(!orders.length){ html+='<p style="padding:16px;color:var(--text-muted);font-size:13px">Замовлень немає.</p>'; }
    else {
        html+=`<table class="users-table"><thead><tr><th>ID</th><th>Клієнт</th><th>Виріб</th><th>Матеріал</th><th>Стиль</th><th>Статус</th><th>Дата</th><th>Дії</th></tr></thead><tbody>`;
        html+=[...orders].reverse().map(o=>`<tr>
            <td style="font-size:10px;opacity:.6">${o.id.slice(-6).toUpperCase()}</td>
            <td>${esc(o.userName)}<br><span style="font-size:10px;opacity:.6">${esc(o.userEmail)}</span></td>
            <td>${esc(o.product)}</td><td>${esc(o.material)}</td><td>${esc(o.style)}</td>
            <td><select onchange="adminChangeStatus('${o.id}',this.value)" style="background:var(--bg-input);color:var(--text-primary);border:1px solid var(--border);padding:4px;font-size:11px;">
                ${['new','in_progress','done','cancelled'].map(s=>`<option value="${s}" ${o.status===s?'selected':''}>${statusLabel[s]}</option>`).join('')}
            </select></td>
            <td style="font-size:11px">${fmtDate(o.createdAt)}</td>
            <td>${o.notes?`<span title="${esc(o.notes)}" style="cursor:help;font-size:16px">💬</span>`:''}</td>
        </tr>`).join('');
        html+=`</tbody></table>`;
    }
    html+=`</div>`;

    wrap.innerHTML=html;
}

function adminSwitchTab(tab,btn){
    document.querySelectorAll('.admin-panel-tab').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('adminTabUsers').style.display=tab==='users'?'':'none';
    document.getElementById('adminTabOrders').style.display=tab==='orders'?'':'none';
}

async function adminChangeStatus(orderId,newStatus){
    if(USE_SERVER){
        await fetch(`${API_URL}/orders/${orderId}/status`,{method:'PATCH',headers:DB._headers(),body:JSON.stringify({status:newStatus})});
    } else {
        const orders=JSON.parse(localStorage.getItem('cj_orders')||'[]');
        const i=orders.findIndex(o=>o.id===orderId); if(i>=0){ orders[i].status=newStatus; localStorage.setItem('cj_orders',JSON.stringify(orders)); }
    }
    showNotif('Статус оновлено','success');
}

// ════════════════════════════════════════════════════════════
//  AUTH UI
// ════════════════════════════════════════════════════════════
function renderAuthArea(){
    const area=document.getElementById('authArea');
    const adminBar=document.getElementById('adminBar');
    const chatFab=document.getElementById('chatFab');
    if(!currentUser){
        area.innerHTML=`<button class="nav__btn" onclick="openAuthModal()">Увійти</button>`;
        adminBar.style.display='none';
        if(chatFab) chatFab.style.display='none';
    } else {
        const label=currentUser.role==='admin'?'Адмін':'Користувач';
        area.innerHTML=`
            <button class="nav__btn" onclick="showPage('profile')" style="margin-right:6px">👤 ${esc(currentUser.name)}</button>
            <div class="user-badge" onclick="doLogout()" title="Вийти">
                <span class="role-tag ${currentUser.role}">${label}</span>
                <span style="font-size:10px;opacity:.5;">Вийти</span>
            </div>`;
        adminBar.style.display=currentUser.role==='admin'?'flex':'none';
        // Показуємо chat FAB тільки для звичайних користувачів
        if(chatFab) chatFab.style.display=currentUser.role!=='admin'?'flex':'none';
        if(currentUser.role!=='admin') updateChatBadge();
        if(currentUser.role==='admin') updateAdminMsgBadge();
    }
}

async function updateAdminMsgBadge(){
    const allMsgs=await DB.getAllMessages();
    const unread=allMsgs.filter(m=>!m.fromAdmin&&!m.read).length;
    const badge=document.getElementById('adminMsgBadge');
    if(badge){ badge.style.display=unread>0?'inline-flex':'none'; badge.textContent=unread; }
}

// ════════════════════════════════════════════════════════════
//  MODALS
// ════════════════════════════════════════════════════════════
function openModal(id){ document.getElementById(id).classList.add('open'); }
function closeModal(id){ document.getElementById(id).classList.remove('open'); }
document.addEventListener('click',e=>{ if(e.target.classList.contains('modal-overlay')) e.target.classList.remove('open'); });
function openAuthModal(){ openModal('authModal'); switchTab('login'); }

// ════════════════════════════════════════════════════════════
//  AUTH LOGIC
// ════════════════════════════════════════════════════════════
function switchTab(tab){
    document.getElementById('loginForm').style.display=tab==='login'?'block':'none';
    document.getElementById('registerForm').style.display=tab==='register'?'block':'none';
    document.getElementById('tabLogin').classList.toggle('active',tab==='login');
    document.getElementById('tabRegister').classList.toggle('active',tab==='register');
    document.getElementById('authTitle').textContent=tab==='login'?'Увійти':'Реєстрація';
    document.getElementById('authSubtitle').textContent=tab==='login'?'Введіть свої дані':'Створіть обліковий запис';
    document.getElementById('loginError').style.display='none';
    document.getElementById('registerError').style.display='none';
    document.getElementById('registerSuccess').style.display='none';
}

async function doLogin(){
    const email=document.getElementById('loginEmail').value.trim();
    const pass=document.getElementById('loginPassword').value;
    const r=await DB.login(email,pass);
    if(r.error){ document.getElementById('loginError').style.display='block'; return; }
    currentUser=r.user; sessionStorage.setItem('cj_current',JSON.stringify(currentUser));
    closeModal('authModal'); renderAuthArea(); renderHomeCatalog();
    showNotif(`Ласкаво просимо, ${currentUser.name}!`,'success');
}

async function doRegister(){
    const name=document.getElementById('regName').value.trim();
    const surname=document.getElementById('regSurname').value.trim();
    const phone=document.getElementById('regPhone').value.trim();
    const email=document.getElementById('regEmail').value.trim();
    const password=document.getElementById('regPassword').value;
    const errEl=document.getElementById('registerError');
    errEl.style.display='none';
    if(!name||!surname||!phone||!email||!password){ errEl.textContent='Заповніть всі поля'; errEl.style.display='block'; return; }
    if(password.length<6){ errEl.textContent='Пароль мінімум 6 символів'; errEl.style.display='block'; return; }
    const r=await DB.register({name,surname,phone,email:email.toLowerCase(),password});
    if(r.error){ errEl.textContent=r.error; errEl.style.display='block'; return; }
    document.getElementById('registerSuccess').style.display='block';
    setTimeout(()=>switchTab('login'),1600);
}

function doLogout(){
    if(!confirm('Вийти з облікового запису?')) return;
    currentUser=null; sessionStorage.removeItem('cj_current');
    renderAuthArea(); renderHomeCatalog(); showNotif('Ви вийшли з облікового запису');
    showPage('home');
}

// ════════════════════════════════════════════════════════════
//  ORDER
// ════════════════════════════════════════════════════════════
function openOrderModal(productName){
    if(!currentUser){ showNotif('Для замовлення потрібно увійти','error'); openAuthModal(); return; }
    const sel=document.getElementById('orderProduct');
    if(productName){
        let found=false;
        for(let i=0;i<sel.options.length;i++){ if(sel.options[i].value===productName||sel.options[i].text===productName){sel.selectedIndex=i;found=true;break;} }
        if(!found){ const o=document.createElement('option'); o.value=o.text=productName; sel.appendChild(o); sel.value=productName; }
    }
    document.getElementById('orderSuccess').style.display='none';
    document.getElementById('orderFilesPreview').innerHTML='';
    openModal('orderModal');
}

function previewFiles(input){
    const preview=document.getElementById('orderFilesPreview'); preview.innerHTML='';
    Array.from(input.files).forEach(file=>{ const r=new FileReader(); r.onload=e=>{ const img=document.createElement('img'); img.src=e.target.result; preview.appendChild(img); }; r.readAsDataURL(file); });
}

async function submitOrder(){
    const product=document.getElementById('orderProduct').value;
    const material=document.getElementById('orderMaterial').value;
    const style=document.getElementById('orderStyle').value;
    const extras=document.getElementById('orderExtras').value;
    const notes=document.getElementById('orderNotes').value;
    if(!product||!material||!style){ showNotif('Оберіть виріб, матеріал і стиль','error'); return; }
    const r=await DB.addOrder({userId:currentUser.id,userName:currentUser.name+' '+currentUser.surname,userEmail:currentUser.email,userPhone:currentUser.phone||'',product,material,style,extras,notes});
    if(r.error){ showNotif(r.error,'error'); return; }
    document.getElementById('orderSuccess').style.display='block';
    setTimeout(()=>closeModal('orderModal'),3000);
}

// ════════════════════════════════════════════════════════════
//  NOTIFICATIONS
// ════════════════════════════════════════════════════════════
function showNotif(msg,type){
    const n=document.getElementById('notif'); n.textContent=msg;
    n.className='notif'+(type?' '+type:''); void n.offsetWidth; n.classList.add('show');
    setTimeout(()=>n.classList.remove('show'),3000);
}

// ════════════════════════════════════════════════════════════
//  THEME
// ════════════════════════════════════════════════════════════
function applyTheme(t){
    document.documentElement.setAttribute('data-theme',t);
    const btn=document.getElementById('themeBtn'); if(btn) btn.textContent=t==='dark'?'🌙':'☀️';
    localStorage.setItem('cj_theme',t);
}
function toggleTheme(){ applyTheme(document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark'); }

// ════════════════════════════════════════════════════════════
//  BOOT
// ════════════════════════════════════════════════════════════
(function(){
    const saved=localStorage.getItem('cj_theme');
    applyTheme(saved||(window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'));
})();
window.matchMedia('(prefers-color-scheme:dark)').addEventListener('change',e=>{ if(!localStorage.getItem('cj_theme')) applyTheme(e.matches?'dark':'light'); });

renderAuthArea();
renderHomeCatalog();
history.replaceState({page:'home',category:null},'','#home');