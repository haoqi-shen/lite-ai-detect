import { useEffect, useState } from 'react';
import { getDashboard } from '../services/jobs';
import type { DashboardMetrics } from '../types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

export default function DashboardPage() {
  const [m, setM] = useState<DashboardMetrics | null>(null);
  async function load(){ setM(await getDashboard()); }
  useEffect(()=>{ load(); const t = setInterval(load, 5000); return ()=>clearInterval(t); }, []);

  if (!m) return <div style={{ padding: 24 }}>Loading…</div>;
  return (
    <div style={{ maxWidth: 1152, margin: '24px auto', padding: 24 }}>
      <h1 style={{ fontSize: 20, fontWeight: 600 }}>Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginTop: 12 }}>
        <KPI title="Total jobs" value={m.totals.all} />
        <KPI title="Done rate" value={m.totals.all ? Math.round(m.totals.done*100/m.totals.all) + '%' : '-'} />
        <KPI title="Error rate" value={m.totals.all ? Math.round(m.totals.error*100/m.totals.all) + '%' : '-'} />
        <KPI title="P95 latency" value={`${m.latency.p95_ms} ms`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 16 }}>
        <Card title="Daily trend">
          <ChartWrap>
            <LineChart data={m.timeseries}><XAxis dataKey="date"/><YAxis/><Tooltip/><Line type="monotone" dataKey="total"/></LineChart>
          </ChartWrap>
        </Card>
        <Card title="Languages">
          <ChartWrap>
            <BarChart data={m.languages}><XAxis dataKey="lang"/><YAxis/><Tooltip/><Bar dataKey="count"/></BarChart>
          </ChartWrap>
        </Card>
        <Card title="Labels">
          <ChartWrap>
            <PieChart>
              <Pie data={m.labels} dataKey="count" nameKey="label" outerRadius={90} label>
                {m.labels.map((_, i)=><Cell key={i} />)}
              </Pie>
              <Tooltip/>
            </PieChart>
          </ChartWrap>
        </Card>
        <Card title="Model versions">
          <ChartWrap>
            <BarChart data={m.versions}><XAxis dataKey="model_version"/><YAxis/><Tooltip/><Bar dataKey="count"/></BarChart>
          </ChartWrap>
        </Card>
      </div>
    </div>
  );
}

function KPI({ title, value }: { title: string; value: number | string }) {
  return <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}><div style={{ color: '#6b7280', fontSize: 14 }}>{title}</div><div style={{ fontSize: 20, fontWeight: 600 }}>{value}</div></div>;
}
function Card({ title, children }: any) {
  return <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}><div style={{ fontWeight: 600, marginBottom: 8 }}>{title}</div>{children}</div>;
}
function ChartWrap({ children }: any) {
  return <div style={{ width: '100%', height: 260 }}><ResponsiveContainer>{children}</ResponsiveContainer></div>;
}


