import { PROCESSES } from './sample-data';
import type { Process, ProcessStatus, Job, Client } from './types';

const STORAGE_KEY = 'process-manager-demo-state';
const USER_JOBS_KEY = 'process-manager-demo-userjobs';
const USER_CLIENTS_KEY = 'process-manager-demo-userclients';

export function loadProcesses(): Process[] {
  if (typeof window === 'undefined') return PROCESSES;
  const saved = sessionStorage.getItem(STORAGE_KEY);
  if (saved) {
    try { return JSON.parse(saved) as Process[]; } catch { return PROCESSES; }
  }
  return PROCESSES;
}

export function saveProcesses(processes: Process[]) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(processes));
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
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(USER_JOBS_KEY);
  sessionStorage.removeItem(USER_CLIENTS_KEY);
}

export function loadUserClients(): Client[] {
  if (typeof window === 'undefined') return [];
  const saved = sessionStorage.getItem(USER_CLIENTS_KEY);
  if (!saved) return [];
  try { return JSON.parse(saved) as Client[]; } catch { return []; }
}

export function addClient(client: Client) {
  const clients = loadUserClients();
  saveUserClients([...clients, client]);
}

function saveUserClients(clients: Client[]) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(USER_CLIENTS_KEY, JSON.stringify(clients));
}

export function loadUserJobs(): Job[] {
  if (typeof window === 'undefined') return [];
  const saved = sessionStorage.getItem(USER_JOBS_KEY);
  if (!saved) return [];
  try { return JSON.parse(saved) as Job[]; } catch { return []; }
}

export function addJobWithProcesses(job: Job, newProcesses: Process[]) {
  const jobs = loadUserJobs();
  saveUserJobs([...jobs, job]);
  const procs = loadProcesses();
  saveProcesses([...procs, ...newProcesses]);
}

export function addProcess(newProcess: Process) {
  const procs = loadProcesses();
  saveProcesses([...procs, newProcess]);
}

function saveUserJobs(jobs: Job[]) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(USER_JOBS_KEY, JSON.stringify(jobs));
}
