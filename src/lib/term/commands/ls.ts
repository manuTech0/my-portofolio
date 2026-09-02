import type { Term } from "../types";
import { defaultHelpCommand, defineCommand } from "../utils";
import { getCwd, listNames, nodeAt, resolvePath } from "../fs";

export default defineCommand({
  command: "ls",
  title: "LS",
  description: "List directory contents (virtual filesystem)",
  category: "utils",
  aliases: ["list", "dir"],
  usage: "ls [path]",
  permission: ["*"],
  hidden: false,
  examples: ["ls", "ls projects", "ls --help"],
  content: {
    body: "",
  },
  args: {
    "--help": {
      description: "View Help",
      name: "Help",
      required: false,
      type: null,
    },
  },
  acceptsPositional: true,
  async exec(args, md, positional) {
    if (args.get("--help")) {
      return defaultHelpCommand(md, this);
    }

    const raw = positional[0];
    const node = raw ? resolvePath(raw).node : nodeAt(getCwd());

    if (!node) {
      return md.render(`\`\`\`
ls: cannot access '${raw}': No such file or directory
\`\`\``);
    }

    const names = listNames(node);
    return md.render(`\`\`\`
${names.join("\n")}
\`\`\``);
  },
});