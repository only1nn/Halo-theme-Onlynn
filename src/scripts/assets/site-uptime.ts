/**
 * 页脚「本站已运行 x 天 x 小时 x 分钟 x 秒」（经典脚本，构建期编译为 public/assets/site-uptime.js）。
 *
 * 服务端只把上线时间写进 data-start，格式化与走动都在这里：
 *  · **每秒按「当前时间 − 上线时间」重算，不做累加** —— 标签页被浏览器冻结、
 *    设备休眠后回来时，累加会少算一大截，按时间戳重算永远是对的；
 *  · 页面不可见时停掉定时器（省电，也避免后台标签页空转）；
 *  · 单位文案由模板按站点语言渲染进 data-format，脚本不硬编码中文；
 *  · 叶节点用 data-uptime-value 定位，每 tick 重新查询 —— 换页后页脚会被替换，
 *    重新查询即可，不需要重新绑定。
 */
(function () {
  if (window.__onlynnUptimeBound) return;
  window.__onlynnUptimeBound = true;

  var INTERVAL = 1000;
  var timer = 0;

  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function render(el, host) {
    var raw = host.getAttribute("data-start");
    if (!raw) return;
    var start = new Date(raw);
    if (isNaN(start.getTime())) return;

    var total = Math.floor((Date.now() - start.getTime()) / 1000);
    if (total < 0) total = 0;

    var d = Math.floor(total / 86400);
    var h = Math.floor((total % 86400) / 3600);
    var m = Math.floor((total % 3600) / 60);
    var s = total % 60;

    // data-format 形如 "{0}天{1}小时{2}分钟{3}秒"，天不补零、时分秒补零
    var fmt = host.getAttribute("data-format") || "{0}天{1}小时{2}分钟{3}秒";
    el.textContent = fmt
      .replace("{0}", String(d))
      .replace("{1}", pad2(h))
      .replace("{2}", pad2(m))
      .replace("{3}", pad2(s));
  }

  function tick() {
    var el = document.querySelector("[data-uptime-value]");
    if (!el) return;
    var host = el.closest("[data-start]");
    if (host) render(el, host);
  }

  function start() {
    if (timer) return;
    tick();
    timer = window.setInterval(tick, INTERVAL);
  }

  function stop() {
    if (!timer) return;
    window.clearInterval(timer);
    timer = 0;
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop();
    else start();
  });

  // 换页后页脚被替换，先补一次（定时器已在跑就不重复起）
  document.addEventListener("astro:page-load", tick);
  document.addEventListener("swup:contentReplaced", tick);

  if (document.hidden) {
    // 首帧就不可见：只渲染一次静态值，等 visible 再开始走
    tick();
  } else {
    start();
  }
})();
