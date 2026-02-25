import Link from "next/link";
import { SectionCard } from "@/components/section-card";
import { farmNodes } from "@/data/nodes";

function statusClasses(status: string) {
  if (status === "Online") {
    return "text-emerald-300 border-emerald-400/35 bg-emerald-500/10";
  }

  if (status === "Warning") {
    return "text-amber-300 border-amber-400/35 bg-amber-500/10";
  }

  return "text-red-300 border-red-400/35 bg-red-500/10";
}

export default function NodesPage() {
  return (
    <SectionCard title="Node Management" subtitle="Connected farm nodes">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {farmNodes.map((node) => (
          <Link
            key={node.id}
            href={`/nodes/${node.id}`}
            className="rounded-2xl border border-white/10 bg-black/35 p-4 transition hover:border-cyan-400/35 hover:bg-cyan-500/[0.08]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{node.id}</p>
                <h3 className="mt-2 text-lg font-semibold text-zinc-100">{node.name}</h3>
              </div>
              <span className={`rounded-full border px-2 py-1 text-xs uppercase tracking-[0.12em] ${statusClasses(node.status)}`}>
                {node.status}
              </span>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <p className="flex items-center justify-between text-zinc-300">
                <span className="text-zinc-500">Crop Type</span>
                <span>{node.cropType}</span>
              </p>
              <p className="flex items-center justify-between text-zinc-300">
                <span className="text-zinc-500">Battery</span>
                <span>{node.battery}%</span>
              </p>
              <p className="flex items-center justify-between text-zinc-300">
                <span className="text-zinc-500">Signal Strength</span>
                <span>{node.signal}%</span>
              </p>
            </div>

            <p className="mt-4 text-xs uppercase tracking-[0.18em] text-cyan-300">Open analytics →</p>
          </Link>
        ))}
      </div>
    </SectionCard>
  );
}
