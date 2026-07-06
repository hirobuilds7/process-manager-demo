'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { loadProcesses, resetProcesses } from '@/lib/store';
import { JOBS, CLIENTS, WORKERS, MACHINES, CURRENT_DATE, PROCESSES } from '@/lib/sample-data';
import type { Process, ProcessStatus } from '@/lib/types';
import { AlertTriangle, Clock, CheckCircle, PlayCircle, RotateCcw } from 'lucide-react';

const STATUS_LABEL: Record<ProcessStatus, string> = {
  pending: '予定',
  in_progress: '進行中',
  completed: '完了',
  delayed: '遅延',
};

const STATUS_STYLES: Record<ProcessStatus, string> = {
  pending: 'bg-slate-100 text-slate-700 border-slate-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  delayed: 'bg-red-50 text-red-700 border-red-200',
};

export default function Home() {
  const [processes, setProcesses] = useState<Process[]>([]);
  useEffect(() => {
    setProcesses(loadProcesses());
  }, []);

  const todayProcesses = processes.filter((p) => p.scheduledDate === CURRENT_DATE);
  const jobsMap = new Map(JOBS.map((j) => [j.id, j]));
  const clientsMap = new Map(CLIENTS.map((c) => [c.id, c]));
  const workersMap = new Map(WORKERS.map((w) => [w.id, w]));
  const machinesMap = new Map(MACHINES.map((m) => [m.id, m]));

  const delayedCount = todayProcesses.filter((p) => p.status === 'delayed').length;
  const inProgressCount = todayProcesses.filter((p) => p.status === 'in_progress').length;
  const completedCount = todayProcesses.filter((p) => p.status === 'completed').length;

  const iconFor = (status: ProcessStatus) => {
    if (status === 'pending') return <Clock className="w-4 h-4" />;
    if (status === 'in_progress') return <PlayCircle className="w-4 h-4" />;
    if (status === 'completed') return <CheckCircle className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  return (
    <div className="mx-auto max-w-6xl w-full px-6 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">今日の工程</h1>
          <p className="text-sm text-slate-500 mt-1">{CURRENT_DATE}（月）｜ サンプル製作所</p>
        </div>
        <button
          onClick={() => {
            resetProcesses();
            setProcesses(PROCESSES);
          }}
          className="text-xs text-slate-500 hover:text-slate-700 border border-slate-300 hover:border-slate-400 rounded px-3 py-1.5 flex items-center gap-1 shrink-0"
          title="操作した進捗を初期状態に戻す（デモ用）"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>デモをリセット</span>
        </button>
      </div>

      {delayedCount > 0 && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-2 text-red-800 shadow-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">
            遅延 {delayedCount} 件あり — 進捗を確認してください
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="進行中" value={inProgressCount} color="blue" />
        <StatCard label="完了" value={completedCount} color="green" />
        <StatCard label="遅延" value={delayedCount} color="red" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-200 overflow-hidden shadow-sm">
        {todayProcesses.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-slate-500">今日の工程データはまだ読み込まれていません…</p>
        )}
        {todayProcesses.map((p) => {
          const job = jobsMap.get(p.jobId);
          const client = job ? clientsMap.get(job.clientId) : null;
          const worker = workersMap.get(p.workerId);
          const machine = machinesMap.get(p.machineId);

          return (
            <Link
              key={p.id}
              href={`/process/${p.id}`}
              className="group flex items-center gap-4 px-4 py-3 hover:bg-blue-50/40 transition-colors"
            >
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-medium shrink-0 ${STATUS_STYLES[p.status]}`}>
                {iconFor(p.status)}
                <span>{STATUS_LABEL[p.status]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {client?.name} / {job?.name}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {p.name}（工程{p.order}）
                </p>
              </div>
              <div className="text-right text-xs text-slate-600 shrink-0">
                <p>{worker?.name}</p>
                <p className="text-slate-400">{machine?.name}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: 'blue' | 'green' | 'red' }) {
  const colorMap = {
    blue: 'border-blue-200 bg-blue-50/70 text-blue-700',
    green: 'border-green-200 bg-green-50/70 text-green-700',
    red: 'border-red-200 bg-red-50/70 text-red-700',
  };
  return (
    <div className={`rounded-xl border px-4 py-3 shadow-sm ${colorMap[color]}`}>
      <p className="text-xs font-medium">{label}</p>
      <p className="text-3xl font-semibold mt-1 tabular-nums leading-tight">{value}</p>
    </div>
  );
}
