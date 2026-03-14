import { useState, useEffect } from 'react';
import { api } from '../api/apiService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Eye, MousePointer, ShoppingCart, DollarSign, AlertTriangle } from 'lucide-react';

const fmt = (n, prefix = '') => {
  if (n == null) return '—';
  if (n >= 1e6) return prefix + (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return prefix + (n / 1e3).toFixed(1) + 'K';
  return prefix + Number(n).toFixed(n % 1 === 0 ? 0 : 2);
};

const TREND = Array.from({ length: 7 }, (_, i) => ({
  day: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i],
  spend:   Math.round(3000 + Math.random() * 4000),
  clicks:  Math.round(5000 + Math.random() * 8000),
  conv:    Math.round(100  + Math.random() * 300),
}));

export default function DashboardPage() {
  const [stats, setStats]     = useState(null);
  const [campaigns, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric]   = useState('spend');

  useEffect(() => {
    Promise.all([api.getDashboard(), api.getCampaigns()])
      .then(([s, c]) => { setStats(s); setCamps(c); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const anomalies = campaigns.filter(c => c.status === 'ACTIVE' && c.roas < 2 && c.spent > 0);
  const topCamps  = [...campaigns].sort((a,b) => b.roas - a.roas).slice(0, 5);

  const CARDS = [
    { label: 'Total Spend',       value: fmt(stats?.totalSpend, '$'),       icon: DollarSign,   color: 'var(--accent)' },
    { label: 'Impressions',       value: fmt(stats?.totalImpressions),      icon: Eye,          color: 'var(--accent2)' },
    { label: 'Clicks',            value: fmt(stats?.totalClicks),           icon: MousePointer, color: 'var(--green)' },
    { label: 'Conversions',       value: fmt(stats?.totalConversions),      icon: ShoppingCart, color: 'var(--yellow)' },
    { label: 'Total Revenue',     value: fmt(stats?.totalRevenue, '$'),     icon: TrendingUp,   color: 'var(--green)' },
    { label: 'Overall ROAS',      value: (stats?.overallRoas || 0).toFixed(2) + 'x', icon: TrendingUp, color: 'var(--accent)' },
    { label: 'CTR',               value: (stats?.overallCtr || 0).toFixed(2) + '%', icon: MousePointer, color: 'var(--accent2)' },
    { label: 'Active Campaigns',  value: stats?.activeCampaigns || 0,      icon: TrendingUp,   color: 'var(--yellow)' },
  ];

  return (
    <div className="animate-up">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Real-time overview of your ad campaign performance</p>
      </div>

      {/* Anomaly Alert */}
      {anomalies.length > 0 && (
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 20px',
          background:'rgba(255,94,122,0.08)', border:'1px solid rgba(255,94,122,0.25)',
          borderRadius:10, marginBottom:24, color:'var(--red)' }}>
          <AlertTriangle size={18} />
          <span style={{ fontWeight:600 }}>{anomalies.length} campaign{anomalies.length > 1 ? 's' : ''} flagged</span>
          <span style={{ color:'var(--text2)', fontSize:13 }}>— ROAS below 2.0x threshold: {anomalies.map(c=>c.name).join(', ')}</span>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid-4" style={{ marginBottom:24 }}>
        {CARDS.map(card => (
          <div key={card.label} className="stat-card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div className="label">{card.label}</div>
              <div style={{ padding:8, borderRadius:8, background:`${card.color}18` }}>
                <card.icon size={16} color={card.color} />
              </div>
            </div>
            <div className="value" style={{ color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom:24 }}>
        {/* Trend Chart */}
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <h3 style={{ fontWeight:700 }}>Weekly Trend</h3>
            <div style={{ display:'flex', gap:6 }}>
              {['spend','clicks','conv'].map(m => (
                <button key={m} onClick={() => setMetric(m)}
                  style={{ padding:'4px 12px', borderRadius:6, fontSize:12, fontWeight:600,
                    background: metric === m ? 'var(--accent)' : 'var(--bg3)',
                    color: metric === m ? '#fff' : 'var(--text2)', border:'none', cursor:'pointer' }}>
                  {m === 'conv' ? 'Conversions' : m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={TREND}>
              <XAxis dataKey="day" stroke="var(--text2)" tick={{ fontSize:12 }} />
              <YAxis stroke="var(--text2)" tick={{ fontSize:12 }} />
              <Tooltip contentStyle={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8 }} />
              <Bar dataKey={metric} fill="var(--accent)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Campaigns */}
        <div className="card">
          <h3 style={{ fontWeight:700, marginBottom:16 }}>Top Campaigns by ROAS</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {topCamps.map((c, i) => (
              <div key={c.id} style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:24, height:24, borderRadius:6, background:'var(--bg3)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:12, fontWeight:700, color:'var(--text2)' }}>{i+1}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:600 }}>{c.name}</div>
                  <div style={{ fontSize:12, color:'var(--text2)' }}>{c.adType}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontWeight:700, color:'var(--green)' }}>{c.roas.toFixed(2)}x</div>
                  <div style={{ fontSize:12, color:'var(--text2)' }}>{fmt(c.spent,'$')} spent</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
