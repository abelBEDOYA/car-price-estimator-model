"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DateEvolutionChart,
  FuelBarChart,
  KmEvolutionChart,
  ShiftBarChart,
  YearEvolutionChart,
} from "@/components/AnalysisCharts";
import { BrandLogo } from "@/components/BrandLogo";
import {
  CarParams,
  fetchAnalysis,
  fetchMeta,
  fetchPrice,
  Meta,
  modelsForMake,
} from "@/lib/api";
const defaults: Partial<CarParams> = {
  kms: 100000,
  year: 2020,
  power: 140,
  publishDate: 2021.5,
};

export default function SimulatorPage() {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [marca, setMarca] = useState("");
  const [model, setModel] = useState("");
  const [fuel, setFuel] = useState("");
  const [shift, setShift] = useState("");
  const [kms, setKms] = useState(defaults.kms!);
  const [year, setYear] = useState(defaults.year!);
  const [power, setPower] = useState(defaults.power!);
  const [publishDate, setPublishDate] = useState(defaults.publishDate!);

  const [spot, setSpot] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetchMeta()
      .then((m) => {
        setMeta(m);
        const mk = m.makes[0] ?? "";
        setMarca(mk);
        const opts = modelsForMake(m, mk);
        setModel(opts[0] ?? "");
        setFuel(m.fuels[0] ?? "");
        setShift(m.shifts[0] ?? "");
      })
      .catch((e: Error) => setErr(e.message));
  }, []);

  const modelOptions = useMemo(() => (meta && marca ? modelsForMake(meta, marca) : []), [meta, marca]);

  useEffect(() => {
    if (!meta || !marca) return;
    const opts = modelsForMake(meta, marca);
    if (!opts.length) return;
    if (!opts.includes(model)) setModel(opts[0]);
  }, [meta, marca, model]);

  useEffect(() => {
    setAnalysis(null);
    setSpot(null);
  }, [marca, model, fuel, shift]);

  const params: CarParams | null = useMemo(() => {
    if (!marca || !model || !fuel || !shift) return null;
    if (
      !Number.isFinite(kms) ||
      !Number.isFinite(year) ||
      !Number.isFinite(power) ||
      !Number.isFinite(publishDate)
    ) {
      return null;
    }
    return { marca, model, fuel, shift, kms, year, power, publishDate };
  }, [marca, model, fuel, shift, kms, year, power, publishDate]);

  const runSpot = useCallback(async () => {
    if (!params) return;
    setLoading(true);
    setErr(null);
    try {
      const r = await fetchPrice(params);
      if (r.price == null) {
        setSpot(null);
        setErr(r.error?.trim() || "No se pudo estimar el precio para esta combinación.");
      } else {
        setSpot(r.price);
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [params]);

  const runFull = useCallback(async () => {
    if (!params) return;
    setLoading(true);
    setErr(null);
    try {
      const r = await fetchAnalysis(params);
      setAnalysis(r);
      const cp = r.current_price as { price?: number | null; error?: string };
      if (typeof cp?.price === "number") {
        setSpot(cp.price);
      } else {
        setSpot(null);
        if (cp?.error) setErr(cp.error);
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [params]);

  const fuelBars = useMemo(() => {
    const fa = analysis?.fuel_analysis as Record<string, number> | undefined;
    if (!fa) return [];
    return Object.entries(fa).map(([name, price]) => ({ name, price }));
  }, [analysis]);

  const shiftBars = useMemo(() => {
    const sa = analysis?.shift_analysis as Record<string, number> | undefined;
    if (!sa) return [];
    return Object.entries(sa).map(([name, price]) => ({ name, price }));
  }, [analysis]);

  const ye = analysis?.year_evolution as { dates?: number[]; prices?: number[] } | undefined;
  const de = analysis?.date_evolution as { dates?: number[]; prices?: number[] } | undefined;
  const ke = analysis?.km_evolution as { kms?: number[]; prices?: number[] } | undefined;

  return (
    <main>
      <header className="site-header">
        <BrandLogo linkHome maxWidth={280} maxHeight={96} />
        <nav className="nav-pill" aria-label="Navegación">
          <Link href="/">Inicio</Link>
          <span className="nav-pill-current" aria-current="page">
            Simulador
          </span>
        </nav>
      </header>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Datos del vehículo</h2>
        <div className="grid-form">
          <label>
            Marca
            <select
              value={marca}
              onChange={(e) => {
                const next = e.target.value;
                if (!meta) return;
                setMarca(next);
                const opts = modelsForMake(meta, next);
                setModel(opts[0] ?? "");
              }}
              disabled={!meta}
            >
              {!meta && <option value="">Cargando…</option>}
              {(meta?.makes ?? []).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label>
            Modelo
            <select
              key={marca}
              value={modelOptions.includes(model) ? model : modelOptions[0] ?? ""}
              onChange={(e) => setModel(e.target.value)}
              disabled={!meta || modelOptions.length === 0}
            >
              {modelOptions.length === 0 ? (
                <option value="">Sin modelos para esta marca</option>
              ) : (
                modelOptions.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))
              )}
            </select>
          </label>
          <label>
            Combustible
            <select value={fuel} onChange={(e) => setFuel(e.target.value)} disabled={!meta}>
              {(meta?.fuels ?? []).map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>
          <label>
            Cambio
            <select value={shift} onChange={(e) => setShift(e.target.value)} disabled={!meta}>
              {(meta?.shifts ?? []).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label>
            Kilómetros
            <input
              type="number"
              min={0}
              step={500}
              value={kms}
              onChange={(e) => setKms(Number(e.target.value))}
            />
          </label>
          <label>
            Año de matriculación
            <input
              type="number"
              min={1990}
              max={2026}
              step={1}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </label>
          <label>
            Potencia (CV)
            <input
              type="number"
              min={1}
              step={1}
              value={power}
              onChange={(e) => setPower(Number(e.target.value))}
            />
          </label>
          <label>
            Publicación (año decimal)
            <input
              type="number"
              min={2017}
              max={2026}
              step={0.001}
              value={publishDate}
              onChange={(e) => setPublishDate(Number(e.target.value))}
            />
          </label>
        </div>
        <div className="row-actions">
          <button
            type="button"
            className="primary"
            disabled={!params || loading || modelOptions.length === 0}
            onClick={runSpot}
          >
            Calcular precio
          </button>
          <button
            type="button"
            className="primary"
            disabled={!params || loading || modelOptions.length === 0}
            onClick={runFull}
          >
            Análisis completo (curvas + barras)
          </button>
        </div>
        {err && <p className="error">{err}</p>}
        {spot != null && (
          <p className="price-big" style={{ marginTop: "1rem" }}>
            Precio estimado: {spot.toLocaleString("es-ES", { maximumFractionDigits: 0 })} €
          </p>
        )}
      </section>

      {analysis && (
        <section className="charts" style={{ marginTop: "1.5rem" }}>
          <YearEvolutionChart dates={ye?.dates ?? []} prices={ye?.prices ?? []} />
          <DateEvolutionChart dates={de?.dates ?? []} prices={de?.prices ?? []} />
          <KmEvolutionChart kms={ke?.kms ?? []} prices={ke?.prices ?? []} />
          <FuelBarChart data={fuelBars} />
          <ShiftBarChart data={shiftBars} />
        </section>
      )}
    </main>
  );
}
