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
  document.querySelectorAll('#dunya canvas, .oyun-kapak canvas').forEach(manzara);

  // ---------- daktilo kolları ve devre yolları ----------
  // C: yazı noktası; kollar buradan yelpaze gibi açılır. Yarıçaplar: yuva 66-86, kol 86-212, kafa 212-226, keçe 204-230.
  var C = { x: 300, y: 555 }, N = 46, YARI = 34, KAFA = 219;
  var kollarG = document.getElementById('kollar');
  var golgeG = document.getElementById('kollar-golge');
  var kafaG = document.getElementById('kafalar');
  var akimG = document.getElementById('akim');
  var viyaG = document.getElementById('viyalar');
  var A1 = 14, A2 = 166;   // yelpazenin açı aralığı (derece)
  function yay(r1, r2, a1, a2) {
    var r = Math.PI / 180, p = function (rr, aa) { return (C.x + rr * Math.cos(aa * r)).toFixed(1) + ' ' + (C.y + rr * Math.sin(aa * r)).toFixed(1); };
    return 'M' + p(r2, a1) + ' A' + r2 + ' ' + r2 + ' 0 0 1 ' + p(r2, a2) + ' L' + p(r1, a2) + ' A' + r1 + ' ' + r1 + ' 0 0 0 ' + p(r1, a1) + ' Z';
  }
  document.getElementById('segment').setAttribute('d', yay(66, 86, 10, 170));
  var keceG = document.getElementById('kece-g');
  el('path', { d: yay(204, 230, A1 - 4, A2 + 4), fill: '#000', opacity: .35, transform: 'translate(2 4)' }, keceG);
  el('path', { d: yay(204, 230, A1 - 4, A2 + 4), fill: 'url(#g-kece)', stroke: '#1b2215', 'stroke-width': 1 }, keceG);
  // keçe tüyü: kısa, rastgele çizgiler
  var tohumK = 3;
  function rndK() { tohumK = (tohumK * 16807) % 2147483647; return tohumK / 2147483647; }
  for (var f = 0; f < 260; f++) {
    var fa = (A1 + rndK() * (A2 - A1)) * Math.PI / 180, fr = 206 + rndK() * 22;
    var fx = C.x + fr * Math.cos(fa), fy = C.y + fr * Math.sin(fa);
    el('line', { x1: fx, y1: fy, x2: fx + (rndK() - .5) * 3, y2: fy + (rndK() - .5) * 3, stroke: rndK() > .5 ? '#4c5a42' : '#1f2719', 'stroke-width': .8 }, keceG);
  }
  var yuvaG = document.getElementById('yuvalar');
  var kollar = [];
  for (var i = 0; i < N; i++) {
    var aD = A1 + 4 + ((A2 - A1 - 8) * i) / (N - 1);
    var a = aD * Math.PI / 180;
    var cs = Math.cos(a), sn = Math.sin(a);
    var duz = [86, 140, 185, 212].map(function (r) { return [C.x + r * cs, C.y + r * sn]; });
    el('line', { x1: C.x + 70 * cs, y1: C.y + 70 * sn, x2: C.x + 86 * cs, y2: C.y + 86 * sn }, yuvaG);
    // harf kafası (keçenin üstünde)
    var kafa = el('g', { transform: 'rotate(' + aD.toFixed(2) + ' ' + C.x + ' ' + C.y + ')' }, kafaG);
    el('rect', { x: C.x + KAFA - 7 + 1.5, y: C.y - 4 + 2, width: 15, height: 8, rx: 1.5, fill: '#000', opacity: .45 }, kafa);
    el('rect', { x: C.x + KAFA - 7, y: C.y - 4, width: 15, height: 8, rx: 1.5, fill: 'url(#g-kafa)', stroke: '#3d4146', 'stroke-width': .6 }, kafa);
    el('rect', { x: C.x + KAFA + 4, y: C.y - 3, width: 2.4, height: 6, fill: '#2b2e31' }, kafa);
    // devre yolu: çip kenarından dik çık, 45 derece kır, aşağı in
    var t = YARI / Math.max(Math.abs(cs), Math.abs(sn));
    var A = [C.x + t * cs, C.y + t * sn];
    var dik = Math.abs(cs) > Math.abs(sn) ? [Math.sign(cs), 0] : [0, 1];
    var P1 = [A[0] + dik[0] * 18, A[1] + dik[1] * 18];
    var k = Math.abs(cs) * 230 + 10;
    var P2 = [P1[0] + Math.sign(cs) * k, P1[1] + k];
    var P3 = [P2[0], P2[1] + 320];
    kollar.push({
      duz: duz, yol: [A, P1, P2, P3], kafa: kafa, aci: aD,
      golge: el('path', { stroke: '#000', 'stroke-opacity': .55, 'stroke-width': 5, 'stroke-linecap': 'round', fill: 'none' }, golgeG),
      yuz: el('path', { stroke: '#aab0b6', 'stroke-width': 4.2, 'stroke-linecap': 'round', fill: 'none' }, kollarG),
      parlak: el('path', { stroke: '#f1f3f5', 'stroke-width': 1.1, 'stroke-linecap': 'round', fill: 'none', opacity: .85 }, kollarG),
      akim: el('path', {}, akimG),
      viya: el('circle', { cx: P2[0], cy: P2[1], r: 4.5, fill: '#c98a3c', stroke: '#13322B', 'stroke-width': 2 }, viyaG)
    });
  }
  // cetvel çizgileri ve çip bacakları
  var cetvel = document.getElementById('cetvel');
  for (var cx = 60; cx <= 540; cx += 8) el('line', { x1: cx, y1: 443, x2: cx, y2: (cx - 60) % 40 === 0 ? 451 : 447 }, cetvel);
  var bacak = document.getElementById('cip-bacak');
  for (var b = 0; b < 7; b++) {
    var o = 270 + b * 9.5;
    el('rect', { x: o, y: C.y - 41, width: 4, height: 8 }, bacak);
    el('rect', { x: o, y: C.y + 33, width: 4, height: 8 }, bacak);
    el('rect', { x: 259, y: o - 270 + C.y - 30, width: 8, height: 4 }, bacak);
    el('rect', { x: 333, y: o - 270 + C.y - 30, width: 8, height: 4 }, bacak);
  }
  // tuşlar: Türkçe F klavyenin üst iki sırası
  var klavye = document.getElementById('klavye');
  [['1234567890', 60, 818], ['FGĞIODRNHP', 78, 870]].forEach(function (sira) {
    for (var t = 0; t < sira[0].length; t++) {
      var kx = sira[1] + t * 51, ky = sira[2];
      el('rect', { x: kx - 2.5, y: ky + 6, width: 5, height: 60, fill: '#0b0b0a' }, klavye);  // tuş kolu
      el('circle', { cx: kx + 2, cy: ky + 4, r: 21, fill: '#000', opacity: .45 }, klavye);
      el('circle', { cx: kx, cy: ky, r: 21, fill: 'url(#g-krom)' }, klavye);
      el('circle', { cx: kx, cy: ky, r: 17.5, fill: 'url(#g-tus)' }, klavye);
      el('ellipse', { cx: kx - 5, cy: ky - 8, rx: 7, ry: 3.5, fill: '#fff', opacity: .16 }, klavye);
      var h = el('text', { x: kx, y: ky + 5.5, 'text-anchor': 'middle', 'font-family': 'Courier Prime, monospace', 'font-weight': 700, 'font-size': 16, fill: '#efe9dc' }, klavye);
      h.textContent = sira[0][t];
    }
  });

  function yolD(nok) { return 'M' + nok.map(function (n) { return n[0].toFixed(1) + ' ' + n[1].toFixed(1); }).join(' L'); }

  // ---------- öğeler ----------
  var giris = document.getElementById('giris');
  var sahne = document.querySelector('.sahne');
  var svg = document.querySelector('.makine');
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
  var dunyaBaslik = document.querySelector('#dunya .dunya-baslik');
  var yazi = document.querySelector('.kagit-yazi');
  var oyun = document.getElementById('oyun');
  var foto = document.getElementById('foto') || document.getElementById('dijital');

  // ---------- kâğıt: yazı hep merdanenin üstündeki satıra yazılır, kâğıt satır satır yukarı kayar ----------
  var satirlar = Array.prototype.slice.call(document.querySelectorAll('.kagit-yazi .satir'));
  var metinler = satirlar.map(function (s) { return s.textContent; });
  var LH = 40, yazmaY = 0;          // satır yüksekliği; yazı satırının sahnedeki yeri (px)
  var kagitY = 0, kagitHedef = 0;   // kâğıdın kayması (px, eksi = yukarı)
  var yazildi = false, si = 0, hi = 0, vurKol = -1, vurZaman = -1e9, ipucuA = 0;
  var SON_BOSLUK = 1.5, sonBos = false;   // yazı bitince kâğıt bu kadar satır daha kayar

  function olc() {
    LH = satirlar[0].getBoundingClientRect().height || 40;
    var m = svg.getScreenCTM(), sr = sahne.getBoundingClientRect();
    if (m) yazmaY = (m.d * 438 + m.f) - sr.top - 6;   // baskı çubuğunun hemen üstü
    yazi.style.top = (yazmaY - LH) + 'px';
    var satirSay = si + (sonBos ? SON_BOSLUK : 0);
    kagitHedef = -satirSay * LH;
    kagitY = kagitHedef;
    if (sade) ciz(0, 0);
  }
  function hepsiniYaz() {
    satirlar.forEach(function (s, i) { s.textContent = metinler[i]; s.classList.remove('imlec'); });
    si = satirlar.length; yazildi = true; sonBos = true;
    kagitHedef = -(satirlar.length + SON_BOSLUK) * LH;
  }
  function yaz() {
    if (yazildi) return;
    if (si >= satirlar.length) {
      yazildi = true;
      setTimeout(function () { sonBos = true; kagitHedef = -(satirlar.length + SON_BOSLUK) * LH; }, 300);
      return;
    }
    var s = satirlar[si];
    s.classList.add('imlec');
    var harf = metinler[si].charAt(hi);
    s.textContent = metinler[si].slice(0, ++hi);
    if (harf.trim()) { vurKol = (harf.charCodeAt(0) * 7) % N; vurZaman = performance.now(); }
    if (hi >= metinler[si].length) {
      s.classList.remove('imlec'); si++; hi = 0;
      // satır sonu: kâğıt bir satır yukarı kayar (satır başı kolu)
      setTimeout(function () { if (!yazildi) kagitHedef -= LH; setTimeout(yaz, 190); }, 120);
    } else setTimeout(yaz, 34 + Math.random() * 44 + (harf === ',' ? 60 : 0));   // satır ortasındaki virgülden sonra kısa duraklama
  }

  // ---------- çizim: p (0..1) geçişin neresinde olduğumuzu söyler ----------
  function ciz(p, zaman) {
    // 0) kâğıt yukarı kayıp çıkar; daktilo yerinde kalır
    var cikis = -sahne.clientHeight * 1.05 * yum(ara(p, 0, 0.12));
    var kay = kagitY + cikis;
    yazi.style.transform = 'translate(-50%,' + kay.toFixed(1) + 'px)';
    sahne.style.backgroundPosition = '0 ' + kay.toFixed(1) + 'px';
    ipucu.setAttribute('opacity', (ipucuA * (1 - ara(p, 0, 0.04))).toFixed(3));

    // 1) yaklaş: bakış harf kollarına iner
    var z = yum(ara(p, 0.06, 0.32));
    var s = 1 + 1.25 * z;
    var ty = lerp(C.y, 450, z);
    sahneG.setAttribute('transform', 'translate(300 ' + ty + ') scale(' + s + ') translate(' + (-C.x) + ' ' + (-C.y) + ')');

    // tuş vuruşu: geçişte ortadaki kol bir kez kalkar
    var vur = Math.sin(Math.PI * ara(p, 0.09, 0.15));
    var tusVur = 0.3 * Math.sin(Math.PI * kis((zaman - vurZaman) / 90));

    // 2) metal → bakır yol
    var t = yum(ara(p, 0.16, 0.34));
    govde.setAttribute('fill', renk('#1d1c1a', '#13322B', t));
    kartZemin.setAttribute('opacity', t);
    var metalO = 1 - ara(p, 0.15, 0.28);
    metal.setAttribute('opacity', metalO);
    kafaG.setAttribute('opacity', metalO);
    keceG.setAttribute('opacity', metalO);
    var yuzRenk = renk('#aab0b6', '#c98a3c', t);
    for (var i = 0; i < N; i++) {
      var k = kollar[i];
      var cek = (i === 23 ? vur * 0.35 : 0);
      if (i === vurKol && tusVur > cek) cek = tusVur;
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
      k.yuz.setAttribute('stroke-width', lerp(4.2, 2.6, t));
      k.parlak.setAttribute('d', d);
      k.parlak.setAttribute('opacity', 0.85 * (1 - t));
      if (cek > 0 || k.oyn) {
        // vurulan kolun kafası kolla birlikte yazı noktasına doğru kalkar
        var kk = 1 - cek;
        k.kafa.setAttribute('transform', 'translate(' + (C.x * cek).toFixed(2) + ' ' + (C.y * cek).toFixed(2) + ') scale(' + kk.toFixed(3) + ') rotate(' + k.aci.toFixed(2) + ' ' + C.x + ' ' + C.y + ')');
        k.oyn = cek > 0;
      }
      if (t > 0.98) k.akim.setAttribute('d', d);
    }
    viyaG.setAttribute('opacity', ara(p, 0.32, 0.38));
    akimG.setAttribute('opacity', ara(p, 0.36, 0.42) * (1 - ara(p, 0.8, 0.88)));
    akimG.style.strokeDashoffset = (-(zaman * 0.08) % 86).toFixed(1);

    // 3) çip belirir
    cip.setAttribute('opacity', ara(p, 0.28, 0.37));

    // 4) cep konsolu
    cep.setAttribute('opacity', yum(ara(p, 0.4, 0.49)));
    ekranYazi.setAttribute('opacity', (zaman % 1000) < 650 ? 1 : 0.25);

    // 5) piksel dünyası ekrandan taşar
    var gor = ara(p, 0.8, 0.83);
    var e = yum(ara(p, 0.82, 0.97));
    dunya.style.opacity = gor;
    if (gor > 0) {
      var sr = sahne.getBoundingClientRect(), er = ekran.getBoundingClientRect();
      var ust = lerp(er.top - sr.top, 0, e), sol = lerp(er.left - sr.left, 0, e);
      var sag = lerp(sr.right - er.right, 0, e), alt = lerp(sr.bottom - er.bottom, 0, e);
      dunya.style.clipPath = 'inset(' + ust + 'px ' + sag + 'px ' + alt + 'px ' + sol + 'px)';
    }
    dunyaBaslik.style.opacity = ara(p, 0.92, 1);
  }

  // ---------- geçişin yönetimi ----------
  // Kaydırma geçişi sürmez; başlatır. Geçiş ne kadar hızlı kaydırılırsa kaydırılsın
  // SURE_ILERI ms sürer, bu sırada sayfa kilitli; bitince doğrudan oyun bölümüne geçilir.
  var SURE_ILERI = 2900, SURE_GERI = 1500;
  var durum = 'bekle', pv = 0, animBas = 0, animDen = 0, animHedef = 0, animSure = 0, kilit = false;

  function kilitle(a) { kilit = a; document.documentElement.classList.toggle('kilitli', a); }
  function oynat(hedef) {
    if (sade) { if (hedef === 1) window.scrollTo(0, oyun.offsetTop); return; }
    if (hedef === 1 && !yazildi) hepsiniYaz();
    durum = hedef === 1 ? 'ileri' : 'geri';
    animDen = pv; animHedef = hedef; animBas = performance.now();
    animSure = Math.abs(hedef - pv) * (hedef === 1 ? SURE_ILERI : SURE_GERI);
    kilitle(true);
  }
  function geriDon() { window.scrollTo(0, 0); oynat(0); }
  function anindaBitir() {
    if (!yazildi) hepsiniYaz();
    kagitY = kagitHedef; pv = 1; durum = 'bitti'; kilitle(false);
  }
  function ustte() { return window.scrollY <= oyun.offsetTop + 2; }

  window.addEventListener('wheel', function (e) {
    if (kilit) { e.preventDefault(); return; }
    if (sade) return;
    if (durum === 'bekle' && e.deltaY > 0) { e.preventDefault(); oynat(1); }
    else if (durum === 'bitti' && e.deltaY < 0 && ustte()) { e.preventDefault(); geriDon(); }
  }, { passive: false });

  var dokunY = null;
  window.addEventListener('touchstart', function (e) { dokunY = e.touches[0].clientY; }, { passive: true });
  window.addEventListener('touchmove', function (e) {
    if (kilit) { e.preventDefault(); return; }
    if (sade || dokunY === null) return;
    var dy = dokunY - e.touches[0].clientY;   // artı: parmak yukarı, sayfa aşağı
    if (durum === 'bekle' && dy > 0) { e.preventDefault(); if (dy > 8) { oynat(1); dokunY = null; } }
    else if (durum === 'bitti' && dy < -8 && ustte()) { e.preventDefault(); geriDon(); dokunY = null; }
  }, { passive: false });

  window.addEventListener('keydown', function (e) {
    var bosluk = e.key === ' ' || e.key === 'Spacebar';
    if (bosluk && e.target.closest && e.target.closest('a, button, input, textarea, select')) return;
    var asagi = (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'End' || bosluk) && !e.shiftKey;
    var yukari = e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'Home' || (bosluk && e.shiftKey);
    if (kilit && (asagi || yukari)) { e.preventDefault(); return; }
    if (sade) return;
    if (durum === 'bekle' && asagi) { e.preventDefault(); oynat(1); }
    else if (durum === 'bitti' && yukari && ustte()) { e.preventDefault(); geriDon(); }
  });

  window.addEventListener('scroll', function () {
    if (sade || kilit) return;
    if (durum === 'bekle' && window.scrollY > 2) { window.scrollTo(0, 0); oynat(1); }
    else if (durum === 'bitti' && window.scrollY < oyun.offsetTop - window.innerHeight * 0.5) geriDon();
  }, { passive: true });

  // bağlantılar
  document.querySelector('.makine-btn').addEventListener('click', function () { if (durum === 'bekle') oynat(1); });
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || sade) return;
    var hedef = a.getAttribute('href');
    if (hedef === '#giris') {
      e.preventDefault();
      if (durum === 'bitti') geriDon();
    } else if (hedef === '#oyun' && durum === 'bekle' && !a.classList.contains('atla')) {
      e.preventDefault(); oynat(1);
    } else if (durum === 'bekle') {
      anindaBitir();   // atlama bağlantısı ve fotoğraf: geçişi beklemeden
    }
  });

  // ---------- kare döngüsü ----------
  var onceki = 0;
  function kare(zaman) {
    var dt = onceki ? Math.min(0.05, (zaman - onceki) / 1000) : 0;
    onceki = zaman;
    if (durum === 'ileri' || durum === 'geri') {
      var u = animSure > 0 ? kis((zaman - animBas) / animSure) : 1;
      pv = lerp(animDen, animHedef, u);
      if (u >= 1) {
        if (animHedef === 1) { durum = 'bitti'; kilitle(false); window.scrollTo(0, oyun.offsetTop); }
        else { durum = 'bekle'; kilitle(false); }
      }
    }
    kagitY += (kagitHedef - kagitY) * (1 - Math.exp(-14 * dt));
    ipucuA += ((yazildi ? 1 : 0) - ipucuA) * (1 - Math.exp(-3 * dt));
    if (!sade && window.scrollY < window.innerHeight * 1.2) ciz(pv, zaman);
    mod();
    requestAnimationFrame(kare);
  }

  function mod() {
    var y = window.scrollY, h = window.innerHeight, ad;
    if (y >= foto.offsetTop - h * 0.4) ad = foto.dataset.dunya || 'kagit';
    else if (y >= oyun.offsetTop - h * 0.5) ad = 'piksel';
    else if (sade) ad = 'kagit';
    else ad = pv > 0.82 ? 'piksel' : pv > 0.25 ? 'devre' : 'kagit';
    if (document.body.dataset.dunya !== ad) document.body.dataset.dunya = ad;
  }

  // ---------- başlangıç ----------
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  var basladi = false;
  function basla() {
    if (basladi) return;
    basladi = true;
    var hash = location.hash && document.querySelector(location.hash);
    if (sade) hepsiniYaz();
    else satirlar.forEach(function (s) { s.textContent = ''; });
    olc();
    if (hash && hash !== giris && !sade) {
      anindaBitir(); olc();
      window.scrollTo(0, hash === foto && window.fotoSonY ? window.fotoSonY() : hash.offsetTop);
    } else {
      window.scrollTo(0, hash && sade ? hash.offsetTop : 0);
      if (!sade) setTimeout(yaz, 400);
    }
    requestAnimationFrame(kare);
  }
  window.addEventListener('resize', olc);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(basla);
  setTimeout(basla, 1500);
})();
