"use client";

import { useState, useMemo } from "react";
import {
    DrillPatternDocument,
    MINERAL_TYPES,
    PATTERN_STATUSES,
} from "@/lib/schemas/drill-pattern";
import {
    addDrillPatternAction,
    seedPatternsAction,
} from "@/app/actions/drill-patterns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Props {
    initialPatterns: DrillPatternDocument[];
}

export function DrillDashboard({ initialPatterns }: Props) {
    const [selectedPit, setSelectedPit] = useState<string>("ALL");
    const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
    const [selectedMineral, setSelectedMineral] = useState<string>("ALL");
    const [showForm, setShowForm] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const pits = useMemo(
        () => Array.from(new Set(initialPatterns.map((p) => p.pitName))),
        [initialPatterns]
    );

    const filteredPatterns = useMemo(() => {
        return initialPatterns.filter((p) => {
            if (selectedPit !== "ALL" && p.pitName !== selectedPit) return false;
            if (selectedStatus !== "ALL" && p.status !== selectedStatus) return false;
            if (selectedMineral !== "ALL" && p.mineral !== selectedMineral)
                return false;
            return true;
        });
    }, [initialPatterns, selectedPit, selectedStatus, selectedMineral]);

    const metrics = useMemo(() => {
        let totalDrilledMeters = 0;
        let totalPlannedMeters = 0;
        let totalHolesDrilled = 0;
        let totalHolesPlanned = 0;
        const byMineral: Record<
            string,
            { patterns: number; metersDrilled: number; bcm: number }
        > = {};

        for (const p of filteredPatterns) {
            const holeDepth = p.benchHeight + p.subdrill;
            const drilledM = p.drilledHoles * holeDepth;
            const plannedM = p.plannedHoles * holeDepth;
            const patternBcm = p.burden * p.spacing * p.benchHeight * p.plannedHoles;

            totalDrilledMeters += drilledM;
            totalPlannedMeters += plannedM;
            totalHolesDrilled += p.drilledHoles;
            totalHolesPlanned += p.plannedHoles;

            if (!byMineral[p.mineral]) {
                byMineral[p.mineral] = { patterns: 0, metersDrilled: 0, bcm: 0 };
            }
            byMineral[p.mineral].patterns += 1;
            byMineral[p.mineral].metersDrilled += drilledM;
            byMineral[p.mineral].bcm += patternBcm;
        }

        const rls = filteredPatterns.flatMap((p) => [
            p.collarRl,
            p.targetToeRl - p.subdrill,
        ]);
        const highestCollarRl = rls.length ? Math.max(...rls) : null;
        const lowestSubdrillRl = rls.length ? Math.min(...rls) : null;

        return {
            totalDrilledMeters,
            totalPlannedMeters,
            totalHolesDrilled,
            totalHolesPlanned,
            byMineral,
            highestCollarRl,
            lowestSubdrillRl,
        };
    }, [filteredPatterns]);

    const rlSortedPatterns = useMemo(() => {
        return [...filteredPatterns].sort((a, b) => b.collarRl - a.collarRl);
    }, [filteredPatterns]);

    async function handleCreate(formData: FormData) {
        setSubmitting(true);
        setFormError(null);
        const res = await addDrillPatternAction(formData);
        setSubmitting(false);
        if (!res.ok) {
            setFormError(res.error || "Failed to save pattern");
            return;
        }
        setShowForm(false);
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Top Action & Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex flex-wrap items-center gap-3">
                    <select
                        aria-label="Filter by Pit"
                        value={selectedPit}
                        onChange={(e) => setSelectedPit(e.target.value)}
                        className="rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-200"
                    >
                        <option value="ALL">All Pits</option>
                        {pits.map((pit) => (
                            <option key={pit} value={pit}>
                                {pit}
                            </option>
                        ))}
                    </select>

                    <select
                        aria-label="Filter by Status"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-200"
                    >
                        <option value="ALL">All Statuses</option>
                        {PATTERN_STATUSES.map((st) => (
                            <option key={st} value={st}>
                                {st}
                            </option>
                        ))}
                    </select>

                    <select
                        aria-label="Filter by Mineral"
                        value={selectedMineral}
                        onChange={(e) => setSelectedMineral(e.target.value)}
                        className="rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-200"
                    >
                        <option value="ALL">All Minerals / Material</option>
                        {MINERAL_TYPES.map((m) => (
                            <option key={m} value={m}>
                                {m}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    {initialPatterns.length === 0 && (
                        <form action={seedPatternsAction}>
                            <Button
                                type="submit"
                                variant="outline"
                                className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                            >
                                Load Sample Patterns
                            </Button>
                        </form>
                    )}
                    <Button
                        onClick={() => setShowForm((prev) => !prev)}
                        className="bg-indigo-600 text-white hover:bg-indigo-500"
                    >
                        {showForm ? "Close Form" : "+ Log Drill Pattern"}
                    </Button>
                </div>
            </div>

            {/* New Pattern Form */}
            {showForm && (
                <form
                    action={handleCreate}
                    className="grid grid-cols-1 gap-4 rounded-lg border border-indigo-500/40 bg-slate-900 p-6 md:grid-cols-3"
                >
                    <div className="md:col-span-3">
                        <h2 className="text-base font-semibold text-white">
                            New Drill Pattern &amp; RL Specification
                        </h2>
                        {formError && (
                            <p className="mt-1 text-sm text-red-400">{formError}</p>
                        )}
                    </div>

                    <input
                        name="patternId"
                        placeholder="Pattern ID (e.g. P-420-015)"
                        required
                        className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    />
                    <input
                        name="pitName"
                        placeholder="Pit Name (e.g. North Pit)"
                        required
                        className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    />
                    <input
                        name="benchName"
                        placeholder="Bench Name (e.g. 420 Bench)"
                        required
                        className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    />

                    <select
                        name="mineral"
                        required
                        defaultValue="Iron Ore"
                        className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    >
                        {MINERAL_TYPES.map((m) => (
                            <option key={m} value={m}>
                                {m}
                            </option>
                        ))}
                    </select>
                    <input
                        name="rockType"
                        placeholder="Rock Type / Geology (e.g. BIF)"
                        required
                        className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    />
                    <input
                        name="drillRigId"
                        placeholder="Drill Rig ID (e.g. PV271-02)"
                        className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    />

                    <input
                        name="collarRl"
                        type="number"
                        step="0.1"
                        placeholder="Collar RL (m) e.g. 420.5"
                        required
                        className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    />
                    <input
                        name="targetToeRl"
                        type="number"
                        step="0.1"
                        placeholder="Target Toe RL (m) e.g. 408.5"
                        required
                        className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    />
                    <input
                        name="subdrill"
                        type="number"
                        step="0.1"
                        defaultValue="1.5"
                        placeholder="Subdrill (m)"
                        required
                        className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    />
                    <input
                        name="burden"
                        type="number"
                        step="0.1"
                        placeholder="Burden (m) e.g. 4.5"
                        required
                        className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    />
                    <input
                        name="spacing"
                        type="number"
                        step="0.1"
                        placeholder="Spacing (m) e.g. 5.2"
                        required
                        className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    />
                    <input
                        name="holeDiameterMm"
                        type="number"
                        defaultValue="229"
                        placeholder="Hole Diameter (mm)"
                        required
                        className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    />
                    <input
                        name="plannedHoles"
                        type="number"
                        placeholder="Planned Holes"
                        required
                        className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    />
                    <input
                        name="drilledHoles"
                        type="number"
                        defaultValue="0"
                        placeholder="Drilled Holes"
                        required
                        className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    />
                    <input
                        name="powderFactor"
                        type="number"
                        step="0.01"
                        placeholder="Powder Factor (kg/bcm)"
                        className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    />
                    <select
                        name="status"
                        defaultValue="Planned"
                        className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    >
                        {PATTERN_STATUSES.map((st) => (
                            <option key={st} value={st}>
                                {st}
                            </option>
                        ))}
                    </select>
                    <input
                        name="notes"
                        placeholder="Ground / cavity / water notes (optional)"
                        className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm md:col-span-2"
                    />

                    <div className="flex justify-end gap-2 md:col-span-3">
                        <Button
                            type="submit"
                            disabled={submitting}
                            className="bg-emerald-600 text-white hover:bg-emerald-500"
                        >
                            {submitting ? "Saving..." : "Save Pattern to MongoDB"}
                        </Button>
                    </div>
                </form>
            )}

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                    <p className="text-xs uppercase tracking-wider text-slate-400">
                        Meters Drilled
                    </p>
                    <p className="mt-1 text-2xl font-bold text-white">
                        {metrics.totalDrilledMeters.toLocaleString(undefined, {
                            maximumFractionDigits: 1,
                        })}{" "}
                        <span className="text-sm font-normal text-slate-400">
                            /{" "}
                            {metrics.totalPlannedMeters.toLocaleString(undefined, {
                                maximumFractionDigits: 1,
                            })}{" "}
                            m
                        </span>
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                        {metrics.totalHolesDrilled} of {metrics.totalHolesPlanned} holes
                        complete
                    </p>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                    <p className="text-xs uppercase tracking-wider text-slate-400">
                        Active RL Span
                    </p>
                    <p className="mt-1 text-2xl font-bold text-indigo-400">
                        {metrics.highestCollarRl !== null
                            ? `${metrics.highestCollarRl.toFixed(1)}m → ${metrics.lowestSubdrillRl?.toFixed(1)}m`
                            : "—"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                        Highest Collar RL to Deepest Subdrill Toe
                    </p>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 sm:col-span-2">
                    <p className="text-xs uppercase tracking-wider text-slate-400">
                        Minerals &amp; Material Breakdown
                    </p>
                    {Object.keys(metrics.byMineral).length === 0 ? (
                        <p className="mt-2 text-sm text-slate-500">No patterns selected.</p>
                    ) : (
                        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                            {Object.entries(metrics.byMineral).map(([mineral, stat]) => (
                                <div
                                    key={mineral}
                                    className="rounded border border-slate-800 bg-slate-950/70 px-3 py-2"
                                >
                                    <p className="text-xs font-semibold text-slate-200">
                                        {mineral}
                                    </p>
                                    <p className="text-sm font-bold text-emerald-400">
                                        {stat.metersDrilled.toLocaleString(undefined, {
                                            maximumFractionDigits: 0,
                                        })}{" "}
                                        m drilled
                                    </p>
                                    <p className="text-[11px] text-slate-400">
                                        {stat.patterns} pattern(s) ·{" "}
                                        {stat.bcm.toLocaleString(undefined, {
                                            maximumFractionDigits: 0,
                                        })}{" "}
                                        BCM
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
                  {/* RL Elevation Breakdown by Bench */}
      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-5">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-white">
            RL Elevation Breakdown (Highest Bench to Lowest)
          </h2>
          <p className="text-xs text-slate-400">
            Collar RL, Design Bench Height, Target Toe RL, and Subdrill Horizon
          </p>
        </div>

        {rlSortedPatterns.length === 0 ? (
          <p className="text-sm text-slate-400">
            No patterns match your current filters.
          </p>
        ) : (
          <div className="space-y-3">
            {rlSortedPatterns.map((p) => {
              const subdrillToeRl = Number(
                (p.targetToeRl - p.subdrill).toFixed(2)
              );
              const holeDepth = Number(
                (p.benchHeight + p.subdrill).toFixed(2)
              );
              const pct = Math.round((p.drilledHoles / p.plannedHoles) * 100);

              return (
                <div
                  key={p._id || p.patternId}
                  className="rounded-md border border-slate-800 bg-slate-950/80 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-white">
                        {p.patternId}
                      </span>
                      <span className="text-xs text-slate-400">
                        {p.pitName} · {p.benchName}
                      </span>
                      <Badge
                        variant="outline"
                        className="border-indigo-500/40 bg-indigo-500/10 text-indigo-300"
                      >
                        {p.mineral} ({p.rockType})
                      </Badge>
                      {p.drillRigId && (
                        <Badge
                          variant="outline"
                          className="border-slate-700 text-slate-300"
                        >
                          Rig: {p.drillRigId}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-300">
                        {(p.drilledHoles * holeDepth).toFixed(1)}m /{" "}
                        {(p.plannedHoles * holeDepth).toFixed(1)}m ({pct}%)
                      </span>
                      <Badge className="bg-slate-800 text-slate-200">
                        {p.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-800/80 pt-3 text-xs sm:grid-cols-5">
                    <div>
                      <span className="block text-slate-500">Collar RL</span>
                      <span className="font-mono font-semibold text-emerald-400">
                        {p.collarRl.toFixed(1)} m
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-500">Target Toe RL</span>
                      <span className="font-mono font-semibold text-sky-400">
                        {p.targetToeRl.toFixed(1)} m
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-500">
                        Subdrill Toe RL
                      </span>
                      <span className="font-mono font-semibold text-amber-400">
                        {subdrillToeRl.toFixed(1)} m ({p.subdrill}m sub)
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-500">
                        Design Hole Depth
                      </span>
                      <span className="font-mono font-semibold text-slate-200">
                        {holeDepth} m ({p.benchHeight}m bench)
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-500">
                        Burden × Spacing / PF
                      </span>
                      <span className="font-mono text-slate-300">
                        {p.burden}m × {p.spacing}m
                        {p.powderFactor ? ` · ${p.powderFactor} kg/bcm` : ""}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

