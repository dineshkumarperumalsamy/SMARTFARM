"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";

import { db } from "@/lib/firebase";
import { SectionCard } from "@/components/section-card";

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
  storageDate: string;
  expectedShelfLife: string;
  optimalTemp: number;
  optimalHumidity: number;
  description: string;
  storageStatus: string;
};

type SensorPoint = {
  index: number;
  temperature: number;
  humidity: number;
  gasLevel: number;
};

/* ================= HELPERS ================= */

const toNumber = (v: any) =>
  typeof v === "number" ? v : Number(v) || 0;

const toText = (v: any) =>
  typeof v === "string" && v.trim() ? v : "-";

const daysStored = (date: string) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return 0;
  return Math.floor(
    (Date.now() - d.getTime()) / 86400000
  );
};

/* ================= SPOILAGE ================= */

function calculateSpoilage(n: NodeAnalytics) {
  const stored = daysStored(n.storageDate);
  const shelf = Math.max(
    1,
    toNumber(n.expectedShelfLife)
  );

  let spoilage = (stored / shelf) * 60;

  if (n.temperature > n.optimalTemp)
    spoilage += 15;

  if (n.humidity > n.optimalHumidity)
    spoilage += 10;

  if (n.gasLevel > 150)
    spoilage += 20;

  return {
    percent: Math.min(
      100,
      Math.max(0, Math.round(spoilage))
    ),
    stored,
    remaining: Math.max(0, shelf - stored),
  };
}

/* ================= GAUGE ================= */

function Gauge({
  label,
  value,
  unit,
}: any) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
      <div className="h-44">
        <ResponsiveContainer>
          <RadialBarChart
            innerRadius="60%"
            outerRadius="95%"
            data={[{ value }]}
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
              cornerRadius={8}
            />
            <text
              x="50%"
              y="48%"
              textAnchor="middle"
              className="fill-white text-2xl"
            >
              {Math.round(value)}
            </text>
            <text
              x="50%"
              y="60%"
              textAnchor="middle"
              className="fill-gray-400 text-xs"
            >
              {unit}
            </text>
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-center text-sm mt-2">
        {label}
      </p>
    </div>
  );
}

/* ================= PAGE ================= */

export default function NodeAnalyticsPage({
  params,
}: {
  params: { nodeId: string };
}) {
  const [node, setNode] =
    useState<NodeAnalytics | null>(null);

  const [buffer, setBuffer] =
    useState<SensorPoint[]>([]);

  const [form, setForm] = useState({
    cropType: "",
    storageDate: "",
    expectedShelfLife: "",
    optimalTemp: "",
    optimalHumidity: "",
    description: "",
  });

  /* FIREBASE */
  useEffect(() => {
    return onSnapshot(
      doc(db, "nodes", params.nodeId),
      (snap) => {
        if (!snap.exists()) return;

        const d = snap.data();

        const mapped = {
          id: snap.id,
          name: toText(d.name),
          temperature: toNumber(
            d.temperature
          ),
          humidity: toNumber(
            d.humidity
          ),
          gasLevel: toNumber(
            d.gasLevel
          ),
          battery: toNumber(
            d.battery
          ),
          signal: toNumber(
            d.signal
          ),
          cropType: toText(
            d.cropType
          ),
          storageDate: toText(
            d.storageDate
          ),
          expectedShelfLife:
            toText(
              d.expectedShelfLife
            ),
          optimalTemp:
            toNumber(
              d.optimalTemp
            ),
          optimalHumidity:
            toNumber(
              d.optimalHumidity
            ),
          description:
            toText(
              d.description
            ),
          storageStatus:
            toText(
              d.storageStatus
            ),
        };

        setNode(mapped);

        setBuffer((prev) => [
          ...prev.slice(-19),
          {
            index:
              prev.length + 1,
            temperature:
              mapped.temperature,
            humidity:
              mapped.humidity,
            gasLevel:
              mapped.gasLevel,
          },
        ]);
      }
    );
  }, [params.nodeId]);

  if (!node)
    return (
      <SectionCard title="Loading..." />
    );

  const spoil =
    calculateSpoilage(node);

  /* SAVE STORAGE */
  async function saveStorage(
    e: any
  ) {
    e.preventDefault();

    await updateDoc(
      doc(db, "nodes", node.id),
      {
        ...form,
        optimalTemp:
          toNumber(
            form.optimalTemp
          ),
        optimalHumidity:
          toNumber(
            form.optimalHumidity
          ),
        storageStatus:
          "Active",
      }
    );
  }

  return (
    <main className="space-y-6">

{/* HEADER */}
<motion.div
initial={{opacity:0}}
animate={{opacity:1}}
className="flex justify-between"
>
<h1 className="text-3xl font-semibold">
{node.name}
</h1>

<Link href="/nodes">
Back
</Link>
</motion.div>

{/* STORAGE SUMMARY */}
<SectionCard title="Storage Summary">
<div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
<p>Crop: {node.cropType}</p>
<p>Days Stored: {spoil.stored}</p>
<p>Battery: {node.battery}%</p>
<p>Signal: {node.signal}%</p>
<p>Temp: {node.temperature}°C</p>
<p>Humidity: {node.humidity}%</p>
</div>
</SectionCard>

{/* SENSOR GAUGES */}
<div className="grid md:grid-cols-3 gap-4">
<Gauge
label="Temperature"
value={(node.temperature/50)*100}
unit="°C"
/>

<Gauge
label="Humidity"
value={node.humidity}
unit="%"
/>

<Gauge
label="Gas"
value={(node.gasLevel/300)*100}
unit="ppm"
/>
</div>

{/* LIVE GRAPH */}
<SectionCard title="Live Sensors">
<div className="h-80">
<ResponsiveContainer>
<LineChart data={buffer}>
<CartesianGrid strokeDasharray="3 3"/>
<XAxis dataKey="index"/>
<YAxis/>
<Tooltip/>
<Line dataKey="temperature"/>
<Line dataKey="humidity"/>
<Line dataKey="gasLevel"/>
</LineChart>
</ResponsiveContainer>
</div>
</SectionCard>

{/* ADD STORAGE */}
<SectionCard title="Assign Storage">
<form
onSubmit={saveStorage}
className="grid gap-3"
>
<input placeholder="Crop"
onChange={(e)=>setForm({...form,cropType:e.target.value})}/>
<input type="date"
onChange={(e)=>setForm({...form,storageDate:e.target.value})}/>
<input placeholder="Shelf Life"
onChange={(e)=>setForm({...form,expectedShelfLife:e.target.value})}/>
<input placeholder="Optimal Temp"
onChange={(e)=>setForm({...form,optimalTemp:e.target.value})}/>
<input placeholder="Optimal Humidity"
onChange={(e)=>setForm({...form,optimalHumidity:e.target.value})}/>
<textarea placeholder="Description"
onChange={(e)=>setForm({...form,description:e.target.value})}/>
<button className="border p-2">
Save
</button>
</form>
</SectionCard>

{/* SPOILAGE */}
<SectionCard title="Spoilage Meter">
<h2 className="text-4xl">
{spoil.percent}%
</h2>
<p>
Remaining Days:
{spoil.remaining}
</p>
</SectionCard>

{/* AI DECISION */}
<SectionCard title="Recommendation">
{spoil.percent < 40
? "Safe to Hold"
: spoil.percent < 70
? "Sell Soon"
: "Sell Immediately"}
</SectionCard>

</main>
);
}