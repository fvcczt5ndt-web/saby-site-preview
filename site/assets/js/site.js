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
  var typingTimer = 0, manifestoObserver = null;
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

    /* manifesto: complete accessible sentence + a visual one-time typing layer */
    var m = $('#manifestoText');
    m.dataset.source = get(t, 'manifesto.text');

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

    stagger(); observeReveals(); bindSpotlight(); setupManifestoTyping(); vh = innerHeight; onScroll();
  }

  /* ---------------- reveal (opacity 1s ease-io, stagger 200ms like Hexaflow) ---------------- */
  var io;
  function stagger() {
    $$('.grid').forEach(function (g) { $$('[data-reveal]', g).forEach(function (e, i) { e.style.setProperty('--d', (i % 3) * 200 + 'ms'); }); });
    $$('.hero__inner [data-reveal]').forEach(function (e, i) { e.style.setProperty('--d', (420 + i * 100) + 'ms'); });
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
    sp.forEach(function (s, i) { setTimeout(function () { s.classList.add('on'); }, 90 + i * 95); });
    setTimeout(startHero, 330);
    setTimeout(function () {
      L.classList.add('is-done'); sessionStorage.setItem('saby-seen', '1');
    }, 90 + sp.length * 95 + 250);
  }

  /* ---------------- manifesto: autonomous typing, never scrubbed by scroll ---------------- */
  function manifestoRich(raw) {
    return parts(raw).map(function (p) {
      return p.a ? '<span class="manifesto__accent">' + esc(p.t) + '</span>' : esc(p.t);
    }).join('');
  }
  function setupManifestoTyping() {
    clearTimeout(typingTimer);
    if (manifestoObserver) manifestoObserver.disconnect();
    var m = $('#manifestoText'), raw = m.dataset.source || '', plain = raw.replace(/\*/g, '');
    m.setAttribute('aria-label', plain);
    m.classList.remove('is-typing', 'is-complete');
    m.innerHTML = '<span class="manifesto__typed" aria-hidden="true"></span><span class="manifesto__cursor" aria-hidden="true"></span>';
    var shown = $('.manifesto__typed', m), index = 0, started = false;
    function complete() {
      shown.innerHTML = manifestoRich(raw);
      m.classList.remove('is-typing'); m.classList.add('is-complete');
    }
    function typeNext() {
      if (document.hidden) { typingTimer = setTimeout(typeNext, 120); return; }
      index += 1; shown.textContent = plain.slice(0, index);
      if (index >= plain.length) { complete(); return; }
      var c = plain.charAt(index - 1), delay = lang === 'ar' ? 24 : 19;
      if (/\s/.test(c)) delay = 10;
      if (/[,،:؛]/.test(c)) delay = 110;
      if (/[.!؟?]/.test(c)) delay = 210;
      typingTimer = setTimeout(typeNext, delay);
    }
    function start() {
      if (started) return; started = true; m.classList.add('is-typing');
      typingTimer = setTimeout(typeNext, 180);
    }
    if (reduce || !('IntersectionObserver' in window)) { complete(); return; }
    manifestoObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        manifestoObserver.disconnect(); start();
      });
    }, { threshold: 0.38, rootMargin: '0px 0px -8% 0px' });
    manifestoObserver.observe(m);
  }

  var vh = innerHeight;
  function onScroll() {
    var y = scrollY;
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
  addEventListener('resize', function () { vh = innerHeight; onScroll(); sizeStars(); });

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

  /* ---------------- interactive hero field: pointer/touch depth + responsive stars ---------------- */
  var cv = $('#stars'), cx = cv.getContext('2d'), stars = [], sw = 0, sh = 0, dpr = 1, visible = true, sraf = 0;
  var hero = $('.hero'), heroOrbs = $('.hero > .orbs');
  var field = { active: false, px: 0, py: 0, tx: 0, ty: 0, x: 0, y: 0 };
  function bindHeroInteraction() {
    if (reduce) return;
    function point(e) {
      var r = hero.getBoundingClientRect();
      field.px = e.clientX - r.left; field.py = e.clientY - r.top;
      field.tx = clamp((field.px / r.width - .5) * 2, -1, 1);
      field.ty = clamp((field.py / r.height - .5) * 2, -1, 1);
      field.active = true;
    }
    function reset() { field.active = false; field.tx = 0; field.ty = 0; }
    hero.addEventListener('pointermove', point, { passive: true });
    hero.addEventListener('pointerdown', point, { passive: true });
    hero.addEventListener('pointerleave', reset);
    hero.addEventListener('pointerup', function (e) { if (e.pointerType !== 'mouse') reset(); });
    hero.addEventListener('pointercancel', reset);
  }
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
      var s = stars[i], x = s.x, y = s.y, a = reduce ? .5 : .25 + .5 * (.5 + .5 * Math.sin(t / 1000 * s.s + s.p));
      if (field.active) {
        var dx = x - field.px, dy = y - field.py, distance = Math.sqrt(dx * dx + dy * dy), radius = coarse ? 112 : 156;
        if (distance > 0 && distance < radius) {
          var force = (1 - distance / radius) * (coarse ? 8 : 11);
          x += dx / distance * force; y += dy / distance * force;
        }
      }
      cx.fillStyle = 'rgba(210,210,255,' + a.toFixed(3) + ')'; cx.beginPath(); cx.arc(x, y, s.r, 0, 6.283); cx.fill();
    }
  }
  function starLoop(t) {
    if (!visible || reduce) { sraf = 0; return; }
    field.x += (field.tx - field.x) * .1; field.y += (field.ty - field.y) * .1;
    heroOrbs.style.transform = 'translate3d(' + (field.x * 12).toFixed(2) + 'px,' + (field.y * 9).toFixed(2) + 'px,0)';
    drawStars(t); sraf = requestAnimationFrame(starLoop);
  }
  new IntersectionObserver(function (e) {
    visible = e[0].isIntersecting;
    if (visible && !reduce && !sraf) sraf = requestAnimationFrame(starLoop);
    if (!visible && sraf) { cancelAnimationFrame(sraf); sraf = 0; }
  }).observe(hero);

  /* ---------------- boot ---------------- */
  render(lang);
  bindHeroInteraction(); sizeStars(); if (!reduce) sraf = requestAnimationFrame(starLoop);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { vh = innerHeight; onScroll(); });
  addEventListener('load', function () { vh = innerHeight; onScroll(); });
  runLoader();
})();
