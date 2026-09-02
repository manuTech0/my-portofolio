# manu-portofolio

Personal portfolio website for **Maulana Nurfanoto (Manu)** — a junior backend developer focused on authentication, authorization, and identity access management.

The site is built as an interactive terminal/SSH simulator inside a Windows XP-inspired desktop environment. Visitors can explore the portfolio by typing commands or clicking through the desktop UI.

## Tech Stack

- **Framework** — SvelteKit
- **Styling** — Tailwind CSS v4
- **UI Components** — shadcn-svelte, bits-ui
- **Markdown** — mdsvex
- **i18n** — Paraglide (English, Indonesian)
- **Icons** — Phosphor Svelte
- **Runtime** — Bun

## Getting Started

```sh
# install dependencies
bun install

# start dev server
bun run dev
```

## Building

```sh
bun run build
```

Preview the production build with `bun run preview`.

## Project Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── app/          # Terminal (ssh.svelte) & Desktop (desktop.svelte)
│   │   └── ui/           # shadcn-svelte primitives
│   ├── term/
│   │   ├── commands/     # about, projects, skills, experience, education, contact ...
│   │   ├── project-data.ts
│   │   ├── exec.ts
│   │   └── fs.ts         # virtual filesystem for ls, cd, cat, tree
│   └── paraglide/        # auto-generated i18n
├── routes/
│   └── +page.svelte      # entry point
└── app.html
```

## Available Terminal Commands

| Command      | Description              |
| ------------ | ------------------------ |
| `about`      | About me                 |
| `projects`   | View projects            |
| `skills`     | Technical skills         |
| `experience` | Work experience          |
| `education`  | Education                |
| `contact`    | Contact information      |
| `ls`         | List directory contents  |
| `cd`         | Change directory         |
| `cat`        | Read a file              |
| `pwd`        | Print working directory  |
| `tree`       | Show filesystem tree     |
| `clear`      | Clear terminal           |
| `help`       | Show available commands  |
| `logout`     | End session              |

## Contact

- **Email** — [maulananurfanoto10@gmail.com](mailto:maulananurfanoto10@gmail.com)
- **GitHub** — [github.com/manuTech0](https://github.com/manuTech0)
- **WhatsApp** — [+62 8511-1323-432](https://wa.me/6285111323432)
