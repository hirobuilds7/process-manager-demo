'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { loadProcesses, resetProcesses } from '@/lib/store';
import { JOBS, CLIENTS, WORKERS, MACHINES, CURRENT_DATE, PROCESSES } from '@/lib/sample-data';
import type { Process, ProcessStatus, Job, Client } from '@/lib/types';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  PlayCircle,
  RotateCcw,
  ChevronRight,
  Package,
} from 'lucide-react';

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

const iconFor = (status: ProcessStatus) => {
  if (status === 'pending') return <Clock className="w-4 h-4" />;
  if (status === 'in_progress') return <PlayCircle className="w-4 h-4" />;
  if (status === 'completed') return <CheckCircle className="w-4 h-4" />;
  return <AlertTriangle className="w-4 h-4" />;
};

export default function Home() {
  const [processes, setProcesses] = useState<Process[]>([]);
  useEffect(() => {
    setProcesses(loadProcesses());
  }, []);

  const todayProcesses = processes.filter((p) => p.scheduledDate === CURRENT_DATE);
  const jobsMap = new Map(JOBS.map((j) => [j.id, j]));
  const clientsMap = new Map(CLIENTS.map((c) => [c.id, c]));

  const delayedCount = todayProcesses.filter((p) => p.status === 'delayed').length;
  const inProgressCount = todayProcesses.filter((p) => p.status === 'in_progress').length;
  const completedCount = todayProcesses.filter((p) => p.status === 'completed').length;

  const jobIdsToday = Array.from(new Set(todayProcesses.map((p) => p.jobId)));
  const groupedJobs = jobIdsToday
    .map((jobId) => {
      const job = jobsMap.get(jobId);
      if (!job) return null;
      const client = clientsMap.get(job.clientId);
      const jobProcesses = todayProcesses
        .filter((p) => p.jobId === jobId)
        .sort((a, b) => a.order - b.order);
      return { job, client, processes: jobProcesses };
    })
    .filter((x): x is { job: Job; client: Client | undefined; processes: Process[] } => x !== null)
    .sort((a, b) => a.job.dueDate.localeCompare(b.job.dueDate));

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
          className="text-xs text-slate-500 hover:text-slate-700 border border-slate-300 hover:border-slate-400 rounded px-3 py-1.5 flex items-center gap-1 shrink-0 transition-colors"
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
            遅延 {delayedCount} 件あり — 該当案件は自動で開いています
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="進行中" value={inProgressCount} color="blue" />
        <StatCard label="完了" value={completedCount} color="green" />
        <StatCard label="遅延" value={delayedCount} color="red" />
      </div>

      <div className="space-y-3">
        {groupedJobs.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 px-4 py-8 text-center text-sm text-slate-500 shadow-sm">
            今日の工程データはまだ読み込まれていません…
          </div>
        )}
        {groupedJobs.map(({ job, client, processes: jobProcesses }) => (
          <JobGroup key={job.id} job={job} client={client} processes={jobProcesses} />
        ))}
      </div>
    </div>
  );
}

function JobGroup({
  job,
  client,
  processes,
}: {
  job: Job;
  client: Client | undefined;
  processes: Process[];
}) {
  const delayed = processes.filter((p) => p.status === 'delayed').length;
  const inProgress = processes.filter((p) => p.status === 'in_progress').length;
  const completed = processes.filter((p) => p.status === 'completed').length;
  const pending = processes.filter((p) => p.status === 'pending').length;

  const workersMap = new Map(WORKERS.map((w) => [w.id, w]));
  const machinesMap = new Map(MACHINES.map((m) => [m.id, m]));

  const [open, setOpen] = useState(delayed > 0 || inProgress > 0);

  const dueDateStr = job.dueDate.slice(5).replace('-', '/');
  const daysUntilDue = Math.ceil(
    (new Date(job.dueDate).getTime() - new Date(CURRENT_DATE).getTime()) / 86400000
  );
  const dueColor: 'red' | 'orange' | 'slate' =
    daysUntilDue <= 2 ? 'red' : daysUntilDue <= 5 ? 'orange' : 'slate';
  const dueLabel =
    daysUntilDue < 0
      ? `${-daysUntilDue}日超過`
      : daysUntilDue === 0
      ? '本日'
      : `あと${daysUntilDue}日`;

  const totalCount = processes.length;
  const progressPercent =
    totalCount === 0 ? 0 : Math.round((completed / totalCount) * 100);

  return (
    <div
      className={`rounded-xl border bg-white shadow-sm overflow-hidden ${
        delayed > 0 ? 'border-red-200' : 'border-slate-200'
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50/70 transition-colors text-left"
      >
        <ChevronRight
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}
        />
        <Package className="w-4 h-4 text-slate-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">
            {client?.name} / {job.name}
          </p>
          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
            <span>数量 {job.quantity}個</span>
            <span className="text-slate-300">·</span>
            <span>納期 {dueDateStr}</span>
            <Badge color={dueColor}>{dueLabel}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 text-xs">
          {delayed > 0 && (
            <Badge color="red" pulse>
              遅延 {delayed}
            </Badge>
          )}
          {inProgress > 0 && (
            <Badge color="blue" pulse>
              進行 {inProgress}
            </Badge>
          )}
          {completed > 0 && <Badge color="green">完了 {completed}</Badge>}
          {pending > 0 && <Badge color="slate">予定 {pending}</Badge>}
        </div>
      </button>

      <div className="h-1 bg-slate-100">
        <div
          className={`h-1 transition-all duration-500 ${
            delayed > 0 ? 'bg-red-400' : progressPercent === 100 ? 'bg-green-500' : 'bg-blue-500'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {open && (
        <div className="border-t border-slate-200 divide-y divide-slate-100">
          {processes.map((p) => {
            const worker = workersMap.get(p.workerId);
            const machine = machinesMap.get(p.machineId);
            return (
              <Link
                key={p.id}
                href={`/process/${p.id}`}
                className="group flex items-center gap-4 px-4 py-2.5 pl-11 hover:bg-blue-50/40 transition-colors"
              >
                <div
                  className={`flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-medium shrink-0 ${STATUS_STYLES[p.status]} ${
                    p.status === 'in_progress' ? 'animate-pulse' : ''
                  }`}
                >
                  {iconFor(p.status)}
                  <span>{STATUS_LABEL[p.status]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 truncate group-hover:text-blue-700 transition-colors">
                    工程{p.order}｜{p.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">予定 {p.estimatedMinutes}分</p>
                </div>
                <div className="text-right text-xs text-slate-600 shrink-0">
                  <p className="font-medium">{worker?.name}</p>
                  <p className="text-slate-400">{machine?.name}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Badge({
  color,
  pulse,
  children,
}: {
  color: 'blue' | 'green' | 'red' | 'orange' | 'slate';
  pulse?: boolean;
  children: React.ReactNode;
}) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[11px] font-medium ${colorMap[color]} ${
        pulse ? 'animate-pulse' : ''
      }`}
    >
      {children}
    </span>
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
