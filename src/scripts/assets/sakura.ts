/**
 * 樱花飘落特效（经典脚本，构建期编译为 public/assets/sakura.js）。
 *
 * 与上游 Firefly 的实现相比做了两点有意简化：
 *  1. 不引入图片素材 —— 花瓣用离屏 canvas 程序化绘制。原版依赖一张 sakura.png，
 *     那份素材的授权状态不明确，本主题不打包任何来历不明的图片。
 *  2. 不用 Web Worker —— 20 片左右的花瓣在主线程 rAF 里开销极小，
 *     省掉 worker 通信协议与打包复杂度。
 *
 * 性能约束（与主题其余滚动逻辑同一口径）：
 *  - 页面不可见时暂停；尊重 prefers-reduced-motion
 *  - 花瓣数量上限 100，避免误配成几百片把低端设备拖垮
 *
 * 配置读自 Layout 注入的 #theme-config → style.sakura。
 */
(function () {
  if (window.__onlynnSakuraBound) return;
  window.__onlynnSakuraBound = true;

  var MAX_PETALS = 100;
  var SPRITE_SIZE = 64;

  /* 花瓣精灵：一次绘制、反复复用，避免每帧逐片画路径。
     形状按真实樱花花瓣：花柄端收成尖，外缘圆并带一个 V 形凹口。
     三个色阶供每片随机取用，避免整屏同色显得像圆点。 */
  var PETAL_TINTS = [
    { base: "#f7a8c4", edge: "#ffe0ec" },
    { base: "#ffbcd3", edge: "#fff2f7" },
    { base: "#f0b4d4", edge: "#ffeaf4" },
  ];

  function createSprite(tint) {
    var sprite = document.createElement("canvas");
    sprite.width = SPRITE_SIZE;
    sprite.height = SPRITE_SIZE;
    var g = sprite.getContext("2d");
    if (!g) return sprite;

    var w = SPRITE_SIZE * 0.28;
    var h = SPRITE_SIZE * 0.42;

    g.translate(SPRITE_SIZE / 2, SPRITE_SIZE / 2);
    g.beginPath();
    g.moveTo(0, h);
    g.bezierCurveTo(w * 1.05, h * 0.42, w * 1.1, -h * 0.3, w * 0.52, -h * 0.88);
    g.quadraticCurveTo(w * 0.22, -h * 1.12, 0, -h * 0.72);
    g.quadraticCurveTo(-w * 0.22, -h * 1.12, -w * 0.52, -h * 0.88);
    g.bezierCurveTo(-w * 1.1, -h * 0.3, -w * 1.05, h * 0.42, 0, h);
    g.closePath();

    // 花柄端色深、外缘色浅
    var grad = g.createLinearGradient(0, h, 0, -h);
    grad.addColorStop(0, tint.base);
    grad.addColorStop(1, tint.edge);
    g.fillStyle = grad;
    g.fill();
    return sprite;
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function prefersReducedMotion() {
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function readConfig() {
    var el = document.getElementById("theme-config");
    if (!el || !el.textContent) return null;
    try {
      var parsed = JSON.parse(el.textContent);
      return (parsed && parsed.style && parsed.style.sakura) || null;
    } catch (e) {
      return null;
    }
  }

  /* ── 运行器 ── */

  var canvas = null;
  var ctx = null;
  var sprites = [];
  var petals = [];
  var rafId = 0;
  var running = false;

  function removeCanvas() {
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    canvas = null;
    ctx = null;
    petals = [];
  }

  function createCanvas(zIndex) {
    var c = document.createElement("canvas");
    c.id = "canvas_sakura";
    // 纯装饰：不参与交互、也不进无障碍树
    c.setAttribute("aria-hidden", "true");
    c.style.cssText =
      "position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:" +
      zIndex;
    document.body.appendChild(c);
    return c;
  }

  function resize() {
    if (!canvas) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawn(count) {
    petals = [];
    for (var i = 0; i < count; i++) {
      petals.push({
        x: rand(0, window.innerWidth),
        y: rand(-window.innerHeight, window.innerHeight),
        // 精灵 64px，花瓣本体约占其 56%×84%，乘 0.3~0.62 后可见花瓣约 11~22px 宽
        size: rand(0.3, 0.62),
        opacity: rand(0.5, 0.85),
        rotation: rand(0, Math.PI * 2),
        vx: rand(-0.55, -0.2),
        vy: rand(0.7, 1.5),
        vr: rand(-0.02, 0.02),
        // 飘摆：正弦横移让下落带一点风感，phase 错开避免整屏同步
        swayAmp: rand(0.25, 0.7),
        phase: rand(0, Math.PI * 2),
        sprite: Math.floor(rand(0, PETAL_TINTS.length)) % PETAL_TINTS.length,
      });
    }
  }

  function frame() {
    if (!running || !ctx || !canvas || sprites.length === 0) return;
    var w = window.innerWidth;
    var h = window.innerHeight;

    ctx.clearRect(0, 0, w, h);

    for (var i = 0; i < petals.length; i++) {
      var p = petals[i];
      p.phase += 0.012;
      p.x += p.vx + Math.sin(p.phase) * p.swayAmp;
      p.y += p.vy;
      p.rotation += p.vr;

      // 越界回收：从顶部或右侧重新进入，形成连续飘落
      if (p.y > h + 40 || p.x < -40) {
        p.y = -40;
        p.x = rand(0, w);
      }

      var side = SPRITE_SIZE * p.size;
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.drawImage(sprites[p.sprite], -side / 2, -side / 2, side, side);
      ctx.restore();
    }

    rafId = window.requestAnimationFrame(frame);
  }

  function start(zIndex, count) {
    if (running) return;
    canvas = createCanvas(zIndex);
    ctx = canvas.getContext("2d");
    sprites = PETAL_TINTS.map(createSprite);
    resize();
    spawn(count);
    running = true;
    rafId = window.requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
    removeCanvas();
  }

  function apply() {
    var cfg = readConfig();
    // 一道开关两个来源：后台配置是默认值，body.sakura-disabled 是访客覆盖
    var enabled =
      !!(cfg && cfg.enable === true) &&
      !document.body.classList.contains("sakura-disabled");

    // 未开启 / 无障碍偏好 / 无 canvas 支持时不启动
    if (!enabled || prefersReducedMotion() || !document.createElement("canvas").getContext) {
      stop();
      return;
    }

    var count = Math.min(
      MAX_PETALS,
      Math.max(1, Number(cfg.count) > 0 ? Number(cfg.count) : 21),
    );
    var zIndex = Number(cfg.zIndex) > 0 ? Number(cfg.zIndex) : 100;

    // 已在运行则只调整数量，避免重建 canvas 造成闪断
    if (running) {
      if (petals.length !== count) spawn(count);
      if (canvas) canvas.style.zIndex = String(zIndex);
      return;
    }
    start(zIndex, count);
  }

  // 尺寸变化后画布要重设，否则会被拉伸
  window.addEventListener("resize", function () {
    if (!running) return;
    resize();
  });

  // 页面不可见时暂停，避免后台标签页白烧 CPU
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
    } else if (running && !rafId) {
      rafId = window.requestAnimationFrame(frame);
    }
  });

  // 访客切换樱花开关：setting-utils 的 applySakura 会改写 #theme-config 并派发该事件
  window.addEventListener("sakuraChange", apply);

  apply();
  document.addEventListener("astro:page-load", apply);
  document.addEventListener("swup:contentReplaced", apply);
})();
