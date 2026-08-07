#!/usr/bin/env node

import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import {
  chmod,
  lstat,
  mkdir,
  opendir,
  readFile,
  readdir,
  realpath,
  rename,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "..");
const DEFAULT_SOURCE =
  "/Volumes/WestWorld/HELP MATH Related Files/Historical Office Documents of HELP MATH Program";
const DEFAULT_OUTPUT = path.join(
  PROJECT_ROOT,
  "private-archive/historical-office-catalog-2026-07-25",
);
const DEDUPE_DIRECTORY = path.join(
  PROJECT_ROOT,
  "documentation/historical-office-dedup-2026-07-25",
);
const EXPECTED_CURRENT_FILES = 3_675;
const EXPECTED_DELETED_DUPLICATES = 38;
const EXPECTED_SNAPSHOT_FILES = 3_713;
const EXPECTED_SNAPSHOT_BYTES = 3_615_658_010;
const EXPECTED_DUPLICATE_GROUPS = 54;
const EXPECTED_EXTRA_DUPLICATES = 110;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const TECHNICAL_EXTENSIONS = new Set(["fla", "swf", "xml", "as"]);
const AUDIO_EXTENSIONS = new Set(["mp3", "wav", "m4a", "aac", "ogg", "aif", "aiff"]);

export const AUTHORITY = Object.freeze({
  "independent-research": "独立研究",
  "original-product-specification": "原始产品规范",
  "internal-operations-record": "内部运营记录",
  "sales-material": "销售资料",
  "fundraising-forecast": "融资预测",
  "marketing-material": "营销材料",
  correspondence: "邮件往来",
  "technical-source-file": "技术源文件",
});

export const SENSITIVITY = Object.freeze({
  public: "公开",
  internal: "内部",
  confidential: "机密",
  pii: "PII",
  financial: "财务",
  legal: "法律",
  health: "健康",
  unknown: "未知",
});

export const TOPICS = Object.freeze({
  "research-efficacy": "研究与成效",
  "curriculum-standards": "课程与标准",
  "product-design-modernization": "产品设计与现代化",
  "flash-curriculum-source": "Flash课程源文件",
  "audio-language-assets": "音频与语言资源",
  "sales-customers-trials": "销售、客户与试用",
  "finance-fundraising": "财务与融资",
  "marketing-public-relations": "营销与公关",
  "legal-governance": "法律与公司治理",
  "partnerships-business-development": "合作与业务发展",
  "correspondence-meetings": "往来与会议",
  "operations-administration": "运营与行政",
  "personal-nonprogram": "个人及非项目资料",
  unclassified: "未归类",
});

const FORMAT_BY_EXTENSION = Object.freeze({
  pdf: ["PDF document", "application/pdf"],
  doc: ["Microsoft Word 97-2003 document", "application/msword"],
  docx: ["Microsoft Word OOXML document", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  dotx: ["Microsoft Word OOXML template", "application/vnd.openxmlformats-officedocument.wordprocessingml.template"],
  ppt: ["Microsoft PowerPoint 97-2003 presentation", "application/vnd.ms-powerpoint"],
  pptx: ["Microsoft PowerPoint OOXML presentation", "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  xls: ["Microsoft Excel 97-2003 workbook", "application/vnd.ms-excel"],
  xlsx: ["Microsoft Excel OOXML workbook", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  csv: ["CSV text", "text/csv"],
  txt: ["plain text", "text/plain"],
  html: ["HTML document", "text/html"],
  xml: ["XML source", "application/xml"],
  as: ["ActionScript source", "text/plain"],
  js: ["JavaScript source", "text/javascript"],
  json: ["JSON data", "application/json"],
  yml: ["YAML data", "application/yaml"],
  yaml: ["YAML data", "application/yaml"],
  fla: ["Adobe Flash authoring file", "application/octet-stream"],
  swf: ["Shockwave Flash movie", "application/vnd.adobe.flash.movie"],
  mp3: ["MP3 audio", "audio/mpeg"],
  m4a: ["MPEG-4 audio", "audio/mp4"],
  wav: ["WAVE audio", "audio/wav"],
  aac: ["AAC audio", "audio/aac"],
  ogg: ["Ogg audio", "audio/ogg"],
  mp4: ["MPEG-4 video", "video/mp4"],
  wmv: ["Windows Media video", "video/x-ms-wmv"],
  png: ["PNG image", "image/png"],
  jpg: ["JPEG image", "image/jpeg"],
  jpeg: ["JPEG image", "image/jpeg"],
  gif: ["GIF image", "image/gif"],
  bmp: ["bitmap image", "image/bmp"],
  zip: ["ZIP archive", "application/zip"],
  ics: ["iCalendar data", "text/calendar"],
  plist: ["property list", "application/x-plist"],
  webloc: ["macOS web location", "application/x-apple-webloc"],
});

const CLAIMS = Object.freeze([
  {
    id: "sales-usd-5.3m",
    claim: "HELP Math cumulative gross sales were approximately USD 5.3 million.",
    claimZh: "HELP Math 累计销售额约为 530 万美元。",
    status: "supported-by-internal-summary-not-independent-audit",
    statusZh: "内部汇总支持，未经过独立财务审计",
    conclusion: "A workbook sums 2006-2019 rows to USD 5,326,731. It supports the rounded claim, but the archive does not contain independent audit evidence for every annual input.",
    conclusionZh: "销售工作簿将 2006–2019 年条目求和为 5,326,731 美元，足以支持四舍五入后的 530 万美元；但档案中没有覆盖每个年度输入的独立审计证据。",
    evidence: [
      {
        role: "supporting",
        sourceType: "archive",
        path: "HELP Math 2.0 Partnerships/Code District/HELP Math Historical Cumulative Sales.xlsx",
        locator: "Sheet1!B17; formula SUM(B2:B16); cached value 5326731",
        excerpt: "HELP Math Sales History (Cumulative Gross Sales)",
        authority: "internal-operations-record",
      },
      {
        role: "corroborating-claim",
        sourceType: "archive",
        path: "HELP Math 2.0 Executive Summary_2_27.pdf",
        locator: "page 2",
        excerpt: "sales in 28 states with > $5M gross sales cumulatively",
        authority: "fundraising-forecast",
      },
    ],
  },
  {
    id: "market-presence-28-states",
    claim: "HELP Math was sold or used in 28 U.S. states.",
    claimZh: "HELP Math 曾在美国 28 个州销售或使用。",
    status: "internally-corroborated-no-state-roster",
    statusZh: "多份内部材料一致陈述，但缺少逐州清单",
    conclusion: "The number is repeated in several first-party documents. No complete 28-state customer roster or independently reconciled state-level sales table was found in this audit.",
    conclusionZh: "多份第一方材料重复这一数字，但本次审计未找到完整的 28 州客户清单或独立核对过的州级销售表，因此不能升级为独立证实。",
    evidence: [
      {
        role: "supporting-claim",
        sourceType: "archive",
        path: "HELP Math 2.0 Executive Summary_2_27.pdf",
        locator: "pages 2 and 5",
        excerpt: "sales in 28 states",
        authority: "fundraising-forecast",
      },
      {
        role: "supporting-claim",
        sourceType: "archive",
        path: "HELP Math Reboot _23 Overview 10-23.pdf",
        locator: "pages 1 and 2",
        excerpt: "implemented in schools and districts in 28 states",
        authority: "fundraising-forecast",
      },
    ],
  },
  {
    id: "renewal-rate-95-percent",
    claim: "HELP Math historically achieved a 95% renewal rate.",
    claimZh: "HELP Math 历史续订率达到 95%。",
    status: "conflicted",
    statusZh: "冲突，不能作为已核实数字",
    conclusion: "A 2023 business case asserts 95%, while a 2016 investor memorandum reports a historical 60-70% renewal rate. No denominator-based renewal ledger resolves the conflict.",
    conclusionZh: "2023 年商业案例声称 95%，而 2016 年投资备忘录写明历史续订率为 60–70%。档案中没有带分母的续订明细台账来解决冲突。",
    evidence: [
      {
        role: "supporting-claim",
        sourceType: "archive",
        path: "2. Business Case for HM Reboot Round 8-23.pdf",
        locator: "page 1",
        excerpt: "HM achieved renewal rates of 95% historically",
        authority: "fundraising-forecast",
      },
      {
        role: "conflicting",
        sourceType: "archive",
        path: "HELP Math Trials & Leads/JEA/2016-08-14T20-42 [jramo@boulderlearning.com] Boulder Learning Investor Memo from James C. Calaway.pdf",
        locator: "page 27",
        excerpt: "historical 60-70% renewal rate",
        authority: "correspondence",
      },
    ],
  },
  {
    id: "math-improvement-70-percent",
    claim: "HELP Math produced 70% improvement in math proficiency and WWC validated that number.",
    claimZh: "HELP Math 带来 70% 的数学提升，而且该数字得到 WWC 验证。",
    status: "misattributed-and-unverified",
    statusZh: "归因错误，原始 70% 研究未找到",
    conclusion: "A first-party description attributes 70% learning gains to a 2005 Colorado white paper that is absent. The archived WWC review validates study design and reports a +31 improvement index, not 70% improvement.",
    conclusionZh: "第一方说明把 70% 学习增益归于 2005 年科罗拉多白皮书，但该白皮书不在档案中。归档的 WWC 报告确认研究设计符合标准，并给出 +31 improvement index，而不是 70% 提升。",
    evidence: [
      {
        role: "supporting-claim-only",
        sourceType: "archive",
        path: "HELP Math Research/HELP Math Research #1/About HELP Math.pdf",
        locator: "page 7",
        excerpt: "study results demonstrated 70% learning gains in math",
        authority: "marketing-material",
      },
      {
        role: "corrective-independent-evidence",
        sourceType: "archive",
        path: "LEVI Submission About HELP Math/wwc_help_102312.pdf",
        locator: "pages 1 and 4",
        excerpt: "meets WWC evidence standards without reservations; improvement index +31",
        authority: "independent-research",
      },
      {
        role: "missing-source",
        sourceType: "missing",
        path: "2005 Colorado Department of Education formative research white paper",
        locator: "not found in 3,713-path snapshot",
        excerpt: "",
        authority: "independent-research",
      },
    ],
  },
  {
    id: "curriculum-73-lessons",
    claim: "The HELP Math product contains 73 lessons.",
    claimZh: "HELP Math 产品包含 73 节课。",
    status: "historical-scope-claim-not-current-source-count",
    statusZh: "历史范围主张，当前来源库不支持完整 73 节",
    conclusion: "The 73-lesson number appears in first-party redevelopment material. The current migration catalog has 29 source-backed lesson XML records, so 73 must not be used as a current recovered-source count.",
    conclusionZh: "73 节出现在第一方重建材料中；当前 migration catalog 只有 29 个有 XML 来源支持的 lesson 记录，因此 73 不能当作当前已恢复来源数量。",
    evidence: [
      {
        role: "supporting-claim",
        sourceType: "archive",
        path: "HELP Math Reboot _23 Overview 10-23.pdf",
        locator: "page 2",
        excerpt: "excerpt 1 lesson from the 73",
        authority: "fundraising-forecast",
      },
      {
        role: "current-source-counterevidence",
        sourceType: "repository",
        path: "catalog/lessons.json",
        locator: "lessons.length = 29",
        excerpt: "source-backed current migration catalog",
        authority: "technical-source-file",
      },
    ],
  },
  {
    id: "content-hours-200",
    claim: "HELP Math contains over 200 hours of standards-aligned instruction.",
    claimZh: "HELP Math 包含 200 多小时的标准对齐教学。",
    status: "versioned-first-party-estimate",
    statusZh: "版本化第一方估计，未测量核实",
    conclusion: "This is the value in the methodology document; later documents use 250, 300, and 350 hours without a shared measurement method.",
    conclusionZh: "该数字来自 methodology 文档；后续文档又使用 250、300 和 350 小时，但没有共同的测量方法。",
    evidence: [{ role: "supporting-claim", sourceType: "archive", path: "HELP Math Methodology.docx", locator: "The HELP Course Structure", excerpt: "over 200 hours of standards-aligned math instruction", authority: "original-product-specification" }],
  },
  {
    id: "content-hours-250",
    claim: "HELP Math contains more than 250 hours of content.",
    claimZh: "HELP Math 包含 250 多小时内容。",
    status: "versioned-first-party-estimate",
    statusZh: "版本化第一方估计，未测量核实",
    conclusion: "A 2021 presentation uses this value. It conflicts with 200, 300, and 350-hour descriptions unless tied to a named product version and measurement rule.",
    conclusionZh: "2021 年演示文稿使用这一数字。除非绑定具体产品版本和测量规则，否则它与 200、300、350 小时说法冲突。",
    evidence: [{ role: "supporting-claim", sourceType: "archive", path: "HELP Math promotional materials/HELP  Math 2021.pptx", locator: "slide 12", excerpt: "more than 250 hours of content", authority: "marketing-material" }],
  },
  {
    id: "content-hours-300",
    claim: "HELP Math contains approximately 300 hours of content.",
    claimZh: "HELP Math 包含约 300 小时内容。",
    status: "versioned-first-party-estimate",
    statusZh: "版本化第一方估计，未测量核实",
    conclusion: "A HELP Math 2.0 scope document uses approximately 300 hours as conversion scope. It is a planning estimate, not a measured runtime total.",
    conclusionZh: "HELP Math 2.0 scope 文档将约 300 小时作为转换范围；这是规划估算，不是实测运行时长。",
    evidence: [{ role: "supporting-claim", sourceType: "archive", path: "HELP Math Research/HELP Math Research #1/HELP Math 2.0 Scope.pdf", locator: "pages 1 and 3", excerpt: "over 300 hours; approximately 300 hours of content", authority: "original-product-specification" }],
  },
  {
    id: "content-hours-350",
    claim: "HELP Math contains over 350 hours of interactive content.",
    claimZh: "HELP Math 包含 350 多小时互动内容。",
    status: "versioned-first-party-estimate",
    statusZh: "版本化第一方估计，未测量核实",
    conclusion: "An executive summary uses over 350 hours, while the same document later budgets conversion for approximately 300 hours. The two scopes are not reconciled.",
    conclusionZh: "一份 executive summary 使用 350 多小时，但同一文档后面又按约 300 小时估算转换工作；两种范围没有得到解释或对账。",
    evidence: [{ role: "supporting-claim", sourceType: "archive", path: "HELP Math 2.0 Executive Summary_2_27.pdf", locator: "pages 3 and 7", excerpt: "over 350 hours; approximately 300 hours of content", authority: "fundraising-forecast" }],
  },
]);

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function extensionOf(relativePath) {
  return path.posix.extname(relativePath).slice(1).toLowerCase();
}

function lower(value) {
  return value.normalize("NFC").toLowerCase();
}

function matchesAny(value, patterns) {
  return patterns.some((pattern) => pattern.test(value));
}

function isEmailLike(relativePath) {
  return /\d{4}-\d{2}-\d{2}t\d{2}-\d{2}\s*\[[^\]]+@[^\]]+\]/i.test(relativePath)
    || /\b(?:re_|fwd_|fw_)\b/i.test(path.posix.basename(relativePath));
}

function isTechnicalAudio(relativePath, extension) {
  if (!AUDIO_EXTENSIONS.has(extension)) return false;
  return matchesAny(lower(relativePath), [
    /^venky hm \.fla files\//,
    /^help math sample swf_fla files\//,
    /^for subs swf example files\//,
    /^for venky 6-2021\//,
  ]);
}

export function classifyAuthority(relativePath) {
  const value = lower(relativePath);
  const extension = extensionOf(relativePath);
  if (TECHNICAL_EXTENSIONS.has(extension) || isTechnicalAudio(relativePath, extension)) {
    return ["technical-source-file", "high", "authority-technical-extension-or-source-tree"];
  }
  if (isEmailLike(relativePath)) return ["correspondence", "high", "authority-email-export-name"];
  if (matchesAny(value, [
    /help math research\//,
    /uccs study/,
    /what works clearinghouse/,
    /wwc_help/,
    /understanding_math_learning_disabilities/,
    /education week/,
    /independent research/,
  ])) return ["independent-research", "medium", "authority-research-path"];
  if (matchesAny(value, [
    /scope(?:_|\s|and)/,
    /sequence/,
    /methodology/,
    /alignment/,
    /feature set/,
    /architecture/,
    /production\//,
    /prototype/,
    /lesson outline/,
    /dialogue/,
    /product dev/,
  ])) return ["original-product-specification", "medium", "authority-product-spec-path"];
  if (matchesAny(value, [
    /business case/,
    /angel/,
    /investment/,
    /fundraising/,
    /finance & accounting/,
    /pro forma/,
    /valuation/,
    /grant/,
    /proposal/,
    /estimate/,
  ])) return ["fundraising-forecast", "medium", "authority-finance-fundraising-path"];
  if (matchesAny(value, [
    /sales/,
    /trial/,
    /lead/,
    /pricing/,
    /pipeline/,
    /customer/,
    /reseller/,
  ])) return ["sales-material", "medium", "authority-sales-path"];
  if (matchesAny(value, [
    /promotional/,
    /flyer/,
    /marketing/,
    /press release/,
    /screenshots/,
    /video elements/,
    /presentation/,
    /testimonials/,
  ])) return ["marketing-material", "medium", "authority-marketing-path"];
  return ["internal-operations-record", "low", "authority-default-internal"];
}

export function classifyTopic(relativePath) {
  const value = lower(relativePath);
  const extension = extensionOf(relativePath);
  if (TECHNICAL_EXTENSIONS.has(extension)) return ["flash-curriculum-source", "high", "topic-technical-extension"];
  if (isTechnicalAudio(relativePath, extension)) return ["audio-language-assets", "high", "topic-technical-audio-tree"];
  if (/personal\//.test(value)) return ["personal-nonprogram", "high", "topic-personal-path"];
  if (matchesAny(value, [/legal/, /insurance/, /agreement/, /contract/, /shareholder/, /mou\b/, /nda\b/, /lawsuit/, /scam/])) {
    return ["legal-governance", "medium", "topic-legal-path"];
  }
  if (matchesAny(value, [/finance/, /accounting/, /tax/, /investment/, /fund/, /angel/, /business case/, /valuation/, /historical sales/, /revenue/])) {
    return ["finance-fundraising", "medium", "topic-finance-path"];
  }
  if (matchesAny(value, [/research/, /study/, /wwc/, /what works/, /efficacy/, /self-efficacy/])) {
    return ["research-efficacy", "medium", "topic-research-path"];
  }
  if (matchesAny(value, [/alignment/, /standards?/, /teks/, /common core/, /scope_and_sequence/, /curriculum/])) {
    return ["curriculum-standards", "medium", "topic-curriculum-path"];
  }
  if (matchesAny(value, [/product dev/, /reboot/, /2\.0/, /prototype/, /methodology/, /feature/, /architecture/, /production/])) {
    return ["product-design-modernization", "medium", "topic-product-path"];
  }
  if (isEmailLike(relativePath) || matchesAny(value, [/zoom meeting/, /recording/, /chat\.txt$/, /\.ics$/])) {
    return ["correspondence-meetings", "medium", "topic-correspondence-path"];
  }
  if (matchesAny(value, [/partnership/, /biz dev/, /co-venture/, /istation/, /sunburst/])) {
    return ["partnerships-business-development", "medium", "topic-partnership-path"];
  }
  if (matchesAny(value, [/sales/, /trial/, /lead/, /customer/, /pricing/, /pipeline/])) {
    return ["sales-customers-trials", "medium", "topic-sales-path"];
  }
  if (matchesAny(value, [/promotional/, /flyer/, /marketing/, /press/, /screenshot/, /video/, /testimonial/])) {
    return ["marketing-public-relations", "medium", "topic-marketing-path"];
  }
  if (matchesAny(value, [/operations?/, /admin/, /management/, /timeline/, /browser/, /core space/])) {
    return ["operations-administration", "medium", "topic-operations-path"];
  }
  return ["unclassified", "low", "topic-no-specific-rule"];
}

export function classifySensitivity(relativePath, authority) {
  const value = lower(relativePath);
  const tags = new Set();
  if (matchesAny(value, [/medical/, /health/, /patient/, /diagnos/, /hipaa/, /therapy/, /hospital/])) tags.add("health");
  if (matchesAny(value, [
    /bli legal & insurance/,
    /lawsuit/,
    /attorney/,
    /legal/,
    /agreement/,
    /contract/,
    /term sheet/,
    /shareholder/,
    /mou\b/,
    /nda\b/,
    /police/,
    /scam/,
    /case [a-z0-9]/,
  ])) tags.add("legal");
  if (matchesAny(value, [
    /personal finance/,
    /finance & accounting/,
    /tax/,
    /merrill/,
    /coinbase/,
    /bank/,
    /paypal/,
    /payment/,
    /invoice/,
    /sales history/,
    /cumulative sales/,
    /revenue/,
    /pricing/,
    /budget/,
    /forecast/,
    /valuation/,
    /investment/,
  ])) tags.add("financial");
  if (isEmailLike(relativePath) || matchesAny(value, [
    /^help math trials & leads\//,
    /^hm trial requests\//,
    /personal\//,
    /contact/,
    /student/,
    /school targets/,
    /resume/,
    /bio\./,
  ])) tags.add("pii");
  if (matchesAny(value, [/confidential/, /your eyes only/, /private/, /password/, /credential/, /executed nda/])) tags.add("confidential");
  if (authority === "independent-research" || authority === "marketing-material") tags.add("public");
  if (authority === "technical-source-file" || authority === "original-product-specification" || authority === "internal-operations-record") {
    tags.add("internal");
  }
  if (tags.size === 0) tags.add("unknown");
  const precedence = ["health", "legal", "financial", "pii", "confidential", "internal", "public", "unknown"];
  const primary = precedence.find((candidate) => tags.has(candidate));
  const confidence = primary === "unknown" ? "low" : (tags.has("pii") || tags.has("financial") || tags.has("legal") || tags.has("health")) ? "high" : "medium";
  return [primary, [...tags].sort((a, b) => precedence.indexOf(a) - precedence.indexOf(b)), confidence, "sensitivity-path-and-authority-rules"];
}

export function classifyEra(relativePath, mtimeMs) {
  const explicit = [];
  for (const match of relativePath.matchAll(/(?<!\d)(19\d{2}|20\d{2})(?!\d)/g)) {
    const year = Number(match[1]);
    if (year >= 1900 && year <= 2026) explicit.push(year);
  }
  const year = explicit.length ? explicit[0] : new Date(mtimeMs).getFullYear();
  const basis = explicit.length ? "path-year" : "filesystem-mtime";
  const confidence = explicit.length ? "medium" : "low";
  if (!Number.isInteger(year) || year < 1900 || year > 2026) return [null, "undated", basis, "low"];
  if (year < 2000) return [year, "pre-2000", basis, confidence];
  if (year < 2010) return [year, "2000-2009", basis, confidence];
  if (year < 2020) return [year, "2010-2019", basis, confidence];
  return [year, "2020-2026", basis, confidence];
}

function formatFor(relativePath, head) {
  const extension = extensionOf(relativePath);
  let [format, mimeType] = FORMAT_BY_EXTENSION[extension] ?? [extension ? `${extension.toUpperCase()} file` : "unidentified file", "application/octet-stream"];
  const hex = head.toString("hex");
  if (hex.startsWith("25504446")) [format, mimeType] = ["PDF document", "application/pdf"];
  else if (hex.startsWith("504b0304")) {
    if (["docx", "dotx", "pptx", "xlsx"].includes(extension)) {
      [format, mimeType] = FORMAT_BY_EXTENSION[extension];
    } else [format, mimeType] = ["ZIP-compatible archive", "application/zip"];
  } else if (hex.startsWith("d0cf11e0")) {
    if (extension === "fla") [format, mimeType] = ["Adobe Flash authoring file (OLE compound binary)", "application/octet-stream"];
    else [format, mimeType] = FORMAT_BY_EXTENSION[extension] ?? ["OLE compound binary", "application/x-ole-storage"];
  } else if (["465753", "435753", "5a5753"].includes(hex.slice(0, 6))) {
    [format, mimeType] = [`Shockwave Flash movie (${head.subarray(0, 3).toString("ascii")})`, "application/vnd.adobe.flash.movie"];
  }
  return { extension, format, mimeType };
}

async function collectFiles(sourceRoot, current = sourceRoot, result = []) {
  const directory = await opendir(current);
  for await (const entry of directory) {
    const absolutePath = path.join(current, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Refusing a symbolic link in the historical source: ${absolutePath}`);
    if (entry.isDirectory()) await collectFiles(sourceRoot, absolutePath, result);
    else if (entry.isFile()) result.push({ absolutePath, relativePath: portable(path.relative(sourceRoot, absolutePath)) });
    else throw new Error(`Unsupported source entry: ${absolutePath}`);
  }
  return result;
}

async function hashAndInspect(file) {
  const before = await stat(file.absolutePath);
  const hash = createHash("sha256");
  let head = Buffer.alloc(0);
  await new Promise((resolve, reject) => {
    const stream = createReadStream(file.absolutePath);
    stream.on("data", (chunk) => {
      if (head.length < 32) head = Buffer.concat([head, chunk.subarray(0, 32 - head.length)]);
      hash.update(chunk);
    });
    stream.on("error", reject);
    stream.on("end", resolve);
  });
  const after = await stat(file.absolutePath);
  if (before.size !== after.size || before.ino !== after.ino || before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs) {
    throw new Error(`Source changed while hashing: ${file.absolutePath}`);
  }
  return {
    path: file.relativePath,
    bytes: before.size,
    sha256: hash.digest("hex"),
    mtimeMs: before.mtimeMs,
    ...formatFor(file.relativePath, head),
    archivePresence: "present",
  };
}

async function mapWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const index = next++;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, Math.max(1, items.length)) }, run));
  return results;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') { cell += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else cell += character;
    } else if (character === '"') quoted = true;
    else if (character === ",") { row.push(cell); cell = ""; }
    else if (character === "\n") { row.push(cell.replace(/\r$/, "")); rows.push(row); row = []; cell = ""; }
    else cell += character;
  }
  if (cell.length || row.length) { row.push(cell.replace(/\r$/, "")); rows.push(row); }
  const headers = rows.shift() ?? [];
  return rows.filter((candidate) => candidate.some(Boolean)).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

function csvCell(value) {
  const rendered = Array.isArray(value) ? value.join(";") : value == null ? "" : String(value);
  return `"${rendered.replaceAll('"', '""')}"`;
}

function renderCsv(rows, fields) {
  return `${[fields.join(","), ...rows.map((row) => fields.map((field) => csvCell(row[field])).join(","))].join("\n")}\n`;
}

function countBy(records, field) {
  const counts = {};
  for (const record of records) counts[record[field]] = (counts[record[field]] ?? 0) + 1;
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => compareText(left, right)));
}

function addClassification(record) {
  const [authority, authorityConfidence, authorityRule] = classifyAuthority(record.path);
  const [topic, topicConfidence, topicRule] = classifyTopic(record.path);
  const [sensitivity, sensitivityTags, sensitivityConfidence, sensitivityRule] = classifySensitivity(record.path, authority);
  const [year, era, eraBasis, eraConfidence] = classifyEra(record.path, record.mtimeMs);
  return {
    ...record,
    topic,
    topicZh: TOPICS[topic],
    topicConfidence,
    authority,
    authorityZh: AUTHORITY[authority],
    authorityConfidence,
    sensitivity,
    sensitivityZh: SENSITIVITY[sensitivity],
    sensitivityTags,
    sensitivityConfidence,
    year,
    era,
    eraBasis,
    eraConfidence,
    classificationRuleIds: [topicRule, authorityRule, sensitivityRule],
  };
}

async function loadDeletedRecords(currentByHash) {
  const rows = parseCsv(await readFile(path.join(DEDUPE_DIRECTORY, "reviewed-files.csv"), "utf8"));
  const deleted = rows.filter((row) => row.action === "delete");
  if (deleted.length !== EXPECTED_DELETED_DUPLICATES) throw new Error(`Expected ${EXPECTED_DELETED_DUPLICATES} deleted records, found ${deleted.length}`);
  return deleted.map((row) => {
    if (!SHA256_PATTERN.test(row.sha256)) throw new Error(`Invalid deleted-record SHA-256: ${row.relative_path}`);
    const survivor = currentByHash.get(row.sha256)?.[0];
    if (!survivor) throw new Error(`Deleted duplicate has no current byte-identical survivor: ${row.relative_path}`);
    const extension = extensionOf(row.relative_path);
    const [fallbackFormat, fallbackMime] = FORMAT_BY_EXTENSION[extension] ?? [extension ? `${extension.toUpperCase()} file` : "unidentified file", "application/octet-stream"];
    const mtimeMs = Number(row.mtime_ns) / 1_000_000;
    return {
      path: row.relative_path,
      bytes: Number(row.size_bytes),
      sha256: row.sha256,
      mtimeMs,
      extension,
      format: survivor.extension === extension ? survivor.format : fallbackFormat,
      mimeType: survivor.extension === extension ? survivor.mimeType : fallbackMime,
      archivePresence: "deleted-exact-duplicate",
      deletionEvidence: "documentation/historical-office-dedup-2026-07-25/reviewed-files.csv",
      retainedIdenticalPath: row.keep_relative_path,
    };
  });
}

function addDuplicateGroups(records) {
  const byHash = new Map();
  for (const record of records) {
    const group = byHash.get(record.sha256) ?? [];
    group.push(record);
    byHash.set(record.sha256, group);
  }
  const groups = [...byHash.entries()]
    .filter(([, members]) => members.length > 1)
    .map(([sha256, members]) => ({
      duplicateGroupId: `sha256:${sha256}`,
      sha256,
      bytesPerFile: members[0].bytes,
      memberCount: members.length,
      presentCount: members.filter((member) => member.archivePresence === "present").length,
      deletedDuplicateCount: members.filter((member) => member.archivePresence !== "present").length,
      redundantBytes: members[0].bytes * (members.length - 1),
      paths: members.map((member) => member.path).sort(compareText),
    }))
    .sort((left, right) => right.redundantBytes - left.redundantBytes || compareText(left.sha256, right.sha256));
  const groupByHash = new Map(groups.map((group) => [group.sha256, group]));
  return {
    groups,
    records: records.map((record) => ({
      ...record,
      duplicateGroupId: groupByHash.get(record.sha256)?.duplicateGroupId ?? "",
      duplicateGroupSize: groupByHash.get(record.sha256)?.memberCount ?? 1,
    })),
  };
}

async function collectMigrationHashes() {
  const result = new Map();
  const entries = await readdir(path.join(PROJECT_ROOT, "migrations"), { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const manifestPath = path.join(PROJECT_ROOT, "migrations", entry.name, "migration.json");
    let manifest;
    try { manifest = JSON.parse(await readFile(manifestPath, "utf8")); }
    catch (error) { if (error?.code === "ENOENT") continue; throw error; }
    for (const sha256 of [manifest?.source?.flaSha256, manifest?.source?.swfSha256]) {
      if (!SHA256_PATTERN.test(sha256 ?? "")) continue;
      const ids = result.get(sha256) ?? [];
      ids.push(manifest.animationId ?? manifest.id ?? entry.name);
      result.set(sha256, ids);
    }
  }
  return result;
}

async function buildTechnicalCrosswalk(records) {
  const sourceCatalog = JSON.parse(await readFile(path.join(PROJECT_ROOT, "catalog/source-files.json"), "utf8"));
  const animationCatalog = JSON.parse(await readFile(path.join(PROJECT_ROOT, "catalog/animations.json"), "utf8"));
  const sourceByHash = new Map();
  for (const file of sourceCatalog.files) {
    const matches = sourceByHash.get(file.sha256) ?? [];
    matches.push(file.path);
    sourceByHash.set(file.sha256, matches);
  }
  const animationByHash = new Map();
  for (const animation of animationCatalog.animations) {
    for (const sha256 of [animation?.source?.sha256, animation?.pairedFla?.sha256]) {
      if (!SHA256_PATTERN.test(sha256 ?? "")) continue;
      const matches = animationByHash.get(sha256) ?? [];
      matches.push(animation.animationId);
      animationByHash.set(sha256, matches);
    }
  }
  const migrationByHash = await collectMigrationHashes();
  return records
    .filter((record) => TECHNICAL_EXTENSIONS.has(record.extension) || AUDIO_EXTENSIONS.has(record.extension))
    .map((record) => {
      const sourceMatches = [...new Set(sourceByHash.get(record.sha256) ?? [])].sort(compareText);
      const animationIds = [...new Set(animationByHash.get(record.sha256) ?? [])].sort(compareText);
      const migrationIds = [...new Set(migrationByHash.get(record.sha256) ?? [])].sort(compareText);
      const family = AUDIO_EXTENSIONS.has(record.extension) ? "audio" : record.extension.toUpperCase();
      return {
        historicalPath: record.path,
        family,
        extension: record.extension,
        bytes: record.bytes,
        sha256: record.sha256,
        archivePresence: record.archivePresence,
        sourceAssetsExactMatchCount: sourceMatches.length,
        sourceAssetsPaths: sourceMatches,
        migrationCatalogAnimationIds: animationIds,
        migrationWorkspaceIds: migrationIds,
        matchStatus: migrationIds.length
          ? "source-assets-and-migration-workspace-exact-hash"
          : sourceMatches.length
            ? "source-assets-catalog-exact-hash"
            : "no-exact-source-assets-match",
      };
    })
    .sort((left, right) => compareText(left.family, right.family) || compareText(left.historicalPath, right.historicalPath));
}

async function hashFileAt(filePath) {
  const hash = createHash("sha256");
  await new Promise((resolve, reject) => {
    const stream = createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", resolve);
  });
  return hash.digest("hex");
}

async function bindClaims(records) {
  const byPath = new Map(records.map((record) => [record.path, record]));
  const claims = [];
  for (const claim of CLAIMS) {
    const evidence = [];
    for (const item of claim.evidence) {
      if (item.sourceType === "archive") {
        const record = byPath.get(item.path);
        if (!record) throw new Error(`Claim evidence path is absent from the 3,713-path snapshot: ${item.path}`);
        evidence.push({ ...item, sha256: record.sha256, bytes: record.bytes, archivePresence: record.archivePresence });
      } else if (item.sourceType === "repository") {
        const absolutePath = path.join(PROJECT_ROOT, item.path);
        const info = await stat(absolutePath);
        evidence.push({ ...item, sha256: await hashFileAt(absolutePath), bytes: info.size, archivePresence: "repository-current" });
      } else evidence.push({ ...item, sha256: "", bytes: null, archivePresence: "missing" });
    }
    claims.push({ ...claim, evidence });
  }
  return claims;
}

function checksumSet(records) {
  const hash = createHash("sha256");
  for (const record of records) hash.update(`${JSON.stringify([record.path, record.bytes, record.sha256])}\n`);
  return hash.digest("hex");
}

function renderClaimMarkdown(claims) {
  const lines = [
    "# 主张证据台账",
    "",
    "> 状态是本次档案核对结论，不是营销批准。第一方重复陈述不自动升级为独立证实。",
    "",
    "| 主张 | 结论 | 核对摘要 |",
    "|---|---|---|",
  ];
  for (const claim of claims) {
    lines.push(`| ${claim.claimZh} | ${claim.statusZh} | ${claim.conclusionZh.replaceAll("|", "\\|")} |`);
  }
  lines.push("", "## 证据明细", "");
  for (const claim of claims) {
    lines.push(`### ${claim.claimZh}`, "", `- 状态：\`${claim.status}\``, `- 结论：${claim.conclusionZh}`, "", "证据：", "");
    for (const item of claim.evidence) {
      const hash = item.sha256 ? `；SHA-256 \`${item.sha256}\`` : "";
      lines.push(`- ${item.role} — \`${item.path}\`，${item.locator}${hash}`);
    }
    lines.push("");
  }
  lines.push(
    "## 口径边界",
    "",
    "- 5,326,731 美元是内部汇总工作簿的公式结果，不等同于独立审计销售额。",
    "- 28 states 缺逐州、逐客户、逐订单对账清单。",
    "- 95% renewal 与 60–70% renewal 的同档案冲突未解决。",
    "- WWC 的 +31 improvement index 不是 70% improvement；原始 2005 白皮书缺失。",
    "- 73 lessons 是历史范围陈述；当前 source-backed migration catalog 只有 29 个 lesson XML 记录。",
    "- 200/250/300/350 hours 是不同年代、不同产品范围的第一方估算，不能合并使用。",
    "",
  );
  return lines.join("\n");
}

async function writeArtifacts(directory, artifacts) {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  for (const [name, content] of Object.entries(artifacts)) {
    await writeFile(path.join(directory, name), content, { encoding: "utf8", mode: 0o600, flag: "wx" });
  }
  const rows = [];
  for (const name of Object.keys(artifacts).sort(compareText)) {
    const info = await stat(path.join(directory, name));
    rows.push({ path: name, bytes: info.size, sha256: await hashFileAt(path.join(directory, name)) });
  }
  await writeFile(
    path.join(directory, "ARTIFACTS.sha256"),
    rows.map((row) => `${row.sha256}  ${row.path}`).join("\n") + "\n",
    { encoding: "utf8", mode: 0o600, flag: "wx" },
  );
}

async function makeReadOnly(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const candidate = path.join(directory, entry.name);
    if (entry.isDirectory()) { await makeReadOnly(candidate); await chmod(candidate, 0o500); }
    else if (entry.isFile()) await chmod(candidate, 0o400);
    else throw new Error(`Unexpected output entry while applying read-only mode: ${candidate}`);
  }
  await chmod(directory, 0o500);
}

async function scanSnapshot({ source, concurrency }) {
  const sourceRoot = await realpath(source);
  if (sourceRoot !== DEFAULT_SOURCE) throw new Error(`Historical source must resolve exactly to ${DEFAULT_SOURCE}`);
  const sourceInfo = await lstat(sourceRoot);
  if (!sourceInfo.isDirectory()) throw new Error(`Historical source is not a directory: ${sourceRoot}`);
  const discovered = await collectFiles(sourceRoot);
  discovered.sort((left, right) => compareText(left.relativePath, right.relativePath));
  if (discovered.length !== EXPECTED_CURRENT_FILES) {
    throw new Error(`Expected ${EXPECTED_CURRENT_FILES} current source files after reviewed deduplication, found ${discovered.length}`);
  }
  const current = await mapWithConcurrency(discovered, concurrency, hashAndInspect);
  const currentByHash = new Map();
  for (const record of current) {
    const group = currentByHash.get(record.sha256) ?? [];
    group.push(record);
    currentByHash.set(record.sha256, group);
  }
  const deleted = await loadDeletedRecords(currentByHash);
  const classified = [...current, ...deleted].map(addClassification).sort((left, right) => compareText(left.path, right.path));
  if (new Set(classified.map((record) => record.path)).size !== classified.length) throw new Error("Duplicate paths exist in reconstructed snapshot");
  if (classified.length !== EXPECTED_SNAPSHOT_FILES) throw new Error(`Expected ${EXPECTED_SNAPSHOT_FILES} reconstructed paths, found ${classified.length}`);
  const totalBytes = classified.reduce((sum, record) => sum + record.bytes, 0);
  if (totalBytes !== EXPECTED_SNAPSHOT_BYTES) throw new Error(`Expected ${EXPECTED_SNAPSHOT_BYTES} reconstructed bytes, found ${totalBytes}`);
  const grouped = addDuplicateGroups(classified);
  if (grouped.groups.length !== EXPECTED_DUPLICATE_GROUPS) throw new Error(`Expected ${EXPECTED_DUPLICATE_GROUPS} duplicate groups, found ${grouped.groups.length}`);
  const extraDuplicates = grouped.groups.reduce((sum, group) => sum + group.memberCount - 1, 0);
  if (extraDuplicates !== EXPECTED_EXTRA_DUPLICATES) throw new Error(`Expected ${EXPECTED_EXTRA_DUPLICATES} extra duplicate paths, found ${extraDuplicates}`);
  return { sourceRoot, records: grouped.records, duplicateGroups: grouped.groups, totalBytes, extraDuplicates };
}

function parseArgs(argv) {
  const options = { source: DEFAULT_SOURCE, output: DEFAULT_OUTPUT, concurrency: 8, check: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--source") options.source = path.resolve(argv[++index]);
    else if (argument === "--output") options.output = path.resolve(argv[++index]);
    else if (argument === "--concurrency") options.concurrency = Number(argv[++index]);
    else if (argument === "--help") options.help = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }
  if (!Number.isInteger(options.concurrency) || options.concurrency < 1 || options.concurrency > 32) throw new Error("--concurrency must be an integer from 1 to 32");
  return options;
}

async function verifyOutput(output, snapshot) {
  const outputRoot = await realpath(output);
  const manifest = JSON.parse(await readFile(path.join(outputRoot, "manifest.json"), "utf8"));
  if (manifest.snapshot.fileCount !== EXPECTED_SNAPSHOT_FILES || manifest.snapshot.checksumSetSha256 !== checksumSet(snapshot.records)) {
    throw new Error("Historical output manifest does not match the freshly reconstructed snapshot");
  }
  const artifactLines = (await readFile(path.join(outputRoot, "ARTIFACTS.sha256"), "utf8")).trim().split("\n").filter(Boolean);
  for (const line of artifactLines) {
    const match = line.match(/^([a-f0-9]{64})  (.+)$/);
    if (!match) throw new Error(`Malformed ARTIFACTS.sha256 line: ${line}`);
    if (await hashFileAt(path.join(outputRoot, match[2])) !== match[1]) throw new Error(`Output artifact hash mismatch: ${match[2]}`);
  }
  const paths = [outputRoot, ...(await collectFiles(outputRoot)).map((file) => file.absolutePath)];
  for (const candidate of paths) {
    const info = await stat(candidate);
    if ((info.mode & 0o222) !== 0) throw new Error(`Output is writable: ${candidate}`);
  }
  return manifest;
}

export async function buildHistoricalArchive(options = {}) {
  const source = options.source ?? DEFAULT_SOURCE;
  const output = path.resolve(options.output ?? DEFAULT_OUTPUT);
  const concurrency = options.concurrency ?? 8;
  const snapshot = await scanSnapshot({ source, concurrency });
  if (options.check) {
    const manifest = await verifyOutput(output, snapshot);
    return { mode: "check", output, manifest };
  }
  try {
    await lstat(output);
    throw new Error(`Refusing to overwrite existing historical output: ${output}`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  const technical = await buildTechnicalCrosswalk(snapshot.records);
  const claims = await bindClaims(snapshot.records);
  const sourceCatalogSha256 = await hashFileAt(path.join(PROJECT_ROOT, "catalog/source-files.json"));
  const animationsCatalogSha256 = await hashFileAt(path.join(PROJECT_ROOT, "catalog/animations.json"));
  const generatedAt = new Date().toISOString();
  const manifest = {
    schemaVersion: 1,
    generatedAt,
    sourceDirectory: snapshot.sourceRoot,
    custodyBoundary: "read-only external source; outputs contain metadata and short claim excerpts only",
    reconstruction: {
      status: "pre-dedup-path-snapshot-reconstructed",
      presentFilesRehashed: EXPECTED_CURRENT_FILES,
      deletedExactDuplicateRecordsRecoveredFromVerifiedManifest: EXPECTED_DELETED_DUPLICATES,
      deletedContentStillPresent: false,
      evidence: "documentation/historical-office-dedup-2026-07-25/reviewed-files.csv",
    },
    snapshot: {
      fileCount: snapshot.records.length,
      logicalBytes: snapshot.totalBytes,
      checksumSetSha256: checksumSet(snapshot.records),
      duplicateGroups: snapshot.duplicateGroups.length,
      extraDuplicatePaths: snapshot.extraDuplicates,
    },
    classification: {
      method: "deterministic path, extension, signature, and authority heuristics",
      humanAcceptance: false,
      authority: countBy(snapshot.records, "authority"),
      sensitivity: countBy(snapshot.records, "sensitivity"),
      topic: countBy(snapshot.records, "topic"),
      era: countBy(snapshot.records, "era"),
      lowConfidenceReviewCount: snapshot.records.filter((record) => [record.topicConfidence, record.authorityConfidence, record.sensitivityConfidence, record.eraConfidence].includes("low")).length,
    },
    technicalCrosswalk: {
      fileCount: technical.length,
      families: countBy(technical, "family"),
      matchStatus: countBy(technical, "matchStatus"),
      sourceCatalog: { path: "catalog/source-files.json", sha256: sourceCatalogSha256 },
      animationsCatalog: { path: "catalog/animations.json", sha256: animationsCatalogSha256 },
    },
    claims: countBy(claims, "status"),
    readOnlyMode: { directory: "0500", files: "0400" },
  };
  const fileFields = [
    "path", "bytes", "sha256", "extension", "format", "mimeType", "archivePresence",
    "duplicateGroupId", "duplicateGroupSize", "topic", "topicZh", "topicConfidence",
    "authority", "authorityZh", "authorityConfidence", "sensitivity", "sensitivityZh",
    "sensitivityTags", "sensitivityConfidence", "year", "era", "eraBasis", "eraConfidence",
    "retainedIdenticalPath", "classificationRuleIds",
  ];
  const duplicateFields = ["duplicateGroupId", "sha256", "bytesPerFile", "memberCount", "presentCount", "deletedDuplicateCount", "redundantBytes", "paths"];
  const technicalFields = ["historicalPath", "family", "extension", "bytes", "sha256", "archivePresence", "sourceAssetsExactMatchCount", "sourceAssetsPaths", "migrationCatalogAnimationIds", "migrationWorkspaceIds", "matchStatus"];
  const claimFields = ["id", "claimZh", "claim", "statusZh", "status", "conclusionZh", "conclusion"];
  const evidenceRows = claims.flatMap((claim) => claim.evidence.map((item) => ({ claimId: claim.id, claimZh: claim.claimZh, ...item })));
  const reviewQueue = snapshot.records.filter((record) => [record.topicConfidence, record.authorityConfidence, record.sensitivityConfidence, record.eraConfidence].includes("low"));
  const summaryRows = (mapping, counts) => Object.entries(mapping).map(([id, labelZh]) => ({ id, labelZh, count: counts[id] ?? 0 }));
  const readme = `# HELP Math 历史办公室档案目录\n\n生成时间：${generatedAt}\n\n这是一个**私有、只读、元数据级**目录。它不复制 3.3 GB 原始内容，也不应进入网站、Git 或公开分享。目录完成后应用目录 \`0500\`、文件 \`0400\` 权限。\n\n## 快照口径\n\n- 去重前历史路径：**${snapshot.records.length.toLocaleString("en-US")}**\n- 当前重新读取并 SHA-256：**${EXPECTED_CURRENT_FILES.toLocaleString("en-US")}**\n- 已永久删除、从先前验证清单重建的逐字节重复路径：**${EXPECTED_DELETED_DUPLICATES}**\n- 逻辑大小：**${snapshot.totalBytes.toLocaleString("en-US")} bytes**\n- 精确重复组：**${snapshot.duplicateGroups.length}**；额外重复路径：**${snapshot.extraDuplicates}**\n- 快照 checksum-set SHA-256：\`${manifest.snapshot.checksumSetSha256}\`\n\n## 文件\n\n- \`files.csv\` / \`files.jsonl\` / \`files.sha256\`：3,713 条路径、大小、格式、哈希、主题、年代、authority、sensitivity 和重复组。\n- \`duplicate-groups.csv\` / \`duplicate-groups.json\`：54 个精确哈希重复组。\n- \`classification-taxonomy.json\` 及各 summary CSV：分类词表、计数和规则边界。\n- \`classification-review-queue.csv\`：至少一个低置信字段的人工复核队列。\n- \`CLAIM_EVIDENCE_LEDGER.md\` / \`claim-evidence-ledger.json\` / CSV：指定数字的逐条结论与哈希绑定证据。\n- \`technical-source-files.csv\` / \`technical-source-crosswalk.json\`：FLA/SWF/audio/XML/AS 来源专表及 source-assets/catalog/migration 精确哈希对账。\n- \`ARTIFACTS.sha256\`：本目录输出完整性清单。\n\n## 重要边界\n\n分类是确定性的初筛，不是法律、隐私或档案专业人员签署的最终定密。\`sensitivityTags\` 保留多个风险标签；\`sensitivity\` 是便于排序的主标签。38 个 \`deleted-exact-duplicate\` 记录只有此前验证的路径、大小与哈希，内容本身已不存在。\n`;
  const artifacts = {
    "README.md": readme,
    "SENSITIVITY_NOTICE.md": "# Sensitivity notice\n\nThis private inventory contains filenames and paths that may expose names, email addresses, financial, legal, health, or student-related context. Do not commit, deploy, or publicly share it.\n",
    "manifest.json": `${JSON.stringify(manifest, null, 2)}\n`,
    "files.csv": renderCsv(snapshot.records, fileFields),
    "files.jsonl": snapshot.records.map((record) => JSON.stringify(record)).join("\n") + "\n",
    "files.sha256": snapshot.records.map((record) => `${record.sha256}  ${record.path}`).join("\n") + "\n",
    "duplicate-groups.csv": renderCsv(snapshot.duplicateGroups, duplicateFields),
    "duplicate-groups.json": `${JSON.stringify({ schemaVersion: 1, groups: snapshot.duplicateGroups }, null, 2)}\n`,
    "classification-taxonomy.json": `${JSON.stringify({ schemaVersion: 1, authority: AUTHORITY, sensitivity: SENSITIVITY, topics: TOPICS, notes: { primarySensitivity: "severity-sort label; see sensitivityTags for all detected categories", classificationAuthority: "automated triage only", unknown: "requires human review" } }, null, 2)}\n`,
    "authority-summary.csv": renderCsv(summaryRows(AUTHORITY, manifest.classification.authority), ["id", "labelZh", "count"]),
    "sensitivity-summary.csv": renderCsv(summaryRows(SENSITIVITY, manifest.classification.sensitivity), ["id", "labelZh", "count"]),
    "topic-summary.csv": renderCsv(summaryRows(TOPICS, manifest.classification.topic), ["id", "labelZh", "count"]),
    "era-summary.csv": renderCsv(Object.entries(manifest.classification.era).map(([id, count]) => ({ id, count })), ["id", "count"]),
    "classification-review-queue.csv": renderCsv(reviewQueue, fileFields),
    "CLAIM_EVIDENCE_LEDGER.md": renderClaimMarkdown(claims),
    "claim-evidence-ledger.json": `${JSON.stringify({ schemaVersion: 1, generatedAt, claims }, null, 2)}\n`,
    "claim-evidence-ledger.csv": renderCsv(claims, claimFields),
    "claim-evidence-sources.csv": renderCsv(evidenceRows, ["claimId", "claimZh", "role", "sourceType", "path", "locator", "excerpt", "authority", "sha256", "bytes", "archivePresence"]),
    "technical-source-files.csv": renderCsv(technical, technicalFields),
    "technical-source-crosswalk.json": `${JSON.stringify({ schemaVersion: 1, generatedAt, summary: manifest.technicalCrosswalk, files: technical }, null, 2)}\n`,
  };
  const parent = path.dirname(output);
  await mkdir(parent, { recursive: true, mode: 0o700 });
  await chmod(parent, 0o700);
  const staging = path.join(parent, `.${path.basename(output)}.build-${process.pid}`);
  await writeArtifacts(staging, artifacts);
  await rename(staging, output);
  await makeReadOnly(output);
  return { mode: "build", output, manifest };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log("Usage: node scripts/build-historical-office-archive.mjs [--check] [--source PATH] [--output PATH] [--concurrency N]");
    return;
  }
  const result = await buildHistoricalArchive(options);
  console.log(`${result.mode === "check" ? "Verified" : "Created"} read-only historical archive catalog: ${result.output}`);
  console.log(`Snapshot: ${result.manifest.snapshot.fileCount} paths, ${result.manifest.snapshot.logicalBytes} bytes, ${result.manifest.snapshot.duplicateGroups} duplicate groups`);
  console.log(`Checksum set SHA-256: ${result.manifest.snapshot.checksumSetSha256}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    console.error(error.stack ?? error.message);
    process.exitCode = 1;
  });
}
