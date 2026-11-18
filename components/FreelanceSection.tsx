"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type PointerEvent } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import {
  BRIEF_TIMELINES,
  ENGAGEMENT_MODELS,
  FREELANCE_PROCESS,
  FREELANCE_SERVICES,
  PROFILE,
} from "../lib/data";
import { MOTION_FAILED_EVENT } from "../lib/motionEvents";
import { LinkedInIcon, MailIcon } from "./ui/icons";

gsap.registerPlugin(ScrollTrigger);

/* ─────────────────────────────────────────────────────────────
   FreelanceSection — "Commission a build"

     1. Kinetic intro   — masked headline + twin outlined marquee
     2. Service console — pick a service, a terminal spec sheet
                          swaps in (inline accordion on mobile)
     3. Process rail    — scrub-filled pipeline
     4. Brief builder   — chips + fields compose a live brief.txt
                          and open a pre-filled email

   Natural document flow inside the Building stack sheet (same
   contract as ExperienceSection). Everything renders visible;
   GSAP hides "from" states only when motion is allowed and
   clears them on revert / MOTION_FAILED_EVENT.
   ───────────────────────────────────────────────────────────── */

/* Brief delivery — Web3Forms (https://web3forms.com).
   The access key is designed to be public (it only allows sending TO
   the inbox it was created for), so NEXT_PUBLIC_ is correct here.
   Set it in .env.local:  NEXT_PUBLIC_WEB3FORMS_KEY=xxxxxxxx-xxxx-...
   Without a key the button falls back to opening a mailto: draft. */
const WEB3FORMS_KEY = process.env.NEXT_PUBLIC_WEB3FORMS_KEY ?? "";
const WEB3FORMS_URL = "https://api.web3forms.com/submit";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type SendStatus = "idle" | "sending" | "sent" | "error";

const ANIMATED = [".fl-reveal", ".fl-line-inner", ".fl-row", ".fl-step", ".fl-process-fill"];

type Service = (typeof FREELANCE_SERVICES)[number];

function trackSpotlight(event: PointerEvent<HTMLElement>) {
  const el = event.currentTarget;
  const rect = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${event.clientX - rect.left}px`);
  el.style.setProperty("--my", `${event.clientY - rect.top}px`);
}

function SpecSheet({ svc }: { svc: Service }) {
  return (
    <div key={svc.id} className="fl-spec-body">
      <div className="fl-spec-cmd mono">
        <span className="fl-prompt">$</span> lalit describe --service {svc.code}
      </div>
      <h3 className="fl-spec-title">{svc.title}</h3>
      <p className="fl-spec-desc">{svc.description}</p>
      <div className="fl-spec-label mono">{"// what you get"}</div>
      <ul className="fl-spec-list">
        {svc.deliverables.map((d) => (
          <li key={d}>
            <span className="fl-check" aria-hidden="true">✓</span>
            {d}
          </li>
        ))}
      </ul>
      <div className="fl-spec-label mono">{"// stack"}</div>
      <div className="project-tags">
        {svc.stack.map((t) => (
          <span key={t} className="project-tag">{t}</span>
        ))}
      </div>
    </div>
  );
}

export default function FreelanceSection() {
  const rootRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  /* Brief builder state */
  const [picked, setPicked] = useState<string[]>([]);
  const [engagement, setEngagement] = useState<string>(ENGAGEMENT_MODELS[0].title);
  const [timeline, setTimeline] = useState<string>("Flexible");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [status, setStatus] = useState<SendStatus>("idle");
  const [honeypot, setHoneypot] = useState("");
  const [details, setDetails] = useState("");
  const [copied, setCopied] = useState(false);

  const togglePick = (title: string) =>
    setPicked((p) => (p.includes(title) ? p.filter((t) => t !== title) : [...p, title]));

  const brief = useMemo(() => {
    const lines = [
      `Hi Lalit,`,
      ``,
      `I'd like to discuss a project with you.`,
      ``,
      `Services   : ${picked.length ? picked.join(", ") : "Not sure yet"}`,
      `Engagement : ${engagement}`,
      `Timeline   : ${timeline}`,
      ``,
      `About the project:`,
      details.trim() || "(a few lines about what you want to build)",
      ``,
      `Thanks,`,
      name.trim() || "(your name)",
      email.trim() || "(your email)",
    ];
    return lines.join("\n");
  }, [picked, engagement, timeline, details, name, email]);

  const emailValid = EMAIL_RE.test(email.trim());
  const subject = `Project brief${picked.length ? ` — ${picked.slice(0, 2).join(" + ")}` : ""}`;
  const mailHref = `mailto:${PROFILE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(brief)}`;

  const sendBrief = async (event: FormEvent) => {
    event.preventDefault();
    setEmailTouched(true);
    if (!emailValid || status === "sending") return;

    /* No key configured yet → open a pre-filled draft instead */
    if (!WEB3FORMS_KEY) {
      window.location.href = mailHref;
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch(WEB3FORMS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: `${subject} (from ${name.trim() || email.trim()})`,
          from_name: name.trim() || "Portfolio visitor",
          email: email.trim(), // Web3Forms uses this as Reply-To
          replyto: email.trim(),
          services: picked.length ? picked.join(", ") : "Not sure yet",
          engagement,
          timeline,
          message: brief,
          botcheck: honeypot,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { success?: boolean };
      setStatus(res.ok && data.success ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  };

  const resetBrief = () => {
    setPicked([]);
    setDetails("");
    setStatus("idle");
    setEmailTouched(false);
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(PROFILE.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${PROFILE.email}`;
    }
  };

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

          /* Headline: each line rises out of its own mask */
          const lines = gsap.utils.toArray<HTMLElement>(".fl-line-inner", root);
          gsap.set(lines, { yPercent: 110 });
          gsap.to(lines, {
            yPercent: 0,
            duration: 1.1,
            ease: "power4.out",
            stagger: 0.12,
            scrollTrigger: {
              trigger: root.querySelector(".fl-hero"),
              start: "top 78%",
              toggleActions: "play none none reverse",
            },
          });

          /* Generic block reveals */
          gsap.utils.toArray<HTMLElement>(".fl-reveal", root).forEach((el) => {
            gsap.fromTo(
              el,
              { opacity: 0, y: 32, filter: "blur(8px)" },
              {
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                duration: 0.95,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: el,
                  start: "top 86%",
                  toggleActions: "play none none reverse",
                },
              },
            );
          });

          /* Console rows slide in from the left, one after another */
          const rows = gsap.utils.toArray<HTMLElement>(".fl-row", root);
          gsap.set(rows, { opacity: 0, x: -40 });
          ScrollTrigger.batch(rows, {
            start: "top 90%",
            onEnter: (batch) =>
              gsap.to(batch, { opacity: 1, x: 0, duration: 0.7, ease: "power3.out", stagger: 0.07, overwrite: true }),
            onLeaveBack: (batch) =>
              gsap.to(batch, { opacity: 0, x: -40, duration: 0.35, ease: "power2.in", overwrite: true }),
          });

          /* Process rail */
          const process = root.querySelector<HTMLElement>(".fl-process");
          const fill = root.querySelector<HTMLElement>(".fl-process-fill");
          const steps = gsap.utils.toArray<HTMLElement>(".fl-step", root);
          if (process && fill) {
            gsap.set(fill, { scaleX: 0, transformOrigin: "left center" });
            const tl = gsap.timeline({
              scrollTrigger: { trigger: process, start: "top 88%", end: "bottom 60%", scrub: 0.6 },
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

  const svc = FREELANCE_SERVICES[active];
  const marqueeA = FREELANCE_SERVICES.map((s) => s.title);
  const marqueeB = ["Freelance", "Contract basis", "Remote", "End-to-end AI", "Prototype → Production"];

  return (
    <section ref={rootRef} className="fl-section" aria-labelledby="freelance-heading">
      <div
        id="freelance"
        className="chapter-marker"
        data-scroll-landing="freelance"
        data-scroll-spy="freelance"
        aria-hidden="true"
      />

      {/* ── 1. Kinetic intro ── */}
      <div className="container fl-hero">
        <div className="ed-header-row fl-reveal">
          <span className="ed-eyebrow">04 / Freelance</span>
          <span className="fl-available mono">
            <span className="status-dot" aria-hidden="true">
              <span className="status-dot-pulse" />
            </span>
            Accepting new projects
          </span>
        </div>

        <h2 id="freelance-heading" className="fl-title">
          <span className="fl-line">
            <span className="fl-line-inner">Have an idea?</span>
          </span>
          <span className="fl-line">
            <span className="fl-line-inner">
              Let&apos;s <em>ship it</em> together.
            </span>
          </span>
        </h2>

        <p className="fl-lede fl-reveal">
          Alongside my role as an AI Engineer, I take on{" "}
          <strong>freelance and contract-basis projects</strong>. One engineer
          who owns the model, the data pipeline and the API end to end, from
          first prototype to production.
        </p>
      </div>

      <div className="fl-marquee" aria-hidden="true">
        <div className="fl-marquee-track">
          {[...marqueeA, ...marqueeA].map((t, i) => (
            <span key={`a${i}`} className="fl-marquee-item">
              {t}
              <span className="fl-star">✦</span>
            </span>
          ))}
        </div>
        <div className="fl-marquee-track fl-marquee-track--reverse">
          {[...marqueeB, ...marqueeB, ...marqueeB].map((t, i) => (
            <span key={`b${i}`} className="fl-marquee-item fl-marquee-item--solid">
              {t}
              <span className="fl-star">✦</span>
            </span>
          ))}
        </div>
      </div>

      <div className="container">
        {/* ── 2. Service console ── */}
        <div className="fl-console">
          <div className="fl-console-head fl-reveal">
            <span className="ed-eyebrow">What I can build for you</span>
            <span className="ed-meta mono">select a service</span>
          </div>

          <div className="fl-console-grid">
            <ul className="fl-rows" role="tablist" aria-label="Freelance services" aria-orientation="vertical">
              {FREELANCE_SERVICES.map((s, i) => {
                const isActive = i === active;
                return (
                  <li key={s.id} className={`fl-row${isActive ? " is-active" : ""}`} role="presentation">
                    <button
                      type="button"
                      role="tab"
                      id={`tab-${s.id}`}
                      aria-selected={isActive}
                      aria-controls="fl-spec-panel"
                      className="fl-row-btn"
                      onClick={() => setActive(i)}
                      onPointerEnter={(e) => {
                        if (e.pointerType === "mouse") setActive(i);
                      }}
                      onFocus={() => setActive(i)}
                    >
                      <span className="fl-row-code mono">{s.code}</span>
                      <span className="fl-row-title">{s.title}</span>
                      <span className="fl-row-arrow" aria-hidden="true">→</span>
                    </button>
                    {/* Mobile: inline accordion detail */}
                    <div className="fl-row-detail">
                      {isActive && <SpecSheet svc={s} />}
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Desktop: terminal spec sheet */}
            <div
              id="fl-spec-panel"
              role="tabpanel"
              aria-labelledby={`tab-${svc.id}`}
              className="fl-spec fl-reveal"
              onPointerMove={trackSpotlight}
            >
              <div className="fl-spec-chrome">
                <span className="fl-dot fl-dot--r" />
                <span className="fl-dot fl-dot--y" />
                <span className="fl-dot fl-dot--g" />
                <span className="fl-spec-file mono">service_{svc.code}.spec</span>
              </div>
              <SpecSheet svc={svc} />
              <div className="fl-spec-scan" aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* ── 3. Process rail ── */}
        <div className="fl-process-wrap fl-reveal">
          <span className="ed-eyebrow">How a project runs</span>
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

        {/* ── 4. Brief builder ── */}
        <div className="fl-brief fl-reveal">
          <div className="fl-brief-glow" aria-hidden="true" />

          <form id="fl-brief-form" className="fl-brief-form" onSubmit={sendBrief} noValidate>
            <span className="ed-eyebrow">Start a project</span>
            <p className="fl-brief-title">
              Build your brief in <em>30 seconds</em>.
            </p>

            <fieldset className="fl-field">
              <legend className="mono">01 · What do you need?</legend>
              <div className="fl-chips">
                {FREELANCE_SERVICES.map((s) => {
                  const on = picked.includes(s.title);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      className={`fl-chip${on ? " is-on" : ""}`}
                      aria-pressed={on}
                      onClick={() => togglePick(s.title)}
                    >
                      {on && <span aria-hidden="true">✓ </span>}
                      {s.title}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="fl-field">
              <legend className="mono">02 · How should we work?</legend>
              <div className="fl-chips">
                {ENGAGEMENT_MODELS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`fl-chip${engagement === m.title ? " is-on" : ""}`}
                    aria-pressed={engagement === m.title}
                    title={m.detail}
                    onClick={() => setEngagement(m.title)}
                  >
                    {m.title}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="fl-field">
              <legend className="mono">03 · Timeline</legend>
              <div className="fl-chips">
                {BRIEF_TIMELINES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`fl-chip${timeline === t ? " is-on" : ""}`}
                    aria-pressed={timeline === t}
                    onClick={() => setTimeline(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="fl-field fl-inputs">
              <div className="fl-inputs-row">
                <label>
                  <span className="mono">04 · Your name</span>
                  <input
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={80}
                    placeholder="Jane Doe, Acme Inc."
                    autoComplete="name"
                  />
                </label>
                <label>
                  <span className="mono">
                    Your email <b className="fl-req" aria-hidden="true">*</b>
                  </span>
                  <input
                    name="email"
                    type="email"
                    inputMode="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setEmailTouched(true)}
                    maxLength={120}
                    placeholder="you@company.com"
                    autoComplete="email"
                    aria-invalid={emailTouched && !emailValid}
                    aria-describedby="fl-email-err"
                  />
                  <span id="fl-email-err" className="fl-err" role="alert">
                    {emailTouched && !emailValid
                      ? email.trim()
                        ? "That email doesn't look right."
                        : "I need your email to reply."
                      : ""}
                  </span>
                </label>
              </div>
              <label>
                <span className="mono">05 · About the project</span>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  maxLength={800}
                  rows={3}
                  placeholder="What do you want to build? Any data, users or deadlines I should know about?"
                  data-lenis-prevent
                />
              </label>
              {/* Honeypot — invisible to people, bots fill it in */}
              <input
                type="checkbox"
                name="botcheck"
                className="fl-hp"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                checked={honeypot === "on"}
                onChange={(e) => setHoneypot(e.target.checked ? "on" : "")}
              />
            </div>
          </form>

          <div className={`fl-brief-preview fl-status--${status}`}>
            <div className="fl-spec-chrome">
              <span className="fl-dot fl-dot--r" />
              <span className="fl-dot fl-dot--y" />
              <span className="fl-dot fl-dot--g" />
              <span className="fl-spec-file mono">brief.txt</span>
            </div>
            <pre className="fl-brief-text mono" data-lenis-prevent>
              {brief}
              <span className="fl-caret" aria-hidden="true" />
            </pre>

            {/* Success overlay */}
            {status === "sent" && (
              <div className="fl-sent" role="status">
                <svg className="fl-sent-check" viewBox="0 0 52 52" aria-hidden="true">
                  <circle cx="26" cy="26" r="24" />
                  <path d="M15 27l7 7 15-16" />
                </svg>
                <p className="fl-sent-title">Brief sent!</p>
                <p className="fl-sent-text">
                  Thanks{name.trim() ? `, ${name.trim().split(/[ ,]/)[0]}` : ""}. I&apos;ll reply to{" "}
                  <strong>{email.trim()}</strong> within 24–48 hours.
                </p>
                <button type="button" className="fl-alt-link mono" onClick={resetBrief}>
                  Send another brief
                </button>
              </div>
            )}

            <div className="fl-brief-actions">
              <button
                type="submit"
                form="fl-brief-form"
                className="fl-btn fl-btn--primary"
                disabled={status === "sending"}
                aria-busy={status === "sending"}
              >
                {status === "sending" ? (
                  <>
                    <span className="fl-spinner" aria-hidden="true" /> Sending…
                  </>
                ) : (
                  <>
                    Send brief <span aria-hidden="true">→</span>
                  </>
                )}
              </button>
              {status === "error" && (
                <p className="fl-send-err" role="alert">
                  Couldn&apos;t send right now.{" "}
                  <a href={mailHref}>Open it in your email app instead →</a>
                </p>
              )}
              <div className="fl-alt">
                <button type="button" className="fl-alt-link mono" onClick={copyEmail} aria-live="polite">
                  <MailIcon />
                  {copied ? "Copied ✓" : PROFILE.email}
                </button>
                <a
                  className="fl-alt-link mono"
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
      </div>
    </section>
  );
}
