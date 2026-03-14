import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Cpu, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Cpu size={30} color="#fff" />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>AdPulse</h1>
          <p style={{ color: 'var(--text2)', marginTop: 6 }}>Campaign Analytics Platform</p>
        </div>

        <div className="card animate-up">
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label>Username</label>
              <input value={username} onChange={e => setUsername(e.target.value)}
                placeholder="admin" required autoFocus />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required />
            </div>
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8,
                color: 'var(--red)', fontSize: 13, marginBottom: 16 }}>
                <AlertCircle size={15} /> {error}
              </div>
            )}
            <button className="btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        {/* Demo credentials */}
        <div style={{ marginTop: 20, padding: 16, background: 'var(--bg2)', borderRadius: 10, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Demo Credentials</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[['Admin', 'admin', 'admin123'], ['Viewer', 'viewer', 'viewer123']].map(([role, u, p]) => (
              <button key={u} className="btn-ghost" style={{ textAlign: 'left', padding: '10px 12px' }}
                onClick={() => { setUsername(u); setPassword(p); }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>{role}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)', fontFamily: 'var(--mono)', marginTop: 2 }}>{u} / {p}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
