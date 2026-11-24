/* =========================================================
   MUDANZAS EJECUTIVAS LOGAN · script.js
   «La ruta de Logan» — un solo bucle rAF, Lenis opcional,
   anime.js opcional. Si algo no carga, la página sigue completa.
   ========================================================= */
(() => {
  'use strict';

  /* ---------- Datos (única fuente de verdad) ---------- */
  const WHATSAPP_NUMERO = "524448294666";
  const TELEFONOS = ["444 829 4666", "444 814 6190", "444 199 8298"];

  /* ---------- Utilidades ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = document.documentElement;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = t => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hoverFine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  const safe = (name, fn) => { try { fn(); } catch (err) { console.error('[Logan]', name, err); } };

  // La clase `js` activa los estados ocultos del CSS; todo tiene respaldo.
  root.classList.remove('no-js');
  root.classList.add('js');

  let vh = window.innerHeight;
  let vw = window.innerWidth;
  let lenis = null;
  const ticks = [];

  /* ---------- WhatsApp ---------- */
  const hasWA = /^\d{10,15}$/.test(WHATSAPP_NUMERO);
  const waUrl = msg => `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(msg)}`;
  safe('wa', () => {
    if (!hasWA) root.classList.add('no-wa');
    $$('[data-wa]').forEach(a => {
      if (!hasWA) { a.hidden = true; return; }
      a.href = waUrl(a.dataset.waMsg || 'Hola, quiero cotizar una mudanza');
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    });
    const call = $('.form__call');
    if (call) call.href = 'tel:+52' + TELEFONOS[0].replace(/\D/g, '');
  });

  /* ---------- Tween (anime.js si existe) ---------- */
  function tween(from, to, dur, mode, update, done) {
    if (window.anime) {
      const o = { v: from };
      window.anime({
        targets: o, v: to, duration: dur,
        easing: mode === 'out' ? 'easeOutExpo' : 'easeInOutQuad',
        update: () => update(o.v),
        complete: () => done && done()
      });
      return;
    }
    const t0 = performance.now();
    (function step(t) {
      const k = clamp((t - t0) / dur);
      const e = mode === 'out' ? 1 - Math.pow(1 - k, 4) : ease(k);
      update(from + (to - from) * e);
      if (k < 1) requestAnimationFrame(step); else if (done) done();
    })(t0);
  }

  /* =========================================================
     CARGADOR
     ========================================================= */
  function ready() {
    if (!document.body.classList.contains('is-ready')) document.body.classList.add('is-ready');
  }
  let waShown = false;
  function showWaFloat() {
    if (waShown) return;
    waShown = true;
    const f = $('#waFloat');
    if (f) f.classList.add('is-on');
    if (hasWA && f) {
      const b = $('#waBubble');
      setTimeout(() => b && b.classList.add('is-show'), 5000);
      setTimeout(() => b && b.classList.remove('is-show'), 12000);
      const x = $('#waBubbleX');
      if (x) x.addEventListener('click', () => b.classList.remove('is-show'));
    }
  }

  safe('loader', () => {
    const L = $('#loader');
    if (!L) { ready(); showWaFloat(); return; }
    const pct = $('#loaderPct'), arc = $('#loaderArc'), truck = $('#loaderTruck');
    const msgs = $$('.loader__msg span');
    const C = 427.3;
    let finished = false, mi = 0;
    const truckW = () => (vw >= 900 ? 110 : 90);
    const setP = v => {
      pct.textContent = String(Math.round(v)).padStart(3, '0') + '%';
      arc.style.strokeDashoffset = (C * (1 - v / 100)).toFixed(2);
      truck.style.transform = `translateX(${((v / 100) * (vw - truckW())).toFixed(1)}px)`;
    };
    const msgT = setInterval(() => {
      if (!msgs.length) return;
      msgs[mi].classList.remove('is-on');
      mi = Math.min(mi + 1, msgs.length - 1);
      msgs[mi].classList.add('is-on');
    }, 450);
    function finish() {
      if (finished) return;
      finished = true;
      clearInterval(msgT);
      setP(100);
      pct.textContent = '¡LISTO!';
      setTimeout(() => {
        L.classList.add('is-done', 'is-open');
        ready();
        setTimeout(() => { L.classList.add('is-gone'); showWaFloat(); }, 820);
      }, 150);
    }
    setP(0);
    if (reduce) { finish(); return; }
    tween(0, 100, 1300, 'inout', setP, finish);
    setTimeout(finish, 1800); // respaldo si rAF se pausa (pestaña oculta)
  });
  // Respaldo duro: nada se queda esperando al cargador
  setTimeout(() => { ready(); showWaFloat(); const L = $('#loader'); if (L) L.classList.add('is-gone'); }, 2600);

  /* =========================================================
     LENIS (scroll suave) — opcional
     ========================================================= */
  safe('lenis', () => {
    if (reduce || !window.Lenis) return;
    lenis = new window.Lenis({ lerp: .085, wheelMultiplier: .9, smoothWheel: true });
  });
  const lockScroll = on => { if (lenis) (on ? lenis.stop() : lenis.start()); };

  /* =========================================================
     REVELADOS (IntersectionObserver + respaldo por geometría)
     ========================================================= */
  const pending = new Set();
  const itemOf = new Map();
  let io = null;
  function fire(item) {
    if (!item || item.done) return;
    item.done = true;
    pending.delete(item);
    if (io) io.unobserve(item.el);
    try { item.cb(item.el); } catch (e) { console.error(e); }
  }
  function watch(el, cb) {
    const item = { el, cb, done: false };
    pending.add(item);
    itemOf.set(el, item);
    if (io) io.observe(el);
  }
  function geo() {
    pending.forEach(item => {
      const r = item.el.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh * .98) fire(item);
    });
  }
  let geoQueued = false;
  function queueGeo() {
    if (geoQueued) return;
    geoQueued = true;
    requestAnimationFrame(() => { geoQueued = false; geo(); });
  }

  function runCounters(scope) {
    $$('b[data-count]', scope).forEach(b => {
      const to = +b.dataset.count;
      const from = +(b.dataset.from || 0);
      if (reduce) { b.textContent = to; return; }
      b.textContent = from;
      tween(from, to, from ? 2000 : 1500, 'out', v => { b.textContent = Math.round(v); }, () => { b.textContent = to; });
    });
  }

  safe('reveal', () => {
    if (reduce) { root.classList.add('reveal-all'); }
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(es => {
        es.forEach(e => { if (e.isIntersecting) fire(itemOf.get(e.target)); });
      }, { threshold: .15, rootMargin: '0px 0px -8% 0px' });
    }
    $$('[data-reveal]').forEach(el => watch(el, node => {
      node.classList.add('is-in');
      if (node.querySelector('b[data-count]')) runCounters(node);
    }));
    const stamp = $('#stamp');
    if (stamp) watch(stamp, n => n.classList.add('is-in'));
    window.addEventListener('scroll', queueGeo, { passive: true });
    window.addEventListener('resize', queueGeo);
    window.addEventListener('load', () => setTimeout(geo, 2000));
    setTimeout(geo, 2000);
    setTimeout(geo, 4500);
    queueGeo();
  });
  // Si algo del módulo anterior falla, jamás dejamos secciones vacías
  setTimeout(() => { if (!io && !reduce) root.classList.add('reveal-all'); }, 3000);

  /* ---------- Odómetro ---------- */
  safe('odometer', () => {
    $$('.odo[data-odo]').forEach(el => {
      const txt = el.dataset.odo;
      if (reduce) return;
      el.setAttribute('aria-label', txt);
      el.textContent = '';
      const cols = [];
      txt.split('').forEach((ch, i) => {
        const d = document.createElement('span');
        d.className = 'odo__d';
        d.setAttribute('aria-hidden', 'true');
        const c = document.createElement('span');
        c.className = 'odo__c';
        c.style.transitionDelay = (i * .12) + 's';
        for (let n = 0; n <= 9; n++) { const s = document.createElement('span'); s.textContent = n; c.appendChild(s); }
        d.appendChild(c);
        el.appendChild(d);
        cols.push([c, +ch]);
      });
      watch(el, () => { requestAnimationFrame(() => cols.forEach(([c, n]) => { c.style.transform = `translateY(${-n}em)`; })); });
    });
  });

  /* =========================================================
     BUCLE ÚNICO DE SCROLL
     ========================================================= */
  let sy = window.scrollY, vy = 0, frame = 0;
  function loop(t) {
    if (lenis) lenis.raf(t);
    const y = window.scrollY;
    vy = y - sy; sy = y;
    for (let i = 0; i < ticks.length; i++) { try { ticks[i](y, t); } catch (e) { console.error(e); ticks.splice(i, 1); i--; } }
    if ((++frame % 15) === 0) geo();
    requestAnimationFrame(loop);
  }

  /* ---------- Barra de progreso ---------- */
  safe('progress', () => {
    const bar = $('.progress__bar'), tr = $('.progress__truck');
    if (!bar) return;
    ticks.push(y => {
      const max = root.scrollHeight - vh;
      const p = max > 0 ? clamp(y / max) : 0;
      bar.style.transform = `scaleX(${p.toFixed(4)})`;
      tr.style.transform = `translateX(${(p * (vw - 24)).toFixed(1)}px)`;
    });
  });

  /* ---------- Encabezado, menú y enlaces activos ---------- */
  let menuOpen = false;
  const menu = $('#menu'), burger = $('#burger');
  function setMenu(open) {
    menuOpen = open;
    document.body.classList.toggle('menu-open', open);
    if (menu) { menu.classList.toggle('is-open', open); menu.setAttribute('aria-hidden', open ? 'false' : 'true'); }
    if (burger) { burger.setAttribute('aria-expanded', open ? 'true' : 'false'); burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú'); }
    lockScroll(open);
    if (open) { const h = $('#header'); h && h.classList.remove('is-hidden'); }
  }
  safe('header', () => {
    const header = $('#header');
    let last = window.scrollY;
    ticks.push(y => {
      header.classList.toggle('is-solid', y > 40);
      if (menuOpen) return;
      const d = y - last;
      if (Math.abs(d) > 6) {
        if (d > 0 && y > 200) header.classList.add('is-hidden'); else header.classList.remove('is-hidden');
        last = y;
      }
      if (y <= 200) header.classList.remove('is-hidden');
    });
    if (burger) burger.addEventListener('click', () => setMenu(!menuOpen));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && menuOpen) setMenu(false); });
    if (menu) menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
    window.addEventListener('resize', () => { if (vw >= 1040 && menuOpen) setMenu(false); });

    // enlace activo
    const links = $$('.nav a');
    const map = new Map();
    links.forEach(a => { const s = $(a.getAttribute('href')); if (s) map.set(s, a); });
    if ('IntersectionObserver' in window) {
      const so = new IntersectionObserver(es => {
        es.forEach(e => {
          if (e.isIntersecting) { links.forEach(l => l.classList.remove('is-active')); const a = map.get(e.target); a && a.classList.add('is-active'); }
        });
      }, { rootMargin: '-40% 0px -55% 0px' });
      map.forEach((a, s) => so.observe(s));
    }
  });

  /* ---------- Anclas con scroll suave ---------- */
  safe('anchors', () => {
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href');
      if (!id || id.length < 2) return;
      const t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      if (menuOpen) setMenu(false);
      if (lenis) lenis.scrollTo(t, { offset: id === '#inicio' ? 0 : -8, duration: 1.5 });
      else t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', id);
    });
  });

  /* =========================================================
     HERO
     ========================================================= */
  safe('hero', () => {
    const hero = $('#inicio'), vis = $('.hero__vis');
    if (!hero || !vis) return;
    $$('.cube-par').forEach(c => c.style.setProperty('--dp', c.dataset.depth || 0));
    let heroOn = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(es => { heroOn = es[0].isIntersecting; }, { threshold: 0 }).observe(hero);
    }
    // Mazo de fotos que rota
    const cards = $$('.deck__card');
    if (!reduce && cards.length === 3) {
      setInterval(() => {
        if (document.hidden || !heroOn) return;
        cards.forEach(c => { c.dataset.pos = (+c.dataset.pos + 2) % 3; });
      }, 4200);
    }
    // Inclinación 3D con puntero (o automática en táctil)
    let tx = 0, ty = 0, cx = 0, cy = 0;
    if (hoverFine && !reduce) {
      hero.addEventListener('pointermove', e => {
        const r = vis.getBoundingClientRect();
        tx = clamp(((e.clientX - r.left) / r.width - .5) * 2, -1, 1);
        ty = clamp(((e.clientY - r.top) / r.height - .5) * 2, -1, 1);
      });
      hero.addEventListener('pointerleave', () => { tx = 0; ty = 0; });
    }
    ticks.push((y, t) => {
      if (!heroOn || reduce) return;
      if (!hoverFine) { tx = Math.sin(t / 2200) * .6; ty = Math.cos(t / 2900) * .45; }
      cx += (tx - cx) * .08; cy += (ty - cy) * .08;
      vis.style.setProperty('--mx', cx.toFixed(3));
      vis.style.setProperty('--my', cy.toFixed(3));
      $$('.cube-par').forEach(c => c.style.setProperty('--sy', (-y * (parseFloat(c.dataset.depth) || 0) * .003).toFixed(2)));
    });
    // Botón primario magnético
    if (hoverFine && !reduce) {
      $$('.magnetic').forEach(b => {
        b.addEventListener('pointermove', e => {
          const r = b.getBoundingClientRect();
          b.style.transform = `translate(${((e.clientX - r.left - r.width / 2) * .12).toFixed(1)}px,${((e.clientY - r.top - r.height / 2) * .22).toFixed(1)}px)`;
        });
        b.addEventListener('pointerleave', () => { b.style.transform = ''; });
      });
    }
  });

  /* ---------- Cinta: velocidad ligada al scroll ---------- */
  safe('marquee', () => {
    if (reduce) return;
    const tracks = $$('[data-marquee] .band__track');
    let anims = [], cur = 1;
    ticks.push(() => {
      if (!anims.length) anims = tracks.map(t => (t.getAnimations ? t.getAnimations()[0] : null)).filter(Boolean);
      if (!anims.length) return;
      const target = 1 + Math.min(10, Math.abs(vy) * .02);
      cur += (target - cur) * .08;
      anims.forEach(a => { a.playbackRate = cur; });
    });
  });

  /* =========================================================
     PROMESA: palabras que se encienden
     ========================================================= */
  safe('manifest', () => {
    const el = $('#manifest');
    if (!el || reduce) return;
    (function split(node) {
      Array.from(node.childNodes).forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(tok => {
            if (!tok) return;
            if (/^\s+$/.test(tok)) frag.appendChild(document.createTextNode(tok));
            else { const s = document.createElement('span'); s.className = 'wd'; s.textContent = tok; frag.appendChild(s); }
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) split(n);
      });
    })(el);
    const words = $$('.wd', el);
    const n = words.length;
    words.forEach(w => { w.style.opacity = '.14'; });
    let lastP = -1;
    ticks.push(() => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh) return;
      const p = clamp((vh * .85 - r.top) / (vh * .4));
      if (Math.abs(p - lastP) < .002) return;
      lastP = p;
      words.forEach((w, i) => { w.style.opacity = (.14 + .86 * clamp((p * (n + 6) - i) / 6)).toFixed(3); });
    });
  });

  /* =========================================================
     SERVICIOS: carril nativo (móvil) o pin horizontal (escritorio)
     ========================================================= */
  safe('services', () => {
    const sec = $('#servicios'), svc = $('#svc'), stage = $('#svcStage'), track = $('#svcTrack');
    const bar = $('#svcBar'), num = $('#svcNum');
    if (!svc || !stage || !track) return;
    const cards = $$('.card', track);
    let pinned = false, dist = 0, cur = 0;

    function setup() {
      const want = !reduce && window.matchMedia('(min-width:900px) and (hover:hover)').matches;
      if (want) {
        svc.classList.add('is-pinned'); sec.classList.add('has-pin');
        stage.scrollLeft = 0;
        track.style.transform = '';
        dist = Math.max(0, track.offsetWidth - vw);
        svc.style.height = (dist + vh) + 'px';
        pinned = true;
      } else {
        svc.classList.remove('is-pinned'); sec.classList.remove('has-pin');
        svc.style.height = ''; track.style.transform = ''; pinned = false;
        cards.forEach(c => c.style.removeProperty('--px'));
      }
    }
    setup();
    window.addEventListener('resize', () => { clearTimeout(setup._t); setup._t = setTimeout(setup, 150); });
    window.addEventListener('load', setup);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(setup);

    const setUi = prog => {
      if (bar) bar.style.transform = `scaleX(${clamp(prog, .06, 1).toFixed(3)})`;
      if (num) num.textContent = String(clamp(Math.round(prog * 5) + 1, 1, 6)).padStart(2, '0');
    };
    stage.addEventListener('scroll', () => {
      if (pinned) return;
      const max = stage.scrollWidth - stage.clientWidth;
      setUi(max > 0 ? stage.scrollLeft / max : 0);
    }, { passive: true });
    setUi(0);

    ticks.push(() => {
      if (!pinned) return;
      const r = svc.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      const p = clamp(-r.top / Math.max(1, dist));
      const target = p * dist;
      cur += (target - cur) * .12;
      if (Math.abs(target - cur) < .2) cur = target;
      track.style.transform = `translate3d(${(-cur).toFixed(1)}px,0,0)`;
      setUi(dist ? cur / dist : 0);
      cards.forEach(c => {
        const cr = c.getBoundingClientRect();
        c.style.setProperty('--px', (((cr.left + cr.width / 2) - vw / 2) / vw * -50).toFixed(1) + 'px');
      });
    });

    if (hoverFine && !reduce) {
      cards.forEach(c => {
        c.addEventListener('pointermove', e => {
          const r = c.getBoundingClientRect();
          c.style.setProperty('--ry', (((e.clientX - r.left) / r.width - .5) * 8).toFixed(2) + 'deg');
          c.style.setProperty('--rx', (((e.clientY - r.top) / r.height - .5) * -6).toFixed(2) + 'deg');
        });
        c.addEventListener('pointerleave', () => { c.style.setProperty('--ry', '0deg'); c.style.setProperty('--rx', '0deg'); });
      });
    }
  });

  /* =========================================================
     LA MANIOBRA: la foto se abre a pantalla completa
     ========================================================= */
  safe('maniobra', () => {
    const man = $('#maniobra');
    if (!man) return;
    const cap = $('.man__cap', man);
    if (reduce) return;
    man.classList.add('is-pin');
    let e = 0;
    ticks.push(() => {
      const r = man.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      const total = Math.max(1, man.offsetHeight - vh);
      const p = clamp(-r.top / total);
      const target = ease(clamp(p / .7));
      e += (target - e) * .18;
      if (Math.abs(target - e) < .001) e = target;
      man.style.setProperty('--e', e.toFixed(4));
      man.style.setProperty('--t', clamp(p / .3).toFixed(3));
      const c = clamp((p - .72) / .14);
      man.style.setProperty('--c', c.toFixed(3));
      if (cap) cap.classList.toggle('is-live', c > .6);
    });
  });

  /* =========================================================
     PROCESO: tarjetas apiladas
     ========================================================= */
  safe('steps', () => {
    const steps = $$('.step');
    if (!steps.length || reduce) return;
    const wrap = $('#steps');
    ticks.push(() => {
      const wr = wrap.getBoundingClientRect();
      if (wr.bottom < -100 || wr.top > vh + 100) return;
      steps.forEach((s, i) => {
        if (vw < 640 || i === steps.length - 1) { s.style.setProperty('--depth', 0); return; }
        const r = s.getBoundingClientRect(), n = steps[i + 1].getBoundingClientRect();
        s.style.setProperty('--depth', clamp(1 - (n.top - r.top) / r.height).toFixed(3));
      });
    });
  });

  /* =========================================================
     LA RUTA: trazo que se dibuja y camión que avanza
     ========================================================= */
  safe('ruta', () => {
    const sec = $('#ruta'), path = $('#rPath'), truck = $('#rTruck'), nodes = $('#rNodes');
    if (!sec || !path || !truck) return;
    const txt = $$('.ruta__t');
    const len = path.getTotalLength();
    path.style.strokeDasharray = len;
    const NS = 'http://www.w3.org/2000/svg';
    [.25, .5, .75].forEach(p => {
      const pt = path.getPointAtLength(len * p);
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', pt.x); c.setAttribute('cy', pt.y); c.setAttribute('r', 8);
      c.setAttribute('fill', '#0A1A3F'); c.setAttribute('stroke', '#F2A71B'); c.setAttribute('stroke-width', 3);
      nodes.appendChild(c);
    });
    const pin = !reduce;
    if (pin) sec.classList.add('is-pin');
    let cur = pin ? 0 : 1, idx = -1;
    function place(p) {
      const l = len * p;
      const a = path.getPointAtLength(clamp(l, 0, len));
      const b = path.getPointAtLength(clamp(l + 2, 0, len));
      const c = path.getPointAtLength(clamp(l - 2, 0, len));
      const ang = Math.atan2(b.y - c.y, b.x - c.x) * 180 / Math.PI;
      truck.setAttribute('transform', `translate(${a.x.toFixed(1)} ${a.y.toFixed(1)}) rotate(${ang.toFixed(1)})`);
      path.style.strokeDashoffset = (len * (1 - p)).toFixed(1);
    }
    place(cur);
    if (!pin) return;
    ticks.push(() => {
      const r = sec.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      const total = Math.max(1, sec.offsetHeight - vh);
      const target = clamp(-r.top / total);
      cur += (target - cur) * .14;
      if (Math.abs(target - cur) < .0005) cur = target;
      place(clamp(cur / .92));
      const i = target < .333 ? 0 : target < .666 ? 1 : 2;
      if (i !== idx) { idx = i; txt.forEach((t, k) => t.classList.toggle('is-on', k === i)); }
    });
  });

  /* =========================================================
     TRABAJO REAL: columnas con parallax, lightbox y video
     ========================================================= */
  safe('gallery', () => {
    const gal = $('#gal');
    if (!gal) return;
    const cols = $$('.gcol[data-speed]', gal);
    if (!reduce) {
      ticks.push(() => {
        if (vw < 900) { cols.forEach(c => { if (c.style.transform) c.style.transform = ''; }); return; }
        const r = gal.getBoundingClientRect();
        if (r.bottom < -300 || r.top > vh + 300) return;
        const mid = r.top + r.height / 2 - vh / 2;
        cols.forEach(c => {
          const off = clamp(mid * (+c.dataset.speed) * -1, -140, 140);
          c.style.transform = `translate3d(0,${off.toFixed(1)}px,0)`;
        });
      });
    }
    // Lightbox
    const dlg = $('#lightbox'), img = $('#lbImg'), cap = $('#lbCap');
    const items = $$('.tile:not(.tile--video) .tile__btn', gal).map(b => {
      const im = $('img', b);
      return { src: im.getAttribute('src'), alt: im.alt, cap: im.alt, btn: b };
    });
    let idx = 0;
    const show = i => {
      idx = (i + items.length) % items.length;
      img.src = items[idx].src; img.alt = items[idx].alt; cap.textContent = items[idx].cap;
    };
    if (dlg && dlg.showModal) {
      items.forEach((it, i) => it.btn.addEventListener('click', () => { show(i); dlg.showModal(); lockScroll(true); }));
      $('#lbPrev').addEventListener('click', () => show(idx - 1));
      $('#lbNext').addEventListener('click', () => show(idx + 1));
      $('#lbClose').addEventListener('click', () => dlg.close());
      dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
      dlg.addEventListener('close', () => lockScroll(false));
      dlg.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft') show(idx - 1);
        if (e.key === 'ArrowRight') show(idx + 1);
      });
    }
    // Video
    const vd = $('#videoDlg'), player = $('#vdPlayer'), open = $('#videoOpen');
    if (vd && vd.showModal && open) {
      open.addEventListener('click', () => { vd.showModal(); lockScroll(true); });
      const shut = () => { vd.close(); };
      $('#vdClose').addEventListener('click', shut);
      vd.addEventListener('click', e => { if (e.target === vd) shut(); });
      vd.addEventListener('close', () => { try { player.pause(); } catch (_) { /* nada */ } lockScroll(false); });
    }
  });

  /* =========================================================
     HISTORIA: medallón con rotación ligada al scroll + parallax
     ========================================================= */
  safe('historia', () => {
    const sec = $('#historia'), medal = $('#medalLg'), photo = $('#mascotImg');
    if (!sec || reduce) return;
    ticks.push(() => {
      const r = sec.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      const p = clamp((vh - r.top) / (vh + r.height));
      if (medal) medal.style.setProperty('--sp', p.toFixed(4));
      if (photo) {
        const pr = photo.parentElement.getBoundingClientRect();
        photo.style.setProperty('--py', clamp((pr.top + pr.height / 2 - vh / 2) * -.08, -30, 30).toFixed(1) + 'px');
      }
    });
  });

  /* ---------- Bento: foco que sigue al cursor + inclinación ---------- */
  safe('bento', () => {
    if (!hoverFine || reduce) return;
    $$('.bcard__in').forEach(c => {
      c.addEventListener('pointermove', e => {
        const r = c.getBoundingClientRect();
        c.style.setProperty('--x', (e.clientX - r.left) + 'px');
        c.style.setProperty('--y', (e.clientY - r.top) + 'px');
        c.style.setProperty('--ry', (((e.clientX - r.left) / r.width - .5) * 6).toFixed(2) + 'deg');
        c.style.setProperty('--rx', (((e.clientY - r.top) / r.height - .5) * -5).toFixed(2) + 'deg');
      });
      c.addEventListener('pointerleave', () => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
    });
  });

  /* ---------- FAQ: acordeón con altura suave ---------- */
  safe('faq', () => {
    $$('.qa').forEach(d => {
      const s = $('summary', d), a = $('.qa__a', d);
      let anim = null;
      s.addEventListener('click', e => {
        e.preventDefault();
        if (anim) anim.cancel();
        const dur = reduce ? 0 : 320;
        if (d.open) {
          const h = a.offsetHeight;
          anim = a.animate({ height: [h + 'px', '0px'] }, { duration: dur, easing: 'cubic-bezier(.2,.8,.2,1)' });
          anim.onfinish = () => { d.open = false; anim = null; a.style.height = ''; };
        } else {
          d.open = true;
          const h = a.scrollHeight;
          anim = a.animate({ height: ['0px', h + 'px'] }, { duration: dur, easing: 'cubic-bezier(.2,.8,.2,1)' });
          anim.onfinish = () => { anim = null; a.style.height = ''; };
        }
      });
    });
  });

  /* =========================================================
     CONTACTO: camión de fondo + formulario a WhatsApp
     ========================================================= */
  safe('contacto', () => {
    const sec = $('#contacto'), big = $('#bigTruck');
    if (sec && big && !reduce) {
      ticks.push(() => {
        const r = sec.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        const p = clamp((vh - r.top) / (vh + r.height));
        big.style.transform = `translate3d(${(p * vw * .55 - 160).toFixed(1)}px,0,0)`;
      });
    }
    const form = $('#form'), msg = $('#formMsg');
    if (!form) return;
    const nombre = $('#f-nombre'), tel = $('#f-tel');
    const say = (t, ok) => { msg.textContent = t; msg.classList.toggle('is-ok', !!ok); };
    [nombre, tel].forEach(i => i.addEventListener('input', () => { i.removeAttribute('aria-invalid'); say(''); }));
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!hasWA) { say('Por ahora llámanos a cualquiera de los teléfonos de arriba y con gusto te cotizamos.'); return; }
      if (!nombre.value.trim()) {
        nombre.setAttribute('aria-invalid', 'true'); say('Cuéntanos tu nombre para poder atenderte.'); nombre.focus(); return;
      }
      if (tel.value.trim() && tel.value.replace(/\D/g, '').length < 8) {
        tel.setAttribute('aria-invalid', 'true'); say('Revisa tu teléfono: parece incompleto.'); tel.focus(); return;
      }
      const v = id => ($('#' + id).value || '').trim();
      let t = `Hola, soy ${v('f-nombre')}. Quiero cotizar: ${v('f-serv')}.`;
      if (v('f-orig')) t += ` Origen: ${v('f-orig')}.`;
      if (v('f-dest')) t += ` Destino: ${v('f-dest')}.`;
      if (v('f-fecha')) t += ` Fecha aproximada: ${v('f-fecha')}.`;
      if (v('f-det')) t += ` Detalles: ${v('f-det')}.`;
      if (v('f-tel')) t += ` Mi teléfono: ${v('f-tel')}.`;
      const w = window.open(waUrl(t), '_blank', 'noopener');
      if (!w) window.location.href = waUrl(t);
      say('¡Listo! Abrimos WhatsApp con tu cotización.', true);
    });
  });

  /* ---------- Footer: el logotipo se rellena con el scroll ---------- */
  safe('footer', () => {
    const m = $('#footMark');
    if (!m || reduce) return;
    ticks.push(() => {
      const r = m.getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh + 50) return;
      m.style.setProperty('--fill', clamp((vh - r.top) / (vh * .6)).toFixed(3));
    });
  });

  /* ---------- Medidas y arranque ---------- */
  window.addEventListener('resize', () => { vh = window.innerHeight; vw = window.innerWidth; });
  requestAnimationFrame(loop);
})();
