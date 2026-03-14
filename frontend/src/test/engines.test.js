// src/test/engines.test.js
// Vitest tests for JS-simulated C++ engines (mirrors engine_tests.cpp)
import { describe, it, expect } from 'vitest';

// ----- ABTestEngine (JS port) -----
function lgamma(z) {
  const c=[76.18009172947146,-86.50532032941677,24.01409824083091,-1.231739572450155,0.1208650973866179e-2,-0.5395239384953e-5];
  let x=z,y=z,tmp=x+5.5; tmp-=(x+0.5)*Math.log(tmp); let ser=1.000000000190015;
  for(let j=0;j<6;j++){y++;ser+=c[j]/y;} return -tmp+Math.log(2.5066282746310005*ser/x);
}
function betacf(a,b,x){let c=1,d=1-((a+b)*x/(a+1));if(Math.abs(d)<1e-30)d=1e-30;d=1/d;let h=d;for(let m=1;m<=200;m++){let m2=2*m,aa=m*(b-m)*x/((a+m2-1)*(a+m2));d=1+aa*d;if(Math.abs(d)<1e-30)d=1e-30;let cc=1+aa/c;if(Math.abs(cc)<1e-30)cc=1e-30;d=1/d;h*=d*cc;aa=-(a+m)*(a+b+m)*x/((a+m2)*(a+m2+1));d=1+aa*d;if(Math.abs(d)<1e-30)d=1e-30;cc=1+aa/c;if(Math.abs(cc)<1e-30)cc=1e-30;d=1/d;let del=d*cc;h*=del;if(Math.abs(del-1)<3e-7)break;}return h;}
function ibeta(a,b,x){if(x<=0)return 0;if(x>=1)return 1;const lb=lgamma(a)+lgamma(b)-lgamma(a+b);const fr=Math.exp(Math.log(x)*a+Math.log(1-x)*b-lb)/a;return x<(a+1)/(a+b+2)?fr*betacf(a,b,x):1-fr*betacf(b,a,1-x);}
function abTest(nA,convA,nB,convB){
  const rA=convA/nA,rB=convB/nB,vA=rA*(1-rA)/nA,vB=rB*(1-rB)/nB,se=Math.sqrt(vA+vB);
  if(se===0)return{pValue:1,significant:false};
  const t=(rB-rA)/se,df=Math.pow(vA+vB,2)/(Math.pow(vA,2)/(nA-1)+Math.pow(vB,2)/(nB-1));
  const pValue=ibeta(df/2,0.5,df/(df+t*t));
  return{pValue,significant:pValue<0.05,lift:rA>0?(rB-rA)/rA*100:0,winner:pValue<0.05?(rB>rA?'B':'A'):'No winner'};
}

// ----- Keyword match (JS port) -----
const STOP=new Set(['a','an','the','and','or','but','in','on','at','to','for','of','with','by','from','is','are','was','were','be','been']);
const stem=w=>{if(w.endsWith('sses')&&w.length>4)w=w.slice(0,-2);else if(w.endsWith('ies')&&w.length>3)w=w.slice(0,-2);else if(w.endsWith('s')&&!w.endsWith('ss')&&w.length>2)w=w.slice(0,-1);if(w.endsWith('ing')&&w.length>3)w=w.slice(0,-3);else if(w.endsWith('ed')&&w.length>2)w=w.slice(0,-2);return w;};
const tok=(t,s=false)=>t.toLowerCase().replace(/[^\w\s]/g,'').split(/\s+/).filter(x=>x&&!STOP.has(x)).map(x=>s?stem(x):x);
function kwMatch(kw,q,type){
  const k=tok(kw),qu=tok(q),ks=tok(kw,true),qs=tok(q,true);
  if(type==='EXACT')return JSON.stringify(k)===JSON.stringify(qu);
  if(type==='PHRASE'){for(let i=0;i<=qu.length-k.length;i++)if(k.every((x,j)=>x===qu[i+j]))return true;return false;}
  const qset=new Set(qs);return ks.every(x=>qset.has(x));
}

// Tests
describe('ABTestEngine', () => {
  it('detects significant difference', () => {
    const r = abTest(10000, 500, 10000, 650);
    expect(r.significant).toBe(true);
    expect(r.pValue).toBeLessThan(0.05);
    expect(r.winner).toBe('B');
  });
  it('reports no winner for small difference', () => {
    const r = abTest(1000, 100, 1000, 102);
    expect(r.significant).toBe(false);
    expect(r.winner).toBe('No winner');
  });
  it('positive lift when B converts better', () => {
    const r = abTest(5000, 200, 5000, 300);
    expect(r.lift).toBeGreaterThan(0);
  });
  it('A wins when A converts better', () => {
    const r = abTest(8000, 640, 8000, 480);
    expect(r.winner).toBe('A');
  });
});

describe('KeywordMatchEngine', () => {
  it('exact match passes', ()     => expect(kwMatch('buy running shoes','buy running shoes','EXACT')).toBe(true));
  it('exact match fails extra',   () => expect(kwMatch('running shoes','buy running shoes','EXACT')).toBe(false));
  it('phrase match in longer query', () => expect(kwMatch('running shoes','best buy running shoes online','PHRASE')).toBe(true));
  it('broad match with stemming', () => expect(kwMatch('run shoes','I need shoes for running','BROAD')).toBe(true));
  it('broad match fails no overlap', () => expect(kwMatch('cheap pizza','buy running shoes','BROAD')).toBe(false));
});
