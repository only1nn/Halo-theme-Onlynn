/*
 * 构建期守卫：产物模板里不该出现「会被 Thymeleaf 当内联表达式解析」的方括号组合。
 *
 * 背景（这是踩过的真故障）：Thymeleaf 在 HTML 模式下**默认对所有文本做内联处理** ——
 * 除了标签内容，还包括 `<script>` 内容与 HTML 注释。`[[…]]`（text）与 `[(…)]`（utext）
 * 都是它的内联标记。所以：
 *
 *   - 内联 `<script>` 里写 JS 正则 `/\[(\d{2}):(\d{2})\]/`，那个 `[(` 会被当成内联起点，
 *     Thymeleaf 一路找配平的 `)]`，把后面大段 JS 当表达式去 parse → 整页 500。
 *     留言板就是这么挂的（音乐播放器的 LRC 正则）。
 *   - HTML 注释里的 `[(${...})]` 同样会被求值 → `Exception evaluating SpringEL expression: "..."`，
 *     于是错误页 `error/404` 直接崩（注释是我自己写的说明文字）。
 *
 * 两者 `astro build` 都看不见，只有真机请求特定页面才炸，而且**是否炸取决于后面跟了什么**，
 * 属于随机爆的隐性故障 —— 所以在构建期拦掉。
 *
 * 判定规则：
 *   - 只扫 `<script>` 内容与 HTML 注释（`<style>` 与属性不在此列：属性的 SpEL 投影 `![...]`
 *     之类是正常用法）。
 *   - 只有带 `th:inline="javascript"` 的 script 跳过（项目里那几处靠它写服务端文案）。
 *     ⚠ `th:inline="none"` **不算豁免**：音乐播放器那个 LRC 正则明明写了 none，实测照样
 *     被扫出「Could not parse as expression」并让整页 500 —— 不确定是 Thymeleaf 版本行为
 *     还是 Halo 的方言配置，总之不能指望它兜底，只能从源头去掉那三个字符的组合。
 *   - 命中即报错退出，附文件、行号与上下文。
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// 默认扫本仓库的产物模板；也可以传目录参数，便于拿旧产物做回归对照
const TEMPLATES_DIR =
  process.argv[2] || join(import.meta.dirname, "..", "templates");
const OPEN_TEXT = "[["; // th:text 内联
const OPEN_UTEXT = "[("; // th:utext 内联

/** 找出一段文本里所有内联标记，返回 [{ index, marker }] */
function findMarkers(text) {
  const out = [];
  for (const marker of [OPEN_TEXT, OPEN_UTEXT]) {
    let i = text.indexOf(marker);
    while (i >= 0) {
      out.push({ index: i, marker });
      i = text.indexOf(marker, i + 1);
    }
  }
  return out.sort((a, b) => a.index - b.index);
}

function lineOf(text, index) {
  return text.slice(0, index).split("\n").length;
}

const problems = [];

for (const file of readdirSync(TEMPLATES_DIR)) {
  if (!file.endsWith(".html")) continue;
  const path = join(TEMPLATES_DIR, file);
  const html = readFileSync(path, "utf8");

  // ① <script> 内容
  const scriptRe = /<script([^>]*)>/g;
  let m;
  while ((m = scriptRe.exec(html)) !== null) {
    const attrs = m[1];
    // 只有 th:inline="javascript" 豁免；th:inline="none" 不作数（见文件头说明）
    if (/th:inline\s*=\s*"javascript"/.test(attrs)) continue;
    const end = html.indexOf("</script>", m.index);
    if (end < 0) continue;
    const body = html.slice(m.index + m[0].length, end);
    for (const hit of findMarkers(body)) {
      problems.push({
        file,
        line: lineOf(html, m.index + m[0].length + hit.index),
        where: "<script> 内容",
        ctx: body
          .slice(Math.max(0, hit.index - 46), hit.index + 30)
          .replace(/\s+/g, " "),
        marker: hit.marker,
      });
    }
  }

  // ② HTML 注释：Thymeleaf 一样会处理
  const commentRe = /<!--[\s\S]*?-->/g;
  while ((m = commentRe.exec(html)) !== null) {
    for (const hit of findMarkers(m[0])) {
      problems.push({
        file,
        line: lineOf(html, m.index + hit.index),
        where: "HTML 注释",
        ctx: m[0]
          .slice(Math.max(0, hit.index - 46), hit.index + 30)
          .replace(/\s+/g, " "),
        marker: hit.marker,
      });
    }
  }

  // ③ script / style 标签配对：数量不等说明产物结构已被破坏。
  // 这类破坏的后果是浏览器把后面整段正文当原始文本吞掉（页面「样式没了 / 内容不见了」），
  // 而且不报任何错 —— 踩过一次：注释里出现 `<style` 字样让注释剥离脚本错位，
  // 留下一个裸露的 `<style>` 开标签吞掉了三十万字符的正文。
  for (const name of ["script", "style"]) {
    const open = html.match(new RegExp(`<${name}(?=[\\s>])`, "gi")) || [];
    const close = html.match(new RegExp(`</${name}\\s*>`, "gi")) || [];
    if (open.length !== close.length) {
      problems.push({
        file,
        line: 1,
        where: `标签配平`,
        marker: `<${name}>`,
        ctx: `开标签 ${open.length} 个，闭标签 ${close.length} 个 —— 数量不等`,
      });
    }
  }
}

if (problems.length === 0) {
  console.log(
    "✓ 模板体检通过（内联标记无裸方括号组合；script/style 标签配对）",
  );
  process.exit(0);
}

console.error(`✗ 模板体检发现 ${problems.length} 处问题：\n`);
for (const p of problems) {
  console.error(
    `  ${p.file}:${p.line}  [${p.where}]  标记 ${JSON.stringify(p.marker)}`,
  );
  console.error(`     …${p.ctx}…`);
}
console.error(
  "\n修法：内联脚本里的方括号组合改用 \\x5b / \\x5d 的等价写法（需要服务端文案的 script " +
    '用 th:inline="javascript" 配 /*[[${…}]]*/）；标签数量不等要查生成该段的构建脚本 ' +
    "（脚本或样式在字符串/注释里出现成对的标签字样时最容易被它切错）。",
);
process.exit(1);
