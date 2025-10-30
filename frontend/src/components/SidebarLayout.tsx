import { NavLink } from 'react-router-dom';
import React from 'react';

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '224px 1fr', background: '#F7F8FA', color: '#1F2329' }}>
      <aside style={{ borderRight: '1px solid #EAEDF2', background: '#FFFFFF' }}>
        <div style={{ padding: '16px 16px 8px 16px', borderBottom: '1px solid #EAEDF2' }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1F2329' }}>lite-ai-detect</div>
          <div style={{ fontSize: 12, color: '#8F959E', marginTop: 2 }}>Console</div>
        </div>
        <nav style={{ padding: 8 }}>
          <NavItem to="/upload" label="Upload" />
          <NavItem to="/jobs" label="Jobs" />
          <NavItem to="/dashboard" label="Dashboard" />
        </nav>
      </aside>
      <main>
        <div style={{ padding: 24 }}>{children}</div>
      </main>
    </div>
  );
}

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        display: 'block',
        padding: '10px 12px',
        margin: '4px 8px',
        borderRadius: 8,
        fontSize: 14,
        color: isActive ? '#3370FF' : '#1F2329',
        background: isActive ? 'rgba(51,112,255,0.08)' : 'transparent',
        fontWeight: isActive ? (600 as any) : (500 as any),
      })}
    >
      {label}
    </NavLink>
  );
}

export default SidebarLayout;


