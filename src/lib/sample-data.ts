import type { Worker, Machine, Client, Job, Process } from './types';

export const WORKERS: Worker[] = [
  { id: 'w1', name: '田中', skills: ['m1', 'm2', 'm3'] },
  { id: 'w2', name: '佐藤', skills: ['m1', 'm2'] },
  { id: 'w3', name: '鈴木', skills: ['m3', 'm4'] },
  { id: 'w4', name: '高橋', skills: ['m4', 'm5'] },
  { id: 'w5', name: '伊藤', skills: ['m5'] },
  { id: 'w6', name: '渡辺', skills: ['m1', 'm3', 'm5'] },
];

export const MACHINES: Machine[] = [
  { id: 'm1', name: '旋盤A', type: 'lathe', status: 'running' },
  { id: 'm2', name: '旋盤B', type: 'lathe', status: 'idle' },
  { id: 'm3', name: 'フライスC', type: 'milling', status: 'running' },
  { id: 'm4', name: 'マシニングD', type: 'machining', status: 'running' },
  { id: 'm5', name: '研磨機E', type: 'grinding', status: 'idle' },
];

export const CLIENTS: Client[] = [
  { id: 'c1', name: '東西工業' },
  { id: 'c2', name: '北南製作所' },
  { id: 'c3', name: '中央機械' },
];

export const JOBS: Job[] = [
  { id: 'j1', clientId: 'c1', name: 'ブラケット製作', quantity: 100, dueDate: '2026-07-10', status: 'in_progress' },
  { id: 'j2', clientId: 'c2', name: 'シャフト加工', quantity: 50, dueDate: '2026-07-12', status: 'in_progress' },
  { id: 'j3', clientId: 'c3', name: 'ハウジング部品', quantity: 200, dueDate: '2026-07-15', status: 'pending' },
  { id: 'j4', clientId: 'c1', name: 'センサーホルダ', quantity: 30, dueDate: '2026-07-08', status: 'in_progress' },
  { id: 'j5', clientId: 'c2', name: 'ギア加工', quantity: 80, dueDate: '2026-07-14', status: 'in_progress' },
  { id: 'j6', clientId: 'c3', name: 'フランジ製作', quantity: 60, dueDate: '2026-07-17', status: 'pending' },
  { id: 'j7', clientId: 'c1', name: 'カバー部品', quantity: 150, dueDate: '2026-07-11', status: 'pending' },
];

const TODAY = '2026-07-06';
const TOMORROW = '2026-07-07';

export const PROCESSES: Process[] = [
  { id: 'p1', jobId: 'j1', name: '材料切断', order: 1, machineId: 'm1', workerId: 'w1', estimatedMinutes: 60, actualMinutes: 55, status: 'completed', startedAt: '2026-07-06T08:00:00', completedAt: '2026-07-06T08:55:00', scheduledDate: TODAY },
  { id: 'p2', jobId: 'j1', name: '旋盤加工', order: 2, machineId: 'm1', workerId: 'w1', estimatedMinutes: 180, actualMinutes: null, status: 'in_progress', startedAt: '2026-07-06T09:00:00', completedAt: null, scheduledDate: TODAY },
  { id: 'p3', jobId: 'j1', name: 'フライス加工', order: 3, machineId: 'm3', workerId: 'w3', estimatedMinutes: 120, actualMinutes: null, status: 'pending', startedAt: null, completedAt: null, scheduledDate: TODAY },
  { id: 'p4', jobId: 'j1', name: '検品', order: 4, machineId: 'm5', workerId: 'w5', estimatedMinutes: 45, actualMinutes: null, status: 'pending', startedAt: null, completedAt: null, scheduledDate: TOMORROW },
  { id: 'p5', jobId: 'j2', name: '材料切断', order: 1, machineId: 'm2', workerId: 'w2', estimatedMinutes: 40, actualMinutes: 38, status: 'completed', startedAt: '2026-07-06T08:00:00', completedAt: '2026-07-06T08:38:00', scheduledDate: TODAY },
  { id: 'p6', jobId: 'j2', name: '旋盤加工', order: 2, machineId: 'm2', workerId: 'w2', estimatedMinutes: 240, actualMinutes: null, status: 'in_progress', startedAt: '2026-07-06T09:00:00', completedAt: null, scheduledDate: TODAY },
  { id: 'p7', jobId: 'j2', name: '研磨', order: 3, machineId: 'm5', workerId: 'w5', estimatedMinutes: 60, actualMinutes: null, status: 'pending', startedAt: null, completedAt: null, scheduledDate: TOMORROW },
  { id: 'p8', jobId: 'j4', name: '材料切断', order: 1, machineId: 'm1', workerId: 'w6', estimatedMinutes: 30, actualMinutes: 32, status: 'completed', startedAt: '2026-07-06T08:00:00', completedAt: '2026-07-06T08:32:00', scheduledDate: TODAY },
  { id: 'p9', jobId: 'j4', name: 'マシニング加工', order: 2, machineId: 'm4', workerId: 'w4', estimatedMinutes: 90, actualMinutes: null, status: 'delayed', startedAt: '2026-07-06T09:00:00', completedAt: null, scheduledDate: TODAY },
  { id: 'p10', jobId: 'j4', name: 'フライス仕上げ', order: 3, machineId: 'm3', workerId: 'w3', estimatedMinutes: 45, actualMinutes: null, status: 'pending', startedAt: null, completedAt: null, scheduledDate: TODAY },
  { id: 'p11', jobId: 'j5', name: '材料切断', order: 1, machineId: 'm2', workerId: 'w2', estimatedMinutes: 50, actualMinutes: null, status: 'pending', startedAt: null, completedAt: null, scheduledDate: TODAY },
  { id: 'p12', jobId: 'j5', name: '旋盤加工', order: 2, machineId: 'm1', workerId: 'w6', estimatedMinutes: 200, actualMinutes: null, status: 'pending', startedAt: null, completedAt: null, scheduledDate: TOMORROW },
  { id: 'p13', jobId: 'j3', name: '材料切断', order: 1, machineId: 'm2', workerId: 'w2', estimatedMinutes: 90, actualMinutes: null, status: 'pending', startedAt: null, completedAt: null, scheduledDate: TOMORROW },
];

export const CURRENT_DATE = TODAY;
