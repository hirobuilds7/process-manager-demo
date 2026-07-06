'use client';
import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { loadProcesses, updateProcessStatus, loadUserJobs, loadUserClients } from '@/lib/store';
import { JOBS, CLIENTS, WORKERS, MACHINES } from '@/lib/sample-data';
import type { Job as JobType, Client as ClientType } from '@/lib/types';
import type { Process, ProcessStatus } from '@/lib/types';
import { ChevronLeft, PlayCircle, CheckCircle, AlertTriangle, Clock, User, Cpu } from 'lucide-react';

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

export default function ProcessDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [toast, setToast] = useState<{ message: string; variant: 'blue' | 'green' | 'red' } | null>(null);
  const [userJobs, setUserJobs] = useState<JobType[]>([]);
  const [userClients, setUserClients] = useState<ClientType[]>([]);

  useEffect(() => {
    setProcesses(loadProcesses());
    setUserJobs(loadUserJobs());
    setUserClients(loadUserClients());
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const process = processes.find((p) => p.id === id);

  if (!process) {
    return (
      <div className="mx-auto max-w-2xl w-full px-6 py-12">
        <p className="text-sm text-slate-500">読み込み中…</p>
      </div>
    );
  }

  const allJobs = [...JOBS, ...userJobs];
  const allClients = [...CLIENTS, ...userClients];
  const job = allJobs.find((j) => j.id === process.jobId);
  const client = job ? allClients.find((c) => c.id === job.clientId) : null;
  const worker = WORKERS.find((w) => w.id === process.workerId);
  const machine = MACHINES.find((m) => m.id === process.machineId);

  const jobProcesses = processes
    .filter((p) => p.jobId === process.jobId)
    .sort((a, b) => a.order - b.order);

  const workerOtherToday = processes.filter(
    (p) => p.workerId === process.workerId && p.id !== id && p.scheduledDate === process.scheduledDate
  );
  const machineOtherToday = processes.filter(
    (p) => p.machineId === process.machineId && p.id !== id && p.scheduledDate === process.scheduledDate
  );

  const handleStart = () => {
    setProcesses(updateProcessStatus(id, 'in_progress'));
    setToast({ message: '工程を開始しました', variant: 'blue' });
  };
  const handleComplete = () => {
    setProcesses(updateProcessStatus(id, 'completed'));
    setToast({ message: '工程を完了しました', variant: 'green' });
  };
  const handleDelay = () => {
    setProcesses(updateProcessStatus(id, 'delayed'));
    setToast({ message: '遅延として報告しました', variant: 'red' });
  };

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
        <div className="flex items-start justify-between gap-4 mb-1">
          <div className="min-w-0">
            <p className="text-xs text-slate-500 mb-1">{client?.name}</p>
            <h1 className="text-2xl font-semibold tracking-tight">{job?.name}</h1>
          </div>
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium shrink-0 ${STATUS_STYLES[process.status]} ${
              process.status === 'in_progress' ? 'animate-pulse' : ''
            }`}
          >
            <StatusIcon status={process.status} />
            <span>{STATUS_LABEL[process.status]}</span>
          </div>
        </div>
        <p className="text-sm text-slate-600 mb-6">
          工程{process.order}｜{process.name}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 text-sm">
          <InfoRow icon={<User className="w-3.5 h-3.5" />} label="作業者" value={worker?.name ?? '-'} />
          <InfoRow icon={<Cpu className="w-3.5 h-3.5" />} label="機械" value={machine?.name ?? '-'} />
          <InfoRow icon={<Clock className="w-3.5 h-3.5" />} label="予定時間" value={`${process.estimatedMinutes}分`} />
          <InfoRow
            icon={<Clock className="w-3.5 h-3.5" />}
            label="実績時間"
            value={process.actualMinutes ? `${process.actualMinutes}分` : '-'}
          />
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

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-slate-700">案件内の工程</p>
          <p className="text-xs text-slate-500">納期 {job?.dueDate}</p>
        </div>
        <ol className="space-y-2">
          {jobProcesses.map((p) => {
            const isCurrent = p.id === id;
            return (
              <li key={p.id}>
                <Link
                  href={`/process/${p.id}`}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
                    isCurrent
                      ? 'border-blue-300 bg-blue-50/60 ring-1 ring-blue-200'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                      isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {p.order}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${isCurrent ? 'font-semibold text-blue-900' : 'text-slate-800'}`}>
                      {p.name}
                    </p>
                  </div>
                  <div
                    className={`flex items-center gap-1 px-2 py-0.5 rounded border text-xs shrink-0 ${STATUS_STYLES[p.status]} ${
                      p.status === 'in_progress' ? 'animate-pulse' : ''
                    }`}
                  >
                    <StatusIcon status={p.status} small />
                    <span>{STATUS_LABEL[p.status]}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SideCard icon={<User className="w-4 h-4" />} title={`${worker?.name} の今日の他担当`}>
          {workerOtherToday.length === 0 ? (
            <p className="text-xs text-slate-400">他の担当なし</p>
          ) : (
            <ul className="space-y-1.5">
              {workerOtherToday.map((p) => {
                const j = allJobs.find((x) => x.id === p.jobId);
                return (
                  <li key={p.id}>
                    <Link
                      href={`/process/${p.id}`}
                      className="flex items-center gap-2 text-xs text-slate-700 hover:text-blue-700 transition-colors"
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          p.status === 'delayed'
                            ? 'bg-red-500'
                            : p.status === 'in_progress'
                            ? 'bg-blue-500'
                            : p.status === 'completed'
                            ? 'bg-green-500'
                            : 'bg-slate-300'
                        }`}
                      />
                      <span className="truncate">
                        {j?.name} · {p.name}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </SideCard>

        <SideCard icon={<Cpu className="w-4 h-4" />} title={`${machine?.name} の今日の他予定`}>
          {machineOtherToday.length === 0 ? (
            <p className="text-xs text-slate-400">他の予定なし</p>
          ) : (
            <ul className="space-y-1.5">
              {machineOtherToday.map((p) => {
                const j = allJobs.find((x) => x.id === p.jobId);
                return (
                  <li key={p.id}>
                    <Link
                      href={`/process/${p.id}`}
                      className="flex items-center gap-2 text-xs text-slate-700 hover:text-blue-700 transition-colors"
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          p.status === 'delayed'
                            ? 'bg-red-500'
                            : p.status === 'in_progress'
                            ? 'bg-blue-500'
                            : p.status === 'completed'
                            ? 'bg-green-500'
                            : 'bg-slate-300'
                        }`}
                      />
                      <span className="truncate">
                        {j?.name} · {p.name}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </SideCard>
      </div>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg border flex items-center gap-2 text-sm font-medium animate-in slide-in-from-bottom-4 ${
            toast.variant === 'blue'
              ? 'bg-blue-600 border-blue-700 text-white'
              : toast.variant === 'green'
              ? 'bg-green-600 border-green-700 text-white'
              : 'bg-red-600 border-red-700 text-white'
          }`}
        >
          {toast.variant === 'blue' && <PlayCircle className="w-4 h-4" />}
          {toast.variant === 'green' && <CheckCircle className="w-4 h-4" />}
          {toast.variant === 'red' && <AlertTriangle className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

function StatusIcon({ status, small }: { status: ProcessStatus; small?: boolean }) {
  const size = small ? 'w-3 h-3' : 'w-3.5 h-3.5';
  if (status === 'pending') return <Clock className={size} />;
  if (status === 'in_progress') return <PlayCircle className={size} />;
  if (status === 'completed') return <CheckCircle className={size} />;
  return <AlertTriangle className={size} />;
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-500 flex items-center gap-1">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-sm font-medium text-slate-900 mt-0.5">{value}</p>
    </div>
  );
}

function SideCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3 text-slate-700">
        {icon}
        <p className="text-sm font-medium truncate">{title}</p>
      </div>
      {children}
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
      className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none ${!disabled ? colors[variant] : ''}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
