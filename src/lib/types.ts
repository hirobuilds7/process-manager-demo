export type Worker = {
  id: string;
  name: string;
  skills: string[];
};

export type Machine = {
  id: string;
  name: string;
  type: string;
  status: 'idle' | 'running' | 'maintenance';
};

export type Client = {
  id: string;
  name: string;
};

export type ProcessStatus = 'pending' | 'in_progress' | 'completed' | 'delayed';

export type Job = {
  id: string;
  clientId: string;
  name: string;
  quantity: number;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
};

export type Process = {
  id: string;
  jobId: string;
  name: string;
  order: number;
  machineId: string;
  workerId: string;
  estimatedMinutes: number;
  actualMinutes: number | null;
  status: ProcessStatus;
  startedAt: string | null;
  completedAt: string | null;
  scheduledDate: string;
};
