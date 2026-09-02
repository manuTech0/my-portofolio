import type { Term } from "../types";
import { defaultHelpCommand, defineCommand } from "../utils";
import * as m from "$lib/paraglide/messages";

export default defineCommand({
  command: "experience",
  title: "Experience",
  description: "Work experience",
  category: "portfolio",
  aliases: ["work", "jobs"],
  usage: "experience",
  permission: ["*"],
  hidden: false,
  examples: ["experience"],
  content: {
    body: `### AI Engineering Testing

**allInclusiveVilla.net — 2 months**

Worked on testing AI-related functionality and web applications, focusing on finding issues across different user flows and verifying whether the system behaved as expected.

### Administration Intern

**BKAD Majalengka — 4 months**

Completed a four-month internship as an administrative staff member, working with administrative processes, data, and day-to-day office operations.`,
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
    return md.render(m["experience.body"]());
  },
});
