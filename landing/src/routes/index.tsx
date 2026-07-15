import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/site/Nav";
import { Hero } from "@/components/site/Hero";
import { PaymentAuthSection } from "@/components/site/PaymentAuthSection";
import { ProgrammableMoney } from "@/components/site/ProgrammableMoney";
import { UnlockSection } from "@/components/site/UnlockSection";
import { FrameworksSection } from "@/components/site/FrameworksSection";
import { FeaturesSection } from "@/components/site/FeaturesSection";
import { UseCasesSection } from "@/components/site/UseCasesSection";
import { StatsSection } from "@/components/site/StatsSection";
import { StickyCTA } from "@/components/site/StickyCTA";
import { REPO_URL } from "@/lib/links";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="relative min-h-screen bg-navy text-foreground">
      <Nav />
      <main className="relative">
        <Hero />
        <FrameworksSection />
        <FeaturesSection />
        <PaymentAuthSection />
        <ProgrammableMoney />
        <UseCasesSection />
        <UnlockSection />
        <StatsSection />
        <div className="h-24" />
      </main>
      <StickyCTA />
      <footer className="px-8 md:px-14 py-10 text-mono text-[11px] tracking-[0.2em] text-white/40 flex flex-col sm:flex-row sm:justify-between gap-4 border-t border-white/5">
        <span>© 2026 CIRCLE PLUGINS</span>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="hover:text-accent-blue transition"
        >
          github.com/Bleyle823/circle-plugins
        </a>
        <span>USDC · MADE FOR AGENTS</span>
      </footer>
    </div>
  );
}
