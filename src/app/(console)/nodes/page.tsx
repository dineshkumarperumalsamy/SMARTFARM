"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { SectionCard } from "@/components/section-card";
import { db } from "@/lib/firebase";

type NodeCard = {
  id: string;
  name: string;
  status: string;
  cropType: string;
  battery: number;
  signal: number;
};

type FirestoreNode = Partial<NodeCard> & {
  id?: string;
  battery?: number | string;
  signal?: number | string;
};

function statusClasses(status: string) {
  if (status === "Online") {
    return "text-emerald-300 border-emerald-400/35 bg-emerald-500/10";
  }

  if (status === "Warning") {
    return "text-amber-300 border-amber-400/35 bg-amber-500/10";
  }

  return "text-red-300 border-red-400/35 bg-red-500/10";
}

function toNumber(value: number | string | undefined) {
  if (typeof value === "number") return value;

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (!Number.isNaN(parsed)) return parsed;
  }

  return 0;
}

export default function NodesPage() {
  const [nodes, setNodes] = useState<NodeCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadNodes() {
      try {
        setError(null);

        const snapshot = await getDocs(collection(db, "nodes"));

        const nextNodes = snapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data() as FirestoreNode;

          return {
            id: data.id ?? docSnapshot.id,
            name: data.name ?? "Unnamed Node",
            status: data.status ?? "Offline",
            cropType: data.cropType ?? "Unknown",
            battery: toNumber(data.battery),
            signal: toNumber(data.signal),
          };
        });

        setNodes(nextNodes);
      } catch {
        setNodes([]);
        setError(
          "Unable to load nodes from Firebase Firestore. Check credentials or rules."
        );
      } finally {
        setLoading(false);
      }
    }

    loadNodes();
  }, []);

  return (
    <SectionCard title="Node Management" subtitle="Connected farm nodes">
      {loading ? (
        <p className="text-sm text-zinc-400">Loading nodes...</p>
      ) : error ? (
        <p className="text-sm text-zinc-400">{error}</p>
      ) : nodes.length === 0 ? (
        <p className="text-sm text-zinc-400">No nodes found.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {nodes.map((node) => (
            <Link
              key={node.id}
              href={`/nodes/${node.id}`}
              className="rounded-2xl border border-white/10 bg-black/35 p-4 transition hover:border-cyan-400/35 hover:bg-cyan-500/[0.08]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    {node.id}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-zinc-100">
                    {node.name}
                  </h3>
                </div>

                <span
                  className={`rounded-full border px-2 py-1 text-xs uppercase tracking-[0.12em] ${statusClasses(
                    node.status
                  )}`}
                >
                  {node.status}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <p className="flex justify-between text-zinc-300">
                  <span className="text-zinc-500">Crop Type</span>
                  <span>{node.cropType}</span>
                </p>

                <p className="flex justify-between text-zinc-300">
                  <span className="text-zinc-500">Battery</span>
                  <span>{node.battery}%</span>
                </p>

                <p className="flex justify-between text-zinc-300">
                  <span className="text-zinc-500">Signal Strength</span>
                  <span>{node.signal}%</span>
                </p>
              </div>

              <p className="mt-4 text-xs uppercase tracking-[0.18em] text-cyan-300">
                Open analytics →
              </p>
            </Link>
          ))}
        </div>
      )}
    </SectionCard>
  );
}