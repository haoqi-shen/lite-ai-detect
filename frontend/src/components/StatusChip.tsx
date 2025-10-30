import type { JobStatus } from '../types';

export function StatusChip({ status }: { status: JobStatus }) {
  const color = {
    PENDING: 'background:#e5e7eb;color:#111827',
    QUEUED: 'background:#dbeafe;color:#1e40af',
    RUNNING: 'background:#e0e7ff;color:#3730a3',
    DONE: 'background:#dcfce7;color:#166534',
    ERROR: 'background:#fee2e2;color:#b91c1c',
    CANCELLED: 'background:#fef9c3;color:#a16207',
  }[status];
  return <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 500, ...(parseInlineStyle(color)) }}>{status}</span>;
}

function parseInlineStyle(style: string): React.CSSProperties {
  const obj: any = {};
  style.split(';').forEach(pair => {
    const [k, v] = pair.split(':');
    if (!k || !v) return;
    const key = k.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    obj[key] = v.trim();
  });
  return obj;
}


