export type JobStatus = "PENDING" | "QUEUED" | "RUNNING" | "DONE" | "ERROR" | "CANCELLED";
export type Label = "AI" | "HUMAN" | "UNCERTAIN";

export interface Job {
  id: string;
  document_id: string;
  filename: string;
  size_bytes: number;
  language?: string | null;
  status: JobStatus;
  ai_probability?: number | null;
  label?: Label;
  model_version?: string | null;
  queued_at?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  latency_ms?: number | null;
  error_msg?: string | null;
  created_at: string;
  s3_key?: string;
  feature_summary?: Record<string, number>;
}

export interface DashboardMetrics {
  totals: { all: number; done: number; error: number };
  latency: { avg_ms: number; p95_ms: number };
  queue: { running: number; queued: number };
  languages: Array<{ lang: string; count: number }>;
  labels: Array<{ label: Label; count: number }>;
  versions: Array<{ model_version: string; count: number }>;
  histogram: Array<{ bucket: string; count: number }>;
  timeseries: Array<{ date: string; total: number; done: number; error: number }>;
}


