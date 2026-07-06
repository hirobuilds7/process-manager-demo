'use client';
import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { loadProcesses, loadUserJobs, addProcess } from '@/lib/store';
import { JOBS, CLIENTS, WORKERS, MACHINES, CURRENT_DATE } from '@/lib/sample-data';
import type { Process, ProcessStatus, Job } from '@/lib/types';
import {
  ChevronLeft,
  Plus,
  Clock,
  PlayCircle,
  CheckCircle,
  AlertTriangle,
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

function StatusIcon({ status }: { status: ProcessStatus }) {
  const size = 'w-3.5 h-3.5';
  if (status === 'pending') return <Clock className={size} />;
  if (status === 'in_progress') return <PlayCircle className={size} />;
  if (status === 'completed') return <CheckCircle className={size} />;
  return <AlertTriangle className={size} />;
}

export default function JobDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [userJobs, setUserJobs] = useState<Job[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    setProcesses(loadProcesses());
    setUserJobs(loadUserJobs());
  }, []);

  const allJobs = [...JOBS, ...userJobs];
  const job = allJobs.find((j) => j.id === id);
  const client = job ? CLIENTS.find((c) => c.id === job.clientId) : null;

  if (!job) {
    return (
      <div className="mx-auto max-w-2xl w-full px-6 py-12">
        <p className="text-sm text-slate-500">読み込み中…</p>
      </div>
    );
  }

  const jobProcesses = processes
    .filter((p) => p.jobId === id)
    .sort((a, b) => a.order - b.order);

  const dueDateStr = job.dueDate;
  const daysUntilDue = Math.ceil(
    (new Date(job.dueDate).getTime() - new Date(CURRENT_DATE).getTime()) / 86400000
  );

  const nextOrder = jobProcesses.length + 1;

  return (
    <div className="mx-auto max-w-3xl w-full px-6 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>一覧に戻る</span>
      </Link>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-4">
        <div className="flex items-center gap-2 mb-2 text-slate-500 text-xs">
          <Package className="w-3.5 h-3.5" />
          <span>{client?.name}</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight mb-3">{job.name}</h1>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-slate-500">数量</p>
            <p className="font-medium mt-0.5">{job.quantity}個</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">納期</p>
            <p className="font-medium mt-0.5">{dueDateStr}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">残り</p>
            <p className="font-medium mt-0.5">
              {daysUntilDue < 0 ? `${-daysUntilDue}日超過` : daysUntilDue === 0 ? '本日' : `あと${daysUntilDue}日`}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">工程数</p>
            <p className="font-medium mt-0.5">{jobProcesses.length}件</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-slate-700">工程一覧</p>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md px-3 py-1.5 flex items-center gap-1 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAdd ? '閉じる' : '工程を追加'}</span>
          </button>
        </div>

        {showAdd && (
          <AddProcessForm
            jobId={id}
            nextOrder={nextOrder}
            onSaved={() => {
              setProcesses(loadProcesses());
              setShowAdd(false);
            }}
            onCancel={() => setShowAdd(false)}
          />
        )}

        <ol className="space-y-2 mt-2">
          {jobProcesses.length === 0 && (
            <li className="text-xs text-slate-400 text-center py-6">
              工程がありません。上の「工程を追加」から追加してください
            </li>
          )}
          {jobProcesses.map((p) => {
            const worker = WORKERS.find((w) => w.id === p.workerId);
            const machine = MACHINES.find((m) => m.id === p.machineId);
            return (
              <li key={p.id}>
                <Link
                  href={`/process/${p.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium bg-slate-100 text-slate-600 shrink-0">
                    {p.order}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 truncate">{p.name}</p>
                    <p className="text-xs text-slate-400">
                      {worker?.name} · {machine?.name} · 予定 {p.estimatedMinutes}分 · 予定日 {p.scheduledDate}
                    </p>
                  </div>
                  <div
                    className={`flex items-center gap-1 px-2 py-0.5 rounded border text-xs shrink-0 ${STATUS_STYLES[p.status]} ${
                      p.status === 'in_progress' ? 'animate-pulse' : ''
                    }`}
                  >
                    <StatusIcon status={p.status} />
                    <span>{STATUS_LABEL[p.status]}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function AddProcessForm({
  jobId,
  nextOrder,
  onSaved,
  onCancel,
}: {
  jobId: string;
  nextOrder: number;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [processName, setProcessName] = useState('');
  const [machineId, setMachineId] = useState(MACHINES[0].id);
  const [workerId, setWorkerId] = useState(WORKERS[0].id);
  const [estimated, setEstimated] = useState(60);
  const [scheduledDate, setScheduledDate] = useState(CURRENT_DATE);

  const canSave = processName.trim().length > 0 && estimated > 0;

  const handleSave = () => {
    if (!canSave) return;
    const now = Date.now();
    const proc: Process = {
      id: `up${now}`,
      jobId,
      name: processName.trim(),
      order: nextOrder,
      machineId,
      workerId,
      estimatedMinutes: estimated,
      actualMinutes: null,
      status: 'pending',
      startedAt: null,
      completedAt: null,
      scheduledDate,
    };
    addProcess(proc);
    onSaved();
  };

  return (
    <div className="mb-4 p-4 rounded-lg border border-blue-200 bg-blue-50/40 space-y-3">
      <div>
        <label className="text-xs text-slate-600 mb-1 block">工程名</label>
        <input
          type="text"
          value={processName}
          onChange={(e) => setProcessName(e.target.value)}
          placeholder="例：仕上げ研磨"
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-600 mb-1 block">機械</label>
          <select
            value={machineId}
            onChange={(e) => setMachineId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {MACHINES.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-600 mb-1 block">作業者</label>
          <select
            value={workerId}
            onChange={(e) => setWorkerId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {WORKERS.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-600 mb-1 block">予定時間（分）</label>
          <input
            type="number"
            value={estimated}
            onChange={(e) => setEstimated(Number(e.target.value))}
            min={1}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <div>
          <label className="text-xs text-slate-600 mb-1 block">予定日</label>
          <input
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-sm text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
        >
          キャンセル
        </button>
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="px-3 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-md transition-colors shadow-sm"
        >
          追加
        </button>
      </div>
    </div>
  );
}
