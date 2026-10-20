import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Menu, X, Globe, Plus, LayoutDashboard, LogOut, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { isRTL } from '../../lib/i18n';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const toggleLang = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    document.documentElement.lang = newLang;
    document.documentElement.dir = isRTL(newLang) ? 'rtl' : 'ltr';
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0d0d1a]/80 backdrop-blur-xl border-b border-white/10">
      <div className="page-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center animate-heartbeat">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-white font-bold text-xl">
              حبيبة <span className="text-pink-400 text-sm font-normal">Habeba</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            <a href="/#themes" className="btn-ghost text-sm flex items-center gap-1.5 text-white/80 hover:text-pink-300">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span>{i18n.language === 'ar' ? 'نماذج القوالب' : 'Themes & Demos'}</span>
            </a>
            {isAuthenticated ? (
              <>
                <NavLink to="/dashboard" className={({ isActive }) =>
                  `btn-ghost text-sm ${isActive ? 'text-pink-400' : ''}`}>
                  <LayoutDashboard className="w-4 h-4 inline mr-1" />
                  {t('nav_dashboard')}
                </NavLink>
                <Link to="/wizard" className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  {t('nav_create')}
                </Link>
                {isAdmin && (
                  <NavLink to="/admin" className="btn-ghost text-sm text-purple-400">
                    <Shield className="w-4 h-4 inline mr-1" />
                    {t('nav_admin')}
                  </NavLink>
                )}
                <button onClick={handleLogout} className="btn-ghost text-sm text-white/50 hover:text-red-400">
                  <LogOut className="w-4 h-4 inline mr-1" />
                  {t('nav_logout')}
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="btn-ghost text-sm">{t('nav_login')}</NavLink>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">{t('nav_register')}</Link>
              </>
            )}
            <button onClick={toggleLang} className="btn-ghost text-sm flex items-center gap-1.5 ms-2">
              <Globe className="w-4 h-4" />
              {i18n.language === 'ar' ? 'EN' : 'عربي'}
            </button>
          </nav>

          {/* Mobile menu button */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden btn-ghost p-2">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0d0d1a]/95 border-t border-white/10 py-4 px-4">
          <div className="flex flex-col gap-2">
            <a href="/#themes" onClick={() => setMobileOpen(false)} className="btn-ghost flex items-center gap-2 text-pink-400">
              <Sparkles className="w-4 h-4" />
              <span>{i18n.language === 'ar' ? 'نماذج القوالب الحية' : 'Live Theme Demos'}</span>
            </a>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="btn-ghost">{t('nav_dashboard')}</Link>
                <Link to="/wizard" onClick={() => setMobileOpen(false)} className="btn-primary text-center">{t('nav_create')}</Link>
                {isAdmin && <Link to="/admin" onClick={() => setMobileOpen(false)} className="btn-ghost text-purple-400">{t('nav_admin')}</Link>}
                <button onClick={handleLogout} className="btn-ghost text-red-400">{t('nav_logout')}</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-ghost">{t('nav_login')}</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-primary text-center">{t('nav_register')}</Link>
              </>
            )}
            <button onClick={() => { toggleLang(); setMobileOpen(false); }} className="btn-ghost">
              <Globe className="w-4 h-4 inline mr-1" />
              {i18n.language === 'ar' ? 'English' : 'العربية'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
