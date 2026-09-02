import type { Term } from "../types";
import { defaultHelpCommand, defineCommand } from "../utils";

export default defineCommand({
  command: "skills",
  title: "Skills",
  description: "Technical skills",
  category: "portfolio",
  aliases: ["tech", "stack"],
  usage: "skills",
  permission: ["*"],
  hidden: false,
  examples: ["skills"],
  content: {
    body: `### Programming Languages

* **TypeScript — 60%**
* **Go — 25%**
* **Laravel / PHP — 10%**
* **Rust — 5%**

### Backend & Security

* Authentication
* Authorization
* RBAC (Role-Based Access Control)
* OIDC
* Session management
* API key management
* User management
* Access control
* Backend API development

### Focus

My main area is **identity and access management** — making sure users are authenticated correctly, permissions are enforced, and backend resources are only accessible to the right actors.`,
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
