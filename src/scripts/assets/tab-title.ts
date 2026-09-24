// @ts-nocheck —— 经典脚本按 ES5 手写、不做类型改造（与同目录 legacy 脚本同款）
/**
 * 离屏文案（经典脚本，构建期编译为 public/assets/tab-title.js）。
 *
 * 浏览器切到其它标签页 / 后台时，把标签页标题换成站长配的「离开」文案；
 * 回到本页时先显示「回来」文案，停留若干秒后自动恢复原标题。
 *
 * 与参考实现（Dream2.0 Plus）相比补了三处：
 *  1. 换页时提前刷新「原标题」—— 那个实现只在隐藏时重新抓取，Swup 换页后
 *     必须等一次隐藏才会更新；这里在换页且页面可见时主动同步
 *  2. 幂等守卫 —— 重复执行会把「回来」文案误记成原标题而永久锁死
 *  3. 定时器与状态在离开/隐藏时清理
 *
 * 配置读自 Layout 注入的 #theme-config → enhance.tabTitle（顶层分组，不在 style 下）。
 * 脚本本身由 TabTitle.astro 用 th:if 门控：两条文案都为空时连下载都不发生。
 *
 * 刻意不跳过移动端：移动浏览器同样有标签标题，少一个 UA 判断更简单，也无害。
 */
(function () {
  if (window.__onlynnTabTitleBound) return;
  window.__onlynnTabTitleBound = true;

  var cfg = null;
  var originTitle = "";
  var timer = 0;

  function readConfig() {
    var el = document.getElementById("theme-config");
    if (!el || !el.textContent) return null;
    try {
      var parsed = JSON.parse(el.textContent);
      // 顶层分组 enhance（不是 style 下的子分组）—— 写错路径会静默失效
      return (parsed && parsed.enhance && parsed.enhance.tabTitle) || null;
    } catch (e) {
      return null;
    }
  }

  function text(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  /** 我们写进去的两条文案不算「真实标题」：命中时沿用上一次记住的 */
  function currentOrigin() {
    var now = document.title;
    if (
      (cfg.hidden && now === cfg.hidden) ||
      (cfg.visible && now === cfg.visible)
    ) {
      return originTitle;
    }
    return now;
  }

  function clearTimer() {
    if (timer) {
      window.clearTimeout(timer);
      timer = 0;
    }
  }

  function onHidden() {
    originTitle = currentOrigin();
    if (cfg.hidden) document.title = cfg.hidden;
    clearTimer();
  }

  function onVisible() {
    clearTimer();
    if (!cfg.visible) {
      // 只配了「离开」文案：回来直接恢复原标题
      if (originTitle) document.title = originTitle;
      return;
    }
    document.title = cfg.visible;
    timer = window.setTimeout(function () {
      timer = 0;
      // 期间若已经换页（标题被改过），就别再覆盖回去
      if (document.title === cfg.visible) document.title = originTitle;
    }, cfg.hold * 1000);
  }

  /** 换页后同步原标题。
   *  不要加「页面可见才记」的条件：隐藏期间换页（后台标签页里点链接、或被别处打开）
   *  同样换了标题，漏记会让恢复时把上一页的标题写回去。currentOrigin() 已经能挡住
   *  「当前标题正是我们写的离开/回来文案」这一种情况，足够。 */
  function syncOrigin() {
    originTitle = currentOrigin();
  }

  function init() {
    cfg = readConfig();
    if (!cfg || cfg.enable === false) return;
    cfg.hidden = text(cfg.hidden);
    cfg.visible = text(cfg.visible);
    if (!cfg.hidden && !cfg.visible) return;
    cfg.hold = Number(cfg.hold) > 0 ? Number(cfg.hold) : 2;

    if (!document.hidden) originTitle = document.title;
    syncOrigin();

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) onHidden();
      else onVisible();
    });

    // 换页后刷新记下的原标题（Swup / Astro 两种页面加载时机都挂上）
    document.addEventListener("astro:page-load", syncOrigin);
    document.addEventListener("swup:contentReplaced", syncOrigin);

    // 离开页面时收尾：清掉可能还在跑的恢复定时器
    window.addEventListener("pagehide", clearTimer);
  }

  init();
})();
