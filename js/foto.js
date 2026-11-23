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
  var q = 0;

  // vizör camının makine çizimindeki yeri (viewBox 400 x 250)
  var CAM = { x: 200, y: 86, w: 40, h: 28 };

  function sonY() { return foto.offsetTop + foto.offsetHeight - window.innerHeight; }
  window.fotoSonY = sonY;

  function ciz() {
    var sw = sahne.clientWidth, sh = sahne.clientHeight;
    var bw = analog.offsetWidth, bh = analog.offsetHeight, bx = analog.offsetLeft, by = analog.offsetTop;
    var k = bw / 400;
    var wc = { x: CAM.x * k, y: CAM.y * k }, bc = { x: bw / 2, y: bh / 2 };
    var c0 = Math.min(sw * 0.72, 560) / bw;                          // ortadaki boy
    var S0 = Math.max(sw / (CAM.w * k), sh / (CAM.h * k)) * 1.25;    // vizör ekranı kaplar
    var S, X, Y, ax, ay;
    if (q < 0.62) {
      // kafa vizörden geri çekilir (logaritmik: her an aynı hızda uzaklaşıyormuş gibi), sonra makine biraz büyür
      var u = yum(ara(q, 0.04, 0.5));
      S = Math.exp(lerp(Math.log(S0), Math.log(c0), u)) * (1 + 0.15 * yum(ara(q, 0.5, 0.62)));
      ax = wc.x; ay = wc.y; X = sw / 2; Y = sh / 2;
    } else {
      // sol alta iner
      var S1 = c0 * 1.15, m = yum(ara(q, 0.62, 0.86));
      var X0 = sw / 2 + S1 * (bc.x - wc.x), Y0 = sh / 2 + S1 * (bc.y - wc.y);
      S = lerp(S1, 1, m); ax = bc.x; ay = bc.y;
      X = lerp(X0, bx + bc.x, m); Y = lerp(Y0, by + bc.y, m);
    }
    var tx = X - bx - S * ax, ty = Y - by - S * ay;
    analog.style.transform = q >= 1 ? '' : 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px) scale(' + S.toFixed(4) + ')';

    var vo = 1 - ara(q, 0.4, 0.52);
    vizor.style.opacity = vo;
    if (vo > 0) {
      var cr = cam.getBoundingClientRect(), sr = sahne.getBoundingClientRect();
      vizor.style.clipPath = 'inset(' + [cr.top - sr.top, sr.right - cr.right, sr.bottom - cr.bottom, cr.left - sr.left]
        .map(function (v) { return Math.max(0, v).toFixed(1) + 'px'; }).join(' ') + ' round ' + (3 * k * S).toFixed(1) + 'px)';
    }
    sahne.style.setProperty('--kagit-o', ara(q, 0.64, 0.86).toFixed(3));
    sahne.style.setProperty('--son-o', ara(q, 0.86, 0.96).toFixed(3));
    var go = ara(q, 0.84, 0.96);
    sahne.style.setProperty('--galeri-o', go.toFixed(3));
    galeri.style.visibility = go > 0 ? 'visible' : 'hidden';
    var d = yum(ara(q, 0.7, 0.88));
    dijital.style.opacity = d;
    dijital.style.transform = 'translateY(' + ((1 - d) * 40).toFixed(1) + 'px)';
    dijital.style.visibility = d > 0 ? 'visible' : 'hidden';
    foto.dataset.dunya = q < 0.72 ? 'karanlik' : 'kagit';
  }

  function kare() {
    var r = foto.getBoundingClientRect(), H = window.innerHeight;
    if (r.bottom > 0 && r.top < H) {
      q = sade ? 1 : kis(-r.top / (r.height - H));
      ciz();
    }
    requestAnimationFrame(kare);
  }
  requestAnimationFrame(kare);

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
      if (q < 0.9) window.scrollTo(0, sonY());
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
  });
})();
