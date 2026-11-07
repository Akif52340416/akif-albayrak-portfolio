(function () {
  "use strict";
  // Home — the light layer (concept 01), on top of home.js. One effect leads
  // in each scene:
  //   opening        a line of light opens the portrait like a film frame
  //                  (CSS only, see motion.css; once per session)
  //   four chapters  one light trail draws through the photo as the story
  //                  scrolls; each chapter lights its own node
  //   education      one soft light passes over MBO 4 Software Development
  //   STILL BUILDING light streaks behind the words; with a mouse, the
  //                  letters near the pointer turn thinner and pink
  // home.js drives all of it from its own loop (window.akifHomeFx), so there
  // is no second scroll loop; the only thing that runs by itself is the
  // finale's light, and only while the finale is on screen. Phones get a
  // CSS version of that light (moved by the compositor, no WebGL) and no
  // letter interaction.
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var homeView = document.getElementById('homeView');
  if (!homeView) return;
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function map(v, a, b) { return clamp01((v - a) / (b - a)); }

  // ---------- the opening: hand back to the plain page when it has played ----------
  var root = document.documentElement;
  if (root.classList.contains('home-intro')) {
    var endIntro = function () { root.classList.remove('home-intro'); };
    // the frame only opens once the portrait can be shown
    var photo = document.getElementById('photoImg'), started = false;
    var go = function () {
      if (started) return;
      started = true;
      root.classList.add('home-intro-go');
      setTimeout(endIntro, 2700);
    };
    if (!photo || photo.complete) go();
    else {
      photo.addEventListener('load', go);
      photo.addEventListener('error', go);
      setTimeout(go, 2500);
    }
    // scrolling or leaving during the opening: straight to the end state
    window.addEventListener('scroll', function once() { if (window.scrollY > 4) { endIntro(); window.removeEventListener('scroll', once); } }, { passive: true });
    window.addEventListener('hashchange', endIntro);
  }

  // ---------- the light trail through the four chapters ----------
  var NS = 'http://www.w3.org/2000/svg';
  var svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'home-trail');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.innerHTML =
    '<defs><radialGradient id="homeTrailHalo"><stop offset="0" stop-color="#ff9fbb" stop-opacity=".85"/><stop offset=".4" stop-color="#af2d53" stop-opacity=".4"/><stop offset="1" stop-color="#af2d53" stop-opacity="0"/></radialGradient></defs>' +
    '<path class="ht-route"/><path class="ht-glow"/><path class="ht-line"/><g class="ht-nodes"></g>' +
    '<circle class="ht-halo" r="22" fill="url(#homeTrailHalo)"/><circle class="ht-head" r="2.4"/>';
  homeView.appendChild(svg);
  var route = svg.querySelector('.ht-route'), glow = svg.querySelector('.ht-glow'), line = svg.querySelector('.ht-line');
  var nodesG = svg.querySelector('.ht-nodes'), halo = svg.querySelector('.ht-halo'), head = svg.querySelector('.ht-head');

  // the chapters settle at these scroll positions in home.js (vh)
  var AT = [140, 240, 340, 440];
  var total = 0, nodeLen = [], nodes = [], table = [], mobileNow = null, lastL = -1, lastOp = -1;

  // a smooth curve through the points (Catmull-Rom as cubic Béziers)
  function curve(pts) {
    var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += ' C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ' ' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) +
           ' ' + (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ' ' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) +
           ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
    }
    return d;
  }

  function build() {
    var w = window.innerWidth, h = window.innerHeight, mobile = w <= 780;
    mobileNow = mobile;
    // desktop: up from the bottom over the water, right of the portrait and
    // under the annotations. Phones: a calm wave along the right edge.
    var rel = mobile
      ? [[0.92, 0.17], [0.885, 0.27], [0.94, 0.39], [0.875, 0.51], [0.935, 0.63], [0.89, 0.75], [0.925, 0.86]]
      : [[0.55, 1.06], [0.69, 0.86], [0.9, 0.73], [0.74, 0.6], [0.93, 0.5], [1.05, 0.4]];
    // the svg covers only the part of the screen the trail uses: less to paint
    var box = mobile ? { x: w * 0.8, y: h * 0.12, w: w * 0.2, h: h * 0.8 } : { x: w * 0.48, y: h * 0.32, w: w * 0.52, h: h * 0.68 };
    svg.style.left = box.x + 'px'; svg.style.top = box.y + 'px';
    svg.style.width = box.w + 'px'; svg.style.height = box.h + 'px';
    svg.setAttribute('viewBox', '0 0 ' + box.w.toFixed(1) + ' ' + box.h.toFixed(1));
    var pts = rel.map(function (p) { return [p[0] * w - box.x, p[1] * h - box.y]; });
    var d = curve(pts);
    [route, glow, line].forEach(function (p) { p.setAttribute('d', d); });
    total = line.getTotalLength();
    // a table of points along the trail, so the head never needs a lookup per frame
    table = [];
    for (var s = 0; s <= 240; s++) { var q = line.getPointAtLength(total * s / 240); table.push([q.x, q.y]); }
    // where on the trail each chapter's point lies
    nodeLen = [1, 2, 3, 4].map(function (k) {
      var best = 0, dist = Infinity;
      for (var s = 0; s <= 240; s++) {
        var dx = table[s][0] - pts[k][0], dy = table[s][1] - pts[k][1], dd = dx * dx + dy * dy;
        if (dd < dist) { dist = dd; best = total * s / 240; }
      }
      return best;
    });
    nodesG.innerHTML = '';
    nodes = nodeLen.map(function (L) {
      var q = at(L), g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'ht-node');
      g.innerHTML = '<circle class="ht-ring" cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="5"/><circle class="ht-dot" cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="4"/>';
      nodesG.appendChild(g);
      return g;
    });
    glow.style.strokeDasharray = line.style.strokeDasharray = total + ' ' + total;
    lastL = -1; lastOp = -1;
  }
  function at(L) {
    var f = clamp01(L / (total || 1)) * 240, i = Math.floor(f), k = f - i, a = table[i], b = table[Math.min(240, i + 1)];
    return [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
  }
  // scroll (vh) → drawn length: the head reaches node i as chapter i settles
  function lengthAt(vh) {
    var kp = [100].concat(AT, [500]), kl = [0].concat(nodeLen, [total]);
    if (vh <= kp[0]) return 0;
    for (var i = 0; i < kp.length - 1; i++) if (vh <= kp[i + 1]) return lerp(kl[i], kl[i + 1], map(vh, kp[i], kp[i + 1]));
    return total;
  }
  function trail(vh) {
    if (mobileNow === null || (window.innerWidth <= 780) !== mobileNow) build();
    // in once the story starts, out before the chapter break
    var op = map(vh, 95, 130) * (1 - map(vh, 470, 540));
    if (Math.abs(op - lastOp) > 0.002) { lastOp = op; svg.style.opacity = op.toFixed(3); }
    if (op <= 0) return;
    // reduced motion: no growing line, the route simply stands up to the chapter in view
    var L = reduceMotion ? nodeLen[Math.max(0, AT.filter(function (a) { return vh >= a - 50; }).length - 1)] : lengthAt(vh);
    if (Math.abs(L - lastL) < 0.4) return;
    lastL = L;
    glow.style.strokeDashoffset = line.style.strokeDashoffset = (total - L).toFixed(1);
    var q = at(L), show = L > 1 && L < total - 1 && !reduceMotion;
    head.setAttribute('transform', 'translate(' + q[0].toFixed(1) + ' ' + q[1].toFixed(1) + ')');
    halo.setAttribute('transform', head.getAttribute('transform'));
    head.style.opacity = halo.style.opacity = show ? 1 : 0;
    nodes.forEach(function (g, i) { var lit = L >= nodeLen[i] - 0.5; if (lit !== g.classList.contains('is-lit')) g.classList.toggle('is-lit', lit); });
  }
  build();
  window.addEventListener('resize', function () { mobileNow = null; });

  // ---------- the education headline: one soft light, each time it settles ----------
  var eduHead = document.querySelector('#storyCurrent .story-headline');
  var sheened = false;
  function education(nc, n5) {
    if (!eduHead || reduceMotion) return;
    if (!sheened && nc > 0.97 && n5 < 0.03) { sheened = true; eduHead.classList.add('is-sheen'); }
    else if (sheened && nc < 0.4) { sheened = false; eduHead.classList.remove('is-sheen'); }
  }

  // ---------- STILL BUILDING.: the words ----------
  var heading = document.getElementById('stillBuildingHeading');
  var letters = [];
  if (heading && finePointer && !reduceMotion) {
    // each letter its own span, and its width fixed at full weight, so a
    // thinner letter never pushes its neighbours
    // the words are split by a <br>: join them with a space for screen readers
    heading.setAttribute('aria-label', [].map.call(heading.childNodes, function (n) { return n.nodeType === 3 ? n.nodeValue.trim() : ''; }).filter(Boolean).join(' '));
    [].slice.call(heading.childNodes).forEach(function (n) {
      if (n.nodeType !== 3) return;
      var frag = document.createDocumentFragment(), wrap = document.createElement('span');
      wrap.setAttribute('aria-hidden', 'true');
      wrap.className = 'sb-word';
      for (var i = 0; i < n.nodeValue.length; i++) {
        var ch = n.nodeValue.charAt(i);
        if (!ch.trim()) { wrap.appendChild(document.createTextNode(ch)); continue; }
        var s = document.createElement('span');
        s.className = 'sb-l' + (ch === '.' ? ' sb-dot' : '');
        s.textContent = ch;
        wrap.appendChild(s);
        letters.push({ el: s, n: 0, t: 0 });
      }
      frag.appendChild(wrap);
      heading.replaceChild(frag, n);
    });
    var measure = function () {
      letters.forEach(function (l) { l.el.style.width = ''; l.el.style.removeProperty('--sb-w'); });
      letters.forEach(function (l) { l.el.style.width = l.el.offsetWidth + 'px'; });
      letters.forEach(function (l) { l.el.style.setProperty('--sb-w', Math.round(600 - 220 * l.n)); });
    };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    measure();
    window.addEventListener('resize', measure);
  }
  var lettersOn = false, typeRunning = false;
  function typeFrame() {
    var moving = false;
    letters.forEach(function (l) {
      var n = l.n + (l.t - l.n) * 0.16;
      if (Math.abs(n - l.t) < 0.003) n = l.t;
      if (n !== l.n) {
        l.n = n;
        l.el.style.setProperty('--sb-w', Math.round(600 - 220 * n));
        l.el.style.setProperty('--sb-n', n.toFixed(3));
      }
      if (n !== l.t) moving = true;
    });
    if (moving) window.requestAnimationFrame(typeFrame); else typeRunning = false;
  }
  function typeWake() { if (!typeRunning) { typeRunning = true; window.requestAnimationFrame(typeFrame); } }
  if (letters.length) {
    window.addEventListener('pointermove', function (e) {
      if (!lettersOn || e.pointerType !== 'mouse') return;
      var hr = heading.getBoundingClientRect(), reach = Math.max(120, hr.height * 0.6);
      letters.forEach(function (l) {
        var r = l.el.getBoundingClientRect(), dx = r.left + r.width / 2 - e.clientX, dy = r.top + r.height / 2 - e.clientY;
        l.t = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / reach);
      });
      typeWake();
    }, { passive: true });
    document.addEventListener('pointerleave', function () { letters.forEach(function (l) { l.t = 0; }); typeWake(); });
  }

  // ---------- STILL BUILDING.: the light behind it ----------
  // a fixed layer between the dark veil and the words; its opacity follows
  // the statement, and it calms down as the project gallery comes in
  var layer = document.createElement('div');
  layer.className = 'home-finale-light';
  layer.setAttribute('aria-hidden', 'true');
  var stillEl = document.getElementById('stillBuilding');
  homeView.insertBefore(layer, stillEl || null);
  var useGL = finePointer && window.innerWidth > 780 && !reduceMotion;
  var gl = null, canvas = null;
  if (useGL) {
    canvas = document.createElement('canvas');
    layer.appendChild(canvas);
    try { gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: false, powerPreference: 'low-power' }); } catch (e) {}
    if (!gl) { layer.removeChild(canvas); canvas = null; }
  }
  if (!gl) {
    // the light without WebGL: drawn once as SVG, moved by the compositor
    layer.classList.add('is-css');
    layer.innerHTML = '<div class="hfl-drift"><svg viewBox="0 0 2000 1000" preserveAspectRatio="none">' +
      '<defs><linearGradient id="hflG" x1="0" x2="1"><stop offset="0" stop-color="#af2d53" stop-opacity="0"/><stop offset=".25" stop-color="#d9466f" stop-opacity=".9"/><stop offset=".5" stop-color="#f7f3ea" stop-opacity=".9"/><stop offset=".75" stop-color="#d9466f" stop-opacity=".9"/><stop offset="1" stop-color="#af2d53" stop-opacity="0"/></linearGradient></defs>' +
      [0, 1, 2, 3, 4].map(function (i) {
        // one wave period per 1000 units, so the strip repeats seamlessly;
        // flat waves, set like long streaks rather than curves
        var y = 300 + i * 100, a = 10 + i * 3, ph = i * 0.9, d = 'M0 ' + y;
        for (var x = 0; x <= 2000; x += 50) d += ' L' + x + ' ' + (y + a * Math.sin(x / 1000 * Math.PI * 2 + ph)).toFixed(1);
        return '<path d="' + d + '" stroke="url(#hflG)" stroke-width="' + (0.9 + i * 0.15).toFixed(2) + '" fill="none" vector-effect="non-scaling-stroke" opacity="' + (0.3 + i * 0.08).toFixed(2) + '"/>' +
          '<path d="' + d + '" stroke="#af2d53" stroke-width="7" fill="none" vector-effect="non-scaling-stroke" opacity=".07"/>';
      }).join('') + '</svg></div>';
  }

  // WebGL: one fragment shader, procedural only (works from file://)
  var uRes, uTime, uMouse, uFade, glOK = false;
  if (gl) {
    var VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    var FS = [
      'precision mediump float;',
      'uniform vec2 uRes;uniform float uTime;uniform vec2 uMouse;uniform float uFade;',
      'void main(){',
      '  vec2 uv=gl_FragCoord.xy/uRes;float asp=uRes.x/uRes.y;',
      '  vec3 pink=vec3(.69,.18,.33);vec3 cream=vec3(.97,.95,.92);vec3 col=vec3(0.);',
      '  for(int i=0;i<5;i++){',
      '    float fi=float(i);float k=fi/4.;float x=uv.x*asp;',
      '    float y=.24+k*.52+.07*sin(x*(1.1+k*.5)+uTime*(.1+k*.035)+fi*1.7)+.03*sin(x*(2.7-k)-uTime*.07+fi);',
      '    float dm=(uv.x-uMouse.x)*asp;',
      '    y+=(uMouse.y-y)*.28*exp(-dm*dm*5.)*step(0.,uMouse.x);',
      '    float d=uv.y-y;float w=.0013+.0005*k;',
      '    float core=w*w/(d*d+w*w);float halo=.1*exp(-d*d/.0009);',
      '    float pulse=exp(-pow(fract(uv.x*.55-uTime*(.04+k*.018)+fi*.31)-.5,2.)*70.);',
      '    col+=mix(pink,cream,k*.5)*(core+halo)*(.3+1.4*pulse)*(.55+.6*k);',
      '  }',
      // calm in the middle, where the words are
      '  vec2 c=(uv-.5)*vec2(asp*.9,1.6);col*=mix(.5,1.,smoothstep(.15,.7,length(c)));',
      '  vec2 v=(uv-.5)*vec2(asp*.75,1.);col*=smoothstep(1.1,.1,length(v))*uFade*1.15;',
      '  col=1.-exp(-col*1.25);',
      '  gl_FragColor=vec4(col,max(col.r,max(col.g,col.b)));',
      '}'
    ].join('\n');
    var sh = function (type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    var prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      gl.useProgram(prog);
      var buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      var loc = gl.getAttribLocation(prog, 'p');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      uRes = gl.getUniformLocation(prog, 'uRes'); uTime = gl.getUniformLocation(prog, 'uTime');
      uMouse = gl.getUniformLocation(prog, 'uMouse'); uFade = gl.getUniformLocation(prog, 'uFade');
      glOK = true;
    }
  }
  // soft light does not need sharp pixels: drawn at 60% of the screen's resolution
  function sizeGL() {
    if (!glOK) return;
    var k = Math.min(window.devicePixelRatio || 1, 2) * 0.6;
    canvas.width = Math.max(1, Math.round(window.innerWidth * k));
    canvas.height = Math.max(1, Math.round(window.innerHeight * k));
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  sizeGL();
  window.addEventListener('resize', sizeGL);
  var mx = -1, my = -1, tmx = -1, tmy = -1, lastMove = 0, fade = 0, t0 = performance.now();
  if (glOK) {
    window.addEventListener('pointermove', function (e) {
      if (fade <= 0.02 || e.pointerType !== 'mouse') return;
      tmx = e.clientX / window.innerWidth; tmy = 1 - e.clientY / window.innerHeight;
      if (mx < 0) { mx = tmx; my = tmy; }
      lastMove = performance.now();
    }, { passive: true });
  }
  function draw(now) {
    if (tmx >= 0) { mx += (tmx - mx) * 0.06; my += (tmy - my) * 0.06; }
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, (now - t0) / 1000 + 14);
    gl.uniform2f(uMouse, mx, my);
    gl.uniform1f(uFade, fade);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  // runs only while the finale shows, the page is Home and the tab is
  // visible; on its own ~30 times a second (a short timer between frames,
  // so it isn't even woken in between), every frame while the pointer
  // steers it
  var raf = 0, wait = 0;
  function visible() { return fade > 0.02 && !homeView.hidden && !document.body.classList.contains('subpage') && !document.hidden; }
  function tick(now) {
    raf = 0;
    if (!visible()) return;
    draw(now);
    if (now - lastMove < 1200) raf = window.requestAnimationFrame(tick);
    else wait = setTimeout(function () { wait = 0; raf = window.requestAnimationFrame(tick); }, 26);
  }
  function lightOn() { if (glOK && !raf && !wait && visible()) raf = window.requestAnimationFrame(tick); }
  document.addEventListener('visibilitychange', lightOn);
  window.addEventListener('hashchange', function () { setTimeout(function () { lightOn(); cssRun(); }, 0); });
  var cssOn = null;
  function cssRun() {
    if (glOK) return;
    var on = visible() && !reduceMotion;
    if (on !== cssOn) { cssOn = on; layer.classList.toggle('is-running', on); }
  }

  // ---------- called by home.js on every frame it draws ----------
  window.akifHomeFx = function (vh, mobile, s) {
    trail(vh);
    education(s.nc, s.n5);
    // the light: with the statement, calmer once the gallery is in
    var f = clamp01(s.sb) * (1 - 0.75 * clamp01(s.eB));
    if (Math.abs(f - fade) > 0.002 || (f === 0) !== (fade === 0)) {
      fade = f;
      layer.style.opacity = glOK ? '1' : f.toFixed(3);
      if (glOK && !raf && !wait) { if (visible()) lightOn(); else if (f <= 0.02) { gl.clear(gl.COLOR_BUFFER_BIT); } }
      cssRun();
    }
    // the letters react only while the statement stands on its own
    var on = clamp01(s.sb) > 0.9 && s.eB < 0.02;
    if (on !== lettersOn) {
      lettersOn = on;
      if (!on && letters.length) { letters.forEach(function (l) { l.t = 0; }); typeWake(); }
    }
  };
})();
