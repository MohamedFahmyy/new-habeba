import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Heart, Sparkles, Calendar, Music, Mail, Image as ImageIcon, Eye } from 'lucide-react';
import type { Theme } from '../../types';

interface ThemePreviewModalProps {
  theme: Theme | null;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (themeId: string) => void;
  isSelected: boolean;
}

export default function ThemePreviewModal({
  theme,
  isOpen,
  onClose,
  onSelect,
  isSelected,
}: ThemePreviewModalProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  if (!isOpen || !theme) return null;

  const handleSelect = () => {
    onSelect(theme.id);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl border border-white/20 z-10 my-8"
          style={{ backgroundColor: theme.bgColor }}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 bg-black/30 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  {isAr ? theme.nameAr : theme.name}
                  <span
                    className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: `${theme.primaryColor}25`, color: theme.primaryColor }}
                  >
                    {theme.tag}
                  </span>
                </h3>
                <p className="text-white/60 text-xs sm:text-sm">
                  {isAr ? theme.descriptionAr : theme.description}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Live Mockup Viewport */}
          <div
            className="p-6 sm:p-8 space-y-6 max-h-[65vh] overflow-y-auto custom-scrollbar"
            style={{
              background: `linear-gradient(180deg, ${theme.bgColor} 0%, ${theme.bgColor}f0 50%, #000000 100%)`,
            }}
          >
            {/* Color Swatches */}
            <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-black/40 border border-white/10">
              <span className="text-white/50 text-xs font-medium px-2">{isAr ? 'ألوان القالب:' : 'Theme Palette:'}</span>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs text-white">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
                <span>{isAr ? 'اللون الرئيسي' : 'Primary'}: {theme.primaryColor}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs text-white">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.secondaryColor }} />
                <span>{isAr ? 'اللون الثانوي' : 'Secondary'}: {theme.secondaryColor}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs text-white">
                <span className="w-3 h-3 rounded-full border border-white/30" style={{ backgroundColor: theme.bgColor }} />
                <span>{isAr ? 'الخلفية' : 'Background'}: {theme.bgColor}</span>
              </div>
            </div>

            {/* Simulated Hero Section */}
            <div
              className="p-8 rounded-3xl text-center relative overflow-hidden border shadow-xl bg-black/40 backdrop-blur-xl"
              style={{
                borderColor: `${theme.primaryColor}30`,
              }}
            >
              <div
                className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center shadow-xl animate-heartbeat text-3xl"
              >
                ❤️
              </div>
              <h4 className="font-cursive text-4xl sm:text-5xl text-white mb-2 font-normal drop-shadow">
                Mohamed ❤️ Salma
              </h4>
              <p className="font-serif-romantic italic text-white/90 text-sm sm:text-base max-w-md mx-auto">
                "Every moment with you became my favorite memory."
              </p>
              <p className="text-white/60 text-xs sm:text-sm mt-1">
                "كل لحظة معاكي بقت أجمل ذكرى في حياتي."
              </p>

              {/* Floating music badge */}
              <div
                className="mt-4 inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-md"
                style={{
                  backgroundColor: `${theme.primaryColor}20`,
                  borderColor: `${theme.primaryColor}40`,
                  color: theme.primaryColor,
                }}
              >
                <span>♫</span>
                <span>Our Song</span>
              </div>
            </div>

            {/* Simulated Grid: Letter & Photo & Counter */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Simulated Love Letter */}
              <div
                className="p-5 rounded-2xl border relative overflow-hidden backdrop-blur-md"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  borderColor: `${theme.primaryColor}25`,
                }}
              >
                <div className="flex items-center gap-2 mb-3" style={{ color: theme.primaryColor }}>
                  <Mail className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {isAr ? 'رسالة من القلب' : 'A Letter From The Heart'}
                  </span>
                </div>
                <h5 className="text-white font-semibold mb-2 text-sm">
                  {isAr ? 'إلى حب عمري وحبيبتي...' : 'To My Dearest Love...'}
                </h5>
                <p className="text-white/60 text-xs leading-relaxed line-clamp-3">
                  {isAr
                    ? 'لم أكن أعلم أن الحب يمكن أن يكون بهذه الطمأنينة حتى دخلتِ حياتي، ضحكتكِ أمان، ووجودكِ عيد دائم.'
                    : 'I never knew love could feel this peaceful until you walked into my life. Every day by your side is a blessing.'}
                </p>
                <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center text-xs text-white/50">
                  <span>{isAr ? 'المخلص لكِ دائماً' : 'Forever Yours'}</span>
                  <span style={{ color: theme.primaryColor }}>❤️</span>
                </div>
              </div>

              {/* Simulated Photo Memory Card */}
              <div
                className="p-5 rounded-2xl border relative overflow-hidden backdrop-blur-md flex flex-col justify-between"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  borderColor: `${theme.secondaryColor}25`,
                }}
              >
                <div className="flex items-center gap-2 mb-3" style={{ color: theme.secondaryColor }}>
                  <ImageIcon className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {isAr ? 'ذكريات لا تُنسى' : 'Cherished Memory'}
                  </span>
                </div>

                {/* Photo frame placeholder */}
                <div
                  className="w-full h-24 rounded-xl flex flex-col items-center justify-center border border-dashed text-xs text-white/40 mb-3"
                  style={{ borderColor: `${theme.secondaryColor}40`, backgroundColor: `${theme.secondaryColor}10` }}
                >
                  <Heart className="w-6 h-6 mb-1 opacity-60" style={{ color: theme.secondaryColor }} />
                  <span>{isAr ? 'صورتكم الرومانسية هنا' : 'Your Romantic Photo Here'}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/70 font-medium">{isAr ? 'أول رحلة على شاطئ البحر' : 'First Trip by The Sea'}</span>
                  <span className="text-white/40">2024</span>
                </div>
              </div>
            </div>

            {/* Simulated Counter Bar (Our Numbers) */}
            <div
              className="p-4 rounded-2xl border grid grid-cols-4 gap-2 text-center"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                borderColor: `${theme.primaryColor}20`,
              }}
            >
              <div>
                <p className="font-serif-romantic font-bold text-lg sm:text-xl text-white">
                  +70
                </p>
                <p className="text-white/50 text-[10px] uppercase font-semibold">Days</p>
              </div>
              <div>
                <p className="font-serif-romantic font-bold text-lg sm:text-xl text-white">
                  +150
                </p>
                <p className="text-white/50 text-[10px] uppercase font-semibold">Photos</p>
              </div>
              <div>
                <p className="font-serif-romantic font-bold text-lg sm:text-xl text-white">
                  +50
                </p>
                <p className="text-white/50 text-[10px] uppercase font-semibold">Videos</p>
              </div>
              <div>
                <p className="font-serif-romantic font-bold text-lg sm:text-xl text-white">
                  +1000
                </p>
                <p className="text-white/50 text-[10px] uppercase font-semibold">Memories</p>
              </div>
            </div>
          </div>

          {/* Footer Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-6 border-t border-white/10 bg-black/40 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-white/20 text-white/70 hover:text-white hover:bg-white/5 text-sm font-medium transition-all"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>

              <a
                href={`/gift/${theme.demoSlug || `demo-${theme.id}`}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold flex items-center gap-1.5 transition-all border border-white/15"
              >
                <Eye className="w-4 h-4 text-pink-400" />
                <span>{isAr ? 'فتح الموقع التجريبي الكامل' : 'Open Full Live Demo'}</span>
              </a>
            </div>

            <button
              onClick={handleSelect}
              className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm flex items-center gap-2 shadow-lg transition-all hover:scale-105 active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
              }}
            >
              {isSelected ? (
                <>
                  <Check className="w-4 h-4" />
                  {isAr ? 'القالب محدد حالياً' : 'Currently Selected'}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {isAr ? 'اختيار هذا القالب' : 'Choose This Theme'}
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
