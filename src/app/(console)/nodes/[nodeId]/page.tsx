import Link from "next/link";
import { notFound } from "next/navigation";
import { NodeDetailDashboard } from "@/components/node-detail-dashboard";
import { getFarmNode } from "@/data/nodes";

export default function NodeAnalyticsPage({ params }: { params: { nodeId: string } }) {
  const node = getFarmNode(params.nodeId);

  if (!node) {
    notFound();
  }

  return (
    <main className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Node Analytics</p>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-100">{node.name}</h1>
        </div>
        <Link
          href="/nodes"
          className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.12em] text-zinc-300 transition hover:bg-white/10"
        >
          Back to nodes
        </Link>
      </div>

      <NodeDetailDashboard node={node} />
    </main>
  );
}
