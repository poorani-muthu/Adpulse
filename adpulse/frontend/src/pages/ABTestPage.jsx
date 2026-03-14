import { useState } from 'react';
import { FlaskConical, CheckCircle, XCircle } from 'lucide-react';

// Simulates the C++ ABTestEngine (Welch's t-test + Lanczos gamma + Lentz continued fraction)
function runABTest(nA, convA, nB, convB) {
  if (nA === 0 || nB === 0) throw new Error('Sample sizes must be > 0');
  const rA = convA / nA, rB = convB / nB;
  const vA = rA * (1 - rA) / nA, vB = rB * (1 - rB) / nB;
  const se = Math.sqrt(vA + vB);
  if (se === 0) return { tStat:0, pValue:1, significant:false, lift:0, winner:'No winner', ciLower:0, ciUpper:0 };

  const t = (rB - rA) / se;
  // Welch-Satterthwaite df
  const df = Math.pow(vA + vB, 2) / (Math.pow(vA, 2)/(nA-1) + Math.pow(vB, 2)/(nB-1));

  // Approximate p-value via incomplete beta (JS approximation)
  const x = df / (df + t*t);
  const pValue = incompleteBeta(df/2, 0.5, x);

  const lift = rA > 0 ? (rB - rA) / rA * 100 : 0;
  const z95 = 1.96;
  return {
    tStat: t.toFixed(4),
    pValue: pValue.toFixed(4),
    significant: pValue < 0.05,
    lift: lift.toFixed(2),
    winner: pValue < 0.05 ? (rB > rA ? 'Variant B' : 'Control A') : 'No winner yet',
    ciLower: ((rB - rA) - z95 * se).toFixed(4),
    ciUpper: ((rB - rA) + z95 * se).toFixed(4),
    rateA: (rA*100).toFixed(2), rateB: (rB*100).toFixed(2),
    powerNote: nA < 1000 || nB < 1000 ? 'Low sample size — results may be unreliable' : null
  };
}

// JS port of regularized incomplete beta via continued fraction
function incompleteBeta(a, b, x) {
  if (x <= 0) return 0; if (x >= 1) return 1;
  const lbeta = lgamma(a) + lgamma(b) - lgamma(a+b);
  const front = Math.exp(Math.log(x)*a + Math.log(1-x)*b - lbeta) / a;
  return x < (a+1)/(a+b+2) ? front * betacf(a, b, x) : 1 - front * betacf(b, a, 1-x);
}
function lgamma(z) {
  const c = [76.18009172947146,-86.50532032941677,24.01409824083091,-1.231739572450155,0.1208650973866179e-2,-0.5395239384953e-5];
  let x = z, y = z, tmp = x+5.5;
  tmp -= (x+0.5)*Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j=0;j<6;j++) { y++; ser += c[j]/y; }
  return -tmp + Math.log(2.5066282746310005*ser/x);
}
function betacf(a, b, x) {
  let c=1, d=1-((a+b)*x/(a+1)); if(Math.abs(d)<1e-30) d=1e-30; d=1/d; let h=d;
  for(let m=1;m<=200;m++){
    let m2=2*m;
    let aa=m*(b-m)*x/((a+m2-1)*(a+m2)); d=1+aa*d; if(Math.abs(d)<1e-30)d=1e-30;
    let cc=1+aa/c; if(Math.abs(cc)<1e-30)cc=1e-30; d=1/d; h*=d*cc;
    aa=-(a+m)*(a+b+m)*x/((a+m2)*(a+m2+1));
    d=1+aa*d; if(Math.abs(d)<1e-30)d=1e-30;
    cc=1+aa/c; if(Math.abs(cc)<1e-30)cc=1e-30;
    d=1/d; let del=d*cc; h*=del;
    if(Math.abs(del-1)<3e-7) break;
  }
  return h;
}

const PRESETS = [
  { label:'Significant (B wins)', nA:10000, convA:500,  nB:10000, convB:650 },
  { label:'Not significant',       nA:1000,  convA:100,  nB:1000,  convB:102 },
  { label:'A wins',                nA:8000,  convA:640,  nB:8000,  convB:480 },
];

export default function ABTestPage() {
  const [form, setForm] = useState({ nA:10000, convA:500, nB:10000, convB:650 });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const set = (k,v) => setForm(f => ({ ...f, [k]: +v }));

  const run = () => {
    try { setError(''); setResult(runABTest(form.nA, form.convA, form.nB, form.convB)); }
    catch(e) { setError(e.message); }
  };

  return (
    <div className="animate-up">
      <div className="page-header">
        <h1>A/B Test Engine</h1>
        <p>Welch's t-test with Lanczos gamma approximation — mirrors the C++ <code style={{ fontFamily:'var(--mono)', color:'var(--accent)', fontSize:13 }}>ABTestEngine.cpp</code></p>
      </div>

      <div className="grid-2" style={{ marginBottom:24 }}>
        <div className="card">
          <h3 style={{ fontWeight:700, marginBottom:16 }}>Input Parameters</h3>

          {/* Presets */}
          <div style={{ marginBottom:16 }}>
            <label>Quick Presets</label>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {PRESETS.map(p => (
                <button key={p.label} className="btn-ghost" style={{ fontSize:12, padding:'6px 12px' }}
                  onClick={() => setForm({ nA:p.nA, convA:p.convA, nB:p.nB, convB:p.convB })}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background:'rgba(79,127,255,0.06)', border:'1px solid rgba(79,127,255,0.2)', borderRadius:10, padding:16, marginBottom:16 }}>
            <div style={{ fontWeight:600, marginBottom:12, color:'var(--accent)' }}>Control Group (A)</div>
            <div className="grid-2">
              <div><label>Visitors (n_A)</label><input type="number" value={form.nA} onChange={e=>set('nA',e.target.value)} min={1}/></div>
              <div><label>Conversions</label><input type="number" value={form.convA} onChange={e=>set('convA',e.target.value)} min={0}/></div>
            </div>
          </div>

          <div style={{ background:'rgba(45,212,160,0.06)', border:'1px solid rgba(45,212,160,0.2)', borderRadius:10, padding:16, marginBottom:16 }}>
            <div style={{ fontWeight:600, marginBottom:12, color:'var(--green)' }}>Variant Group (B)</div>
            <div className="grid-2">
              <div><label>Visitors (n_B)</label><input type="number" value={form.nB} onChange={e=>set('nB',e.target.value)} min={1}/></div>
              <div><label>Conversions</label><input type="number" value={form.convB} onChange={e=>set('convB',e.target.value)} min={0}/></div>
            </div>
          </div>

          {error && <div style={{ color:'var(--red)', fontSize:13, marginBottom:12 }}>{error}</div>}
          <button className="btn-primary" style={{ width:'100%', padding:12 }} onClick={run}>
            Run Statistical Test
          </button>
        </div>

        {/* Results */}
        <div className="card">
          <h3 style={{ fontWeight:700, marginBottom:16 }}>Results</h3>
          {!result ? (
            <div style={{ color:'var(--text2)', textAlign:'center', paddingTop:40 }}>
              <FlaskConical size={40} style={{ margin:'0 auto 12px', opacity:0.3 }}/>
              <p>Configure parameters and run the test</p>
            </div>
          ) : (
            <div>
              {/* Verdict */}
              <div style={{ display:'flex', alignItems:'center', gap:12, padding:'16px 20px',
                background: result.significant ? 'rgba(45,212,160,0.08)' : 'rgba(139,144,164,0.08)',
                border: `1px solid ${result.significant ? 'rgba(45,212,160,0.25)' : 'var(--border)'}`,
                borderRadius:10, marginBottom:20 }}>
                {result.significant
                  ? <CheckCircle size={22} color="var(--green)"/>
                  : <XCircle size={22} color="var(--text2)"/>}
                <div>
                  <div style={{ fontWeight:700, fontSize:16, color: result.significant ? 'var(--green)' : 'var(--text)' }}>
                    {result.significant ? 'Statistically Significant' : 'Not Significant'} — {result.winner}
                  </div>
                  <div style={{ fontSize:13, color:'var(--text2)' }}>p = {result.pValue} (threshold: 0.05)</div>
                </div>
              </div>

              {result.powerNote && (
                <div style={{ padding:'10px 14px', background:'rgba(255,182,71,0.08)', border:'1px solid rgba(255,182,71,0.25)', borderRadius:8, fontSize:13, color:'var(--yellow)', marginBottom:16 }}>
                  ⚠ {result.powerNote}
                </div>
              )}

              <div className="grid-2" style={{ gap:12 }}>
                {[
                  { label:'Conversion Rate A', value:`${result.rateA}%`, color:'var(--accent)' },
                  { label:'Conversion Rate B', value:`${result.rateB}%`, color:'var(--green)' },
                  { label:'Lift (B vs A)',      value:`${result.lift > 0 ? '+' : ''}${result.lift}%`, color: result.lift > 0 ? 'var(--green)' : 'var(--red)' },
                  { label:'t-Statistic',        value:result.tStat, color:'var(--text)' },
                  { label:'p-Value',            value:result.pValue, color: result.significant ? 'var(--green)' : 'var(--text2)' },
                  { label:'95% CI',             value:`[${result.ciLower}, ${result.ciUpper}]`, color:'var(--text2)' },
                ].map(s => (
                  <div key={s.label} style={{ background:'var(--bg3)', borderRadius:8, padding:'12px 14px' }}>
                    <div style={{ fontSize:11, color:'var(--text2)', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.label}</div>
                    <div style={{ fontFamily:'var(--mono)', fontWeight:600, color:s.color, fontSize:15 }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
