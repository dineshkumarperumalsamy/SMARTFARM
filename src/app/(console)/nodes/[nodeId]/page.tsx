"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { SectionCard } from "@/components/section-card";
import { db } from "@/lib/firebase";

type NodeAnalytics = {
  id: string;
  name: string;
  temperature: number;
  humidity: number;
  gasLevel: number;
  battery: number;
  signal: number;
};

type RiskLevel = "SAFE" | "WARNING" | "CRITICAL";

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);

    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function calculateRisk(node: NodeAnalytics): RiskLevel {
  if (node.gasLevel > 150) {
    return "CRITICAL";
  }

  let score = 0;

  if (node.temperature > 30) {
    score += 1;
  }

  if (node.humidity > 75) {
    score += 1;
  }

  if (score === 0) {
    return "SAFE";
  }

  return "WARNING";
}

function riskClasses(risk: RiskLevel) {
  if (risk === "SAFE") {
    return "border-emerald-400/35 bg-emerald-500/10 text-emerald-300";
  }

  if (risk === "WARNING") {
    return "border-amber-400/35 bg-amber-500/10 text-amber-300";
  }

  return "border-red-400/35 bg-red-500/10 text-red-300";
}

function recommendationForRisk(risk: RiskLevel) {
  if (risk === "SAFE") {
    return "Safe to Hold";
  }

  if (risk === "WARNING") {
    return "Sell Soon";
  }

  return "Sell Immediately";
}

export default function NodeAnalyticsPage({ params }: { params: { nodeId: string } }) {
  const [node, setNode] = useState<NodeAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadNode() {
      try {
        setError(null);
        const snapshot = await getDoc(doc(db, "nodes", params.nodeId));

        if (!snapshot.exists()) {
          setNode(null);
          return;
        }

        const data = snapshot.data();

        setNode({
          id: snapshot.id,
          name: typeof data.name === "string" ? data.name : `Node ${snapshot.id}`,
          temperature: toNumber(data.temperature),
          humidity: toNumber(data.humidity ?? data.moisture),
          gasLevel: toNumber(data.gasLevel),
          battery: toNumber(data.battery),
          signal: toNumber(data.signal)
        });
      } catch {
        setError("Unable to load node analytics from Firebase Firestore.");
      } finally {
        setLoading(false);
      }
    }

    loadNode();
  }, [params.nodeId]);

  const risk = useMemo(() => (node ? calculateRisk(node) : null), [node]);
  const recommendation = risk ? recommendationForRisk(risk) : null;

  return (
    <main className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Node Analytics</p>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-100">{node?.name ?? "Node"}</h1>
        </div>
        <Link
          href="/nodes"
          className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.12em] text-zinc-300 transition hover:bg-white/10"
        >
          Back to nodes
        </Link>
      </div>

      {loading ? (
        <SectionCard title="Loading Node" subtitle="Fetching live document">
          <p className="text-sm text-zinc-400">Loading node analytics...</p>
        </SectionCard>
      ) : error ? (
        <SectionCard title="Node Analytics" subtitle="Firebase Firestore">
          <p className="text-sm text-zinc-400">{error}</p>
        </SectionCard>
      ) : !node ? (
        <SectionCard title="Node Analytics" subtitle="Firebase Firestore">
          <p className="text-sm text-zinc-400">Node not found.</p>
        </SectionCard>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <article className="rounded-xl border border-white/10 bg-black/35 p-4">
              <p className="text-sm text-zinc-500">Temperature</p>
              <p className="mt-2 text-xl font-semibold">{node.temperature}°C</p>
            </article>
            <article className="rounded-xl border border-white/10 bg-black/35 p-4">
              <p className="text-sm text-zinc-500">Humidity</p>
              <p className="mt-2 text-xl font-semibold">{node.humidity}%</p>
            </article>
            <article className="rounded-xl border border-white/10 bg-black/35 p-4">
              <p className="text-sm text-zinc-500">Gas Level</p>
              <p className="mt-2 text-xl font-semibold">{node.gasLevel} ppm</p>
            </article>
            <article className="rounded-xl border border-white/10 bg-black/35 p-4">
              <p className="text-sm text-zinc-500">Battery</p>
              <p className="mt-2 text-xl font-semibold">{node.battery}%</p>
            </article>
            <article className="rounded-xl border border-white/10 bg-black/35 p-4">
              <p className="text-sm text-zinc-500">Signal</p>
              <p className="mt-2 text-xl font-semibold">{node.signal}%</p>
            </article>
            <article className="rounded-xl border border-white/10 bg-black/35 p-4">
              <p className="text-sm text-zinc-500">Risk Status</p>
              <div className="mt-2">
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${riskClasses(risk)}`}>
                  {risk}
                </span>
              </div>
            </article>
          </section>

          <SectionCard title="Recommendation" subtitle="Storage decision engine">
            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <p className="text-sm text-zinc-400">Recommended action</p>
              <p className="mt-2 text-3xl font-semibold text-zinc-100">{recommendation}</p>
              <p className="mt-3 text-sm text-zinc-400">
                Risk logic: temperature &gt; 30°C increases risk, humidity &gt; 75% increases risk, gas level &gt; 150 ppm triggers CRITICAL.
              </p>
            </div>
          </SectionCard>
        </>
      )}
    </main>
  );
}
