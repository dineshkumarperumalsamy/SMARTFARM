"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
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
  YAxis
} from "recharts";
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

type SensorPoint = {
  index: number;
  temperature: number;
  humidity: number;
  gasLevel: number;
};

type StorageForm = {
  cropType: string;
  storageDate: string;
  expectedShelfLife: string;
  optimalTemp: string;
  optimalHumidity: string;
  description: string;
};

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

function daysStoredFromDate(storageDate: string) {
  const parsed = toDate(storageDate);

  if (!parsed) {
    return 0;
  }

  const now = new Date();
  return Math.max(0, Math.floor((now.getTime() - parsed.getTime()) / 86400000));
}

function calculateSpoilage(node: NodeAnalytics) {
  const daysStored = daysStoredFromDate(node.storageDate);
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
    remainingStorageDays,
    daysStored
  };
}

function spoilageIndicator(spoilagePercentage: number) {
  if (spoilagePercentage < 40) {
    return {
      label: "Fresh",
      className: "border-emerald-400/35 bg-emerald-500/10 text-emerald-300",
      stroke: "#34d399"
    };
  }

  if (spoilagePercentage < 70) {
    return {
      label: "Warning",
      className: "border-amber-400/35 bg-amber-500/10 text-amber-300",
      stroke: "#fbbf24"
    };
  }

  return {
    label: "Critical",
    className: "border-red-400/35 bg-red-500/10 text-red-300",
    stroke: "#f87171"
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

  return "border-red-400/35 bg-red-500/10 text-red-300 animate-pulse";
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

function confidenceForRisk(risk: RiskLevel) {
  if (risk === "SAFE") {
    return 92;
  }

  if (risk === "WARNING") {
    return 78;
  }

  return 96;
}

function trendIcon(risk: RiskLevel) {
  if (risk === "SAFE") {
    return "↘";
  }

  if (risk === "WARNING") {
    return "→";
  }

  return "↗";
}

function panelClassName() {
  return "group rounded-2xl border border-cyan-400/20 bg-white/[0.03] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.5)] backdrop-blur-xl transition hover:border-cyan-300/45 hover:shadow-[0_0_25px_rgba(34,211,238,0.24)]";
}

function metricTone(value: number, warning: number, critical: number) {
  if (value >= critical) {
    return "#f87171";
  }

  if (value >= warning) {
    return "#fbbf24";
  }

  return "#34d399";
}

function SensorGauge({ label, value, unit, warning, critical }: { label: string; value: number; unit: string; warning: number; critical: number }) {
  const fill = metricTone(value, warning, critical);

  return (
    <article className={panelClassName()}>
      <div className="h-52">
        <ResponsiveContainer>
          <RadialBarChart innerRadius="58%" outerRadius="95%" data={[{ value: Math.min(100, Math.max(0, value)), fill }]} startAngle={210} endAngle={-30}>
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar background dataKey="value" cornerRadius={8} fill={fill} />
            <text x="50%" y="47%" textAnchor="middle" className="fill-zinc-100 text-3xl font-semibold">
              {Math.round(value)}
            </text>
            <text x="50%" y="58%" textAnchor="middle" className="fill-zinc-500 text-xs uppercase tracking-[0.14em]">
              {unit}
            </text>
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-center text-sm text-zinc-300">{label}</p>
    </article>
  );
}

export default function NodeAnalyticsPage({ params }: { params: { nodeId: string } }) {
  const [node, setNode] = useState<NodeAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sensorBuffer, setSensorBuffer] = useState<SensorPoint[]>([]);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [storageForm, setStorageForm] = useState<StorageForm>({
    cropType: "",
    storageDate: "",
    expectedShelfLife: "",
    optimalTemp: "",
    optimalHumidity: "",
    description: ""
  });

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

        const mappedNode: NodeAnalytics = {
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
        };

        setNode(mappedNode);
        setStorageForm({
          cropType: mappedNode.cropType === "-" ? "" : mappedNode.cropType,
          storageDate: mappedNode.storageDate === "-" ? "" : mappedNode.storageDate,
          expectedShelfLife: mappedNode.expectedShelfLife === "-" ? "" : mappedNode.expectedShelfLife,
          optimalTemp: mappedNode.optimalTemp ? String(mappedNode.optimalTemp) : "",
          optimalHumidity: mappedNode.optimalHumidity ? String(mappedNode.optimalHumidity) : "",
          description: mappedNode.description === "-" ? "" : mappedNode.description
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

  useEffect(() => {
    if (!node) {
      return;
    }

    setSensorBuffer((current) => {
      const next = [
        ...current,
        {
          index: current.length > 0 ? current[current.length - 1].index + 1 : 1,
          temperature: node.temperature,
          humidity: node.humidity,
          gasLevel: node.gasLevel
        }
      ];

      return next.slice(-20);
    });
  }, [node]);

  const risk = useMemo(() => (node ? calculateRisk(node) : null), [node]);
  const recommendation = risk ? recommendationForRisk(risk) : null;
  const spoilage = useMemo(() => (node ? calculateSpoilage(node) : null), [node]);
  const spoilageState = spoilage ? spoilageIndicator(spoilage.spoilagePercentage) : null;
  const confidence = risk ? confidenceForRisk(risk) : 0;
  const gaugeData = [{ value: spoilage?.spoilagePercentage ?? 0, fill: spoilageState?.stroke ?? "#34d399" }];

  async function onAssignStorage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!node) {
      return;
    }

    setSaveState("saving");

    try {
      await updateDoc(doc(db, "nodes", node.id), {
        cropType: storageForm.cropType,
        storageDate: storageForm.storageDate,
        expectedShelfLife: storageForm.expectedShelfLife,
        optimalTemp: toNumber(storageForm.optimalTemp),
        optimalHumidity: toNumber(storageForm.optimalHumidity),
        description: storageForm.description,
        storageStatus: "Active"
      });
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  return (
    <main className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-cyan-400/25 bg-gradient-to-r from-cyan-500/10 via-transparent to-emerald-500/10 p-6 shadow-[0_0_30px_rgba(34,211,238,0.18)]"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Smart Storage Intelligence</p>
            <h1 className="mt-2 text-3xl font-semibold text-zinc-100">{node?.name ?? "Node"}</h1>
          </div>
          <div className="flex items-center gap-3">
            {risk && (
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${riskClasses(risk)}`}>
                {risk}
              </span>
            )}
            <Link
              href="/nodes"
              className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.12em] text-zinc-300 transition hover:bg-white/10"
            >
              Back to nodes
            </Link>
          </div>
        </div>
      </motion.section>

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
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={panelClassName()}>
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Storage Summary</p>
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-black/35 p-3"><p className="text-xs text-zinc-500">Crop Type</p><p className="mt-1 font-semibold">{node.cropType}</p></div>
              <div className="rounded-xl border border-white/10 bg-black/35 p-3"><p className="text-xs text-zinc-500">Storage Date</p><p className="mt-1 font-semibold">{node.storageDate}</p></div>
              <div className="rounded-xl border border-white/10 bg-black/35 p-3"><p className="text-xs text-zinc-500">Days Stored</p><p className="mt-1 font-semibold">{spoilage?.daysStored ?? 0}</p></div>
              <div className="rounded-xl border border-white/10 bg-black/35 p-3"><p className="text-xs text-zinc-500">Storage Status</p><p className="mt-1 font-semibold">{node.storageStatus}</p></div>
              <div className="rounded-xl border border-white/10 bg-black/35 p-3"><p className="text-xs text-zinc-500">Temperature</p><p className="mt-1 font-semibold">{node.temperature}°C</p></div>
              <div className="rounded-xl border border-white/10 bg-black/35 p-3"><p className="text-xs text-zinc-500">Humidity</p><p className="mt-1 font-semibold">{node.humidity}%</p></div>
              <div className="rounded-xl border border-white/10 bg-black/35 p-3"><p className="text-xs text-zinc-500">Battery</p><p className="mt-1 font-semibold">{node.battery}%</p></div>
              <div className="rounded-xl border border-white/10 bg-black/35 p-3"><p className="text-xs text-zinc-500">Signal</p><p className="mt-1 font-semibold">{node.signal}%</p></div>
            </div>
          </motion.section>

          <section className="grid gap-4 md:grid-cols-3">
            <SensorGauge label="Temperature Gauge" value={node.temperature * 2.5} unit="°C" warning={65} critical={80} />
            <SensorGauge label="Humidity Gauge" value={node.humidity} unit="%" warning={70} critical={85} />
            <SensorGauge label="Gas Level Gauge" value={Math.min(100, node.gasLevel / 2)} unit="ppm" warning={60} critical={75} />
          </section>

          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={panelClassName()}>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Realtime Environmental Telemetry</p>
              <p className="text-xs text-zinc-400">Last {sensorBuffer.length} readings</p>
            </div>
            <div className="h-80">
              <ResponsiveContainer>
                <LineChart data={sensorBuffer}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
                  <XAxis dataKey="index" stroke="#71717a" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                  <YAxis stroke="#71717a" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "#0a1016", border: "1px solid rgba(255,255,255,0.14)", borderRadius: "12px" }} />
                  <Legend wrapperStyle={{ color: "#d4d4d8" }} />
                  <Line type="monotone" dataKey="temperature" stroke="#22d3ee" strokeWidth={3} dot={false} isAnimationActive style={{ filter: "drop-shadow(0 0 8px rgba(34,211,238,0.7))" }} />
                  <Line type="monotone" dataKey="humidity" stroke="#34d399" strokeWidth={3} dot={false} isAnimationActive style={{ filter: "drop-shadow(0 0 8px rgba(52,211,153,0.7))" }} />
                  <Line type="monotone" dataKey="gasLevel" stroke="#f97316" strokeWidth={3} dot={false} isAnimationActive style={{ filter: "drop-shadow(0 0 8px rgba(249,115,22,0.7))" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.section>

          <section className="grid gap-4 xl:grid-cols-2">
            <motion.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={panelClassName()}>
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Add New Storage Item</p>
              <form className="mt-4 grid gap-3" onSubmit={onAssignStorage}>
                <input className="rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-zinc-100" placeholder="Crop Type" value={storageForm.cropType} onChange={(e)=>setStorageForm((c)=>({...c,cropType:e.target.value}))} required />
                <input type="date" className="rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-zinc-100" value={storageForm.storageDate} onChange={(e)=>setStorageForm((c)=>({...c,storageDate:e.target.value}))} required />
                <input className="rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-zinc-100" placeholder="Expected Shelf Life (days)" value={storageForm.expectedShelfLife} onChange={(e)=>setStorageForm((c)=>({...c,expectedShelfLife:e.target.value}))} required />
                <input className="rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-zinc-100" placeholder="Optimal Temperature" value={storageForm.optimalTemp} onChange={(e)=>setStorageForm((c)=>({...c,optimalTemp:e.target.value}))} required />
                <input className="rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-zinc-100" placeholder="Optimal Humidity" value={storageForm.optimalHumidity} onChange={(e)=>setStorageForm((c)=>({...c,optimalHumidity:e.target.value}))} required />
                <textarea className="rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-zinc-100" placeholder="Description" rows={3} value={storageForm.description} onChange={(e)=>setStorageForm((c)=>({...c,description:e.target.value}))} required />
                <button type="submit" className="rounded-xl border border-cyan-400/35 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/20">
                  Assign Storage Node
                </button>
                <p className="text-xs text-zinc-500">
                  {saveState === "saved" ? "Storage metadata saved." : saveState === "error" ? "Save failed. Check Firestore permissions." : ""}
                </p>
              </form>
            </motion.article>

            <motion.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={panelClassName()}>
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Spoilage Prediction Meter</p>
              <div className="h-64 mt-2">
                <ResponsiveContainer>
                  <RadialBarChart innerRadius="55%" outerRadius="95%" data={gaugeData} startAngle={210} endAngle={-30}>
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                    <RadialBar background dataKey="value" cornerRadius={10} fill={spoilageState?.stroke ?? "#34d399"} />
                    <text x="50%" y="48%" textAnchor="middle" className="fill-zinc-100 text-4xl font-semibold">
                      {spoilage?.spoilagePercentage ?? 0}%
                    </text>
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${spoilageState?.className ?? "border-white/10 text-zinc-300"}`}>
                  {spoilageState?.label ?? "Fresh"}
                </span>
                <span className="text-sm text-zinc-400">Remaining {spoilage?.remainingStorageDays ?? 0} days</span>
              </div>
            </motion.article>
          </section>

          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={panelClassName()}>
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">AI Recommendation Panel</p>
            <div className="mt-4 rounded-xl border border-white/10 bg-black/35 p-4 space-y-2">
              <p className="text-3xl font-semibold text-zinc-100">{recommendation}</p>
              <p className="text-sm text-zinc-400">Confidence: {confidence}%</p>
              <p className="text-sm text-zinc-400">Trend: {trendIcon(risk)} realtime sensor drift.</p>
              <p className="text-sm text-zinc-400">Explanation: High temperature/humidity and gas spikes reduce storage viability and increase spoilage urgency.</p>
            </div>
          </motion.section>
        </>
      )}
    </main>
  );
}
