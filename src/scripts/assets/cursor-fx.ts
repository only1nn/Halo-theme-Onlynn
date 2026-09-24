// @ts-nocheck —— 经典脚本按 ES5 手写、不做类型改造（与同目录 legacy 脚本同款）
/**
 * 鼠标特效（经典脚本，构建期编译为 public/assets/cursor-fx.js）。
 *
 * 创意取自 Dream2.0 Plus 的「鼠标移动特效 / 鼠标点击特效」；实现按 Onlynn 的管线重写：
 * 上游是 gulp 打包、一个特效一个脚本、九个永不停止的 rAF 循环、指针事件不节流、只有
 * 粒子爆炸有上限、爱心每次点击都往 DOM 里塞节点。这里合成单 canvas + 对象池 + 按需 rAF，
 * 补齐八项护栏；粒子的形状与运动参数（星尘坠落的 *、上浮的气泡、自转的雪花……）作为
 * 设计资产保留。
 *
 * 护栏（逐条对应上游的缺口）：
 *  1. 粒子硬上限 + 对象池：移动 ≤150、单次点击 ≤60、总数 ≤300
 *  2. 没有粒子就停掉 rAF，下一个指针事件再启动（上游是常驻循环）
 *  3. prefers-reduced-motion: reduce 时完全不启动
 *  4. 标签页隐藏时暂停，回来再续（保留既有粒子）
 *  5. 指针事件按距离 + 时间双阈值节流，并合并到一帧里处理
 *  6. DPR 感知；resize 重建画布
 *  7. pointer: coarse（触摸设备）默认不启用，用「移动端特效显示」覆盖
 *  8. 单次绑定守卫，换页后按需重建画布
 *
 * 配置读自 Layout 注入的 #theme-config → enhance.cursorFx。
 */
(function () {
  if (window.__onlynnCursorFxBound) return;
  window.__onlynnCursorFxBound = true;

  /* ── 护栏常量 ── */
  var MAX_MOVE = 150;
  var MAX_CLICK = 60;
  var MAX_TOTAL = 300;
  var CLICK_BATCH = 18;
  var DOT_LAG = 10;
  var SETTLE_MS = 1200;
  /** 压过导航栏(60)、灯箱(30)与樱花(默认 100)，低于三个模态(9999) —— 不学上游的 999999 */
  var Z_INDEX = 9998;

  /* 每种移动特效的生成节奏：dist = 至少移动多少像素，gap = 至少间隔多少毫秒 */
  var MOVE_FX = {
    fairyDustCursor: { dist: 5, gap: 28, life: [60, 90] },
    bubbleCursor: { dist: 11, gap: 55, life: [80, 140] },
    snowflakeCursor: { dist: 7, gap: 40, life: [80, 140] },
    emojiCursor: { dist: 10, gap: 55, life: [60, 90] },
    // 残影（疏）：沿路径盖章的游标残影，40 帧淡出
    ghostCursor: { dist: 9, gap: 45, life: [40, 40] },
  };

  /*
    旧值别名。v1.2.0 开发期这批特效先用了短名字，配置值按新名字（与原参考主题一致）
    统一后，仍认这些旧值，免得已经存过的配置一夜之间失效。
  */
  var MOVE_ALIAS = {
    stardust: "fairyDustCursor",
    bubble: "bubbleCursor",
    snow: "snowflakeCursor",
    emoji: "emojiCursor",
    dot: "followingDotCursor",
  };
  var CLICK_ALIAS = { burst: "granule", word: "prosperous" };

  var DEFAULT_EMOJI = ["🌸", "✨", "💗", "⭐", "🎈"];
  var DEFAULT_WORDS = [
    "富强",
    "民主",
    "文明",
    "和谐",
    "自由",
    "平等",
    "公正",
    "法治",
    "爱国",
    "敬业",
    "诚信",
    "友善",
  ];

  /* ── 工具 ── */

  var nowFn =
    window.performance && window.performance.now
      ? function () {
          return window.performance.now();
        }
      : function () {
          return Date.now();
        };

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length) % arr.length];
  }

  function splitList(raw, fallback) {
    var list = String(raw || "")
      .split(/[,，]/)
      .map(function (s) {
        return s.trim();
      })
      .filter(function (s) {
        return s.length > 0;
      });
    return list.length ? list : fallback;
  }

  function prefersReducedMotion() {
    return (
      !!window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function isCoarse() {
    return (
      !!window.matchMedia && window.matchMedia("(pointer: coarse)").matches
    );
  }

  function readConfig() {
    var el = document.getElementById("theme-config");
    if (!el || !el.textContent) return null;
    try {
      var parsed = JSON.parse(el.textContent);
      var fx = (parsed && parsed.enhance && parsed.enhance.cursorFx) || null;
      if (!fx) return null;
      // 开发期用过的短名字仍然认（见 MOVE_ALIAS / CLICK_ALIAS）
      if (MOVE_ALIAS[fx.move]) fx.move = MOVE_ALIAS[fx.move];
      if (CLICK_ALIAS[fx.click]) fx.click = CLICK_ALIAS[fx.click];
      return fx;
    } catch (e) {
      return null;
    }
  }

  /* ── 主题色相 ── */

  var hue = 300;

  function syncHue() {
    var raw = getComputedStyle(document.documentElement).getPropertyValue(
      "--hue",
    );
    var n = parseFloat(raw);
    if (isFinite(n)) hue = n;
  }

  /** s/l/a 是饱和度/明度/透明度，d 是色相偏移（不传即跟随主题色相） */
  function hsl(s, l, a, d) {
    return "hsla(" + (hue + (d || 0)) + ", " + s + "%, " + l + "%, " + a + ")";
  }

  /* ── 状态 ── */

  var canvas = null;
  var ctx = null;
  var rafId = 0;
  var particles = [];
  var pool = [];
  var cfg = null;
  var opacity = 1;
  var emojiList = DEFAULT_EMOJI;
  var wordList = DEFAULT_WORDS;
  var wordIndex = 0;
  var vw = 0;
  var vh = 0;
  var pointer = { x: -1, y: -1 };
  var emitAt = { x: -1, y: -1, t: 0 };
  var pending = false;
  var dot = { x: 0, y: 0, alpha: 0, shown: false };
  var lastMoveAt = 0;
  /* 跟随类特效（圆点/残影/弹性表情）没有粒子可数，只能看游标是不是还在动。
     用**帧数**而不是墙钟：后台标签页会把定时器节流到 1s 一帧，按毫秒判断会出现
     「只画了一帧就被判空闲、紧接着被 else 分支清屏」——实测就是这么丢掉整条残影的。 */
  var idleFrames = 0;
  var IDLE_FRAMES = 90;
  var paused = false;
  var running = false;
  /*
    已就绪但还没真正开工：配置允许时会置上，等**第一次指针事件**才建画布。
    为什么不在页面加载时就把画布建好 —— 那样每打开一个页面都要分配一整屏画布
    （DPR 2 的 4K 屏上是 3840×2160 ≈ 33MB）、烘一批离屏精灵（含 measureText /
    fillText，会碰字体匹配）、再排一个 rAF，而多数访问根本不会动鼠标。
    实测：改成按需后，页面加载阶段这项开销归零，鼠标一动照样立刻有特效。
  */
  var armed = false;
  var sprites = null;

  /* ── 精灵（一次绘制反复复用，避免逐帧画路径） ── */

  function makeCanvas(w, h) {
    var c = document.createElement("canvas");
    c.width = Math.max(1, Math.ceil(w));
    c.height = Math.max(1, Math.ceil(h));
    return c;
  }

  /** 把一个字符（* 或表情）画进离屏画布，供 drawImage 反复取用 */
  function glyphSprite(char, color, size) {
    var probe = makeCanvas(size * 2, size * 2).getContext("2d");
    if (!probe) return null;
    var font = size + "px serif";
    probe.font = font;
    probe.textBaseline = "middle";
    probe.textAlign = "center";
    var m = probe.measureText(char);
    var w = Math.max(4, m.width);
    var h = Math.max(
      4,
      (m.actualBoundingBoxAscent || size * 0.7) +
        (m.actualBoundingBoxDescent || size * 0.3),
    );

    var c = makeCanvas(w, h);
    var g = c.getContext("2d");
    if (!g) return null;
    g.font = font;
    g.textBaseline = "middle";
    g.textAlign = "center";
    g.fillStyle = color;
    g.fillText(char, w / 2, h / 2);
    return c;
  }

  /** 六角雪花：浅色填充 + 主题色描边 —— 白底与深色底都看得清 */
  function snowSprite() {
    var S = 22;
    var c = makeCanvas(S, S);
    var g = c.getContext("2d");
    if (!g) return null;
    g.translate(S / 2, S / 2);
    g.beginPath();
    var i;
    var k;
    var a;
    for (i = 0; i < 6; i++) {
      a = (Math.PI / 3) * i;
      g.moveTo(0, 0);
      g.lineTo(Math.cos(a) * 9, Math.sin(a) * 9);
      // 每根主枝末端两侧各挂一根小杈
      for (k = -1; k <= 1; k += 2) {
        g.moveTo(Math.cos(a) * 5.5, Math.sin(a) * 5.5);
        g.lineTo(
          Math.cos(a) * 5.5 + Math.cos(a + k * 0.9) * 2.6,
          Math.sin(a) * 5.5 + Math.sin(a + k * 0.9) * 2.6,
        );
      }
    }
    g.lineWidth = 1.4;
    g.lineCap = "round";
    g.strokeStyle = hsl(62, 58, 0.85);
    g.stroke();
    return c;
  }

  /*
    游标残影用的箭头。原参考主题内嵌了一张 12×19 的深色箭头 PNG，
    这里改成程序化画一枚主题色描边的指针 —— 效果一样，但不引入那张来历不明的位图。
    箭头的「点击点」在左上角 (0,0)，与真游标一致，所以盖章时直接按位置贴即可。
  */
  function arrowSprite() {
    var W = 13;
    var H = 20;
    var c = makeCanvas(W, H);
    var g = c.getContext("2d");
    if (!g) return null;
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(0, 13.5);
    g.lineTo(3.4, 10.2);
    g.lineTo(5.8, 15.6);
    g.lineTo(8.2, 14.5);
    g.lineTo(5.8, 9.2);
    g.lineTo(10.4, 9.0);
    g.closePath();
    g.fillStyle = hsl(48, 62, 1);
    g.fill();
    // 白色描边保证任何底色上都看得清（深色底靠填充、浅色底靠描边）
    g.lineWidth = 1.2;
    g.lineJoin = "round";
    g.strokeStyle = "rgba(255, 255, 255, 0.9)";
    g.stroke();
    return c;
  }

  /*
    精灵按需构建：只做当前特效要用的那几张离屏画布。
    每张精灵都要 measureText / fillText（还会碰字体匹配），全做一遍是纯浪费 ——
    只开「点击特效」却把 5 个表情全烘一遍尤为明显。

    ⚠ 下面取精灵一律走 spriteList() / sprite0()：按需构建后某个键可能压根不存在，
    直接读 sprites.xxx.length 会抛错。
  */
  function spriteList(name) {
    return (sprites && sprites[name]) || [];
  }

  function sprite0(name) {
    var list = spriteList(name);
    return list.length ? list[0] : null;
  }

  function buildSprites() {
    sprites = {};
    var move = (cfg && cfg.move) || "";
    if (move === "fairyDustCursor") {
      sprites.fairyDustCursor = [
        glyphSprite("*", hsl(72, 62, 1), 21),
        glyphSprite("*", hsl(78, 55, 1), 21),
        glyphSprite("*", hsl(66, 68, 1), 21),
      ].filter(Boolean);
    } else if (move === "emojiCursor" || move === "springyEmojiCursor") {
      sprites.emojiCursor = emojiList
        .map(function (e) {
          return glyphSprite(e, "#000", 21);
        })
        .filter(Boolean);
    } else if (move === "snowflakeCursor") {
      sprites.snowflakeCursor = [snowSprite()].filter(Boolean);
    } else if (move === "ghostCursor" || move === "trailingCursor") {
      sprites.arrow = [arrowSprite()].filter(Boolean);
    }
  }

  /* ── 画布 ── */

  function createCanvas() {
    var c = document.createElement("canvas");
    c.id = "canvas_cursor_fx";
    // 纯装饰：不参与交互、也不进无障碍树
    c.setAttribute("aria-hidden", "true");
    c.style.cssText =
      "position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:" +
      Z_INDEX;
    document.body.appendChild(c);
    return c;
  }

  function resize() {
    if (!canvas) return;
    vw = window.innerWidth;
    vh = window.innerHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(vw * dpr);
    canvas.height = Math.floor(vh * dpr);
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* ── 粒子 ── */

  function blankParticle() {
    return {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      grav: 0,
      drag: 0,
      life: 0,
      maxLife: 1,
      size: 0,
      rot: 0,
      vrot: 0,
      alpha: 1,
      sprite: null,
      color: "#fff",
      text: "",
      shape: "circle",
    };
  }

  function obtain() {
    var p = pool.length ? pool.pop() : blankParticle();
    p.grav = 0;
    p.drag = 0;
    p.vrot = 0;
    p.sprite = null;
    p.text = "";
    p.shape = "circle";
    return p;
  }

  function push(p) {
    if (particles.length >= MAX_TOTAL) return;
    particles.push(p);
  }

  function recycle() {
    for (var i = particles.length - 1; i >= 0; i--) {
      if (particles[i].life <= 0) {
        if (pool.length < MAX_TOTAL) pool.push(particles[i]);
        particles.splice(i, 1);
      }
    }
  }

  /* ── 生成器 ── */

  function spawnMove(x, y) {
    var spec = MOVE_FX[cfg.move];
    if (!spec) return;
    var p;
    if (cfg.move === "fairyDustCursor" || cfg.move === "emojiCursor") {
      var list =
        cfg.move === "emojiCursor"
          ? spriteList("emojiCursor")
          : spriteList("fairyDustCursor");
      if (!list.length) return;
      p = obtain();
      p.x = x;
      p.y = y;
      p.vx = (Math.random() < 0.5 ? -1 : 1) * (Math.random() / 2);
      p.vy = rand(0.9, 1.6);
      p.grav = 0.02;
      p.maxLife = p.life = Math.round(rand(spec.life[0], spec.life[1]));
      p.size = 1;
      p.rot = rand(-0.3, 0.3);
      p.sprite = pick(list);
      p.shape = "sprite";
    } else if (cfg.move === "bubbleCursor") {
      p = obtain();
      p.x = x;
      p.y = y;
      p.vx = (Math.random() < 0.5 ? -1 : 1) * (Math.random() / 10);
      p.vy = -0.4 + Math.random() * -1;
      p.grav = -1 / 600;
      p.maxLife = p.life = Math.round(rand(spec.life[0], spec.life[1]));
      p.size = 7;
      p.shape = "bubble";
    } else if (cfg.move === "snowflakeCursor") {
      p = obtain();
      p.x = x;
      p.y = y;
      p.vx = (Math.random() < 0.5 ? -1 : 1) * (Math.random() / 2);
      p.vy = 1 + Math.random();
      p.grav = -1 / 300;
      p.maxLife = p.life = Math.round(rand(spec.life[0], spec.life[1]));
      p.size = 1;
      p.vrot = 2 * 0.0174533;
      p.sprite = sprite0("snowflakeCursor");
      p.shape = "sprite";
    } else if (cfg.move === "ghostCursor") {
      // 沿路径盖章的游标箭头，靠 alpha 淡出（原主题 40 帧、无位移）
      if (!spriteList("arrow").length) return;
      p = obtain();
      p.x = x;
      p.y = y;
      p.maxLife = p.life = 40;
      p.alpha = 0.75;
      p.sprite = sprite0("arrow");
      p.shape = "stamp";
    }
    if (p) push(p);
  }

  /*
    移动残影（密）：不是粒子，而是一串**首尾相随**的箭头 —— 原主题的 trailingCursor
    让 15 枚箭头依次追前一枚（每枚按 0.4 的比例靠拢），所以拖动鼠标时是一条连续的蛇。
    这里沿用同一套跟随算法，只在链尾加一点淡出（原来整条链同色同深，浅色壁纸上会糊成
    一整块）。
  */
  var TRAIL_DOTS = 15;
  var trail = { inited: false, dots: [] };

  function initTrail(x, y) {
    trail.dots = [];
    for (var i = 0; i < TRAIL_DOTS; i++) {
      trail.dots.push({ x: x, y: y });
    }
    trail.inited = true;
  }

  function stepTrail() {
    var img = sprite0("arrow");
    if (!trail.inited || !img) return;
    var g = ctx;
    var px = pointer.x;
    var py = pointer.y;
    for (var i = 0; i < trail.dots.length; i++) {
      var dot = trail.dots[i];
      var next = trail.dots[i + 1] || trail.dots[0];
      dot.x = px;
      dot.y = py;
      px += (next.x - dot.x) * 0.4;
      py += (next.y - dot.y) * 0.4;
      g.globalAlpha = opacity * (1 - (i / trail.dots.length) * 0.55);
      g.drawImage(img, dot.x, dot.y);
    }
    g.globalAlpha = 1;
  }

  /*
    弹性表情包跟随：原主题把 7 个表情用弹簧串成一根「绳子」挂在游标后面（自己写了个
    小物理循环：弹簧系数 10、质量 1、重力 50、阻力 10、每步 0.01）。这里照同样的
    参数做，只是把「点」换成表情图 —— 甩动鼠标时表情会像串珠子一样荡出去再弹回来。
  */
  var SPRING_DOTS = 7;
  var SPRING_SEG = 10;
  var SPRING_K = 10;
  var SPRING_MASS = 1;
  var SPRING_GRAVITY = 50;
  var SPRING_RESIST = 10;
  var SPRING_DT = 0.01;
  var rope = { inited: false, dots: [] };

  function initRope(x, y) {
    rope.dots = [];
    for (var i = 0; i < SPRING_DOTS; i++) {
      rope.dots.push({ x: x, y: y, vx: 0, vy: 0 });
    }
    rope.inited = true;
  }

  function stepRope() {
    if (!rope.inited) return;
    var dots = rope.dots;
    dots[0].x = pointer.x;
    dots[0].y = pointer.y;
    dots[0].vx = 0;
    dots[0].vy = 0;

    for (var i = 1; i < dots.length; i++) {
      var d = dots[i];
      var prev = dots[i - 1];
      var nxt = dots[i + 1] || dots[i];
      // 与前后两枚各算一次弹簧力；末端只有前一枚
      var fx = 0;
      var fy = 0;
      var f = springForce(prev, d);
      fx += f[0];
      fy += f[1];
      if (i + 1 < dots.length) {
        f = springForce(nxt, d);
        fx += f[0];
        fy += f[1];
      }
      // 加速度 = (弹簧力 − 阻力) / 质量，再叠加重力
      var ax = (fx - d.vx * SPRING_RESIST) / SPRING_MASS;
      var ay = (fy - d.vy * SPRING_RESIST) / SPRING_MASS + SPRING_GRAVITY;
      d.vx += SPRING_DT * ax;
      d.vy += SPRING_DT * ay;
      if (Math.abs(d.vx) < 0.1 && Math.abs(d.vy) < 0.1) {
        d.vx = 0;
        d.vy = 0;
      }
      d.x += d.vx;
      d.y += d.vy;
    }
  }

  /** 两枚之间的距离超出段长时产生的回弹力 */
  function springForce(from, to) {
    var dx = to.x - from.x;
    var dy = to.y - from.y;
    var len = Math.sqrt(dx * dx + dy * dy) || 0.0001;
    var diff = (len - SPRING_SEG) / len;
    return [-SPRING_K * dx * diff, -SPRING_K * dy * diff];
  }

  function drawRope() {
    var img = sprite0("emojiCursor");
    if (!rope.inited || !img) return;
    for (var i = 0; i < rope.dots.length; i++) {
      var d = rope.dots[i];
      ctx.globalAlpha = opacity * (1 - (i / rope.dots.length) * 0.45);
      ctx.drawImage(img, d.x - img.width / 2, d.y - img.height / 2);
    }
    ctx.globalAlpha = 1;
  }

  /*
    烟花特效：原主题是 10 颗小圆点朝上方扇形散开（角度 π±1、初速 1~6），
    每帧额外加速度 0.3 往下坠，飞出画布就算结束。
    颜色原本是随机高亮色，这里换成围绕主题色相的几个亮点 —— 一样是「彩的」，
    但不会跟站点的色系打架。
  */
  function spawnFirework(x, y) {
    var colors = [
      hsl(95, 55, 1),
      hsl(80, 62, 1),
      hsl(70, 70, 1, 40),
      hsl(70, 70, 1, -45),
      "rgba(255, 255, 255, 0.95)",
    ];
    var n = 10;
    for (var i = 0; i < n; i++) {
      var p = obtain();
      p.x = x;
      p.y = y;
      p.color = pick(colors);
      var angle = rand(Math.PI - 1, Math.PI + 1);
      var speed = rand(1, 6);
      p.vx = Math.sin(angle) * speed;
      p.vy = Math.cos(angle) * speed;
      // 用 grav 承担 0.3/帧的加速下坠（在 frame 里同样按帧率归一化）
      p.grav = 0.3;
      p.size = 2;
      p.maxLife = p.life = 90;
      p.shape = "spark";
      push(p);
    }
  }

  function spawnBurst(x, y) {
    var colors = [
      hsl(70, 62, 1),
      hsl(85, 55, 0.95),
      hsl(58, 72, 1),
      hsl(95, 50, 0.9),
      hsl(75, 62, 1, 45), // 暖色点缀
      hsl(75, 62, 1, -50), // 冷色点缀
    ];
    var n = Math.min(CLICK_BATCH, MAX_CLICK);
    for (var i = 0; i < n; i++) {
      var theta = rand(0, Math.PI * 2);
      var force = rand(2.5, 7);
      var p = obtain();
      p.x = x;
      p.y = y;
      p.vx = Math.sin(theta) * force;
      p.vy = Math.cos(theta) * force;
      p.drag = rand(0.92, 0.99);
      p.size = rand(3, 9);
      p.maxLife = p.life = 70;
      p.color = pick(colors);
      p.shape = "circle";
      push(p);
    }
  }

  function spawnHeart(x, y) {
    var p = obtain();
    p.x = x;
    p.y = y;
    p.vx = rand(-0.2, 0.2);
    p.vy = -1;
    p.size = rand(7, 10);
    p.maxLife = p.life = 78;
    p.color = hsl(78, 58, 1);
    p.shape = "heart";
    push(p);
  }

  function spawnWord(x, y) {
    var p = obtain();
    p.x = x;
    p.y = y - 20;
    p.vx = 0;
    p.vy = -1.78;
    p.maxLife = p.life = 90;
    p.color = hsl(80, 55, 1);
    p.text = wordList[wordIndex % wordList.length];
    wordIndex = (wordIndex + 1) % wordList.length;
    p.shape = "text";
    push(p);
  }

  function spawnClick(x, y) {
    if (cfg.click === "granule") spawnBurst(x, y);
    else if (cfg.click === "heart") spawnHeart(x, y);
    else if (cfg.click === "prosperous") spawnWord(x, y);
    else if (cfg.click === "firework") spawnFirework(x, y);
  }

  /* ── 绘制 ── */

  function heartPath(g, w, h) {
    var top = h * 0.3;
    g.beginPath();
    g.moveTo(0, top);
    g.bezierCurveTo(0, 0, -w / 2, 0, -w / 2, top);
    g.bezierCurveTo(-w / 2, (h + top) / 2, 0, (h + top) / 2, 0, h);
    g.bezierCurveTo(0, (h + top) / 2, w / 2, (h + top) / 2, w / 2, top);
    g.bezierCurveTo(w / 2, 0, 0, 0, 0, top);
    g.closePath();
  }

  function drawParticle(g, p) {
    var t = Math.max(p.life / p.maxLife, 0);
    var a = p.alpha * opacity;
    if (a <= 0) return;

    if (p.shape === "sprite") {
      if (!p.sprite) return;
      var sw = p.sprite.width * t;
      var sh = p.sprite.height * t;
      g.save();
      g.globalAlpha = a * t;
      g.translate(p.x, p.y);
      if (p.vrot) g.rotate(p.rot);
      g.drawImage(p.sprite, -sw / 2, -sh / 2, sw, sh);
      g.restore();
      return;
    }

    if (p.shape === "bubble") {
      var scale = 0.2 + (1 - t) * 0.8;
      g.globalAlpha = a * Math.min(1, t * 3);
      g.beginPath();
      g.arc(p.x, p.y, p.size * scale, 0, Math.PI * 2);
      // 填充只留一点底，浅色页面上靠 1.5px 的主题色描边读出「泡泡」
      g.fillStyle = hsl(85, 96, 0.45);
      g.strokeStyle = hsl(62, 52, 1);
      g.lineWidth = 1.5;
      g.fill();
      g.stroke();
      g.globalAlpha = 1;
      return;
    }

    if (p.shape === "circle") {
      g.globalAlpha = a * Math.min(1, t * 2.2); // 前段不变，末段淡出
      g.beginPath();
      g.arc(
        p.x,
        p.y,
        Math.max(p.size * (0.35 + t * 0.65), 0.5),
        0,
        Math.PI * 2,
      );
      g.fillStyle = p.color;
      g.fill();
      g.globalAlpha = 1;
      return;
    }

    if (p.shape === "heart") {
      // 上浮 + 放大 + 淡出，与上游的 DOM 爱心同观感
      var hs = p.size * (1 + (1 - t) * 0.5);
      g.save();
      g.globalAlpha = a * t;
      g.translate(p.x, p.y);
      g.fillStyle = p.color;
      heartPath(g, hs * 2, hs * 2);
      g.fill();
      g.restore();
      return;
    }

    if (p.shape === "text") {
      g.save();
      g.globalAlpha = a * Math.pow(t, 0.6);
      g.fillStyle = p.color;
      g.font =
        "bold 17px 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(p.text, p.x, p.y);
      g.restore();
      return;
    }

    if (p.shape === "stamp") {
      // 游标残影：原位盖章、只淡出不缩小（缩小会看起来像在往后退）
      if (!p.sprite) return;
      g.globalAlpha = a * t;
      g.drawImage(p.sprite, p.x, p.y);
      g.globalAlpha = 1;
      return;
    }

    if (p.shape === "spark") {
      // 烟花的火星：叠色 + 拖尾（按当前速度反向画一段线），头上一个亮点
      var tail = 4.5;
      g.globalAlpha = a * Math.min(1, t * 2.4);
      g.strokeStyle = p.color;
      g.lineWidth = 2.5;
      g.lineCap = "round";
      g.beginPath();
      g.moveTo(p.x, p.y);
      g.lineTo(p.x - p.vx * tail, p.y - p.vy * tail);
      g.stroke();
      g.beginPath();
      g.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
      g.fillStyle = p.color;
      g.fill();
      g.globalAlpha = 1;
      return;
    }
  }

  function drawDot(g) {
    if (!dot.shown || dot.alpha <= 0) return;
    g.save();
    g.globalAlpha = dot.alpha * opacity;
    g.beginPath();
    g.arc(dot.x, dot.y, 10, 0, Math.PI * 2);
    g.fillStyle = hsl(40, 42, 0.75);
    g.fill();
    g.restore();
  }

  /* ── 主循环 ── */

  /** 残影（密）/ 弹性表情：不是粒子，而是一串挂在游标上的东西 */
  function isFollower() {
    return (
      !!cfg &&
      (cfg.move === "trailingCursor" || cfg.move === "springyEmojiCursor")
    );
  }

  function hasWork() {
    if (particles.length > 0) return true;
    if (cfg && cfg.move === "followingDotCursor" && dot.shown) return true;
    if (isFollower() && pointer.x >= 0) return idleFrames < IDLE_FRAMES;
    return false;
  }

  function ensureRaf() {
    if (rafId || paused || !running) return;
    rafId = window.requestAnimationFrame(frame);
  }

  function stopRaf() {
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
  }

  function stepDot(now) {
    if (!cfg || cfg.move !== "followingDotCursor") {
      dot.shown = false;
      return;
    }
    if (pointer.x < 0) return;
    if (!dot.shown) {
      dot.x = pointer.x;
      dot.y = pointer.y;
      dot.shown = true;
    }
    var dx = pointer.x - dot.x;
    var dy = pointer.y - dot.y;
    dot.x += dx / DOT_LAG;
    dot.y += dy / DOT_LAG;

    /* 淡出与淡入必须互斥：两行都执行的话每帧净 +0.01，圆点的 rAF 就再也停不下来 */
    var settled = Math.abs(dx) < 0.6 && Math.abs(dy) < 0.6;
    if (settled && now - lastMoveAt > SETTLE_MS) {
      dot.alpha -= 0.05;
      if (dot.alpha <= 0) {
        dot.alpha = 0;
        dot.shown = false;
      }
    } else if (dot.alpha < 1) {
      dot.alpha = Math.min(1, dot.alpha + 0.06);
    }
  }

  function frame() {
    rafId = 0;
    if (!ctx || !running) return;
    idleFrames++;

    var now = nowFn();
    var dt = now - (frame.last || now);
    frame.last = now;
    // 帧率无关：120Hz 屏上不至于双倍速；卡顿后也不让粒子瞬移
    var k = Math.min(dt, 34) / 16.667;

    ctx.clearRect(0, 0, vw, vh);

    var i;
    var p;

    // 指针事件合并到这一帧里处理（护栏 5）
    if (pending && cfg) {
      pending = false;
      var spec = MOVE_FX[cfg.move];
      if (spec && pointer.x >= 0) {
        var dist = Math.sqrt(
          Math.pow(pointer.x - emitAt.x, 2) + Math.pow(pointer.y - emitAt.y, 2),
        );
        if (emitAt.x < 0 || (dist >= spec.dist && now - emitAt.t >= spec.gap)) {
          var batch = Math.min(3, Math.floor(dist / spec.dist) || 1);
          for (i = 0; i < batch && particles.length < MAX_MOVE; i++) {
            spawnMove(pointer.x, pointer.y);
          }
          emitAt.x = pointer.x;
          emitAt.y = pointer.y;
          emitAt.t = now;
        }
      }
    }

    ctx.globalCompositeOperation = "lighter";
    for (i = 0; i < particles.length; i++) {
      p = particles[i];
      p.x += p.vx * k;
      p.y += p.vy * k;
      if (p.grav) p.vy += p.grav * k;
      if (p.drag) {
        p.vx *= Math.pow(p.drag, k);
        p.vy *= Math.pow(p.drag, k);
      }
      if (p.vrot) p.rot += p.vrot * k;
      p.life -= k;
      // 残影是「实心游标」，用叠色会把它冲成一片白；其余特效靠叠色出光晕
      var wanted = p.shape === "stamp" ? "source-over" : "lighter";
      if (ctx.globalCompositeOperation !== wanted) {
        ctx.globalCompositeOperation = wanted;
      }
      drawParticle(ctx, p);
    }
    ctx.globalCompositeOperation = "source-over";

    if (cfg && cfg.move === "trailingCursor") {
      if (!trail.inited && pointer.x >= 0) initTrail(pointer.x, pointer.y);
      stepTrail();
    } else if (cfg && cfg.move === "springyEmojiCursor") {
      if (!rope.inited && pointer.x >= 0) initRope(pointer.x, pointer.y);
      stepRope();
      drawRope();
    }

    stepDot(now);
    drawDot(ctx);

    recycle();

    if (hasWork()) {
      rafId = window.requestAnimationFrame(frame);
    } else if (!isFollower()) {
      // 跟随类特效停下时**不清屏**：最后那帧的残影/圆点就留在画面上，
      // 鼠标再动起来会接上去（清屏会让残影在停下的一瞬间整条消失）
      ctx.clearRect(0, 0, vw, vh);
    }
  }

  /* ── 指针事件 ── */

  function allowPointer(e) {
    // 触摸设备默认不启用，除非后台开了「移动端特效显示」
    return e.pointerType !== "touch" || !!cfg.mobile;
  }

  function onMove(e) {
    if (!cfg || !allowPointer(e)) return;
    ensureStarted();
    if (!running) return;
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    lastMoveAt = nowFn();
    idleFrames = 0;
    pending = true;
    ensureRaf();
  }

  function onDown(e) {
    if (!cfg || !allowPointer(e)) return;
    if (e.pointerType !== "touch" && e.button !== 0) return;
    if (cfg.click === "none") return;
    // 表单里打字、拖选文字时不冒粒子
    var target = e.target;
    if (
      target &&
      target.closest &&
      target.closest(
        "input, textarea, select, [contenteditable=''], [contenteditable='true']",
      )
    ) {
      return;
    }
    ensureStarted();
    if (!running) return;
    spawnClick(e.clientX, e.clientY);
    ensureRaf();
  }

  /** 第一次指针事件到来时才真正建画布（配置允许但还没开工时） */
  function ensureStarted() {
    if (armed && !running && shouldRun()) start();
  }

  /* ── 启停 ── */

  function shouldRun() {
    if (!cfg) return false;
    if (cfg.move === "none" && cfg.click === "none") return false;
    // 访客在显示设置面板里关掉了（护栏 8 之外的另一道门）
    if (document.body.classList.contains("cursor-fx-off")) return false;
    if (prefersReducedMotion()) return false;
    if (isCoarse() && !cfg.mobile) return false;
    if (!document.createElement("canvas").getContext) return false;
    return true;
  }

  function start() {
    if (running) return;
    if (!canvas || !canvas.parentNode) canvas = createCanvas();
    ctx = canvas.getContext("2d");
    if (!ctx) return;
    resize();
    syncHue();
    buildSprites();
    pointer.x = -1;
    pointer.y = -1;
    emitAt.x = -1;
    emitAt.y = -1;
    dot.shown = false;
    dot.alpha = 0;
    // 残影链与弹性表情的「绳子」都要重新挂到游标当前位置
    trail.inited = false;
    rope.inited = false;
    running = true;
    armed = true;
    frame.last = 0;
    paused = false;
    ensureRaf();
  }

  function stop() {
    running = false;
    armed = false;
    paused = false;
    stopRaf();
    particles.length = 0;
    pool.length = 0;
    dot.shown = false;
    dot.alpha = 0;
    trail.inited = false;
    trail.dots.length = 0;
    rope.inited = false;
    rope.dots.length = 0;
    pending = false;
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    canvas = null;
    ctx = null;
  }

  function apply() {
    cfg = readConfig();
    if (cfg) {
      opacity = Math.min(1, Math.max(0.1, Number(cfg.opacity) || 1));
      emojiList = splitList(cfg.emoji, DEFAULT_EMOJI);
      wordList = splitList(cfg.words, DEFAULT_WORDS);
      wordIndex = 0;
    }
    if (!shouldRun()) {
      stop();
      return;
    }
    if (running && !canvas.parentNode) {
      // 换页把画布连带删掉了：重建后从零开始
      running = false;
      start();
      return;
    }
    if (running) return; // 已经在跑：上面的配置已刷新，不用重建
    // 只需「武装」：画布与精灵留到第一次指针事件再建（见 armed 的说明）
    armed = true;
  }

  /* ── 绑定 ── */

  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerdown", onDown, { passive: true });

  window.addEventListener("resize", function () {
    if (!running) return;
    resize();
  });

  // 页面不可见时暂停（护栏 4）：只停 rAF，不清粒子
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      paused = true;
      stopRaf();
    } else {
      paused = false;
      if (running) {
        frame.last = 0;
        ensureRaf();
      }
    }
  });

  // 访客切换「鼠标特效」开关：setting-utils 会改 body 类并派发该事件
  window.addEventListener("cursorFxChange", apply);

  // 访客改色相：之后生成的粒子用新色（既有粒子保留原色，不做突变换色）
  window.addEventListener("hueChange", function () {
    syncHue();
    if (running) buildSprites();
  });

  // 换页后 #theme-config 可能与上次不同（例如进了另一种页面模板）
  function reapply() {
    if (!running) {
      apply();
      return;
    }
    var el = document.getElementById("theme-config");
    var next = null;
    try {
      next =
        el && el.textContent
          ? JSON.parse(el.textContent).enhance?.cursorFx
          : null;
    } catch (e) {
      next = null;
    }
    var nextKey = next
      ? [next.move, next.click, next.opacity, next.mobile].join("|")
      : "";
    var nowKey = cfg
      ? [cfg.move, cfg.click, cfg.opacity, cfg.mobile].join("|")
      : "";
    if (nextKey !== nowKey) {
      stop();
      apply();
      return;
    }
    if (!canvas || !canvas.parentNode) {
      running = false;
      apply();
    }
  }

  apply();
  document.addEventListener("astro:page-load", reapply);
  document.addEventListener("swup:contentReplaced", reapply);
})();
