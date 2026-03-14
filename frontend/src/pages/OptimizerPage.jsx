import { useState, useEffect } from 'react';
import { api } from '../api/apiService';
import { Zap, TrendingUp, ArrowRight } from 'lucide-react';

const fmt = (n, pre='') => n >= 1e6 ? pre+(n/1e6).toFixed(1)+'M' : n >= 1e3 ? pre+(n/1e3).toFixed(1)+'K' : pre+Number(n).toFixed(0);

export default function OptimizerPage() {
  const [campaigns, setCamps]   = useState([]);
  const [optimized, setOpt]     = useState([]);
  const [totalBudget, setTotal] = useState(50000);
  const [loading, setLoading]   = useState(true);
  const [allocated, setAlloc]   = useState([]);

  useEffect(() => {
    Promise.all([api.getCampaigns(), api.getOptimized()])
      .then(([all, opt]) => { setCamps(all); setOpt(opt); })
      .finally(() => setLoading(false));
  }, []);

  // Greedy allocation: distribute budget proportional to ROAS score
  useEffect(() => {
    if (!optimized.length) return;
    const active = optimized.filter(c => c.status === 'ACTIVE' && c.roas > 0);
    const totalRoas = active.reduce((s,c) => s+c.roas, 0);
    const result = active.map(c => ({
      ...c,
      suggestedBudget: Math.round((c.roas / totalRoas) * totalBudget),
      currentBudget: c.budget,
      delta: Math.round((c.roas / totalRoas) * totalBudget) - c.budget,
      projectedRevenue: Math.round((c.roas / totalRoas) * totalBudget * c.roas),
    }));
    setAlloc(result);
  }, [optimized, totalBudget]);

  if (loading) return <div className="loading-screen"><div className="spinner"/></div>;

  const currentRev  = campaigns.reduce((s,c) => s+c.revenue, 0);
  const projRev     = allocated.reduce((s,c) => s+c.projectedRevenue, 0);
  const currentSpend = campaigns.reduce((s,c) => s+c.spent, 0);

  return (
    <div className="animate-up">
      <div className="page-header">
        <h1>Budget Optimizer</h1>
        <p>Greedy algorithm — reallocates budget proportional to ROAS to maximise return</p>
      </div>

      {/* Controls */}
      <div className="card" style={{ marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:24, flexWrap:'wrap' }}>
          <div style={{ flex:1, minWidth:240 }}>
            <label>Total Budget to Allocate ($)</label>
            <input type="number" value={totalBudget} onChange={e => setTotal(+e.target.value)} min={1000} step={1000}/>
          </div>
          <div className="grid-3" style={{ flex:3, minWidth:300 }}>
            {[
              { label:'Current Spend', value:`$${fmt(currentSpend)}`, color:'var(--text2)' },
              { label:'Current Revenue', value:`$${fmt(currentRev)}`, color:'var(--text)' },
              { label:'Projected Revenue', value:`$${fmt(projRev)}`, color:'var(--green)' },
            ].map(s => (
              <div key={s.label} style={{ textAlign:'center' }}>
                <div style={{ fontSize:12, color:'var(--text2)', marginBottom:4 }}>{s.label}</div>
                <div style={{ fontSize:22, fontWeight:700, color:s.color, fontFamily:'var(--mono)' }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lift banner */}
      {projRev > currentRev && (
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 20px',
          background:'rgba(45,212,160,0.08)', border:'1px solid rgba(45,212,160,0.25)',
          borderRadius:10, marginBottom:24 }}>
          <Zap size={18} color="var(--green)"/>
          <span style={{ fontWeight:600, color:'var(--green)' }}>
            Projected revenue lift: +${fmt(projRev - currentRev)} (+{((projRev/currentRev-1)*100).toFixed(1)}%)
          </span>
          <span style={{ color:'var(--text2)', fontSize:13 }}>by reallocating budget to high-ROAS campaigns</span>
        </div>
      )}

      {/* Allocation table */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10 }}>
          <TrendingUp size={18} color="var(--accent)"/>
          <h3 style={{ fontWeight:700 }}>Recommended Allocation (ranked by ROAS)</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>Rank</th><th>Campaign</th><th>Type</th>
              <th>ROAS</th><th>Current Budget</th>
              <th>Suggested Budget</th><th>Change</th><th>Proj. Revenue</th>
            </tr>
          </thead>
          <tbody>
            {allocated.map((c, i) => (
              <tr key={c.id}>
                <td>
                  <div style={{ width:28, height:28, borderRadius:8,
                    background: i < 3 ? 'rgba(79,127,255,0.15)' : 'var(--bg3)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontWeight:700, fontSize:13, color: i < 3 ? 'var(--accent)' : 'var(--text2)' }}>
                    {i+1}
                  </div>
                </td>
                <td><div style={{ fontWeight:600 }}>{c.name}</div></td>
                <td><span className="badge badge-blue">{c.adType}</span></td>
                <td style={{ fontFamily:'var(--mono)', fontWeight:700, color:'var(--green)' }}>{c.roas.toFixed(2)}x</td>
                <td style={{ fontFamily:'var(--mono)' }}>${c.currentBudget?.toLocaleString()}</td>
                <td style={{ fontFamily:'var(--mono)', fontWeight:600 }}>${c.suggestedBudget?.toLocaleString()}</td>
                <td style={{ fontFamily:'var(--mono)' }}>
                  <span style={{ color: c.delta > 0 ? 'var(--green)' : c.delta < 0 ? 'var(--red)' : 'var(--text2)', fontWeight:600 }}>
                    {c.delta > 0 ? '+' : ''}{c.delta?.toLocaleString()}
                  </span>
                </td>
                <td style={{ fontFamily:'var(--mono)', color:'var(--green)' }}>${c.projectedRevenue?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop:16, padding:14, background:'var(--bg2)', borderRadius:10, border:'1px solid var(--border)', fontSize:13, color:'var(--text2)' }}>
        <strong style={{ color:'var(--text)' }}>Algorithm:</strong> Greedy allocation proportional to ROAS score.
        Each campaign receives <code style={{ fontFamily:'var(--mono)', color:'var(--accent)' }}>budget × (campaign_ROAS / Σ ROAS)</code>.
        Equivalent to the C++ <code style={{ fontFamily:'var(--mono)', color:'var(--accent)' }}>BidEngine</code> pacing multiplier logic compiled to WASM.
      </div>
    </div>
  );
}
