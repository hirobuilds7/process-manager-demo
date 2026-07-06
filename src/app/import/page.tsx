'use client';
import { useState } from 'react';
import Link from 'next/link';
import { addJobWithProcesses, addProcess, loadUserJobs } from '@/lib/store';
import { CLIENTS, MACHINES, WORKERS, JOBS } from '@/lib/sample-data';
import type { Job, Process } from '@/lib/types';
import { ChevronLeft, Upload, FileText, CheckCircle, AlertTriangle, Download } from 'lucide-react';

type ParsedRow = {
  lineNum: number;
  jobName: string;
  clientName: string;
  quantity: number;
  dueDate: string;
  processName: string;
  order: number;
  machineName: string;
  workerName: string;
  estimated: number;
  scheduledDate: string;
  errors: string[];
};

const SAMPLE_CSV = `案件名,客先,数量,納期,工程名,順,機械,作業者,予定時間,予定日
テストブラケット,東西工業,120,2026-07-20,材料切断,1,旋盤A,田中,60,2026-07-06
テストブラケット,東西工業,120,2026-07-20,旋盤加工,2,旋盤A,田中,180,2026-07-07
テストブラケット,東西工業,120,2026-07-20,検品,3,研磨機E,伊藤,45,2026-07-08
急ぎフランジ,中央機械,40,2026-07-10,材料切断,1,旋盤B,佐藤,40,2026-07-06
急ぎフランジ,中央機械,40,2026-07-10,旋盤加工,2,旋盤B,佐藤,150,2026-07-07`;

function parseCSV(text: string): string[][] {
  return text
    .trim()
    .split(/\r?\n/)
    .map((line) => line.split(',').map((s) => s.trim()));
}

function validate(rows: string[][]): ParsedRow[] {
  if (rows.length === 0) return [];
  const dataRows = rows.slice(1); // skip header
  return dataRows.map((row, idx) => {
    const errors: string[] = [];
    const [jobName, clientName, quantityStr, dueDate, processName, orderStr, machineName, workerName, estimatedStr, scheduledDate] = row;
    if (!jobName) errors.push('案件名なし');
    if (!clientName) errors.push('客先なし');
    if (!CLIENTS.find((c) => c.name === clientName)) errors.push(`客先「${clientName}」未登録`);
    const quantity = Number(quantityStr);
    if (isNaN(quantity) || quantity < 1) errors.push('数量が不正');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) errors.push('納期の日付形式が不正（YYYY-MM-DD）');
    if (!processName) errors.push('工程名なし');
    const order = Number(orderStr);
    if (isNaN(order) || order < 1) errors.push('工程順が不正');
    if (!MACHINES.find((m) => m.name === machineName)) errors.push(`機械「${machineName}」未登録`);
    if (!WORKERS.find((w) => w.name === workerName)) errors.push(`作業者「${workerName}」未登録`);
    const estimated = Number(estimatedStr);
    if (isNaN(estimated) || estimated < 1) errors.push('予定時間が不正');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)) errors.push('予定日の日付形式が不正');
    return {
      lineNum: idx + 2, // +1 for 0-index, +1 for header row
      jobName,
      clientName,
      quantity,
      dueDate,
      processName,
      order,
      machineName,
      workerName,
      estimated,
      scheduledDate,
      errors,
    };
  });
}

export default function ImportPage() {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [imported, setImported] = useState<{ jobs: number; procs: number } | null>(null);

  const handleFile = (file: File) => {
    setImported(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target?.result ?? '');
      const parsed = parseCSV(text);
      setRows(validate(parsed));
    };
    reader.readAsText(file);
  };

  const handleSample = () => {
    setImported(null);
    setRows(validate(parseCSV(SAMPLE_CSV)));
  };

  const validRows = rows.filter((r) => r.errors.length === 0);
  const invalidRows = rows.filter((r) => r.errors.length > 0);

  const handleImport = () => {
    if (validRows.length === 0) return;

    // グループ化：案件名+客先+納期をキーとする
    const jobGroups = new Map<
      string,
      { job: Job; processes: Process[]; isNewJob: boolean }
    >();
    const existingJobs = [...JOBS, ...loadUserJobs()];
    let jobsAdded = 0;
    let procsAdded = 0;
    const now = Date.now();

    validRows.forEach((r, idx) => {
      const client = CLIENTS.find((c) => c.name === r.clientName)!;
      const machine = MACHINES.find((m) => m.name === r.machineName)!;
      const worker = WORKERS.find((w) => w.name === r.workerName)!;
      const jobKey = `${r.jobName}__${client.id}__${r.dueDate}`;

      let entry = jobGroups.get(jobKey);
      if (!entry) {
        const existing = existingJobs.find(
          (j) => j.name === r.jobName && j.clientId === client.id && j.dueDate === r.dueDate
        );
        if (existing) {
          entry = { job: existing, processes: [], isNewJob: false };
        } else {
          const newJob: Job = {
            id: `uj${now}_${idx}`,
            clientId: client.id,
            name: r.jobName,
            quantity: r.quantity,
            dueDate: r.dueDate,
            status: 'in_progress',
          };
          entry = { job: newJob, processes: [], isNewJob: true };
        }
        jobGroups.set(jobKey, entry);
      }

      const proc: Process = {
        id: `up${now}_${idx}`,
        jobId: entry.job.id,
        name: r.processName,
        order: r.order,
        machineId: machine.id,
        workerId: worker.id,
        estimatedMinutes: r.estimated,
        actualMinutes: null,
        status: 'pending',
        startedAt: null,
        completedAt: null,
        scheduledDate: r.scheduledDate,
      };
      entry.processes.push(proc);
    });

    jobGroups.forEach(({ job, processes, isNewJob }) => {
      if (isNewJob) {
        addJobWithProcesses(job, processes);
        jobsAdded++;
        procsAdded += processes.length;
      } else {
        processes.forEach((p) => addProcess(p));
        procsAdded += processes.length;
      }
    });

    setImported({ jobs: jobsAdded, procs: procsAdded });
    setRows([]);
  };

  return (
    <div className="mx-auto max-w-4xl w-full px-6 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>一覧に戻る</span>
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold">CSVから一括取り込み</h1>
        <p className="text-sm text-slate-500 mt-1">
          既存Excel/スプレッドシートの計画をCSV出力してアップロード。案件と工程をまとめて登録します。
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-4">
        <div className="flex items-center gap-2 mb-3 text-slate-700">
          <FileText className="w-4 h-4" />
          <p className="text-sm font-medium">CSVフォーマット</p>
        </div>
        <p className="text-xs text-slate-600 mb-3">
          ヘッダー行の次から1行1工程で入力。同じ「案件名 + 客先 + 納期」の行は同一案件としてグループ化されます。
        </p>
        <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-[11px] font-mono text-slate-700 whitespace-pre overflow-x-auto">
{`案件名,客先,数量,納期,工程名,順,機械,作業者,予定時間,予定日
テストブラケット,東西工業,120,2026-07-20,材料切断,1,旋盤A,田中,60,2026-07-06
テストブラケット,東西工業,120,2026-07-20,旋盤加工,2,旋盤A,田中,180,2026-07-07`}
        </div>
        <p className="text-xs text-slate-500 mt-3">
          客先・機械・作業者はマスタに登録されている名前のみ有効（客先：東西工業／北南製作所／中央機械・機械：旋盤A/B/フライスC/マシニングD/研磨機E・作業者：田中/佐藤/鈴木/高橋/伊藤/渡辺）
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium cursor-pointer transition-colors shadow-sm">
            <Upload className="w-4 h-4" />
            <span>CSVファイルを選択</span>
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = '';
              }}
            />
          </label>
          <button
            onClick={handleSample}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-slate-300 hover:border-slate-400 text-slate-700 text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>サンプルCSVを試す</span>
          </button>
        </div>
      </div>

      {imported && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 flex items-center gap-2 text-green-800 shadow-sm">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">
            取り込み完了：新規案件 {imported.jobs}件・工程 {imported.procs}件を追加しました
          </p>
          <Link
            href="/"
            className="ml-auto text-sm text-green-700 hover:text-green-900 underline shrink-0"
          >
            一覧で確認
          </Link>
        </div>
      )}

      {rows.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-slate-700">
              プレビュー（{rows.length}行 / 有効 {validRows.length} · エラー {invalidRows.length}）
            </p>
            <button
              onClick={handleImport}
              disabled={validRows.length === 0}
              className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-md transition-colors shadow-sm"
            >
              {validRows.length}件を取り込む
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-2 py-1.5 text-left">行</th>
                  <th className="px-2 py-1.5 text-left">案件</th>
                  <th className="px-2 py-1.5 text-left">工程</th>
                  <th className="px-2 py-1.5 text-left">機械</th>
                  <th className="px-2 py-1.5 text-left">作業者</th>
                  <th className="px-2 py-1.5 text-left">分</th>
                  <th className="px-2 py-1.5 text-left">予定日</th>
                  <th className="px-2 py-1.5 text-left">検証</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.lineNum} className={r.errors.length > 0 ? 'bg-red-50/40' : ''}>
                    <td className="px-2 py-1.5 text-slate-400">{r.lineNum}</td>
                    <td className="px-2 py-1.5 truncate max-w-[120px]">{r.jobName}</td>
                    <td className="px-2 py-1.5 truncate max-w-[100px]">{r.processName}</td>
                    <td className="px-2 py-1.5">{r.machineName}</td>
                    <td className="px-2 py-1.5">{r.workerName}</td>
                    <td className="px-2 py-1.5 tabular-nums">{r.estimated}</td>
                    <td className="px-2 py-1.5 text-slate-500">{r.scheduledDate}</td>
                    <td className="px-2 py-1.5">
                      {r.errors.length === 0 ? (
                        <span className="inline-flex items-center gap-1 text-green-700">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>OK</span>
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 text-red-700"
                          title={r.errors.join(' / ')}
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{r.errors[0]}</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
