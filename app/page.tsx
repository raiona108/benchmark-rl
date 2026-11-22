import { dbConnectionStatus } from "@/db/connection-status";
import { getDrillPatterns } from "@/db/drill-patterns";
import { Badge } from "@/components/ui/badge";
import { DrillDashboard } from "@/components/drill-dashboard";

export default async function Home() {
  const [status, patterns] = await Promise.all([
    dbConnectionStatus(),
    getDrillPatterns(),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-[#020618] text-slate-100">
      <header className="border-b border-slate-800 bg-[#020618]/90 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              BenchMark RL
            </h1>
            <p className="text-xs text-slate-400">
              Open-Pit Drill Pattern, RL Elevation &amp; Blast Production Tracker
            </p>
          </div>
          <Badge
            variant={status === "Database connected" ? "default" : "destructive"}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              status === "Database connected"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-red-500/30 bg-red-500/10 text-red-400"
            }`}
          >
            {status}
          </Badge>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-8">
        <DrillDashboard initialPatterns={patterns} />
      </main>
    </div>
  );
}
