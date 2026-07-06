'use client';
import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { loadProcesses, updateProcessStatus } from '@/lib/store';
import { JOBS, CLIENTS, WORKERS, MACHINES } from '@/lib/sample-data';
import type { Process, ProcessStatus } from '@/lib/types';
import { ChevronLeft, PlayCircle, CheckCircle, AlertTriangle } from 'lucide-react';

const STATUS_LABEL: Record<ProcessStatus, string> = {
  pending: '予定',
  in_progress: '進行中',
  completed: '完了',
  delayed: '遅延',
};

export default function ProcessDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [processes, setProcesses] = useState<Process[]>([]);
  useEffect(() => {
    setProcesses(loadProcesses());
  }, []);

  const process = processes.find((p) => p.id === id);

  if (!process) {
    return (
      <div className="mx-auto max-w-2xl w-full px-6 py-12">
        <p className="text-sm text-slate-500">読み込み中…</p>
      </div>
    );
  }

  const job = JOBS.find((j) => j.id === process.jobId);
  const client = job ? CLIENTS.find((c) => c.id === job.clientId) : null;
  const worker = WORKERS.find((w) => w.id === process.workerId);
  const machine = MACHINES.find((m) => m.id === process.machineId);

  const handleStart = () => {
    const updated = updateProcessStatus(id, 'in_progress');
    setProcesses(updated);
  };
  const handleComplete = () => {
    const updated = updateProcessStatus(id, 'completed');
    setProcesses(updated);
  };
  const handleDelay = () => {
    const updated = updateProcessStatus(id, 'delayed');
    setProcesses(updated);
  };

  return (
    <div className="mx-auto max-w-2xl w-full px-6 py-8">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ChevronLeft className="w-4 h-4" />
        <span>一覧に戻る</span>
      </Link>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <p className="text-xs text-slate-500 mb-1">{client?.name}</p>
        <h1 className="text-xl font-semibold mb-1">{job?.name}</h1>
        <p className="text-sm text-slate-600 mb-6">
          工程{process.order}｜{process.name}
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <InfoRow label="作業者" value={worker?.name ?? '-'} />
          <InfoRow label="機械" value={machine?.name ?? '-'} />
          <InfoRow label="予定時間" value={`${process.estimatedMinutes}分`} />
          <InfoRow label="実績時間" value={process.actualMinutes ? `${process.actualMinutes}分` : '-'} />
          <InfoRow label="現在の状態" value={STATUS_LABEL[process.status]} />
          <InfoRow label="納期" value={job?.dueDate ?? '-'} />
        </div>

        <div className="border-t border-slate-200 pt-6">
          <p className="text-xs font-medium text-slate-500 mb-3">進捗を更新</p>
          <div className="grid grid-cols-3 gap-2">
            <ActionButton
              onClick={handleStart}
              disabled={process.status === 'in_progress' || process.status === 'completed'}
              variant="blue"
              icon={<PlayCircle className="w-4 h-4" />}
              label="開始"
            />
            <ActionButton
              onClick={handleComplete}
              disabled={process.status === 'completed'}
              variant="green"
              icon={<CheckCircle className="w-4 h-4" />}
              label="完了"
            />
            <ActionButton
              onClick={handleDelay}
              disabled={process.status === 'completed'}
              variant="red"
              icon={<AlertTriangle className="w-4 h-4" />}
              label="遅延報告"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-900 mt-0.5">{value}</p>
    </div>
  );
}

function ActionButton({
  onClick,
  disabled,
  variant,
  icon,
  label,
}: {
  onClick: () => void;
  disabled: boolean;
  variant: 'blue' | 'green' | 'red';
  icon: React.ReactNode;
  label: string;
}) {
  const colors = {
    blue: 'bg-blue-600 hover:bg-blue-700 text-white',
    green: 'bg-green-600 hover:bg-green-700 text-white',
    red: 'bg-red-600 hover:bg-red-700 text-white',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${!disabled ? colors[variant] : ''}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
