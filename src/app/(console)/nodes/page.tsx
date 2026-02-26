"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { SectionCard } from "@/components/section-card";
import { db } from "@/lib/firebase";

/* ================= TYPES ================= */

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

/* ================= STATUS STYLE ================= */

function statusClasses(status: string) {
  if (status === "Online")
    return "text-emerald-300 border-emerald-400/35 bg-emerald-500/10";

  if (status === "Warning")
    return "text-amber-300 border-amber-400/35 bg-amber-500/10";

  return "text-red-300 border-red-400/35 bg-red-500/10";
}

/* ================= HELPERS ================= */

function toNumber(value: number | string | undefined) {
  if (typeof value === "number") return value;

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (!Number.isNaN(parsed)) return parsed;
  }

  return 0;
}

/* ================= PAGE ================= */

export default function NodesPage() {
  const [nodes, setNodes] = useState<NodeCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "nodes"),
      (snapshot) => {
        const nextNodes = snapshot.docs.map((doc) => {
          const data = doc.data() as FirestoreNode;

          return {
            id: data.id ?? doc.id,
            name: data.name ?? "Unnamed Node",
            status: data.status ?? "Offline",
            cropType: data.cropType ?? "Unknown",
            battery: toNumber(data.battery),
            signal: toNumber(data.signal),
          };
        });

        setNodes(nextNodes);
        setLoading(false);
      },
      () => {
        setError("Unable to load nodes.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <SectionCard
      title="Node Management"
      subtitle="Connected Smart Farm Nodes"
    >
      {loading ? (
        <p className="text-zinc-400">Loading nodes...</p>
      ) : error ? (
        <p className="text-zinc-400">{error}</p>
      ) : nodes.length === 0 ? (
        <p className="text-zinc-400">No nodes found.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {nodes.map((node) => (
            <Link
              key={node.id}
              href={`/nodes/${node.id}`}
              className="
                rounded-2xl
                border border-white/10
                bg-black/35
                p-5
                transition
                hover:border-cyan-400/40
                hover:bg-cyan-500/[0.06]
              "
            >
              {/* HEADER */}
              <div className="flex justify-between">
                <div>
                  <p className="text-xs text-zinc-500">
                    {node.id}
                  </p>

                  <h3 className="mt-2 text-lg font-semibold text-white">
                    {node.name}
                  </h3>
                </div>

                <span
                  className={`rounded-full border px-2 py-1 text-xs ${statusClasses(
                    node.status
                  )}`}
                >
                  {node.status}
                </span>
              </div>

              {/* DETAILS */}
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">
                    Crop
                  </span>
                  <span>{node.cropType}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-zinc-500">
                    Battery
                  </span>
                  <span>{node.battery}%</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-zinc-500">
                    Signal
                  </span>
                  <span>{node.signal}%</span>
                </div>
              </div>

              <p className="mt-4 text-xs text-cyan-300 uppercase">
                Open Analytics →
              </p>
            </Link>
          ))}
        </div>
      )}
    </SectionCard>
  );
}