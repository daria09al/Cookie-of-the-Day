const CONFIG = {
  /* Имя на кнопке «Шепнуть ...» (родительный/дательный падеж) */
  himName: 'тебе',

  /* PIN для входа в скрытую админку */
  adminPin: '1234',

  /* Границы слотов (часы, 0–23) */
  dayStart: 7,     // с 07:00 — день
  nightStart: 20,  // с 20:00 — ночь

  telegram: {
    enabled: true,
    token: '8800943807:AAH_4qGRvcI8UExZBDC9S1tbaCnrkSz-z7o',
    chatId: '6237380979'
  },

  sound: true
};

/* ---------------------------------------------------------
   ПРЕДСКАЗАНИЯ
   --------------------------------------------------------- */
const dayFortunes = [
  'Сегодня тебя ждёт маленькое чудо — не пропусти его ♡',
  'Ты справишься со всем, во что вложишь сердце.',
  'Кто-то думает о тебе прямо сейчас. И улыбается.',
  'Позволь себе паузу: чай, тишина и никакой спешки.',
  'Твоя улыбка сегодня станет чьим-то самым светлым моментом.',
  'Сделай то, что давно откладывал. Сразу станет легче.',
  'День будет добрым к тебе. Я уже договорилась ♡',
  'Ты гораздо ближе к цели, чем тебе кажется.',
  'Сегодня удача выберет тебя. Просто будь рядом.',
  'Обними того, кого любишь. Написать — тоже считается.',
  'Всё, что делаешь с любовью, вернётся к тебе вдвойне.',
  'Не забудь поесть и выпить воды. Это тоже забота о себе.',
  'Отличный день, чтобы тихонько гордиться собой.',
  'Маленький шаг сегодня — большая победа через месяц.',
  'Ты — чей-то самый любимый человек. Каждый день.',
  'Впусти в этот день немного глупостей и смеха.',
  'Тебе очень идёт быть счастливым. Правда.',
  'Сегодня кто-то скажет тебе спасибо. И совершенно заслуженно.',
  'Твоя энергия сегодня заразительна — используй во благо ♡',
  'Всё складывается. Просто пока не видно всей картинки.'
];

const nightFortunes = [
  'Ты сделал достаточно. Правда достаточно.',
  'Отпусти этот день. Он был как мог, а ты был молодцом.',
  'Пусть сон будет мягким, как свежее тесто ♡',
  'Завтра начнётся с чего-то хорошего. Обещаю.',
  'Спасибо, что ты сегодня был собой.',
  'Закрой глаза. Я рядом, даже если меня не видно.',
  'Тишина прямо сейчас — твоё самое полезное занятие.',
  'Оставь тревоги на подоконнике. Утром разберёмся вместе.',
  'Тебя любят. Даже сонного и уставшего.',
  'Пусть снится море, тепло и никаких дедлайнов.',
  'Ты — лучшее, что случилось с этим днём.',
  'Один глубокий вдох. И ещё один. Всё хорошо.',
  'Ночь пересчитала твои сны и выбрала самый нежный.',
  'Не думай о завтра. Оно само придёт и всё расскажет.',
  'Ты заслужил отдых, а не список дел.',
  'Где-то во вселенной твоё имя произносят с нежностью.',
  'Пусть подушка будет прохладной, а сердце — спокойным.',
  'Спокойной ночи, моё самое любимое человечество ♡',
  'Всё, что не решилось сегодня, спокойно подождёт до утра.',
  'Ты можешь просто спать. Это тоже достижение.'
];

/* ---------------------------------------------------------
   ХРАНИЛИЩЕ
   --------------------------------------------------------- */
const DB = {
  keys: {
    opened:'pd_opened', hugs:'pd_hugs', whispers:'pd_whispers',
    meta:'pd_meta', custom:'pd_custom'
  },

  get(key, fallback){
    try{
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    }catch(e){ return fallback; }
  },
  set(key, value){
    try{ localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch(e){ return false; }
  },

  opened(){ return DB.get(DB.keys.opened, {}); },
  hugs(){ return DB.get(DB.keys.hugs, []); },
  whispers(){ return DB.get(DB.keys.whispers, []); },
  custom(){ const v = DB.get(DB.keys.custom, []); return Array.isArray(v) ? v : []; },
  meta(){ return DB.get(DB.keys.meta, { firstVisit:null, lastSeen:null }); }
};

/* ---------------------------------------------------------
   УТИЛИТЫ
   --------------------------------------------------------- */
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;

/* «1 печенька», «2 печеньки», «5 печенек» */
function plural(n, one, few, many){
  const a = Math.abs(n) % 100, b = a % 10;
  const word = (a > 10 && a < 20) ? many : (b === 1 ? one : (b >= 2 && b <= 4 ? few : many));
  return `${n} ${word}`;
}

function fmtDateTime(ts){
  const d = new Date(ts);
  return `${pad(d.getDate())}.${pad(d.getMonth()+1)}.${d.getFullYear()} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/* Стабильный выбор фразы: один и тот же слот -> одна и та же фраза */
function pickStable(list, seed){
  let h = 2166136261;
  for(let i = 0; i < seed.length; i++){
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return list[Math.abs(h) % list.length];
}

/* ---------------------------------------------------------
   СЛОТЫ ВРЕМЕНИ
   --------------------------------------------------------- */
function slotOf(now = new Date()){
  const h = now.getHours();
  const isDay = h >= CONFIG.dayStart && h < CONFIG.nightStart;
  const base = new Date(now);
  if(!isDay && h < CONFIG.dayStart) base.setDate(base.getDate() - 1);
  const kind = isDay ? 'day' : 'night';
  return { kind, isDay, date: ymd(base), key: `${ymd(base)}|${kind}` };
}

function slotBounds(now = new Date()){
  const h = now.getHours();
  const start = new Date(now); start.setMinutes(0, 0, 0);
  const end   = new Date(now); end.setMinutes(0, 0, 0);

  if(h >= CONFIG.dayStart && h < CONFIG.nightStart){
    start.setHours(CONFIG.dayStart);
    end.setHours(CONFIG.nightStart);
  } else if(h >= CONFIG.nightStart){
    start.setHours(CONFIG.nightStart);
    end.setDate(end.getDate() + 1);
    end.setHours(CONFIG.dayStart);
  } else {
    start.setDate(start.getDate() - 1);
    start.setHours(CONFIG.nightStart);
    end.setHours(CONFIG.dayStart);
  }
  return { start, end };
}

const Sfx = {
  ctx: null,
  bus: null,   // сюда подключаются все голоса

  init(){
    if(this.ctx || !CONFIG.sound) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if(!AC) return;
    const ctx = this.ctx = new AC();

    /* мастер: снимаем резкость и держим пики под контролем */
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -14;
    limiter.knee.value = 26;
    limiter.ratio.value = 5;
    limiter.attack.value = .006;
    limiter.release.value = .28;

    const air = ctx.createBiquadFilter();
    air.type = 'lowpass';
    air.frequency.value = 7200;
    air.Q.value = .35;

    const master = ctx.createGain();
    master.gain.value = .85;

    air.connect(limiter).connect(master).connect(ctx.destination);

    /* шина голосов */
    this.bus = ctx.createGain();
    this.bus.gain.value = 1;
    this.bus.connect(air);

    /* реверб: шумовой импульс с затуханием, придушенный по верхам */
    const seconds = 2.1;
    const len = Math.floor(ctx.sampleRate * seconds);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for(let ch = 0; ch < 2; ch++){
      const d = ir.getChannelData(ch);
      for(let i = 0; i < len; i++){
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.4);
      }
    }
    const rev = ctx.createConvolver();
    rev.buffer = ir;
    const revLp = ctx.createBiquadFilter();
    revLp.type = 'lowpass';
    revLp.frequency.value = 2600;
    const wet = ctx.createGain();
    wet.gain.value = .32;

    this.bus.connect(revLp).connect(rev).connect(wet).connect(air);
  },

  unlock(){
    this.init();
    if(this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },

  /* Один «колокольчиковый» голос: основной тон плюс тихая
     расстроенная октава сверху — так тембр звучит как музыкальная
     шкатулка, а не как синтезаторный писк. */
  voice(freq, when, opt = {}){
    if(!this.ctx) return;
    const {
      dur = 1.1, type = 'sine', gain = .13,
      attack = .014, glide = 0, harm = .26, harmRatio = 2.01
    } = opt;

    const add = (f, g0, d) => {
      const o = this.ctx.createOscillator();
      const gn = this.ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f, when);
      if(glide) o.frequency.exponentialRampToValueAtTime(glide * (f / freq), when + dur * .6);
      gn.gain.setValueAtTime(.0001, when);
      gn.gain.linearRampToValueAtTime(g0, when + attack);
      gn.gain.exponentialRampToValueAtTime(.0001, when + d);
      o.connect(gn).connect(this.bus);
      o.start(when);
      o.stop(when + d + .05);
    };

    add(freq, gain, dur);
    if(harm > 0) add(freq * harmRatio, gain * harm, dur * .55);
  },

  /* Шумовой слой: используется для «хруста» и «шелеста» */
  noise(when, opt = {}){
    if(!this.ctx) return;
    const { dur = .3, gain = .2, from = 1200, to = 500, q = .7, decay = 3 } = opt;
    const ctx = this.ctx;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for(let i = 0; i < len; i++){
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(from, when);
    lp.frequency.exponentialRampToValueAtTime(to, when + dur);
    lp.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, when);
    g.gain.exponentialRampToValueAtTime(.0001, when + dur);
    src.connect(lp).connect(g).connect(this.bus);
    src.start(when);
  },

  /* Печенька разламывается: тихое «крр» плюс деревянный толчок снизу */
  crunch(){
    this.unlock();
    if(!this.ctx) return;
    const t = this.ctx.currentTime;
    this.noise(t, { dur: .22, gain: .16, from: 2200, to: 420, decay: 3.6 });
    this.voice(190, t, { dur: .3, gain: .1, type: 'triangle', harm: 0, glide: 120, attack: .004 });
  },

  /* Волшебство: арпеджио по пентатонике, поэтому не бывает фальши */
  magic(){
    this.unlock();
    if(!this.ctx) return;
    const t = this.ctx.currentTime + .05;
    [1046.5, 1318.5, 1568, 2093].forEach((f, i) => {
      this.voice(f, t + i * .085, { dur: 1.5 - i * .15, gain: .1, harm: .22 });
    });
  },

  /* Тёплый мажорный аккорд с медленной атакой — «обнимашка» */
  chime(){
    this.unlock();
    if(!this.ctx) return;
    const t = this.ctx.currentTime + .02;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      this.voice(f, t + i * .045, { dur: 2, gain: .085, attack: .06, harm: .18 });
    });
  },

  /* Мягкий «боп» питомца: тон подъезжает вверх, без писка */
  meow(){
    this.unlock();
    if(!this.ctx) return;
    const t = this.ctx.currentTime;
    this.voice(520, t, { dur: .45, gain: .12, glide: 750, harm: .2 });
    this.voice(784, t + .14, { dur: .6, gain: .09, harm: .24 });
  },

  /* Сонное мурчание: низкая синусоида с дрожанием громкости */
  purr(){
    this.unlock();
    if(!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = 58;

    const trem = ctx.createOscillator();
    trem.type = 'sine';
    trem.frequency.value = 19;
    const tremDepth = ctx.createGain();
    tremDepth.gain.value = .045;

    const g = ctx.createGain();
    g.gain.setValueAtTime(.0001, t);
    g.gain.linearRampToValueAtTime(.1, t + .18);
    g.gain.setValueAtTime(.1, t + .75);
    g.gain.exponentialRampToValueAtTime(.0001, t + 1.35);
    trem.connect(tremDepth).connect(g.gain);

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 300;

    o.connect(lp).connect(g).connect(this.bus);
    o.start(t); trem.start(t);
    o.stop(t + 1.4); trem.stop(t + 1.4);

    /* тихий призвук сверху, чтобы мурчание не было «гудком» */
    this.voice(233, t + .1, { dur: .9, gain: .035, harm: .15 });
  },

  /* Короткий мягкий блип для нажатий */
  pop(){
    this.unlock();
    if(!this.ctx) return;
    const t = this.ctx.currentTime;
    this.voice(659.25, t, { dur: .4, gain: .085, harm: .2 });
    this.voice(987.77, t + .045, { dur: .5, gain: .055, harm: .18 });
  },

  /* Шёпот улетел: шелест вверх плюс лёгкий колокольчик */
  whoosh(){
    this.unlock();
    if(!this.ctx) return;
    const t = this.ctx.currentTime;
    this.noise(t, { dur: .5, gain: .07, from: 500, to: 3200, decay: 1.4 });
    this.voice(1318.5, t + .18, { dur: 1.2, gain: .075, harm: .2 });
    this.voice(1760, t + .3, { dur: 1.1, gain: .05, harm: .18 });
  }
};

/* ---------------------------------------------------------
   ЧАСТИЦЫ: конфетти + сердечки
   --------------------------------------------------------- */
const fxCanvas = $('#fx');
const fxCtx = fxCanvas.getContext('2d');
let fxParts = [], fxRunning = false;

function sizeCanvas(){
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  fxCanvas.width  = window.innerWidth  * dpr;
  fxCanvas.height = window.innerHeight * dpr;
  fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
sizeCanvas();
window.addEventListener('resize', sizeCanvas);

/* Фолбэк, если CDN с canvas-confetti недоступен */
function fallbackBurst(opts){
  const cx = (opts.origin?.x ?? .5) * window.innerWidth;
  const cy = (opts.origin?.y ?? .5) * window.innerHeight;
  const n  = opts.particleCount ?? 60;
  const colors = opts.colors ?? ['#ff8fab', '#ffd166', '#a07ae8', '#fff'];
  const shapes = ['star', 'circle', 'heart'];

  for(let i = 0; i < n; i++){
    const a = (-90 + (Math.random() - .5) * (opts.spread ?? 90)) * Math.PI / 180;
    const sp = 6 + Math.random() * 9;
    fxParts.push({
      x: cx, y: cy,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      g: .22 + Math.random() * .12,
      r: 3 + Math.random() * 4,
      rot: Math.random() * Math.PI, vr: (Math.random() - .5) * .3,
      life: 1,
      color: colors[i % colors.length],
      shape: shapes[i % shapes.length]
    });
  }
  if(!fxRunning){ fxRunning = true; requestAnimationFrame(fxLoop); }
}

function fxLoop(){
  fxCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  fxParts = fxParts.filter(p => p.life > 0 && p.y < window.innerHeight + 60);

  fxParts.forEach(p => {
    p.vy += p.g; p.x += p.vx; p.y += p.vy;
    p.vx *= .995; p.rot += p.vr; p.life -= .008;

    fxCtx.save();
    fxCtx.translate(p.x, p.y);
    fxCtx.rotate(p.rot);
    fxCtx.globalAlpha = Math.max(p.life, 0);
    fxCtx.fillStyle = p.color;

    if(p.shape === 'circle'){
      fxCtx.beginPath(); fxCtx.arc(0, 0, p.r, 0, Math.PI * 2); fxCtx.fill();
    } else if(p.shape === 'heart'){
      const s = p.r / 4;
      fxCtx.beginPath();
      fxCtx.moveTo(0, 2 * s);
      fxCtx.bezierCurveTo(0, 0, -3 * s, 0, -3 * s, -2 * s);
      fxCtx.bezierCurveTo(-3 * s, -4.5 * s, 0, -4.5 * s, 0, -2 * s);
      fxCtx.bezierCurveTo(0, -4.5 * s, 3 * s, -4.5 * s, 3 * s, -2 * s);
      fxCtx.bezierCurveTo(3 * s, 0, 0, 0, 0, 2 * s);
      fxCtx.fill();
    } else {
      fxCtx.beginPath();
      for(let i = 0; i < 5; i++){
        const o = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        i === 0 ? fxCtx.moveTo(Math.cos(o) * p.r * 1.6, Math.sin(o) * p.r * 1.6)
                : fxCtx.lineTo(Math.cos(o) * p.r * 1.6, Math.sin(o) * p.r * 1.6);
      }
      fxCtx.closePath(); fxCtx.fill();
    }
    fxCtx.restore();
  });

  if(fxParts.length){ requestAnimationFrame(fxLoop); }
  else { fxRunning = false; fxCtx.clearRect(0, 0, window.innerWidth, window.innerHeight); }
}

function burst(opts = {}){
  if(typeof window.confetti === 'function'){
    window.confetti({
      particleCount: 70, spread: 80, startVelocity: 42,
      scalar: 1.05, ticks: 220, zIndex: 60,
      shapes: ['star', 'circle'],
      colors: ['#ff8fab', '#ffd166', '#ffb38a', '#a07ae8', '#ffffff'],
      disableForReducedMotion: true,
      ...opts
    });
  } else {
    fallbackBurst(opts);
  }
}

/* 3D-сердечки */
function heartsBurst(x, y, count = 16){
  const glyphs = ['💗', '💖', '♥', '💝', '🩷', '💞'];
  for(let i = 0; i < count; i++){
    const el = document.createElement('span');
    el.className = 'heart';
    el.textContent = glyphs[i % glyphs.length];
    el.style.left = x + 'px';
    el.style.top  = y + 'px';
    el.style.fontSize = (18 + Math.random() * 22) + 'px';
    document.body.appendChild(el);

    const dx = (Math.random() - .5) * 260;
    const dy = -(120 + Math.random() * 300);
    const rz = (Math.random() - .5) * 140;

    el.animate([
      { transform: 'translate3d(-50%,-50%,0) scale(.2) rotateY(0deg)', opacity: 0 },
      { transform: `translate3d(calc(-50% + ${dx * .45}px), calc(-50% + ${dy * .5}px), 60px) scale(1.15) rotateY(220deg) rotateZ(${rz * .5}deg)`, opacity: 1, offset: .38 },
      { transform: `translate3d(calc(-50% + ${dx}px), calc(-50% + ${dy}px), 0) scale(.5) rotateY(540deg) rotateZ(${rz}deg)`, opacity: 0 }
    ], {
      duration: 1500 + Math.random() * 900,
      easing: 'cubic-bezier(.2,.7,.3,1)'
    }).onfinish = () => el.remove();
  }
}

/* Крошки от печеньки */
function crumbs(x, y){
  for(let i = 0; i < 12; i++){
    const el = document.createElement('i');
    el.className = 'crumb';
    el.style.left = x + 'px';
    el.style.top  = y + 'px';
    document.body.appendChild(el);
    const dx = (Math.random() - .5) * 220;
    el.animate([
      { transform: 'translate(-50%,-50%) scale(1) rotate(0deg)', opacity: 1 },
      { transform: `translate(calc(-50% + ${dx}px), ${140 + Math.random() * 120}px) scale(.5) rotate(${Math.random() * 540}deg)`, opacity: 0 }
    ], { duration: 900 + Math.random() * 500, easing: 'cubic-bezier(.3,.8,.5,1)' })
      .onfinish = () => el.remove();
  }
}

/* ---------------------------------------------------------
   ТОСТ
   --------------------------------------------------------- */
let toastTimer;
function toast(text, ms = 2400){
  const t = $('#toast');
  $('#toastText').textContent = text;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}

/* ---------------------------------------------------------
   ФОН: звёзды и плавающие символы
   --------------------------------------------------------- */
function buildStars(n = 70){
  const box = $('#stars');
  box.innerHTML = '';
  for(let i = 0; i < n; i++){
    const s = document.createElement('i');
    s.className = 'star';
    const size = Math.random() * 2.4 + 1;
    s.style.width = s.style.height = size + 'px';
    s.style.left = Math.random() * 100 + '%';
    s.style.top  = Math.random() * 78 + '%';
    s.style.setProperty('--dur', (1.8 + Math.random() * 3.4) + 's');
    s.style.setProperty('--delay', (Math.random() * 4) + 's');
    box.appendChild(s);
  }
}

function buildFloaties(){
  const box = $('#floaties');
  box.innerHTML = '';
  const glyphs = theme === 'day' ? ['🍪', '♡', '✿', '🧁', '✧'] : ['✦', '♡', '☾', '✧', '⋆'];
  for(let i = 0; i < 9; i++){
    const f = document.createElement('span');
    f.className = 'floatie';
    f.textContent = glyphs[i % glyphs.length];
    f.style.left = (4 + Math.random() * 92) + '%';
    f.style.setProperty('--sz', (14 + Math.random() * 16) + 'px');
    f.style.setProperty('--dur', (14 + Math.random() * 14) + 's');
    f.style.setProperty('--delay', (-Math.random() * 20) + 's');
    box.appendChild(f);
  }
}

/* ---------------------------------------------------------
   ТЕМА
   --------------------------------------------------------- */
let theme = null;

function applyTheme(force){
  const next = force || (slotOf().isDay ? 'day' : 'night');
  if(next === theme) return;
  theme = next;
  document.documentElement.dataset.theme = theme;
  $('#themeColor').setAttribute('content', theme === 'day' ? '#ffe3ea' : '#1b1338');
  $('#footTheme').textContent = theme === 'day' ? 'день ☀️' : 'ночь 🌙';
  $('#tagline').textContent = theme === 'day'
    ? 'твоё маленькое волшебство каждый день'
    : 'тихий вечер и одна нежная мысль';
  $('#ringIco').textContent = theme === 'day' ? '🌙' : '☀️';
  buildFloaties();
}

/* ---------------------------------------------------------
   СОСТОЯНИЕ ПЕЧЕНЬКИ
   --------------------------------------------------------- */
let currentSlot = slotOf();

/* Фразы, добавленные из админки, идут вперёд стандартных:
   иначе среди двадцати готовых её записку он мог бы не увидеть месяцами.
   Берём самую раннюю непрочитанную, подходящую по слоту. */
function pendingCustom(slot, list){
  return (list || DB.custom())
    .filter(c => !c.readAt && (c.kind === 'any' || c.kind === slot.kind))
    .sort((a, b) => a.ts - b.ts)[0] || null;
}

function fortuneForSlot(slot){
  const own = pendingCustom(slot);
  if(own) return { text: own.text, customId: own.id };
  const list = slot.isDay ? dayFortunes : nightFortunes;
  return { text: pickStable(list, slot.key), customId: null };
}

/* Помечаем свою фразу прочитанной — админка это покажет */
function markCustomRead(id, slot){
  const list = DB.custom();
  const item = list.find(c => c.id === id);
  if(!item) return;
  item.readAt = Date.now();
  item.readSlot = slot.key;
  DB.set(DB.keys.custom, list);
}

function typeText(el, text){
  el.textContent = '';
  let i = 0;
  const step = () => {
    el.textContent = text.slice(0, ++i);
    if(i < text.length) setTimeout(step, 26);
  };
  step();
}

function render(){
  currentSlot = slotOf();
  applyTheme();

  const opened = DB.opened();
  const rec = opened[currentSlot.key];

  const cookie = $('#cookie');
  const note   = $('#note');
  const timer  = $('#timer');

  if(rec){
    document.body.classList.add('opened');
    cookie.classList.add('is-open', 'is-locked');
    note.classList.add('show');
    $('#noteText').textContent = rec.text;
    timer.classList.remove('hidden');
    $('#timerSub').textContent = currentSlot.isDay
      ? 'Дневная печенька уже раскрыта ♡'
      : 'Вечерняя печенька уже раскрыта ♡';
  } else {
    document.body.classList.remove('opened');
    cookie.classList.remove('is-open', 'is-locked');
    note.classList.remove('show');
    $('#noteText').textContent = '';
    timer.classList.add('hidden');
    $('#cookieHint').textContent = currentSlot.isDay
      ? 'нажми на меня'
      : 'вечерняя печенька ждёт';
  }
  tickClock();
}

function openCookie(){
  const opened = DB.opened();
  const slot = slotOf();

  if(opened[slot.key]){
    const c = $('#cookie');
    c.classList.remove('shake');
    void c.offsetWidth;
    c.classList.add('shake');
    Sfx.pop();
    toast('На сегодня уже всё ♡ Жди новую печеньку');
    return;
  }

  const { text, customId } = fortuneForSlot(slot);
  const cookie = $('#cookie');
  const rect = cookie.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  cookie.classList.add('is-open', 'is-locked');
  document.body.classList.add('opened');
  Sfx.crunch();
  setTimeout(() => Sfx.magic(), 130);
  crumbs(cx, cy);

  burst({ particleCount: 90, spread: 100, origin: { x: cx / window.innerWidth, y: cy / window.innerHeight } });
  setTimeout(() => burst({
    particleCount: 45, spread: 130, startVelocity: 30,
    shapes: ['circle'], colors: ['#ff8fab', '#fff', '#ffd166'],
    origin: { x: cx / window.innerWidth, y: cy / window.innerHeight }
  }), 220);
  heartsBurst(cx, cy, 7);

  if(navigator.vibrate) navigator.vibrate([12, 40, 18]);

  setTimeout(() => {
    $('#note').classList.add('show');
    typeText($('#noteText'), text);
  }, 420);

  opened[slot.key] = { text, ts: Date.now(), kind: slot.kind, date: slot.date, own: !!customId };
  DB.set(DB.keys.opened, opened);
  if(customId) markCustomRead(customId, slot);

  setTimeout(() => {
    $('#timer').classList.remove('hidden');
    $('#timerSub').textContent = slot.isDay
      ? 'Дневная печенька уже раскрыта ♡'
      : 'Вечерняя печенька уже раскрыта ♡';
    tickClock();
  }, 1400);

  const ownMark = customId ? '\n✍️ <i>это твоя фраза</i>' : '';
  tg(`🍪 <b>Печенька открыта</b>\n${slot.isDay ? '☀️ дневная' : '🌙 вечерняя'} · ${fmtDateTime(Date.now())}${ownMark}\n\n<i>${escapeHtml(text)}</i>`);
}

/* ---------------------------------------------------------
   ТАЙМЕР
   --------------------------------------------------------- */
const RING_LEN = 2 * Math.PI * 52;

function tickClock(){
  const now = new Date();
  const { start, end } = slotBounds(now);

  $('#footClock').textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  /* слот сменился — печенька снова доступна */
  const slotNow = slotOf(now);
  if(slotNow.key !== currentSlot.key){
    render();
    toast(slotNow.isDay ? 'Новая дневная печенька готова! ☀️' : 'Вечерняя печенька готова! 🌙', 4000);
    Sfx.magic();
    return;
  }
  applyTheme();

  const left  = Math.max(0, end - now);
  const total = end - start;
  const h = Math.floor(left / 3600000);
  const m = Math.floor(left % 3600000 / 60000);
  const s = Math.floor(left % 60000 / 1000);

  $('#countdown').textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
  $('#nextTime').textContent  = `${pad(end.getHours())}:${pad(end.getMinutes())}`;
  $('#ringFg').style.strokeDashoffset = String(RING_LEN * (left / total));
}

setInterval(tickClock, 1000);

/* ---------------------------------------------------------
   ПИТОМЕЦ
   --------------------------------------------------------- */
const petPhrasesDay = [
  'Хорошего дня! ♡',
  'Ты сегодня особенно классный ☀️',
  'Не забудь попить воды!',
  'Мур. Это значит «я тебя обнимаю».'
];
const petPhrasesNight = [
  'Мррр... Не буди, ждём 7 утра!',
  'Тссс... я сплю и вижу тебя во сне 💤',
  'Ночь — время обнимашек и тишины 🌙',
  'Спатки. И ты тоже, пожалуйста.'
];
let petPhraseIdx = 0, petBubbleTimer;

function petTap(){
  const pet = $('#pet');
  pet.classList.remove('hop');
  void pet.offsetWidth;
  pet.classList.add('hop');

  const list = theme === 'day' ? petPhrasesDay : petPhrasesNight;
  const phrase = petPhraseIdx === 0 ? list[0] : list[petPhraseIdx % list.length];
  petPhraseIdx++;

  const b = $('#petBubble');
  b.textContent = phrase;
  b.classList.add('show');
  clearTimeout(petBubbleTimer);
  petBubbleTimer = setTimeout(() => b.classList.remove('show'), 3200);

  theme === 'day' ? Sfx.meow() : Sfx.purr();

  const r = pet.getBoundingClientRect();
  if(theme === 'day'){
    heartsBurst(r.left + r.width / 2, r.top, 4);
  }
  if(navigator.vibrate) navigator.vibrate(10);
}

/* ---------------------------------------------------------
   ОБНИМАШКА
   --------------------------------------------------------- */
function sendHug(){
  const list = DB.hugs();
  list.push({ ts: Date.now(), slot: slotOf().kind });
  DB.set(DB.keys.hugs, list);

  const b = $('#hugBtn').getBoundingClientRect();
  heartsBurst(b.left + b.width / 2, b.top + b.height / 2, 18);
  heartsBurst(window.innerWidth * .5, window.innerHeight * .55, 10);
  burst({
    particleCount: 40, spread: 120, startVelocity: 34,
    shapes: ['circle'], colors: ['#ff5f8f', '#ff8fab', '#ffc2d6', '#fff'],
    origin: { x: .5, y: .8 }
  });

  Sfx.chime();
  if(navigator.vibrate) navigator.vibrate([14, 30, 14, 30, 22]);
  toast('Обнимашка доставлена! 🤗', 2600);

  tg(`🤗 <b>Обнимашка доставлена</b>\n${fmtDateTime(Date.now())}\nВсего обнимашек: ${list.length}`);
}

/* ---------------------------------------------------------
   МОДАЛКИ
   --------------------------------------------------------- */
function openModal(sel){
  const m = $(sel);
  m.classList.add('open');
  m.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
function closeModal(m){
  m.classList.remove('open');
  m.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

$$('.modal').forEach(m => {
  m.addEventListener('click', (e) => {
    if(e.target === m || e.target.hasAttribute('data-close')) closeModal(m);
  });
});

/* ---------- История ---------- */
function renderHistory(){
  const opened = DB.opened();
  const items = Object.entries(opened)
    .map(([key, v]) => ({ key, ...v }))
    .sort((a, b) => b.ts - a.ts);

  $('#historyCount').textContent = items.length
    ? `Открыто ${plural(items.length, 'предсказание', 'предсказания', 'предсказаний')} ♡`
    : 'Пока пусто — но это ненадолго ♡';

  const box = $('#historyList');
  box.innerHTML = items.length ? '' : '<div class="empty">Здесь появятся все твои предсказания 🍪</div>';

  items.forEach((it, i) => {
    const el = document.createElement('div');
    el.className = 'item';
    el.style.animationDelay = (i * .04) + 's';
    el.innerHTML = `
      <div class="item-top">
        <span class="chip ${it.kind === 'night' ? 'night' : ''}">${it.kind === 'night' ? '🌙 вечер' : '☀️ день'}</span>
        <span>${fmtDateTime(it.ts)}</span>
      </div>
      <div class="item-txt">${escapeHtml(it.text)}</div>`;
    box.appendChild(el);
  });
}

/* ---------- Шёпот ---------- */
function sendWhisper(){
  const ta = $('#whisperText');
  const text = ta.value.trim();
  if(!text){ toast('Напиши хоть словечко ♡'); ta.focus(); return; }

  const list = DB.whispers();
  list.push({ text, ts: Date.now(), slot: slotOf().kind });
  DB.set(DB.keys.whispers, list);

  ta.value = '';
  $('#whisperCount').textContent = '0';
  closeModal($('#mWhisper'));

  burst({ particleCount: 50, spread: 100, origin: { x: .5, y: .6 } });
  heartsBurst(window.innerWidth / 2, window.innerHeight / 2, 8);
  Sfx.whoosh();
  toast('Шёпот отправлен 💌', 2600);

  tg(`💌 <b>Новый шёпот</b>\n${fmtDateTime(Date.now())}\n\n${escapeHtml(text)}`);
}

/* ---------------------------------------------------------
   АДМИНКА
   --------------------------------------------------------- */
let adminUnlocked = false;

function openAdmin(){
  openModal('#mAdmin');
  if(adminUnlocked){
    $('#adminGate').classList.add('hidden');
    $('#adminPanel').classList.remove('hidden');
    renderAdmin();
  } else {
    $('#adminGate').classList.remove('hidden');
    $('#adminPanel').classList.add('hidden');
    $('#pinErr').classList.add('hidden');
    $('#pinInput').value = '';
    setTimeout(() => $('#pinInput').focus(), 350);
  }
}

function tryPin(){
  if($('#pinInput').value === String(CONFIG.adminPin)){
    adminUnlocked = true;
    $('#adminGate').classList.add('hidden');
    $('#adminPanel').classList.remove('hidden');
    Sfx.magic();
    renderAdmin();
  } else {
    $('#pinErr').classList.remove('hidden');
    $('#pinInput').value = '';
    if(navigator.vibrate) navigator.vibrate([40, 60, 40]);
  }
}

function renderAdmin(){
  const opened = DB.opened();
  const hugs = DB.hugs();
  const whispers = DB.whispers();
  const custom = DB.custom();
  const meta = DB.meta();
  const now = new Date();

  /* Ключи слотов «сегодня» */
  const dayKey = `${ymd(now)}|day`;
  const nightBase = new Date(now);
  if(now.getHours() < CONFIG.dayStart) nightBase.setDate(nightBase.getDate() - 1);
  const nightKey = `${ymd(nightBase)}|night`;

  const dayRec = opened[dayKey];
  const nightRec = opened[nightKey];
  const slot = slotOf(now);

  /* Что он получит следующим: если текущая печенька уже открыта,
     речь про следующий слот, иначе про этот же */
  const nextKind = opened[slot.key] ? (slot.kind === 'day' ? 'night' : 'day') : slot.kind;
  const queued = custom.filter(c => !c.readAt).length;
  const upNext = pendingCustom({ kind: nextKind }, custom);
  const nextUp = upNext
    ? `твоя: «${upNext.text.length > 40 ? upNext.text.slice(0, 40) + '…' : upNext.text}»`
    : 'стандартную фразу из набора';

  const lastTs = Math.max(
    0,
    ...Object.values(opened).map(o => o.ts),
    ...hugs.map(h => h.ts),
    ...whispers.map(w => w.ts)
  );

  $('#statusCards').innerHTML = `
    <div class="stat ${dayRec ? 'ok' : 'no'}">
      <span class="stat-ico">☀️</span>
      <div>
        <div class="stat-k">Дневное предсказание (сегодня)</div>
        <div class="stat-v">${dayRec ? 'открыто · ' + fmtDateTime(dayRec.ts) : 'ещё не открыто'}</div>
      </div>
    </div>
    <div class="stat ${nightRec ? 'ok' : 'no'}">
      <span class="stat-ico">🌙</span>
      <div>
        <div class="stat-k">Вечернее предсказание (текущая ночь)</div>
        <div class="stat-v">${nightRec ? 'открыто · ' + fmtDateTime(nightRec.ts) : 'ещё не открыто'}</div>
      </div>
    </div>
    <div class="stat">
      <span class="stat-ico">🕒</span>
      <div>
        <div class="stat-k">Сейчас активен слот</div>
        <div class="stat-v">${slot.isDay ? 'дневной (07:00–20:00)' : 'вечерний (20:00–07:00)'}</div>
      </div>
    </div>
    <div class="stat ${queued ? 'ok' : ''}">
      <span class="stat-ico">✍️</span>
      <div>
        <div class="stat-k">Твоих фраз в очереди</div>
        <div class="stat-v">${queued ? plural(queued, 'фраза', 'фразы', 'фраз') + ' ждёт' : 'нет — он получит стандартную'}</div>
      </div>
    </div>
    <div class="stat">
      <span class="stat-ico">📬</span>
      <div>
        <div class="stat-k">Следующей он получит</div>
        <div class="stat-v">${escapeHtml(nextUp)}</div>
      </div>
    </div>
    <div class="stat">
      <span class="stat-ico">📊</span>
      <div>
        <div class="stat-k">Всего</div>
        <div class="stat-v">${plural(Object.keys(opened).length, 'печенька', 'печеньки', 'печенек')} · ${plural(hugs.length, 'обнимашка', 'обнимашки', 'обнимашек')} · ${plural(whispers.length, 'шёпот', 'шёпота', 'шёпотов')}</div>
      </div>
    </div>
    <div class="stat">
      <span class="stat-ico">👣</span>
      <div>
        <div class="stat-k">Первый визит / последняя активность</div>
        <div class="stat-v">${meta.firstVisit ? fmtDateTime(meta.firstVisit) : '—'} / ${lastTs ? fmtDateTime(lastTs) : '—'}</div>
      </div>
    </div>`;

  /* Журнал открытий */
  const log = Object.entries(opened).map(([k, v]) => ({ k, ...v })).sort((a, b) => b.ts - a.ts);
  $('#adminLog').innerHTML = log.length ? '' : '<div class="empty">Он пока ничего не открывал</div>';
  log.forEach(it => {
    const el = document.createElement('div');
    el.className = 'item';
    el.innerHTML = `
      <div class="item-top">
        <span class="chip ${it.kind === 'night' ? 'night' : ''}">${it.kind === 'night' ? '🌙 вечер' : '☀️ день'}</span>
        ${it.own ? '<span class="chip own">✍️ твоя</span>' : ''}
        <span>${fmtDateTime(it.ts)}</span>
      </div>
      <div class="item-txt">${escapeHtml(it.text)}</div>`;
    $('#adminLog').appendChild(el);
  });

  /* Входящие: шёпоты + обнимашки */
  const inbox = [
    ...whispers.map(w => ({ type: 'whisper', ...w })),
    ...hugs.map(h => ({ type: 'hug', ...h }))
  ].sort((a, b) => b.ts - a.ts);

  $('#adminInbox').innerHTML = inbox.length ? '' : '<div class="empty">Входящих пока нет 💌</div>';
  inbox.forEach(it => {
    const el = document.createElement('div');
    el.className = 'item';
    el.innerHTML = `
      <div class="item-top">
        <span class="chip ${it.type === 'hug' ? 'night' : ''}">${it.type === 'hug' ? '🤗 обнимашка' : '💌 шёпот'}</span>
        <span>${fmtDateTime(it.ts)}</span>
      </div>
      <div class="item-txt ${it.type === 'hug' ? 'plain' : ''}">${it.type === 'hug' ? 'Он отправил тебе обнимашку' : escapeHtml(it.text)}</div>`;
    $('#adminInbox').appendChild(el);
  });

  renderQueue(custom, nextKind);

  const tgCfg = CONFIG.telegram;
  const tgEl = $('#tgState');
  if(tgEl){
    tgEl.textContent = tgCfg.enabled && tgCfg.token && tgCfg.chatId
      ? 'Telegram: включён ✓ — уведомления приходят тебе в чат'
      : 'Telegram: выключен — впиши token и chatId в CONFIG';
  }
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

/* ---------------------------------------------------------
   TELEGRAM
   Из браузера нельзя слать POST+JSON на api.telegram.org —
   CORS его режет ещё до отправки. Поэтому шлём простой GET:
   браузер доставляет запрос, ответ читать не обязательно.
   --------------------------------------------------------- */
function tg(text){
  const c = CONFIG.telegram;
  if(!c.enabled || !c.token || !c.chatId) return;

  const url = 'https://api.telegram.org/bot' + c.token + '/sendMessage'
    + '?chat_id=' + encodeURIComponent(c.chatId)
    + '&text=' + encodeURIComponent(text)
    + '&parse_mode=HTML'
    + '&disable_web_page_preview=true';

  try{
    /* Image-beacon: срабатывает даже когда fetch режет CORS */
    const img = new Image();
    img.src = url;
  }catch(e){}

  try{
    fetch(url, { mode: 'no-cors', keepalive: true }).catch(() => {});
  }catch(e){}
}

/* ---------------------------------------------------------
   СВОИ ПРЕДСКАЗАНИЯ (вкладка «Мои фразы»)
   --------------------------------------------------------- */
let fortuneKind = 'any';

const kindLabel = { any:'любая печенька', day:'☀️ днём', night:'🌙 вечером' };

function renderQueue(list, nextKind){
  const custom = list || DB.custom();
  const kindOfNext = nextKind || slotOf().kind;

  const waiting = custom.filter(c => !c.readAt);
  const items = [...custom].sort((a, b) => {
    if(!a.readAt !== !b.readAt) return a.readAt ? 1 : -1;  // непрочитанные сверху
    return a.readAt ? b.readAt - a.readAt : a.ts - b.ts;
  });

  $('#queueHead').textContent = custom.length
    ? `В очереди ${plural(waiting.length, 'фраза', 'фразы', 'фраз')} · всего добавлено ${custom.length}`
    : 'Ты пока ничего не добавляла';

  const box = $('#fortuneList');
  box.innerHTML = items.length ? '' : '<div class="empty">Здесь появятся твои фразы ✍️</div>';

  /* какая уйдёт следующей — её и подсветим */
  const upNextId = (pendingCustom({ kind: kindOfNext }, custom) || {}).id;

  items.forEach((it, i) => {
    const el = document.createElement('div');
    el.className = 'q-item' + (it.readAt ? ' is-read' : '');
    el.style.animationDelay = (i * .04) + 's';
    el.innerHTML = `
      <div class="q-body">
        <div class="q-txt">${escapeHtml(it.text)}</div>
        <div class="q-meta">
          <span class="chip ${it.kind === 'night' ? 'night' : (it.kind === 'any' ? 'own' : '')}">${kindLabel[it.kind] || it.kind}</span>
          <span>${it.readAt
            ? 'он прочитал · ' + fmtDateTime(it.readAt)
            : (it.id === upNextId ? 'уйдёт следующей ♡' : 'ждёт очереди')}</span>
        </div>
      </div>
      <button class="q-del" data-del="${it.id}" aria-label="Удалить фразу">✕</button>`;
    box.appendChild(el);
  });
}

function addFortune(){
  const ta = $('#fortuneText');
  const text = ta.value.trim();
  if(!text){ toast('Сначала напиши фразу ♡'); ta.focus(); return; }

  const list = DB.custom();
  list.push({
    id: 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    text, kind: fortuneKind, ts: Date.now(), readAt: null, readSlot: null
  });
  DB.set(DB.keys.custom, list);

  ta.value = '';
  $('#fortuneCount').textContent = '0';
  Sfx.pop();
  toast('Фраза добавлена в очередь ✍️', 2200);
  renderAdmin();
}

function deleteFortune(id){
  const list = DB.custom().filter(c => c.id !== id);
  DB.set(DB.keys.custom, list);
  renderAdmin();
}

/* ---------------------------------------------------------
   СЕКРЕТНЫЙ ВХОД
   --------------------------------------------------------- */
function secretTrigger(el, needed = 3, windowMs = 1200){
  let taps = 0, timer;
  el.addEventListener('click', () => {
    taps++;
    clearTimeout(timer);
    timer = setTimeout(() => { taps = 0; }, windowMs);
    if(taps >= needed){ taps = 0; openAdmin(); }
  });
}

/* ---------------------------------------------------------
   СОБЫТИЯ
   --------------------------------------------------------- */
$('#cookie').addEventListener('click', openCookie);
$('#pet').addEventListener('click', petTap);
$('#hugBtn').addEventListener('click', sendHug);

$('#historyBtn').addEventListener('click', () => { renderHistory(); openModal('#mHistory'); Sfx.pop(); });
$('#whisperBtn').addEventListener('click', () => {
  openModal('#mWhisper');
  Sfx.pop();
  setTimeout(() => $('#whisperText').focus(), 350);
});
$('#whisperSend').addEventListener('click', sendWhisper);
$('#whisperText').addEventListener('input', (e) => { $('#whisperCount').textContent = e.target.value.length; });

$('#pinOk').addEventListener('click', tryPin);
$('#pinInput').addEventListener('keydown', (e) => { if(e.key === 'Enter') tryPin(); });

$$('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    $$('.tab').forEach(t => t.classList.toggle('is-on', t === tab));
    const map = { status:'#tabStatus', write:'#tabWrite', log:'#tabLog', inbox:'#tabInbox' };
    Object.entries(map).forEach(([k, sel]) => $(sel).classList.toggle('hidden', k !== tab.dataset.tab));
  });
});

/* Свои фразы */
$$('#fortuneKind .seg-b').forEach(b => {
  b.addEventListener('click', () => {
    fortuneKind = b.dataset.kind;
    $$('#fortuneKind .seg-b').forEach(x => x.classList.toggle('is-on', x === b));
  });
});
$('#fortuneAdd').addEventListener('click', addFortune);
$('#fortuneText').addEventListener('input', (e) => { $('#fortuneCount').textContent = e.target.value.length; });
$('#fortuneList').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-del]');
  if(btn) deleteFortune(btn.dataset.del);
});

$('#adminRefresh').addEventListener('click', () => { renderAdmin(); toast('Обновлено ✓', 1400); });

$('#adminExport').addEventListener('click', () => {
  const dump = {
    exportedAt: new Date().toISOString(),
    opened: DB.opened(), hugs: DB.hugs(), whispers: DB.whispers(),
    custom: DB.custom(), meta: DB.meta()
  };
  const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `pechenka-${ymd(new Date())}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
});

$('#adminWipe').addEventListener('click', () => {
  if(!confirm('Удалить всё: открытые предсказания, твои фразы, обнимашки и шёпоты?')) return;
  Object.values(DB.keys).forEach(k => { try{ localStorage.removeItem(k); }catch(e){} });
  render(); renderAdmin();
  toast('Данные сброшены', 1800);
});

/* Секретные входы: тройной тап по заголовку + невидимый угол */
secretTrigger($('#siteTitle'), 3);
secretTrigger($('#adminHotspot'), 3, 1500);
secretTrigger($('#secretDot'), 2, 900);

/* Разблокировка звука по первому касанию (требование iOS) */
['pointerdown', 'touchstart'].forEach(ev => {
  window.addEventListener(ev, () => Sfx.unlock(), { once: true, passive: true });
});

/* Тема может смениться, пока страница открыта */
setInterval(applyTheme, 20000);
document.addEventListener('visibilitychange', () => { if(!document.hidden){ render(); } });

/* ---------------------------------------------------------
   СТАРТ
   --------------------------------------------------------- */
function boot(){
  const meta = DB.meta();
  if(!meta.firstVisit) meta.firstVisit = Date.now();
  meta.lastSeen = Date.now();
  DB.set(DB.keys.meta, meta);

  $('#whisperName').textContent = CONFIG.himName;
  $('#whisperText').placeholder = 'Например: скучаю по тебе...';

  buildStars();
  applyTheme();
  render();

  const opened = DB.opened();
  setTimeout(() => {
    if(!opened[slotOf().key]){
      toast(slotOf().isDay ? 'Тебя ждёт печенька дня ☀️' : 'Тебя ждёт вечерняя печенька 🌙', 3200);
    }
  }, 900);
}

boot();
