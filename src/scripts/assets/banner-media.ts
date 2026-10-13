// @ts-nocheck —— legacy 手写脚本迁入源码目录（保持 ES5 原样，不做类型改造）
// Banner 视频：导航栏里的播放/暂停按钮 + 屏幕外暂停（wave 同构）。
// 视频始终 muted（浏览器自动播放限制），不显示浏览器原生控件，仅自定义按钮控制。
//
// v1.3.1 起按钮从横幅内挪到**导航栏**（语言切换之后，与参考主题一致），
// 于是只有一个按钮、却可能有两个视频元素（移动端独立来源开启时
// #banner-video / #banner-video-mobile 各一，其中一个的容器是 display:none）：
// 按钮始终作用于「当前可见的那个视频」（offsetParent 为 null 即隐藏端），
// 图标/文案跟随该视频的真实状态；两个视频各自维护自己的屏幕外暂停与
// 用户手动暂停（dataset.onlynnUserPaused，供 banner-src-switch.js 读取）。
//
// 另加一条兜底看门狗：真机上出现过「视频播几秒画面停住、切标签页才恢复」——
// 根因可能是媒体层被强制进滤镜图层（已由 components.css 的 data-hero-blur
// 修掉），也可能是浏览器出于省电/遮挡自行暂停了自动播放。看门狗每 2s 复查
// 一次「页面可见 + 视频真在视口内 + 用户没手动暂停 + 却真的 paused」，
// 命中就补一次 play()，不必再靠切标签页唤醒。
(function () {
  // 跨页面持久 + Swup 克隆重执行：全局守卫防重复绑定（同 wave.js）
  if (window.__onlynnBannerMediaBound) return;
  window.__onlynnBannerMediaBound = true;

  var t =
    window.__onlynnI18n ||
    function (_key, fb) {
      return fb;
    };

  var btn = document.getElementById("banner-play-btn");

  function videos() {
    var list = [];
    var d = document.getElementById("banner-video");
    var m = document.getElementById("banner-video-mobile");
    if (d) list.push(d);
    if (m) list.push(m);
    return list;
  }

  /** 当前可见（容器未 display:none）的视频；都不可见时取第一个兜底 */
  function activeVideo() {
    var list = videos();
    for (var i = 0; i < list.length; i++) {
      if (list[i].offsetParent !== null) return list[i];
    }
    return list[0] || null;
  }

  /** 播放/暂停状态 → 按钮图标与文案（图标类名单一来源保持在本文件） */
  function syncIcon() {
    if (!btn) return;
    var v = activeVideo();
    var playing = !!v && !v.paused;
    var icon = btn.querySelector("span");
    if (icon) {
      icon.className = playing
        ? "icon-[material-symbols--pause-rounded] text-[1.25rem]"
        : "icon-[material-symbols--play-arrow-rounded] text-[1.25rem]";
    }
    var label = playing
      ? t("banner.pause", "暂停播放")
      : t("banner.play", "继续播放");
    btn.setAttribute("aria-label", label);
    btn.setAttribute("title", label);
  }

  function playVideo(video) {
    if (!video) return;
    var p = video.play();
    // 只在 play() 成功时切到播放图标、失败时回暂停图标，
    // 避免先同步置位再异步 catch 造成图标闪动
    if (p && p.then) {
      p.then(syncIcon).catch(syncIcon);
    } else {
      syncIcon();
    }
  }

  function attach(video) {
    if (!video || video.__onlynnMediaAttached) return;
    video.__onlynnMediaAttached = true;

    // 状态变化都重算图标：断点切换（banner-src-switch 驱动另一个视频的
    // play/pause）后图标也会自动对上当前生效的那个
    video.addEventListener("play", syncIcon);
    video.addEventListener("pause", syncIcon);

    // 自动播放兜底（muted+playsinline 下 autoplay 应生效，双保险；
    // 独立来源开启时视频无 autoplay 属性、由切换引擎驱动 load/play，
    // loadeddata 触发后此处仍会兜底续播）
    video.addEventListener("loadeddata", function () {
      if (video.paused && !video.dataset.onlynnUserPaused) playVideo(video);
    });

    // 视频加载/解码失败：隐藏视频元素本身（而非整个容器），避免黑屏占位。
    // 只隐藏 video 是可自愈的——容器背景/标题遮罩仍在，跨断点切换另一端
    // 不受影响；inline display:none 会粘在容器上（优先级高于媒体查询的
    // display:block），永久空白直到刷新，故不能作用于容器
    video.addEventListener("error", function () {
      video.style.display = "none";
    });

    // 屏幕外/切页暂停，回到屏幕恢复（保持用户手动暂停状态）。
    // restore 额外校验 offsetParent：隐藏容器（display:none）在页面重新
    // 可见时也会收到 visibilitychange，不加校验会在隐藏状态下 play()，
    // 触发 preload=none 的视频开始拉流
    function suspend() {
      if (!video.paused) video.pause();
    }
    function restore() {
      if (video.offsetParent === null) return;
      if (!video.dataset.onlynnUserPaused && video.paused) playVideo(video);
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) suspend();
      else restore();
    });

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          if (entries[0].isIntersecting) restore();
          else suspend();
        },
        { rootMargin: "100px" },
      );
      observer.observe(video);
    }

    // 供 banner-src-switch.js 在直接驱动播放/暂停后同步按钮图标
    video.__onlynnSyncIcon = syncIcon;
  }

  if (btn && !btn.dataset.onlynnBound) {
    btn.dataset.onlynnBound = "1";
    btn.addEventListener("click", function () {
      var video = activeVideo();
      if (!video) return;
      if (video.paused) {
        delete video.dataset.onlynnUserPaused;
        playVideo(video);
      } else {
        video.dataset.onlynnUserPaused = "1";
        video.pause();
      }
      syncIcon();
    });
  }

  videos().forEach(attach);
  syncIcon();

  /* 兜底看门狗：见文件头说明。退出条件只有「用户意图」与「不可见」，
     不会跟手动暂停或屏幕外暂停打架 */
  window.setInterval(function () {
    if (document.hidden) return;
    var viewportH = window.innerHeight || 0;
    var list = videos();
    for (var i = 0; i < list.length; i++) {
      var v = list[i];
      if (v.dataset.onlynnUserPaused || !v.paused) continue;
      if (v.offsetParent === null) continue;
      var r = v.getBoundingClientRect();
      var inView =
        r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < viewportH;
      if (inView) playVideo(v);
    }
  }, 2000);
})();
