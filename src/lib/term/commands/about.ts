import type { Term } from "../types";
import { defaultHelpCommand, defineCommand } from "../utils";

export default defineCommand({
  command: "about",
  title: "About",
  description: "About me",
  category: "portfolio",
  aliases: ["me", "whoami"],
  usage: "about",
  permission: ["*"],
  hidden: false,
  examples: ["about"],
  content: {
    body: `I'm Manu, a junior backend developer focused on authentication and authorization.

Most of my work revolves around building backend systems that handle users, identities, sessions, permissions, and access control. I'm particularly interested in the parts of an application that need to be reliable and predictable before anything else can work properly.

My primary language is TypeScript, while I also work with Go, Laravel/PHP, and Rust. I enjoy building backend services, APIs, and infrastructure-oriented projects, especially when I can understand how the system works underneath instead of relying entirely on abstractions.`,
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
    return md.render(this.content.body);
  },
});
