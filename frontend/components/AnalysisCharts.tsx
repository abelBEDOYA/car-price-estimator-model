"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { decimalYearToIsoDate } from "@/lib/date";

type Series = { x: number; y: number };

function toLineData(xs: number[], ys: number[]): Series[] {
  if (!xs?.length || !ys?.length) return [];
  const n = Math.min(xs.length, ys.length);
  const out: Series[] = [];
  for (let i = 0; i < n; i++) out.push({ x: xs[i], y: ys[i] });
  return out;
}

function CustomTooltip({
  active,
  payload,
  xLabel,
  xFormat,
}: {
  active?: boolean;
  payload?: { payload: Series }[];
  xLabel: string;
  xFormat: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div
      style={{
        background: "rgba(15,23,42,0.95)",
        border: "1px solid #334155",
        borderRadius: 8,
        padding: "8px 10px",
        fontSize: 12,
      }}
    >
      <div style={{ color: "#94a3b8" }}>
        {xLabel}: {xFormat(p.x)}
      </div>
      <div style={{ color: "#e2e8f0" }}>Precio: {p.y.toLocaleString("es-ES", { maximumFractionDigits: 0 })} €</div>
    </div>
  );
}

export function YearEvolutionChart({
  dates,
  prices,
}: {
  dates: number[];
  prices: number[];
}) {
  const data = toLineData(dates, prices);
  const empty = data.length === 0;
  return (
    <div className="chart-box">
      <h3 className="chart-title">Precio según año de matriculación</h3>
      {empty && <p className="muted" style={{ margin: 0, fontSize: 13 }}>No hay puntos para dibujar (inferencia vacía).</p>}
      <div style={{ width: "100%", minWidth: 0, height: 240 }}>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
            <XAxis dataKey="x" tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => String(v)} />
            <YAxis
              dataKey="y"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickFormatter={(v) => `${Math.round(v / 1000)}k`}
            />
            <Tooltip content={<CustomTooltip xLabel="Año" xFormat={(v) => String(Math.round(v))} />} />
            <Line type="monotone" dataKey="y" stroke="#38bdf8" strokeWidth={2} dot={false} hide={empty} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function DateEvolutionChart({
  dates,
  prices,
}: {
  dates: number[];
  prices: number[];
}) {
  const data = toLineData(dates, prices);
  const empty = data.length === 0;
  return (
    <div className="chart-box">
      <h3 className="chart-title">Precio según fecha de publicación (serie mensual 2019–2025)</h3>
      <p className="muted" style={{ margin: "0 0 0.5rem", fontSize: 12 }}>
        Eje X: año decimal del backend; etiqueta ≈ fecha ISO equivalente.
      </p>
      {empty && <p className="muted" style={{ margin: "0 0 0.5rem", fontSize: 13 }}>No hay puntos para dibujar (inferencia vacía).</p>}
      <div style={{ width: "100%", minWidth: 0, height: 240 }}>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
            <XAxis
              dataKey="x"
              minTickGap={24}
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              tickFormatter={(v) => decimalYearToIsoDate(Number(v))}
            />
            <YAxis
              dataKey="y"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickFormatter={(v) => `${Math.round(v / 1000)}k`}
            />
            <Tooltip
              content={
                <CustomTooltip xLabel="Fecha (aprox.)" xFormat={(v) => decimalYearToIsoDate(v)} />
              }
            />
            <Line type="monotone" dataKey="y" stroke="#818cf8" strokeWidth={2} dot={false} hide={empty} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function KmEvolutionChart({ kms, prices }: { kms: number[]; prices: number[] }) {
  const data = toLineData(kms, prices);
  const empty = data.length === 0;
  return (
    <div className="chart-box">
      <h3 className="chart-title">Precio según kilómetros</h3>
      {empty && <p className="muted" style={{ margin: 0, fontSize: 13 }}>No hay puntos para dibujar (inferencia vacía).</p>}
      <div style={{ width: "100%", minWidth: 0, height: 240 }}>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
            <XAxis
              dataKey="x"
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              tickFormatter={(v) => `${Math.round(v / 1000)}k km`}
            />
            <YAxis
              dataKey="y"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickFormatter={(v) => `${Math.round(v / 1000)}k`}
            />
            <Tooltip
              content={<CustomTooltip xLabel="Km" xFormat={(v) => `${Math.round(v).toLocaleString("es-ES")} km`} />}
            />
            <Line type="monotone" dataKey="y" stroke="#34d399" strokeWidth={2} dot={false} hide={empty} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function FuelBarChart({ data }: { data: { name: string; price: number }[] }) {
  const empty = !data?.length;
  return (
    <div className="chart-box">
      <h3 className="chart-title">Precio por tipo de combustible (resto fijo)</h3>
      {empty && <p className="muted" style={{ margin: 0, fontSize: 13 }}>Sin precios por combustible para esta combinación.</p>}
      <div style={{ width: "100%", minWidth: 0, height: 260 }}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 40 }}>
            <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} angle={-25} textAnchor="end" height={70} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
            <Tooltip
              formatter={(v: number) => [`${Math.round(v).toLocaleString("es-ES")} €`, "Precio"]}
              contentStyle={{ background: "#0f172a", border: "1px solid #334155" }}
            />
            <Bar dataKey="price" fill="#38bdf8" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ShiftBarChart({ data }: { data: { name: string; price: number }[] }) {
  const empty = !data?.length;
  return (
    <div className="chart-box">
      <h3 className="chart-title">Precio por tipo de cambio</h3>
      {empty && <p className="muted" style={{ margin: 0, fontSize: 13 }}>Sin precios por cambio para esta combinación.</p>}
      <div style={{ width: "100%", minWidth: 0, height: 220 }}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
            <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <Tooltip
              formatter={(v: number) => [`${Math.round(v).toLocaleString("es-ES")} €`, "Precio"]}
              contentStyle={{ background: "#0f172a", border: "1px solid #334155" }}
            />
            <Bar dataKey="price" fill="#a78bfa" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
