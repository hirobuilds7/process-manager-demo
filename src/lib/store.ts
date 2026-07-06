import { PROCESSES } from './sample-data';
import type { Process, ProcessStatus } from './types';

const STORAGE_KEY = 'process-manager-demo-state';

export function loadProcesses(): Process[] {
  if (typeof window === 'undefined') return PROCESSES;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try { return JSON.parse(saved) as Process[]; } catch { return PROCESSES; }
  }
  return PROCESSES;
}

export function saveProcesses(processes: Process[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(processes));
}

export function updateProcessStatus(id: string, status: ProcessStatus): Process[] {
  const processes = loadProcesses();
  const now = new Date().toISOString();
  const updated = processes.map((p) => {
    if (p.id !== id) return p;
    if (status === 'in_progress' && !p.startedAt) {
      return { ...p, status, startedAt: now };
    }
    if (status === 'completed') {
      const startedAt = p.startedAt ?? now;
      const started = new Date(startedAt).getTime();
      const actualMinutes = Math.max(1, Math.round((Date.now() - started) / 60000));
      return { ...p, status, completedAt: now, actualMinutes: p.actualMinutes ?? actualMinutes };
    }
    return { ...p, status };
  });
  saveProcesses(updated);
  return updated;
}

export function resetProcesses() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
