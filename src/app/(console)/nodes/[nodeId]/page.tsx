"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { SectionCard } from "@/components/section-card";
import { db } from "@/lib/firebase";

/* ================= TYPES ================= */

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

/* ================= HELPERS ================= */

const toNumber = (v: unknown, f = 0) =>
  typeof v === "number"
    ? v
    : typeof v === "string" && !isNaN(+v)
    ? +v
    : f;

const toText = (v: unknown, f = "-") =>
  typeof v === "string" && v.trim() ? v : f;

const toDate = (v: unknown) =>
  typeof v === "string" ? new Date(v) : null;

/* ================= SPOILAGE ENGINE ================= */

function calculateSpoilage(node: NodeAnalytics) {
  const storageDate = toDate(node.storageDate);
  const now = new Date();

  const daysStored = storageDate
    ? Math.max(
        0,
        Math.floor(
          (now.getTime() - storageDate.getTime()) /
            86400000
        )
      )
    : 0;

  const shelfLife = Math.max(
    1,
    toNumber(node.expectedShelfLife, 1)
  );

  let spoilage = (daysStored / shelfLife) * 60;

  if (node.temperature > node.optimalTemp)
    spoilage += 15;

  if (node.humidity > node.optimalHumidity)
    spoilage += 10;

  if (node.gasLevel > 150) spoilage += 20;

  return {
    spoilagePercentage: Math.min(
      100,
      Math.max(0, Math.round(spoilage))
    ),
    remainingDays: Math.max(
      0,
      shelfLife - daysStored
    ),
  };
}

function spoilageState(p: number) {
  if (p < 40)
    return {
      label: "Fresh",
      cls: "text-emerald-300 border-emerald-400/35",
    };

  if (p < 70)
    return {
      label: "Warning",
      cls: "text-amber-300 border-amber-400/35",
    };

  return {
    label: "Critical",
    cls: "text-red-300 border-red-400/35",
  };
}

/* ================= RISK ================= */

function calculateRisk(
  n: NodeAnalytics
): RiskLevel {
  if (n.gasLevel > 150) return "CRITICAL";

  let s = 0;
  if (n.temperature > 30) s++;
  if (n.humidity > 75) s++;

  return s === 0 ? "SAFE" : "WARNING";
}

/* ================= COMPONENT ================= */

export default function NodeAnalyticsPage({
  params,
}: {
  params: { nodeId: string };
}) {
  const [node, setNode] =
    useState<NodeAnalytics | null>(null);

  useEffect(() => {
    return onSnapshot(
      doc(db, "nodes", params.nodeId),
      (snap) => {
        if (!snap.exists()) return;

        const d = snap.data();

        setNode({
          id: snap.id,
          name: toText(d.name),

          temperature: toNumber(d.temperature),
          humidity: toNumber(
            d.humidity ?? d.moisture
          ),
          gasLevel: toNumber(d.gasLevel),
          battery: toNumber(d.battery),
          signal: toNumber(d.signal),

          cropType: toText(d.cropType),
          description: toText(d.description),
          storageDate: toText(d.storageDate),
          expectedShelfLife: toText(
            d.expectedShelfLife
          ),
          optimalTemp: toNumber(
            d.optimalTemp
          ),
          optimalHumidity: toNumber(
            d.optimalHumidity
          ),
          storageStatus: toText(
            d.storageStatus
          ),
        });
      }
    );
  }, [params.nodeId]);

  if (!node)
    return (
      <SectionCard title="Loading..." />
    );

  const spoilage =
    calculateSpoilage(node);

  const spoil =
    spoilageState(
      spoilage.spoilagePercentage
    );

  const risk =
    calculateRisk(node);

  return (
    <main className="space-y-5">
      <h1 className="text-2xl font-semibold">
        {node.name}
      </h1>

      <SectionCard title="Crop Metadata">
        <p>{node.cropType}</p>
        <p>{node.storageDate}</p>
        <p>{node.description}</p>
      </SectionCard>

      <SectionCard title="Live Sensors">
        <p>
          Temp: {node.temperature}°C
        </p>
        <p>
          Humidity: {node.humidity}%
        </p>
        <p>
          Gas: {node.gasLevel}
        </p>
      </SectionCard>

      <SectionCard title="Spoilage">
        <p>
          {spoilage.spoilagePercentage}%
        </p>
        <span className={spoil.cls}>
          {spoil.label}
        </span>
        <p>
          Remaining Days:
          {spoilage.remainingDays}
        </p>
      </SectionCard>

      <SectionCard title="Decision">
        {risk === "SAFE"
          ? "Safe to Hold"
          : risk === "WARNING"
          ? "Sell Soon"
          : "Sell Immediately"}
      </SectionCard>

      <Link href="/nodes">
        Back
      </Link>
    </main>
  );
}