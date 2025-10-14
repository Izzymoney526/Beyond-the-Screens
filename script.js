/* script.js - Beyond the Screens final */

/* ---------- CONFIG ---------- */
const HERO_VIDEOS = [
  "https://cdn.coverr.co/videos/coverr-neon-lights-in-motion-1682/1080p.mp4",
  "https://cdn.coverr.co/videos/coverr-colorful-liquid-waves-5103/1080p.mp4",
  "https://cdn.coverr.co/videos/coverr-golden-particles-floating-7090/1080p.mp4"
];
const SWITCH_INTERVAL = 14000;
const FADE_MS = 900;
const POSTS_JSON = 'posts.json';

/* ---------- DOM ---------- */
const root = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
const bgStage = document.getElementById('bg-stage');
const bgA = document.getElementById('bgA');
const bgB = document.getElementById('bgB');
const canvas = document.getElementById('bg-canvas');
const postsGrid = document.getElementById('postsGrid');
const featuredCard = document.getElementById('featuredCard');
const loadMoreBtn = document.getElementById('loadMore');
const yearEl = document.getElementById('year');

/* ---------- STATE ---------- */
let front = bgA, back = bgB;
let videoIndex = Math.floor(Math.random()*HERO_VIDEOS.length);
let videoPlaying = true;
let posts = [];
let visibleCount = 6;

/* ---------- THEME ---------- */
function setThemeClass(name){
  root.classList.remove('light','dark');
  root.classList.add(name);
  localStorage.setItem('bts_theme', name);
}
function initTheme(){
  const saved = localStorage.getItem('bts_theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  if(saved) setThemeClass(saved);
  else setThemeClass(prefersDark ? 'dark' : 'light');
}
if(themeToggle) themeToggle.addEventListener('click', ()=>{
  const cur = root.classList.contains('dark') ? 'dark' : 'light';
  setThemeClass(cur === 'dark' ? 'light' : 'dark');
});
initTheme();

/* ---------- VIDEO CROSSFADE + FALLBACK ---------- */
function setVideo(el, src){
  if(!el) return;
  if(el.getAttribute('data-src') === src) return;
  el.setAttribute('data-src', src);
  el.pause();
  el.src = src;
  el.muted = true;
  el.playsInline = true;
  el.load();
  el.play().then(() => {
  el.muted = true;
}).catch(err => {
  console.warn("Autoplay blocked, retrying on user interaction:", err);
  document.body.addEventListener("click", () => {
    el.muted = true;
    el.play();
  }, { once: true });
});

}
function showVideo(el){ if(el) el.classList.add('show'); }
function hideVideo(el){ if(el) el.classList.remove('show'); }

function initVideos(){
  if(!front || !back) return;
  setVideo(front, HERO_VIDEOS[videoIndex]);
  setVideo(back, HERO_VIDEOS[(videoIndex+1)%HERO_VIDEOS.length]);
  showVideo(front); hideVideo(back);

  setInterval(()=>{
    showVideo(back);
    setTimeout(()=>{
      hideVideo(front);
      // rotate
      const tmp = front; front = back; back = tmp;
      videoIndex = (videoIndex+1) % HERO_VIDEOS.length;
      setVideo(back, HERO_VIDEOS[(videoIndex+1) % HERO_VIDEOS.length]);
      // preloaded but hidden
      hideVideo(back);
    }, FADE_MS + 60);
  }, SWITCH_INTERVAL);

  // fallback: if videos fail to ready (Live Server autoplay issues), hide stage after 2.5s
  setTimeout(()=>{
    const ready = (front && front.readyState > 2) || (back && back.readyState > 2);
    if(!ready && bgStage) {
      bgStage.style.display = 'none';
    }
  }, 2500);
}

/* ---------- CANVAS SUBTLE PARTICLES (fallback & enhancement) ---------- */
function resizeCanvas(c){
  if(!c) return;
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  c.width = Math.floor(window.innerWidth * dpr);
  c.height = Math.floor(window.innerHeight * dpr);
  c.style.width = window.innerWidth + 'px';
  c.style.height = window.innerHeight + 'px';
  const ctx = c.getContext('2d'); if(ctx) ctx.setTransform(dpr,0,0,dpr,0,0);
}
function initCanvas() {
  if(!canvas) return;
  resizeCanvas(canvas);
  const ctx = canvas.getContext('2d');
  const particles = Array.from({length:100}).map(()=>({
    x: Math.random()*innerWidth,
    y: Math.random()*innerHeight,
    r: 1 + Math.random()*3,
    a: 0.02 + Math.random()*0.12,
    vx: (Math.random()-0.5)*0.3,
    vy: (Math.random()-0.5)*0.15
  }));
  window.addEventListener('resize', ()=> resizeCanvas(canvas));
  (function frame(){
    ctx.clearRect(0,0,innerWidth,innerHeight);
    particles.forEach(p=>{
      p.x += p.vx; p.y += p.vy;
      if(p.x < -50) p.x = innerWidth + 50;
      if(p.x > innerWidth + 50) p.x = -50;
      if(p.y < -50) p.y = innerHeight + 50;
      if(p.y > innerHeight + 50) p.y = -50;
      const g = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*6);
      g.addColorStop(0, `rgba(255,255,255,${p.a})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fill();
    });
    requestAnimationFrame(frame);
  })();
}

/* ---------- SCROLL REVEAL ---------- */
const revealObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach(en => {
    if(en.isIntersecting){
      en.target.classList.add('visible');
      obs.unobserve(en.target);
    }
  });
}, { threshold: 0.12 });

function watchReveal(){
  document.querySelectorAll('[data-animate]').forEach(el => revealObserver.observe(el));
}

/* ---------- POSTS: fetch + render ---------- */
async function fetchPosts(){
  try{
    const res = await fetch(POSTS_JSON + '?_=' + Date.now(), { cache: 'no-store' });
    if(!res.ok) throw new Error('posts.json not found');
    posts = await res.json();
  }catch(e){
    // fallback (embedded minimal posts)
    console.warn('Failed loading posts.json — falling back to embedded sample', e);
    posts = [
      {"id":1,"title":"Redefining Creativity in the AI Age","author":"Beyond the Screens","date":"2025-10-12","tags":["Tech","AI"],"thumbnail":"https://images.unsplash.com/photo-1526378729603-0e3b005a9b54?q=80&w=1600&auto=format&fit=crop","images":["https://images.unsplash.com/photo-1526378729603-0e3b005a9b54?q=80&w=2000&auto=format&fit=crop"],"excerpt":"We’re not just coding algorithms — we’re training imagination.","content":"<p>Across studios and garage labs, creators are using AI as a collaborator.</p>"},
      {"id":2,"title":"Humanity in the Digital Lens","author":"Izzy","date":"2025-10-08","tags":["Culture"],"thumbnail":"https://images.unsplash.com/photo-1504198453319-5ce911bafcde?q=80&w=1600&auto=format&fit=crop","images":["https://images.unsplash.com/photo-1504198453319-5ce911bafcde?q=80&w=2000&auto=format&fit=crop"],"excerpt":"From feeds to feeling — a photographic essay.","content":"<p>A week's worth of images and moments captured in Lagos.</p>"}
    ];
  }
}

function escapeHTML(s){ return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;'); }

function renderFeatured(){
  if(!featuredCard || !posts.length) return;
  const sorted = posts.slice().sort((a,b)=> new Date(b.date) - new Date(a.date));
  const f = sorted[0];
  featuredCard.innerHTML = `
    <img src="${f.thumbnail}" alt="${escapeHTML(f.title)}">
    <div class="meta">
      <div style="font-size:13px;color:var(--muted)">${escapeHTML((f.tags && f.tags[0]) || 'Featured')}</div>
      <h3>${escapeHTML(f.title)}</h3>
      <p class="muted">${escapeHTML(f.excerpt)}</p>
      <div style="margin-top:12px"><a class="btn ghost" href="post.html?id=${f.id}">Read story</a></div>
    </div>
  `;
  featuredCard.setAttribute('data-animate','');
  revealObserver.observe(featuredCard);
}

function renderPosts(){
  if(!postsGrid) return;
  postsGrid.innerHTML = '';
  const sorted = posts.slice().sort((a,b)=> new Date(b.date) - new Date(a.date));
  const slice = sorted.slice(0, visibleCount);
  slice.forEach(p=>{
    const art = document.createElement('article');
    art.className = 'post-card';
    art.setAttribute('data-animate','');
    art.innerHTML = `
      <div class="post-thumb"><img src="${p.thumbnail}" alt="${escapeHTML(p.title)}"></div>
      <div class="post-body">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <h4 class="post-title">${escapeHTML(p.title)}</h4>
        </div>
        <p class="post-excerpt">${escapeHTML(p.excerpt)}</p>
        <div class="post-meta"><span>${escapeHTML(p.date)}</span><a class="btn ghost" href="post.html?id=${p.id}">Read →</a></div>
      </div>
    `;
    postsGrid.appendChild(art);
  });
  document.querySelectorAll('[data-animate]').forEach(el => revealObserver.observe(el));
}

/* LOAD MORE */
if(loadMoreBtn) loadMoreBtn.addEventListener('click', ()=> {
  visibleCount += 3;
  if(visibleCount > posts.length) visibleCount = posts.length;
  renderPosts();
});

/* ---------- POST PAGE RENDER ---------- */
async function renderPostPage(){
  // only run on post page
  const postArticle = document.getElementById('postArticle');
  if(!postArticle) return;
  const params = new URLSearchParams(window.location.search);
  const id = Number(params.get('id') || 0);
  if(!posts.length){
    await fetchPosts();
  }
  const post = posts.find(p => p.id === id) || posts[0];
  if(!post){
    postArticle.innerHTML = '<p class="muted">Article not found.</p>';
    return;
  }
  postArticle.innerHTML = `
    <div>
      <h1>${escapeHTML(post.title)}</h1>
      <div class="post-meta muted">${escapeHTML(post.date)} • ${escapeHTML(post.author || '')} • ${post.tags ? post.tags.map(t=>`#${escapeHTML(t)}`).join(' ') : ''}</div>
      <img src="${post.images && post.images[0] ? post.images[0] : post.thumbnail}" alt="${escapeHTML(post.title)}" style="width:100%;height:auto;border-radius:8px;margin-bottom:14px"/>
      <div class="post-content">${post.content || ''}</div>
      ${post.images && post.images.length ? `<div class="post-gallery">${post.images.slice(0,6).map(img=>`<img src="${img}" data-img="${img}" alt="${escapeHTML(post.title)}">`).join('')}</div>` : ''}
    </div>
  `;
  // SEO panel
  const seoPanel = document.getElementById('seoContent');
  if(seoPanel){ seoPanel.innerHTML = `Title length: ${post.title.length}<br/>Words: ${stripWords(post.content)}<br/>Images: ${post.images && post.images.length ? post.images.length : 0}`; }

  // share and comments
  const shareWA = document.getElementById('shareWA');
  const shareCopy = document.getElementById('shareCopy');
  shareWA && (shareWA.onclick = ()=> window.open(`https://wa.me/?text=${encodeURIComponent(post.title + ' — ' + location.href)}`, '_blank'));
  shareCopy && (shareCopy.onclick = ()=> navigator.clipboard.writeText(location.href).then(()=> alert('Link copied')));

  renderCommentsUI(post.id);

  // gallery lightbox
  document.querySelectorAll('.post-gallery img').forEach(img => img.addEventListener('click', ()=> openLightbox(img.dataset.img)));
}

/* ---------- COMMENTS (localStorage) ---------- */
function renderCommentsUI(postId){
  const wrap = document.getElementById('commentsWrap');
  if(!wrap) return;
  const key = `bts_comments_${postId}`;
  const raw = localStorage.getItem(key);
  let comments = raw ? JSON.parse(raw) : [];
  wrap.innerHTML = `
    <div id="commentsList">${comments.length ? comments.map(c=>`<div style="padding:8px;border-bottom:1px solid rgba(0,0,0,0.04)"><strong>${escapeHTML(c.name)}</strong> <div class="muted" style="font-size:12px">${new Date(c.time).toLocaleString()}</div><div style="margin-top:6px">${escapeHTML(c.msg)}</div></div>`).join('') : '<div class="muted">No comments yet.</div>'}</div>
    <form id="commentForm" style="margin-top:12px;display:flex;flex-direction:column;gap:8px">
      <input id="commentName" placeholder="Your name (optional)" />
      <textarea id="commentMsg" placeholder="Write a thoughtful comment..." rows="4"></textarea>
      <div style="display:flex;gap:8px"><button class="btn primary" type="submit">Post Comment</button><button class="btn ghost" type="button" id="clearComments">Clear</button></div>
    </form>
  `;
  const form = document.getElementById('commentForm');
  const list = document.getElementById('commentsList');
  const clear = document.getElementById('clearComments');
  form.addEventListener('submit', e=>{
    e.preventDefault();
    const name = document.getElementById('commentName').value.trim() || 'Anonymous';
    const msg = document.getElementById('commentMsg').value.trim();
    if(!msg) return;
    const newC = { id: Date.now(), name, msg, time: new Date().toISOString() };
    comments.unshift(newC);
    localStorage.setItem(key, JSON.stringify(comments));
    list.innerHTML = comments.map(c=>`<div style="padding:8px;border-bottom:1px solid rgba(0,0,0,0.04)"><strong>${escapeHTML(c.name)}</strong> <div class="muted" style="font-size:12px">${new Date(c.time).toLocaleString()}</div><div style="margin-top:6px">${escapeHTML(c.msg)}</div></div>`).join('');
    form.reset();
  });
  clear.addEventListener('click', ()=>{ if(confirm('Clear comments?')){ comments=[]; localStorage.removeItem(key); list.innerHTML = '<div class="muted">No comments yet.</div>'; } });
}

/* ---------- LIGHTBOX ---------- */
const lightbox = (()=> {
  let overlay, imgEl;
  function open(url){
    if(!overlay){
      overlay = document.createElement('div'); overlay.style.position='fixed'; overlay.style.inset=0; overlay.style.background='rgba(0,0,0,0.85)'; overlay.style.display='flex'; overlay.style.alignItems='center'; overlay.style.justifyContent='center'; overlay.style.zIndex=9999;
      imgEl = document.createElement('img'); imgEl.style.maxWidth='90%'; imgEl.style.maxHeight='90%'; imgEl.style.borderRadius='6px';
      overlay.appendChild(imgEl);
      overlay.addEventListener('click', ()=> { overlay.style.display='none'; });
      document.body.appendChild(overlay);
    }
    imgEl.src = url; overlay.style.display = 'flex';
  }
  return { open };
})();

function openLightbox(url){ lightbox.open(url); }

/* utils */
function stripWords(html){ return (html||'').replace(/<[^>]*>/g,'').split(/\s+/).filter(Boolean).length; }

/* ---------- BOOT ---------- */
document.addEventListener('DOMContentLoaded', async ()=>{
  // init UI
  if(yearEl) yearEl.textContent = new Date().getFullYear();

  // init videos & canvas
  initVideos();
  initCanvas();

  // fetch posts, then render index or post
  await fetchPosts();

  // if index page
  if(document.getElementById('postsGrid')){
    renderFeatured();
    renderPosts();
  }
  // if post page
  await renderPostPage();

  // setup reveal
  watchReveal();
});
