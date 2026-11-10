import { useCallback, useEffect, useMemo, useState } from "react";
import { loadSlim } from "@tsparticles/slim";
import { Particles, ParticlesProvider } from "@tsparticles/react";
import type {
  ISourceOptions,
  IShapeDrawer,
  IShapeDrawData,
  Particle,
} from "@tsparticles/engine";

const COLORS = ["#D4B633", "#FDF21D", "#EAB308"] as const;

const meteorDrawer: IShapeDrawer = {
  loadShape: (particle: Particle) => {
    particle.fillEnabled = true;
  },
  draw: (data: IShapeDrawData) => {
    const { context, particle, radius, fill } = data;
    if (!fill) return;
    const velocity = particle.velocity;
    if (!velocity) return;
    const speed = Math.hypot(velocity.x, velocity.y);
    if (speed <= 0) return;

    const r = Math.max(radius, 0.8);
    const tailLen = r * 5 + 1;
    const tailW = r * 0.5;
    const angle = Math.atan2(velocity.y, velocity.x);

    context.save();
    context.rotate(angle);
    context.arc(0, 0, r, 0, Math.PI * 2);
    context.rect(-tailLen, -tailW / 2, tailLen, tailW);
    context.restore();
  },
};

const buildOptions = (count: number): ISourceOptions => ({
  background: { color: "transparent" },
  fpsLimit: 60,
  detectRetina: true,
  particles: {
    number: { value: count, density: { enable: false } },
    paint: { fill: { color: { value: [...COLORS] } } },
    shape: { type: "meteor", close: true, options: {} },
    opacity: { value: { min: 0.8, max: 1 } },
    size: { value: { min: 1, max: 2.5 } },
    links: { enable: false },
    move: {
      enable: true,
      speed: { min: 5, max: 10 },
      direction: "bottom-right",
      straight: true,
      random: false,
      outModes: { default: "out" },
    },
  },
});

export default function ShootingStars({ active }: { active?: boolean }) {
  const [reduced, setReduced] = useState(false);
  const [enabled, setEnabled] = useState(active ?? false);

  const handleChange = useCallback((e: MediaQueryListEvent) => {
    setReduced(e.matches);
  }, []);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mql.matches);
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, [handleChange]);

  // Sinkronisasi aktif saat halaman siap (setelah loading section selesai)
  useEffect(() => {
    if (active) setEnabled(true);
  }, [active]);

  // Hentikan animasi saat tab tidak terlihat untuk hemat CPU/GPU
  useEffect(() => {
    const onChange = () => setEnabled(document.hidden ? false : active ?? false);
    document.addEventListener("visibilitychange", onChange, { passive: true });
    return () => document.removeEventListener("visibilitychange", onChange);
  }, [active]);

  const count = useMemo(() => (window.innerWidth < 768 ? 12 : 24), []);
  const options = useMemo(() => buildOptions(count), [count]);
  const particlesLoaded = useCallback(
    (container?: { shapeDrawers: Map<string, IShapeDrawer> } | null) => {
      if (container) {
        container.shapeDrawers.set("meteor", meteorDrawer);
      }
    },
    []
  );

  // Tidak render sama sekali selama loading section dan saat reduced motion
  if (!enabled || reduced) return null;

  return (
    <ParticlesProvider init={loadSlim}>
      <Particles
        id="shooting-stars"
        options={options}
        particlesLoaded={particlesLoaded}
        className="fixed inset-0 z-[60] pointer-events-none select-none"
      />
    </ParticlesProvider>
  );
}
