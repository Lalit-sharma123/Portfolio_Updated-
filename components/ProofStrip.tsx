"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { BUILDING, EXPERIENCE, PROJECTS } from "../lib/data";

/* ─────────────────────────────────────────────────────────────
   ProofStrip — hero "career at a glance" counter row

   Every number is derived from lib/data.ts so it can always be
   backed up and stays current as entries are added:
     · years in AI  — since the earliest EXPERIENCE start, floored
     · projects     — PROJECTS.length
     · roles        — EXPERIENCE.length
     · AI tracks    — BUILDING.length

   The final values are rendered in the markup (correct for SEO,
   no-JS and reduced motion); the count-up is pure enhancement.
   The strip's own fade-in is driven by HeroSection's entrance
   stagger (.proof-strip is in its target list).
   ───────────────────────────────────────────────────────────── */

/* Floored to one decimal so it never overstates (1.38 → 1.3). */
function yearsInAI(): number {
  const first = EXPERIENCE.map((e) => e.start).sort()[0];
  const [y, m] = first.split("-").map(Number);
  const now = new Date();
  const months = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m);
  return Math.max(0, Math.floor((months / 12) * 10) / 10);
}

interface Stat {
  value: number;
  decimals: number;
  suffix: string;
  label: string;
}

function buildStats(): Stat[] {
  return [
    { value: yearsInAI(), decimals: 1, suffix: "+", label: "Yrs in AI" },
    { value: PROJECTS.length, decimals: 0, suffix: "", label: "Projects shipped" },
    { value: EXPERIENCE.length, decimals: 0, suffix: "", label: "Roles held" },
    { value: BUILDING.length, decimals: 0, suffix: "", label: "Tracks in progress" },
  ];
}

export default function ProofStrip({ animate = true }: { animate?: boolean }) {
  const rootRef = useRef<HTMLUListElement>(null);
  /* Computed once per render; the years value only changes month to
     month, so server and client markup agree in practice. */
  const stats = buildStats();

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !animate) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(root.querySelectorAll(".ps-item"), {
          opacity: 0,
          y: 14,
          filter: "blur(6px)",
          duration: 0.8,
          stagger: 0.12,
          ease: "power3.out",
          delay: 0.55,
          clearProps: "filter",
        });

        root.querySelectorAll<HTMLElement>("[data-count]").forEach((el, i) => {
          const target = Number(el.dataset.count);
          const decimals = Number(el.dataset.decimals);
          const counter = { v: 0 };
          el.textContent = (0).toFixed(decimals);
          gsap.to(counter, {
            v: target,
            duration: 1.6,
            delay: 0.65 + i * 0.12,
            ease: "power2.out",
            onUpdate: () => {
              el.textContent = counter.v.toFixed(decimals);
            },
            onComplete: () => {
              el.textContent = target.toFixed(decimals);
            },
          });
        });

        /* Always restore final values if the animation is torn down */
        return () => {
          root.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
            el.textContent = Number(el.dataset.count).toFixed(Number(el.dataset.decimals));
          });
        };
      });
      return () => mm.revert();
    }, root);

    return () => ctx.revert();
  }, [animate]);

  return (
    <ul ref={rootRef} className="proof-strip" aria-label="Career at a glance">
      {stats.map((s) => (
        <li key={s.label} className="ps-item">
          <span className="ps-value">
            <span data-count={s.value} data-decimals={s.decimals}>
              {s.value.toFixed(s.decimals)}
            </span>
            {s.suffix && <span className="ps-suffix">{s.suffix}</span>}
          </span>
          <span className="ps-label mono">{s.label}</span>
        </li>
      ))}
    </ul>
  );
}
