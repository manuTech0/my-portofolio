import type { Term } from "../types";
import { defaultHelpCommand, defineCommand } from "../utils";

export default defineCommand({
  aliases: ["test", "hello"],
  command: "hello-world",
  category: "utils",
  description: "Untuk testing",
  examples: ["hello-world", 'hello-world --name="Maulana Nurfanoto"'],
  hidden: false,
  permission: ["*"],
  title: "Hello World",
  usage: "hello-world --[OPTIONS]",
  content: {
    "without-name": "# Hello World!",
    "with-name": "# Hello {{name}}!"
  },
  args: {
    "--name": {
      description: "Name for insrted to text",
      name: "Name",
      required: false,
      type: "string",
    },
    "--help": {
      description: "View Help",
      name: "Help",
      required: false,
      type: null,
    }
  },
  async exec(args, md) {
    if (args.get("--help")) {
      return defaultHelpCommand(md, this)
    }
    const name = args.get("--name")
    if (typeof name === "string") {
      return md.render(this.content["with-name"], { name })
    } else {
      return md.render(this.content["without-name"])
    }
  },
})
