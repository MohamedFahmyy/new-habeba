import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Music, Play, Pause, Sparkles, ExternalLink, ArrowRight, ArrowLeft } from 'lucide-react';
import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { giftsApi } from '../services/api';
import type { Gift } from '../types';
import { getThemeById, getDemoGiftBySlug, THEMES } from '../lib/themes';

function YouTubeMusicPlayer({ videoId, title, themePrimary }: { videoId: string; title?: string; themePrimary: string }) {
  const [playing, setPlaying] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <div className="fixed bottom-6 end-6 z-50">
      <div className="glass-card p-4 flex items-center gap-3 shadow-2xl backdrop-blur-xl border border-white/20"
        style={{ boxShadow: `0 10px 30px -5px ${themePrimary}33` }}>
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${playing ? 'animate-spin' : ''}`}
          style={{ background: `linear-gradient(135deg, ${themePrimary}, #ff2a70)`, animationDuration: '3s' }}
        >
          <Music className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white/60 text-xs flex items-center gap-1 font-medium">
            <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: themePrimary }} />
            ♪ الأغنية الخاصة
          </p>
          <p className="text-white text-sm font-semibold truncate max-w-[150px]">{title ?? 'موسيقى رومانسية'}</p>
        </div>
        <button
          onClick={() => setPlaying(!playing)}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-105"
          style={{ backgroundColor: themePrimary }}
        >
          {playing ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white ms-0.5" />}
        </button>
      </div>
      {playing && (
        <iframe
          ref={iframeRef}
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&loop=1&playlist=${videoId}`}
          className="sr-only w-0 h-0"
          allow="autoplay"
          title="music player"
        />
      )}
    </div>
  );
}

function DemoBanner({ currentThemeId }: { currentThemeId: string }) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const currentTheme = getThemeById(currentThemeId);

  return (
    <div className="sticky top-0 z-50 bg-black/85 backdrop-blur-xl border-b border-white/15 px-4 py-3 shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Theme Info Badge */}
        <div className="flex items-center gap-3">
          <span className="text-xl animate-pulse">{currentTheme.particleIcon || '💝'}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-400 font-semibold border border-pink-500/30">
                {isAr ? 'نموذج تجريبي حي للقالب' : 'Live Interactive Demo'}
              </span>
              <span className="text-white font-bold text-sm">
                {isAr ? currentTheme.nameAr : currentTheme.name}
              </span>
            </div>
            <p className="text-white/50 text-xs hidden sm:block">
              {isAr ? currentTheme.descriptionAr : currentTheme.description}
            </p>
          </div>
        </div>

        {/* Center: Quick Theme Switcher Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-none">
          {THEMES.map(t => {
            const isActive = t.id === currentThemeId;
            return (
              <Link
                key={t.id}
                to={`/gift/${t.demoSlug || `demo-${t.id}`}`}
                className={`px-2.5 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 shrink-0 ${
                  isActive
                    ? 'bg-white text-black shadow-lg font-bold scale-105'
                    : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                }`}
              >
                <span>{t.particleIcon}</span>
                <span>{isAr ? t.nameAr : t.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Right: CTA to create gift with this theme */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to={`/wizard?theme=${currentTheme.id}`}
            className="btn-primary text-xs py-2 px-4 shadow-lg shadow-pink-500/30 flex items-center gap-1.5 whitespace-nowrap font-bold"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAr ? 'اصنع هديتك بهذا القالب' : 'Use This Theme'}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function GiftContent({ gift, isDemo = false }: { gift: Gift; isDemo?: boolean }) {
  const theme = getThemeById(gift.themeId);
  const [letterOpen, setLetterOpen] = useState(false);

  const backgroundStyle = theme.bgGradient || `radial-gradient(ellipse at top, ${theme.bgColor} 0%, #080612 100%)`;

  return (
    <div
      className="min-h-screen text-white relative selection:bg-pink-500 selection:text-white overflow-hidden"
      style={{ background: backgroundStyle }}
    >
      {/* Demo Sticky Bar */}
      {isDemo && <DemoBanner currentThemeId={theme.id} />}

      {/* YouTube Background Music Player */}
      {gift.musicVideoId && (
        <YouTubeMusicPlayer videoId={gift.musicVideoId} title={gift.musicTitle} themePrimary={theme.primaryColor} />
      )}

      {/* Ambient Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[140px] opacity-35 animate-pulse"
          style={{ background: theme.primaryColor, animationDuration: '6s' }}
        />
        <div
          className="absolute top-1/2 -right-32 w-96 h-96 rounded-full blur-[150px] opacity-25"
          style={{ background: theme.secondaryColor }}
        />
        <div
          className="absolute -bottom-32 left-1/3 w-[30rem] h-[30rem] rounded-full blur-[160px] opacity-20"
          style={{ background: theme.accentGlow || theme.primaryColor }}
        />
      </div>

      {/* ─── Hero / Welcome Section ────────────────────────────────────────── */}
      <section className="min-h-[92vh] flex items-center justify-center relative px-4 py-20 z-10">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Heart / Particle Badge */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 12, delay: 0.2 }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-3xl p-1 shadow-2xl relative group"
            style={{
              background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
              boxShadow: `0 0 50px -10px ${theme.accentGlow || theme.primaryColor}`,
            }}
          >
            <div className="w-full h-full rounded-[22px] bg-black/40 backdrop-blur-md flex items-center justify-center text-4xl animate-heartbeat">
              {theme.particleIcon || '❤️'}
            </div>
          </motion.div>

          {/* Couple Names */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-3 text-lg md:text-xl font-light tracking-wide text-white/80"
          >
            <span className="font-semibold text-white px-3 py-1 rounded-full bg-white/5 border border-white/10">
              {gift.senderName}
            </span>
            <Heart className="w-5 h-5 text-pink-400 fill-pink-400 animate-pulse" />
            <span className="font-semibold text-white px-3 py-1 rounded-full bg-white/5 border border-white/10">
              {gift.recipientName}
            </span>
          </motion.div>

          {/* Site Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.2] px-2"
          >
            <span
              className="bg-clip-text text-transparent bg-gradient-to-r drop-shadow-sm"
              style={{
                backgroundImage: `linear-gradient(135deg, #ffffff 20%, ${theme.primaryColor} 70%, ${theme.secondaryColor} 100%)`,
              }}
            >
              {gift.title}
            </span>
          </motion.h1>

          {/* Poetic Theme Quote */}
          {theme.quoteAr && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-sm md:text-base italic text-white/50 max-w-xl mx-auto"
            >
              "{theme.quoteAr}"
            </motion.p>
          )}

          {/* Welcome Message */}
          {gift.welcomeMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="p-6 rounded-3xl glass-card max-w-2xl mx-auto border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-xl"
            >
              <p className="text-base sm:text-lg text-white/90 leading-relaxed font-normal">
                {gift.welcomeMessage}
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* ─── Timeline / Our Story ─────────────────────────────────────────── */}
      {gift.showTimeline && gift.timelineEntries && gift.timelineEntries.length > 0 && (
        <section className="py-24 px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-xs uppercase tracking-widest text-pink-400 font-bold px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20">
                حكايتنا معاً
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3">محطات من رحلة قلوبنا ❤️</h2>
            </div>

            <div className="relative">
              {/* Vertical Glowing Line */}
              <div
                className="absolute start-6 sm:start-8 top-0 bottom-0 w-0.5 opacity-40"
                style={{ background: `linear-gradient(to bottom, ${theme.primaryColor}, ${theme.secondaryColor}, transparent)` }}
              />

              <div className="space-y-10">
                {gift.timelineEntries.map((entry, i) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 }}
                    className="relative flex items-start gap-4 sm:gap-6 group"
                  >
                    {/* Circle Node */}
                    <div
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl border-2 flex items-center justify-center shrink-0 z-10 shadow-lg group-hover:scale-110 transition-transform bg-[#0d0618]"
                      style={{ borderColor: theme.primaryColor, boxShadow: `0 0 20px -5px ${theme.primaryColor}55` }}
                    >
                      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: theme.primaryColor }} />
                    </div>

                    {/* Content Card */}
                    <div className="flex-1 glass-card p-6 sm:p-7 rounded-3xl border border-white/10 group-hover:border-white/25 transition-all">
                      <span
                        className="text-xs font-bold uppercase tracking-wider block mb-1"
                        style={{ color: theme.primaryColor }}
                      >
                        {entry.eventDate}
                      </span>
                      <h3 className="text-white font-bold text-lg sm:text-xl mb-2">{entry.title}</h3>
                      {entry.description && (
                        <p className="text-white/70 leading-relaxed text-sm sm:text-base font-light">
                          {entry.description}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── Gallery / Memories ───────────────────────────────────────────── */}
      {gift.showGallery && gift.memories && gift.memories.length > 0 && (
        <section className="py-24 px-4 relative z-10 bg-black/20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-xs uppercase tracking-widest text-pink-400 font-bold px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20">
                ألبوم الذكريات
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3">لحظات لا ينساها القلب 📸</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {gift.memories.map((mem, i) => (
                <motion.div
                  key={mem.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group relative rounded-3xl overflow-hidden glass-card border border-white/10 hover:border-pink-500/40 transition-all duration-500 shadow-xl"
                  style={{ aspectRatio: '4/5' }}
                >
                  <img
                    src={mem.imageUrl}
                    alt={mem.title ?? 'ذكرى جميلة'}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700"
                    loading="lazy"
                  />
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-85 group-hover:opacity-95 transition-opacity" />

                  {/* Caption & Title */}
                  <div className="absolute bottom-0 inset-x-0 p-6 space-y-1">
                    {mem.title && (
                      <h4 className="text-white font-bold text-lg drop-shadow">{mem.title}</h4>
                    )}
                    {mem.caption && (
                      <p className="text-white/70 text-xs sm:text-sm line-clamp-2 leading-relaxed font-light">
                        {mem.caption}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Love Letter ─────────────────────────────────────────────────── */}
      {gift.showLetter && gift.letterContent && (
        <section className="py-24 px-4 relative z-10">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-xs uppercase tracking-widest text-pink-400 font-bold px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20">
                من أعماق القلب
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3">
                {gift.letterTitle ?? 'رسالة حب خاصة 💌'}
              </h2>
            </div>

            <div className="relative">
              <AnimatePresence mode="wait">
                {!letterOpen ? (
                  <motion.div
                    key="envelope"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => setLetterOpen(true)}
                    className="cursor-pointer glass-card p-12 sm:p-16 rounded-3xl text-center border-2 border-dashed border-white/20 hover:border-pink-500/50 hover:bg-white/[0.06] transition-all group shadow-2xl"
                  >
                    <div className="text-6xl sm:text-7xl mb-4 group-hover:scale-110 transition-transform animate-heartbeat">
                      💌
                    </div>
                    <p className="text-white font-bold text-lg sm:text-xl">اضغط هنا لفتح رسالة الحب الخاصة</p>
                    <p className="text-white/40 text-xs sm:text-sm mt-1">كتبت هذه الكلمات بحب خصيصاً لأجلكِ</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="letter"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-8 sm:p-12 rounded-3xl border border-white/20 shadow-2xl bg-black/40 backdrop-blur-2xl relative"
                  >
                    <div className="text-3xl text-center mb-6">💌</div>
                    <div className="text-white/90 leading-relaxed whitespace-pre-wrap text-base sm:text-lg font-light leading-[2]">
                      {gift.letterContent}
                    </div>
                    {gift.letterSignature && (
                      <p
                        className="text-end mt-8 text-xl font-bold"
                        style={{ color: theme.primaryColor }}
                      >
                        — {gift.letterSignature}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>
      )}

      {/* ─── Counters / By The Numbers ────────────────────────────────────── */}
      {gift.showCounters && gift.counters && gift.counters.length > 0 && (
        <section className="py-20 px-4 relative z-10 bg-black/15">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <span className="text-xs uppercase tracking-widest text-pink-400 font-bold px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20">
                أرقام لها معنى
              </span>
              <h2 className="text-3xl font-bold text-white mt-3">حكايتنا بلغة الأرقام 🔢</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {gift.counters.map(counter => (
                <div
                  key={counter.id}
                  className="glass-card p-6 rounded-3xl text-center border border-white/10 hover:border-white/25 transition-all shadow-lg"
                >
                  <div
                    className="text-3xl sm:text-4xl font-extrabold mb-1"
                    style={{ color: theme.primaryColor }}
                  >
                    {counter.targetValue.toLocaleString()}
                  </div>
                  <div className="text-white/70 text-xs sm:text-sm font-medium">{counter.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Surprise / Final Promise ─────────────────────────────────────── */}
      {gift.showSurprise && gift.surpriseTitle && (
        <section className="py-24 px-4 relative z-10">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="text-6xl sm:text-7xl animate-heartbeat inline-block">💝</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              {gift.surpriseTitle}
            </h2>
            {gift.surpriseMessage && (
              <p className="text-lg sm:text-xl text-white/80 leading-relaxed font-light">
                {gift.surpriseMessage}
              </p>
            )}

            {isDemo && (
              <div className="pt-8">
                <Link
                  to={`/wizard?theme=${theme.id}`}
                  className="btn-primary text-base px-8 py-4 shadow-2xl shadow-pink-500/40 inline-flex items-center gap-2 font-bold"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>اصنع موقعاً مثل هذا لشريك حياتك الآن</span>
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── Footer ───────────────────────────────────────────────────────── */}
      <footer className="py-12 text-center text-white/30 text-xs sm:text-sm border-t border-white/5 relative z-10">
        <p className="flex items-center justify-center gap-1.5">
          <span>صُنع بكل</span>
          <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />
          <span>على منصة حبيبة • Habeba</span>
        </p>
      </footer>
    </div>
  );
}

export default function GiftViewPage() {
  const { slug } = useParams<{ slug: string }>();

  // Check if this is one of our built-in interactive demo slugs
  const isDemo = slug ? slug.startsWith('demo-') : false;
  const demoGift = isDemo && slug ? getDemoGiftBySlug(slug) : null;

  // Real database fetch query (used when not a demo)
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['gift', 'public', slug],
    queryFn: () => giftsApi.getPublic(slug!).then(r => r.data.gift),
    enabled: !!slug && !demoGift,
    retry: false,
  });

  // If it's a demo gift, render instantly without network wait
  if (demoGift) {
    return <GiftContent gift={demoGift} isDemo={true} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080612] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-heartbeat">❤️</div>
          <p className="text-white/60 font-medium">جاري تجهيز هديتك الرومانسية...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    const status = (error as any)?.response?.status;
    return (
      <div className="min-h-screen bg-[#080612] flex items-center justify-center px-4">
        <div className="text-center max-w-md glass-card p-8 rounded-3xl border border-white/10">
          <div className="text-6xl mb-4">{status === 402 ? '🔒' : '💔'}</div>
          <h1 className="text-2xl font-bold text-white mb-3">
            {status === 402 ? 'الهدية قيد التفعيل' : 'لم يتم العثور على الهدية'}
          </h1>
          <p className="text-white/50 text-sm leading-relaxed mb-6">
            {status === 402
              ? 'هذا الرابط لم يتم تفعيله بعد من قبل صاحب الهدية. يرجى التواصل معه لإتمام التفعيل.'
              : 'عذراً، لم نتمكن من العثور على هذه الصفحة الرومانسية أو قد تكون مسودة خاصة.'}
          </p>
          <Link to="/" className="btn-secondary text-sm">
            العودة إلى الصفحة الرئيسية
          </Link>
        </div>
      </div>
    );
  }

  if (!data) return null;
  return <GiftContent gift={data} isDemo={false} />;
}
