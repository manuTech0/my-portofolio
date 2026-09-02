import MarkdownIt, { type MarkdownIt as MarkdownItType } from "markdown-it";
import * as commands from "./commands/"
import type { Term } from "./types";
import { markdownItHandlebars, parseArgs } from "./utils";
const commandsRegistry = Object.values(commands)
function searchCommand(query: string) {
  const q = query.toLowerCase();

  const all = commandsRegistry.filter((cmd) => {
    return (
      cmd.command.includes(q) ||
      cmd.description.toLowerCase().includes(q) ||
      cmd.aliases.some(alias =>
        alias === q || alias.includes(q)
      )
    );
  });

  const exact = all.filter(cmd => cmd.command === q);
  if (exact.length) return exact;

  const aliasExact = all.filter(cmd => cmd.aliases.some(alias => alias === q));
  if (aliasExact.length) return aliasExact;

  return all;
}
export async function CMDExec(
  query?: string,
  ...args: string[]
) {
  const md = new MarkdownIt();

  md.use(markdownItHandlebars);

  const command = searchCommand(query ?? "")[0];

  if (!command) {
    throw new Error(
      `bash: ${query}: command not found`
    );
  }

  const keyList = Object.keys(command.args) as Array<keyof typeof command.args>;
  const keyListStrings = keyList as string[];

  const flagArgs: string[] = [];
  const positional: string[] = [];

  for (const arg of args) {
    const key = arg.indexOf("=") === -1 ? arg : arg.slice(0, arg.indexOf("="));
    if (keyListStrings.includes(key)) {
      flagArgs.push(arg);
    } else {
      positional.push(arg);
    }
  }

  if (positional.length > 0 && !command.acceptsPositional) {
    throw new Error(
      `bash: ${command.command}: unexpected argument '${positional[0]}'`
    );
  }

  const parsed = parseArgs<keyof typeof command.args>(flagArgs, keyList);

  return await command.exec(
    parsed,
    md,
    positional
  );
}
