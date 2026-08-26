import assert from "node:assert/strict";
import test from "node:test";

import {
  AUTHORITY,
  SENSITIVITY,
  classifyAuthority,
  classifyEra,
  classifySensitivity,
  classifyTopic,
} from "./build-historical-office-archive.mjs";

test("authority taxonomy exposes the eight requested categories", () => {
  assert.equal(Object.keys(AUTHORITY).length, 8);
  assert.deepEqual(new Set(Object.values(AUTHORITY)), new Set([
    "独立研究", "原始产品规范", "内部运营记录", "销售资料", "融资预测", "营销材料", "邮件往来", "技术源文件",
  ]));
});

test("sensitivity taxonomy exposes the eight requested categories", () => {
  assert.equal(Object.keys(SENSITIVITY).length, 8);
  assert.deepEqual(new Set(Object.values(SENSITIVITY)), new Set([
    "公开", "内部", "机密", "PII", "财务", "法律", "健康", "未知",
  ]));
});

test("technical Flash and email evidence classify with explicit rules", () => {
  assert.equal(classifyAuthority("Venky HM .fla files/L1VB01.fla")[0], "technical-source-file");
  assert.equal(classifyTopic("Venky HM .fla files/L1VB01.mp3")[0], "audio-language-assets");
  assert.equal(
    classifyAuthority("HELP Math Trials & Leads/2019-01-01T10-20 [name@example.com] Re_ Trial.pdf")[0],
    "correspondence",
  );
});

test("sensitivity retains overlapping financial, PII, and legal tags", () => {
  const [primary, tags] = classifySensitivity(
    "HELP Math Trials & Leads/Personal/Personal Finance/Legal Agreement invoice.pdf",
    "correspondence",
  );
  assert.equal(primary, "legal");
  assert.ok(tags.includes("legal"));
  assert.ok(tags.includes("financial"));
  assert.ok(tags.includes("pii"));
});

test("era prefers an explicit path year over filesystem modification time", () => {
  assert.deepEqual(classifyEra("folder/report-2011-final.pdf", Date.UTC(2025, 0, 1)), [2011, "2010-2019", "path-year", "medium"]);
});
