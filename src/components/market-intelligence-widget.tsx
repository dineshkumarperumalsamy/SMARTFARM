const cropMarkets = [
  {
    crop: "Tomatoes",
    price: 2.34,
    trend: "+6.2%",
    direction: "up",
    recommendedWindow: "Tue 09:00 – Tue 12:00"
  },
  {
    crop: "Leafy Greens",
    price: 1.52,
    trend: "-1.8%",
    direction: "down",
    recommendedWindow: "Hold until Thu 07:00"
  },
  {
    crop: "Bell Peppers",
    price: 2.91,
    trend: "+3.1%",
    direction: "up",
    recommendedWindow: "Wed 10:00 – Wed 13:30"
  },
  {
    crop: "Strawberries",
    price: 3.44,
    trend: "+8.4%",
    direction: "up",
    recommendedWindow: "Sell now (peak demand)"
  }
];

function trendStyles(direction: string) {
  if (direction === "up") {
    return {
      indicator: "↗",
      className: "text-emerald-300 border-emerald-400/35 bg-emerald-500/10"
    };
  }

  return {
    indicator: "↘",
    className: "text-amber-300 border-amber-400/35 bg-amber-500/10"
  };
}

export function MarketIntelligenceWidget() {
  return (
    <section className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Trading signal widget</p>
          <h2 className="mt-2 text-xl font-semibold text-zinc-100">Crop Price Intelligence</h2>
        </div>
        <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-[0.12em] text-cyan-200">
          Live feed
        </span>
      </header>

      <div className="space-y-3">
        {cropMarkets.map((entry) => {
          const trend = trendStyles(entry.direction);

          return (
            <article key={entry.crop} className="rounded-xl border border-white/10 bg-black/30 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-zinc-400">{entry.crop}</p>
                  <p className="mt-1 text-2xl font-semibold text-zinc-100">${entry.price.toFixed(2)}/kg</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${trend.className}`}>
                    {trend.indicator} {entry.trend}
                  </span>
                </div>
              </div>

              <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Recommended selling window</p>
                <p className="mt-1 text-sm text-zinc-200">{entry.recommendedWindow}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
