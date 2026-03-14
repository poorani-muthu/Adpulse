import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Megaphone, BarChart2, Zap,
  FlaskConical, ShieldAlert, Search, Settings, LogOut, Cpu
} from 'lucide-react';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/campaigns', icon: Megaphone,        label: 'Campaigns' },
  { to: '/analytics', icon: BarChart2,         label: 'Analytics' },
  { to: '/optimizer', icon: Zap,               label: 'Optimizer' },
  { label: 'C++ Engines', divider: true },
  { to: '/abtest',    icon: FlaskConical,      label: 'A/B Testing' },
  { to: '/fraud',     icon: ShieldAlert,       label: 'Fraud Detection' },
  { to: '/keywords',  icon: Search,            label: 'Keyword Match' },
  { to: '/settings',  icon: Settings,          label: 'Settings' },
];

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240, background: 'var(--bg2)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', padding: '24px 0', flexShrink: 0
      }}>
        {/* Logo */}
        <div style={{ padding: '0 24px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Cpu size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>AdPulse</div>
              <div style={{ fontSize: 11, color: 'var(--text2)' }}>Analytics Platform</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          {NAV.map((item, i) => item.divider ? (
            <div key={i} style={{ padding: '16px 12px 8px', fontSize: 11, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {item.label}
            </div>
          ) : (
            <NavLink key={item.to} to={item.to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 8, marginBottom: 2,
              fontSize: 14, fontWeight: 500,
              color: isActive ? '#fff' : 'var(--text2)',
              background: isActive ? 'rgba(79,127,255,0.15)' : 'transparent',
              transition: 'all 0.15s',
            })}>
              {({ isActive }) => <>
                <item.icon size={18} color={isActive ? 'var(--accent)' : 'currentColor'} />
                {item.label}
              </>}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 14
            }}>{user?.username?.[0]?.toUpperCase()}</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{user?.username}</div>
              <span className={`badge ${isAdmin ? 'badge-blue' : 'badge-purple'}`} style={{ padding: '1px 7px', fontSize: 11 }}>
                {user?.role}
              </span>
            </div>
          </div>
          <button className="btn-ghost" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8 }} onClick={handleLogout}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
        <Outlet />
      </main>
    </div>
  );
}
