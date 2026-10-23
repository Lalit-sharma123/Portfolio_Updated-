import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { preload } from "react-dom";
import { Plus_Jakarta_Sans, JetBrains_Mono, Instrument_Serif } from "next/font/google";
import SmoothScroll from "../components/SmoothScroll";
import CursorReticle from "../components/CursorReticle";
import MemProbe from "../components/MemProbe";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import "./evolution.css";

// Absolute-URL base for canonical links, OG/Twitter images, and the sitemap.
// Env var wins on Vercel previews; falls back to the production domain.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jonathanjesni.com";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
  // 300 was loaded but never referenced anywhere in globals.css or TSX
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains",
  weight: ["400", "500", "600"],
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-instrument",
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  title: "Lalit Sharma: AI & Systems Developer",
  description:
    "Lalit Sharma's developer portfolio: AI/ML tools, computer vision, and real-world software engineering.",
  keywords: [
    "Lalit Sharma",
    "AI developer",
    "systems developer",
    "frontend engineer",
    "machine learning portfolio",
    "deep learning",
    "recommendation systems",
    "computer vision",
    "document processing",
    "Next.js portfolio",
  ],
  openGraph: {
    title: "Lalit Sharma: AI & Systems Developer",
    description:
      "Lalit Sharma's developer portfolio: AI/ML tools, computer vision, and real-world software engineering.",
    type: "website",
    url: "/",
    siteName: "Lalit Sharma",
    // og:image is injected automatically by app/opengraph-image.jpeg
  },
  twitter: {
    card: "summary_large_image",
    title: "Lalit Sharma: AI & Systems Developer",
    description:
      "AI/ML tools, computer vision, and real-world software engineering projects by Lalit Sharma.",
    // twitter:image is injected automatically by app/twitter-image.jpeg
  },
};

export const viewport: Viewport = {
  themeColor: "#0D0B09",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Kick off hero-critical asset fetches from the initial HTML instead of
  // waiting for client JS to evaluate useGLTF.preload — parallel with the
  // JS download, shortens the preloader's wall time on cold loads.
  preload("/assets/hardware_laptop.glb", { as: "fetch", crossOrigin: "anonymous" });
  // crossOrigin must match THREE's loaders (anonymous) or the preloaded
  // response has a different credentials mode and both textures download twice.
  preload("/assets/textures/bg.jpg", { as: "image", crossOrigin: "anonymous" });
  preload("/assets/textures/Mac Keyboard.jpg", {
    as: "image",
    crossOrigin: "anonymous",
  });

  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable}`}
    >
      <body>
        <Script id="scroll-restoration" strategy="beforeInteractive">
          {`history.scrollRestoration = "manual";
if (!location.hash) window.scrollTo(0, 0);`}
        </Script>
        {/* Film-grain noise overlay — fixed, pointer-events-none, adds physical texture */}
        <div className="grain-overlay" aria-hidden="true" />
        {/* Person structured data for name-search rich results */}
        {/* <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: "Lalit Sharma",
              url: SITE_URL,
              jobTitle: "AI & Systems Developer",
              alumniOf: {
                "@type": "CollegeOrUniversity",
                name: "Indian Institute of Information Technology, Pune",
              },
              sameAs: [
                "https://github.com/Lalit Sharma",
                "https://www.linkedin.com/in/Lalit Sharma/",
              ],
            }),
          }}
        /> */}


<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Person",
      name: "Lalit Sharma",
      url: SITE_URL,
      jobTitle: "AI Developer and AI Engineer",
      description:
        "AI Developer and AI Engineer focused on autonomous AI agents, Generative AI, LLM applications, RAG, AI data analytics, and computer vision.",
      alumniOf: {
        "@type": "CollegeOrUniversity",
        name: "Bharat Institute of Technology, Meerut",
      },
      knowsAbout: [
        "Artificial Intelligence",
        "AI Engineering",
        "Generative AI",
        "Large Language Models",
        "Retrieval-Augmented Generation",
        "Autonomous AI Agents",
        "LangChain",
        "LangGraph",
        "Model Context Protocol",
        "Python",
        "FastAPI",
        "Computer Vision",
        "Vector Search",
        "AI Data Analytics",
      ],
      sameAs: [
        // Replace these with your actual public profile URLs.
        "https://github.com/YOUR_GITHUB_USERNAME",
        "https://www.linkedin.com/in/YOUR_LINKEDIN_USERNAME/",
      ],
    }),
  }}
/>

        <SmoothScroll>{children}</SmoothScroll>
        {/* Detection-reticle cursor — body-level sibling so position:fixed is
            never trapped inside a transformed ancestor. Renders null on
            touch / reduced-motion. */}
        <CursorReticle />
        {/* Temporary OOM-investigation HUD — renders nothing without ?memprobe */}
        <MemProbe />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
