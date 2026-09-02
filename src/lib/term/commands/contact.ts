import type { Term } from "../types";
import { defaultHelpCommand, defineCommand } from "../utils";

export default defineCommand({
  command: "contact",
  title: "Contact",
  description: "Contact",
  category: "portfolio",
  aliases: ["mail", "email", "reach"],
  usage: "contact",
  permission: ["*"],
  hidden: false,
  examples: ["contact"],
  content: {
    body: `Interested in working together, discussing a backend project, or talking about authentication and authorization?

**Get in touch with me through my portfolio or GitHub.**

* **Email** — [maulananurfanoto10@gmail.com](mailto:maulananurfanoto10@gmail.com)
* **GitHub** — [github.com/manuTech0](https://github.com/manuTech0)
* **WhatsApp** — [+62 8511-1323-432](https://wa.me/6285111323432)`,
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
