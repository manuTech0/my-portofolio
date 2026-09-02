import about from "./commands/about";
import contact from "./commands/contact";
import education from "./commands/education";
import experience from "./commands/experience";
import help from "./commands/help";
import skills from "./commands/skills";
import { projects, type Project } from "./project-data";

export type FSNode =
  | { kind: "file"; name: string; content: string }
  | { kind: "dir"; name: string; children: FSNode[] };

function projectDir(project: Project): FSNode {
  const children: FSNode[] = [
    {
      kind: "file",
      name: "README.md",
      content: `# ${project.name}

${project.description}`,
    },
  ];

  for (const child of project.children ?? []) {
    children.push(projectDir(child));
  }

  return { kind: "dir", name: project.slug, children };
}

function buildRoot(): FSNode {
  return {
    kind: "dir",
    name: "~",
    children: [
      { kind: "file", name: "about.md", content: about.content.body },
      { kind: "dir", name: "projects", children: projects.map(projectDir) },
      { kind: "file", name: "skills.md", content: skills.content.body },
      { kind: "file", name: "experience.md", content: experience.content.body },
      { kind: "file", name: "education.md", content: education.content.body },
      { kind: "file", name: "contact.md", content: contact.content.body },
      { kind: "file", name: "help.md", content: help.content.body },
    ],
  };
}

const root: FSNode = buildRoot();

let cwd: string[] = [];

export function getCwd(): string[] {
  return [...cwd];
}

export function getCwdDisplay(): string {
  return cwd.length === 0 ? "~" : `~/${cwd.join("/")}`;
}

export function setCwd(path: string[]): void {
  cwd = [...path];
}

export function resetFS(): void {
  cwd = [];
}

export function nodeAt(path: string[]): FSNode {
  let node: FSNode = root;
  for (const segment of path) {
    if (node.kind !== "dir") break;
    node = node.children.find((entry) => entry.name === segment) ?? node;
  }
  return node;
}

function normalize(segments: string[]): string[] {
  const out: string[] = [];
  for (const segment of segments) {
    if (segment === "" || segment === ".") continue;
    if (segment === "..") {
      out.pop();
      continue;
    }
    out.push(segment);
  }
  return out;
}

export function resolvePath(raw: string): { node: FSNode | null; path: string[] } {
  let pathStr = raw.trim();
  if (pathStr === "~") {
    pathStr = "/";
  } else if (pathStr.startsWith("~/")) {
    pathStr = pathStr.slice(1);
  }

  const parts = pathStr.split("/");
  const isAbsolute = pathStr.startsWith("/");
  const base = isAbsolute ? [] : cwd;
  const target = normalize([...base, ...parts]);

  let node: FSNode = root;
  for (const segment of target) {
    if (node.kind !== "dir") return { node: null, path: target };
    const child = node.children.find((entry) => entry.name === segment);
    if (!child) return { node: null, path: target };
    node = child;
  }

  return { node, path: target };
}

export function listNames(node: FSNode): string[] {
  if (node.kind === "file") return [node.name];
  return node.children.map((entry) =>
    entry.kind === "dir" ? `${entry.name}/` : entry.name,
  );
}

function treeLines(node: FSNode, prefix: string, lines: string[]): void {
  const entries = node.kind === "dir" ? node.children : [];
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const isLast = i === entries.length - 1;
    const branch = isLast ? "└── " : "├── ";
    lines.push(`${prefix}${branch}${entry.name}${entry.kind === "dir" ? "/" : ""}`);
    if (entry.kind === "dir") {
      treeLines(entry, `${prefix}${isLast ? "    " : "│   "}`, lines);
    }
  }
}

export function renderTree(node: FSNode, rootLabel: string): string {
  const lines: string[] = [`${rootLabel}/`];
  treeLines(node, "", lines);
  return lines.join("\n");
}