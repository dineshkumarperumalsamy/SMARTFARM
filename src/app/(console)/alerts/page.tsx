import { SectionCard } from "@/components/section-card";

const alerts = [
  { title: "Hydro Bay PH drift", severity: "High", action: "Inject balancing solution" },
  { title: "Node N-1242 battery low", severity: "Medium", action: "Dispatch maintenance route" },
  { title: "Silo C airflow variance", severity: "Low", action: "Inspect vent motor" }
];

export default function AlertsPage() {
  return (
    <SectionCard title="Active Alerts" subtitle="Monitoring and response">
      <div className="space-y-3">
        {alerts.map((alert) => (
          <article key={alert.title} className="rounded-xl border border-white/10 bg-black/30 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-medium">{alert.title}</h3>
              <span className="rounded-full border border-red-400/30 bg-red-500/10 px-2 py-1 text-xs uppercase tracking-[0.12em] text-red-300">
                {alert.severity}
              </span>
            </div>
            <p className="mt-2 text-sm text-zinc-400">Recommended action: {alert.action}</p>
          </article>
        ))}
      </div>
    </SectionCard>
  );
}
