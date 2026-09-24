// @ts-nocheck —— legacy 手写脚本迁入源码目录（保持 ES5 原样，不做类型改造）
// 打字机效果
(function () {
  /**
   * 后台「副标题动效 → 打字机回退效果」开关（读 Layout 注入的 #theme-config）。
   * 开启：打完逐字回退再重打，一直循环；关闭：单行副标题打完即停。
   * 读不到配置时按开启处理，与设置项的默认值一致。
   */
  function backspaceEnabled() {
    var el = document.getElementById("theme-config");
    if (!el || !el.textContent) return true;
    try {
      var cfg = JSON.parse(el.textContent);
      var v =
        cfg &&
        cfg.style &&
        cfg.style.bannerText &&
        cfg.style.bannerText.typewriterBackspace;
      return v !== false;
    } catch (e) {
      return true;
    }
  }

  var TypewriterEffect = function (el, lines, backspace, startTyped) {
    this.el = el;
    this.lines = lines;
    this.index = 0;
    this.charIdx = 0;
    this.deleting = false;
    this.timeoutId = null;
    this.typeSpeed = 80;
    this.deleteSpeed = 40;
    this.pauseAfterType = 2000;
    this.pauseAfterDelete = 500;
    // 是否循环：副标题写多行时本来就要逐条轮流展示，必须循环；
    // 单行则听后台开关（关闭 = 打完即停，即改造前的行为）
    this.loop = lines.length > 1 || backspace;

    var self = this;
    if (startTyped) {
      /* 首行已经在 HTML 里渲染好了（布局里的内联脚本填的）。
         直接当作「第一行已打完」：to type() 一次，它会因为 charIdx 已到末尾而进入
         停留 → 回退 → 重打的循环。不动已渲染的文字，首屏就不会先空白一两秒。 */
      self.charIdx = lines[0].length;
      self.timeoutId = setTimeout(function () {
        self.type();
      }, self.pauseAfterType);
      return;
    }
    self.setText("");
    self.timeoutId = setTimeout(function () {
      self.type();
    }, 500);
  };

  TypewriterEffect.prototype.setText = function (text) {
    this.el.textContent = text || "\u00A0";
  };

  TypewriterEffect.prototype.type = function () {
    var self = this;
    var text = self.lines[self.index];
    if (!self.deleting) {
      self.charIdx++;
      self.setText(text.substring(0, self.charIdx));
      if (self.charIdx >= text.length) {
        if (self.loop) {
          self.deleting = true;
          self.timeoutId = setTimeout(function () {
            self.type();
          }, self.pauseAfterType);
        }
        return;
      }
      self.timeoutId = setTimeout(function () {
        self.type();
      }, self.typeSpeed);
    } else {
      self.charIdx--;
      self.setText(text.substring(0, self.charIdx));
      if (self.charIdx <= 0) {
        self.deleting = false;
        self.index = (self.index + 1) % self.lines.length;
        self.timeoutId = setTimeout(function () {
          self.type();
        }, self.pauseAfterDelete);
        return;
      }
      self.timeoutId = setTimeout(function () {
        self.type();
      }, self.deleteSpeed);
    }
  };

  TypewriterEffect.prototype.destroy = function () {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  };

  // 光标闪烁（抽出供初始化与后台恢复共用）
  function createCursorBlink(cursor) {
    cursor.style.opacity = "1";
    var vis = true;
    cursor.__blinkInterval = setInterval(function () {
      if (cursor) cursor.style.opacity = vis ? "1" : "0";
      vis = !vis;
    }, 530);
  }

  function initTypewriter() {
    var el = document.getElementById("banner-subtitle");
    if (!el) return;

    var overlay = el.closest("#banner-overlay");
    if (overlay && overlay.classList.contains("banner-text-hidden")) return;

    if (el.__twInstance) {
      el.__twInstance.destroy();
      delete el.__twInstance;
    }

    var cursor = document.getElementById("banner-cursor");
    if (cursor) {
      if (cursor.__blinkInterval) {
        clearInterval(cursor.__blinkInterval);
        delete cursor.__blinkInterval;
      }
      createCursorBlink(cursor);
    }

    var dc = document.getElementById("banner-subtitles-data");
    if (!dc) return;
    var raw = dc.textContent.trim();
    if (!raw) return;
    var lines = raw
      .split("\n")
      .map(function (l) {
        return l.trim();
      })
      .filter(Boolean);
    if (lines.length === 0) return;

    /* 内联脚本可能已经把第一行填好了（见 MainGridLayout 里的首屏填充）：
       那种情况保留现有文字、从「已打完」状态起步；否则照旧清空重打。 */
    var painted = (el.textContent || "").replace(/\u00A0/g, "").trim();
    var startTyped = painted !== "" && painted === lines[0];
    if (!startTyped) el.textContent = "";

    el.__twInstance = new TypewriterEffect(
      el,
      lines,
      backspaceEnabled(),
      startTyped,
    );
  }

  function runInitTW() {
    initTypewriter();
    setTimeout(initTypewriter, 220);
  }

  // document 级监听器只绑一次：本脚本会被 SwupScriptsPlugin 在每次换页时克隆
  // 重执行（banner 元素在 Swup 容器外跨页持久，打字机/光标状态存于元素
  // __twInstance/__blinkInterval 字段，监听器操作的是同一持久元素）。
  // 不守卫则监听器逐次累积；换页后的重初始化由下方 runInitTW() 承担。
  // 原 swup:contentReplaced 监听删除：Swup v3 事件名，v4 分发 swup:{hook}，从未触发。
  if (!window.__bannerTwBound) {
    window.__bannerTwBound = true;

    // I24：后台标签页暂停（打字链 + 光标闪烁；状态保留在实例字段，回前台继续。
    // 对照 wave.js visibilitychange 守卫，动画本体不变）
    document.addEventListener("visibilitychange", function () {
      var subtitle = document.getElementById("banner-subtitle");
      var cursor = document.getElementById("banner-cursor");
      if (document.hidden) {
        if (
          subtitle &&
          subtitle.__twInstance &&
          subtitle.__twInstance.timeoutId
        ) {
          clearTimeout(subtitle.__twInstance.timeoutId);
          subtitle.__twInstance.timeoutId = null;
        }
        if (cursor && cursor.__blinkInterval) {
          clearInterval(cursor.__blinkInterval);
          cursor.__blinkInterval = null;
        }
      } else {
        if (
          subtitle &&
          subtitle.__twInstance &&
          !subtitle.__twInstance.timeoutId
        ) {
          subtitle.__twInstance.type();
        }
        if (cursor && !cursor.__blinkInterval) {
          createCursorBlink(cursor);
        }
      }
    });

    document.addEventListener("banner:visible", runInitTW);
  }

  runInitTW();
})();
