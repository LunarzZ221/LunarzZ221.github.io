/* =====================================================
   SideRays · 首页蓝色光束
   React Bits <SideRays /> 的原生 JS 移植（无 React、无构建链）
   用法：createSideRays(el, opts) → destroy() 或 null（不支持 WebGL2）
   ===================================================== */
(function () {
  'use strict';

  var PIXEL_BUDGET = 2.4e6;
  var TAU = Math.PI * 2;

  var ORIGINS = {
    'top-right': { flipX: 0, flipY: 0, side: 0 },
    'top-left': { flipX: 1, flipY: 0, side: 0 },
    'bottom-right': { flipX: 0, flipY: 1, side: 0 },
    'bottom-left': { flipX: 1, flipY: 1, side: 0 },
    right: { flipX: 0, flipY: 0, side: 1 },
    left: { flipX: 1, flipY: 0, side: 1 }
  };

  var VERTEX = '#version 300 es\n' +
    'const vec2 corners[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));\n' +
    'void main() {\n' +
    '  gl_Position = vec4(corners[gl_VertexID], 0.0, 1.0);\n' +
    '}';

  var FRAGMENT = '#version 300 es\n' +
    'precision highp float;\n' +
    'uniform vec2 uResolution;\n' +
    'uniform float uTime;\n' +
    'uniform vec3 uColorA;\n' +
    'uniform vec3 uColorB;\n' +
    'uniform float uBlend;\n' +
    'uniform float uIntensity;\n' +
    'uniform float uSpread;\n' +
    'uniform float uDensity;\n' +
    'uniform float uSharpness;\n' +
    'uniform float uFalloff;\n' +
    'uniform float uGlow;\n' +
    'uniform float uSaturation;\n' +
    'uniform float uDust;\n' +
    'uniform float uOpacity;\n' +
    'uniform float uReveal;\n' +
    'uniform float uLight;\n' +
    'uniform vec3 uFrame;\n' +
    'uniform float uAim;\n' +
    'uniform vec3 uFocus;\n' +
    'uniform float uSway;\n' +
    'out vec4 fragColor;\n' +
    '\n' +
    'float hash(vec2 p) {\n' +
    '  p = fract(p * vec2(123.34, 456.21));\n' +
    '  p += dot(p, p + 45.32);\n' +
    '  return fract(p.x * p.y);\n' +
    '}\n' +
    '\n' +
    'float noise(vec2 p) {\n' +
    '  vec2 i = floor(p);\n' +
    '  vec2 f = p - i;\n' +
    '  vec2 w = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);\n' +
    '  float a = hash(i);\n' +
    '  float b = hash(i + vec2(1.0, 0.0));\n' +
    '  float c = hash(i + vec2(0.0, 1.0));\n' +
    '  float d = hash(i + vec2(1.0, 1.0));\n' +
    '  return mix(mix(a, b, w.x), mix(c, d, w.x), w.y);\n' +
    '}\n' +
    '\n' +
    'float shafts(float u, float t, float seed, float aa) {\n' +
    '  float sway = (0.4 * sin(t * 0.31 + seed) + 0.24 * sin(t * 0.17 + seed * 2.3)) * uSway;\n' +
    '  float n = 0.7 * noise(vec2(u + sway + seed, t * 0.3)) + 0.3 * noise(vec2(u * 2.4 + sway * 1.5 + seed * 1.7, t * 0.45 + 3.0));\n' +
    '  float width = mix(0.5, 0.1, uSharpness);\n' +
    '  float s = mix(smoothstep(0.5 - width, 0.5 + width, n), 0.5, aa);\n' +
    '  return mix(0.05, 1.0, s);\n' +
    '}\n' +
    '\n' +
    'float motes(vec2 p, float cell, float t, float seed) {\n' +
    '  p += vec2(t * 0.021, -t * 0.013) + seed * 7.31;\n' +
    '  vec2 grid = p / cell;\n' +
    '  vec2 id = floor(grid);\n' +
    '  vec2 f = grid - id;\n' +
    '  float h = hash(id + seed);\n' +
    '  if (h > 0.5) return 0.0;\n' +
    '  vec2 center = 0.25 + 0.5 * vec2(hash(id + 1.7 + seed), hash(id + 3.1 + seed));\n' +
    '  center += 0.1 * vec2(sin(t * 0.7 + h * 31.0), cos(t * 0.6 + h * 23.0));\n' +
    '  float size = mix(0.035, 0.09, hash(id + 5.3 + seed));\n' +
    '  float edge = length(fwidth(grid)) * 0.7;\n' +
    '  float twinkle = 0.55 + 0.45 * sin(t * 1.9 + h * 41.0);\n' +
    '  return (1.0 - smoothstep(size - edge, size + edge, length(f - center))) * twinkle;\n' +
    '}\n' +
    '\n' +
    'void main() {\n' +
    '  float aspect = uResolution.x / uResolution.y;\n' +
    '  vec2 q = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;\n' +
    '  if (uFrame.x > 0.5) q.x = -q.x;\n' +
    '  if (uFrame.y > 0.5) q.y = -q.y;\n' +
    '  vec2 source = uFrame.z > 0.5 ? vec2(aspect * 0.5 + 0.42, 0.3) : vec2(aspect * 0.5 + 0.1, 0.62);\n' +
    '  float heading = (uFrame.z > 0.5 ? 3.42 : -2.48) + uAim + 0.035 * sin(uTime * 0.21) * uSway;\n' +
    '  vec2 v = q - source;\n' +
    '  float r = length(v);\n' +
    '  float angle = mod(atan(v.y, v.x) - heading + 3.14159265, 6.28318531) - 3.14159265;\n' +
    '  float t = uTime;\n' +
    '  float u = angle * uDensity;\n' +
    '  float aa = smoothstep(0.12, 0.45, fwidth(u));\n' +
    '  float offset = uSpread * 0.22;\n' +
    '  float fanA = exp(-pow((angle + offset) / uSpread, 2.0) * 1.4);\n' +
    '  float fanB = exp(-pow((angle - offset) / (uSpread * 1.15), 2.0) * 1.4);\n' +
    '  float focus = 1.0 + uFocus.z * exp(-pow((angle - uFocus.x) / uFocus.y, 2.0));\n' +
    '  float lightA = fanA * shafts(u, t, 0.0, aa) * focus;\n' +
    '  float lightB = fanB * shafts(u * 0.83, t * 0.6, 17.0, aa) * focus;\n' +
    '  float reach = 1.0 / (1.0 + pow(r / 0.4, uFalloff));\n' +
    '  vec3 glowColor = mix(uColorA, uColorB, uBlend);\n' +
    '  vec3 light = (uColorA * lightA * (1.0 - uBlend) + uColorB * lightB * uBlend) * 2.0 * reach;\n' +
    '  light += glowColor * uGlow * exp(-pow(r / 0.4, 2.0));\n' +
    '  if (uDust > 0.0) {\n' +
    '    float sparkle = motes(q, 0.06, t, 0.0) + 0.7 * motes(q, 0.038, t * 0.8, 9.0);\n' +
    '    light += mix(glowColor, vec3(1.0), 0.6) * sparkle * (lightA + lightB) * reach * uDust * 2.5;\n' +
    '  }\n' +
    '  light *= uIntensity * (1.0 - smoothstep(uReveal * 2.6 - 0.45, uReveal * 2.6, r)) * smoothstep(0.0, 0.35, uReveal);\n' +
    '  float gray = dot(light, vec3(0.2126, 0.7152, 0.0722));\n' +
    '  light = max(mix(vec3(gray), light, uSaturation), 0.0);\n' +
    '  float peak = max(light.r, max(light.g, light.b));\n' +
    '  float grain = (fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) - 0.5) / 255.0;\n' +
    '  if (uLight > 0.5) {\n' +
    '    vec3 ink = pow(light / max(peak, 1e-4), vec3(2.0)) * 0.75;\n' +
    '    float alpha = clamp(pow(1.0 - exp(-peak * 2.6), 2.5) * 0.9 * uOpacity + grain, 0.0, 1.0);\n' +
    '    fragColor = vec4(pow(ink, vec3(1.0 / 2.2)) * alpha, alpha);\n' +
    '    return;\n' +
    '  }\n' +
    '  float mapped = 1.0 - exp(-peak);\n' +
    '  vec3 tone = light * (mapped / max(peak, 1e-4));\n' +
    '  tone = mix(tone, vec3(mapped), smoothstep(0.7, 1.0, mapped) * 0.55);\n' +
    '  vec3 shown = clamp(tone * uOpacity, 0.0, 1.0);\n' +
    '  float alpha = max(shown.r, max(shown.g, shown.b));\n' +
    '  vec3 color = clamp(shown * alpha + grain, 0.0, 1.0);\n' +
    '  fragColor = vec4(min(color, vec3(alpha)), alpha);\n' +
    '}';

  var clamp = function (v, min, max) { return Math.min(max, Math.max(min, v)); };
  var wrapAngle = function (a) { return ((((a + Math.PI) % TAU) + TAU) % TAU) - Math.PI; };

  var parseColor = function (value) {
    var text = String(value || '').trim();
    var hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text);
    if (hex) {
      var full = hex[1].length === 3
        ? hex[1].replace(/./g, function (d) { return d + d; })
        : hex[1];
      return [0, 2, 4].map(function (i) { return parseInt(full.slice(i, i + 2), 16) / 255; });
    }
    var rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(text);
    if (rgb) return [rgb[1], rgb[2], rgb[3]].map(function (c) { return clamp(parseFloat(c) / 255, 0, 1); });
    return [1, 1, 1];
  };

  var geometryFor = function (frame, aspect) {
    return {
      source: frame.side ? [aspect * 0.5 + 0.42, 0.3] : [aspect * 0.5 + 0.1, 0.62],
      heading: frame.side ? 3.42 : -2.48
    };
  };

  var compile = function (gl, type, source) {
    var shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };

  var link = function (gl) {
    var vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
    var fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    var program = vertex && fragment ? gl.createProgram() : null;
    if (!vertex || !fragment || !program) {
      if (vertex) gl.deleteShader(vertex);
      if (fragment) gl.deleteShader(fragment);
      return null;
    }
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return null;
    }
    var uniforms = {};
    var count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < count; i++) {
      var info = gl.getActiveUniform(program, i);
      if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
    }
    return { program: program, uniforms: uniforms };
  };

  window.createSideRays = function (container, opts) {
    if (!container) return null;
    opts = opts || {};

    var canvas = document.createElement('canvas');
    canvas.className = 'side-rays__canvas';
    canvas.setAttribute('aria-hidden', 'true');
    container.classList.add('side-rays');
    container.appendChild(canvas);

    var gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance'
    });
    var shader = gl ? link(gl) : null;
    if (!gl || !shader) return null;

    var s = {
      colorA: parseColor(opts.rayColor1 !== undefined ? opts.rayColor1 : '#FFC46B'),
      colorB: parseColor(opts.rayColor2 !== undefined ? opts.rayColor2 : '#96c8ff'),
      blend: clamp(opts.blend !== undefined ? opts.blend : 0.6, 0, 1),
      frame: ORIGINS[opts.origin] || ORIGINS['top-right'],
      speed: Math.max(0, opts.speed !== undefined ? opts.speed : 2.5) * 0.4,
      intensity: Math.max(0, opts.intensity !== undefined ? opts.intensity : 2) * 0.75,
      spread: clamp(opts.spread !== undefined ? opts.spread : 2, 0.1, 8) * 0.225,
      density: clamp(opts.density !== undefined ? opts.density : 5, 1, 40),
      sharpness: clamp(opts.sharpness !== undefined ? opts.sharpness : 0.5, 0, 1),
      tilt: (clamp(opts.tilt !== undefined ? opts.tilt : 0, -180, 180) * Math.PI) / 180,
      falloff: clamp(opts.falloff !== undefined ? opts.falloff : 1.6, 0.2, 6),
      glow: Math.max(0, opts.glow !== undefined ? opts.glow : 1) * 1.2,
      saturation: Math.max(0, opts.saturation !== undefined ? opts.saturation : 1),
      dust: clamp(opts.dust !== undefined ? opts.dust : 0, 0, 1),
      followMouse: opts.followMouse !== undefined ? opts.followMouse : true,
      mouseInfluence: clamp(opts.mouseInfluence !== undefined ? opts.mouseInfluence : 0.5, 0, 1),
      intro: opts.intro !== undefined ? opts.intro : true,
      light: !!opts.lightMode,
      opacity: clamp(opts.opacity !== undefined ? opts.opacity : 1, 0, 1),
      maxRatio: clamp(opts.maxDevicePixelRatio !== undefined ? opts.maxDevicePixelRatio : 2, 0.5, 3)
    };

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var vao = gl.createVertexArray();
    var size = { width: 1, height: 1 };
    var pointer = { x: 0, y: 0, inside: false };
    var aim = { value: 0, velocity: 0 };
    var focus = { angle: 0, strength: 0 };
    var time = Math.random() * 100;
    var reveal = s.intro && !reduced ? 0 : 1;
    var raf = 0;
    var last = 0;
    var visible = true;
    var pageVisible = document.visibilityState !== 'hidden';
    var lost = false;
    var resizePending = false;

    var applyResize = function () {
      var rect = container.getBoundingClientRect();
      var cssWidth = Math.max(1, rect.width);
      var cssHeight = Math.max(1, rect.height);
      var ratio = Math.min(
        window.devicePixelRatio || 1,
        s.maxRatio,
        Math.sqrt(PIXEL_BUDGET / (cssWidth * cssHeight))
      );
      var width = Math.max(1, Math.round(cssWidth * ratio));
      var height = Math.max(1, Math.round(cssHeight * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      size.width = cssWidth;
      size.height = cssHeight;
    };

    var resize = function () { resizePending = true; wake(); };

    var pointerAngle = function () {
      var x = (pointer.x - size.width / 2) / size.height;
      var y = (size.height / 2 - pointer.y) / size.height;
      if (s.frame.flipX) x = -x;
      if (s.frame.flipY) y = -y;
      var geo = geometryFor(s.frame, size.width / size.height);
      return wrapAngle(Math.atan2(y - geo.source[1], x - geo.source[0]) - geo.heading - s.tilt);
    };

    var frame = function (now) {
      raf = 0;
      if (resizePending) { resizePending = false; applyResize(); }
      if (lost) return;
      var dt = clamp((now - last) / 1000 || 0, 0, 0.05);
      last = Math.max(last, now);
      time += dt * s.speed * (reduced ? 0.3 : 1);
      if (reveal < 1) reveal = Math.min(1, reveal + dt / 1.6);

      var tracking = s.followMouse && pointer.inside && !reduced;
      var pointed = tracking ? pointerAngle() : 0;
      var target = tracking ? clamp(pointed, -s.spread, s.spread) * s.mouseInfluence : 0;
      var focusTarget = tracking ? s.mouseInfluence : 0;
      var ease = 1 - Math.exp(-dt * 6);
      if (tracking) focus.angle += (clamp(pointed - aim.value, -s.spread * 1.5, s.spread * 1.5) - focus.angle) * ease;
      focus.strength += (focusTarget - focus.strength) * ease;
      var stiffness = 18;
      var damping = 2 * Math.sqrt(stiffness);
      aim.velocity += ((target - aim.value) * stiffness - aim.velocity * damping) * dt;
      aim.value += aim.velocity * dt;

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(shader.program);
      gl.bindVertexArray(vao);
      var u = shader.uniforms;
      gl.uniform2f(u.uResolution, canvas.width, canvas.height);
      gl.uniform1f(u.uTime, time);
      gl.uniform3f(u.uColorA, s.colorA[0], s.colorA[1], s.colorA[2]);
      gl.uniform3f(u.uColorB, s.colorB[0], s.colorB[1], s.colorB[2]);
      gl.uniform1f(u.uBlend, s.blend);
      gl.uniform1f(u.uIntensity, s.intensity);
      gl.uniform1f(u.uSpread, s.spread);
      gl.uniform1f(u.uDensity, s.density);
      gl.uniform1f(u.uSharpness, s.sharpness);
      gl.uniform1f(u.uFalloff, s.falloff);
      gl.uniform1f(u.uGlow, s.glow);
      gl.uniform1f(u.uSaturation, s.saturation);
      gl.uniform1f(u.uDust, s.dust);
      gl.uniform1f(u.uOpacity, s.opacity);
      gl.uniform1f(u.uReveal, 1 - Math.pow(1 - reveal, 3));
      gl.uniform1f(u.uLight, s.light ? 1 : 0);
      gl.uniform3f(u.uFrame, s.frame.flipX, s.frame.flipY, s.frame.side);
      gl.uniform1f(u.uAim, s.tilt + aim.value);
      gl.uniform3f(u.uFocus, focus.angle, Math.max(0.06, s.spread * 0.25), focus.strength * 1.4);
      gl.uniform1f(u.uSway, reduced ? 0 : 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      var settling =
        Math.abs(target - aim.value) > 1e-4 ||
        Math.abs(aim.velocity) > 1e-4 ||
        Math.abs(focusTarget - focus.strength) > 1e-3;
      var busy = (s.speed > 0 && !reduced) || reveal < 1 || settling;
      if (busy && visible && pageVisible) raf = requestAnimationFrame(frame);
    };

    function wake() {
      if (raf || lost || !visible || !pageVisible) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    var onPointerMove = function (event) {
      var rect = container.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      wake();
    };
    var onLeave = function () { pointer.inside = false; wake(); };
    var onPointerUp = function (event) { if (event.pointerType !== 'mouse') onLeave(); };
    var onVisibility = function () {
      pageVisible = document.visibilityState !== 'hidden';
      wake();
    };
    var onLost = function (event) {
      event.preventDefault();
      lost = true;
      cancelAnimationFrame(raf);
      raf = 0;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointercancel', onPointerUp, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    document.addEventListener('visibilitychange', onVisibility);
    canvas.addEventListener('webglcontextlost', onLost);

    var resizeObserver = new ResizeObserver(function () { resize(); wake(); });
    resizeObserver.observe(container);

    var intersection = new IntersectionObserver(function (entries) {
      visible = entries.some(function (entry) { return entry.isIntersecting; });
      wake();
    });
    intersection.observe(container);

    applyResize();
    wake();

    return function destroy() {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onLost);
      if (!gl.isContextLost()) {
        gl.deleteVertexArray(vao);
        gl.deleteProgram(shader.program);
      }
      if (canvas.isConnected) canvas.remove();
    };
  };
})();
