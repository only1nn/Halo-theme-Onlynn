/**
 * 评论弹幕（经典脚本，构建期编译为 public/assets/danmaku.js）。
 *
 * 把当前页面已有的评论渲染成从右向左滚动的弹幕，幕布位于评论区上方。
 * 数据直接打 Halo 的评论公开 API，不从评论区 DOM 抓——评论由插件渲染，
 * DOM 结构随插件版本变，而且插件自己也要发一次请求。
 *
 * 性能约束（与樱花、波浪同一口径）：
 *  - 不在首屏抢带宽与主线程：等 first paint + requestIdleCallback 之后才取评论
 *  - 用 CSS 动画驱动，不用 rAF 逐帧改样式：整条弹幕在合成层上跑
 *  - 页面不可见 / 悬停幕布 / 访客关掉 / 系统偏好减少动效：一律停
 *
 * 配置读自 Layout 注入的 #theme-config → style.danmaku；
 * 访客开关读自 #config-carrier → data-danmaku-default / data-visitor-danmaku，
 * 生效状态走 body.danmaku-disabled 类（与樱花同款）。
 */
(function () {
  if (window.__onlynnDanmakuBound) return;
  window.__onlynnDanmakuBound = true;

  /* 发射节拍：每个节拍最多发一条。轨道空着时也不一次灌满，
     否则首屏会「啪」地出现一整面弹幕墙，观感很硬 */
  var STAGGER_MS = 170;
  /* 文案上限：弹幕是引子不是正文，过长的评论截断，想看全文去评论区 */
  var MAX_TEXT = 90;
  /* 轨道上下留白比例：1.15 表示行距至少比弹幕本身高 15%，避免贴在一起 */
  var ROW_HEADROOM = 1.15;
  /* 移动端轨道数折半的断点，与 CSS 的字号收缩断点保持一致 */
  var NARROW_PX = 640;

  var stage = null;
  var slot = null;
  var timer = 0;
  var running = false;
  var fetchToken = 0;

  /* ── 配置 ── */

  function readThemeConfig() {
    var el = document.getElementById("theme-config");
    if (!el || !el.textContent) return null;
    try {
      var parsed = JSON.parse(el.textContent);
      return (parsed && parsed.style && parsed.style.danmaku) || null;
    } catch (e) {
      return null;
    }
  }

  function readCarrier() {
    var el = document.getElementById("config-carrier");
    return el ? el.dataset : {};
  }

  /* 访客是否已手动关掉：body 类由首帧脚本与面板共同维护 */
  function visitorDisabled() {
    return document.body.classList.contains("danmaku-disabled");
  }

  /** 后台默认值与访客覆盖合成后的最终开关。门在配置、类在 body，
   *  两者都可能变化，故每次启动都重新判定 */
  function resolveEnabled(cfg) {
    if (!cfg || cfg.enable !== true) return false;
    var d = readCarrier();
    // 访客不可调时忽略本地覆盖（并清掉，避免关掉面板开关后旧值残留）
    var visitorCanToggle =
      d.visitorEnable !== "false" && d.visitorDanmaku !== "false";
    if (!visitorCanToggle) {
      try {
        localStorage.removeItem("danmaku");
      } catch (e) {
        /* 隐私模式下写不了 localStorage，忽略 */
      }
      return true;
    }
    return !visitorDisabled();
  }

  function num(value, fallback, min, max) {
    var n = Number(value);
    if (!isFinite(n) || n <= 0) n = fallback;
    return Math.min(max, Math.max(min, n));
  }

  /* ── 取评论 ── */

  function parseComments(payload) {
    var items = (payload && payload.items) || [];
    var out = [];
    for (var i = 0; i < items.length; i++) {
      var spec = items[i].spec || {};
      var text = toPlainText(spec.content || spec.raw || "");
      if (!text) continue;
      var owner = items[i].owner || {};
      out.push({
        name: (items[i].metadata && items[i].metadata.name) || "",
        text: text,
        author: owner.displayName || "",
        avatar: owner.avatar || "",
        // 站长本人的评论在主题里高亮：owner.kind=User 即登录用户
        isOwner: owner.kind === "User",
      });
    }
    return out;
  }

  /** 评论正文是渲染后的 HTML，弹幕只要纯文本：
   *  交给浏览器解析一次再读 textContent，实体与标签都能正确还原 */
  function toPlainText(html) {
    var box = document.createElement("textarea");
    box.innerHTML = String(html).replace(/<[^>]*>/g, " ");
    var text = box.value.replace(/\s+/g, " ").trim();
    return text.length > MAX_TEXT ? text.slice(0, MAX_TEXT) + "…" : text;
  }

  function fetchComments(cfg) {
    var group = stage.getAttribute("data-group") || "content.halo.run";
    var kind = stage.getAttribute("data-kind") || "Post";
    var name = stage.getAttribute("data-name") || "";
    if (!name) return Promise.resolve([]);

    var url =
      "/apis/api.halo.run/v1alpha1/comments?group=" +
      encodeURIComponent(group) +
      "&kind=" +
      encodeURIComponent(kind) +
      "&name=" +
      encodeURIComponent(name) +
      "&page=1&size=" +
      num(cfg.maxItems, 30, 5, 100) +
      "&sort=" +
      encodeURIComponent("metadata.creationTimestamp,desc");

    var token = ++fetchToken;
    return fetch(url, { headers: { Accept: "application/json" } })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (payload) {
        // 期间换页/重置过就丢弃这次结果
        if (token !== fetchToken) return null;
        return parseComments(payload);
      })
      .catch(function () {
        /* 评论插件未装 / 接口不可用 / 网络异常：静默失败，
           幕布收起，绝不因为取不到评论而报错或留个空框 */
        return null;
      });
  }

  /* ── 渲染 ── */

  function avatarHue(name) {
    var hash = 0;
    for (var i = 0; i < name.length; i++) {
      hash = (hash * 31 + name.charCodeAt(i)) % 360;
    }
    return hash;
  }

  function buildItem(item, cfg) {
    var el = document.createElement("div");
    el.className = "danmaku-item" + (item.isOwner ? " danmaku-item-owner" : "");
    el.style.setProperty("--danmaku-opacity", String(cfg.opacity));

    if (cfg.showAvatar) {
      if (item.avatar) {
        var img = document.createElement("img");
        img.className = "danmaku-avatar";
        img.src = item.avatar;
        img.alt = "";
        // 头像加载失败（外链挂了）就退回首字圆点
        img.addEventListener("error", function () {
          img.replaceWith(fallbackAvatar(item.author));
        });
        el.appendChild(img);
      } else {
        el.appendChild(fallbackAvatar(item.author));
      }
    }

    var text = document.createElement("span");
    text.className = "danmaku-item-text";
    // 用文本节点而非 innerHTML：评论内容原样呈现，不给注入留口子
    text.appendChild(document.createTextNode(item.text));
    el.appendChild(text);
    return el;
  }

  function fallbackAvatar(author) {
    var dot = document.createElement("span");
    var name = author || "?";
    dot.className = "danmaku-avatar danmaku-avatar-fallback";
    dot.style.setProperty("--dm-avatar-hue", String(avatarHue(name)));
    dot.textContent = name.charAt(0);
    return dot;
  }

  function bindClick(el, item, cfg) {
    if (cfg.clickAction !== "scroll") return;
    el.addEventListener("click", function () {
      // 评论锚点由评论插件决定（其内容还在 shadow root 里），
      // 逐条定位不可靠，因此只做「尽力而为」：找得到就跳，找不到就滚到评论区
      var anchor = item.name
        ? document.querySelector('[id="' + item.name + '"]')
        : null;
      if (anchor) {
        anchor.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      var section = document.getElementById("comment");
      if (section)
        section.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  /* ── 轨道与动画 ── */

  var queue = [];
  var items = [];
  /* 每条轨道的「下次可用时刻」，单位毫秒，与 performance.now() 同一时基。
     不要和 pxPerSec（每秒像素，用于 CSS 时长）混用单位 */
  var trackFreeAt = [];
  var cfg = null;
  var rows = 1;
  var pxPerSec = 1;
  /* 当前这轮的几何特征（宽 x 高 x 宽窄档），resize 时用来判断是否真的需要重建 */
  var geometrySignature = "";

  function pickTrack(now) {
    var best = -1;
    for (var i = 0; i < trackFreeAt.length; i++) {
      if (
        trackFreeAt[i] <= now &&
        (best === -1 || trackFreeAt[i] < trackFreeAt[best])
      ) {
        best = i;
      }
    }
    return best;
  }

  function earliestTrack() {
    var best = 0;
    for (var i = 1; i < trackFreeAt.length; i++) {
      if (trackFreeAt[i] < trackFreeAt[best]) best = i;
    }
    return best;
  }

  /** 发射一条：先插入再量宽，然后按「所有弹幕同速」算出时长。
   *  速度恒定（px/s）而不是固定时长——否则长评论会比短评论跑得快得多。
   *  插入与量宽之间没有绘制，所以不会闪一下再归位 */
  function emit(item, row, now) {
    var el = buildItem(item, cfg);
    var rowH = stage.clientHeight / rows;
    stage.appendChild(el);

    var w = el.offsetWidth;
    var h = el.offsetHeight;
    // 行内垂直居中；行距不足时 buildStage 已经下调过轨道数，这里只做兜底
    var top = row * rowH + Math.max(0, (rowH - h) / 2);
    el.style.setProperty("--dm-top", top + "px");
    el.style.setProperty("--dm-from", stage.clientWidth + "px");
    el.style.setProperty("--dm-to", -w + "px");
    el.style.setProperty(
      "--dm-duration",
      (stage.clientWidth + w) / pxPerSec + "s",
    );

    el.addEventListener("animationend", function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
    bindClick(el, item, cfg);

    // 下一条要等同轨前一条的尾巴完全进入幕布才能发：
    // 前一条右缘走到幕布右缘耗时 = 宽 / 速度，加设定的最小间距。
    // now 是毫秒，所以要乘 1000 把秒换算过来
    trackFreeAt[row] = now + ((w + cfg.gap) / pxPerSec) * 1000;
  }

  function pump() {
    timer = 0;
    if (!running) return;

    if (queue.length === 0) {
      // 队列空且幕布上也空了：开了循环就重来一轮，否则停下
      if (stage.querySelector(".danmaku-item")) {
        timer = window.setTimeout(pump, STAGGER_MS);
        return;
      }
      if (!cfg.loop || items.length === 0) return;
      queue = items.slice();
    }

    var now = performance.now();
    var row = pickTrack(now);
    if (row >= 0) {
      emit(queue.shift(), row, now);
      timer = window.setTimeout(pump, STAGGER_MS);
      return;
    }
    // 所有轨道都占着：等到最早空出来的那一刻再看
    var wait = trackFreeAt[earliestTrack()] - now;
    timer = window.setTimeout(pump, Math.max(60, Math.min(wait, 2000)));
  }

  /* ── 生命周期 ── */

  function stop() {
    running = false;
    if (timer) {
      window.clearTimeout(timer);
      timer = 0;
    }
    // 中断在途请求，避免换页后旧结果落到新幕布上
    fetchToken++;
  }

  function clearItems() {
    var live = stage.querySelectorAll(".danmaku-item");
    for (var i = 0; i < live.length; i++) live[i].remove();
  }

  function buildStage() {
    var narrow = window.innerWidth <= NARROW_PX;
    var want = Math.round(cfg.rows);
    if (narrow) want = Math.max(1, Math.ceil(want / 2));

    // 以第一条弹幕的实际高度反推幕布能容下几行，防止轨道贴在一起
    var probe = buildItem(items[0], cfg);
    stage.appendChild(probe);
    var itemH = probe.offsetHeight || 30;
    probe.parentNode.removeChild(probe);

    var fit = Math.max(
      1,
      Math.floor(stage.clientHeight / (itemH * ROW_HEADROOM)),
    );
    rows = Math.min(want, fit);

    pxPerSec = stage.clientWidth / cfg.speed;
    trackFreeAt = [];
    for (var i = 0; i < rows; i++) trackFreeAt.push(0);
    queue = items.slice();
    // 记下这一轮的几何特征，resize 时据此判断要不要重建
    geometrySignature =
      stage.clientWidth + "x" + stage.clientHeight + (narrow ? "n" : "w");
  }

  function start() {
    if (!stage || !items.length) return;
    // 重建前先清干净：换页 / 改配置 / 尺寸变化都可能留下上一轮的弹幕，
    // 它们的轨道与速度基准都已失效，留着只会和新的一起叠在一起
    clearItems();
    buildStage();
    running = true;
    pump();
  }

  /** 两个都切：幕布身上的 hidden 是权威来源（CSS 由它推出槽位的显隐），
   *  槽位也切一份是为了在不支持 :has() 的浏览器上同样能收起 */
  function setVisible(visible) {
    if (stage) stage.hidden = !visible;
    if (slot) slot.hidden = !visible;
  }

  function collapse() {
    // 取不到评论：收起整块，不留空条
    setVisible(false);
  }

  /** 每次页面（重新）加载都会走一遍：判定开关 → 取评论 → 起动画 */
  function apply() {
    stop();
    stage = document.getElementById("danmaku-stage");
    if (!stage) return;
    slot = document.getElementById("danmaku-slot");
    setVisible(true);

    cfg = readThemeConfig();
    if (!resolveEnabled(cfg)) {
      setVisible(false);
      return;
    }

    if (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setVisible(false);
      return;
    }

    cfg = normalize(cfg);
    stage.setAttribute(
      "data-clickable",
      cfg.clickAction === "scroll" ? "true" : "false",
    );
    stage.style.setProperty("--danmaku-height", cfg.height + "px");

    var target = stage;
    fetchComments(cfg).then(function (list) {
      // 期间换页 / 重置 / 幕布被替换：丢弃
      if (stage !== target) return;
      if (!list || !list.length) {
        collapse();
        return;
      }
      items = list;
      start();
    });
  }

  function normalize(raw) {
    return {
      enable: raw.enable === true,
      speed: num(raw.speed, 14, 4, 40),
      rows: num(raw.rows, 5, 1, 12),
      gap: num(raw.gap, 24, 0, 120),
      opacity: Math.min(1, Math.max(0.3, Number(raw.opacity) || 0.9)),
      showAvatar: raw.showAvatar !== false,
      maxItems: num(raw.maxItems, 30, 5, 100),
      height: num(raw.height, 180, 80, 360),
      loop: raw.loop !== false,
      clickAction: raw.clickAction === "none" ? "none" : "scroll",
    };
  }

  /* 首个空闲帧之后再取评论：弹幕是装饰，评论列表才是内容，
     不能和首屏抢带宽与主线程 */
  function schedule() {
    if (window.requestIdleCallback) {
      window.requestIdleCallback(
        function () {
          apply();
        },
        { timeout: 2000 },
      );
    } else {
      window.setTimeout(apply, 400);
    }
  }

  // 页面不可见时停掉动画：CSS 的 animation-play-state 已接管，
  // 这里只是把「暂停」这件事写在属性上，顺带停掉发射心跳
  document.addEventListener("visibilitychange", function () {
    if (!stage) return;
    if (document.hidden) {
      stage.setAttribute("data-paused", "true");
      if (timer) {
        window.clearTimeout(timer);
        timer = 0;
      }
    } else {
      stage.removeAttribute("data-paused");
      if (running && !timer) timer = window.setTimeout(pump, STAGGER_MS);
    }
  });

  // 访客在显示设置面板里切换：setting-utils 的 applyDanmaku 会改写 body 类并派发该事件
  window.addEventListener("danmakuChange", function () {
    apply();
  });

  // 窗口尺寸变化会改变幕布宽度（进而改变速度基准）与可用轨道数，需要重建。
  // 但移动端地址栏收放也会触发 resize —— 那类抖动幕布几何没变，
  // 直接按几何特征跳过，避免弹幕被反复重置
  var resizeTimer = 0;
  window.addEventListener("resize", function () {
    if (!running) return;
    if (resizeTimer) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(function () {
      resizeTimer = 0;
      if (!running || !stage) return;
      var signature =
        stage.clientWidth +
        "x" +
        stage.clientHeight +
        (window.innerWidth <= NARROW_PX ? "n" : "w");
      if (signature === geometrySignature) return;
      apply();
    }, 250);
  });

  schedule();
  document.addEventListener("astro:page-load", schedule);
  document.addEventListener("swup:contentReplaced", schedule);
})();
