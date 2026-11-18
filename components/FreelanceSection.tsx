"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import {
  ENGAGEMENT_MODELS,
  FREELANCE_PROCESS,
  FREELANCE_SERVICES,
  PROFILE,
} from "../lib/data";
import { MOTION_FAILED_EVENT } from "../lib/motionEvents";
import { LinkedInIcon, MailIcon } from "./ui/icons";

gsap.registerPlugin(ScrollTrigger);

/* ─────────────────────────────────────────────────────────────
   FreelanceSection — "Hire me" chapter

   Natural document flow inside the Building stack sheet (same
   contract as ExperienceSection). Everything renders visible;
   GSAP hides "from" states only when motion is allowed and
   clears them on revert / MOTION_FAILED_EVENT.
   ───────────────────────────────────────────────────────────── */

const ANIMATED = [".fl-reveal", ".fl-service", ".fl-step", ".fl-process-fill"];

function trackSpotlight(event: PointerEvent<HTMLElement>) {
  const el = event.currentTarget;
  const rect = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${event.clientX - rect.left}px`);
  el.style.setProperty("--my", `${event.clientY - rect.top}px`);
}

export default function FreelanceSection() {
  const rootRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const clearAll = () => {
      const targets = root.querySelectorAll<HTMLElement>(ANIMATED.join(","));
      gsap.killTweensOf(targets);
      gsap.set(targets, { clearProps: "opacity,transform,filter,clipPath" });
      root.dataset.flLive = "false";
    };

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        try {
          root.dataset.flLive = "true";
          /* Generic block reveals */
          gsap.utils.toArray<HTMLElement>(".fl-reveal", root).forEach((el) => {
            gsap.fromTo(
              el,
              { opacity: 0, y: 28, filter: "blur(6px)" },
              {
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                duration: 0.9,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: el,
                  start: "top 85%",
                  toggleActions: "play none none reverse",
                },
              },
            );
          });

          /* Service cards: staggered 3D flip-up */
          const services = gsap.utils.toArray<HTMLElement>(".fl-service", root);
          gsap.set(services, {
            opacity: 0,
            y: 48,
            rotateX: -18,
            transformPerspective: 900,
            transformOrigin: "50% 100%",
          });
          ScrollTrigger.batch(services, {
            start: "top 88%",
            onEnter: (batch) =>
              gsap.to(batch, {
                opacity: 1,
                y: 0,
                rotateX: 0,
                duration: 0.9,
                ease: "power3.out",
                stagger: 0.09,
                overwrite: true,
              }),
            onLeaveBack: (batch) =>
              gsap.to(batch, {
                opacity: 0,
                y: 48,
                rotateX: -18,
                duration: 0.4,
                ease: "power2.in",
                overwrite: true,
              }),
          });

          /* Process rail: line scrubs, steps light up */
          const process = root.querySelector<HTMLElement>(".fl-process");
          const fill = root.querySelector<HTMLElement>(".fl-process-fill");
          const steps = gsap.utils.toArray<HTMLElement>(".fl-step", root);
          if (process && fill) {
            gsap.set(fill, { scaleX: 0, transformOrigin: "left center" });
            const tl = gsap.timeline({
              scrollTrigger: {
                trigger: process,
                start: "top 85%",
                end: "bottom 55%",
                scrub: 0.6,
              },
            });
            tl.to(fill, { scaleX: 1, ease: "none", duration: 1 }, 0);
            steps.forEach((step, i) => {
              tl.call(
                () => step.classList.toggle("is-lit", tl.scrollTrigger?.direction !== -1),
                undefined,
                (i / Math.max(1, steps.length - 1)) * 0.98,
              );
            });
          }
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
      root.querySelectorAll(".fl-step").forEach((el) => el.classList.add("is-lit"));
    };
    window.addEventListener(MOTION_FAILED_EVENT, onFailure);
    return () => {
      window.removeEventListener(MOTION_FAILED_EVENT, onFailure);
      ctx.revert();
    };
  }, []);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(PROFILE.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${PROFILE.email}`;
    }
  };

  return (
    <section ref={rootRef} className="fl-section" aria-labelledby="freelance-heading">
      <div
        id="freelance"
        className="chapter-marker"
        data-scroll-landing="freelance"
        data-scroll-spy="freelance"
        aria-hidden="true"
      />

      <div className="container">
        <header className="ed-header fl-header fl-reveal">
          <div className="ed-header-row">
            <span className="ed-eyebrow">04 / Freelance</span>
            <span className="ed-meta mono">contract basis</span>
          </div>
          <h2 id="freelance-heading" className="ed-heading ed-heading--md">
            Let&apos;s build your <em>AI product</em>
          </h2>
        </header>

        <div className="fl-intro fl-reveal">
          <p>
            Alongside my role as an AI Engineer, I take on{" "}
            <strong>freelance and contract-basis projects</strong> — from a
            focused prototype to a production feature. You get one engineer who
            owns the model, the data pipeline and the API end to end.
          </p>
          <span className="fl-available mono">
            <span className="status-dot" aria-hidden="true">
              <span className="status-dot-pulse" />
            </span>
            Accepting new projects
          </span>
        </div>

        {/* ── Services bento ── */}
        <ul className="fl-services" aria-label="Freelance services">
          {FREELANCE_SERVICES.map((svc) => (
            <li key={svc.id} className="fl-service" onPointerMove={trackSpotlight}>
              <div className="fl-service-inner">
                <div className="fl-service-top">
                  <span className="fl-service-code mono">{svc.code}</span>
                  <span className="fl-service-arrow" aria-hidden="true">↗</span>
                </div>
                <h3 className="fl-service-title">{svc.title}</h3>
                <p className="fl-service-desc">{svc.description}</p>
                <div className="project-tags">
                  {svc.stack.map((t) => (
                    <span key={t} className="project-tag">{t}</span>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* ── Engagement + process ── */}
        <div className="fl-engage fl-reveal">
          <div className="fl-engage-head">
            <span className="ed-eyebrow">How we can work</span>
          </div>
          <div className="fl-models">
            {ENGAGEMENT_MODELS.map((m) => (
              <div key={m.id} className="fl-model">
                <h4>{m.title}</h4>
                <p>{m.detail}</p>
              </div>
            ))}
          </div>

          <div className="fl-process">
            <span className="fl-process-track" aria-hidden="true">
              <span className="fl-process-fill" />
            </span>
            <ol className="fl-steps" aria-label="Project process">
              {FREELANCE_PROCESS.map((step, i) => (
                <li key={step} className="fl-step">
                  <span className="fl-step-dot mono">{String(i + 1).padStart(2, "0")}</span>
                  <span className="fl-step-label mono">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* ── CTA panel ── */}
        <div className="fl-cta fl-reveal">
          <div className="fl-cta-glow" aria-hidden="true" />
          <div className="fl-cta-copy">
            <span className="ed-eyebrow">Have a project in mind?</span>
            <p className="fl-cta-title">
              Tell me what you&apos;re building — I&apos;ll reply with a plan,
              timeline and quote.
            </p>
          </div>

          <div className="fl-cta-actions">
            <div className="fl-email">
              <a
                className="fl-email-link mono"
                href={`mailto:${PROFILE.email}?subject=${encodeURIComponent("Freelance project enquiry")}`}
              >
                <MailIcon />
                {PROFILE.email}
              </a>
              <button
                type="button"
                className="fl-copy mono"
                onClick={copyEmail}
                aria-live="polite"
              >
                {copied ? "Copied ✓" : "Copy"}
              </button>
            </div>
            <div className="fl-cta-buttons">
              <a
                className="fl-btn fl-btn--primary"
                href={`mailto:${PROFILE.email}?subject=${encodeURIComponent("Freelance project enquiry")}`}
              >
                Start a project <span aria-hidden="true">→</span>
              </a>
              <a
                className="fl-btn"
                href={PROFILE.linkedin}
                target="_blank"
                rel="noopener noreferrer"
              >
                <LinkedInIcon />
                in/{PROFILE.linkedinHandle}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
