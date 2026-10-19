import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Heart, Music, Image, Clock, Lock, Smartphone, ChevronRight, Star, Check } from 'lucide-react';
import { THEMES } from '../lib/themes';

// Animation variants
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' } }),
};

export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

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

      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-32">
        {/* Ambient background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-pink-600/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-rose-600/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-900/10 rounded-full blur-3xl" />
          {/* Floating ambient hearts placed on outer edges to avoid text collision */}
          {['💕', '💖', '💗', '💝'].map((emoji, i) => (
            <span
              key={i}
              className="absolute text-xl opacity-15 animate-float pointer-events-none select-none"
              style={{
                top: `${12 + i * 22}%`,
                [i % 2 === 0 ? 'right' : 'left']: `${3 + (i * 2)}%`,
                animationDelay: `${i * 1.5}s`,
                fontSize: '1.25rem',
              }}
            >
              {emoji}
            </span>
          ))}
        </div>

        <div className="page-container relative z-10 text-center max-w-5xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
            <span className="section-badge mb-8 inline-flex">
              <Star className="w-3.5 h-3.5 fill-pink-400 text-pink-400" />
              {t('hero_badge')}
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp} initial="hidden" animate="visible" custom={1}
            className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.35] md:leading-[1.4] mb-8"
          >
            {isAr ? (
              <>
                مش مجرد هدية... دي حكايتكم اللي هتفضل عايشة
                <span className="inline-flex items-center align-middle mx-3">
                  <Heart className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 fill-pink-500 text-pink-500 inline-block animate-heartbeat drop-shadow-[0_0_15px_rgba(255,107,157,0.7)]" />
                </span>
              </>
            ) : (
              <>
                {t('hero_title').replace('❤️', '').trim()}
                <span className="inline-flex items-center align-middle mx-3">
                  <Heart className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 fill-pink-500 text-pink-500 inline-block animate-heartbeat drop-shadow-[0_0_15px_rgba(255,107,157,0.7)]" />
                </span>
              </>
            )}
          </motion.h1>

          <motion.p
            variants={fadeUp} initial="hidden" animate="visible" custom={2}
            className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            {t('hero_subtitle')}
          </motion.p>

          <motion.div
            variants={fadeUp} initial="hidden" animate="visible" custom={3}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link to="/register" className="btn-primary text-lg px-8 py-4 shadow-2xl shadow-pink-500/30">
              {t('hero_cta_primary')}
            </Link>
            <Link to="/gift/salma-and-mohamed" className="btn-secondary text-lg px-8 py-4">
              {t('hero_cta_secondary')}
            </Link>
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
                className="glass-card p-8 text-center relative group hover:border-pink-500/30 transition-all"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-white group-hover:scale-110 transition-transform">
                  {step}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{t(`step${step}_title`)}</h3>
                <p className="text-white/50 leading-relaxed">{t(`step${step}_desc`)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─────────────────────────────────────────────────────── */}
      <section className="py-24">
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
                className="glass-card p-6 hover:border-white/20 transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{t(titleKey)}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{t(descKey)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── THEMES PREVIEW ───────────────────────────────────────────────── */}
      <section className="py-24 bg-white/[0.02]">
        <div className="page-container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t('themes_section_title')}</h2>
            <p className="text-white/50 max-w-2xl mx-auto">{t('themes_section_subtitle')}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {THEMES.map((theme, i) => (
              <motion.div
                key={theme.id}
                variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i * 0.1}
                className="glass-card overflow-hidden group cursor-pointer hover:border-white/30 hover:scale-[1.02] transition-all"
              >
                <div className={`h-32 ${theme.previewGradient} flex items-center justify-center relative`}>
                  <Heart className="w-8 h-8 text-white/40 fill-white/30 group-hover:scale-110 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>
                <div className="p-3">
                  <p className="text-white font-medium text-sm">{isAr ? theme.nameAr : theme.name}</p>
                  <p className="text-white/40 text-xs mt-0.5">{theme.tag}</p>
                </div>
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
                className="glass-card p-6"
              >
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-pink-400 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="text-white font-semibold mb-2">{t(q)}</h3>
                    <p className="text-white/50 text-sm leading-relaxed">{t(a)}</p>
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
              <Link to="/register" className="btn-primary text-lg sm:text-xl px-10 py-4 sm:px-12 sm:py-5 shadow-2xl shadow-pink-500/40">
                {t('cta_bottom_btn')}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
