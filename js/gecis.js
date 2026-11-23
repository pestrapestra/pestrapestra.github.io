// Giriş geçişi: daktilo → devre kartı → cep konsolu → piksel dünyası.
// Kaydırma ilerlemesi p (0..1) her şeyi sürer; daktiloya dokunmak geçişin sonuna kaydırır.
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var sade = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (sade) document.documentElement.classList.add('sade');

  // ---------- yardımcılar ----------
  function kis(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function ara(p, a, b) { return kis((p - a) / (b - a)); }
  function yum(t) { return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function hex(h) { return [1, 3, 5].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }
  function renk(a, b, t) {
    var x = hex(a), y = hex(b);
    return 'rgb(' + x.map(function (v, i) { return Math.round(lerp(v, y[i], t)); }).join(',') + ')';
  }
  function el(ad, ozellik, ebeveyn) {
    var e = document.createElementNS(NS, ad);
    for (var k in ozellik) e.setAttribute(k, ozellik[k]);
    if (ebeveyn) ebeveyn.appendChild(e);
    return e;
  }

  // ---------- piksel manzara (oyunun paleti) ----------
  function manzara(cv) {
    var c = cv.getContext('2d'), W = 160, H = 90, tohum = 7;
    function rnd() { tohum = (tohum * 16807) % 2147483647; return tohum / 2147483647; }
    var gok = ['#1e1a2a', '#3b3346', '#7a1f1a', '#c4402a', '#f07a2e', '#ffc94a'];
    var bant = 9;
    for (var y = 0; y < 60; y++) {
      var i = Math.min(gok.length - 1, Math.floor(y / bant));
      for (var x = 0; x < W; x++) {
        var sinir = (y % bant) === bant - 1 && (x + y) % 2 === 0 && i < gok.length - 1;
        c.fillStyle = sinir ? gok[i + 1] : gok[i];
        c.fillRect(x, y, 1, 1);
      }
    }
    // güneş
    for (var gy = -11; gy <= 11; gy++) for (var gx = -11; gx <= 11; gx++) {
      var d = Math.sqrt(gx * gx + gy * gy);
      if (d <= 11) { c.fillStyle = d > 9 ? '#ffc94a' : '#fff1b0'; c.fillRect(84 + gx, 50 + gy, 1, 1); }
    }
    // uzak dağlar
    var h = 52;
    for (var x2 = 0; x2 < W; x2++) {
      h += (rnd() - 0.5) * 2.4; h = Math.max(46, Math.min(58, h));
      c.fillStyle = '#3b3346'; c.fillRect(x2, Math.round(h), 1, 70 - Math.round(h));
    }
    // kurgan ve balbal
    for (var kx = 18; kx < 62; kx++) {
      var kh = Math.round(Math.sqrt(Math.max(0, 1 - Math.pow((kx - 40) / 22, 2))) * 9);
      c.fillStyle = '#3e2a1c'; c.fillRect(kx, 64 - kh, 1, kh + 2);
    }
    c.fillStyle = '#6b6175'; c.fillRect(39, 51, 3, 5); c.fillRect(40, 50, 1, 1);
    // zemin
    c.fillStyle = '#6e4a2c'; c.fillRect(0, 64, W, 26);
    c.fillStyle = '#3e2a1c'; c.fillRect(0, 82, W, 8);
    for (var o = 0; o < 140; o++) {
      var ox = Math.floor(rnd() * W), oy = 65 + Math.floor(rnd() * 17);
      c.fillStyle = rnd() > 0.5 ? '#a5793f' : '#d9b86a';
      c.fillRect(ox, oy, 1, 1); c.fillRect(ox, oy - 1, 1, 1);
    }
  }
  document.querySelectorAll('#dunya canvas, .sade-manzara').forEach(manzara);

  // ---------- daktilo yazısı ----------
  var satirlar = Array.prototype.slice.call(document.querySelectorAll('.kagit-yazi .satir'));
  var metinler = satirlar.map(function (s) { return s.textContent; });
  if (!sade) {
    satirlar.forEach(function (s) { s.textContent = ''; });
    var si = 0, hi = 0;
    (function yaz() {
      if (si >= satirlar.length) { satirlar[satirlar.length - 1].classList.remove('imlec'); return; }
      var s = satirlar[si];
      s.classList.add('imlec');
      s.textContent = metinler[si].slice(0, ++hi);
      if (hi >= metinler[si].length) { s.classList.remove('imlec'); si++; hi = 0; setTimeout(yaz, 260); }
      else setTimeout(yaz, 38 + Math.random() * 40);
    })();
  }

  // ---------- daktilo kolları ve devre yolları ----------
  var C = { x: 300, y: 625 }, N = 46, YARI = 34;
  var kollarG = document.getElementById('kollar');
  var akimG = document.getElementById('akim');
  var viyaG = document.getElementById('viyalar');
  var kollar = [];
  for (var i = 0; i < N; i++) {
    var a = (18 + (144 * i) / (N - 1)) * Math.PI / 180;
    var cs = Math.cos(a), sn = Math.sin(a);
    var duz = [92, 170, 250, 345].map(function (r) { return [C.x + r * cs, C.y + r * sn]; });
    // devre yolu: çip kenarından dik çık, 45 derece kır, aşağı in
    var t = YARI / Math.max(Math.abs(cs), Math.abs(sn));
    var A = [C.x + t * cs, C.y + t * sn];
    var dik = Math.abs(cs) > Math.abs(sn) ? [Math.sign(cs), 0] : [0, 1];
    var P1 = [A[0] + dik[0] * 18, A[1] + dik[1] * 18];
    var k = Math.abs(cs) * 230 + 10;
    var P2 = [P1[0] + Math.sign(cs) * k, P1[1] + k];
    var P3 = [P2[0], P2[1] + 320];
    kollar.push({
      duz: duz, yol: [A, P1, P2, P3],
      golge: el('path', { stroke: '#0e0e0d', 'stroke-width': 9, 'stroke-linecap': 'round', fill: 'none' }, kollarG),
      yuz: el('path', { stroke: '#c3c7cc', 'stroke-width': 5, 'stroke-linecap': 'round', fill: 'none' }, kollarG),
      akim: el('path', {}, akimG),
      viya: el('circle', { cx: P2[0], cy: P2[1], r: 4.5, fill: '#c98a3c', stroke: '#13322B', 'stroke-width': 2 }, viyaG)
    });
  }
  // cetvel çizgileri ve çip bacakları
  var cetvel = document.getElementById('cetvel');
  for (var cx = 100; cx <= 500; cx += 10) el('line', { x1: cx, y1: 561, x2: cx, y2: cx % 50 === 0 ? 570 : 566 }, cetvel);
  var bacak = document.getElementById('cip-bacak');
  for (var b = 0; b < 7; b++) {
    var o = 270 + b * 9.5;
    el('rect', { x: o, y: 584, width: 4, height: 8 }, bacak);
    el('rect', { x: o, y: 658, width: 4, height: 8 }, bacak);
    el('rect', { x: 259, y: o - 270 + 595, width: 8, height: 4 }, bacak);
    el('rect', { x: 333, y: o - 270 + 595, width: 8, height: 4 }, bacak);
  }

  function yolD(nok) { return 'M' + nok.map(function (n) { return n[0].toFixed(1) + ' ' + n[1].toFixed(1); }).join(' L'); }

  // ---------- çizim ----------
  var giris = document.getElementById('giris');
  var sahne = document.querySelector('.sahne');
  var sahneG = document.getElementById('sahne-g');
  var govde = document.getElementById('govde');
  var kartZemin = document.getElementById('kart-zemin');
  var metal = document.getElementById('metal');
  var cip = document.getElementById('cip');
  var ipucu = document.getElementById('ipucu');
  var cep = document.getElementById('cep');
  var ekran = document.getElementById('ekran');
  var ekranYazi = document.getElementById('ekran-yazi');
  var dunya = document.getElementById('dunya');
  var dunyaBaslik = document.querySelector('.dunya-baslik');
  var yazi = document.querySelector('.kagit-yazi');
  var oyun = document.getElementById('oyun');
  var dijital = document.getElementById('dijital');

  function ciz(p, zaman) {
    // 1) yaklaş: kamera harf kollarına iner
    var z = yum(ara(p, 0.10, 0.45));
    var s = 1 + 1.25 * z;
    var tx = 300, ty = lerp(C.y, 450, z);
    sahneG.setAttribute('transform', 'translate(' + tx + ' ' + ty + ') scale(' + s + ') translate(' + (-C.x) + ' ' + (-C.y) + ')');
    yazi.style.opacity = 1 - ara(p, 0.06, 0.24);
    yazi.style.transform = 'translate(-50%,' + (-60 * ara(p, 0.06, 0.3)) + 'px)';
    ipucu.setAttribute('opacity', 1 - ara(p, 0.02, 0.1));

    // tuş vuruşu: ortadaki kol bir kez kalkar
    var vur = Math.sin(Math.PI * ara(p, 0.15, 0.24));

    // 2) metal → bakır yol
    var t = yum(ara(p, 0.33, 0.56));
    govde.setAttribute('fill', renk('#1f1e1c', '#13322B', t));
    kartZemin.setAttribute('opacity', t);
    metal.setAttribute('opacity', 1 - ara(p, 0.3, 0.46));
    var yuzRenk = renk('#c3c7cc', '#c98a3c', t);
    for (var i = 0; i < N; i++) {
      var k = kollar[i];
      var cek = (i === 23 ? vur * 0.35 : 0);
      var nok = k.duz.map(function (d, j) {
        var y = k.yol[j];
        var x0 = lerp(d[0], C.x, cek), y0 = lerp(d[1], C.y, cek);
        return [lerp(x0, y[0], t), lerp(y0, y[1], t)];
      });
      var d = yolD(nok);
      k.golge.setAttribute('d', d);
      k.golge.setAttribute('opacity', 1 - t);
      k.yuz.setAttribute('d', d);
      k.yuz.setAttribute('stroke', yuzRenk);
      k.yuz.setAttribute('stroke-width', lerp(5, 2.6, t));
      if (t > 0.98) k.akim.setAttribute('d', d);
    }
    viyaG.setAttribute('opacity', ara(p, 0.5, 0.58));
    akimG.setAttribute('opacity', ara(p, 0.55, 0.62) * (1 - ara(p, 0.8, 0.9)));
    akimG.style.strokeDashoffset = (-(zaman * 0.08) % 86).toFixed(1);

    // 3) çip belirir
    cip.setAttribute('opacity', ara(p, 0.48, 0.58));

    // 4) cep konsolu
    cep.setAttribute('opacity', yum(ara(p, 0.6, 0.7)));
    ekranYazi.setAttribute('opacity', (zaman % 1000) < 650 ? 1 : 0.25);

    // 5) piksel dünyası ekrandan taşar
    var gor = ara(p, 0.72, 0.78);
    var e = yum(ara(p, 0.8, 0.97));
    dunya.style.opacity = gor;
    if (gor > 0) {
      var sr = sahne.getBoundingClientRect(), er = ekran.getBoundingClientRect();
      var ust = lerp(er.top - sr.top, 0, e), sol = lerp(er.left - sr.left, 0, e);
      var sag = lerp(sr.right - er.right, 0, e), alt = lerp(sr.bottom - er.bottom, 0, e);
      dunya.style.clipPath = 'inset(' + ust + 'px ' + sag + 'px ' + alt + 'px ' + sol + 'px)';
    }
    dunyaBaslik.style.opacity = ara(p, 0.92, 1);
  }

  function mod() {
    var y = window.scrollY, h = window.innerHeight;
    var piksel, devre = false;
    if (sade) piksel = y > oyun.offsetTop - h * 0.4 && y < dijital.offsetTop - h * 0.4;
    else {
      var yol = giris.offsetHeight - h;
      piksel = (y > giris.offsetTop + yol * 0.85) && y < dijital.offsetTop - h * 0.4;
      devre = !piksel && y > giris.offsetTop + yol * 0.38;
    }
    document.body.dataset.dunya = piksel ? 'piksel' : devre ? 'devre' : 'kagit';
  }

  function kare(zaman) {
    if (!sade) {
      var r = giris.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) {
        var p = kis(-r.top / (r.height - window.innerHeight));
        ciz(p, zaman);
      }
    }
    mod();
    requestAnimationFrame(kare);
  }
  requestAnimationFrame(kare);

  // daktiloya dokun: geçişin sonuna kaydır (hareket istemeyende doğrudan oyuna)
  document.querySelector('.makine-btn').addEventListener('click', function () {
    var hedef = sade ? oyun.offsetTop : giris.offsetTop + giris.offsetHeight - window.innerHeight;
    window.scrollTo({ top: hedef, behavior: sade ? 'auto' : 'smooth' });
  });
})();
