import { readFile } from "node:fs/promises";
import { join } from "node:path";

const directory = process.argv[2];

try {
  if (!directory || process.argv.length !== 3) {
    throw new Error("用法：node scripts/check-locales.mjs games/<id>/locales");
  }
  const [source, target] = await Promise.all([readLocale("en"), readLocale("zh-CN")]);
  const errors = [];

  for (const [key, text] of Object.entries(source)) {
    if (!Object.hasOwn(target, key)) {
      errors.push(`缺少中文文案 ${key}`);
    } else if (placeholders(text) !== placeholders(target[key])) {
      errors.push(`占位符不一致 ${key}（英文：${placeholders(text) || "无"}，中文：${placeholders(target[key]) || "无"}）`);
    }
  }
  for (const key of Object.keys(target)) {
    if (!Object.hasOwn(source, key)) errors.push(`缺少对应的英文文案 ${key}`);
  }

  if (errors.length) throw new Error(errors.join("\n"));
  console.log(`通过检查，${Object.keys(source).length} 条中英文案的键名与占位符一致。`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

async function readLocale(language) {
  const file = join(directory, `${language}.json`);
  let strings;
  try {
    strings = JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    throw new Error(`${file} 读取失败：${error.message}`);
  }
  if (!strings || typeof strings !== "object" || Array.isArray(strings) || !Object.keys(strings).length) {
    throw new Error(`${file} 应包含至少一条文案，格式为 JSON 对象。`);
  }
  for (const [key, text] of Object.entries(strings)) {
    if (!key.trim() || typeof text !== "string" || !text.trim()) {
      throw new Error(`${file} 的文案键名和内容都必须是非空字符串（${JSON.stringify(key)}）。`);
    }
  }
  return strings;
}

function placeholders(text) {
  return (text.match(/\{(?:[a-zA-Z_][\w.-]*|\d+)\}/g) ?? []).sort().join(", ");
}
