import { CircleLogo } from "./CircleLogo";

export function Nav() {
  return (
    <header className="absolute top-0 left-0 right-0 z-30 px-8 md:px-14 py-6 flex items-center justify-between">
      <a href="#top" className="flex items-center gap-2 text-foreground">
        <CircleLogo className="h-6 w-6" />
        <span className="text-mono text-sm tracking-[0.25em]">CIRCLE</span>
      </a>
      <nav className="hidden md:flex items-center gap-10 text-[15px] text-foreground/85">
        <a href="#features" className="hover:text-foreground">Features</a>
        <a href="#frameworks" className="hover:text-foreground">Frameworks</a>
        <a href="#getting-started" className="hover:text-foreground">Get Started</a>
        <a href="https://developers.circle.com" target="_blank" className="hover:text-foreground inline-flex items-center gap-1">
          Docs <span className="text-xs">↗</span>
        </a>
      </nav>
    </header>
  );
}
