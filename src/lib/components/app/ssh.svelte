<script lang="ts">
  import { onMount } from "svelte";
  import { CMDExec } from "$lib/term/exec";
  import { splitArgs } from "$lib/term/utils";
  import { getCwdDisplay, resetFS } from "$lib/term/fs";
  import { Button } from "$lib/components/ui/button";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import CaretDownIcon from "phosphor-svelte/lib/CaretDownIcon";

  type Phase = "connecting" | "login" | "session";

  type Line = {
    id: number;
    kind: "out" | "input" | "login" | "err";
    text: string;
    html?: string;
  };

  let phase = $state<Phase>("connecting");
  let username = $state("guest");

  let lines = $state<Line[]>([]);
  let idc = 0;
  function nextId() {
    idc += 1;
    return idc;
  }

  let input = $state("");
  let caret = $state(0);
  let historyLog = $state<string[]>([]);
  let historyIndex = $state<number | null>(null);
  let isSimulating = $state(false);
  let inputFocused = $state(false);

  let scrollEl = $state<HTMLDivElement | null>(null);
  let inputEl = $state<HTMLTextAreaElement | null>(null);

  function syncCaret() {
    caret = inputEl ? inputEl.selectionStart : input.length;
  }

  const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const prompt = () => `${username}@portfolio ${getCwdDisplay()}>`;

  let poweredOn = $state(false);
  const winStatus = $derived(
    phase === "connecting"
      ? "connecting…"
      : phase === "login"
        ? "login as"
        : `${username}@portfolio`,
  );

  function lastLoginString(d: Date = new Date()) {
    const day = DAYS[d.getDay()];
    const mon = MONTHS[d.getMonth()];
    const date = d.getDate();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${day} ${mon} ${date} ${hh}:${mm}:${ss}`;
  }

  function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  function push(kind: Line["kind"], text = "", html?: string) {
    lines = [...lines, { id: nextId(), kind, text, html }];
  }

  async function runCommand(raw: string) {
    const commandLine = raw.trim();
    push("input", commandLine);
    if (!commandLine) return;

    historyLog = [...historyLog, commandLine];
    historyIndex = null;

    const [command, ...args] = splitArgs(commandLine);

    if (command === "clear") {
      lines = [];
      return;
    }

    if (command === "logout") {
      await sleep(60);
      push("out", "Connection to portfolio closed.");
      await sleep(350);
      startLogin();
      return;
    }

    try {
      const result = await CMDExec(command, ...args);
      if (result) push("out", "", result);
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Command error";
      push("err", msg);
      push("err", "Type 'help' for available commands.");
    }
  }

  const menuItems = [
    { cmd: "about", label: "About" },
    { cmd: "projects", label: "Projects" },
    { cmd: "skills", label: "Skills" },
    { cmd: "experience", label: "Experience" },
    { cmd: "education", label: "Education" },
    { cmd: "contact", label: "Contact" },
    { cmd: "clear", label: "Clear" },
    { cmd: "help", label: "Help" },
    { cmd: "logout", label: "Logout" },
  ];

  async function runMenuCommand(name: string) {
    if (phase !== "session" || isSimulating) return;
    focusInput();
    await simulateTypeCommand(name);
  }

  async function simulateTypeCommand(command: string) {
    isSimulating = true;
    input = "";
    caret = 0;
    for (const ch of command) {
      input += ch;
      caret = input.length;
      await sleep(35);
    }
    await sleep(160);
    const value = input;
    input = "";
    caret = 0;
    isSimulating = false;
    await runCommand(value);
    focusInput();
  }

  async function handleKeydown(e: KeyboardEvent) {
    if (isSimulating) {
      e.preventDefault();
      return;
    }

    if (phase === "login") {
      if (e.key === "Enter") {
        e.preventDefault();
        completeLogin(input);
      }
      return;
    }

    if (phase !== "session") return;

    if (e.key === "Enter") {
      e.preventDefault();
      const value = input;
      input = "";
      caret = 0;
      await runCommand(value);
      focusInput();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyLog.length === 0) return;
      const next =
        historyIndex === null
          ? historyLog.length - 1
          : Math.max(0, historyIndex - 1);
      historyIndex = next;
      input = historyLog[next];
      caret = input.length;
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex === null) return;
      const next = historyIndex + 1;
      if (next >= historyLog.length) {
        historyIndex = null;
        input = "";
      } else {
        historyIndex = next;
        input = historyLog[next];
      }
      caret = input.length;
    }
  }

  function startLogin() {
    phase = "login";
    input = "";
    caret = 0;
    push("out", "");
    setTimeout(() => focusInput(), 30);
  }

  // Timeout active only while the username prompt is shown: if the user
  // doesn't input anything within 3 seconds, auto-login as guest. As soon
  // as they start typing, they stay in control and must press Enter.
  $effect(() => {
    if (phase !== "login") return;
    if (input.trim() !== "") return;
    const t = window.setTimeout(() => {
      completeLogin("guest");
    }, 3000);
    return () => window.clearTimeout(t);
  });

  async function completeLogin(raw: string) {
    if (phase !== "login") return;

    const finalUser = raw.trim() || "guest";
    push("login", raw || "guest");
    resetFS();

    phase = "session";
    username = finalUser;

    await sleep(120);
    push("out", `Last login: ${lastLoginString()}`);
    await sleep(120);
    push("out", "Welcome to portfolio server.");
    await sleep(160);
    push("out", "");

    push("input", "help");
    await sleep(220);
    try {
      const result = await CMDExec("help");
      if (result) push("out", "", result);
    } catch {
      // no-op
    }
    push("out", "");
    focusInput();
  }

  function focusInput() {
    if (!inputEl) return;
    inputEl.focus();
    inputEl.scrollIntoView({ block: "nearest" });
  }

  function focusTerminal() {
    if (phase === "login" || phase === "session") focusInput();
  }

  async function connectSequence() {
    await sleep(350);
    push("out", "Connecting to portfolio server...");
    await sleep(750);
    push("out", "SSH-2.0-OpenSSH_3.5");
    await sleep(420);
    startLogin();
  }

  onMount(() => {
    requestAnimationFrame(() => {
      poweredOn = true;
    });
    connectSequence();
    window.addEventListener("pointerdown", focusTerminal);
    return () => window.removeEventListener("pointerdown", focusTerminal);
  });

  $effect(() => {
    lines.length;
    phase;
    if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight;
  });
</script>

<div class="term-root {poweredOn ? 'power-on' : ''}">
  <header class="term-titlebar">
    <div class="term-titlebar-top">
      <span class="tb-glyph" aria-hidden="true">❯_</span>
      <span class="tb-title">portfolio — SSH</span>
      <span class="tb-status">{winStatus}</span>
    </div>
    <nav class="menu-nav" aria-label="Portfolio commands">
      <div class="hidden shrink-0 items-center gap-1.5 sm:flex">
        {#each menuItems as item (item.cmd)}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={phase !== "session"}
            onclick={() => runMenuCommand(item.cmd)}
            class="h-[28px] flex-0-0-auto rounded-none bg-[#131313] px-3 text-[12.5px] font-medium whitespace-nowrap text-[#e6e6e6] hover:bg-[#221f33] hover:text-white disabled:pointer-events-none disabled:opacity-35"
          >
            {item.label}
          </Button>
        {/each}
      </div>

      <div class="sm:hidden">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            {#snippet child({ props })}
              <Button
                {...props}
                type="button"
                variant="ghost"
                size="sm"
                disabled={phase !== "session"}
                class="h-8 rounded-none bg-[#131313] px-3 text-[12.5px] font-medium text-[#e6e6e6] hover:bg-[#221f33] hover:text-white disabled:pointer-events-none disabled:opacity-35"
              >
                Menu
                <CaretDownIcon size={12} weight="bold" class="text-white/70" />
              </Button>
            {/snippet}
          </DropdownMenu.Trigger>
          <DropdownMenu.Content
            align="start"
            sideOffset={4}
            class="w-44 rounded-none border border-[#3a3a3a] bg-[#1c1c1c] p-1 text-[#e6e6e6]"
          >
            {#each menuItems as item (item.cmd)}
              <DropdownMenu.Item
                class="rounded-none text-[#e6e6e6] focus:bg-[#221f33] focus:text-white"
                disabled={phase !== "session"}
                onclick={() => runMenuCommand(item.cmd)}
              >
                {item.label}
              </DropdownMenu.Item>
            {/each}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </div>
    </nav>
  </header>

  <div class="term-body {inputFocused ? 'focused' : ''}">
    <div class="term-scroll" bind:this={scrollEl}>
      {#each lines as line (line.id)}
        {#if line.kind === "input"}
          <div class="term-line whitespace-pre-wrap">
            <span class="prompt">{prompt()}</span>{line.text}
          </div>
        {:else if line.kind === "login"}
          <div class="term-line whitespace-pre-wrap">
            <span class="prompt">login as: </span>{line.text}
          </div>
        {:else if line.kind === "err"}
          <div class="term-line whitespace-pre-wrap text-error">{line.text}</div>
        {:else}
          <div class="term-line whitespace-pre-wrap">
            {#if line.html}
              <div class="term md-output">{@html line.html}</div>
            {:else}
              {line.text}
            {/if}
          </div>
        {/if}
      {/each}
    </div>

    {#if phase === "login"}
      <div class="input-row {inputFocused ? 'focused' : ''}">
        <span class="prompt">login as: </span>
        <div class="input-line">
          <span class="term-echo" aria-hidden="true"
            ><span>{input.slice(0, caret)}</span><span class="term-cursor"></span
            ><span>{input.slice(caret)}</span></span
          >
          <textarea
            bind:this={inputEl}
            bind:value={input}
            onkeydown={handleKeydown}
            onkeyup={syncCaret}
            oninput={syncCaret}
            onselect={syncCaret}
            onclick={syncCaret}
            onfocus={() => (inputFocused = true)}
            onblur={() => (inputFocused = false)}
            disabled={isSimulating}
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            aria-label="Login username"
            class="term-input"
            rows="1"
          ></textarea>
        </div>
      </div>
    {:else if phase === "session"}
      <div class="input-row {inputFocused ? 'focused' : ''}">
        <span class="prompt">{prompt()}</span>
        <div class="input-line">
          <span class="term-echo" aria-hidden="true"
            ><span>{input.slice(0, caret)}</span><span class="term-cursor"></span
            ><span>{input.slice(caret)}</span></span
          >
          <textarea
            bind:this={inputEl}
            bind:value={input}
            onkeydown={handleKeydown}
            onkeyup={syncCaret}
            oninput={syncCaret}
            onselect={syncCaret}
            onclick={syncCaret}
            onfocus={() => (inputFocused = true)}
            onblur={() => (inputFocused = false)}
            disabled={isSimulating}
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            aria-label="Terminal command input"
            class="term-input"
            rows="1"
          ></textarea>
        </div>
      </div>
    {/if}
  </div>
</div>


<style>
  :global(html),
  :global(body) {
    background: #0c0c0c;
    margin: 0;
  }

  /* --- Native fullscreen modern terminal root --- */
  .term-root {
    position: fixed;
    inset: 0;
    display: flex;
    flex-direction: column;
    background: #0c0c0c;
    color: #d4d4d4;
    font-family: "Cascadia Mono", "JetBrains Mono", "Fira Code", "Consolas",
      Menlo, "Courier New", monospace;
    font-size: 14px;
    line-height: 1.5;
    overflow: hidden;
    cursor: text;
    opacity: 0;
  }

  .term-root.power-on {
    animation: term-fade-in 0.4s ease-out 1 forwards;
  }

  /* --- Modern title bar (Windows Terminal / PowerShell style) --- */
  .term-titlebar {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    gap: 0;
    padding: 6px 14px 8px;
    background: #1f1f1f;
    color: #e6e6e6;
    font-family: "Segoe UI", "Tahoma", Verdana, sans-serif;
    font-size: 13px;
    user-select: none;
    -webkit-user-select: none;
  }

  .term-titlebar-top {
    display: flex;
    align-items: center;
    gap: 10px;
    height: 22px;
  }

  .tb-glyph {
    color: #A085FC;
    font-weight: 700;
    font-family: "Cascadia Mono", Consolas, monospace;
    font-size: 16px;
  }

  .tb-title {
    font-weight: 600;
    white-space: nowrap;
  }

  .menu-nav {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 6px;
    padding: 6px 0 0;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
  }

  .menu-nav::-webkit-scrollbar {
    display: none;
  }

  .tb-status {
    flex: 0 0 auto;
    margin-left: 10px;
    color: #9f9f9f;
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 40%;
  }

  /* --- Terminal content area --- */
  .term-body {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    background: #0c0c0c;
    padding: 14px 16px 12px;
    box-sizing: border-box;
    overflow: hidden;
  }

  .term-scroll {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    padding-right: 10px;
    word-break: break-word;
    scrollbar-width: thin;
    scrollbar-color: #4a4a4a transparent;
    -webkit-overflow-scrolling: touch;
  }

  .term-scroll::-webkit-scrollbar {
    width: 10px;
  }
  .term-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
  .term-scroll::-webkit-scrollbar-thumb {
    background: #4a4a4a;
    border-radius: 5px;
    border: 2px solid #0c0c0c;
  }

  .term-line {
    min-height: 1.5em;
    white-space: pre-wrap;
  }

  /* Reuse the project's markdown styling (.term) for command output with a
     clean modern terminal palette. */
  :global(.term-body .term) {
    background: transparent;
    padding: 0;
    font-size: inherit;
    line-height: inherit;
    color: #A7B60D;
  }
  :global(.term-body .term h1) {
    font-size: 1.05em;
  }
  :global(.term-body .term h2) {
    font-size: 1em;
  }
  :global(.term-body .term hr) {
    margin: 0.5em 0 0.7em;
  }
  :global(.term-body .term strong) {
    color: #ffffff;
  }
  :global(.term-body .term a) {
    color: #A085FC;
  }
  :global(.term-body .term a:hover) {
    background: #A085FC;
    color: #0c0c0c;
  }
  :global(.term-body .term code) {
    background: #1e1e1e;
    border-color: #3a3a3a;
    color: #ffb86c;
  }
  :global(.term-body .term pre) {
    background: #151515;
    border-color: #3a3a3a;
  }
  :global(.term-body .term blockquote) {
    border-left-color: #A085FC;
    color: #9f9f9f;
  }
  :global(.term-body .term th),
  :global(.term-body .term td) {
    border-color: #3a3a3a;
  }
  :global(.term-body .term thead th) {
    background: #2a2a2a;
    color: #ffffff;
  }
  :global(.term-body .term tbody tr:nth-child(even)) {
    background: #111111;
  }
  :global(.term-body .term kbd) {
    background: #1e1e1e;
    border-color: #3a3a3a;
    color: #d4d4d4;
  }

  .prompt {
    color: #A085FC;
    font-weight: 700;
  }

  .text-error {
    color: #ff6b6b;
  }

  .input-row {
    flex: 0 0 auto;
    display: flex;
    align-items: flex-start;
    margin-top: 10px;
  }

  .input-line {
    position: relative;
    flex: 1 1 auto;
    min-width: 0;
  }

  .term-echo {
    display: block;
    min-height: 1.5em;
    white-space: pre-wrap;
    word-break: break-word;
    color: #d4d4d4;
    font: inherit;
  }

  .term-cursor {
    display: inline-block;
    width: 1ch;
    height: 1.25em;
    margin-right: -1ch;
    background: #A085FC;
    vertical-align: bottom;
    visibility: hidden;
  }

  .input-row.focused .term-cursor {
    visibility: visible;
    animation: caret-blink 1s steps(1) infinite;
  }

  .term-input {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
    border: none;
    outline: none;
    background: transparent;
    color: transparent;
    caret-color: transparent;
    resize: none;
    overflow: hidden;
    field-sizing: content;
    font: inherit;
    padding: 0;
  }

  @keyframes caret-blink {
    0%,
    49% {
      opacity: 1;
    }
    50%,
    100% {
      opacity: 0;
    }
  }

  @keyframes term-fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  /* --- Responsive / mobile-friendly --- */
  @media (min-width: 640px) {
    .term-body {
      font-size: 15px;
    }
  }

  @media (max-width: 480px) {
    .term-titlebar {
      padding: 4px 10px 6px;
      font-size: 12px;
    }
    .tb-glyph {
      font-size: 14px;
    }
    .tb-title {
      font-size: 12px;
    }
    .tb-status {
      display: none;
    }
    .term-body {
      padding: 10px 10px 8px;
      font-size: 13px;
    }
    .input-row,
    .term-input {
      font-size: 16px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .term-root {
      opacity: 1;
      animation: none;
    }
    .input-row.focused .term-cursor {
      animation: none;
    }
  }
</style>
