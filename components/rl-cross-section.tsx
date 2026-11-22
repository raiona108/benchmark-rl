"use client";

import { DrillPatternDocument } from "@/lib/schemas/drill-pattern";

interface RlCrossSectionProps {
  pattern: DrillPatternDocument;
  globalMaxRl: number;
  globalMinRl: number;
}

export function RlCrossSection({
  pattern,
  globalMaxRl,
  globalMinRl,
}: RlCrossSectionProps) {
  const subdrillToeRl = Number(
    (pattern.targetToeRl - pattern.subdrill).toFixed(2)
  );
  const totalHoleDepth = Number(
    (pattern.benchHeight + pattern.subdrill).toFixed(2)
  );

  // Calculate relative position within the active pit's overall RL span
  const totalSpan = Math.max(globalMaxRl - globalMinRl, 1);
  const topOffsetPct = Math.max(
    0,
    Math.min(100, ((globalMaxRl - pattern.collarRl) / totalSpan) * 100)
  );
  const benchPct = (pattern.benchHeight / totalSpan) * 100;
  const subdrillPct = (pattern.subdrill / totalSpan) * 100;
  const drilledRatio = Math.min(
    1,
    Math.max(0, pattern.drilledHoles / pattern.plannedHoles)
  );

  return (
    <div className="mt-3 rounded-md border border-slate-800/90 bg-slate-900/70 p-3">
      <div className="mb-2 flex items-center justify-between text-[11px] text-slate-400">
        <span>Pit Elevation Horizon ({globalMaxRl.toFixed(1)}m → {globalMinRl.toFixed(1)}m RL)</span>
        <span>
          Total Hole: <strong className="text-slate-200">{totalHoleDepth}m</strong>{" "}
          ({pattern.benchHeight}m bench + {pattern.subdrill}m subdrill)
        </span>
      </div>

      {/* Horizontal Scaled Elevation Track */}
      <div className="relative h-7 w-full overflow-hidden rounded bg-slate-950 border border-slate-800">
        {/* Bench + Subdrill Block Positioned by RL */}
        <div
          style={{
            left: `${topOffsetPct}%`,
            width: `${Math.max(benchPct + subdrillPct, 4)}%`,
          }}
          className="absolute top-0 bottom-0 flex"
          title={`Collar ${pattern.collarRl}m → Toe ${pattern.targetToeRl}m → Subdrill ${subdrillToeRl}m`}
        >
          {/* Main Bench Horizon */}
          <div
            style={{
              width: `${(pattern.benchHeight / totalHoleDepth) * 100}%`,
            }}
            className="relative h-full bg-sky-950/90 border-l-2 border-emerald-400"
          >
            {/* Drilled Completion Overlay */}
            <div
              style={{ width: `${drilledRatio * 100}%` }}
              className="h-full bg-emerald-500/35 transition-all"
            />
          </div>

          {/* Subdrill Zone */}
          <div
            style={{
              width: `${(pattern.subdrill / totalHoleDepth) * 100}%`,
            }}
            className="h-full border-l border-dashed border-sky-400 bg-amber-500/30 border-r-2 border-r-amber-400"
          />
        </div>
      </div>

      {/* Legend */}
      <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-xs bg-emerald-400" />
          Collar RL ({pattern.collarRl.toFixed(1)}m)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-xs bg-sky-400" />
          Target Floor RL ({pattern.targetToeRl.toFixed(1)}m)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-xs bg-amber-400" />
          Subdrill Toe RL ({subdrillToeRl.toFixed(1)}m)
        </span>
      </div>
    </div>
  );
}
