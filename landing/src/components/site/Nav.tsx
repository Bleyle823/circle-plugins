import { Github } from "lucide-react";
import { CircleLogo } from "./CircleLogo";
import { NPM_CORE_URL, REPO_URL } from "@/lib/links";

export function Nav() {
  return (
    <header className="absolute top-0 left-0 right-0 z-30 px-8 md:px-14 py-6 flex items-center justify-between">
      <a href="#top" className="flex items-center gap-2 text-foreground">
        <CircleLogo className="h-6 w-6" />
        <span className="text-mono text-sm tracking-[0.25em]">CIRCLE PLUGINS</span>
      </a>
      <nav className="hidden md:flex items-center gap-10 text-[15px] text-foreground/85">
        <a href="#features" className="hover:text-foreground">
          Features
        </a>
        <a href="#frameworks" className="hover:text-foreground">
          Frameworks
        </a>
        <a href="#getting-started" className="hover:text-foreground">
          Get Started
        </a>
        <a
          href={NPM_CORE_URL}
          target="_blank"
          rel="noreferrer"
          className="hover:text-foreground inline-flex items-center gap-1"
        >
          npm <span className="text-xs">↗</span>
        </a>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-sm border border-white/20 px-3 py-1.5 text-mono text-[12px] tracking-wide text-white hover:bg-white/5 hover:border-accent-blue/50 transition"
        >
          <Github className="h-4 w-4" />
          GitHub
        </a>
      </nav>
    </header>
  );
}
