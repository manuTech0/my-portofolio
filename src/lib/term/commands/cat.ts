import type { Term } from "../types";
import { defaultHelpCommand, defineCommand } from "../utils";
import { resolvePath } from "../fs";

export default defineCommand({
  command: "cat",
  title: "CAT",
  description: "Read a file (virtual filesystem)",
  category: "utils",
  aliases: ["read", "open"],
  usage: "cat <file>",
  permission: ["*"],
  hidden: false,
  examples: ["cat about.md", "cd projects/notoofly-taru && cat README.md"],
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

    const target = positional[0];
    if (!target) {
      throw new Error("Usage: cat <file>");
    }

    const { node } = resolvePath(target);

    if (!node) {
      return md.render(`\`\`\`
cat: ${target}: No such file or directory
\`\`\``);
    }

    if (node.kind === "dir") {
      return md.render(`\`\`\`
cat: ${target}: Is a directory
\`\`\``);
    }

    return md.render(node.content);
  },
});