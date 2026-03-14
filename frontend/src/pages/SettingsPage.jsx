import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings, Bell, Shield, Database } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [cfg, setCfg] = useState({
    roasThreshold: 2.0,
    spendAlertPct: 90,
    emailAlerts: true,
    fraudAlerts: true,
    autoOptimize: false,
    darkMode: true,
    refreshInterval: 30,
  });
  const set = (k,v) => setCfg(c=>({...c,[k]:v}));

  const save = () => { setSaved(true); setTimeout(()=>setSaved(false), 2000); };

  const Toggle = ({ k, label, desc }) => (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 0', borderBottom:'1px solid var(--border)' }}>
      <div>
        <div style={{ fontWeight:500 }}>{label}</div>
        {desc && <div style={{ fontSize:13, color:'var(--text2)', marginTop:2 }}>{desc}</div>}
      </div>
      <button onClick={()=>set(k,!cfg[k])} style={{
        width:46, height:26, borderRadius:13, border:'none', cursor:'pointer',
        background: cfg[k] ? 'var(--accent)' : 'var(--bg3)',
        position:'relative', transition:'background 0.2s',
      }}>
        <div style={{
          width:20, height:20, borderRadius:'50%', background:'#fff',
          position:'absolute', top:3, transition:'left 0.2s',
          left: cfg[k] ? 22 : 3,
        }}/>
      </button>
    </div>
  );

  const Slider = ({ k, label, min, max, step=1, suffix='' }) => (
    <div style={{ padding:'14px 0', borderBottom:'1px solid var(--border)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
        <span style={{ fontWeight:500 }}>{label}</span>
        <span style={{ fontFamily:'var(--mono)', color:'var(--accent)', fontWeight:600 }}>{cfg[k]}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={cfg[k]}
        onChange={e=>set(k,+e.target.value)}
        style={{ padding:0, height:4, accentColor:'var(--accent)' }}/>
    </div>
  );

  return (
    <div className="animate-up">
      <div className="page-header"><h1>Settings</h1><p>Configure alerts, thresholds, and account preferences</p></div>

      <div className="grid-2">
        <div>
          <div className="card" style={{ marginBottom:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
              <Bell size={18} color="var(--accent)"/>
              <h3 style={{ fontWeight:700 }}>Alert Thresholds</h3>
            </div>
            <Slider k="roasThreshold" label="ROAS Anomaly Threshold" min={0.5} max={5} step={0.5} suffix="x"/>
            <Slider k="spendAlertPct" label="Budget Spend Alert" min={50} max={100} suffix="%"/>
            <Slider k="refreshInterval" label="Dashboard Refresh" min={10} max={300} step={10} suffix="s"/>
          </div>

          <div className="card">
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
              <Bell size={18} color="var(--accent)"/>
              <h3 style={{ fontWeight:700 }}>Notifications</h3>
            </div>
            <Toggle k="emailAlerts" label="Email Alerts" desc="Receive alerts for anomalies and budget warnings"/>
            <Toggle k="fraudAlerts" label="Fraud Detection Alerts" desc="Get notified when fraud score exceeds 0.65"/>
            <Toggle k="autoOptimize" label="Auto-Optimizer" desc="Automatically apply budget reallocation recommendations"/>
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
              <Shield size={18} color="var(--accent)"/>
              <h3 style={{ fontWeight:700 }}>Account</h3>
            </div>
            <div style={{ padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
              <div style={{ fontSize:12, color:'var(--text2)', marginBottom:4 }}>Username</div>
              <div style={{ fontWeight:600 }}>{user?.username}</div>
            </div>
            <div style={{ padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
              <div style={{ fontSize:12, color:'var(--text2)', marginBottom:4 }}>Role</div>
              <span className={`badge ${user?.role==='ADMIN'?'badge-blue':'badge-purple'}`}>{user?.role}</span>
            </div>
            <div style={{ padding:'12px 0' }}>
              <div style={{ fontSize:12, color:'var(--text2)', marginBottom:4 }}>API Backend</div>
              <div style={{ fontFamily:'var(--mono)', fontSize:13, color:'var(--accent)' }}>
                {import.meta.env.VITE_API_URL || '/api'} (Spring Boot)
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
              <Database size={18} color="var(--accent)"/>
              <h3 style={{ fontWeight:700 }}>C++ Engine Status</h3>
            </div>
            {[
              { name:'ABTestEngine.cpp', desc:'Welch\'s t-test, Lanczos gamma, Lentz CF', status:'Compiled' },
              { name:'KeywordMatchEngine.cpp', desc:'Porter Stemmer, Exact/Phrase/Broad', status:'Compiled' },
              { name:'ClickFraudDetector.cpp', desc:'Z-score velocity, IP rep, geo stddev', status:'Compiled' },
            ].map(e => (
              <div key={e.name} style={{ padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <div style={{ fontFamily:'var(--mono)', fontSize:13, fontWeight:600 }}>{e.name}</div>
                    <div style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>{e.desc}</div>
                  </div>
                  <span className="badge badge-green">{e.status}</span>
                </div>
              </div>
            ))}
            <div style={{ fontSize:12, color:'var(--text2)', marginTop:12, padding:'10px 12px',
              background:'var(--bg3)', borderRadius:8 }}>
              WASM build: <code style={{ fontFamily:'var(--mono)', color:'var(--accent)' }}>cd cpp && bash build_wasm.sh</code>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop:24, display:'flex', justifyContent:'flex-end', gap:10 }}>
        <button className="btn-ghost">Reset to Defaults</button>
        <button className="btn-primary" onClick={save} style={{ minWidth:140 }}>
          {saved ? '✓ Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
