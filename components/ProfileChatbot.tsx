"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { answer, STARTER_CHIPS, type BotAnswer, type BotLink } from "../lib/profileBot";
import { PROFILE } from "../lib/data";
import { getLenis } from "../lib/lenisInstance";
import { getScrollTargetY } from "../lib/scrollTarget";

/* ─────────────────────────────────────────────────────────────
   ProfileChatbot — floating "Ask about Lalit" assistant

   Bottom-right launcher → glass chat panel. Answers come from
   lib/profileBot.ts (on-device, built from lib/data.ts).
   In-page links glide to the section via Lenis instead of
   jumping. Panel scroll uses data-lenis-prevent so the smooth
   scroller doesn't swallow wheel events.
   ───────────────────────────────────────────────────────────── */

type Message =
  | { id: number; from: "user"; text: string }
  | { id: number; from: "bot"; data: BotAnswer };

let nextId = 1;

export default function ProfileChatbot({ ready = true }: { ready?: boolean }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => [
    { id: nextId++, from: "bot", data: answer("hello") },
  ]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [nudge, setNudge] = useState(false);
  const [unread, setUnread] = useState(true);

  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<number | null>(null);

  /* Teaser bubble a few seconds after the page is ready */
  useEffect(() => {
    if (!ready) return;
    const show = window.setTimeout(() => setNudge(true), 4500);
    const hide = window.setTimeout(() => setNudge(false), 13000);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, [ready]);

  /* Keep the newest message in view */
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, typing, open]);

  /* Focus + Escape handling */
  useEffect(() => {
    if (!open) return;
    const focus = window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 220);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        launcherRef.current?.focus({ preventScroll: true });
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(focus);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  const ask = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text || typing) return;
      setMessages((m) => [...m, { id: nextId++, from: "user", text }]);
      setInput("");
      setTyping(true);
      const reply = answer(text);
      const delay = Math.min(1300, 450 + reply.text.length * 6);
      timerRef.current = window.setTimeout(() => {
        setTyping(false);
        setMessages((m) => [...m, { id: nextId++, from: "bot", data: reply }]);
      }, delay);
    },
    [typing],
  );

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    ask(input);
  };

  const onLink = (event: ReactMouseEvent<HTMLAnchorElement>, link: BotLink) => {
    if (!link.section) return;
    const y = getScrollTargetY(link.section, "landing");
    if (y == null) return;
    event.preventDefault();
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(y, { duration: 1.4 });
    else window.scrollTo({ top: y, behavior: "smooth" });
    if (window.matchMedia("(max-width: 640px)").matches) setOpen(false);
  };

  const toggle = () => {
    setOpen((o) => !o);
    setNudge(false);
    setUnread(false);
  };

  const lastBot = [...messages].reverse().find((m) => m.from === "bot");
  const chips =
    lastBot && lastBot.from === "bot" ? lastBot.data.chips ?? STARTER_CHIPS : STARTER_CHIPS;

  return (
    <div className={`pc-root${ready ? " is-ready" : ""}${open ? " is-open" : ""}`}>
      {/* ── Panel ── */}
      <div
        ref={panelRef}
        id="profile-chat"
        className="pc-panel"
        role="dialog"
        aria-modal="false"
        aria-label={`Chat with ${PROFILE.name}'s portfolio assistant`}
        aria-hidden={!open}
        inert={!open}
      >
        <div className="pc-head">
          <span className="pc-avatar" aria-hidden="true">
            <span className="pc-avatar-core">L</span>
          </span>
          <div className="pc-head-text">
            <strong>Ask about {PROFILE.name.split(" ")[0]}</strong>
            <span className="pc-status mono">
              <span className="pc-status-dot" aria-hidden="true" />
              Portfolio assistant · online
            </span>
          </div>
          <button
            type="button"
            className="pc-close"
            aria-label="Close chat"
            onClick={() => {
              setOpen(false);
              launcherRef.current?.focus({ preventScroll: true });
            }}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
        </div>

        <div
          ref={scrollRef}
          className="pc-messages"
          data-lenis-prevent
          role="log"
          aria-live="polite"
          aria-relevant="additions"
        >
          {messages.map((msg) =>
            msg.from === "user" ? (
              <div key={msg.id} className="pc-msg pc-msg--user">
                <p>{msg.text}</p>
              </div>
            ) : (
              <div key={msg.id} className="pc-msg pc-msg--bot">
                <p>{msg.data.text}</p>
                {msg.data.bullets && (
                  <ul>
                    {msg.data.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                )}
                {msg.data.links && (
                  <div className="pc-links">
                    {msg.data.links.map((l) => {
                      const external = /^https?:/.test(l.href) || l.href.endsWith(".pdf");
                      return (
                        <a
                          key={l.href + l.label}
                          href={l.href}
                          className="pc-link mono"
                          onClick={(e) => onLink(e, l)}
                          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        >
                          {l.label}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            ),
          )}

          {typing && (
            <div className="pc-msg pc-msg--bot pc-typing" aria-label="Assistant is typing">
              <span />
              <span />
              <span />
            </div>
          )}
        </div>

        <div className="pc-chips" data-lenis-prevent>
          {chips.map((c) => (
            <button key={c} type="button" className="pc-chip mono" onClick={() => ask(c)} disabled={typing}>
              {c}
            </button>
          ))}
        </div>

        <form className="pc-form" onSubmit={onSubmit}>
          <input
            ref={inputRef}
            className="pc-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about experience, projects, hiring…"
            aria-label="Your question"
            maxLength={240}
            autoComplete="off"
          />
          <button type="submit" className="pc-send" aria-label="Send" disabled={!input.trim() || typing}>
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path d="M4 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>
      </div>

      {/* ── Teaser ── */}
      <button
        type="button"
        className={`pc-nudge${nudge && !open ? " is-visible" : ""}`}
        onClick={toggle}
        tabIndex={nudge && !open ? 0 : -1}
        aria-hidden={!(nudge && !open)}
      >
        👋 Hi! Ask me anything about {PROFILE.name.split(" ")[0]}
      </button>

      {/* ── Launcher ── */}
      <button
        ref={launcherRef}
        type="button"
        className="pc-launcher"
        aria-label={open ? "Close profile chat" : "Open profile chat"}
        aria-expanded={open}
        aria-controls="profile-chat"
        onClick={toggle}
        data-cursor-ignore
      >
        <span className="pc-launcher-ring" aria-hidden="true" />
        <span className="pc-launcher-icon pc-launcher-icon--chat" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22">
            <path
              d="M12 3c4.97 0 9 3.58 9 8s-4.03 8-9 8c-1.1 0-2.15-.17-3.12-.5L4 20l1.4-3.73C4.52 14.9 3 13.06 3 11c0-4.42 4.03-8 9-8Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <circle cx="8.5" cy="11" r="1.1" fill="currentColor" />
            <circle cx="12" cy="11" r="1.1" fill="currentColor" />
            <circle cx="15.5" cy="11" r="1.1" fill="currentColor" />
          </svg>
        </span>
        <span className="pc-launcher-icon pc-launcher-icon--close" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
        {unread && !open && <span className="pc-badge" aria-hidden="true">1</span>}
      </button>
    </div>
  );
}
