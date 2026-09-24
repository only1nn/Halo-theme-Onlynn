// @ts-check
// 构建后处理：剥离产物 HTML（templates/**/*.html）中的 <!-- --> 注释。
// 保护 <script>/<style> 块内部——其中含有 Thymeleaf th:inline="javascript"
// 的内联表达式语法 /*[[${...}]]*/，是功能性代码，绝不能删。
// 以 Astro integration 挂载到 astro:build:done（见 astro.config.mjs），
// 也可独立运行：node scripts/strip-html-comments.mjs [dir]（默认 ./templates）
//
// ⚠ 为什么是「从左到右单遍扫描」而不是「先按 script/style 切开、再在剩下的片段里删注释」：
// 后者会在**注释里出现 `<style` 字样**时错位 —— 它把注释里的那个 `<style` 当成真正的
// 样式块起点，于是「保护」了注释的后半截 + 一直到下一个 `</style>` 的全部正文，
// 同时把注释的开头删掉、只留下一个裸露的 `<style>` 开标签。浏览器随后把后面几十万
// 字符的正文全当 CSS 文本吞掉，页面看起来就是「样式没了 / 内容不见了」。
// 留言板正是这么坏的（那句注释在讲「判空别用渲染结果，Halo 会输出一个 pjax 样式块」）。
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_OR_STYLE = /^<(script|style)\b/i;

/**
 * 单遍扫描：注释丢、script/style 原样留、其余原样留。
 * @param {string} html
 * @returns {{ html: string, removed: number }}
 */
export function stripHtmlComments(html) {
  let out = "";
  let i = 0;
  let removed = 0;
  while (i < html.length) {
    const lt = html.indexOf("<", i);
    if (lt < 0) {
      out += html.slice(i);
      break;
    }
    out += html.slice(i, lt);

    // ① 注释：丢到 --> 为止；未闭合（没有 --> 配对）则丢弃到段尾，避免残壳破坏结构
    if (html.startsWith("<!--", lt)) {
      const end = html.indexOf("-->", lt + 4);
      if (end < 0) break;
      removed++;
      i = end + 3;
      continue;
    }

    // ② 保护块：script / style 内部整段原样保留
    const tag = SCRIPT_OR_STYLE.exec(html.slice(lt, lt + 8));
    if (tag) {
      const name = tag[1].toLowerCase();
      // 结束标签宽松匹配：兼容 `</script >`、`</script data-x>` 等带空白/属性的写法
      const closeRe = new RegExp(`</${name}[^>]*>`, "i");
      const from = html.slice(lt);
      const close = closeRe.exec(from);
      if (!close) {
        // 没有闭合标签：保守起见原样保留剩余内容（宁可留注释也不破坏结构）
        out += from;
        break;
      }
      const end = lt + close.index + close[0].length;
      out += html.slice(lt, end);
      i = end;
      continue;
    }

    // ③ 普通标签，逐字符推进
    out += "<";
    i = lt + 1;
  }
  return { html: out, removed };
}

/** @param {string} dirPath */
export async function stripHtmlCommentsInDir(dirPath) {
  let files = 0;
  let comments = 0;
  let entries;
  try {
    entries = await readdir(dirPath);
  } catch {
    console.warn(`[strip-comments] 目录不存在，跳过：${dirPath}`);
    return { files: 0, comments: 0 };
  }
  for (const name of entries) {
    if (!name.endsWith(".html")) continue;
    const file = join(dirPath, name);
    const html = await readFile(file, "utf8");
    const { html: stripped, removed } = stripHtmlComments(html);
    if (stripped !== html) {
      await writeFile(file, stripped);
      files++;
      comments += removed;
    }
  }
  console.log(`[strip-comments] 剥离 ${comments} 条注释（${files} 个 HTML）`);
  return { files, comments };
}

// 独立运行入口：node scripts/strip-html-comments.mjs [dir]
if (
  process.argv[1] &&
  resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1])
) {
  const dir = process.argv[2] ?? "templates";
  stripHtmlCommentsInDir(dir).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
