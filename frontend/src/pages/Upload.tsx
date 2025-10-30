import { useState } from 'react';
import { FileDropzone } from '../components/FileDropzone';
import { createJobs } from '../services/jobs';
import { Link } from 'react-router-dom';

type Item = { id: string; file: File; status: 'ready' | 'creating' | 'created' | 'failed'; jobId?: string; error?: string };

export default function Upload() {
  const [items, setItems] = useState<Item[]>([]);
  const [lang, setLang] = useState<string>('');

  function addFiles(files: File[]) {
    const toAdd = files.map((f, idx) => ({ id: `${Date.now()}-${idx}-${f.name}`, file: f, status: 'ready' as const }));
    setItems((prev)=>[...toAdd, ...prev]);
  }

  async function start() {
    const pending = items.filter(i => i.status === 'ready');
    if (!pending.length) return;
    setItems(prev => prev.map(i => i.status === 'ready' ? { ...i, status: 'creating' } : i));
    try {
      const jobs = await createJobs(pending.map(p => p.file), lang || undefined);
      const map = new Map(jobs.map(j => [j.filename, j]));
      setItems(prev => prev.map(i => {
        const j = map.get(i.file.name);
        return j ? { ...i, status: 'created', jobId: j.id } : i;
      }));
    } catch (e: any) {
      setItems(prev => prev.map(i => i.status === 'creating' ? { ...i, status: 'failed', error: String(e) } : i));
    }
  }

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 600, color: '#1F2329' }}>Batch Upload</div>
        <div style={{ fontSize: 12, color: '#8F959E', marginTop: 4 }}>Create analysis jobs by dropping files below</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <label style={{ fontSize: 13, color: '#8F959E' }}>Language (optional)</label>
        <input
          style={{ border: '1px solid #EAEDF2', borderRadius: 8, padding: '6px 10px', fontSize: 14, outline: 'none' }}
          value={lang}
          onChange={e=>setLang(e.target.value)}
          placeholder="e.g. en / zh"
        />
      </div>

      <div style={{ marginTop: 12 }}>
        <FileDropzone onFiles={addFiles} />
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #EAEDF2', borderRadius: 10, marginTop: 16, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
        <table style={{ width: '100%', fontSize: 14, borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead style={{ background: '#F7F8FA', color: '#4E5969' }}>
            <tr>
              <th style={{ textAlign: 'left', padding: 10, fontWeight: 600 }}>File</th>
              <th style={{ textAlign: 'left', padding: 10, fontWeight: 600 }}>Size</th>
              <th style={{ textAlign: 'left', padding: 10, fontWeight: 600 }}>Status</th>
              <th style={{ textAlign: 'left', padding: 10, fontWeight: 600 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map(i => (
              <tr key={i.id} style={{ borderTop: '1px solid #EAEDF2' }}>
                <td style={{ padding: 10, color: '#1F2329' }}>{i.file.name}</td>
                <td style={{ padding: 10, color: '#4E5969' }}>{(i.file.size/1024).toFixed(1)} KB</td>
                <td style={{ padding: 10 }}>
                  {i.status === 'created' && i.jobId ? (
                    <Link to={`/jobs/${i.jobId}`} style={{ color: '#3370FF' }}>Created, view</Link>
                  ) : (
                    <span style={{ color: '#8F959E' }}>{i.status}</span>
                  )}
                  {i.error ? <span style={{ color: '#D92D20', marginLeft: 8 }}>{i.error}</span> : null}
                </td>
                <td style={{ padding: 10 }}>
                  {i.status === 'ready' && (
                    <button
                      style={{ padding: '6px 10px', border: '1px solid #EAEDF2', borderRadius: 8, background: '#FFFFFF', color: '#1F2329' }}
                      onClick={()=>setItems(prev=>prev.filter(x=>x.id!==i.id))}
                    >Remove</button>
                  )}
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td colSpan={4} style={{ padding: 16, color: '#8F959E' }}>No files yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button
          style={{ padding: '8px 14px', borderRadius: 8, background: '#3370FF', color: 'white', border: '1px solid #2B5FE8' }}
          onClick={start}
        >Start</button>
        <Link to="/jobs" style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #EAEDF2', background: '#FFFFFF', color: '#1F2329' }}>View jobs</Link>
      </div>
    </div>
  );
}


