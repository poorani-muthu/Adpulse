import { useState, useEffect } from 'react';
import { api } from '../api/apiService';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Edit2, Trash2, Download, X } from 'lucide-react';

const AD_TYPES = ['ALL','SEARCH','DISPLAY','SHOPPING','VIDEO'];
const STATUSES = ['ACTIVE','PAUSED','ENDED'];
const fmt = (n, pre='') => n >= 1e6 ? pre+(n/1e6).toFixed(1)+'M' : n >= 1e3 ? pre+(n/1e3).toFixed(1)+'K' : pre+Number(n).toFixed(2);

const typeBadge = t => ({ SEARCH:'badge-blue', DISPLAY:'badge-purple', SHOPPING:'badge-green', VIDEO:'badge-yellow' }[t] || 'badge-blue');
const statusBadge = s => ({ ACTIVE:'badge-green', PAUSED:'badge-yellow', ENDED:'badge-red' }[s] || 'badge-blue');

function CampaignModal({ campaign, onClose, onSave }) {
  const [form, setForm] = useState(campaign || {
    name:'', adType:'SEARCH', status:'ACTIVE', budget:0,
    spent:0, impressions:0, clicks:0, conversions:0, revenue:0
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    const data = { ...form, budget:+form.budget, spent:+form.spent,
      impressions:+form.impressions, clicks:+form.clicks,
      conversions:+form.conversions, revenue:+form.revenue };
    campaign?.id ? await api.updateCampaign(campaign.id, data) : await api.createCampaign(data);
    onSave();
  };

  const F = ({ label, k, type='text' }) => (
    <div style={{ marginBottom:14 }}>
      <label>{label}</label>
      {k === 'adType' ? (
        <select value={form[k]} onChange={e => set(k, e.target.value)}>
          {['SEARCH','DISPLAY','SHOPPING','VIDEO'].map(t => <option key={t}>{t}</option>)}
        </select>
      ) : k === 'status' ? (
        <select value={form[k]} onChange={e => set(k, e.target.value)}>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      ) : (
        <input type={type} value={form[k]} onChange={e => set(k, e.target.value)} />
      )}
    </div>
  );

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-up">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h2>{campaign?.id ? 'Edit Campaign' : 'New Campaign'}</h2>
          <button onClick={onClose} style={{ background:'none', color:'var(--text2)' }}><X size={20}/></button>
        </div>
        <div className="grid-2">
          <F label="Campaign Name" k="name" />
          <F label="Ad Type" k="adType" />
          <F label="Status" k="status" />
          <F label="Budget ($)" k="budget" type="number" />
          <F label="Spent ($)" k="spent" type="number" />
          <F label="Impressions" k="impressions" type="number" />
          <F label="Clicks" k="clicks" type="number" />
          <F label="Conversions" k="conversions" type="number" />
          <F label="Revenue ($)" k="revenue" type="number" />
        </div>
        <div style={{ display:'flex', gap:10, marginTop:8, justifyContent:'flex-end' }}>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Save Campaign</button>
        </div>
      </div>
    </div>
  );
}

export default function CampaignsPage() {
  const { isAdmin } = useAuth();
  const [campaigns, setCamps] = useState([]);
  const [filter, setFilter]   = useState('ALL');
  const [search, setSearch]   = useState('');
  const [modal, setModal]     = useState(null); // null | 'new' | campaign obj
  const [loading, setLoading] = useState(true);
  const [sort, setSort]       = useState({ col:'name', dir:1 });

  const load = () => {
    setLoading(true);
    api.getCampaigns().then(setCamps).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const displayed = campaigns
    .filter(c => filter === 'ALL' || c.adType === filter)
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => {
      const va = a[sort.col] ?? '', vb = b[sort.col] ?? '';
      return typeof va === 'string' ? va.localeCompare(vb) * sort.dir : (va - vb) * sort.dir;
    });

  const toggleSort = col => setSort(s => ({ col, dir: s.col === col ? -s.dir : 1 }));

  const handleDelete = async (id) => {
    if (!confirm('Delete this campaign?')) return;
    await api.deleteCampaign(id);
    load();
  };

  const exportCSV = () => {
    const headers = 'Name,Type,Status,Budget,Spent,Impressions,Clicks,Conversions,Revenue,ROAS,CTR';
    const rows = displayed.map(c =>
      `"${c.name}",${c.adType},${c.status},${c.budget},${c.spent},${c.impressions},${c.clicks},${c.conversions},${c.revenue},${c.roas?.toFixed(2)},${c.ctr?.toFixed(2)}`
    );
    const blob = new Blob([[headers,...rows].join('\n')], { type:'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'adpulse_campaigns.csv'; a.click();
  };

  const COLS = [
    { key:'name', label:'Campaign' }, { key:'adType', label:'Type' },
    { key:'status', label:'Status' }, { key:'budget', label:'Budget' },
    { key:'spent', label:'Spent' }, { key:'impressions', label:'Impressions' },
    { key:'clicks', label:'Clicks' }, { key:'roas', label:'ROAS' },
    { key:'ctr', label:'CTR' },
  ];

  return (
    <div className="animate-up">
      <div className="page-header">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div><h1>Campaigns</h1><p>Manage and monitor all ad campaigns</p></div>
          <div style={{ display:'flex', gap:10 }}>
            <button className="btn-ghost" onClick={exportCSV}><Download size={15} style={{ marginRight:6 }}/>Export CSV</button>
            {isAdmin && <button className="btn-primary" onClick={() => setModal('new')}><Plus size={15} style={{ marginRight:6 }}/>New Campaign</button>}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text2)' }}/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search campaigns…" style={{ paddingLeft:36 }}/>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {AD_TYPES.map(t => (
            <button key={t} onClick={() => setFilter(t)} style={{
              padding:'8px 14px', borderRadius:8, fontSize:13, fontWeight:600, border:'none',
              background: filter===t ? 'var(--accent)' : 'var(--bg2)',
              color: filter===t ? '#fff' : 'var(--text2)', cursor:'pointer'
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table>
            <thead>
              <tr>
                {COLS.map(col => (
                  <th key={col.key} onClick={() => toggleSort(col.key)} style={{ cursor:'pointer', userSelect:'none' }}>
                    {col.label} {sort.col === col.key ? (sort.dir===1 ? '↑':'↓') : ''}
                  </th>
                ))}
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} style={{ textAlign:'center', padding:40, color:'var(--text2)' }}>Loading…</td></tr>
              ) : displayed.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign:'center', padding:40, color:'var(--text2)' }}>No campaigns found</td></tr>
              ) : displayed.map(c => (
                <tr key={c.id} style={{ opacity: c.status==='ENDED' ? 0.6 : 1 }}>
                  <td><div style={{ fontWeight:600 }}>{c.name}</div></td>
                  <td><span className={`badge ${typeBadge(c.adType)}`}>{c.adType}</span></td>
                  <td><span className={`badge ${statusBadge(c.status)}`}>{c.status}</span></td>
                  <td style={{ fontFamily:'var(--mono)' }}>${c.budget?.toLocaleString()}</td>
                  <td style={{ fontFamily:'var(--mono)' }}>
                    <div>{fmt(c.spent,'$')}</div>
                    <div style={{ fontSize:11, color:'var(--text2)' }}>
                      <div style={{ width:60, height:4, background:'var(--bg3)', borderRadius:2, marginTop:4 }}>
                        <div style={{ width:`${Math.min(c.spent/c.budget*100,100)}%`, height:'100%',
                          background: c.spent > c.budget ? 'var(--red)' : 'var(--accent)', borderRadius:2 }}/>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily:'var(--mono)' }}>{fmt(c.impressions)}</td>
                  <td style={{ fontFamily:'var(--mono)' }}>{fmt(c.clicks)}</td>
                  <td style={{ fontFamily:'var(--mono)', color: c.roas >= 3 ? 'var(--green)' : c.roas < 2 ? 'var(--red)' : 'var(--text)' }}>
                    {c.roas?.toFixed(2)}x
                  </td>
                  <td style={{ fontFamily:'var(--mono)' }}>{c.ctr?.toFixed(2)}%</td>
                  {isAdmin && (
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        <button className="btn-ghost" style={{ padding:'6px 10px' }} onClick={() => setModal(c)}><Edit2 size={14}/></button>
                        <button className="btn-danger" style={{ padding:'6px 10px' }} onClick={() => handleDelete(c.id)}><Trash2 size={14}/></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding:'12px 20px', borderTop:'1px solid var(--border)', color:'var(--text2)', fontSize:13 }}>
          {displayed.length} of {campaigns.length} campaigns
        </div>
      </div>

      {modal && (
        <CampaignModal
          campaign={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
