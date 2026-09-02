import type { MarkdownIt } from "markdown-it";
import type { Term } from "./types";
import Handlebars from "handlebars"

export function defineCommand<T extends Record<string, Term.ArgsMetadata>>(data: Term.CommandMetadata<T>) {
  return data;
}


export function markdownItHandlebars(
  md: MarkdownIt,
  options?: {
    helpers?: Record<string, Handlebars.HelperDelegate>;
  }
) {
  if (options?.helpers) {
    for (const [name, helper] of Object.entries(options.helpers)) {
      Handlebars.registerHelper(name, helper);
    }
  }

  const defaultRender = md.render.bind(md);

  md.render = (src: string, env?: any) => {
    const template = Handlebars.compile(src);

    const markdown = template(env ?? {});

    return defaultRender(markdown, env);
  };
}

export function parseArgs<T extends string>(
  args: string[],
  keyList: readonly T[]
): Map<T, string | number | boolean | null> {
  const map = new Map<T, string | number | boolean | null>();

  for (const key of keyList) {
    map.set(key, null);
  }

  for (const arg of args) {
    let key: T;
    let value: string | number | boolean;

    const index = arg.indexOf("=");

    if (index === -1) {
      key = arg as T;
      value = true;
    } else {
      key = arg.slice(0, index) as T;

      const raw = arg.slice(index + 1);

      if (raw === "") {
        value = true;
      } else if (raw === "true") {
        value = true;
      } else if (raw === "false") {
        value = false;
      } else if (!Number.isNaN(Number(raw))) {
        value = Number(raw);
      } else {
        value = raw;
      }
    }

    if (!keyList.includes(key)) {
      throw new Error(`Args key not defined: ${key}`);
    }

    map.set(key, value);
  }

  return map;
}

export function splitArgs(input: string): string[] {
  const args: string[] = [];

  let current = "";
  let quote: '"' | "'" | null = null;

  for (const char of input.trim()) {
    if (char === '"' || char === "'") {
      if (quote === null) {
        quote = char;
      } else if (quote === char) {
        quote = null;
      } else {
        current += char;
      }

      continue;
    }

    if (char === " " && quote === null) {
      if (current.length > 0) {
        args.push(current);
        current = "";
      }

      continue;
    }

    current += char;
  }

  if (current.length > 0) {
    args.push(current);
  }

  return args;
}
export async function defaultHelpCommand(
  md: MarkdownIt,
  data: Term.CommandMetadata<Record<string, Term.ArgsMetadata>>
) {
  const options = Object.entries(data.args ?? {}).map(([flag, option]) => {
    const usage =
      option?.type === "boolean"
        ? flag
        : `${flag}=<${option?.type}>`;

    const extras = [
      option?.required ? "required" : undefined,
      option?.default !== undefined ? `default: ${option?.default}` : undefined,
    ]
      .filter(Boolean)
      .join(", ");

    return [
      `- \`${usage}\``,
      `  - **${option?.name}**`,
      `  - ${option?.description}`,
      extras ? `  - *${extras}*` : undefined,
    ]
      .filter(Boolean)
      .join("\n");
  });

  const sections: string[] = [
    `# ${data.title}`,
    "",
    data.description,
    "",
    "## Usage",
    "```sh",
    data.usage,
    "```",
  ];

  if (data.aliases.length) {
    sections.push(
      "",
      "## Aliases",
      data.aliases.map(alias => `- \`${alias}\``).join("\n")
    );
  }

  sections.push(
    "",
    "## Category",
    data.category
  );

  if (data.permission.length) {
    sections.push(
      "",
      "## Permissions",
      data.permission.map(permission => `- \`${permission}\``).join("\n")
    );
  }

  if (data.tags?.length) {
    sections.push(
      "",
      "## Tags",
      data.tags.map(tag => `- \`${tag}\``).join("\n")
    );
  }

  if (options.length) {
    sections.push(
      "",
      "## Options",
      options.join("\n\n")
    );
  }

  if (data.examples.length) {
    sections.push(
      "",
      "## Examples",
      "```sh",
      data.examples.join("\n"),
      "```"
    );
  }
  return md.render(sections.join("\n"));
}
