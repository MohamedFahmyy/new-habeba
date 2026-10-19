import { Outlet, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BarChart2, Users, Gift, CreditCard, Settings, Shield } from 'lucide-react';

export default function AdminLayout() {
  const { t } = useTranslation();

  const navItems = [
    { to: '/admin', label: t('adm_nav_stats'), icon: BarChart2, end: true },
    { to: '/admin/users', label: t('adm_nav_users'), icon: Users },
    { to: '/admin/gifts', label: t('adm_nav_gifts'), icon: Gift },
    { to: '/admin/payments', label: t('adm_nav_payments'), icon: CreditCard },
    { to: '/admin/settings', label: t('adm_nav_settings'), icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#0d0d1a] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white/5 border-r border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-pink-400" />
            <span className="text-white font-bold text-lg">Admin Panel</span>
          </div>
          <p className="text-white/40 text-xs mt-1">{t('adm_title')}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <NavLink to="/" className="btn-ghost text-sm flex items-center gap-2">
            ← Back to Site
          </NavLink>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
