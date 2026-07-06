'use client';
import { useEffect, useState } from 'react';
import { loadProcesses } from '@/lib/store';
import { JOBS, CLIENTS, WORKERS, MACHINES } from '@/lib/sample-data';
import type { Process } from '@/lib/types';
import { AlertTriangle, Activity, Users, Factory, Package } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

export default function Dashboard() {
  const [processes, setProcesses] = useState<Process[]>([]);
  useEffect(() => {
    setProcesses(loadProcesses());
  }, []);

  const delayed = processes.filter((p) => p.status === 'delayed');
  const inProgress = processes.filter((p) => p.status === 'in_progress');
  const totalCompleted = processes.filter((p) => p.status === 'completed').length;

  const machineUtilization = MACHINES.map((m) => {
    const active = processes.filter((p) => p.machineId === m.id && (p.status === 'in_progress' || p.status === 'delayed')).length;
    const total = processes.filter((p) => p.machineId === m.id).length;
    return {
      name: m.name,
      稼働率: total === 0 ? 0 : Math.round((active / total) * 100),
    };
  });

  const workerLoad = WORKERS.map((w) => {
    const assigned = processes.filter((p) => p.workerId === w.id && p.status !== 'completed').length;
    return { name: w.name, 担当工程: assigned };
  });

  const jobsMap = new Map(JOBS.map((j) => [j.id, j]));
  const clientsMap = new Map(CLIENTS.map((c) => [c.id, c]));
  const workersMap = new Map(WORKERS.map((w) => [w.id, w]));
  const machinesMap = new Map(MACHINES.map((m) => [m.id, m]));

  return (
    <div className="mx-auto max-w-6xl w-full px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">ダッシュボード</h1>
        <p className="text-sm text-slate-500 mt-1">機械稼働率・作業者負荷・遅延アラートを1画面で</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MetricCard icon={<Activity className="w-5 h-5" />} label="進行中の工程" value={inProgress.length} color="blue" />
        <MetricCard icon={<AlertTriangle className="w-5 h-5" />} label="遅延中" value={delayed.length} color="red" />
        <MetricCard icon={<Users className="w-5 h-5" />} label="完了済み" value={totalCompleted} color="green" />
      </div>

      {delayed.length > 0 && (
        <div className="mb-6 rounded-xl border border-red-200 bg-white overflow-hidden shadow-sm">
          <div className="bg-red-50 px-4 py-2.5 flex items-center gap-2 border-b border-red-200">
            <AlertTriangle className="w-4 h-4 text-red-700" />
            <p className="text-sm font-medium text-red-800">遅延アラート</p>
          </div>
          <div className="divide-y divide-slate-200">
            {delayed.map((p) => {
              const job = jobsMap.get(p.jobId);
              const client = job ? clientsMap.get(job.clientId) : null;
              const worker = workersMap.get(p.workerId);
              const machine = machinesMap.get(p.machineId);
              return (
                <div key={p.id} className="px-4 py-3 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {client?.name} / {job?.name} — {p.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      納期 {job?.dueDate}｜ 予定{p.estimatedMinutes}分
                    </p>
                  </div>
                  <div className="text-xs text-slate-600 shrink-0 text-right">
                    <p>{worker?.name}</p>
                    <p className="text-slate-400">{machine?.name}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-4">
        <div className="flex items-center gap-2 mb-3 text-slate-700">
          <Package className="w-4 h-4" />
          <p className="text-sm font-medium">案件別 進捗（納期順）</p>
        </div>
        <div className="space-y-3">
          {JOBS.map((job) => {
            const client = clientsMap.get(job.clientId);
            const jobProcesses = processes.filter((p) => p.jobId === job.id);
            const total = jobProcesses.length;
            if (total === 0) return null;
            const completed = jobProcesses.filter((p) => p.status === 'completed').length;
            const inProg = jobProcesses.filter((p) => p.status === 'in_progress').length;
            const delayedN = jobProcesses.filter((p) => p.status === 'delayed').length;
            const pending = jobProcesses.filter((p) => p.status === 'pending').length;
            return { job, client, total, completed, inProg, delayedN, pending };
          })
            .filter((x): x is NonNullable<typeof x> => x !== null)
            .sort((a, b) => a.job.dueDate.localeCompare(b.job.dueDate))
            .map(({ job, client, total, completed, inProg, delayedN, pending }) => (
              <div key={job.id} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <p className="text-slate-800 font-medium truncate">
                      {client?.name} / {job.name}
                    </p>
                    {delayedN > 0 && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-red-200 bg-red-50 text-red-700 shrink-0 animate-pulse">
                        <AlertTriangle className="w-3 h-3" />
                        <span>遅延</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 shrink-0 tabular-nums">
                    <span>{completed}/{total}</span>
                    <span className="text-slate-300">·</span>
                    <span>納期 {job.dueDate.slice(5).replace('-', '/')}</span>
                  </div>
                </div>
                <div className="flex w-full h-3 rounded-full overflow-hidden bg-slate-100">
                  {completed > 0 && (
                    <div
                      className="bg-green-500 transition-all duration-500"
                      style={{ width: `${(completed / total) * 100}%` }}
                      title={`完了 ${completed}`}
                    />
                  )}
                  {inProg > 0 && (
                    <div
                      className="bg-blue-500 transition-all duration-500"
                      style={{ width: `${(inProg / total) * 100}%` }}
                      title={`進行中 ${inProg}`}
                    />
                  )}
                  {delayedN > 0 && (
                    <div
                      className="bg-red-500 transition-all duration-500"
                      style={{ width: `${(delayedN / total) * 100}%` }}
                      title={`遅延 ${delayedN}`}
                    />
                  )}
                  {pending > 0 && (
                    <div
                      className="bg-slate-300 transition-all duration-500"
                      style={{ width: `${(pending / total) * 100}%` }}
                      title={`予定 ${pending}`}
                    />
                  )}
                </div>
              </div>
            ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-3 border-t border-slate-100">
          <LegendDot color="bg-green-500" label="完了" />
          <LegendDot color="bg-blue-500" label="進行中" />
          <LegendDot color="bg-red-500" label="遅延" />
          <LegendDot color="bg-slate-300" label="予定" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard icon={<Factory className="w-4 h-4" />} title="機械別 稼働率">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={machineUtilization}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} unit="%" />
              <Tooltip />
              <Bar dataKey="稼働率" fill="#2563eb" radius={[4, 4, 0, 0]}>
                {machineUtilization.map((entry, index) => (
                  <Cell key={index} fill={entry.稼働率 >= 80 ? '#dc2626' : entry.稼働率 >= 50 ? '#2563eb' : '#94a3b8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard icon={<Users className="w-4 h-4" />} title="作業者別 担当工程数（未完了）">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={workerLoad}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="担当工程" radius={[4, 4, 0, 0]}>
                {workerLoad.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.担当工程 >= 3 ? '#f97316' : entry.担当工程 >= 2 ? '#10b981' : '#94a3b8'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'blue' | 'green' | 'red';
}) {
  const colorMap = {
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    green: 'border-green-200 bg-green-50 text-green-700',
    red: 'border-red-200 bg-red-50 text-red-700',
  };
  return (
    <div className={`rounded-xl border px-4 py-3 shadow-sm ${colorMap[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <p className="text-xs font-medium">{label}</p>
      </div>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2.5 h-2.5 rounded-sm ${color}`} />
      <span>{label}</span>
    </span>
  );
}

function ChartCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3 text-slate-700">
        {icon}
        <p className="text-sm font-medium">{title}</p>
      </div>
      {children}
    </div>
  );
}
