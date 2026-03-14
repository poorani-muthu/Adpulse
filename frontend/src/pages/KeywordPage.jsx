import { useState } from 'react';
import { Search, CheckCircle, XCircle } from 'lucide-react';

// JS port of C++ KeywordMatchEngine.cpp
const STOP = new Set(['a','an','the','and','or','but','in','on','at','to','for','of','with','by','from','is','are','was','were','be','been']);
const stem = w => {
  if (w.endsWith('sses') && w.length>4) w=w.slice(0,-2);
  else if (w.endsWith('ies') && w.length>3) w=w.slice(0,-2);
  else if (w.endsWith('s') && !w.endsWith('ss') && w.length>2) w=w.slice(0,-1);
  if (w.endsWith('ing') && w.length>3) w=w.slice(0,-3);
  else if (w.endsWith('ed') && w.length>2) w=w.slice(0,-2);
  if (w.endsWith('ation') && w.length>5) w=w.slice(0,-3)+'e';
  return w;
};
const tokenize = (text, doStem=false) =>
  text.toLowerCase().replace(/[^\w\s]/g,'').split(/\s+/)
    .filter(t => t && !STOP.has(t))
    .map(t => doStem ? stem(t) : t);

function matchKeyword(keyword, query, type) {
  const kw = tokenize(keyword), q = tokenize(query);
  const kwS = tokenize(keyword,true), qS = tokenize(query,true);
  let matched = false;

  if (type === 'EXACT') {
    matched = JSON.stringify(kw) === JSON.stringify(q);
  } else if (type === 'PHRASE') {
    if (kw.length <= q.length) {
      for (let i=0; i<=q.length-kw.length; i++) {
        if (kw.every((k,j) => k===q[i+j])) { matched=true; break; }
      }
    }
  } else { // BROAD
    const qSet = new Set(qS);
    matched = kwS.every(k => qSet.has(k));
  }

  // Jaccard relevance
  const kwSet = new Set(kwS), qSet2 = new Set(qS);
  const inter = [...kwSet].filter(k=>qSet2.has(k)).length;
  const union = new Set([...kwSet,...qSet2]).size;
  const relevance = union > 0 ? inter/union : 0;
  return { matched, relevance: (relevance*100).toFixed(1) };
}

const MATCH_TYPES = ['EXACT','PHRASE','BROAD'];
const EXAMPLES = [
  { kw:'buy running shoes', q:'buy running shoes',          type:'EXACT',  note:'Exact match — same tokens' },
  { kw:'running shoes',     q:'best buy running shoes online', type:'PHRASE', note:'Phrase found in query' },
  { kw:'running shoes',     q:'I need shoes for my morning run', type:'BROAD', note:'Stemmed tokens match' },
  { kw:'cheap flights',     q:'cheap flights deals',        type:'EXACT',  note:'Extra token — fails exact' },
];

export default function KeywordPage() {
  const [kw, setKw]     = useState('running shoes');
  const [q, setQ]       = useState('best buy running shoes online');
  const [type, setType] = useState('PHRASE');
  const [results, setResults] = useState(null);

  const run = () => {
    const single = matchKeyword(kw, q, type);
    const all = MATCH_TYPES.map(t => ({ type:t, ...matchKeyword(kw, q, t) }));
    setResults({ single, all, kwTokens: tokenize(kw,true), qTokens: tokenize(q,true) });
  };

  return (
    <div className="animate-up">
      <div className="page-header">
        <h1>Keyword Match Engine</h1>
        <p>Exact / Phrase / Broad match with Porter Stemmer — mirrors <code style={{ fontFamily:'var(--mono)', color:'var(--accent)', fontSize:13 }}>KeywordMatchEngine.cpp</code></p>
      </div>

      <div className="grid-2" style={{ marginBottom:24 }}>
        <div className="card">
          <h3 style={{ fontWeight:700, marginBottom:16 }}>Test Configuration</h3>
          <div style={{ marginBottom:14 }}>
            <label>Keyword (ad keyword)</label>
            <input value={kw} onChange={e=>setKw(e.target.value)} placeholder="running shoes"/>
          </div>
          <div style={{ marginBottom:14 }}>
            <label>Search Query (user's search)</label>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="best running shoes online"/>
          </div>
          <div style={{ marginBottom:20 }}>
            <label>Match Type</label>
            <div style={{ display:'flex', gap:8 }}>
              {MATCH_TYPES.map(t => (
                <button key={t} onClick={()=>setType(t)} style={{
                  flex:1, padding:'10px', borderRadius:8, border:'1px solid',
                  borderColor: type===t ? 'var(--accent)' : 'var(--border)',
                  background: type===t ? 'rgba(79,127,255,0.12)' : 'var(--bg3)',
                  color: type===t ? 'var(--accent)' : 'var(--text2)',
                  fontWeight:600, fontSize:13, cursor:'pointer'
                }}>{t}</button>
              ))}
            </div>
          </div>
          <button className="btn-primary" style={{ width:'100%' }} onClick={run}>Run Match</button>

          {/* Quick examples */}
          <div style={{ marginTop:20 }}>
            <label style={{ marginBottom:10 }}>Quick Examples</label>
            {EXAMPLES.map((ex,i) => (
              <button key={i} onClick={()=>{setKw(ex.kw);setQ(ex.q);setType(ex.type);}} style={{
                display:'block', width:'100%', textAlign:'left', padding:'10px 12px',
                borderRadius:8, marginBottom:6, border:'1px solid var(--border)',
                background:'var(--bg3)', cursor:'pointer'
              }}>
                <div style={{ fontSize:12, fontWeight:600, color:'var(--accent)' }}>{ex.type}</div>
                <div style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>{ex.note}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          {results && (
            <>
              {/* Main result */}
              <div className="card" style={{ marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  {results.single.matched
                    ? <CheckCircle size={24} color="var(--green)"/>
                    : <XCircle size={24} color="var(--red)"/>}
                  <div>
                    <div style={{ fontWeight:700, fontSize:16 }}>
                      {results.single.matched ? 'MATCH' : 'NO MATCH'} — {type}
                    </div>
                    <div style={{ fontSize:13, color:'var(--text2)' }}>
                      Relevance score: <span style={{ fontFamily:'var(--mono)', color:'var(--accent)' }}>{results.single.relevance}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Token viz */}
              <div className="card" style={{ marginBottom:16 }}>
                <h4 style={{ fontWeight:600, marginBottom:12, fontSize:14 }}>Tokenization (after stemming + stop-word removal)</h4>
                <div style={{ marginBottom:10 }}>
                  <div style={{ fontSize:12, color:'var(--text2)', marginBottom:6 }}>Keyword tokens:</div>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {results.kwTokens.map((t,i) => <span key={i} className="badge badge-blue">{t}</span>)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:12, color:'var(--text2)', marginBottom:6 }}>Query tokens:</div>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {results.qTokens.map((t,i) => (
                      <span key={i} className={`badge ${results.kwTokens.includes(t) ? 'badge-green' : 'badge-purple'}`}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* All match types */}
              <div className="card">
                <h4 style={{ fontWeight:600, marginBottom:12, fontSize:14 }}>All Match Types</h4>
                {results.all.map(r => (
                  <div key={r.type} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0',
                    borderBottom:'1px solid var(--border)' }}>
                    <span style={{ width:80, fontFamily:'var(--mono)', fontSize:12, fontWeight:600,
                      color:'var(--text2)' }}>{r.type}</span>
                    {r.matched ? <CheckCircle size={16} color="var(--green)"/> : <XCircle size={16} color="var(--red)"/>}
                    <span style={{ color: r.matched ? 'var(--green)' : 'var(--text2)', fontWeight:600, fontSize:13 }}>
                      {r.matched ? 'Match' : 'No match'}
                    </span>
                    <span style={{ marginLeft:'auto', fontFamily:'var(--mono)', fontSize:12, color:'var(--text2)' }}>
                      {r.relevance}% relevance
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
          {!results && (
            <div className="card" style={{ textAlign:'center', padding:60, color:'var(--text2)' }}>
              <Search size={40} style={{ margin:'0 auto 12px', opacity:0.3 }}/>
              <p>Configure a keyword and query, then run match</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
