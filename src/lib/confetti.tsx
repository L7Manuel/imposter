import { useEffect, useRef } from "react";

export type WinnerType = "innocents" | "impostors" | "jester" | null;

interface ConfettiProps {
  winner: WinnerType;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  shape: "rect" | "circle" | "star";
  rotation: number;
  rotationSpeed: number;
  tilt: number;
  tiltSpeed: number;
  opacity: number;
}

const INNOCENT_COLORS = ["#fbbf24", "#f59e0b", "#fde047", "#ffffff", "#38bdf8", "#e0e7ff"];
const IMPOSTOR_COLORS = ["#ef4444", "#dc2626", "#b91c1c", "#f87171", "#7f1d1d", "#334155"];
const JESTER_COLORS = ["#c084fc", "#a855f7", "#ec4899", "#22d3ee", "#fbbf24", "#f43f5e"];

export function ConfettiCanvas({ winner }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!winner) return;

    // Sin festejo animado si el usuario pidió movimiento reducido.
    if (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const lowPerf = document.documentElement.getAttribute("data-perf") === "low";

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    const colors =
      winner === "innocents"
        ? INNOCENT_COLORS
        : winner === "jester"
          ? JESTER_COLORS
          : IMPOSTOR_COLORS;

    // Create festive particles (menos en modo rendimiento)
    const particleCount = lowPerf ? 40 : Math.min(100, Math.floor(width / 7) + 40);
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      // Half explode from left-bottom, half from right-bottom
      const fromLeft = i % 2 === 0;
      const startX = fromLeft ? width * 0.2 : width * 0.8;
      const startY = height * 0.75;

      const angle = fromLeft
        ? -Math.PI / 2 + (Math.random() * 0.7 - 0.1) // Upwards tilted right
        : -Math.PI / 2 - (Math.random() * 0.7 - 0.1); // Upwards tilted left

      const speed = Math.random() * 14 + 10;
      const shapeRand = Math.random();
      const shape: "rect" | "circle" | "star" =
        shapeRand > 0.4 ? "rect" : shapeRand > 0.15 ? "circle" : "star";

      particles.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 8 + 5,
        color: colors[Math.floor(Math.random() * colors.length)] ?? "#fbbf24",
        shape,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
        tilt: Math.random() * 10,
        tiltSpeed: Math.random() * 0.08 + 0.04,
        opacity: 1,
      });
    }

    const gravity = 0.32;
    const drag = 0.985;
    const startTime = performance.now();
    const duration = 4500; // 4.5 seconds

    const render = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      ctx.clearRect(0, 0, width, height);

      // Fade-out starts after 2.5 seconds
      const fadeProgress = elapsed > 2500 ? (elapsed - 2500) / 2000 : 0;
      const globalAlpha = Math.max(0, 1 - fadeProgress);

      let aliveCount = 0;

      for (const p of particles) {
        p.vx *= drag;
        p.vy = p.vy * drag + gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.tilt += p.tiltSpeed;

        const currentOpacity = globalAlpha * p.opacity;

        if (currentOpacity > 0.01 && p.y < height + 50) {
          aliveCount++;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.scale(Math.cos(p.tilt), 1);
          ctx.globalAlpha = currentOpacity;
          ctx.fillStyle = p.color;

          if (p.shape === "rect") {
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.6);
          } else if (p.shape === "circle") {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Star shape
            ctx.beginPath();
            for (let s = 0; s < 5; s++) {
              ctx.lineTo(
                Math.cos(((18 + s * 72) * Math.PI) / 180) * p.size,
                -Math.sin(((18 + s * 72) * Math.PI) / 180) * p.size,
              );
              ctx.lineTo(
                Math.cos(((54 + s * 72) * Math.PI) / 180) * (p.size / 2),
                -Math.sin(((54 + s * 72) * Math.PI) / 180) * (p.size / 2),
              );
            }
            ctx.closePath();
            ctx.fill();
          }

          ctx.restore();
        }
      }

      if (progress < 1 && aliveCount > 0) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [winner]);

  if (!winner) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50 h-full w-full"
      aria-hidden="true"
    />
  );
}
