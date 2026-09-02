<script lang="ts">
  import TerminalIcon from "phosphor-svelte/lib/TerminalIcon";
  import MinusIcon from "phosphor-svelte/lib/MinusIcon";
  import SquareIcon from "phosphor-svelte/lib/SquareIcon";
  import XIcon from "phosphor-svelte/lib/XIcon";
  import CaretDownIcon from "phosphor-svelte/lib/CaretDownIcon";
  import CaretRightIcon from "phosphor-svelte/lib/CaretRightIcon";
  import EnvelopeSimpleIcon from "phosphor-svelte/lib/EnvelopeSimpleIcon";
  import PhoneIcon from "phosphor-svelte/lib/PhoneIcon";
  import GithubLogoIcon from "phosphor-svelte/lib/GithubLogoIcon";
  import LinkedinLogoIcon from "phosphor-svelte/lib/LinkedinLogoIcon";
  import { Card, CardHeader, CardContent } from "$lib/components/ui/card";
  import { Separator } from "$lib/components/ui/separator";
  import { Button } from "$lib/components/ui/button";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import { onMount, tick, type Snippet } from "svelte";
  import Avatar from "../ui/avatar/avatar.svelte";
  import AvatarImage from "../ui/avatar/avatar-image.svelte";
  import AvatarFallback from "../ui/avatar/avatar-fallback.svelte";

  // children receives (1) the active portfolio section id and (2) a
  // navigate function that switches section + opens/restores the window —
  // the exact same action the menubar/taskbar use.
  // {#snippet children(section, navigate)} ... {/snippet}
  let { children }: { children?: Snippet<[string, (id: string) => void]> } =
    $props();

  // ---- Portfolio menubar sections ----
  const sections = [
    { id: "terminal", label: "Terminal", title: "Terminal" },
    { id: "about", label: "Tentang", title: "Tentang Saya" },
    { id: "projects", label: "Proyek", title: "Proyek" },
    { id: "skills", label: "Skill", title: "Skill" },
    { id: "contact", label: "Kontak", title: "Kontak" },
  ] as const;

  let activeSection = $state<string>("terminal");
  const activeTitle = $derived(
    sections.find((s) => s.id === activeSection)?.title ?? "Terminal",
  );

  // ---- Profile dropdown data (ganti dengan data asli kamu) ----
  const skillsBreadcrumb = [
    "Automation",
    "Authentication",
    "Authorization",
    "Backend",
  ] as const;

  // ---- Window state (Svelte 5 runes) ----
  let isOpen = $state(false);
  let isMinimized = $state(false);
  let isMaximized = $state(false);

  // ---- Clock ----
  let now = $state(new Date());
  const timeString = $derived(
    now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  );

  $effect(() => {
    const interval = setInterval(() => {
      now = new Date();
    }, 1000);
    return () => clearInterval(interval);
  });

  // ---- Wallpaper particles (falling-star style, canvas, super slow) ----
  let particleCanvas: HTMLCanvasElement;

  onMount(() => {
    const ctx = particleCanvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    type Particle = {
      x: number;
      y: number;
      size: number;
      speed: number;
      opacity: number;
    };

    let particles: Particle[] = [];
    let rafId = 0;

    function resizeCanvas() {
      particleCanvas.width = window.innerWidth;
      particleCanvas.height = window.innerHeight;
    }

    function createParticles() {
      // Low density — this should read as a few quiet drifting specks,
      // not a starfield.
      const count = Math.round(
        (particleCanvas.width * particleCanvas.height) / 22000,
      );
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * particleCanvas.width,
        y: Math.random() * particleCanvas.height,
        size: Math.random() * 1.2 + 0.4,
        // Super lambat: butuh beberapa menit untuk menyeberangi layar.
        speed: Math.random() * 0.035 + 0.015,
        opacity: Math.random() * 0.35 + 0.1,
      }));
    }

    function drawFrame() {
      ctx!.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
      for (const p of particles) {
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx!.fill();

        if (!prefersReducedMotion) {
          // Diagonal drift, seperti bintang jatuh yang sangat pelan.
          p.x += p.speed * 0.5;
          p.y += p.speed;

          if (p.y - p.size > particleCanvas.height) {
            p.y = -p.size;
            p.x = Math.random() * particleCanvas.width;
          }
          if (p.x - p.size > particleCanvas.width) {
            p.x = -p.size;
          }
        }
      }
    }

    function loop() {
      drawFrame();
      if (!prefersReducedMotion) {
        rafId = requestAnimationFrame(loop);
      }
    }

    function handleResize() {
      resizeCanvas();
      createParticles();
    }

    resizeCanvas();
    createParticles();
    loop(); // reduced motion → draws one static frame and stops here

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
    };
  });

  // ---- Derived sizing for the window ----
  const windowSizeClasses = $derived(
    isMaximized
      ? "left-0 top-8 h-[calc(100%-32px-36px)] w-full rounded-none"
      : "left-1/2 top-1/2 h-[70%] w-[96%] -translate-x-1/2 -translate-y-1/2 sm:h-[75%] sm:w-[92%] md:h-[540px] md:w-[820px]",
  );
  const windowVisibilityClasses = $derived(
    isMinimized
      ? "pointer-events-none scale-95 opacity-0"
      : "scale-100 opacity-100",
  );

  // ---- Window actions (single shared window, content swaps by section) ----
  function openTerminal() {
    if (!isOpen) {
      isOpen = true;
      isMinimized = false;
      return;
    }
    if (isMinimized) {
      isMinimized = false;
      return;
    }
    // Sudah terbuka: tidak melakukan apa-apa.
  }
  onMount(() => {
    openTerminal();
  });

  function closeTerminal() {
    isOpen = false;
    isMinimized = false;
    isMaximized = false;
  }

  function minimizeTerminal() {
    isMinimized = true;
  }

  function toggleMaximize() {
    isMaximized = !isMaximized;
  }

  // Menu item click: same open action as the taskbar button, just also
  // switches which section is shown in the window content.
  function openSection(id: string) {
    activeSection = id;
    openTerminal();
  }
</script>

<div
  class="relative h-screen w-screen select-none overflow-hidden text-[13px] text-neutral-900"
  style="font-family: Tahoma, Verdana, Arial, sans-serif;"
>
  <!-- Wallpaper: animated gradient + slow floating particles, no image asset -->
  <div class="wallpaper-gradient absolute inset-0" aria-hidden="true"></div>
  <canvas
    bind:this={particleCanvas}
    class="pointer-events-none absolute inset-0"
    aria-hidden="true"
  ></canvas>

  <!-- Top panel -->
  <header
    class="absolute inset-x-0 top-0 z-40 flex h-8 items-center justify-between border-b border-[#2b1b6b] bg-[#A085FC] px-3 text-white"
  >
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        {#snippet child({ props })}
          <button
            {...props}
            type="button"
            class="flex items-center gap-2 rounded-sm px-1 py-0.5 hover:bg-white/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-white data-[state=open]:bg-white/15"
            aria-label="Info profil, kontak, dan skill"
          >
            <Avatar size={"sm"} class="rounded-sm ring-1 ring-white/60">
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback>MN</AvatarFallback>
            </Avatar>
            <span class="text-[12px] font-semibold"
              >Maulana Nurfanoto Portofolio</span
            >
            <CaretDownIcon size={10} weight="bold" class="text-white/70" />
          </button>
        {/snippet}
      </DropdownMenu.Trigger>

      <DropdownMenu.Content
        align="start"
        sideOffset={2}
        class="w-72 rounded-sm border border-[#2b1b6b] bg-[#ece9d8] p-0 text-neutral-900 shadow-[0_2px_6px_rgba(0,0,0,0.35)]"
        style="font-family: Tahoma, Verdana, Arial, sans-serif;"
      >
        <DropdownMenu.Label
          class="bg-[#2b1b6b] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white"
        >
          Kontak
        </DropdownMenu.Label>

        <div class="flex flex-col py-1">
          <DropdownMenu.Item class="p-0 focus:bg-transparent">
            {#snippet child({ props })}
              <a
                {...props}
                href="mailto:maulananurfanoto10@gmail.com"
                class="flex items-center gap-2 px-3 py-1.5 text-[12px] hover:bg-[#A085FC] hover:text-white"
              >
                <EnvelopeSimpleIcon size={13} weight="bold" class="shrink-0" />
                <span class="truncate">maulananurfanoto10@gmail.com</span>
              </a>
            {/snippet}
          </DropdownMenu.Item>

          <DropdownMenu.Item class="p-0 focus:bg-transparent">
            {#snippet child({ props })}
              <a
                {...props}
                href="https://wa.me/6285111323432"
                target="_blank"
                rel="noreferrer"
                class="flex items-center gap-2 px-3 py-1.5 text-[12px] hover:bg-[#A085FC] hover:text-white"
              >
                <PhoneIcon size={13} weight="bold" class="shrink-0" />
                <span class="truncate">+62 8511-1323-432</span>
              </a>
            {/snippet}
          </DropdownMenu.Item>

          <DropdownMenu.Item class="p-0 focus:bg-transparent">
            {#snippet child({ props })}
              <a
                {...props}
                href="https://github.com/manuTech0"
                target="_blank"
                rel="noreferrer"
                class="flex items-center gap-2 px-3 py-1.5 text-[12px] hover:bg-[#A085FC] hover:text-white"
              >
                <GithubLogoIcon size={13} weight="bold" class="shrink-0" />
                <span class="truncate">github.com/manuTech0</span>
              </a>
            {/snippet}
          </DropdownMenu.Item>

          <!-- <DropdownMenu.Item class="p-0 focus:bg-transparent"> -->
          <!--   {#snippet child({ props })} -->
          <!--     <a -->
          <!--       {...props} -->
          <!--       href="https://linkedin.com/in/maulananurfanoto" -->
          <!--       target="_blank" -->
          <!--       rel="noreferrer" -->
          <!--       class="flex items-center gap-2 px-3 py-1.5 text-[12px] hover:bg-[#A085FC] hover:text-white" -->
          <!--     > -->
          <!--       <LinkedinLogoIcon size={13} weight="bold" class="shrink-0" /> -->
          <!--       <span class="truncate">linkedin.com/in/maulananurfanoto</span> -->
          <!--     </a> -->
          <!--   {/snippet} -->
          <!-- </DropdownMenu.Item> -->
        </div>

        <DropdownMenu.Separator class="bg-[#2b1b6b]/40" />

        <DropdownMenu.Label
          class="bg-[#2b1b6b] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white"
        >
          Skill
        </DropdownMenu.Label>

        <nav
          aria-label="Breadcrumb skill"
          class="flex flex-wrap items-center gap-1 px-3 py-2 text-[12px]"
        >
          {#each skillsBreadcrumb as skill, i (skill)}
            <span class="text-neutral-800">{skill}</span>
            {#if i < skillsBreadcrumb.length - 1}
              <CaretRightIcon size={10} class="text-neutral-500" />
            {/if}
          {/each}
        </nav>
      </DropdownMenu.Content>
    </DropdownMenu.Root>

    <span class="text-[12px] tabular-nums">{timeString}</span>
  </header>

  <!-- Window -->
  {#if isOpen}
    <Card
      class="absolute z-30 flex flex-col overflow-hidden rounded-sm border border-[#2b1b6b] bg-[#ece9d8] p-0 shadow-[0_2px_6px_rgba(0,0,0,0.35)] transition-all duration-200 {windowSizeClasses} {windowVisibilityClasses}"
      role="dialog"
      aria-label="{activeTitle} window"
    >
      <CardHeader
        class="flex h-8 shrink-0 flex-row items-center justify-between gap-2 space-y-0 border-b border-[#2b1b6b] bg-[#2b1b6b] px-2 py-0"
      >
        <div
          class="flex items-center gap-1.5 text-[12px] font-semibold text-white"
        >
          <TerminalIcon size={13} weight="bold" />
          <span>{activeTitle}</span>
        </div>
        <div class="flex items-center gap-1">
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            aria-label="Minimize window"
            onclick={minimizeTerminal}
            class="border border-white/25 bg-[#4534a6] text-white hover:bg-[#5b4bd4] hover:text-white focus-visible:ring-white"
          >
            <MinusIcon size={11} weight="bold" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            aria-label={isMaximized ? "Restore window" : "Maximize window"}
            onclick={toggleMaximize}
            class="border border-white/25 bg-[#4534a6] text-white hover:bg-[#5b4bd4] hover:text-white focus-visible:ring-white"
          >
            <SquareIcon size={10} weight="bold" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            aria-label="Close window"
            onclick={closeTerminal}
            class="border border-white/25 bg-[#c33] text-white hover:bg-[#e04040] hover:text-white focus-visible:ring-white"
          >
            <XIcon size={11} weight="bold" />
          </Button>
        </div>
      </CardHeader>

      <!-- Menubar: portfolio sections, sits between the title bar and content -->
      <nav
        aria-label="Menu portofolio"
        class="flex h-7 shrink-0 items-center gap-0.5 border-b border-[#2b1b6b]/40 bg-[#ece9d8] px-1"
      >
        {#each sections as section (section.id)}
          <Button
            type="button"
            variant={activeSection === section.id ? "secondary" : "ghost"}
            size="icon-sm"
            class="h-5 rounded-sm px-2 text-[12px] font-medium transition-colors {activeSection === section.id
              ? 'bg-[#A085FC] text-white hover:bg-[#A085FC] hover:text-white'
              : 'text-neutral-800 hover:bg-[#6a5ae0] hover:text-white'}"
            aria-current={activeSection === section.id ? "true" : undefined}
            onclick={() => openSection(section.id)}
          >
            {section.label}
          </Button>
        {/each}
      </nav>

      <!-- Content: black, terminal-like -->
      <CardContent class="min-h-0 flex-1 overflow-hidden bg-black p-0">
        {#if children}
          {@render children(activeSection, openSection)}
        {:else}
          <p class="p-3 font-mono text-[13px] text-[#33ff66]">
            Konten untuk "{activeTitle}" belum diisi.
          </p>
        {/if}
      </CardContent>
    </Card>
  {/if}

  <!-- Taskbar -->
  <nav
    aria-label="Taskbar"
    class="absolute inset-x-0 bottom-0 z-40 flex h-9 items-center gap-2 border-t border-[#2b1b6b] bg-[#A085FC] px-2"
  >
    <Button
      type="button"
      variant={isOpen ? "secondary" : "default"}
      size="sm"
      aria-label={activeTitle}
      onclick={() => openSection(activeSection)}
      class="flex h-7 items-center gap-1.5 rounded-sm border border-[#2b1b6b]/40 px-3 text-[12px] font-medium text-white {isOpen
        ? 'bg-[#4534a6] shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] hover:bg-[#4534a6] hover:text-white'
        : 'bg-[#5b4bd4] hover:bg-[#6a5ae0] hover:text-white'}"
    >
      <TerminalIcon size={15} weight="bold" />
      <span>{activeTitle}</span>
    </Button>
  </nav>
</div>

<style>
  .wallpaper-gradient {
    background: linear-gradient(120deg, #1c56b0, #3a6ea5, #5f9fe0, #2e63a8);
    background-size: 300% 300%;
    animation: wallpaper-gradient-shift 36s ease-in-out infinite alternate;
  }

  @keyframes wallpaper-gradient-shift {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .wallpaper-gradient {
      animation: none;
      background-position: 50% 50%;
    }
  }
</style>
