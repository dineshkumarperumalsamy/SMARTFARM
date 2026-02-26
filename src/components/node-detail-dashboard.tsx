"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { SectionCard } from "@/components/section-card";
import type { FarmNode } from "@/data/nodes";
import { db } from "@/lib/firebase";

type Props = {
  node: FarmNode;
};

type NodeAssignment = {
  cropType: string;
  storageDate: string;
};

function scoreColor(score: number) {
  if (score >= 70) {
    return "#34d399";
  }

  if (score >= 40) {
    return "#fbbf24";
  }

  return "#f87171";
}

function metricGaugeData(value: number) {
  const safeValue = Math.max(0, Math.min(100, value));

  return [
    { name: "value", value: safeValue },
    { name: "rest", value: 100 - safeValue }
  ];
}

function toNumber(value: string) {
  const parsed = Number.parseFloat(value);

  if (Number.isNaN(parsed)) {
    return 0;
  }

  return parsed;
}

function buildTelemetry(seed: string, baseTemp: number, baseHumidity: number, baseGas: number) {
  return ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"].map((slot, index) => {
    const drift = ((seed.charCodeAt(index % seed.length) % 7) - 3) * 0.35;

    return {
      slot,
      temp: Number((baseTemp + drift).toFixed(1)),
      humidity: Number((baseHumidity + drift * 2.2).toFixed(1)),
      gas: Number((baseGas + drift * 4.1).toFixed(1))
    };
  });
}

function Gauge({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-xl border border-white/10 bg-black/35 p-4">
      <p className="text-sm text-zinc-500">{label}</p>
      <div className="mt-3 h-36 w-full">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={metricGaugeData(value)} dataKey="value" innerRadius={42} outerRadius={58} startAngle={210} endAngle={-30}>
              <Cell fill={scoreColor(value)} />
              <Cell fill="rgba(255,255,255,0.1)" />
            </Pie>
            <text x="50%" y="58%" textAnchor="middle" className="fill-zinc-100 text-xl font-semibold">
              {Math.round(value)}%
            </text>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

export function NodeDetailDashboard({ node }: Props) {
  const [assignment, setAssignment] = useState<NodeAssignment>({
    cropType: node.cropType,
    storageDate: ""
  });
  const [loadingAssignment, setLoadingAssignment] = useState(true);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    async function loadAssignment() {
      try {
        const assignmentRef = doc(db, "nodeAssignments", node.id);
        const assignmentSnapshot = await getDoc(assignmentRef);

        if (assignmentSnapshot.exists()) {
          const data = assignmentSnapshot.data() as Partial<NodeAssignment>;

          setAssignment({
            cropType: data.cropType ?? node.cropType,
            storageDate: data.storageDate ?? ""
          });
        }
      } catch {
        setSaveState("error");
      } finally {
        setLoadingAssignment(false);
      }
    }

    loadAssignment();
  }, [node.cropType, node.id]);

  const effectiveCropType = assignment.cropType || node.cropType;
  const temperature = toNumber(node.temperature);
  const humidity = toNumber(node.moisture);
  const gasPpm = Math.max(8, Math.round((100 - node.signal) * 1.9 + (100 - node.battery) * 0.6));
  const gasGauge = Math.min(100, Math.round(gasPpm / 2));

  const telemetry = buildTelemetry(node.id, temperature, humidity, gasPpm);

  const spoilageRisk = Math.max(
    5,
    Math.min(97, Math.round((humidity - 55) * 1.2 + (gasPpm - 35) * 1.05 + (node.status === "Offline" ? 25 : 0)))
  );

  const recommendation = spoilageRisk >= 60 ? "Hold" : "Sell";

  async function onSaveAssignment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveState("saving");

    try {
      await setDoc(doc(db, "nodeAssignments", node.id), {
        nodeId: node.id,
        cropType: assignment.cropType,
        storageDate: assignment.storageDate,
        updatedAt: new Date().toISOString()
      });
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  return (
    <main className="space-y-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-white/10 bg-black/35 p-4">
          <p className="text-sm text-zinc-500">Crop Type</p>
          <p className="mt-2 text-xl font-semibold">{effectiveCropType}</p>
        </article>
        <article className="rounded-xl border border-white/10 bg-black/35 p-4">
          <p className="text-sm text-zinc-500">Battery</p>
          <p className="mt-2 text-xl font-semibold">{node.battery}%</p>
        </article>
        <article className="rounded-xl border border-white/10 bg-black/35 p-4">
          <p className="text-sm text-zinc-500">Signal Strength</p>
          <p className="mt-2 text-xl font-semibold">{node.signal}%</p>
        </article>
        <article className="rounded-xl border border-white/10 bg-black/35 p-4">
          <p className="text-sm text-zinc-500">Storage Date</p>
          <p className="mt-2 text-xl font-semibold">{assignment.storageDate || "Not set"}</p>
        </article>
      </section>

      <SectionCard title="Node Assignment" subtitle="Crop + storage metadata">
        <form className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end" onSubmit={onSaveAssignment}>
          <label className="space-y-2 text-sm text-zinc-400">
            <span>Crop Type</span>
            <input
              className="w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-zinc-100 outline-none transition focus:border-cyan-400/50"
              value={assignment.cropType}
              onChange={(event) => setAssignment((current) => ({ ...current, cropType: event.target.value }))}
              placeholder="e.g. Tomatoes"
              required
            />
          </label>

          <label className="space-y-2 text-sm text-zinc-400">
            <span>Storage Date</span>
            <input
              type="date"
              className="w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-zinc-100 outline-none transition focus:border-cyan-400/50"
              value={assignment.storageDate}
              onChange={(event) => setAssignment((current) => ({ ...current, storageDate: event.target.value }))}
              required
            />
          </label>

          <button
            type="submit"
            className="rounded-xl border border-cyan-400/35 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={saveState === "saving" || loadingAssignment}
          >
            {saveState === "saving" ? "Saving..." : "Save Assignment"}
          </button>
        </form>

        <p className="mt-3 text-xs uppercase tracking-[0.16em] text-zinc-500">
          {loadingAssignment
            ? "Loading assignment..."
            : saveState === "saved"
              ? "Saved to Firebase Firestore"
              : saveState === "error"
                ? "Unable to save. Verify Firestore rules and credentials."
                : "Update crop type and storage date for this node."}
        </p>
      </SectionCard>

      <section className="grid gap-4 lg:grid-cols-3">
        <Gauge label="Temperature Gauge" value={Math.min(100, Math.max(0, temperature * 2.8))} />
        <Gauge label="Humidity Gauge" value={humidity} />
        <Gauge label="Gas Gauge" value={gasGauge} />
      </section>

      <SectionCard title="Live Telemetry Charts" subtitle="Recharts stream (24h)">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="h-52 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="mb-2 text-xs uppercase tracking-[0.14em] text-zinc-500">Temperature (°C)</p>
            <ResponsiveContainer>
              <AreaChart data={telemetry}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="slot" stroke="#71717a" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                <YAxis stroke="#71717a" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "#0b0f14", border: "1px solid rgba(255,255,255,0.15)" }} />
                <Area type="monotone" dataKey="temp" stroke="#22d3ee" fill="rgba(34,211,238,0.2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="h-52 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="mb-2 text-xs uppercase tracking-[0.14em] text-zinc-500">Humidity (%)</p>
            <ResponsiveContainer>
              <AreaChart data={telemetry}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="slot" stroke="#71717a" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                <YAxis stroke="#71717a" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "#0b0f14", border: "1px solid rgba(255,255,255,0.15)" }} />
                <Area type="monotone" dataKey="humidity" stroke="#38bdf8" fill="rgba(56,189,248,0.2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="h-52 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="mb-2 text-xs uppercase tracking-[0.14em] text-zinc-500">Gas (ppm)</p>
            <ResponsiveContainer>
              <AreaChart data={telemetry}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="slot" stroke="#71717a" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                <YAxis stroke="#71717a" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "#0b0f14", border: "1px solid rgba(255,255,255,0.15)" }} />
                <Area type="monotone" dataKey="gas" stroke="#f97316" fill="rgba(249,115,22,0.2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
        <SectionCard title="Spoilage Risk Indicator" subtitle="Predictive quality model">
          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-400">Current spoilage risk</p>
              <p className="text-2xl font-semibold" style={{ color: scoreColor(100 - spoilageRisk) }}>
                {spoilageRisk}%
              </p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full" style={{ width: `${spoilageRisk}%`, backgroundColor: spoilageRisk >= 60 ? "#f87171" : "#34d399" }} />
            </div>
            <p className="mt-3 text-sm text-zinc-400">
              Model input combines humidity trend, gas volatility, node uptime status, and environmental drift.
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Sell or Hold Recommendation" subtitle="Trade advisory">
          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <p className="text-sm text-zinc-400">Action</p>
            <p className={`mt-2 text-3xl font-semibold ${recommendation === "Sell" ? "text-emerald-300" : "text-amber-300"}`}>
              {recommendation}
            </p>
            <p className="mt-3 text-sm text-zinc-300">
              {recommendation === "Sell"
                ? "Quality metrics are stable and spoilage risk is under threshold. Favor immediate market execution."
                : "Spoilage risk is elevated. Hold inventory and trigger quality stabilization workflow before sale."}
            </p>
          </div>
        </SectionCard>
      </div>
    </main>
  );
}
