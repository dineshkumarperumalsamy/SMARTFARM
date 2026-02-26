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
  spoilageChance: number;
  storageStatus: string;
};

type RiskLevel = "SAFE" | "WARNING" | "CRITICAL";

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return fallback;
}

function toText(value: unknown, fallback = "-") {
  return typeof value === "string" && value.trim()
    ? value
    : fallback;
}

function calculateRisk(node: NodeAnalytics): RiskLevel {
  if (node.gasLevel > 150) return "CRITICAL";

  let score = 0;
  if (node.temperature > 30) score++;
  if (node.humidity > 75) score++;

  if (score === 0) return "SAFE";
  return "WARNING";
}

function riskClasses(risk: RiskLevel) {
  if (risk === "SAFE")
    return "border-emerald-400/35 bg-emerald-500/10 text-emerald-300";

  if (risk === "WARNING")
    return "border-amber-400/35 bg-amber-500/10 text-amber-300";

  return "border-red-400/35 bg-red-500/10 text-red-300";
}

function recommendationForRisk(risk: RiskLevel) {
  if (risk === "SAFE") return "Safe to Hold";
  if (risk === "WARNING") return "Sell Soon";
  return "Sell Immediately";
}

export default function NodeAnalyticsPage({
  params,
}: {
  params: { nodeId: string };
}) {
  const [node, setNode] =
    useState<NodeAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
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
          name:
            typeof data.name === "string"
              ? data.name
              : `Node ${snapshot.id}`,

          temperature: toNumber(data.temperature),
          humidity: toNumber(
            data.humidity ?? data.moisture
          ),
          gasLevel: toNumber(data.gasLevel),
          battery: toNumber(data.battery),
          signal: toNumber(data.signal),

          cropType: toText(data.cropType),
          description: toText(data.description),
          storageDate: toText(data.storageDate),
          expectedShelfLife: toText(
            data.expectedShelfLife
          ),
          optimalTemp: toNumber(data.optimalTemp),
          optimalHumidity: toNumber(
            data.optimalHumidity
          ),
          spoilageChance: toNumber(
            data.spoilageChance
          ),
          storageStatus: toText(
            data.storageStatus
          ),
        });

        setLoading(false);
      },
      () => {
        setError(
          "Unable to load node analytics."
        );
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [params.nodeId]);

  const risk = useMemo(
    () => (node ? calculateRisk(node) : null),
    [node]
  );

  const recommendation =
    risk && recommendationForRisk(risk);

  if (loading)
    return (
      <SectionCard title="Loading Node">
        Loading analytics...
      </SectionCard>
    );

  if (error)
    return (
      <SectionCard title="Error">
        {error}
      </SectionCard>
    );

  if (!node)
    return (
      <SectionCard title="Node Not Found" />
    );

  return (
    <main className="space-y-5">
      <div className="flex justify-between">
        <h1 className="text-2xl font-semibold">
          {node.name}
        </h1>

        <Link href="/nodes">Back</Link>
      </div>

      {/* STORAGE METADATA */}
      <SectionCard title="Crop Storage Metadata">
        <p>Crop: {node.cropType}</p>
        <p>Stored: {node.storageDate}</p>
        <p>Status: {node.storageStatus}</p>
        <p>{node.description}</p>
      </SectionCard>

      {/* SENSOR DATA */}
      <SectionCard title="Live Sensors">
        <p>Temp: {node.temperature}°C</p>
        <p>Humidity: {node.humidity}%</p>
        <p>Gas: {node.gasLevel} ppm</p>
      </SectionCard>

      {/* DECISION */}
      <SectionCard title="Recommendation">
        {recommendation}
      </SectionCard>
    </main>
  );
}