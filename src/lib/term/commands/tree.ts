import type { Term } from "../types";
import { defaultHelpCommand, defineCommand } from "../utils";
import { getCwd, getCwdDisplay, nodeAt, renderTree } from "../fs";

export default defineCommand({
  command: "tree",
  title: "Tree",
  description: "Show filesystem tree",
  category: "utils",
  aliases: ["shows", "files"],
  usage: "tree",
  permission: ["*"],
  hidden: false,
  examples: ["tree"],
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
  async exec(args, md) {
    if (args.get("--help")) {
      return defaultHelpCommand(md, this);
    }
    const node = nodeAt(getCwd());
    return md.render(`\`\`\`
${renderTree(node, getCwdDisplay())}
\`\`\``);
  },
});