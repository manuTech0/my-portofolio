import type { Term } from "../types";
import { defaultHelpCommand, defineCommand } from "../utils";
import { resolvePath, setCwd } from "../fs";

export default defineCommand({
  command: "cd",
  title: "CD",
  description: "Change directory (virtual filesystem)",
  category: "utils",
  aliases: ["chdir"],
  usage: "cd [path]",
  permission: ["*"],
  hidden: false,
  examples: ["cd", "cd projects", "cd ..", "cd ~"],
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

    const target = positional[0] ?? "~";
    const { node, path } = resolvePath(target);

    if (!node || node.kind !== "dir") {
      return md.render(`\`\`\`
bash: cd: ${target}: No such file or directory
\`\`\``);
    }

    setCwd(path);
    return "";
  },
});