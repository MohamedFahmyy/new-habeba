import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Heart, Music, Image, Clock, Lock, Smartphone, ChevronRight, Star, Check, Eye, Sparkles, ExternalLink } from 'lucide-react';
import { THEMES } from '../lib/themes';
import ThemePreviewModal from '../components/themes/ThemePreviewModal';
import type { Theme } from '../types';

// Animation variants
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' } }),
};

export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [modalTheme, setModalTheme] = useState<Theme | null>(null);

  const categories = [
    { id: 'all', nameAr: 'جميع القوالب', nameEn: 'All Themes' },
    { id: 'romantic', nameAr: 'رومانسي وكلاسيكي', nameEn: 'Romantic & Classic' },
    { id: 'luxury', nameAr: 'ملكي وفخم', nameEn: 'Luxury & Royal' },
    { id: 'dreamy', nameAr: 'حالم وهادئ', nameEn: 'Dreamy & Calm' },
    { id: 'cosmic', nameAr: 'كوني وشاعري', nameEn: 'Cosmic & Stars' },
    { id: 'nature', nameAr: 'طبيعة ساحرة', nameEn: 'Enchanted Nature' },
  ];

  const filteredThemes = activeCategory === 'all'
    ? THEMES
    : THEMES.filter(t => t.category === activeCategory || (activeCategory === 'romantic' && t.category === 'classic'));

  const features = [
    { icon: Music, titleKey: 'feat_music_title', descKey: 'feat_music_desc', color: 'from-purple-500 to-pink-500' },
    { icon: Image, titleKey: 'feat_memories_title', descKey: 'feat_memories_desc', color: 'from-pink-500 to-rose-500' },
    { icon: Heart, titleKey: 'feat_letter_title', descKey: 'feat_letter_desc', color: 'from-rose-500 to-red-500' },
    { icon: Clock, titleKey: 'feat_timeline_title', descKey: 'feat_timeline_desc', color: 'from-amber-500 to-orange-500' },
    { icon: Lock, titleKey: 'feat_privacy_title', descKey: 'feat_privacy_desc', color: 'from-green-500 to-emerald-500' },
    { icon: Smartphone, titleKey: 'feat_mobile_title', descKey: 'feat_mobile_desc', color: 'from-blue-500 to-cyan-500' },
  ];

  const faqs = [
    { q: 'faq_q1', a: 'faq_a1' },
    { q: 'faq_q2', a: 'faq_a2' },
    { q: 'faq_q3', a: 'faq_a3' },
    { q: 'faq_q4', a: 'faq_a4' },
  ];

  return (
    <div className="overflow-hidden">
      {/* ─── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center justify-center py-20 px-4">
        {/* Ambient background glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/15 rounded-full blur-[140px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-rose-500/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-purple-500/10 rounded-full blur-[100px]" />
        </div>

        <div className="page-container text-center relative z-10 max-w-4xl mx-auto">
          {/* Badge */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="visible" custom={0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8 border-pink-500/20"
          >
            <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping" />
            <span className="text-sm font-medium text-pink-300">{t('hero_badge')}</span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={fadeUp} initial="hidden" animate="visible" custom={1}
            className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.25] mb-6"
          >
            {t('hero_title_1')}{' '}
            <span className="text-gradient drop-shadow-[0_0_35px_rgba(255,107,157,0.4)]">
              {t('hero_title_highlight')}
            </span>
            <br />
            {t('hero_title_2')}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeUp} initial="hidden" animate="visible" custom={2}
            className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed font-light"
          >
            {t('hero_subtitle')}
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="visible" custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/register" className="btn-primary text-lg px-8 py-4 shadow-2xl shadow-pink-500/30 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <span>{t('hero_cta_primary')}</span>
            </Link>
            <a href="#themes" className="btn-secondary text-lg px-8 py-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-pink-400" />
              <span>{isAr ? 'استكشف نماذج القوالب 🎨' : 'Explore Theme Demos 🎨'}</span>
            </a>
          </motion.div>

          <motion.p
            variants={fadeUp} initial="hidden" animate="visible" custom={4}
            className="mt-8 text-sm text-white/40"
          >
            {t('hero_reassurance')}
          </motion.p>
        </div>
      </section>

      {/* ─── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section className="py-24 bg-white/[0.02]">
        <div className="page-container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t('how_title')}</h2>
            <p className="text-white/50 max-w-2xl mx-auto">{t('how_subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((step) => (
              <motion.div
                key={step}
                variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={step * 0.5}
                className="glass-card p-8 text-center relative group hover:border-pink-500/30 transition-all rounded-3xl"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-white group-hover:scale-110 transition-transform shadow-lg shadow-pink-500/20">
                  {step}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{t(`step${step}_title`)}</h3>
                <p className="text-white/50 leading-relaxed font-light">{t(`step${step}_desc`)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── THEMES SHOWCASE & LIVE EXAMPLES (FEATURED SECTION) ───────────── */}
      <section id="themes" className="py-28 relative scroll-mt-10">
        <div className="page-container">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="text-xs uppercase tracking-widest text-pink-400 font-bold px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20">
              {isAr ? 'تصاميم رومانسية ساحرة' : 'Catchy & Elegant Themes'}
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mt-4 mb-4">
              {isAr ? 'استكشف نماذج جميع القوالب الحية' : 'Explore Every Live Theme Example'}
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto text-base sm:text-lg font-light leading-relaxed">
              {isAr
                ? 'لكل قصة حب طابعها الخاص.. اضغط على أي قالب لتجربة موقعه التفاعلي بالكامل كما سيراه شريك حياتك!'
                : 'Every love story has its own vibe. Click on any theme to explore its complete, live interactive website!'}
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center justify-center gap-2 mb-12 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all ${
                  activeCategory === cat.id
                    ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/25 scale-105'
                    : 'glass-card text-white/60 hover:text-white hover:border-white/30'
                }`}
              >
                {isAr ? cat.nameAr : cat.nameEn}
              </button>
            ))}
          </div>

          {/* Themes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredThemes.map((theme, i) => (
              <motion.div
                key={theme.id}
                variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i * 0.08}
                className="glass-card rounded-3xl overflow-hidden group hover:border-pink-500/50 transition-all duration-500 flex flex-col justify-between border border-white/10 shadow-xl hover:shadow-2xl hover:shadow-pink-500/10"
              >
                {/* Visual Cover */}
                <div className={`h-48 ${theme.previewGradient} relative p-5 flex flex-col justify-between overflow-hidden`}>
                  {/* Floating Particle / Icon */}
                  <div className="flex items-center justify-between z-10">
                    <span className="text-xs px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white font-bold border border-white/15">
                      {theme.tag}
                    </span>
                    <div className="flex items-center gap-1.5 p-1 rounded-full bg-black/50 backdrop-blur-md">
                      <span className="w-3.5 h-3.5 rounded-full shadow" style={{ backgroundColor: theme.primaryColor }} />
                      <span className="w-3.5 h-3.5 rounded-full shadow" style={{ backgroundColor: theme.secondaryColor }} />
                    </div>
                  </div>

                  {/* Center Particle Badge */}
                  <div className="text-center z-10 my-auto">
                    <span className="text-5xl group-hover:scale-125 transition-transform duration-500 inline-block drop-shadow-lg animate-heartbeat">
                      {theme.particleIcon || '💖'}
                    </span>
                  </div>

                  {/* Poetic quote */}
                  <div className="z-10 text-center">
                    <p className="text-white/80 text-[11px] font-medium bg-black/40 backdrop-blur-md px-3 py-1 rounded-xl truncate">
                      "{isAr ? theme.quoteAr : theme.quoteEn}"
                    </p>
                  </div>

                  {/* Gradient bottom mask */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Content Info */}
                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-white font-bold text-xl group-hover:text-pink-300 transition-colors">
                        {isAr ? theme.nameAr : theme.name}
                      </h3>
                    </div>
                    <p className="text-white/50 text-xs sm:text-sm leading-relaxed font-light">
                      {isAr ? theme.descriptionAr : theme.description}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 space-y-2">
                    {/* Live Demo Site Button (Main action for previewing) */}
                    <Link
                      to={`/gift/${theme.demoSlug || `demo-${theme.id}`}`}
                      className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all border border-white/15 hover:border-white/30 group-hover:bg-pink-500/20 group-hover:border-pink-500/40"
                    >
                      <ExternalLink className="w-4 h-4 text-pink-400" />
                      <span>{isAr ? 'زيارة موقع تجريبي مباشر' : 'Open Live Demo Site'}</span>
                    </Link>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Modal Preview Button */}
                      <button
                        type="button"
                        onClick={() => setModalTheme(theme)}
                        className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5 text-pink-400" />
                        <span>{isAr ? 'معاينة سريعة' : 'Quick Preview'}</span>
                      </button>

                      {/* Use This Theme Button */}
                      <Link
                        to={`/wizard?theme=${theme.id}`}
                        className="py-2 px-3 rounded-xl bg-gradient-to-r from-pink-500/80 to-rose-600/80 hover:from-pink-500 hover:to-rose-600 text-white text-xs font-semibold flex items-center justify-center gap-1 transition-all shadow-md"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isAr ? 'اصنع هديتك' : 'Use Theme'}</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─────────────────────────────────────────────────────── */}
      <section className="py-24 bg-white/[0.02]">
        <div className="page-container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t('features_title')}</h2>
            <p className="text-white/50 max-w-2xl mx-auto">{t('features_subtitle')}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, titleKey, descKey, color }, i) => (
              <motion.div
                key={titleKey}
                variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i * 0.15}
                className="glass-card p-6 hover:border-white/20 transition-all group rounded-3xl"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{t(titleKey)}</h3>
                <p className="text-white/50 text-sm leading-relaxed font-light">{t(descKey)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="page-container max-w-3xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t('faq_title')}</h2>
          </div>
          <div className="space-y-4">
            {faqs.map(({ q, a }, i) => (
              <motion.div
                key={q}
                variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i * 0.1}
                className="glass-card p-6 rounded-3xl border border-white/10"
              >
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-pink-400 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="text-white font-semibold mb-2">{t(q)}</h3>
                    <p className="text-white/50 text-sm leading-relaxed font-light">{t(a)}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA BOTTOM ───────────────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-br from-pink-900/30 via-rose-900/20 to-purple-900/30 relative overflow-hidden">
        <div className="page-container text-center max-w-4xl mx-auto px-4">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-pink-500/10 border border-pink-500/30 mb-8 animate-heartbeat shadow-lg shadow-pink-500/20">
              <Heart className="w-10 h-10 fill-pink-500 text-pink-500 drop-shadow-[0_0_15px_rgba(255,107,157,0.7)]" />
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-10 leading-[1.4] px-4">
              {t('cta_bottom_title')}
            </h2>
            <div className="flex justify-center mt-4">
              <Link to="/register" className="btn-primary text-lg sm:text-xl px-10 py-4 sm:px-12 sm:py-5 shadow-2xl shadow-pink-500/40 font-bold">
                {t('cta_bottom_btn')}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Theme Interactive Preview Modal */}
      <ThemePreviewModal
        theme={modalTheme}
        isOpen={!!modalTheme}
        onClose={() => setModalTheme(null)}
        onSelect={(themeId) => navigate(`/wizard?theme=${themeId}`)}
        isSelected={false}
      />
    </div>
  );
}
