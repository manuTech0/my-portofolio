export type Project = {
  slug: string;
  name: string;
  annotation: string;
  description: string;
  children?: Project[];
};

export const projects: Project[] = [
  {
    slug: "notoofly-automation",
    name: "Notoofly Automation",
    annotation: "Owner & Founder — open-source automation & self-hosted ecosystem",
    description:
      "An open-source project ecosystem focused on automation and self-hosted software.",
    children: [
      {
        slug: "notoofly-taru",
        name: "Notoofly Taru",
        annotation: "Self-hosted, mobile-first AI Agent (Git-native workflows)",
        description:
          "A **self-hosted, mobile-first AI Agent** with Git-native workflows and deployment support, designed around giving users more control over how their AI agent and related workloads are deployed.",
      },
    ],
  },
  {
    slug: "license-server",
    name: "License Server",
    annotation: "License server for software licensing & validation",
    description:
      "A separate portfolio project focused on building a license server for managing software licensing and validating application access.",
  },
];

export function renderProjectsTree(nodes: Project[] = projects): string {
  const lines: string[] = ["projects/"];

  function build(items: Project[], prefix: string) {
    items.forEach((project, index) => {
      const isLast = index === items.length - 1;
      const branch = isLast ? "└── " : "├── ";
      const annotation = `  # ${project.annotation}`;

      if (project.children?.length) {
        lines.push(`${prefix}${branch}${project.slug}/${annotation}`);
        build(project.children, `${prefix}${isLast ? "    " : "│   "}`);
      } else {
        lines.push(`${prefix}${branch}${project.slug}${annotation}`);
      }
    });
  }

  build(nodes, "");
  return lines.join("\n");
}