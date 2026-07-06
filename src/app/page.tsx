'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { loadProcesses, resetProcesses, loadUserJobs, addJobWithProcesses, loadUserClients, addClient } from '@/lib/store';
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
  Plus,
  X,
  Upload,
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
  const [userJobs, setUserJobs] = useState<Job[]>([]);
  const [userClients, setUserClients] = useState<Client[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setProcesses(loadProcesses());
    setUserJobs(loadUserJobs());
    setUserClients(loadUserClients());
  }, []);

  const todayProcesses = processes.filter((p) => p.scheduledDate === CURRENT_DATE);
  const allJobs = [...JOBS, ...userJobs];
  const allClients = [...CLIENTS, ...userClients];
  const jobsMap = new Map(allJobs.map((j) => [j.id, j]));
  const clientsMap = new Map(allClients.map((c) => [c.id, c]));

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
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowModal(true)}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md px-3 py-1.5 flex items-center gap-1 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新規案件</span>
          </button>
          <Link
            href="/import"
            className="text-xs text-slate-600 border border-slate-300 hover:border-slate-400 hover:text-slate-900 rounded-md px-3 py-1.5 flex items-center gap-1 transition-colors"
            title="CSVから案件+工程を一括取り込み"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CSV取り込み</span>
          </Link>
          <button
            onClick={() => {
              resetProcesses();
              setProcesses(PROCESSES);
              setUserJobs([]);
            }}
            className="text-xs text-slate-500 hover:text-slate-700 border border-slate-300 hover:border-slate-400 rounded-md px-3 py-1.5 flex items-center gap-1 transition-colors"
            title="操作した進捗と追加した案件を初期状態に戻す（デモ用）"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>リセット</span>
          </button>
        </div>
      </div>

      {showModal && (
        <NewJobModal
          existingClients={allClients}
          onClose={() => setShowModal(false)}
          onSave={(job, procs, newClient) => {
            if (newClient) addClient(newClient);
            addJobWithProcesses(job, procs);
            setProcesses(loadProcesses());
            setUserJobs(loadUserJobs());
            setUserClients(loadUserClients());
            setShowModal(false);
          }}
        />
      )}

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
          <div className="px-4 py-2 pl-11 bg-slate-50/60">
            <Link
              href={`/job/${job.id}`}
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              案件詳細を開く（工程の追加ができます）→
            </Link>
          </div>
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

function NewJobModal({
  existingClients,
  onClose,
  onSave,
}: {
  existingClients: Client[];
  onClose: () => void;
  onSave: (job: Job, procs: Process[], newClient?: Client) => void;
}) {
  const [clientSelection, setClientSelection] = useState(existingClients[0]?.id ?? '__new__');
  const [newClientName, setNewClientName] = useState('');
  const [jobName, setJobName] = useState('');
  const [quantity, setQuantity] = useState(50);
  const [dueDate, setDueDate] = useState('2026-07-15');
  const [processName, setProcessName] = useState('材料切断');
  const [machineId, setMachineId] = useState(MACHINES[0].id);
  const [workerId, setWorkerId] = useState(WORKERS[0].id);
  const [estimated, setEstimated] = useState(60);

  const isNewClient = clientSelection === '__new__';
  const canSave =
    jobName.trim().length > 0 &&
    processName.trim().length > 0 &&
    quantity > 0 &&
    estimated > 0 &&
    (isNewClient ? newClientName.trim().length > 0 : true);

  const handleSave = () => {
    if (!canSave) return;
    const now = Date.now();
    let clientId = clientSelection;
    let newClient: Client | undefined;
    if (isNewClient) {
      newClient = { id: `uc${now}`, name: newClientName.trim() };
      clientId = newClient.id;
    }
    const jobId = `uj${now}`;
    const procId = `up${now}`;
    const job: Job = {
      id: jobId,
      clientId,
      name: jobName.trim(),
      quantity,
      dueDate,
      status: 'in_progress',
    };
    const proc: Process = {
      id: procId,
      jobId,
      name: processName.trim(),
      order: 1,
      machineId,
      workerId,
      estimatedMinutes: estimated,
      actualMinutes: null,
      status: 'pending',
      startedAt: null,
      completedAt: null,
      scheduledDate: CURRENT_DATE,
    };
    onSave(job, [proc], newClient);
  };

  return (
    <div
      className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
          <p className="font-semibold">新規案件を追加</p>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <Section title="案件情報">
            <Field label="客先">
              <select
                value={clientSelection}
                onChange={(e) => setClientSelection(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {existingClients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
                <option value="__new__">＋ 新規客先を追加</option>
              </select>
              {isNewClient && (
                <input
                  type="text"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="新規客先名（例：東海機械工業）"
                  autoFocus
                  className="w-full mt-2 px-3 py-2 border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50/40"
                />
              )}
            </Field>
            <Field label="案件名">
              <input
                type="text"
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                placeholder="例：ベアリングホルダ製作"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="数量">
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  min={1}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Field>
              <Field label="納期">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Field>
            </div>
          </Section>

          <Section title="初期工程（今日開始）">
            <Field label="工程名">
              <input
                type="text"
                value={processName}
                onChange={(e) => setProcessName(e.target.value)}
                placeholder="例：材料切断"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="機械">
                <select
                  value={machineId}
                  onChange={(e) => setMachineId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {MACHINES.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="作業者">
                <select
                  value={workerId}
                  onChange={(e) => setWorkerId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {WORKERS.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="予定時間（分）">
              <input
                type="number"
                value={estimated}
                onChange={(e) => setEstimated(Number(e.target.value))}
                min={1}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>
          </Section>
        </div>

        <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-end gap-2 bg-slate-50">
          <button
            onClick={onClose}
            className="px-3 py-2 text-sm text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-md transition-colors shadow-sm"
          >
            追加する
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-slate-600 mb-1 block">{label}</label>
      {children}
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
