/* ─────────────────────────────────────────────────────────────
   profileBot — on-device Q&A engine for the profile chatbot.

   Every answer is built from lib/data.ts, so the bot never
   says anything the portfolio itself doesn't. No network, no
   API key: intent scoring over keywords, plus entity matching
   for project names, companies and individual skills.
   ───────────────────────────────────────────────────────────── */

import {
  BUILDING,
  ENGAGEMENT_MODELS,
  EXPERIENCE,
  FREELANCE_SERVICES,
  PROFILE,
  PROJECTS,
  SKILL_PILLS,
} from "./data";

export interface BotLink {
  label: string;
  href: string;
  /** In-page section id — the widget scrolls instead of navigating. */
  section?: string;
}

export interface BotAnswer {
  text: string;
  bullets?: string[];
  links?: BotLink[];
  chips?: string[];
}

export const STARTER_CHIPS = [
  "Who is Lalit?",
  "Work experience",
  "Top projects",
  "Skills & stack",
  "Freelance services",
  "How to contact?",
];

const EMAIL_LINK: BotLink = { label: `✉ ${PROFILE.email}`, href: `mailto:${PROFILE.email}` };
const LINKEDIN_LINK: BotLink = { label: `in/${PROFILE.linkedinHandle}`, href: PROFILE.linkedin };

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9+#./\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function monthsSince(start: string): number {
  const [y, m] = start.split("-").map(Number);
  const now = new Date();
  return Math.max(1, (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m) + 1);
}

/* ---------- Answer builders ---------- */

const about = (): BotAnswer => ({
  text: `${PROFILE.name} is an ${PROFILE.role} at ${EXPERIENCE[0].company}, building practical, end-to-end AI systems — from model experimentation and data pipelines to LLM integration and backend APIs.`,
  bullets: [
    `Focus: ${PROFILE.focus.join(", ")}`,
    `Education: ${PROFILE.education}`,
    PROFILE.availability,
  ],
  chips: ["Work experience", "Top projects", "Freelance services"],
});

const experience = (): BotAnswer => ({
  text: "Here's Lalit's professional journey:",
  bullets: EXPERIENCE.map(
    (e) => `${e.role} @ ${e.company} — ${e.period} (${e.mode})`,
  ),
  links: [{ label: "View experience", href: "#experience", section: "experience" }],
  chips: [`About ${EXPERIENCE[0].company}`, `About ${EXPERIENCE[1].company}`, "Skills & stack"],
});

const job = (index: number): BotAnswer => {
  const e = EXPERIENCE[index];
  const tenure = e.end === null ? ` — ${monthsSince(e.start)} months so far and ongoing` : "";
  return {
    text: `${e.role} at ${e.company} · ${e.period}${tenure}. ${e.summary}`,
    bullets: [...e.highlights],
    links: [{ label: "View experience", href: "#experience", section: "experience" }],
    chips: index === 0 ? [`About ${EXPERIENCE[1].company}`, "Top projects"] : [`About ${EXPERIENCE[0].company}`, "Skills & stack"],
  };
};

const skills = (): BotAnswer => ({
  text: "Lalit's core stack spans AI/ML, GenAI and backend engineering:",
  bullets: [
    "AI / ML: Deep Learning, Computer Vision, YOLO, PyTorch, TensorFlow, OpenCV",
    "GenAI: LLMs, RAG, LangChain, LangGraph, Hugging Face, Agentic AI, MCP",
    "Retrieval: Embeddings, Milvus, FAISS, BM25, OCR",
    "Engineering: Python, FastAPI, Flask, SQL, Docker, REST APIs, CI/CD, Google Cloud",
  ],
  links: [{ label: "See the stack", href: "#skills", section: "skills" }],
  chips: ["Top projects", "Freelance services"],
});

const projects = (): BotAnswer => ({
  text: `Lalit has ${PROJECTS.length} featured projects. Ask about any of them by name:`,
  bullets: PROJECTS.map((p) => `${p.title.replace(/\s+-/, " –")} — ${p.subtitle}`),
  links: [{ label: "Browse projects", href: "#projects", section: "projects" }],
  chips: PROJECTS.slice(0, 3).map((p) => p.title.split(/[–-]/)[0].trim()),
});

const project = (index: number): BotAnswer => {
  const p = PROJECTS[index];
  const demo = "links" in p ? p.links?.find((l) => "demo" in l) : undefined;
  const links: BotLink[] = [{ label: "Open in portfolio", href: "#projects", section: "projects" }];
  if (demo) links.push({ label: "Live demo ↗", href: demo.href });
  return {
    text: `${p.title} — ${p.subtitle}.`,
    bullets: [
      ...("proofPoints" in p ? p.proofPoints.slice(0, 3) : [p.description.split(". ")[0] + "."]),
      `Tech: ${p.tech}`,
    ],
    links,
    chips: ["Top projects", "Freelance services"],
  };
};

const building = (): BotAnswer => ({
  text: "Right now Lalit is actively working on:",
  bullets: BUILDING.map((b) => `${b.title} (${b.status})`),
  links: [{ label: "See what's in progress", href: "#currently-building", section: "currently-building" }],
  chips: ["Skills & stack", "Freelance services"],
});

const education = (): BotAnswer => ({
  text: `Lalit holds a ${PROFILE.education}.`,
  chips: ["Work experience", "Skills & stack"],
});

const freelance = (): BotAnswer => ({
  text: "Yes — Lalit is available for freelance and contract-basis projects. Services:",
  bullets: FREELANCE_SERVICES.map((s) => `${s.title}: ${s.description}`),
  links: [{ label: "Freelance details", href: "#freelance", section: "freelance" }, EMAIL_LINK],
  chips: ["Engagement models", "How to contact?"],
});

const engagement = (): BotAnswer => ({
  text: "Flexible ways to work together:",
  bullets: ENGAGEMENT_MODELS.map((m) => `${m.title} — ${m.detail}`),
  links: [EMAIL_LINK],
  chips: ["Pricing", "How to contact?"],
});

const pricing = (): BotAnswer => ({
  text: "Pricing depends on scope and timeline. Share a short brief by email and Lalit will reply with a plan, timeline and quote.",
  links: [EMAIL_LINK, LINKEDIN_LINK],
  chips: ["Engagement models", "Freelance services"],
});

const contact = (): BotAnswer => ({
  text: "The fastest ways to reach Lalit:",
  bullets: [`Email: ${PROFILE.email}`, `LinkedIn: ${PROFILE.linkedinHandle}`],
  links: [EMAIL_LINK, LINKEDIN_LINK, { label: "Contact section", href: "#contact", section: "contact" }],
  chips: ["Freelance services", "Resume"],
});

const resume = (): BotAnswer => ({
  text: "You can open Lalit's resume here:",
  links: [{ label: "Open resume ↗", href: PROFILE.resume }],
  chips: ["Work experience", "How to contact?"],
});

const greeting = (): BotAnswer => ({
  text: `Hi! 👋 I'm Lalit's portfolio assistant. Ask me about his experience, projects, skills, or hiring him for a freelance project.`,
  chips: STARTER_CHIPS,
});

const thanks = (): BotAnswer => ({
  text: "Happy to help! Anything else you'd like to know?",
  chips: STARTER_CHIPS.slice(0, 4),
});

/* ---------- Intent scoring ---------- */

interface Intent {
  answer: () => BotAnswer;
  words: string[];
}

const INTENTS: Intent[] = [
  { answer: greeting, words: ["hi", "hello", "hey", "hii", "yo", "namaste", "good morning", "good evening"] },
  { answer: thanks, words: ["thanks", "thank you", "thx", "great", "awesome", "cool", "nice"] },
  { answer: () => job(0), words: ["expediens", "esolutions", "ai engineer"] },
  { answer: () => job(1), words: ["unihox", "internship", "intern"] },
  { answer: about, words: ["who", "about", "yourself", "introduce", "introduction", "profile", "lalit", "summary", "background"] },
  { answer: experience, words: ["experience", "work", "worked", "job", "jobs", "career", "company", "companies", "employment", "intern", "internship", "role", "current", "currently working"] },
  { answer: skills, words: ["skill", "skills", "stack", "tech", "technology", "technologies", "tools", "languages", "frameworks", "expertise", "know"] },
  { answer: projects, words: ["project", "projects", "portfolio", "built", "work samples", "showcase", "github"] },
  { answer: building, words: ["building", "in progress", "learning", "currently building", "working on", "now"] },
  { answer: education, words: ["education", "degree", "college", "university", "study", "studied", "btech", "b.tech", "graduate", "qualification"] },
  { answer: freelance, words: ["freelance", "freelancing", "hire", "hiring", "contract", "available", "availability", "services", "service", "offer", "help me", "build for me", "gig"] },
  { answer: engagement, words: ["engagement", "model", "models", "how can we work", "work together", "hourly", "monthly", "fixed"] },
  { answer: pricing, words: ["price", "pricing", "rate", "rates", "cost", "charge", "budget", "quote", "fee", "fees"] },
  { answer: contact, words: ["contact", "email", "mail", "reach", "linkedin", "connect", "message", "phone", "call"] },
  { answer: resume, words: ["resume", "cv", "curriculum"] },
];

function scoreIntent(q: string, intent: Intent): number {
  let score = 0;
  const tokens = new Set(q.split(" "));
  for (const w of intent.words) {
    if (w.includes(" ")) {
      if (q.includes(w)) score += 2;
    } else if (tokens.has(w)) {
      score += 1.5;
    } else if (w.length > 4 && q.includes(w)) {
      score += 1;
    }
  }
  return score;
}

const PROJECT_KEYS = PROJECTS.map((p) =>
  [p.id.replace(/-/g, " "), norm(p.title.split(/[–-]/)[0]), ...norm(p.subtitle).split(" ").filter((w) => w.length > 6)].filter(Boolean),
);

function matchProject(q: string): number {
  let best = -1;
  let bestScore = 0;
  PROJECT_KEYS.forEach((keys, i) => {
    let s = 0;
    keys.forEach((k, ki) => {
      if (k && q.includes(k)) s += ki < 2 ? 3 : 1;
    });
    if (s > bestScore) {
      bestScore = s;
      best = i;
    }
  });
  return bestScore >= 3 ? best : -1;
}

const ALL_SKILLS = Array.from(
  new Set(
    [
      ...SKILL_PILLS,
      ...PROJECTS.flatMap((p) => p.tech.split(",").map((t) => t.trim())),
      ...BUILDING.flatMap((b) => b.tags),
      "RAG", "LangGraph", "MCP", "Milvus", "FAISS", "BM25", "OCR", "SQLAlchemy", "Next.js", "React",
    ].filter((s) => s.length > 1),
  ),
);

function matchSkill(q: string): string | null {
  if (!/(know|use|work with|experience (in|with)|familiar|skilled|expert|do you|does he|can he|proficient)/.test(q)) {
    return null;
  }
  const hit = ALL_SKILLS.find((s) => {
    const k = norm(s);
    return k.length > 1 && new RegExp(`(^|\\s)${k.replace(/[.+#]/g, "\\$&")}(\\s|$|\\?)`).test(q);
  });
  return hit ?? null;
}

export function answer(input: string): BotAnswer {
  const q = norm(input);
  if (!q) return greeting();

  const skill = matchSkill(q);
  if (skill) {
    const used = PROJECTS.filter((p) => norm(p.tech).includes(norm(skill))).map((p) => p.title);
    return {
      text: `Yes — ${skill} is part of Lalit's toolkit.${used.length ? ` He has used it in: ${used.join(", ")}.` : ""}`,
      chips: ["Skills & stack", "Top projects"],
    };
  }

  const projectIndex = matchProject(q);
  if (projectIndex >= 0) return project(projectIndex);

  let best: Intent | null = null;
  let bestScore = 0;
  for (const intent of INTENTS) {
    const s = scoreIntent(q, intent);
    if (s > bestScore) {
      bestScore = s;
      best = intent;
    }
  }
  if (best && bestScore >= 1) return best.answer();

  return {
    text: "I'm not sure about that one — I can only answer questions about Lalit's profile. Try one of these, or reach him directly:",
    links: [EMAIL_LINK],
    chips: STARTER_CHIPS,
  };
}
