import type { Term } from "../types";
import { defaultHelpCommand, defineCommand } from "../utils";
import { renderProjectsTree } from "../project-data";

export default defineCommand({
  command: "projects",
  title: "Projects",
  description: "View projects",
  category: "portfolio",
  aliases: ["project", "repos", "repo"],
  usage: "projects",
  permission: ["*"],
  hidden: false,
  examples: ["projects"],
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
${renderProjectsTree()}
\`\`\``);
  },
});