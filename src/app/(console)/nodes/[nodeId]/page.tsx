"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
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
  cropType: string;
  description: string;
  storageDate: string;
  expectedShelfLife: string;
  optimalTemp: number;
  optimalHumidity: number;
  storageStatus: string;
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

function toText(value: unknown, fallback = "-") {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function toDays(value: unknown, fallback = 0) {
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

function toDate(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function calculateSpoilage(node: NodeAnalytics) {
  const storageDate = toDate(node.storageDate);
  const now = new Date();
  const daysStored = storageDate ? Math.max(0, Math.floor((now.getTime() - storageDate.getTime()) / 86400000)) : 0;
  const expectedShelfLifeDays = Math.max(1, toDays(node.expectedShelfLife, 1));
  const freshnessRatio = daysStored / expectedShelfLifeDays;

  let spoilage = freshnessRatio * 60;

  if (node.temperature > node.optimalTemp) {
    spoilage += 15;
  }

  if (node.humidity > node.optimalHumidity) {
    spoilage += 10;
  }

  if (node.gasLevel > 150) {
    spoilage += 20;
  }

  const spoilagePercentage = Math.max(0, Math.min(100, Math.round(spoilage)));
  const remainingStorageDays = Math.max(0, expectedShelfLifeDays - daysStored);

  return {
    spoilagePercentage,
    remainingStorageDays
  };
}

function spoilageIndicator(spoilagePercentage: number) {
  if (spoilagePercentage < 40) {
    return {
      label: "Fresh",
      className: "border-emerald-400/35 bg-emerald-500/10 text-emerald-300"
    };
  }

  if (spoilagePercentage < 70) {
    return {
      label: "Warning",
      className: "border-amber-400/35 bg-amber-500/10 text-amber-300"
    };
  }

  return {
    label: "Critical",
    className: "border-red-400/35 bg-red-500/10 text-red-300"
  };
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
    setError(null);

    const unsubscribe = onSnapshot(
      doc(db, "nodes", params.nodeId),
      (snapshot) => {
        if (!snapshot.exists()) {
          setNode(null);
          setLoading(false);
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
          signal: toNumber(data.signal),
          cropType: toText(data.cropType),
          description: toText(data.description),
          storageDate: toText(data.storageDate),
          expectedShelfLife: toText(data.expectedShelfLife),
          optimalTemp: toNumber(data.optimalTemp),
          optimalHumidity: toNumber(data.optimalHumidity),
          storageStatus: toText(data.storageStatus)
        });
        setLoading(false);
      },
      () => {
        setNode(null);
        setError("Unable to load node analytics from Firebase Firestore.");
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [params.nodeId]);

  const risk = useMemo(() => (node ? calculateRisk(node) : null), [node]);
  const recommendation = risk ? recommendationForRisk(risk) : null;
  const spoilage = useMemo(() => (node ? calculateSpoilage(node) : null), [node]);
  const spoilageState = spoilage ? spoilageIndicator(spoilage.spoilagePercentage) : null;

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
          <SectionCard title="Crop Storage Metadata" subtitle="Stored crop profile">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <article className="rounded-xl border border-white/10 bg-black/35 p-4">
                <p className="text-sm text-zinc-500">Crop Type</p>
                <p className="mt-2 text-xl font-semibold">{node.cropType}</p>
              </article>
              <article className="rounded-xl border border-white/10 bg-black/35 p-4">
                <p className="text-sm text-zinc-500">Storage Date</p>
                <p className="mt-2 text-xl font-semibold">{node.storageDate}</p>
              </article>
              <article className="rounded-xl border border-white/10 bg-black/35 p-4">
                <p className="text-sm text-zinc-500">Expected Shelf Life</p>
                <p className="mt-2 text-xl font-semibold">{node.expectedShelfLife}</p>
              </article>
              <article className="rounded-xl border border-white/10 bg-black/35 p-4 md:col-span-2 xl:col-span-3">
                <p className="text-sm text-zinc-500">Description</p>
                <p className="mt-2 text-xl font-semibold">{node.description}</p>
              </article>
              <article className="rounded-xl border border-white/10 bg-black/35 p-4">
                <p className="text-sm text-zinc-500">Storage Status</p>
                <p className="mt-2 text-xl font-semibold">{node.storageStatus}</p>
              </article>
            </section>
          </SectionCard>

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
            <article className="rounded-xl border border-white/10 bg-black/35 p-4">
              <p className="text-sm text-zinc-500">Spoilage Percentage</p>
              <p className="mt-2 text-xl font-semibold">{spoilage?.spoilagePercentage ?? 0}%</p>
              <div className="mt-2">
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${spoilageState?.className ?? "border-white/10 text-zinc-300"}`}>
                  {spoilageState?.label ?? "Fresh"}
                </span>
              </div>
              <p className="mt-3 text-sm text-zinc-400">Remaining Storage Days: {spoilage?.remainingStorageDays ?? 0}</p>
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
