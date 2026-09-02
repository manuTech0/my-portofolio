import type { Term } from "../types";
import { defaultHelpCommand, defineCommand } from "../utils";
import { getCwdDisplay } from "../fs";

export default defineCommand({
  command: "pwd",
  title: "PWD",
  description: "Print working directory (virtual filesystem)",
  category: "utils",
  aliases: ["cwd", "whereami"],
  usage: "pwd",
  permission: ["*"],
  hidden: false,
  examples: ["pwd"],
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
    return md.render(`\`\`\`
${getCwdDisplay()}
\`\`\``);
  },
});