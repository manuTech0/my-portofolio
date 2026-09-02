import type { Term } from "../types";
import { defineCommand } from "../utils";
import * as m from "$lib/paraglide/messages";

export default defineCommand({
  command: "help",
  title: "Help",
  description: "Show available commands",
  category: "utils",
  aliases: ["?", "commands"],
  usage: "help",
  permission: ["*"],
  hidden: false,
  examples: ["help"],
  content: {
    body: `---

Available commands:

- \`about\` — About me
- \`projects\` — View projects
- \`skills\` — Technical skills
- \`experience\` — Work experience
- \`education\` — Education
- \`contact\` — Contact
- \`ls\` — List directory contents
- \`cd\` — Change directory
- \`cat\` — Read a file
- \`pwd\` — Print working directory
- \`tree\` — Show filesystem tree
- \`clear\` — Clear terminal
- \`help\` — Show this help
- \`logout\` — End this session`,
  },
  args: {},
  async exec(_args, md) {
    return md.render(m["help.body"]());
  },
});
