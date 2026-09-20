<div align="center">

# Onlynn

> 一款卡片式的 Halo 2 博客主题
>
> 以 [Ethereal](https://github.com/AloneNanNan/halo-theme-ethereal) 为基座，
> 按 [Firefly](https://github.com/CuteLeaf/Firefly) 的美学补齐外观与交互定制能力
>
> ![Halo](https://img.shields.io/badge/Halo-%3E%3D2.25.0-blue)
> ![Node.js >= 22.12](https://img.shields.io/badge/node.js-%3E%3D22.12-brightgreen)
> ![pnpm >= 10](https://img.shields.io/badge/pnpm-%3E%3D10-blue)
> ![Astro](https://img.shields.io/badge/Astro-7-orange)
> ![License](https://img.shields.io/badge/license-MIT-green)
>
> [![Stars](https://img.shields.io/github/stars/only1nn/halo-theme-Onlynn?style=social)](https://github.com/only1nn/halo-theme-Onlynn/stargazers)
> [![Issues](https://img.shields.io/github/issues/only1nn/halo-theme-Onlynn)](https://github.com/only1nn/halo-theme-Onlynn/issues)

</div>

---

📖 README：
**[简体中文](README.md)** | **[English](README.en.md)**

🚀 快速指南：
[**⬇️ 下载最新版**](https://github.com/only1nn/halo-theme-Onlynn/releases) /
[**🐛 反馈问题**](https://github.com/only1nn/halo-theme-Onlynn/issues) /
[**💬 参与讨论**](https://github.com/only1nn/halo-theme-Onlynn/discussions)

✨ **开箱即用**：一个 zip 装进 Halo 即可，设置项全部可视化配置，无需改代码

🎨 **外观可调**：四种壁纸形态、亮暗模式、主题色相、樱花飘落、卡片描边……都能在后台开关

🧩 **插件友好**：对 Halo 生态插件采取「有则增强、无则降级」策略，缺插件不会白屏

📱 **移动端专项**：底部导航栏、抽屉式菜单、移动端目录弹窗

<table width="100%" align="center">
  <tr>
    <td align="center"><img src="./screenshot/home.png" alt="首页"><br>首页</td>
  </tr>
  <tr>
    <td align="center"><img src="./screenshot/post.png" alt="文章页"><br>文章页（字数 / 阅读时长 / 代码块）</td>
  </tr>
</table>

## 目录

- [功能特性](#功能特性)
- [环境要求](#环境要求)
- [安装](#安装)
- [主题设置](#主题设置)
- [插件兼容](#插件兼容)
- [从源码构建](#从源码构建)
- [目录结构](#目录结构)
- [写模板时要注意的坑](#写模板时要注意的坑)
- [致谢与许可](#致谢与许可)

---

## 功能特性

### 布局与外观

- **四种壁纸形态**：关闭 / 横幅 / 全屏 / 全屏透明，前台可切换、后台定默认
- **全屏布局二选一**：经典（壁纸随文档滚动）/ Hero（首屏固定在视口，内容滚动上推，
  标题随滚动淡出、壁纸逐步虚化）
- **侧栏位置**：部件栏可在左 / 右之间切换，两栏布局下与内容对调、三栏布局下与右侧栏
  对调，内容始终居中
- **两栏 / 三栏自由切换**，可选的分类导航栏
- **卡片外观**：卡片描边与轻投影、卡片底色跟随主题色相、卡片悬浮抬升、磨砂玻璃导航栏
- **亮暗模式**（含 4 种切换动画）与主题色相自由调节
- **渐变过渡**：壁纸与页面背景衔接处加一层渐变，消除生硬接缝
- 4 档动画速度预设，可细化到 8 个时长变量

### 内容与阅读

- **沉浸阅读**：一键收起导航栏、两侧栏、目录与浮动按钮，正文收成单栏居中并限制行宽；
  右上角常驻出口按钮与 `Esc` 都能退出，状态跨页保持
- **字数与阅读时长**：中日韩字符按「字」计、其余按词计（中文博客常混排，只按一种算
  会严重偏差），阅读速度取中文 400 字/分钟、西文 200 词/分钟
- **相关推荐**：按同分类推荐，没有分类时退回同标签；自身会被滤除，同分类不足两篇时
  整个区块不显示
- **文章目录**：侧栏 / 右列 + 移动端弹窗
- 上一篇 / 下一篇、版权声明卡片、置顶文章高亮、分享海报（含二维码）、文章打赏
- **代码块增强**：语言徽章、行号、长代码块折叠、一键复制；外观对齐 Firefly
  （灰底标题栏 + 三枚低透明度圆点、one-light / one-dark-pro 两套 Shiki 配色）

### 动效与特效

- **樱花特效**：整屏飘落的花瓣，程序化绘制（不打包任何来历不明的图片素材），片数可配
  上限 100，尊重 `prefers-reduced-motion`，页面不可见时自动暂停
- **Banner 底部波浪**、渐变过渡、壁纸轮播
- **移动端底部导航**：固定底栏，条目（首页 / 归档 / 分类 / 标签 / 搜索 / 顶部）逐项可配；
  启用后页面自动留白，浮动按钮同步上移避让

### 侧边栏小组件

公告、个人简介（含在线状态）、天气、音乐播放器、一言、站点统计（9 项可选）、分类、
标签、热门文章、**写作热力图**（近半年发文密度，格子跟随主题色）、自定义 HTML、日程、
目录

### 独立页面

- **RSS 订阅页**：订阅地址（一键复制 + 结果提示）、推荐阅读器、最新文章、RSS 说明
- 朋友圈、时间轴、技能、心愿便签等插件页面模板

### 站点与生态

- **首页社交链接**：标题下方一排按钮（GitHub / 邮箱 / 打赏 / RSS），每一项填了才显示
- **页脚站点运行时间**：「本站已运行 x 天 x 小时 x 分钟 x 秒」，秒数实时走动，可点击跳转
- **搜索**：直接调用 Halo 搜索索引 API，面板内实时结果
- **评论**：对接 Halo 评论插件
- **友情链接**：申请流程 / 随机访问 / 折叠面板 / 页脚卡片墙 / 朋友圈动态流
- **访客自定义**：导航栏「显示设置」面板，访客可自行切换布局、配色、壁纸、特效；
  站长可用总开关一键收回（关闭后面板入口整体隐藏，所有人看到的都是你配好的样式）
- 图片 CDN 实时压缩（8+ 图床规则）、外链跳转提示
- 认证页（登录 / 注册）、菜单图标后台可配
- 多语言：简体中文 / 繁體中文 / English

## 环境要求

| 依赖 | 版本 |
| --- | --- |
| Halo | >= 2.25.0 |
| Node.js（仅二次开发需要） | >= 22.12.0（推荐 24.x，见 `.nvmrc`） |
| pnpm（仅二次开发需要） | >= 10 |

## 安装

1. 从 [Releases](https://github.com/only1nn/halo-theme-Onlynn/releases) 下载最新
   `onlynn-<版本>.zip`
2. 进入 Halo 后台 →「外观」→「主题」→ 右上角「安装」→ 上传 zip
3. 安装完成后点「启用」
4. 进入「主题 → 设置」按需调整（大多数功能默认关闭，按需开启即可）

> 主题 ID 为 `onlynn`（Halo 要求主题 ID 只能小写），后台显示名为 **Onlynn**。

## 主题设置

后台「主题设置」按功能分为 10 个分组，常用的几处：

| 分组 | 能配什么 |
| --- | --- |
| **布局设置** | 页面布局（两栏 / 三栏）、移动端底部导航、Banner 形态、文章卡片布局、菜单栏、浮动按钮、欢迎弹窗 |
| **样式设置** | **显示设置面板**（访客权限 + 各项默认值）、Banner 样式与壁纸、标题与副标题、首页社交链接、配色方案、主题语言、样式开关、樱花特效、动画速度、外部字体 |
| **侧边栏** | 左右栏各放哪些小组件，以及每个小组件的详细配置 |
| **文章** | 版权声明、相关推荐、文章信息（字数 / 阅读时长）、代码块、内容显示、目录、摘要、操作栏（含沉浸阅读） |
| **扩展页面** | 朋友圈、时间轴、技能、RSS 订阅页 |
| **页脚** | 站点运行时间、备案信息、链接显示、自定义链接、页脚友链 |

> **「样式设置 → 显示设置面板」是外观配置的统一入口**：上半部分控制访客能改哪些项，
> 下半部分是该面板各项的**默认值**。想让所有访客都看到同一套样式，把「允许访客切换
> 样式」总开关关掉即可 —— 那时前台不再显示设置按钮，也不存在任何 per-browser 状态。

## 插件兼容

主题对插件采取「有则增强、无则降级」的策略：插件缺失时相关模块会整块跳过，不会报错。

已做深度整合的插件：

| 插件 | 用途 |
| --- | --- |
| 搜索 | 导航栏搜索面板（调用 Halo 搜索索引 API） |
| 评论 | 文章 / 页面 / 瞬间 / 图库的评论区 |
| 瞬间 | 瞬间列表与详情页 |
| 图库 | 相册列表与详情（PhotoSwipe 灯箱 + EXIF） |
| 链接管理 | 友链页面、申请流程、页脚卡片墙、朋友圈动态流 |
| 项目集 | 作品集列表与详情 |
| 装备管理 | 装备展示页 |
| 心愿便签 | 心愿墙 / 树洞便签墙 |
| 日程日历 | 日程页面与侧栏小组件 |
| B 站番剧 | 追番页面 |
| extra-api | 站点总字数统计 |

推荐一并安装：**Feed**（RSS 订阅）、**Sitemap**、**Shiki**（代码高亮）、**lightgallery**。

> **Shiki 插件配置建议**：安装后把「风格」设为 `simple`、「亮色主题」设为 `one-light`、
> 「暗色主题」设为 `one-dark-pro`，与主题的代码块外框正好配套。「Mac 窗口」风格自带
> 标题栏，会与主题提供的外框重复。

## 从源码构建

```bash
git clone https://github.com/only1nn/halo-theme-Onlynn.git
cd halo-theme-Onlynn
pnpm install
pnpm build     # 产出 dist/onlynn-<版本>.zip
```

其它命令：

| 命令 | 作用 |
| --- | --- |
| `pnpm dev` | 监听 `src/` 变更自动重建（不打 zip） |
| `pnpm build` | 全量构建并打包成可安装的 zip |
| `pnpm verify` | 主题身份一致性检查（主题名 / 设置名 / 资源前缀是否对齐） |
| `pnpm check` | 类型检查 |

## 目录结构

```
├── theme.yaml              主题清单
├── settings.yaml           后台设置表单
├── annotation-setting.yaml 为 Halo 菜单项追加图标字段
├── i18n/                   界面文案（default / zh_CN / zh_TW，键序须一致）
├── public/                 静态资源，构建后原样进入 templates/
│   ├── fragments/          Halo 页面片段
│   ├── gateway_fragments/  登录 / 注册页外壳
│   └── assets/             经典脚本编译产物（不要手工编辑）
├── scripts/
│   ├── build-assets.mjs         esbuild 编译 src/scripts/assets/*.ts → public/assets/
│   ├── strip-html-comments.mjs  产物注释剥离（脚本 / 样式除外）
│   ├── package-theme.mjs        打包成可上传的 zip
│   ├── convert-readme.mjs       README → README-Halo.md
│   └── check-identity.mjs       主题身份一致性校验
├── src/
│   ├── components/         UI 组件（layout / widget / control / pages …）
│   ├── layouts/            Layout.astro 与 MainGridLayout.astro
│   ├── pages/              页面模板，一个文件对应一个 Halo 模板
│   ├── scripts/            经典脚本源码（编译后进 public/assets/）
│   ├── styles/             Tailwind 入口与各模块样式
│   └── utils/              客户端与共享逻辑
└── templates/              构建产物（Halo 的模板目录，不纳入版本库）
```

## 写模板时要注意的坑

这个项目的构建链路是「Astro 编译出 Thymeleaf 模板」，两边的心智模型交织，容易踩坑。
改模板前建议读一遍 `AGENTS.md`，其中几条高频的：

- **`th:if`(300) 先于 `th:with`(400) 求值**：把 `th:with="x=…"` 和引用 `x` 的 `th:if`
  写在同一元素上，`th:if` 求值时 `x` 还不存在，整块会**静默不渲染**。要用外层
  `<div th:remove="tag">` 承载 `th:with`，条件写内层。
- **Astro 的 `<style>` 默认带作用域**：脚本用 `document.createElement` 动态生成的节点
  没有作用域属性，选择器匹配不到，样式会静默失效。动态节点要用 `<style is:global>`
  加容器前缀。
- **面板项的默认值必须服务端渲染**：首帧脚本只负责套用访客覆盖。若只靠脚本套覆盖，
  访客开关一关元素就会掉回 CSS 原始默认，站长的配置等于失效。
- **`pnpm build` 只做 Astro 侧编译**，看不到 Thymeleaf 的服务端错误。改完模板要装进
  Halo 实跑一次。

## 致谢与许可

Onlynn 站在多个开源项目的肩上：

- [**Fuwari**](https://github.com/saicaca/fuwari) — 原始 Astro 主题，确立了整套设计语言
- [**halo-theme-fuwari**](https://github.com/jiewenhuang/halo-theme-fuwari) — Fuwari 的 Halo 移植，
  验证了「Astro 编译出 Thymeleaf 模板」这条链路
- [**Ethereal**](https://github.com/AloneNanNan/halo-theme-ethereal) — **本项目的直接基座**，
  提供了绝大部分功能与完整的 Halo 生态整合
- [**Firefly**](https://github.com/CuteLeaf/Firefly) — 外观与交互定制的参照来源，
  本项目多项外观能力（Hero 布局、樱花、代码块风格等）以其为蓝本

以 [MIT 协议](LICENSE) 分发。若你参考或使用了本项目的组件设计与代码，请注明来源。
