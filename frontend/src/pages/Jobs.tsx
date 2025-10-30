import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listJobs, cancelJob, rerunJob } from '../services/jobs';
import type { Job } from '../types';
import { StatusChip } from '../components/StatusChip';

export default function Jobs() {
  const [data, setData] = useState<Job[]>([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string[]>([]);
  const [tick, setTick] = useState(0);

  async function load() {
    const { items } = await listJobs({ q, status, page: 1, page_size: 50 });
    setData(items);
  }
  useEffect(()=>{ load(); }, [q, status, tick]);
  useEffect(()=>{
    const hasRunning = data.some(j => ['PENDING','QUEUED','RUNNING'].includes(j.status));
    if (!hasRunning) return;
    const t = setTimeout(()=>setTick(x=>x+1), 2000);
    return ()=>clearTimeout(t);
  }, [data]);

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto' }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 20, fontWeight: 600, color: '#1F2329' }}>Jobs</div>
        <div style={{ fontSize: 12, color: '#8F959E', marginTop: 4 }}>Monitor jobs and their progress</div>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input style={{ border: '1px solid #EAEDF2', borderRadius: 8, padding: '6px 10px', fontSize: 14 }} placeholder="Search filename / Job ID" value={q} onChange={e=>setQ(e.target.value)} />
        <select style={{ border: '1px solid #EAEDF2', borderRadius: 8, padding: '6px 10px', fontSize: 14 }} onChange={(e)=>setStatus(e.target.value? [e.target.value] : [])}>
          <option value="">All statuses</option>
          {['PENDING','QUEUED','RUNNING','DONE','ERROR','CANCELLED'].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <button style={{ padding: '6px 10px', border: '1px solid #EAEDF2', borderRadius: 8, background: '#FFFFFF' }} onClick={load}>Refresh</button>
      </div>
      <div style={{ background: '#FFFFFF', border: '1px solid #EAEDF2', borderRadius: 10, marginTop: 12, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
        <table style={{ width: '100%', fontSize: 14 }}>
          <thead style={{ background: '#F7F8FA', color: '#4E5969' }}>
            <tr>
              <th style={{ textAlign: 'left', padding: 10, fontWeight: 600 }}>Job ID</th>
              <th style={{ textAlign: 'left', padding: 10, fontWeight: 600 }}>File</th>
              <th style={{ textAlign: 'left', padding: 10, fontWeight: 600 }}>Status</th>
              <th style={{ textAlign: 'left', padding: 10, fontWeight: 600 }}>Probability</th>
              <th style={{ textAlign: 'left', padding: 10, fontWeight: 600 }}>Label</th>
              <th style={{ textAlign: 'left', padding: 10, fontWeight: 600 }}>Created</th>
              <th style={{ textAlign: 'left', padding: 10, fontWeight: 600 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.map(j => (
              <tr key={j.id} style={{ borderTop: '1px solid #EAEDF2' }}>
                <td style={{ padding: 10, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12, color: '#8F959E' }}>{j.id.slice(0,8)}…</td>
                <td style={{ padding: 10, color: '#1F2329' }}>{j.filename}</td>
                <td style={{ padding: 10 }}><StatusChip status={j.status} /></td>
                <td style={{ padding: 10, color: '#1F2329' }}>{j.ai_probability != null ? j.ai_probability.toFixed(3) : '-'}</td>
                <td style={{ padding: 10, color: '#4E5969' }}>{j.label ?? '-'}</td>
                <td style={{ padding: 10, color: '#4E5969' }}>{new Date(j.created_at).toLocaleString()}</td>
                <td style={{ padding: 10, display: 'flex', gap: 8 }}>
                  <Link to={`/jobs/${j.id}`} style={{ color: '#3370FF' }}>Detail</Link>
                  {['QUEUED','RUNNING'].includes(j.status) && (
                    <button onClick={()=>cancelJob(j.id).then(load)} style={{ padding: '6px 10px', border: '1px solid #EAEDF2', borderRadius: 8, background: '#FFF', color: '#D92D20' }}>Cancel</button>
                  )}
                  {['DONE','ERROR','CANCELLED'].includes(j.status) && (
                    <button onClick={()=>rerunJob(j.id).then(load)} style={{ padding: '6px 10px', border: '1px solid #EAEDF2', borderRadius: 8, background: '#FFF', color: '#1F2329' }}>Rerun</button>
                  )}
                </td>
              </tr>
            ))}
            {!data.length && <tr><td colSpan={7} style={{ padding: 16, color: '#8F959E' }}>No jobs</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}


