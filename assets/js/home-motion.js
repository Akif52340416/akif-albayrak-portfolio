(function () {
  "use strict";
  // Home — the light layer (concept 01), on top of home.js. One effect leads
  // in each scene:
  //   opening        a line of light opens the portrait like a film frame
  //                  (CSS only, see motion.css; once per session)
  //   four chapters  the route: one line from node 01 (where it starts) to
  //                  node 04 (where it ends, a ring), drawn as the story
  //                  scrolls; each chapter lights its node, and the route's
  //                  label stands at the node of the chapter in view. Each
  //                  reached node grows a small fan of three points, the
  //                  three skills of its chapter (the lines of its label).
  //                  Desktop only: on phones the chapter list is the route
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
      setTimeout(endIntro, 2150);
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
    '<g class="ht-cursor"><circle class="ht-halo" r="22" fill="url(#homeTrailHalo)"/><circle class="ht-head" r="2.4"/></g>';
  homeView.appendChild(svg);
  var route = svg.querySelector('.ht-route'), glow = svg.querySelector('.ht-glow'), line = svg.querySelector('.ht-line');
  // head and halo move together, as one CSS transform: one write per frame,
  // and no SVG attribute change (that costs a layout pass on slow phones)
  var nodesG = svg.querySelector('.ht-nodes'), cursor = svg.querySelector('.ht-cursor'), cursorOn = null;

  var tag = document.getElementById('trailTag');

  // the chapters settle at these scroll positions in home.js (vh)
  var AT = [140, 240, 340, 440];
  var total = 0, nodeLen = [], nodes = [], endRing = null, table = [], mobileNow = null, lastL = -1, lastOp = -1;
  var box = null, pts = [], tagAt = '', fans = [];
  // the fans: always the same small shape, 26px out, 40 degrees apart, on
  // the side of the node the route does not use (up-left at 01–03; right at
  // 04, where the label stands above the node)
  var FAN_AT = [-145, -145, -145, 20], FAN_R = 26, FAN_SPREAD = 40;

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
    lastL = -1; lastOp = -1; tagAt = ''; current = -1;
    // phones: the chapter list is the route (site.css), nothing in the photo
    if (mobile) { svg.style.display = 'none'; return; }
    // the lengths below need the trail rendered; trail() hides it again
    svg.style.display = '';
    // the four chapters, rising from the water into the sky right of the
    // portrait: 01 is where the route starts, 04 where it ends — both on
    // screen. The labels stand at these same points (placeTag)
    var rel = [[0.70, 0.80], [0.76, 0.63], [0.84, 0.48], [0.90, 0.33]];
    // the svg covers only the part of the screen the route uses: less to paint
    box = { x: w * 0.6, y: h * 0.2, w: w * 0.4, h: h * 0.72 };
    svg.style.left = box.x + 'px'; svg.style.top = box.y + 'px';
    svg.style.width = box.w + 'px'; svg.style.height = box.h + 'px';
    svg.setAttribute('viewBox', '0 0 ' + box.w.toFixed(1) + ' ' + box.h.toFixed(1));
    pts = rel.map(function (p) { return [p[0] * w - box.x, p[1] * h - box.y]; });
    var d = curve(pts);
    [route, glow, line].forEach(function (p) { p.setAttribute('d', d); });
    total = line.getTotalLength();
    // a table of points along the trail, so the head never needs a lookup per frame
    table = [];
    for (var s = 0; s <= 240; s++) { var q = line.getPointAtLength(total * s / 240); table.push([q.x, q.y]); }
    // where on the route each chapter's node lies (01 at the start, 04 at the end)
    nodeLen = [0, 1, 2, 3].map(function (k) {
      if (k === 0) return 0;
      if (k === 3) return total;
      var best = 0, dist = Infinity;
      for (var s = 0; s <= 240; s++) {
        var dx = table[s][0] - pts[k][0], dy = table[s][1] - pts[k][1], dd = dx * dx + dy * dy;
        if (dd < dist) { dist = dd; best = total * s / 240; }
      }
      return best;
    });
    nodesG.innerHTML = '';
    // the fans first, so the nodes are drawn over their spokes: three short
    // spokes from the node, two short chords between the three points
    fans = pts.map(function (q, i) {
      var f = document.createElementNS(NS, 'g'), s = [-1, 0, 1].map(function (k) {
        var a = (FAN_AT[i] + k * FAN_SPREAD) * Math.PI / 180;
        return [(q[0] + Math.cos(a) * FAN_R).toFixed(1), (q[1] + Math.sin(a) * FAN_R).toFixed(1)];
      }), x = q[0].toFixed(1), y = q[1].toFixed(1), html = '';
      s.forEach(function (p) { html += '<line class="hf-spoke" x1="' + x + '" y1="' + y + '" x2="' + p[0] + '" y2="' + p[1] + '"/>'; });
      html += '<line class="hf-chord" x1="' + s[0][0] + '" y1="' + s[0][1] + '" x2="' + s[1][0] + '" y2="' + s[1][1] + '"/>';
      html += '<line class="hf-chord" x1="' + s[1][0] + '" y1="' + s[1][1] + '" x2="' + s[2][0] + '" y2="' + s[2][1] + '"/>';
      s.forEach(function (p) { html += '<circle class="hf-dot" cx="' + p[0] + '" cy="' + p[1] + '" r="2"/>'; });
      f.setAttribute('class', 'ht-fan');
      // it grows out of its own node
      f.style.transformOrigin = x + 'px ' + y + 'px';
      f.innerHTML = html;
      nodesG.appendChild(f);
      return f;
    });
    nodes = pts.map(function (q, i) {
      var g = document.createElementNS(NS, 'g'), x = q[0].toFixed(1), y = q[1].toFixed(1);
      g.setAttribute('class', 'ht-node');
      g.innerHTML = '<circle class="ht-ring" cx="' + x + '" cy="' + y + '" r="5"/><circle class="ht-dot" cx="' + x + '" cy="' + y + '" r="4"/>' +
        '<text class="ht-num" x="' + (q[0] + 13).toFixed(1) + '" y="' + (q[1] + 4).toFixed(1) + '">0' + (i + 1) + '</text>';
      nodesG.appendChild(g);
      return g;
    });
    // the end of the route: a ring around 04
    endRing = document.createElementNS(NS, 'circle');
    endRing.setAttribute('class', 'ht-end');
    endRing.setAttribute('cx', pts[3][0].toFixed(1)); endRing.setAttribute('cy', pts[3][1].toFixed(1)); endRing.setAttribute('r', '9');
    nodesG.appendChild(endRing);
    glow.style.strokeDasharray = line.style.strokeDasharray = total + ' ' + total;
    svg.style.opacity = '0';
  }

  // the area a fan takes on screen (its node and three points, a little room)
  function fanBox(i) {
    var x = box.x + pts[i][0], y = box.y + pts[i][1], xs = [x], ys = [y];
    [-1, 0, 1].forEach(function (k) { var a = (FAN_AT[i] + k * FAN_SPREAD) * Math.PI / 180; xs.push(x + Math.cos(a) * FAN_R); ys.push(y + Math.sin(a) * FAN_R); });
    return { l: Math.min.apply(null, xs) - 6, r: Math.max.apply(null, xs) + 6, t: Math.min.apply(null, ys) - 6, b: Math.max.apply(null, ys) + 6 };
  }
  // the route's label at the node of the chapter in view: above it at 04
  // (the route comes up from 03 below); otherwise the first of right-below,
  // left-below and left-above that fits on screen and touches none of the
  // fans already grown. Only when the chapter or the size changes
  function placeTag(ch) {
    if (!tag || !box) return;
    var key = ch + '|' + window.innerWidth + 'x' + window.innerHeight + '|' + tag.textContent.length;
    if (key === tagAt) return;
    tagAt = key;
    var x = box.x + pts[ch][0], y = box.y + pts[ch][1], tw = tag.offsetWidth, th = tag.offsetHeight, w = window.innerWidth;
    // 30px from the node: clear of the moving light's halo (r 22); below
    // the node its top sits just under it, above it 34px up, clear of the fan
    var spots = ch === 3 ? [[x - tw + 0.5, y - th - 26, true]] : [[x + 30, y + 10, false], [x - 30 - tw, y + 10, true], [x - tw + 0.5, y - th - 34, true]];
    var grown = [];
    for (var i = 0; i <= ch; i++) grown.push(fanBox(i));
    var pick = spots[spots.length - 1];
    for (var s = 0; s < spots.length; s++) {
      var l = spots[s][0], t = spots[s][1], r = l + tw, b = t + th;
      if (l < 24 || r > w - 24 || t < 90) continue;
      if (grown.some(function (f) { return !(r < f.l || l > f.r || b < f.t || t > f.b); })) continue;
      pick = spots[s]; break;
    }
    tag.classList.toggle('is-left', pick[2]);
    tag.style.transform = 'translate(' + Math.round(pick[0]) + 'px,' + Math.round(pick[1]) + 'px)';
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { tagAt = ''; });
  function at(L) {
    var f = clamp01(L / (total || 1)) * 240, i = Math.floor(f), k = f - i, a = table[i], b = table[Math.min(240, i + 1)];
    return [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
  }
  // scroll (vh) → drawn length: from node 01 as chapter 01 settles, the head
  // reaches node i as chapter i settles, and stops at 04
  function lengthAt(vh) {
    if (vh <= AT[0]) return 0;
    for (var i = 0; i < AT.length - 1; i++) if (vh <= AT[i + 1]) return lerp(nodeLen[i], nodeLen[i + 1], map(vh, AT[i], AT[i + 1]));
    return total;
  }
  var current = -1;
  function trail(vh, ch) {
    if (mobileNow === null || (window.innerWidth <= 780) !== mobileNow) build();
    if (mobileNow) return;
    // in once the story starts, out before the chapter break (gone before
    // the education headline, which starts rising at 490vh, can be read)
    var op = map(vh, 95, 130) * (1 - map(vh, 460, 515));
    if (Math.abs(op - lastOp) > 0.002 || (op === 0) !== (lastOp === 0)) {
      // out of the render tree while it can't be seen: nothing to restyle or paint
      svg.style.display = op > 0 ? '' : 'none';
      lastOp = op; svg.style.opacity = op.toFixed(3);
    }
    // while it is out of view (display: none) the state below is still kept
    // up to date: no transition runs on it there, so when the route comes
    // back (also after a visit to another page) every node and fan already
    // stands where the story is, and nothing is seen fading out
    var hidden = op <= 0;
    // the node of the chapter in view: its number is in the label instead,
    // and its fan is the one in full pink (the others stay dimmed)
    if (ch !== current) {
      current = ch;
      nodes.forEach(function (g, i) { g.classList.toggle('is-current', i === ch); });
      fans.forEach(function (f, i) { f.classList.toggle('is-current', i === ch); });
    }
    if (!hidden) placeTag(ch);
    // reduced motion: no growing line, the route simply stands up to the chapter in view
    var L = reduceMotion ? nodeLen[Math.max(0, AT.filter(function (a) { return vh >= a - 50; }).length - 1)] : lengthAt(vh);
    if (Math.abs(L - lastL) < 0.4) return;
    lastL = L;
    line.style.strokeDashoffset = (total - L).toFixed(1);
    glow.style.strokeDashoffset = line.style.strokeDashoffset;
    // the moving light: where the story is now, from 01 to 04
    var q = at(L), show = !reduceMotion;
    if (show !== cursorOn) { cursorOn = show; cursor.style.opacity = show ? 1 : 0; }
    if (show) cursor.style.transform = 'translate(' + q[0].toFixed(1) + 'px,' + q[1].toFixed(1) + 'px)';
    // a node reached: it lights and its fan grows (once, by CSS transition)
    nodes.forEach(function (g, i) {
      var lit = L >= nodeLen[i] - 0.5;
      if (lit !== g.classList.contains('is-lit')) { g.classList.toggle('is-lit', lit); fans[i].classList.toggle('is-on', lit); }
    });
    var end = L >= total - 0.5;
    if (endRing && end !== endRing.classList.contains('is-lit')) endRing.classList.toggle('is-lit', end);
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
      letters.forEach(function (l) { l.el.style.setProperty('--sb-w', Math.round(600 - 200 * l.n)); });
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
        l.el.style.setProperty('--sb-w', Math.round(600 - 200 * n));
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
  layer.style.display = 'none';
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
    trail(vh, s.ch || 0);
    education(s.nc, s.n5);
    // the light: with the statement, calmer once the gallery is in
    var f = clamp01(s.sb) * (1 - 0.75 * clamp01(s.eB));
    if (Math.abs(f - fade) > 0.002 || (f === 0) !== (fade === 0)) {
      // out of the render tree until the statement comes in (the whole
      // story before it scrolls without this layer)
      if ((f > 0) !== (fade > 0)) layer.style.display = f > 0 ? '' : 'none';
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
