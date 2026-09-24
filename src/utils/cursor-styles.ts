/**
 * 内置光标样式表。
 *
 * 素材与 Dream2.0 Plus 的游标包一一对应，四态（默认 / 手型 / 文本 / 缩放）的取用文件
 * 也照它的 `common/config.html` 逐条对齐 —— 少数几套（breeze / black_cat / overwatch /
 * rainbow_rain / marry）四态用的是不同文件名，其余走 `<style>/arrow.cur` + `hand.cur` 的约定。
 *
 * ⚠ 只收录该主题**实际引用**的 37 个文件（约 205KB）：素材包共 87 个文件 2.1MB，
 *    多出来的 50 个是 `overwatch/busy.ani`（713KB）、`marry/working.ani` 这类动画游标，
 *    在原主题里没有任何一项设置引用它们。要全量搬过来就再补复制，本表不用改。
 *
 * 出处：`halo-theme-dream2.0-plus/templates/assets/cursor`，该项目的 MIT 声明里
 * 未包含这批素材的任何署名。见 `public/assets/cursors/SOURCES.md`。
 */

export interface CursorStyle {
  /** 存进设置项的值，与 Dream2.0 Plus 同名 */
  value: string;
  /** 四个状态各自的文件名（相对该套素材目录） */
  files: [string, string, string, string];
}

/** 四态顺序固定为：默认 / 手型 / 文本 / 缩放 */
export const CURSOR_STYLE_FILES: CursorStyle[] = [
  { value: "OwO", files: ["arrow.cur", "hand.cur", "arrow.cur", "arrow.cur"] },
  { value: "UwU", files: ["arrow.cur", "hand.cur", "arrow.cur", "arrow.cur"] },
  {
    value: "breeze",
    files: ["Arrow.cur", "Hand.cur", "IBeam.cur", "Cross.cur"],
  },
  {
    value: "mellow",
    files: ["arrow.cur", "hand.cur", "arrow.cur", "arrow.cur"],
  },
  {
    value: "water_01",
    files: ["arrow.cur", "hand.cur", "arrow.cur", "arrow.cur"],
  },
  {
    value: "water_02",
    files: ["arrow.cur", "hand.cur", "arrow.cur", "arrow.cur"],
  },
  {
    value: "horse",
    files: ["arrow.cur", "hand.cur", "arrow.cur", "arrow.cur"],
  },
  {
    value: "debris",
    files: ["arrow.cur", "hand.cur", "arrow.cur", "arrow.cur"],
  },
  {
    value: "overwatch",
    files: ["pointer.cur", "link.cur", "text.cur", "cross.cur"],
  },
  {
    value: "rainbow_rain",
    files: ["normal.cur", "link.cur", "texto.cur", "precision.cur"],
  },
  { value: "marry", files: ["arrow.cur", "arrow.cur", "beam.cur", "move.cur"] },
  {
    value: "black_cat",
    files: ["normal.cur", "ayuda.cur", "texto.cur", "precision.cur"],
  },
  {
    value: "music_cat_01",
    files: ["arrow.cur", "hand.cur", "arrow.cur", "arrow.cur"],
  },
  {
    value: "music_cat_02",
    files: ["arrow.cur", "hand.cur", "arrow.cur", "arrow.cur"],
  },
];

/** 四态对应的 CSS 变量名与兜底关键字（url() 之后必须跟一个关键字，否则整条声明作废） */
export const CURSOR_SLOTS = [
  { var: "--cursor-default", keyword: "auto" },
  { var: "--cursor-pointer", keyword: "pointer" },
  { var: "--cursor-text", keyword: "text" },
  { var: "--cursor-zoom", keyword: "zoom-in" },
] as const;

/*
  ── 生成段 ──
  下面把这张表拼成一段 SpEL，交给模板里的 Thymeleaf CSS 内联 [(${...})] 求值。
  命中的那一套输出四条 --cursor-* 声明（约 350 字节），其余分支求值为空串 ——
  十几套素材的表只占模板体积，不进页面。
  ⚠ 每个三元都必须自己带括号：SpEL 的 ?: 优先级低于 +，不括会把后面的分支吞进 else。
*/
const CURSOR_BASE = "theme.config?.enhance?.cursor";
const STYLE_EXPR = `${CURSOR_BASE}?.style`;

export const cursorBuiltinSpel = CURSOR_STYLE_FILES.map(({ value, files }) => {
  const decls = files
    .map(
      (file, i) =>
        // ⚠ #theme.assets 自己会补 /assets 前缀，这里只给 /cursors/…
        `'${CURSOR_SLOTS[i].var}: url(' + #theme.assets('/cursors/${value}/${file}') + '), ${CURSOR_SLOTS[i].keyword}; '`,
    )
    .join(" + ");
  return `(${STYLE_EXPR} == '${value}' ? ${decls} : '')`;
}).join(" + ");

/*
  自定义上传：只对填了的那几态输出声明。
  ⚠ 空值不要输出成 `--cursor-pointer: url(null), pointer` —— 没写热点时 SpEL 会拼出 "null"，
  那条声明随即失效，连 var() 的兜底关键字都留不住（链接会丢掉手型）。
*/
export const cursorCustomSpel = [
  "img_default",
  "img_pointer",
  "img_text",
  "img_zoom",
]
  .map((field, i) => {
    // ⚠ 是 enhance.cursor.img_default，不是 enhance.cursor.style.img_default
    const key = `${CURSOR_BASE}?.${field}`;
    const hotspot = `(${CURSOR_BASE}?.hotspot_x != 0 or ${CURSOR_BASE}?.hotspot_y != 0 ? ' ' + (${CURSOR_BASE}?.hotspot_x ?: 0) + ' ' + (${CURSOR_BASE}?.hotspot_y ?: 0) : '')`;
    return `(${STYLE_EXPR} == 'custom' and !#strings.isEmpty(${key}) ? '${CURSOR_SLOTS[i].var}: url(' + ${key} + ')' + ${hotspot} + ', ${CURSOR_SLOTS[i].keyword}; ' : '')`;
  })
  .join(" + ");

/**
 * 供 `<style th:utext={cursorStyleExpr}>` 用的属性值。
 *
 * ⚠ 千万别用 Thymeleaf 的 CSS 内联标记 `[(${ … })]` 来塞这段：内联要先把括号配平、
 * 再找收尾的 `)]`，而这段 SpEL 有十几层三元、几十对括号、外加一堆带括号的字符串字面量
 * （`url(' + … + ')`），扫描器会被绕晕 —— 实测它从某处 `[(` 起吞掉后面 7438 个字符，
 * 连无关脚本里的 `window.__onlynnI18n || return window.` 都拿去当表达式解析，
 * 于是留言板整页 500（其它页面只是碰巧吞到能解析的片段，属于随时会爆的隐性故障）。
 * `th:utext` 是普通属性表达式：取值后直接替换元素内容，不经过任何内联扫描。
 *
 * 外层 `|…|` 是 Thymeleaf 的字面量替换，里面只有一处 `${}`，其余原样输出。
 * 另外两段之间要有 `+`：`join(" + ")` 不会给最后一项补尾巴，首尾相接会拼出
 * `... : '')(theme.config?...`，SpEL 报 EL1041E「解析完一个合法表达式后还有多余数据」。
 */
export const cursorStyleExpr =
  "|html { ${" + cursorBuiltinSpel + " + " + cursorCustomSpel + "} }|";

/**
 * 渲染门：值必须是内置的那几套之一或 custom。
 * 用「枚举合法值」而不是 `!= 'none'`，是为了让已经下线的旧值（例如早期版本的
 * `theme`）干净地退回系统光标 —— 否则 `!= 'none'` 会照常输出那批 `var()` 选择器，
 * 而变量是空的，连链接的手型光标都会一起丢掉。
 */
export const cursorEnabledSpel =
  CURSOR_STYLE_FILES.map(({ value }) => `(${STYLE_EXPR} == '${value}')`).join(
    " or ",
  ) + ` or ${STYLE_EXPR} == 'custom'`;
