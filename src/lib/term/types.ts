import type { MarkdownIt } from "markdown-it";

export namespace Term {
  export type ArgsMetadata = {
    name: string;
    type: "string" | "boolean" | "number" | null;
    required: boolean;
    default?: string;
    description: string;
  } | null
  export type CommandMetadata<T extends Record<string, Term.ArgsMetadata>> = {
    command: string;
    title: string;
    description: string;
    category: string;
    aliases: string[];
    usage: string;
    permission: string[]
    hidden: boolean;
    tags?: string[]
    examples: string[];
    content: {
      [key: string]: string
    };
    args: T
    acceptsPositional?: boolean
    exec: (
      args: Map<keyof T, string | boolean | number | null>,
      md: MarkdownIt,
      positional: string[]
    ) => Promise<string>
  }
}
