import { useState, useEffect } from 'react';
import { api } from '../api/apiService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#4f7fff','#7c5fff','#2dd4a0','#ffb647'];
const fmt = (n, pre='') => n >= 1e6 ? pre+(n/1e6).toFixed(1)+'M' : n >= 1e3 ? pre+(n/1e3).toFixed(1)+'K' : pre+Number(n).toFixed(2);

export default function AnalyticsPage() {
  const [campaigns, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.getCampaigns().then(setCamps).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="loading-screen"><div className="spinner"/></div>;

  // Group by ad type
  const byType = ['SEARCH','DISPLAY','SHOPPING','VIDEO'].map(type => {
    const group = campaigns.filter(c => c.adType === type);
    const spend = group.reduce((s,c) => s+c.spent, 0);
    const rev   = group.reduce((s,c) => s+c.revenue, 0);
    const imp   = group.reduce((s,c) => s+c.impressions, 0);
    const clk   = group.reduce((s,c) => s+c.clicks, 0);
    const conv  = group.reduce((s,c) => s+c.conversions, 0);
    return { type, spend, rev, imp, clk, conv, roas: spend > 0 ? rev/spend : 0, ctr: imp > 0 ? clk/imp*100 : 0, count: group.length };
  });

  const pieData = byType.map(d => ({ name: d.type, value: Math.round(d.spend) }));

  return (
    <div className="animate-up">
      <div className="page-header"><h1>Analytics</h1><p>Performance breakdown by ad type and campaign</p></div>

      <div className="grid-2" style={{ marginBottom:24 }}>
        {/* Spend by type bar chart */}
        <div className="card">
          <h3 style={{ fontWeight:700, marginBottom:20 }}>Spend by Ad Type</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byType}>
              <XAxis dataKey="type" stroke="var(--text2)" tick={{ fontSize:12 }}/>
              <YAxis stroke="var(--text2)" tick={{ fontSize:12 }}/>
              <Tooltip formatter={v => ['$'+v.toLocaleString(),'Spend']}
                contentStyle={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8 }}/>
              <Bar dataKey="spend" radius={[6,6,0,0]}>
                {byType.map((_, i) => <Cell key={i} fill={COLORS[i]}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="card">
          <h3 style={{ fontWeight:700, marginBottom:20 }}>Budget Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                labelLine={false}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]}/>)}
              </Pie>
              <Tooltip formatter={v => ['$'+v.toLocaleString()]} contentStyle={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8 }}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ROAS comparison */}
      <div className="card" style={{ marginBottom:24 }}>
        <h3 style={{ fontWeight:700, marginBottom:20 }}>ROAS by Ad Type</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={byType}>
            <XAxis dataKey="type" stroke="var(--text2)" tick={{ fontSize:12 }}/>
            <YAxis stroke="var(--text2)" tick={{ fontSize:12 }}/>
            <Tooltip formatter={v => [v.toFixed(2)+'x','ROAS']}
              contentStyle={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8 }}/>
            <Bar dataKey="roas" radius={[6,6,0,0]}>
              {byType.map((d, i) => <Cell key={i} fill={d.roas >= 3 ? 'var(--green)' : d.roas < 2 ? 'var(--red)' : COLORS[i]}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary table */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)' }}>
          <h3 style={{ fontWeight:700 }}>Performance Summary</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>Ad Type</th><th>Campaigns</th><th>Total Spend</th>
              <th>Revenue</th><th>ROAS</th><th>Impressions</th>
              <th>Clicks</th><th>CTR</th><th>Conversions</th>
            </tr>
          </thead>
          <tbody>
            {byType.map((d,i) => (
              <tr key={d.type}>
                <td><span className="badge" style={{ background:`${COLORS[i]}20`, color:COLORS[i] }}>{d.type}</span></td>
                <td style={{ fontFamily:'var(--mono)' }}>{d.count}</td>
                <td style={{ fontFamily:'var(--mono)' }}>{fmt(d.spend,'$')}</td>
                <td style={{ fontFamily:'var(--mono)' }}>{fmt(d.rev,'$')}</td>
                <td style={{ fontFamily:'var(--mono)', color: d.roas>=3?'var(--green)':d.roas<2?'var(--red)':'var(--text)' }}>{d.roas.toFixed(2)}x</td>
                <td style={{ fontFamily:'var(--mono)' }}>{fmt(d.imp)}</td>
                <td style={{ fontFamily:'var(--mono)' }}>{fmt(d.clk)}</td>
                <td style={{ fontFamily:'var(--mono)' }}>{d.ctr.toFixed(2)}%</td>
                <td style={{ fontFamily:'var(--mono)' }}>{d.conv.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
