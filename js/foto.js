// Fotoğraf bölümü: vizörden bakılır → kafa geri çekilir, analog makinenin arkası görünür →
// makine biraz büyür → sol alta iner; altında dijital makine bekler. Tıklanan makinenin fotoğrafları açılır.
// Kaydırma ilerlemesi q (0..1) her şeyi sürer; bölüm sayfanın sonu.
(function () {
  'use strict';
  var sade = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function kis(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function ara(p, a, b) { return kis((p - a) / (b - a)); }
  function yum(t) { return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  var foto = document.getElementById('foto');
  var sahne = foto.querySelector('.foto-sahne');
  var vizor = sahne.querySelector('.vizor');
  var analog = sahne.querySelector('.kamera.analog');
  var dijital = sahne.querySelector('.kamera.dijital');
  var cam = analog.querySelector('.vizor-cam');
  var galeri = document.getElementById('galeri');
  var ipucu = galeri.querySelector('.galeri-ipucu');
  var Q_DON = 0.37;                     // vizörün tamamen söndüğü an
  var yerlesti = false, donus = false; // yerlesti: vizör geçildi, vizör geri gelmez; donus: perdeli dönüş sürüyor
  var qHedef = 0, qg = 0, onceki = 0;   // qHedef: kaydırmadan gelen ham değer; qg: gösterilen, sönümlü değer

  // vizör camının makine çizimindeki yeri (viewBox 400 x 250)
  var CAM = { x: 200, y: 86, w: 40, h: 28 };

  function sonY() { return foto.offsetTop + foto.offsetHeight - window.innerHeight; }
  window.fotoSonY = sonY;

  function ciz() {
    var q = qg;
    var sw = sahne.clientWidth, sh = sahne.clientHeight;
    var bw = analog.offsetWidth, bh = analog.offsetHeight, bx = analog.offsetLeft, by = analog.offsetTop;
    var k = bw / 400;
    var wc = { x: CAM.x * k, y: CAM.y * k }, bc = { x: bw / 2, y: bh / 2 };
    var c0 = Math.min(sw * 0.72, 560) / bw;                          // ortadaki boy
    var S0 = Math.max(sw / (CAM.w * k), sh / (CAM.h * k)) * 1.25;    // vizör ekranı kaplar
    var S, X, Y, ax, ay;
    if (q < 0.46) {
      // kafa vizörden geri çekilir (logaritmik: her an aynı hızda uzaklaşıyormuş gibi), sonra makine biraz büyür
      var u = yum(ara(q, 0.035, 0.35));
      S = Math.exp(lerp(Math.log(S0), Math.log(c0), u)) * (1 + 0.15 * yum(ara(q, 0.35, 0.46)));
      ax = wc.x; ay = wc.y; X = sw / 2; Y = sh / 2;
    } else {
      // sol alta iner
      var S1 = c0 * 1.15, m = yum(ara(q, 0.46, 0.86));
      var X0 = sw / 2 + S1 * (bc.x - wc.x), Y0 = sh / 2 + S1 * (bc.y - wc.y);
      S = lerp(S1, 1, m); ax = bc.x; ay = bc.y;
      X = lerp(X0, bx + bc.x, m); Y = lerp(Y0, by + bc.y, m);
    }
    var tx = X - bx - S * ax, ty = Y - by - S * ay;
    analog.style.transform = q >= 1 ? '' : 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px) scale(' + S.toFixed(4) + ')';

    var vo = 1 - ara(q, 0.28, 0.37);
    vizor.style.opacity = vo;
    if (vo > 0) {
      var cr = cam.getBoundingClientRect(), sr = sahne.getBoundingClientRect();
      vizor.style.clipPath = 'inset(' + [cr.top - sr.top, sr.right - cr.right, sr.bottom - cr.bottom, cr.left - sr.left]
        .map(function (v) { return Math.max(0, v).toFixed(1) + 'px'; }).join(' ') + ' round ' + (3 * k * S).toFixed(1) + 'px)';
    }
    sahne.style.setProperty('--kagit-o', ara(q, 0.48, 0.82).toFixed(3));
    sahne.style.setProperty('--son-o', ara(q, 0.84, 0.95).toFixed(3));
    var go = ara(q, 0.80, 0.95);
    sahne.style.setProperty('--galeri-o', go.toFixed(3));
    galeri.style.visibility = go > 0 ? 'visible' : 'hidden';
    var d = yum(ara(q, 0.62, 0.84));
    dijital.style.opacity = d;
    dijital.style.transform = 'translateY(' + ((1 - d) * 40).toFixed(1) + 'px)';
    dijital.style.visibility = d > 0 ? 'visible' : 'hidden';
    foto.dataset.dunya = q < 0.62 ? 'karanlik' : 'kagit';
  }

  function qHesapla() {
    var r = foto.getBoundingClientRect();
    return sade ? 1 : kis(-r.top / (r.height - window.innerHeight));
  }
  // gösterilen değer kaydırmayı sönümlü, kare hızından bağımsız takip eder (zaman sabiti ~0,143 sn)
  function kare(zaman) {
    var r = foto.getBoundingClientRect(), H = window.innerHeight;
    var gorunur = r.bottom > 0 && r.top < H;
    qHedef = qHesapla();
    var dt = onceki ? (zaman - onceki) / 1000 : 1;
    onceki = zaman;
    if (!sade && !donus) {
      if (qHedef >= Q_DON) yerlesti = true;
      else if (yerlesti) donusBaslat();   // yedek: kaydırma çubuğuyla sürüklenerek vizör bölgesine inildi
    }
    if (dt > 0.25 || !gorunur) qg = qHedef;
    else {
      qg += (qHedef - qg) * (1 - Math.exp(-7 * dt));
      if (Math.abs(qHedef - qg) < 0.0005) qg = qHedef;
    }
    if (yerlesti && qg < Q_DON) qg = Q_DON;   // vizör hiçbir yoldan geri gelmez
    if (gorunur) ciz();
    requestAnimationFrame(kare);
  }
  requestAnimationFrame(kare);
  // menüden Fotoğraf ve adresle açılış: sönümsüz, vizör bir kare bile görünmesin
  function esitle() { qHedef = qg = qHesapla(); yerlesti = !sade && qHedef >= Q_DON; ciz(); }
  window.fotoEsitle = esitle;

  // ---------- fotoğraftan yukarı: oyun renginde perde iner, sayfa oyun içeriğine atlar, perde söner ----------
  var perde = document.querySelector('.donus-perde');
  var galeriKaydi = -1e9, negToplam = 0, negZaman = -1e9, dokunY = null, dokunGaleri = false;
  galeri.addEventListener('scroll', function () { galeriKaydi = performance.now(); }, { passive: true });

  function donusBaslat() {
    if (donus || sade || !perde) return;
    donus = true;
    perde.style.transition = 'none';
    perde.style.opacity = '1';
    perde.style.transform = 'translateY(-100%)';
    perde.style.visibility = 'visible';
    void perde.offsetHeight;
    perde.style.transition = 'transform 260ms cubic-bezier(.65,0,.35,1)';
    perde.style.transform = 'translateY(0)';
    setTimeout(function () {
      // ekran tamamen örtük: sayfayı oyun içeriğine at, vizör sahnesini hiç göstermeden bırak
      var ust = document.querySelector('.oyun-icerik').getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, Math.min(ust, foto.offsetTop - window.innerHeight));
      qHedef = qg = qHesapla();
      yerlesti = false;
      document.body.dataset.dunya = 'piksel';
      ciz();
    }, 260);
    setTimeout(function () {
      perde.style.transition = 'opacity 300ms cubic-bezier(0,0,.2,1)';
      perde.style.opacity = '0';
    }, 300);
    setTimeout(function () {
      perde.style.transition = 'none';
      perde.style.visibility = 'hidden';
      perde.style.opacity = '1';
      perde.style.transform = 'translateY(-100%)';
      donus = false; negToplam = 0;
    }, 600);
  }
  function galeriIciKaydirmali(hedef) {
    return !!(hedef && hedef.closest && hedef.closest('.galeri') && galeri.scrollTop > 0);
  }

  window.addEventListener('wheel', function (e) {
    if (sade || e.ctrlKey) return;
    if (donus) { e.preventDefault(); return; }
    if (!yerlesti) return;
    var dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1);
    if (dy >= 0) return;
    if (galeriIciKaydirmali(e.target)) return;   // galeri kendi kayar
    e.preventDefault();
    var simdi = performance.now();
    if (simdi - galeriKaydi < 300) return;       // galeri tepeye vurduktan sonra süren atalet sayfayı fırlatmasın
    if (simdi - negZaman > 300) negToplam = 0;
    negZaman = simdi; negToplam += dy;
    if (negToplam <= -20) { negToplam = 0; donusBaslat(); }
  }, { passive: false });

  window.addEventListener('touchstart', function (e) {
    dokunY = e.touches[0].clientY;
    dokunGaleri = galeriIciKaydirmali(e.target);
  }, { passive: true });
  window.addEventListener('touchmove', function (e) {
    if (sade) return;
    if (donus) { e.preventDefault(); return; }
    if (!yerlesti || dokunY === null || dokunGaleri) return;
    if (dokunY - e.touches[0].clientY <= -12) { e.preventDefault(); dokunY = null; donusBaslat(); }   // parmak aşağı: sayfa yukarı
  }, { passive: false });

  window.addEventListener('keydown', function (e) {
    if (sade) return;
    var bosluk = e.key === ' ' || e.key === 'Spacebar';
    var yukari = e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'Home' || (bosluk && e.shiftKey);
    var asagi = (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'End' || bosluk) && !e.shiftKey;
    if (donus && (yukari || asagi)) { e.preventDefault(); return; }
    if (!yerlesti || !yukari) return;
    var h = e.target;
    if (h && h.closest && h.closest('input, textarea, select')) return;
    if (bosluk && h && h.closest && h.closest('a, button')) return;
    if (galeriIciKaydirmali(h)) return;
    e.preventDefault(); donusBaslat();
  });

  // menüdeki "Oyun": fotoğraf bölümündeyken aynı perdeyle dön
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('.baglantilar a[href="#oyun"]');
    if (!a || sade) return;
    if (donus || window.scrollY >= foto.offsetTop - window.innerHeight * 0.4) { e.preventDefault(); donusBaslat(); }
  });

  // makine seçimi
  function sec(btn) {
    [analog, dijital].forEach(function (b) {
      var acik = b === btn;
      b.setAttribute('aria-pressed', acik ? 'true' : 'false');
      document.getElementById(b.dataset.galeri).hidden = !acik;
    });
    ipucu.hidden = true;
    galeri.scrollTop = 0;
  }
  [analog, dijital].forEach(function (b) {
    b.addEventListener('click', function () {
      if (qHedef < 0.9) window.scrollTo(0, sonY());
      sec(b);
    });
  });

  // konuya göre süzgeç
  galeri.querySelectorAll('.suzgec button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var tur = btn.dataset.tur;
      btn.parentNode.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
      galeri.querySelectorAll('.dijital-izgara figure').forEach(function (f) { f.hidden = tur !== 'hepsi' && f.dataset.tur !== tur; });
    });
  });

  // menüdeki "Fotoğraf": vizör yolculuğunu atla, makinelerin başına git
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href="#foto"]');
    if (!a) return;
    e.preventDefault();
    window.scrollTo(0, sonY());
    esitle();
  });
})();
