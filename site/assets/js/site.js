/* SABY prototype — vanilla JS, no dependencies. Content comes from en-content.js / ar-content.js. */
(function () {
  'use strict';
  var root = document.documentElement;
  var C = window.SABY_CONTENT;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = matchMedia('(pointer: coarse)').matches;
  var lang = root.lang === 'ar' ? 'ar' : 'en';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var get = function (o, p) { return p.split('.').reduce(function (a, k) { return a && a[k]; }, o); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  /* "plain *accent* plain" -> [{t, a}] */
  function parts(str) {
    return str.split(/(\*[^*]+\*)/).filter(Boolean).map(function (s) {
      return s.charAt(0) === '*' ? { t: s.slice(1, -1), a: true } : { t: s, a: false };
    });
  }

  /* ---------------- render ---------------- */
  var scrubWords = [];
  function render(l) {
    lang = l; var t = C[l];
    root.lang = l; root.dir = t.dir;
    document.title = t.meta.title;
    $('meta[name=description]').setAttribute('content', t.meta.desc);

    $$('[data-t]').forEach(function (e) { e.textContent = get(t, e.dataset.t); });
    $$('[data-a]').forEach(function (e) { var p = e.dataset.a.split(':'); e.setAttribute(p[0], get(t, p[1])); });
    $$('[data-html]').forEach(function (e) {
      e.innerHTML = parts(get(t, e.dataset.html)).map(function (p) { return p.a ? '<span class="acc">' + esc(p.t) + '</span>' : esc(p.t); }).join('');
    });

    /* nav links (desktop + sheet) */
    var links = t.nav.links.map(function (a) { return '<a href="' + a.href + '">' + esc(a.text) + '</a>'; }).join('');
    $('#navLinks').innerHTML = links; $('#sheetLinks').innerHTML = links;

    /* hero title: word-by-word (words never split into letters -> Arabic joins stay intact) */
    var h = $('#heroTitle'), i = 0;
    h.setAttribute('aria-label', get(t, 'hero.title').replace(/\*/g, ''));
    h.innerHTML = parts(get(t, 'hero.title')).map(function (p) {
      return p.t.split(/(\s+)/).map(function (w) {
        if (!w) return '';
        if (/^\s+$/.test(w)) return ' ';
        var cls = 'w' + (p.a ? ' acc' : '');
        return '<span class="' + cls + '" aria-hidden="true" style="--i:' + (i++) + '">' + esc(w) + '</span>';
      }).join('');
    }).join('');

    /* manifesto: per-word base + overlay fill */
    var m = $('#manifestoText'); m.setAttribute('aria-label', get(t, 'manifesto.text').replace(/\*/g, ''));
    m.innerHTML = parts(get(t, 'manifesto.text')).map(function (p) {
      return p.t.split(/(\s+)/).map(function (w) {
        if (!w) return '';
        if (/^\s+$/.test(w)) return ' ';
        return '<span class="mw' + (p.a ? ' acc-w' : '') + '" aria-hidden="true">' + esc(w) + '<i>' + esc(w) + '</i></span>';
      }).join('');
    }).join('');
    scrubWords = $$('.mw i', m);

    /* cards */
    var ic = '<svg class="card__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M12 3v18M3 12h18"/></svg>';
    $('#expertiseGrid').innerHTML = t.expertise.items.map(function (c) {
      return '<article class="card" data-reveal>' + ic + '<span class="card__n">' + c.n + '</span><h3 class="card__t">' + esc(c.t) + '</h3><p class="card__d">' + esc(c.d) + '</p></article>';
    }).join('');
    $('#whyGrid').innerHTML = t.why.cards.map(function (c) {
      return '<article class="card" data-reveal><span class="card__n">' + c.n + '</span><h3 class="card__t">' + esc(c.t) + '</h3><p class="card__d">' + esc(c.d) + '</p></article>';
    }).join('');

    /* ticker: 2 halves x 2 copies so the -50% loop is seamless on wide screens */
    var half = t.ticker.concat(t.ticker).map(function (s) { return '<span>' + esc(s) + '</span>'; }).join('');
    $('#tickerTrack').innerHTML = half + half;

    $('#phoneLink').textContent = t.cta.phone; $('#emailLink').textContent = t.cta.email;
    $('#emailLink').href = 'mailto:' + t.cta.email;

    stagger(); observeReveals(); bindSpotlight(); measure(); onScroll();
  }

  /* ---------------- reveal (opacity 1s ease-io, stagger 200ms like Hexaflow) ---------------- */
  var io;
  function stagger() {
    $$('.grid').forEach(function (g) { $$('[data-reveal]', g).forEach(function (e, i) { e.style.setProperty('--d', (i % 3) * 200 + 'ms'); }); });
    $$('.hero__inner [data-reveal]').forEach(function (e, i) { e.style.setProperty('--d', (900 + i * 200) + 'ms'); });
  }
  function observeReveals() {
    if (io) io.disconnect();
    if (reduce || !('IntersectionObserver' in window)) { $$('[data-reveal]').forEach(function (e) { e.classList.add('in'); }); return; }
    io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    $$('[data-reveal]').forEach(function (e) { if (!e.classList.contains('hero__eyebrow') && !e.closest('.hero__inner')) io.observe(e); });
  }
  function startHero() {
    root.classList.add('words-in');
    $$('.hero__inner [data-reveal]').forEach(function (e) { e.classList.add('in'); });
  }

  /* ---------------- loader: dim wordmark, letters light L->R, then 250ms crossfade ---------------- */
  function runLoader() {
    var L = $('#loader'), W = $('#loaderWord');
    if (root.classList.contains('no-loader')) { startHero(); return; }
    W.innerHTML = C[lang].loader.word.split('').map(function (c) { return '<span>' + c + '</span>'; }).join('');
    var sp = $$('span', W);
    sp.forEach(function (s, i) { setTimeout(function () { s.classList.add('on'); }, 350 + i * 260); });
    setTimeout(function () {
      L.classList.add('is-done'); sessionStorage.setItem('saby-seen', '1');
      setTimeout(startHero, 120);
    }, 350 + sp.length * 260 + 500);
  }

  /* ---------------- manifesto scrub ---------------- */
  var sec, secTop = 0, secH = 0, vh = 0, cur = 0, target = 0, raf = 0;
  function measure() {
    sec = $('#manifesto'); vh = innerHeight;
    secTop = sec.getBoundingClientRect().top + scrollY; secH = sec.offsetHeight;
  }
  function paint() {
    var n = scrubWords.length, p = cur;
    for (var i = 0; i < n; i++) {
      var f = clamp(p * (n + 2) - i, 0, 1);      /* each word fills over ~1 word-width of scroll */
      scrubWords[i].style.width = (f * 100).toFixed(1) + '%';
    }
  }
  function loop() {
    cur += (target - cur) * 0.14;
    if (Math.abs(target - cur) < 0.0004) cur = target;
    paint();
    raf = cur === target ? 0 : requestAnimationFrame(loop);
  }
  function onScroll() {
    var y = scrollY;
    if (!reduce) {
      target = clamp((y - secTop + vh * 0.15) / ((secH - vh * 1.05) * 0.85), 0, 1);
      if (!raf) raf = requestAnimationFrame(loop);
      /* band parallax */
      var b = $('.band__img'), br = $('.band').getBoundingClientRect();
      if (br.bottom > 0 && br.top < vh) b.style.transform = 'translate3d(0,' + ((br.top + br.height / 2 - vh / 2) * -0.16).toFixed(1) + 'px,0)';
    }
    /* nav hide/show */
    var nav = $('#nav');
    nav.classList.toggle('is-hidden', y > lastY && y > 240 && !$('#sheet').classList.contains('is-open'));
    lastY = y;
    /* active link */
    var cur_ = '';
    ['manifesto', 'expertise', 'why', 'contact'].forEach(function (id) { var e = document.getElementById(id); if (e && e.getBoundingClientRect().top < vh * 0.4) cur_ = '#' + id; });
    $$('#navLinks a').forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === cur_); });
  }
  var lastY = 0;
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', function () { measure(); onScroll(); sizeStars(); });

  /* ---------------- card spotlight ---------------- */
  function bindSpotlight() {
    if (coarse) return;
    $$('.card').forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------------- burger / sheet ---------------- */
  var burger = $('#burger'), sheet = $('#sheet');
  function sheetToggle(open) {
    burger.setAttribute('aria-expanded', open); sheet.classList.toggle('is-open', open);
    sheet.setAttribute('aria-hidden', !open); document.body.style.overflow = open ? 'hidden' : '';
    burger.setAttribute('aria-label', C[lang].nav[open ? 'close' : 'menu']);
    if (open) $('#nav').classList.remove('is-hidden');
  }
  burger.addEventListener('click', function () { sheetToggle(burger.getAttribute('aria-expanded') !== 'true'); });
  sheet.addEventListener('click', function (e) { if (e.target.closest('a')) sheetToggle(false); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape') sheetToggle(false); });

  /* ---------------- language switch ---------------- */
  $('#langBtn').addEventListener('click', function () {
    var l = lang === 'en' ? 'ar' : 'en';
    localStorage.setItem('saby-lang', l);
    root.classList.remove('words-in'); root.classList.add('lang-swap');
    render(l);
    $$('[data-reveal]').forEach(function (e) { if (e.closest('.hero__inner')) e.classList.remove('in'); });
    requestAnimationFrame(function () { requestAnimationFrame(startHero); });
  });

  /* ---------------- starfield (tiny canvas, paused when hero is off-screen) ---------------- */
  var cv = $('#stars'), cx = cv.getContext('2d'), stars = [], sw = 0, sh = 0, dpr = 1, visible = true, sraf = 0;
  function sizeStars() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    var r = cv.getBoundingClientRect(); sw = r.width; sh = r.height;
    cv.width = sw * dpr; cv.height = sh * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = sw < 700 ? 40 : 90; stars = [];
    for (var i = 0; i < n; i++) stars.push({ x: Math.random() * sw, y: Math.random() * sh, r: Math.random() * 1.1 + .3, p: Math.random() * 6.28, s: Math.random() * .8 + .3 });
    drawStars(0);
  }
  function drawStars(t) {
    cx.clearRect(0, 0, sw, sh);
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i], a = reduce ? .5 : .25 + .5 * (.5 + .5 * Math.sin(t / 1000 * s.s + s.p));
      cx.fillStyle = 'rgba(210,210,255,' + a.toFixed(3) + ')'; cx.beginPath(); cx.arc(s.x, s.y, s.r, 0, 6.283); cx.fill();
    }
  }
  function starLoop(t) { if (visible && !reduce) drawStars(t); sraf = requestAnimationFrame(starLoop); }
  new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe($('.hero'));

  /* ---------------- boot ---------------- */
  render(lang);
  sizeStars(); if (!reduce) sraf = requestAnimationFrame(starLoop);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); onScroll(); });
  addEventListener('load', function () { measure(); onScroll(); });
  runLoader();
})();
