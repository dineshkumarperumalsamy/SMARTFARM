import { MarketIntelligenceWidget } from "@/components/market-intelligence-widget";
import { SectionCard } from "@/components/section-card";

export default function MarketIntelligencePage() {
  return (
    <main className="space-y-5">
      <SectionCard title="Market Intelligence" subtitle="Commodity pulse">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            ["Tomatoes", "$2.13/kg", "+4.1%"],
            ["Leafy Greens", "$1.46/kg", "-1.2%"],
            ["Bell Peppers", "$2.88/kg", "+2.5%"]
          ].map(([crop, price, delta]) => (
            <article key={crop} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm text-zinc-400">{crop}</p>
              <p className="mt-2 text-xl font-semibold">{price}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.16em] text-cyan-300">{delta}</p>
            </article>
          ))}
        </div>
        <p className="mt-4 text-sm text-zinc-400">AI projection: regional demand likely to increase 6–9% over the next 14 days.</p>
      </SectionCard>

      <MarketIntelligenceWidget />
    </main>
  );
}
