import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getJob, cancelJob, rerunJob } from '../services/jobs';
import type { Job } from '../types';
import { StatusChip } from '../components/StatusChip';
import { ProbabilityGauge } from '../components/ProbabilityGauge';

export default function JobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState<Job | undefined>();
  async function load(){ if (id) setJob(await getJob(id)); }
  useEffect(()=>{ load(); }, [id]);
  useEffect(()=>{
    if (!job) return;
    if (['PENDING','QUEUED','RUNNING'].includes(job.status)) {
      const t = setTimeout(load, 1500);
      return ()=>clearTimeout(t);
    }
  }, [job]);

  if (!job) return <div style={{ padding: 24 }}>Loading…</div>;

  return (
    <div style={{ maxWidth: 1024, margin: '24px auto', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>Job Detail</h1>
        <StatusChip status={job.status} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <ProbabilityGauge
          value={job.ai_probability ?? null}
          label={job.label ?? ((job.ai_probability ?? 0) >= 0.7 ? 'AI' : (job.ai_probability ?? 0) <= 0.3 ? 'HUMAN' : 'UNCERTAIN')}
        />
        <div style={{ fontSize: 14 }}>
          <div>Label: <b>{job.label ?? '-'}</b></div>
          <div>Model: {job.model_version}</div>
          <div>Latency: {job.latency_ms ?? '-'} ms</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Document</div>
          <div style={{ fontSize: 14 }}>File: {job.filename}</div>
          <div style={{ fontSize: 14 }}>Size: {(job.size_bytes/1024).toFixed(1)} KB</div>
          <div style={{ fontSize: 14 }}>Language: {job.language ?? '-'}</div>
          <div style={{ fontSize: 14 }}>Storage: {job.s3_key}</div>
        </div>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Timeline</div>
          <div style={{ fontSize: 14 }}>Created: {new Date(job.created_at).toLocaleString()}</div>
          <div style={{ fontSize: 14 }}>Queued: {job.queued_at ? new Date(job.queued_at).toLocaleString() : '-'}</div>
          <div style={{ fontSize: 14 }}>Started: {job.started_at ? new Date(job.started_at).toLocaleString() : '-'}</div>
          <div style={{ fontSize: 14 }}>Finished: {job.finished_at ? new Date(job.finished_at).toLocaleString() : '-'}</div>
        </div>
      </div>
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Feature summary</div>
        <pre style={{ fontSize: 12, background: '#f9fafb', padding: 8, borderRadius: 6, overflow: 'auto' }}>{JSON.stringify(job.feature_summary ?? {}, null, 2)}</pre>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {['QUEUED','RUNNING'].includes(job.status) && <button style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: 6 }} onClick={()=>cancelJob(job.id).then(load)}>Cancel</button>}
        {['DONE','ERROR','CANCELLED'].includes(job.status) && <button style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: 6 }} onClick={()=>rerunJob(job.id).then(load)}>Rerun</button>}
      </div>
    </div>
  );
}


