/**
 * 代码块外框（经典脚本，构建期由 scripts/build-assets.mjs 编译为 public/assets/code-block.js）。
 *
 * 页面上有两种形态，都要能套上同一套外框：
 *
 *   1. 装了 Shiki 插件：<shiki-code><pre><code>…</code></pre></shiki-code>
 *      插件在 Shadow DOM 里自己渲染（自带底色、语言徽章、圆角、阴影），
 *      并把这份 light DOM 的 <pre> 用 display:none 藏起来当数据源。
 *      ⚠ 因此必须包裹 <shiki-code> 本身，绝不能碰它内部的 <pre>：
 *        插件靠那份 DOM 取原文，动它会破坏高亮渲染。
 *
 *   2. 没装插件：裸 <pre><code>，此时没有高亮，外框照样成立。
 *
 * 外框结构：
 *
 *   .code-frame
 *     ├─ .code-header            标题栏（三个圆点）
 *     └─ .code-main              定位上下文
 *          ├─ .code-body         原始内容
 *          └─ .code-slot         右上角控件槽（常驻不透明，盖住插件自带的徽章与复制按钮）
 *               ├─ .code-language  语言徽章
 *               └─ .code-copy      复制按钮
 *
 * 行号由 Shiki 插件在 Shadow DOM 内自绘（CSS 计数器），主题不再自己旁挂一列。
 *
 * 文案取自 Layout 注入的 window.i18nResources（服务端按站点语言渲染），
 * 不在这里硬编码中文。
 */
(function () {
  // 幂等：Swup 换页后脚本会重跑（scripts 插件），已处理过的块直接跳过
  if (window.__onlynnCodeBlockBound) return;
  window.__onlynnCodeBlockBound = true;

  // 折叠高度按「预览行数 × 行高 + 正文上下 padding」估算（行高 1.5rem，padding 各 1rem）
  var LINE_HEIGHT_REM = 1.5;
  var CODE_PADDING_REM = 2;

  function text(key, fallback) {
    var res = window.i18nResources || {};
    return res[key] || fallback;
  }

  function readSettings() {
    var el = document.getElementById("theme-config");
    if (!el || !el.textContent) return {};
    try {
      var parsed = JSON.parse(el.textContent);
      return (parsed && parsed.post && parsed.post.codeBlock) || {};
    } catch (e) {
      return {};
    }
  }

  function copyText(source) {
    // 优先用异步剪贴板 API；非安全上下文（http）下退回 execCommand
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(source).then(
        function () {
          return true;
        },
        function () {
          return legacyCopy(source);
        },
      );
    }
    return Promise.resolve(legacyCopy(source));
  }

  function legacyCopy(source) {
    try {
      var area = document.createElement("textarea");
      area.value = source;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      var ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch (e) {
      return false;
    }
  }

  function el(tag, className) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  /* 目标集合：Shiki 块整块取，裸 pre 直接取（跳过已被插件接管的那些） */
  function collectTargets() {
    var targets = [];
    var shikiBlocks = document.querySelectorAll(".custom-md shiki-code");
    for (var i = 0; i < shikiBlocks.length; i++) targets.push(shikiBlocks[i]);

    var pres = document.querySelectorAll(".custom-md pre");
    for (var j = 0; j < pres.length; j++) {
      if (!pres[j].closest("shiki-code")) targets.push(pres[j]);
    }
    return targets;
  }

  function enhance(target, settings) {
    if (target.dataset.codeEnhanced === "true") return;
    if (target.closest(".code-frame")) return;

    var pre = target.tagName === "PRE" ? target : target.querySelector("pre");
    if (!pre) return;
    var code = pre.querySelector("code");
    if (!code) return;

    target.dataset.codeEnhanced = "true";

    // 先记下原位置：下面会把 target 搬进 frame，那之后它的 parentNode
    // 就变成 frame 内部的节点了，再拿它做插入点等于把祖先插进自己的后代
    var originalParent = target.parentNode;
    var originalNext = target.nextSibling;

    var langMatch = /language-([a-z0-9+#-]+)/i.exec(code.className || "");
    var language = langMatch ? langMatch[1].toLowerCase() : "";
    var source = code.textContent || "";
    var lineCount = source.replace(/\n$/, "").split("\n").length;

    var frame = el("div", "code-frame");

    // 标题栏：三个圆点。纯装饰，不进无障碍树
    var header = el("div", "code-header");
    var dots = el("div", "code-dots");
    dots.setAttribute("aria-hidden", "true");
    for (var d = 0; d < 3; d++) dots.appendChild(el("span", "code-dot"));
    header.appendChild(dots);

    var main = el("div", "code-main");

    var collapsible =
      settings.collapsibleEnable !== false &&
      lineCount > (settings.collapsibleLineThreshold || 15);

    var body = el("div", "code-body");
    // 先把目标搬进新家，再整体插回原位，避免中间态造成闪烁
    body.appendChild(target);
    main.appendChild(body);

    // 右上角控件槽：这一小块区域必须**常驻不透明**。
    // 插件在 Shadow DOM 里既有自己的纯文字徽章、又有一个 .group:hover 才现形的
    // 32×32 复制按钮，两者都无法从外部删除或改样式。只靠「主题徽章淡出」会让
    // 它们在某些悬停路径下露出来（悬停标题栏时插件的 .group 并未被 hover），
    // 所以用一个底色与代码块一致的槽位把整块区域永久盖住，槽位内部再做
    // 徽章 ↔ 复制按钮的交换。
    var slot = el("div", "code-slot");
    slot.setAttribute("data-slot", "code-controls");

    if (settings.languageBadge !== false) {
      // 无语言标注时插件会自行推断成 plaintext，主题这边用同名把它的那枚盖住
      var badge = el("span", "code-language");
      badge.textContent = language || "plaintext";
      slot.appendChild(badge);
    }

    var copyBtn = el("button", "code-copy");
    copyBtn.type = "button";
    copyBtn.setAttribute("aria-label", text("post.codeCopy", "复制"));
    copyBtn.title = text("post.codeCopy", "复制");
    var icon = el("span", "code-icon icon-[material-symbols--content-copy-outline-rounded]");
    copyBtn.appendChild(icon);
    copyBtn.addEventListener("click", function () {
      copyText(source.replace(/\n$/, "")).then(function (ok) {
        copyBtn.classList.toggle("is-copied", ok);
        copyBtn.title = ok
          ? text("post.codeCopied", "已复制")
          : text("post.codeCopyFailed", "复制失败");
        icon.className = ok
          ? "code-icon icon-[material-symbols--check-rounded]"
          : "code-icon icon-[material-symbols--error-outline-rounded]";
        window.setTimeout(function () {
          copyBtn.classList.remove("is-copied");
          copyBtn.title = text("post.codeCopy", "复制");
          icon.className =
            "code-icon icon-[material-symbols--content-copy-outline-rounded]";
        }, 1600);
      });
    });
    slot.appendChild(copyBtn);
    main.appendChild(slot);

    frame.appendChild(header);
    frame.appendChild(main);

    if (collapsible) {
      var previewLines = settings.collapsiblePreviewLines || 8;
      frame.classList.add("is-collapsible");
      frame.style.setProperty(
        "--code-collapsed-height",
        (previewLines * LINE_HEIGHT_REM + CODE_PADDING_REM).toFixed(1) + "rem",
      );

      var expandBtn = el("button", "code-expand");
      expandBtn.type = "button";
      var syncExpandLabel = function (expanded) {
        expandBtn.textContent = expanded
          ? text("post.codeCollapse", "收起")
          : text("post.codeExpand", "展开");
      };
      syncExpandLabel(false);
      expandBtn.addEventListener("click", function () {
        syncExpandLabel(frame.classList.toggle("is-expanded"));
      });
      frame.appendChild(expandBtn);
    }

    if (originalParent) originalParent.insertBefore(frame, originalNext);

    // 触屏设备上复制按钮默认隐藏，点一下代码块才显形
    frame.addEventListener(
      "touchstart",
      function () {
        frame.classList.add("is-touched");
      },
      { passive: true, once: true },
    );
  }

  function enhanceAll() {
    var settings = readSettings();
    var targets = collectTargets();
    for (var i = 0; i < targets.length; i++) {
      enhance(targets[i], settings);
    }
  }

  enhanceAll();
  // Swup 换页后内容被替换，需要重新增强；首屏与换页都覆盖
  document.addEventListener("astro:page-load", enhanceAll);
  document.addEventListener("swup:contentReplaced", enhanceAll);
  // Shiki 插件是异步在 Shadow DOM 里渲染的，晚一点补一次，
  // 保证「插件先于脚本渲染完」与「脚本先跑」两种情况都能套上外框
  window.setTimeout(enhanceAll, 600);
})();
