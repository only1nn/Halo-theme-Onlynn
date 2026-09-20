/**
 * 沉浸阅读（经典脚本，构建期编译为 public/assets/reading-focus.js）。
 *
 * 只做一件事：维护 body.reading-focus 这一个类。隐藏导航栏 / 两侧栏 / 目录 /
 * 浮动按钮、把正文收成单栏居中，全部交给 components.css，脚本不碰布局。
 *
 * 入口是文章页操作栏的按钮（事件委托，换页后无需重新绑定），出口有两个：
 * 页面右上角的浮动按钮与 Esc —— 沉浸态下导航栏是隐藏的，没有一个常驻出口
 * 会让人出不去。
 *
 * 状态存 localStorage，跨页保持；访客可控，与主题其余观感开关同一套约定。
 */
(function () {
  if (window.__onlynnReadingFocusBound) return;
  window.__onlynnReadingFocusBound = true;

  var STORAGE_KEY = "readingFocus";
  var CLASS = "reading-focus";

  function isOn() {
    return document.body.classList.contains(CLASS);
  }

  function apply(on) {
    document.body.classList.toggle(CLASS, on);
    var exit = document.getElementById("reading-focus-exit");
    if (exit) exit.setAttribute("aria-hidden", on ? "false" : "true");
  }

  function set(on) {
    try {
      localStorage.setItem(STORAGE_KEY, String(on));
    } catch (e) {
      /* 隐私模式下写不进去也不影响本次生效 */
    }
    apply(on);
  }

  function restore() {
    var stored = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      stored = null;
    }
    apply(stored === "true");
  }

  function toggle() {
    set(!isOn());
  }

  document.addEventListener("click", function (e) {
    var target = e.target;
    if (!target || !target.closest) return;
    if (target.closest("#post-reading-focus-btn")) {
      e.preventDefault();
      toggle();
      return;
    }
    if (target.closest("#reading-focus-exit")) {
      e.preventDefault();
      set(false);
    }
  });

  // 主题里还有几处 Esc 处理（导航抽屉、目录弹窗、分享/打赏弹窗、浮动面板）。
  // 只要其中任何一个开着，Esc 就先归它们，避免「关弹窗的同时把沉浸态也退了」
  function overlayOpen() {
    if (document.body.classList.contains("nav-menu-open")) return true;
    var toc = document.getElementById("toc-popup");
    if (toc && toc.classList.contains("toc-popup-open")) return true;
    if (document.querySelector(".float-panel:not(.float-panel-closed)")) return true;
    if (document.querySelector("[data-overlay-modal]")) return true;
    return false;
  }

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape" || !isOn()) return;
    if (overlayOpen()) return;
    set(false);
  });

  // 换页后 body 不会被替换，但按钮是新的，这里重放一次状态保证 aria 与实际一致
  document.addEventListener("astro:page-load", restore);
  document.addEventListener("swup:contentReplaced", restore);

  // 首帧脚本（Layout.astro 内联）已提前加过类时，这里只同步 aria
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", restore);
  } else {
    restore();
  }
})();
