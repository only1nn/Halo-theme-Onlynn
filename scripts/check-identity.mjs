#!/usr/bin/env node
/**
 * 主题身份一致性检查。
 *
 * 背景：主题标识分散在多个文件里 —— `theme.yaml` 的 `metadata.name`、`settings.yaml` 的
 * `Setting.metadata.name`、`annotation-setting.yaml` 的扩展名、`astro.config.mjs` 的 `base`、
 * 以及模板与默认值里硬编码的 `/themes/<name>/` 资源前缀。改名时漏掉任何一处，
 * 构建都不会报错，但线上会出现「主题配置读不到」「静态资源 404」这类难查的问题
 * （实际踩过：`settingName` 改了、`settings.yaml` 里的 `Setting` 名字没改，
 * 结果 Halo 找不到设置表单，主题配置一直是空的，页面渲染直接 500）。
 *
 * 用法：pnpm verify        （CI 与本地构建前执行）
 */
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const problems = [];
const notes = [];

function fail(msg) {
  problems.push(msg);
}

async function readIfExists(file) {
  try {
    return await readFile(file, "utf8");
  } catch {
    return null;
  }
}

async function walk(dir, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".git", "templates", "dist"].includes(entry.name))
        continue;
      await walk(full, out);
    } else {
      out.push(full);
    }
  }
  return out;
}

const root = process.cwd();

// ── 1. 读取主题身份 ────────────────────────────────────────────────
const themeYaml = await readIfExists(path.join(root, "theme.yaml"));
if (!themeYaml) {
  console.error("找不到 theme.yaml");
  process.exit(1);
}

const themeName = /^metadata:\s*$[\s\S]*?^\s{2}name:\s*(\S+)/m.exec(
  themeYaml,
)?.[1];
const settingName = /settingName:\s*"?([^"\n]+)"?/.exec(themeYaml)?.[1]?.trim();
const configMapName = /configMapName:\s*"?([^"\n]+)"?/
  .exec(themeYaml)?.[1]
  ?.trim();

if (!themeName) fail("theme.yaml 缺少 metadata.name");
if (!settingName) fail("theme.yaml 缺少 spec.settingName");
if (!configMapName) fail("theme.yaml 缺少 spec.configMapName");

// ── 2. settings.yaml 的 Setting 名字必须与 settingName 一致 ────────
const settingsYaml = await readIfExists(path.join(root, "settings.yaml"));
if (!settingsYaml) {
  fail("缺少 settings.yaml");
} else {
  const declared = /^metadata:\s*$[\s\S]*?^\s{2}name:\s*(\S+)/m.exec(
    settingsYaml,
  )?.[1];
  if (declared !== settingName) {
    fail(
      `settings.yaml 的 Setting 名 (${declared}) 与 theme.yaml 的 settingName (${settingName}) 不一致 —— ` +
        "Halo 会找不到设置表单，主题配置将为空，页面渲染报错",
    );
  }
}

// ── 3. astro.config.mjs 的 base 必须指向本主题 ────────────────────
const astroConfig = await readIfExists(path.join(root, "astro.config.mjs"));
const base = astroConfig
  ? /base:\s*[`"']([^`"']+)[`"']/.exec(astroConfig)?.[1]
  : null;
if (!base) {
  fail("astro.config.mjs 里找不到 base");
} else if (base !== `/themes/${themeName}`) {
  fail(
    `astro.config.mjs 的 base (${base}) 与主题名 (${themeName}) 不匹配，应为 /themes/${themeName}`,
  );
}

// ── 4. 全仓库不得残留其它主题的资源前缀 ──────────────────────────
const files = await walk(root);
const foreignPrefixes = new Map();
for (const file of files) {
  const content = await readIfExists(file);
  if (!content) continue;
  for (const [, prefix] of content.matchAll(/\/themes\/([A-Za-z0-9_-]+)\//g)) {
    if (prefix === themeName) continue;
    // Halo 自身或插件资源的引用不算问题
    if (["halo", "plugins"].includes(prefix)) continue;
    foreignPrefixes.set(prefix, [
      ...(foreignPrefixes.get(prefix) ?? []),
      path.relative(root, file),
    ]);
  }
}
for (const [prefix, where] of foreignPrefixes) {
  fail(
    `发现指向其它主题的资源前缀 /themes/${prefix}/ ，出现在：${[...new Set(where)].join(", ")}`,
  );
}

// ── 5. annotation-setting.yaml 的扩展名应带本主题前缀 ────────────
const annotation = await readIfExists(
  path.join(root, "annotation-setting.yaml"),
);
if (annotation) {
  const name = /^metadata:\s*$[\s\S]*?^\s{2}name:\s*(\S+)/m.exec(
    annotation,
  )?.[1];
  if (name && !name.startsWith(themeName)) {
    notes.push(
      `annotation-setting.yaml 的扩展名 (${name}) 未使用主题前缀 —— 不是错误，但如果它是从上游继承的，建议改成 ${themeName}- 前缀`,
    );
  }
}

// ── 6. 已移除的旧标识不应再出现在源码与文案里 ─────────────────────
// 已从主题中移除的旧标识：改版后不应再出现在任何文案里，
// 这里做泄露检测（LICENSE 里的中文署名「楠南NanNan」不在其中，那是 MIT 要求保留的版权声明）
const REMOVED = ["AloneNanNan", "halo-theme-ethereal", "seisou", "nan-xaing"];
for (const file of files) {
  const rel = path.relative(root, file).split(path.sep).join("/");
  // 文档里可能正当提及上游项目，不检查；本脚本自身持有标识清单，也跳过
  if (/^(README|LICENSE|CHANGELOG|CONTRIBUTING)/.test(rel)) continue;
  if (rel === "scripts/check-identity.mjs") continue;
  const content = await readIfExists(file);
  if (!content) continue;
  for (const token of REMOVED) {
    if (content.includes(token)) {
      notes.push(
        `${rel} 仍含已移除的旧标识「${token}」—— 改版后不应再出现，请清理`,
      );
    }
  }
}

// ── 7. 构建产物必须引用样式表（防止误删样式导入）──────────────────
const outIndex = path.join(root, "templates", "index.html");
if (
  await stat(outIndex).then(
    () => true,
    () => false,
  )
) {
  const html = await readFile(outIndex, "utf8");
  const href = /<link rel="stylesheet" href="([^"]+)"/.exec(html)?.[1];
  if (!href) {
    fail("templates/index.html 没有引用任何样式表 —— 页面会渲染成无样式文本");
  } else {
    const assetPath = path.join(
      root,
      "templates",
      href.replace(/^\/themes\/[^/]+\//, ""),
    );
    if (
      !(await stat(assetPath).then(
        () => true,
        () => false,
      ))
    ) {
      fail(`templates/index.html 引用的样式表不存在：${href}`);
    }
  }
}

// ── 输出 ──────────────────────────────────────────────────────────
console.log(
  `主题身份：${themeName}  设置：${settingName}  配置：${configMapName}`,
);

for (const note of notes) console.log(`  · ${note}`);

if (problems.length > 0) {
  console.error(`\n✗ 发现 ${problems.length} 个问题：`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log("✓ 身份一致性检查通过");
