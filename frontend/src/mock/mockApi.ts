import { v4 as uuid } from 'uuid';
import type { Job, DashboardMetrics, Label } from '../types';

const mem = {
  jobs: [] as Job[],
  timers: new Map<string, number>(),
};

function nowISO() { return new Date().toISOString(); }

function labelByProb(p: number): Label {
  if (p >= 0.7) return 'AI';
  if (p <= 0.3) return 'HUMAN';
  return 'UNCERTAIN';
}

export const mockApi = {
  async createJobs(files: File[], lang?: string): Promise<Job[]> {
    const created: Job[] = files.map((f) => {
      const id = uuid();
      const j: Job = {
        id,
        document_id: uuid(),
        filename: f.name,
        size_bytes: f.size,
        language: lang ?? null,
        status: 'QUEUED',
        created_at: nowISO(),
        queued_at: nowISO(),
        model_version: 'cnn-1d-onnx@0.1.0',
        s3_key: `mock/${id}/${f.name}`,
      };
      mem.jobs.unshift(j);
      const t = window.setTimeout(() => {
        j.status = 'RUNNING';
        j.started_at = nowISO();
        const run = 1200 + Math.random() * 1800;
        const t2 = window.setTimeout(() => {
          const p = Math.round((0.15 + Math.random() * 0.7) * 1000) / 1000;
          j.ai_probability = p;
          j.label = labelByProb(p);
          j.latency_ms = Math.floor(run);
          j.finished_at = nowISO();
          j.status = 'DONE';
          j.feature_summary = {
            avg_word_len: +(3 + Math.random() * 3).toFixed(2),
            ttr: +(0.3 + Math.random() * 0.4).toFixed(2),
            punctuation_ratio: +(0.05 + Math.random() * 0.1).toFixed(3),
            ngram_sparsity: +(0.2 + Math.random() * 0.6).toFixed(2),
            sentence_len_mean: Math.floor(10 + Math.random() * 15),
          } as any;
          mem.timers.delete(id);
        }, run);
        mem.timers.set(id, t2);
      }, 600 + Math.random() * 1000);
      mem.timers.set(id, t);
      return j;
    });
    return created;
  },

  async listJobs(params: { q?: string; status?: string[]; page?: number; page_size?: number }) {
    const { q, status, page = 1, page_size = 20 } = params || {} as any;
    let list = mem.jobs.slice();
    if (q) list = list.filter(j => j.filename.toLowerCase().includes(q.toLowerCase()) || j.id.includes(q));
    if (status && status.length) list = list.filter(j => status.includes(j.status));
    const total = list.length;
    const start = (page - 1) * page_size;
    return { items: list.slice(start, start + page_size), total };
  },

  async getJob(id: string): Promise<Job | undefined> {
    return mem.jobs.find(j => j.id === id);
  },

  async cancelJob(id: string) {
    const j = mem.jobs.find(x => x.id === id);
    if (!j) return;
    const t = mem.timers.get(id);
    if (t) window.clearTimeout(t);
    j.status = 'CANCELLED';
    j.finished_at = nowISO();
  },

  async rerunJob(id: string) {
    const j = mem.jobs.find(x => x.id === id);
    if (!j) return;
    j.status = 'QUEUED';
    j.error_msg = null as any;
    j.queued_at = nowISO();
    j.started_at = undefined as any;
    j.finished_at = undefined as any;
    j.ai_probability = undefined as any;
    const t = window.setTimeout(async () => {
      j.status = 'RUNNING';
      j.started_at = nowISO();
      const run = 1200 + Math.random() * 1800;
      const t2 = window.setTimeout(() => {
        const p = Math.round((0.15 + Math.random() * 0.7) * 1000) / 1000;
        j.ai_probability = p;
        j.label = labelByProb(p);
        j.latency_ms = Math.floor(run);
        j.finished_at = nowISO();
        j.status = 'DONE';
        mem.timers.delete(id);
      }, run);
      mem.timers.set(id, t2);
    }, 400);
    mem.timers.set(id, t);
  },

  async dashboard(): Promise<DashboardMetrics> {
    const jobs = mem.jobs;
    const all = jobs.length;
    const done = jobs.filter(j => j.status === 'DONE').length;
    const error = jobs.filter(j => j.status === 'ERROR').length;
    const running = jobs.filter(j => j.status === 'RUNNING').length;
    const queued = jobs.filter(j => j.status === 'QUEUED').length;
    const latencies = (jobs.filter(j => j.latency_ms).map(j => j.latency_ms!) as number[]) || [1000];
    latencies.sort((a,b)=>a-b);
    const p95 = latencies[Math.floor(latencies.length*0.95)] || 0;
    const avg = Math.round(latencies.reduce((a,b)=>a+b,0)/(latencies.length||1));
    const langsMap = new Map<string, number>();
    const labelsMap = new Map<string, number>();
    const versionsMap = new Map<string, number>();
    const histMap = new Map<string, number>();
    for (const j of jobs) {
      langsMap.set(j.language || 'unknown', (langsMap.get(j.language || 'unknown') || 0) + 1);
      labelsMap.set(j.label || 'UNCERTAIN', (labelsMap.get(j.label || 'UNCERTAIN') || 0) + 1);
      versionsMap.set(j.model_version || 'unknown', (versionsMap.get(j.model_version || 'unknown') || 0) + 1);
      const p = j.ai_probability ?? -1;
      if (p >= 0) {
        const b = Math.min(19, Math.floor(p / 0.05));
        const key = `${(b*0.05).toFixed(2)}-${((b+1)*0.05).toFixed(2)}`;
        histMap.set(key, (histMap.get(key) || 0) + 1);
      }
    }
    const days: Record<string,{date:string,total:number,done:number,error:number}> = {};
    for (const j of jobs) {
      const d = (j.created_at || nowISO()).slice(0,10);
      days[d] ||= { date: d, total: 0, done: 0, error: 0 };
      days[d].total++;
      if (j.status === 'DONE') days[d].done++;
      if (j.status === 'ERROR') days[d].error++;
    }
    return {
      totals: { all, done, error },
      latency: { avg_ms: avg, p95_ms: p95 },
      queue: { running, queued },
      languages: [...langsMap].map(([lang,count])=>({lang, count})),
      labels: [...labelsMap].map(([label,count])=>({label: label as any, count})),
      versions: [...versionsMap].map(([model_version,count])=>({model_version, count})),
      histogram: [...histMap].map(([bucket,count])=>({bucket, count})),
      timeseries: Object.values(days).sort((a,b)=>a.date.localeCompare(b.date)),
    };
  },
};


