"use client";

import { useEffect, useRef, useSyncExternalStore, type PointerEvent } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { EXPERIENCE, type ExperienceItem } from "../lib/data";
import { MOTION_FAILED_EVENT } from "../lib/motionEvents";

gsap.registerPlugin(ScrollTrigger);

/* ─────────────────────────────────────────────────────────────
   ExperienceSection — "signal trace" career timeline

   Natural document flow (lives inside the Building stack sheet,
   which is un-pinned at every breakpoint), so it never shifts the
   index-coupled StackTransitions boundaries.

   Progressive enhancement: every element is fully visible in the
   markup. Hidden "from" states are applied only inside a
   no-reduced-motion matchMedia, and are cleared on revert or when
   any controller dispatches MOTION_FAILED_EVENT.

   Motion:
     · the spine draws itself, scrub-tied to scroll
     · a glowing comet head rides the leading edge of the spine
     · each node ignites as the trace reaches it, and its card
       slides in from its side with a blur-to-sharp settle
     · highlights + tags stagger in after the card lands
     · cards carry a pointer-tracked gold spotlight on hover
   ───────────────────────────────────────────────────────────── */

const ANIMATED = [
  ".xp-spine-fill",
  ".xp-comet",
  ".xp-node",
  ".xp-card",
  ".xp-date",
  ".xp-stagger",
];

function monthsBetween(start: string, end: Date): number {
  const [y, m] = start.split("-").map(Number);
  return Math.max(
    1,
    (end.getFullYear() - y) * 12 + (end.getMonth() + 1 - m) + 1,
  );
}

function formatDuration(months: number): string {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts: string[] = [];
  if (years) parts.push(`${years} yr${years > 1 ? "s" : ""}`);
  if (rest) parts.push(`${rest} mo${rest > 1 ? "s" : ""}`);
  return parts.join(" ");
}

function durationFor(item: ExperienceItem, now: Date | null): string | null {
  if (item.end) {
    const [y, m] = item.end.split("-").map(Number);
    return formatDuration(monthsBetween(item.start, new Date(y, m - 1, 1)));
  }
  return now ? formatDuration(monthsBetween(item.start, now)) : null;
}

const noopSubscribe = () => () => undefined;

/* Stable string snapshot (changes at most once a month). */
function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function trackSpotlight(event: PointerEvent<HTMLElement>) {
  const card = event.currentTarget;
  const rect = card.getBoundingClientRect();
  card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
  card.style.setProperty("--my", `${event.clientY - rect.top}px`);
}

export default function ExperienceSection() {
  const rootRef = useRef<HTMLElement>(null);
  /* Live duration for the ongoing role is computed after mount so the
     server and client markup always agree. */
  const monthKey = useSyncExternalStore(
    noopSubscribe,
    currentMonthKey,
    () => null,
  );
  const now = monthKey ? new Date(`${monthKey}-01T00:00:00`) : null;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const clearAll = () => {
      const targets = root.querySelectorAll<HTMLElement>(ANIMATED.join(","));
      gsap.killTweensOf(targets);
      gsap.set(targets, {
        clearProps: "opacity,transform,filter,visibility",
      });
      root.dataset.xpLive = "false";
    };

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        try {
          const list = root.querySelector<HTMLElement>(".xp-list");
          const fill = root.querySelector<HTMLElement>(".xp-spine-fill");
          const comet = root.querySelector<HTMLElement>(".xp-comet");
          const items = gsap.utils.toArray<HTMLElement>(".xp-item", root);
          if (!list || !fill || !comet || items.length === 0) return;

          root.dataset.xpLive = "true";

          /* Spine + comet: scrub-tied draw */
          gsap.set(fill, { scaleY: 0, transformOrigin: "top center" });
          gsap.set(comet, { top: "0%", opacity: 0 });

          const spine = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: list,
              start: "top 72%",
              end: "bottom 62%",
              scrub: 0.8,
              invalidateOnRefresh: true,
            },
          });
          spine
            .to(fill, { scaleY: 1, duration: 1 }, 0)
            .to(comet, { top: "100%", duration: 1 }, 0)
            .to(comet, { opacity: 1, duration: 0.06 }, 0)
            .to(comet, { opacity: 0, duration: 0.08 }, 0.92);

          /* Per-entry reveal */
          items.forEach((item, index) => {
            const node = item.querySelector<HTMLElement>(".xp-node");
            const card = item.querySelector<HTMLElement>(".xp-card");
            const date = item.querySelector<HTMLElement>(".xp-date");
            const stagger = item.querySelectorAll<HTMLElement>(".xp-stagger");
            const fromSide = item.dataset.side === "left" ? -1 : 1;
            const wide = window.matchMedia("(min-width: 900px)").matches;

            if (node) gsap.set(node, { scale: 0, opacity: 0 });
            if (card) {
              gsap.set(card, {
                opacity: 0,
                x: wide ? 64 * fromSide : 0,
                y: wide ? 0 : 36,
                rotateY: wide ? -8 * fromSide : 0,
                filter: "blur(10px)",
              });
            }
            if (date) gsap.set(date, { opacity: 0, x: wide ? -32 * fromSide : 0, y: wide ? 0 : 12 });
            gsap.set(stagger, { opacity: 0, y: 14 });

            const tl = gsap.timeline({
              paused: true,
              defaults: { ease: "power3.out" },
            });
            if (node) {
              tl.to(node, { scale: 1, opacity: 1, duration: 0.55, ease: "back.out(2.6)" }, 0);
            }
            if (card) {
              tl.to(card, { opacity: 1, x: 0, y: 0, rotateY: 0, filter: "blur(0px)", duration: 0.95 }, 0.1);
            }
            if (date) tl.to(date, { opacity: 1, x: 0, y: 0, duration: 0.8 }, 0.2);
            tl.to(stagger, { opacity: 1, y: 0, duration: 0.6, stagger: 0.06 }, 0.45);

            ScrollTrigger.create({
              trigger: item,
              start: index === 0 ? "top 78%" : "top 74%",
              onEnter: () => {
                item.classList.add("is-lit");
                tl.play();
              },
              onLeaveBack: () => {
                item.classList.remove("is-lit");
                tl.reverse();
              },
            });
          });
        } catch {
          clearAll();
          window.dispatchEvent(new CustomEvent(MOTION_FAILED_EVENT));
        }

        return () => clearAll();
      });

      return () => mm.revert();
    }, root);

    const onFailure = () => {
      ctx.revert();
      clearAll();
      root.querySelectorAll(".xp-item").forEach((el) => el.classList.add("is-lit"));
    };
    window.addEventListener(MOTION_FAILED_EVENT, onFailure);

    return () => {
      window.removeEventListener(MOTION_FAILED_EVENT, onFailure);
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={rootRef}
      className="xp-section"
      aria-labelledby="experience-heading"
    >
      <div
        id="experience"
        className="chapter-marker"
        data-scroll-landing="experience"
        data-scroll-spy="experience"
        aria-hidden="true"
      />

      <div className="container">
        <header className="ed-header xp-header">
          <div className="ed-header-row">
            <span className="ed-eyebrow">03 / Experience</span>
            <span className="ed-meta mono">career trace</span>
          </div>
          <h2 id="experience-heading" className="ed-heading ed-heading--md">
            Where I&apos;ve <em>shipped</em>
          </h2>
        </header>

        <div className="xp-list">
          <div className="xp-spine" aria-hidden="true">
            <span className="xp-spine-fill" />
            <span className="xp-comet" />
          </div>

          <ol className="xp-entries">

          {EXPERIENCE.map((item, index) => {
            const side = index % 2 === 0 ? "right" : "left";
            const ongoing = item.end === null;
            const duration = durationFor(item, now);

            return (
              <li
                key={item.id}
                className={`xp-item xp-item--${side}${ongoing ? " is-current" : ""}`}
                data-side={side}
              >
                <div className="xp-date">
                  <span className="xp-period mono">{item.period}</span>
                  <span className="xp-duration mono">
                    {duration ?? " "}
                  </span>
                </div>

                <span className="xp-node" aria-hidden="true">
                  <span className="xp-node-core" />
                  {ongoing && <span className="xp-node-pulse" />}
                </span>

                <article
                  className="xp-card"
                  onPointerMove={trackSpotlight}
                >
                  <div className="xp-card-inner">
                    <div className="xp-card-top xp-stagger">
                      <span className={`xp-badge mono${ongoing ? " xp-badge--live" : ""}`}>
                        {ongoing && (
                          <span className="status-dot" aria-hidden="true">
                            <span className="status-dot-pulse" />
                          </span>
                        )}
                        {ongoing ? "Current" : "Completed"}
                      </span>
                      <span className="xp-mode mono">{item.mode}</span>
                    </div>

                    <h3 className="xp-role xp-stagger">{item.role}</h3>
                    <p className="xp-company xp-stagger">
                      <span aria-hidden="true">@</span> {item.company}
                    </p>

                    <p className="xp-summary xp-stagger">{item.summary}</p>

                    <ul className="xp-highlights">
                      {item.highlights.map((point) => (
                        <li key={point} className="xp-stagger">
                          {point}
                        </li>
                      ))}
                    </ul>

                    <div className="project-tags">
                      {item.tags.map((tag) => (
                        <span key={tag} className="project-tag xp-stagger">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
          </ol>
        </div>
      </div>
    </section>
  );
}
