"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { motion } from "framer-motion";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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

type SensorPoint = {
  index: number;
  temperature: number;
  humidity: number;
  gasLevel: number;
};

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

  if (node.gasLevel > 150)
    spoilage += 20;

  return {
    spoilagePercentage: Math.min(
      100,
      Math.max(0, Math.round(spoilage))
    ),
    remainingStorageDays: Math.max(
      0,
      shelfLife - daysStored
    ),
  };
}

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

  const [sensorBuffer, setSensorBuffer] =
    useState<SensorPoint[]>([]);

  useEffect(() => {
    return onSnapshot(
      doc(db, "nodes", params.nodeId),
      (snap) => {
        if (!snap.exists()) return;

        const d = snap.data();

        const nextNode = {
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
        };

        setNode(nextNode);

        setSensorBuffer((prev) => [
          ...prev.slice(-19),
          {
            index:
              prev.length > 0
                ? prev[prev.length - 1].index + 1
                : 1,
            temperature:
              nextNode.temperature,
            humidity:
              nextNode.humidity,
            gasLevel:
              nextNode.gasLevel,
          },
        ]);
      }
    );
  }, [params.nodeId]);

  if (!node)
    return (
      <SectionCard title="Loading..." />
    );

  const spoilage =
    calculateSpoilage(node);

  const risk =
    calculateRisk(node);

  const gaugeData = [
    {
      value:
        spoilage.spoilagePercentage,
    },
  ];

  return (
    <main className="space-y-6">

      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-between"
      >
        <h1 className="text-3xl font-semibold">
          {node.name}
        </h1>

        <Link href="/nodes">
          Back
        </Link>
      </motion.div>

      {/* GRAPH + GAUGE */}
      <section className="grid lg:grid-cols-2 gap-5">

        {/* LIVE GRAPH */}
        <SectionCard title="Live Sensors">
          <div className="h-80">
            <ResponsiveContainer>
              <LineChart
                data={sensorBuffer}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                />
                <XAxis dataKey="index" />
                <YAxis />
                <Tooltip />
                <Legend />

                <Line
                  dataKey="temperature"
                  stroke="#22d3ee"
                />
                <Line
                  dataKey="humidity"
                  stroke="#34d399"
                />
                <Line
                  dataKey="gasLevel"
                  stroke="#f97316"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* SPOILAGE GAUGE */}
        <SectionCard title="Spoilage Meter">
          <div className="h-72">
            <ResponsiveContainer>
              <RadialBarChart
                data={gaugeData}
                innerRadius="60%"
                outerRadius="95%"
                startAngle={210}
                endAngle={-30}
              >
                <PolarAngleAxis
                  type="number"
                  domain={[0, 100]}
                  tick={false}
                />

                <RadialBar
                  dataKey="value"
                  cornerRadius={10}
                />

                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  className="fill-white text-4xl"
                >
                  {
                    spoilage.spoilagePercentage
                  }
                  %
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </section>
    </main>
  );
}