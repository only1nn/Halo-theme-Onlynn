/**
 * 文章字数与阅读时长（经典脚本，构建期编译为 public/assets/post-reading-stats.js）。
 *
 * 为什么放在客户端而不是模板里算：正文本就是渲染好的 DOM，直接读一次比在
 * Thymeleaf 里对 HTML 字符串做正则更准（不会把标签、代码块外壳的按钮文字算进去）。
 *
 * 计数口径：中日韩字符按「字」逐个计，其余按空白切词计——中文博客里两者常混排，
 * 只按其中一种算都会严重偏差。阅读速度取中文 400 字/分钟、西文 200 词/分钟，
 * 结果向上取整且至少 1 分钟。
 *
 * 只在文章页有 `#post-word-count` / `#post-reading-time` 时工作，其它页面直接返回。
 */
(function () {
  if (window.__onlynnReadingStatsBound) return;
  window.__onlynnReadingStatsBound = true;

  var CJK_PER_MINUTE = 400;
  var WORD_PER_MINUTE = 200;

  // 码点区间：CJK 统一表意文字及扩展、日文假名、韩文音节
  var CJK_RE =
    /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af]/g;

  function countOf(text) {
    var cjk = (text.match(CJK_RE) || []).length;
    // 去掉 CJK 字符后剩下的按空白切词
    var rest = text.replace(CJK_RE, " ");
    var words = rest.split(/\s+/).filter(function (w) {
      return w.length > 0;
    }).length;
    return { cjk: cjk, words: words, total: cjk + words };
  }

  function formatCount(n) {
    return n >= 10000 ? (n / 10000).toFixed(1) + "w" : String(n);
  }

  function apply() {
    var wordEl = document.getElementById("post-word-count");
    var timeEl = document.getElementById("post-reading-time");
    if (!wordEl && !timeEl) return;

    // 加密/解密分支会渲染多份 .markdown-content，取第一份可见的即可
    var content = null;
    var nodes = document.querySelectorAll(".markdown-content");
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].offsetParent !== null || nodes[i].getClientRects().length > 0) {
        content = nodes[i];
        break;
      }
    }
    if (!content && nodes.length > 0) content = nodes[0];
    if (!content) return;

    var stats = countOf(content.innerText || content.textContent || "");

    if (wordEl) {
      wordEl.textContent =
        formatCount(stats.total) + (wordEl.dataset.unit || "");
    }
    if (timeEl) {
      var minutes = Math.ceil(
        stats.cjk / CJK_PER_MINUTE + stats.words / WORD_PER_MINUTE,
      );
      if (minutes < 1) minutes = 1;
      timeEl.textContent = minutes + (timeEl.dataset.unit || "");
    }
  }

  // 正文里的图片会改变布局但不改变字数；等布局稳定再读一次 innerText 更准
  function schedule() {
    apply();
    if (document.readyState !== "complete") {
      window.addEventListener("load", apply, { once: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", schedule);
  } else {
    schedule();
  }
  document.addEventListener("astro:page-load", schedule);
  document.addEventListener("swup:contentReplaced", schedule);
})();
