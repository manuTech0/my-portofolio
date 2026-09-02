import type { Term } from "../types";
import { defaultHelpCommand, defineCommand } from "../utils";
import * as m from "$lib/paraglide/messages";

export default defineCommand({
  command: "education",
  title: "Education",
  description: "Education",
  category: "portfolio",
  aliases: ["edu", "school"],
  usage: "education",
  permission: ["*"],
  hidden: false,
  examples: ["education"],
  content: {
    body: `### SMKN 1 Maja

**Software Engineering (Rekayasa Perangkat Lunak)**`,
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
    return md.render(m["education.body"]());
  },
});
