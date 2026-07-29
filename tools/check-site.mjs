import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === ".git") return [];
      return walk(fullPath);
    }
    return [fullPath];
  });
}

function decodePath(value) {
  try {
    return decodeURI(value);
  } catch (_) {
    return value;
  }
}

const htmlFiles = walk(root).filter((file) => file.endsWith(".html"));
const errors = [];
let checkedReferences = 0;

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const relativeFile = path.relative(root, file);

  if (!/<html\s+lang="zh-CN"/i.test(html)) {
    errors.push(`${relativeFile}: missing zh-CN html language`);
  }
  if (!/<meta\s+name="viewport"/i.test(html)) {
    errors.push(`${relativeFile}: missing viewport metadata`);
  }

  const ids = Array.from(html.matchAll(/\sid="([^"]+)"/g), (match) => match[1]);
  const duplicateIds = ids.filter(
    (id, index) => ids.indexOf(id) !== index
  );
  for (const id of new Set(duplicateIds)) {
    errors.push(`${relativeFile}: duplicate id "${id}"`);
  }

  const references = Array.from(
    html.matchAll(/\s(?:href|src)="([^"]+)"/g),
    (match) => match[1]
  );

  for (const reference of references) {
    if (
      reference.startsWith("#") ||
      /^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(reference)
    ) {
      continue;
    }

    const pathOnly = decodePath(reference.split(/[?#]/, 1)[0]);
    const target = path.resolve(path.dirname(file), pathOnly);
    checkedReferences += 1;
    if (!fs.existsSync(target)) {
      errors.push(
        `${relativeFile}: broken reference "${reference}" -> ${path.relative(root, target)}`
      );
    }
  }
}

const docsRoot = path.join(root, "docs");
const markdownRoot = path.join(root, "markdown");
const docsHtmlFiles = walk(docsRoot).filter((file) => file.endsWith(".html"));
const markdownFiles = walk(markdownRoot).filter((file) => file.endsWith(".md"));
let checkedMarkdownReferences = 0;

for (const htmlFile of docsHtmlFiles) {
  const relativePath = path.relative(docsRoot, htmlFile);
  const markdownPath = path.join(
    markdownRoot,
    relativePath.replace(/\.html$/i, ".md")
  );
  if (!fs.existsSync(markdownPath)) {
    errors.push(
      `${path.relative(root, htmlFile)}: missing Markdown pair ${path.relative(root, markdownPath)}`
    );
  }
}

for (const markdownFile of markdownFiles) {
  const relativePath = path.relative(markdownRoot, markdownFile);
  const htmlPath = path.join(
    docsRoot,
    relativePath.replace(/\.md$/i, ".html")
  );
  if (!fs.existsSync(htmlPath)) {
    errors.push(
      `${path.relative(root, markdownFile)}: missing HTML pair ${path.relative(root, htmlPath)}`
    );
  }

  const markdown = fs.readFileSync(markdownFile, "utf8");
  const references = Array.from(
    markdown.matchAll(/\[[^\]]*]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g),
    (match) => match[1]
  );

  for (const reference of references) {
    if (
      reference.startsWith("#") ||
      /^(?:https?:|mailto:|tel:|data:)/i.test(reference)
    ) {
      continue;
    }

    const pathOnly = decodePath(reference.split(/[?#]/, 1)[0]);
    const target = path.resolve(path.dirname(markdownFile), pathOnly);
    checkedMarkdownReferences += 1;
    if (!fs.existsSync(target)) {
      errors.push(
        `${path.relative(root, markdownFile)}: broken Markdown reference "${reference}" -> ${path.relative(root, target)}`
      );
    }
  }
}

if (errors.length > 0) {
  console.error(`Site check failed with ${errors.length} error(s):`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(
  `Site check passed: ${htmlFiles.length} HTML files, ${markdownFiles.length} Markdown pairs, ${checkedReferences} HTML references, ${checkedMarkdownReferences} Markdown references.`
);
