import { useState } from 'react';
import { ShieldAlert, Shield, AlertTriangle } from 'lucide-react';

// JS simulation of C++ ClickFraudDetector.cpp
function detectFraud(events) {
  if (!events.length) return { fraudScore:0, isFraud:false, reason:'No events' };
  const mean = arr => arr.reduce((s,x)=>s+x,0)/arr.length;
  const std  = arr => { const m=mean(arr); return Math.sqrt(arr.map(x=>(x-m)**2).reduce((s,x)=>s+x,0)/(arr.length-1||1)); };

  // 1. Velocity Z-score
  const buckets = {};
  events.forEach(e => { const b = Math.floor(e.ts/60000); buckets[b]=(buckets[b]||0)+1; });
  const rates = Object.values(buckets);
  const maxRate = Math.max(...rates);
  const rMean = mean(rates), rStd = std(rates);
  const velZ = rStd > 0 ? (maxRate-rMean)/rStd : 0;

  // 2. IP repetition
  const ipCounts = {};
  events.forEach(e => ipCounts[e.ip]=(ipCounts[e.ip]||0)+1);
  const maxIp = Math.max(...Object.values(ipCounts));
  const ipScore = maxIp / events.length;

  // 3. Geo stddev
  const lats = events.map(e=>e.lat), lons = events.map(e=>e.lon);
  const geoSd = (std(lats)+std(lons))/2;
  const geoScore = geoSd < 0.01 ? 1.0 : Math.max(0, 1-geoSd/10);

  // 4. Bot CV (inter-click regularity)
  const ts = events.map(e=>e.ts).sort((a,b)=>a-b);
  const intervals = ts.slice(1).map((t,i)=>t-ts[i]);
  const ivMean = intervals.length ? mean(intervals) : 1;
  const ivStd  = intervals.length > 1 ? std(intervals) : 0;
  const cv = ivMean > 0 ? ivStd/ivMean : 1;
  const botScore = Math.max(0, 1-cv);

  const score = Math.min(0.3*Math.min(velZ/3,1) + 0.3*ipScore + 0.2*geoScore + 0.2*botScore, 1);
  const reasons = [];
  if (velZ > 2.5)     reasons.push('High click velocity');
  if (ipScore > 0.5)  reasons.push('IP repetition detected');
  if (geoScore > 0.8) reasons.push('Geographic clustering');
  if (botScore > 0.7) reasons.push('Regular inter-click timing (bot-like)');
  return { fraudScore: score, isFraud: score > 0.65, velZ, ipScore, geoScore, botScore,
    reason: reasons.join('; ') || 'No anomalies detected' };
}

// Generate click events
function genEvents(type) {
  if (type === 'legit') return Array.from({length:20},(_,i)=>({
    ts: i*65000 + Math.round(Math.random()*30000),
    ip: `192.168.${i%10}.${Math.floor(Math.random()*255)}`,
    lat: 37+i*0.5+Math.random()*0.3, lon: -122+i*0.3+Math.random()*0.3
  }));
  if (type === 'bot') return Array.from({length:50},(_,i)=>({ ts:i*1000, ip:'10.0.0.1', lat:37.422, lon:-122.084 }));
  if (type === 'mixed') return Array.from({length:30},(_,i)=>({
    ts: i*3000+Math.round(Math.random()*500),
    ip: i < 20 ? '10.0.0.5' : `192.168.${i}.1`,
    lat: 37.4+Math.random()*0.05, lon: -122.1+Math.random()*0.05
  }));
  return [];
}

const ScoreBar = ({ label, value, color }) => (
  <div style={{ marginBottom:12 }}>
    <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:4 }}>
      <span style={{ color:'var(--text2)' }}>{label}</span>
      <span style={{ fontFamily:'var(--mono)', fontWeight:600 }}>{(value*100).toFixed(1)}%</span>
    </div>
    <div style={{ height:8, background:'var(--bg3)', borderRadius:4 }}>
      <div style={{ width:`${value*100}%`, height:'100%', background:color, borderRadius:4, transition:'width 0.4s ease' }}/>
    </div>
  </div>
);

export default function FraudPage() {
  const [events, setEvents] = useState([]);
  const [result, setResult] = useState(null);
  const [preset, setPreset] = useState('');

  const load = (type) => { setPreset(type); const e=genEvents(type); setEvents(e); setResult(detectFraud(e)); };
  const run = () => setResult(detectFraud(events));

  const scoreColor = s => s > 0.65 ? 'var(--red)' : s > 0.35 ? 'var(--yellow)' : 'var(--green)';

  return (
    <div className="animate-up">
      <div className="page-header">
        <h1>Click Fraud Detector</h1>
        <p>Z-score velocity + IP repetition + geo stddev + bot CV — mirrors <code style={{ fontFamily:'var(--mono)', color:'var(--accent)', fontSize:13 }}>ClickFraudDetector.cpp</code></p>
      </div>

      <div className="grid-2" style={{ marginBottom:24 }}>
        <div className="card">
          <h3 style={{ fontWeight:700, marginBottom:16 }}>Load Test Dataset</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
            {[
              { k:'legit', label:'Legitimate Traffic', desc:'20 clicks, varied IPs, natural geo spread, organic timing' },
              { k:'bot',   label:'Bot Traffic',        desc:'50 clicks, single IP, same location, 1s perfect intervals' },
              { k:'mixed', label:'Mixed (Suspicious)', desc:'30 clicks, mostly one IP, tight geo cluster, slightly regular' },
            ].map(p => (
              <button key={p.k} onClick={() => load(p.k)} style={{
                textAlign:'left', padding:'14px 16px', borderRadius:10, border:'1px solid',
                borderColor: preset===p.k ? 'var(--accent)' : 'var(--border)',
                background: preset===p.k ? 'rgba(79,127,255,0.08)' : 'var(--bg3)',
                cursor:'pointer', transition:'all 0.15s'
              }}>
                <div style={{ fontWeight:600, color: preset===p.k ? 'var(--accent)' : 'var(--text)' }}>{p.label}</div>
                <div style={{ fontSize:12, color:'var(--text2)', marginTop:3 }}>{p.desc}</div>
              </button>
            ))}
          </div>
          {events.length > 0 && (
            <div style={{ fontSize:13, color:'var(--text2)', marginBottom:12 }}>
              Loaded <strong style={{ color:'var(--text)' }}>{events.length}</strong> click events
            </div>
          )}
          <button className="btn-primary" style={{ width:'100%' }} disabled={!events.length} onClick={run}>
            Analyze for Fraud
          </button>
        </div>

        <div className="card">
          <h3 style={{ fontWeight:700, marginBottom:16 }}>Detection Result</h3>
          {!result ? (
            <div style={{ textAlign:'center', color:'var(--text2)', paddingTop:40 }}>
              <ShieldAlert size={40} style={{ margin:'0 auto 12px', opacity:0.3 }}/>
              <p>Load a dataset and run analysis</p>
            </div>
          ) : (
            <>
              {/* Verdict */}
              <div style={{ display:'flex', alignItems:'center', gap:16, padding:'20px',
                background: result.isFraud ? 'rgba(255,94,122,0.08)' : 'rgba(45,212,160,0.08)',
                border:`1px solid ${result.isFraud ? 'rgba(255,94,122,0.25)' : 'rgba(45,212,160,0.25)'}`,
                borderRadius:12, marginBottom:20 }}>
                {result.isFraud ? <AlertTriangle size={28} color="var(--red)"/> : <Shield size={28} color="var(--green)"/>}
                <div>
                  <div style={{ fontWeight:700, fontSize:18, color: result.isFraud ? 'var(--red)' : 'var(--green)' }}>
                    {result.isFraud ? 'FRAUD DETECTED' : 'TRAFFIC LEGITIMATE'}
                  </div>
                  <div style={{ fontSize:13, color:'var(--text2)', marginTop:2 }}>{result.reason}</div>
                </div>
                <div style={{ marginLeft:'auto', textAlign:'center' }}>
                  <div style={{ fontSize:32, fontWeight:800, fontFamily:'var(--mono)', color:scoreColor(result.fraudScore) }}>
                    {(result.fraudScore*100).toFixed(0)}
                  </div>
                  <div style={{ fontSize:11, color:'var(--text2)' }}>FRAUD SCORE</div>
                </div>
              </div>

              {/* Score breakdown */}
              <ScoreBar label="Velocity Z-score"     value={Math.min(result.velZ/3,1)}  color="var(--accent)"/>
              <ScoreBar label="IP Repetition"        value={result.ipScore}              color="var(--accent2)"/>
              <ScoreBar label="Geographic Cluster"   value={result.geoScore}             color="var(--yellow)"/>
              <ScoreBar label="Bot Timing (1-CV)"    value={result.botScore}             color="var(--red)"/>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
