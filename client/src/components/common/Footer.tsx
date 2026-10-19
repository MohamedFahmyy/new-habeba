import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart } from 'lucide-react';

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white/5 border-t border-white/10 py-12 mt-20">
      <div className="page-container">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-white font-bold">حبيبة | Habeba</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-white/50">
            <Link to="/privacy" className="hover:text-white transition-colors">{t('footer_privacy')}</Link>
            <Link to="/terms" className="hover:text-white transition-colors">{t('footer_terms')}</Link>
            <Link to="/contact" className="hover:text-white transition-colors">{t('footer_contact')}</Link>
          </div>

          {/* Copyright */}
          <p className="text-white/30 text-sm text-center">
            © {year} Habeba Platform · Made with <Heart className="w-3 h-3 inline text-pink-400 fill-pink-400" /> for couples worldwide
          </p>
        </div>
      </div>
    </footer>
  );
}
