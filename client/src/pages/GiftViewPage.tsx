import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Music, Play, Pause, Sparkles, ChevronDown, Camera, Video, Infinity as InfinityIcon } from 'lucide-react';
import { useState, useRef, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { giftsApi } from '../services/api';
import type { Gift } from '../types';
import { getThemeById, getDemoGiftBySlug, THEMES } from '../lib/themes';
import { extractYouTubeId } from '../lib/youtube';
import { useYouTubeAudio, YouTubeAudioMount } from '../components/media/YouTubeAudioPlayer';

function FloatingHeartsBackground({ icon = '❤️' }: { icon?: string }) {
  // Generate random static particles once
  const particles = useMemo(() => {
    return Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      left: `${(i * 5.5 + 3) % 94}%`,
      delay: `${(i * 0.7) % 8}s`,
      duration: `${9 + (i % 6)}s`,
      size: `${14 + (i % 16)}px`,
      opacity: 0.15 + ((i % 5) * 0.08),
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map(p => (
        <span
          key={p.id}
          className="absolute animate-float-up select-none"
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
            fontSize: p.size,
            opacity: p.opacity,
          }}
        >
          {icon}
        </span>
      ))}
    </div>
  );
}

function OurSongPillPlayer({
  videoId,
  musicUrl,
  title,
  themePrimary,
  playing,
  onTogglePlay,
}: {
  videoId?: string;
  musicUrl?: string;
  title?: string;
  themePrimary: string;
  playing: boolean;
  onTogglePlay: () => void;
}) {
  const cleanId = extractYouTubeId(videoId) || extractYouTubeId(musicUrl);
  if (!cleanId) return null;

  return (
    <div className="fixed top-5 end-5 z-50">
      <button
        type="button"
        onClick={onTogglePlay}
        className="px-4 py-2 rounded-full glass-card flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-white/90 hover:text-white backdrop-blur-xl border border-white/20 hover:border-white/40 shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 group"
        style={{
          boxShadow: `0 4px 20px -2px ${themePrimary}40`,
        }}
        title={playing ? 'إيقاف مؤقت / Pause' : 'تشغيل الأغنية / Play'}
      >
        <span className={`text-base transition-transform ${playing ? 'animate-pulse text-pink-400' : 'group-hover:scale-110'}`}>
          {playing ? '💿' : '♫'}
        </span>
        <span className="max-w-[130px] truncate">{title || 'Our Song'}</span>
        <span
          className={`w-2.5 h-2.5 rounded-full transition-colors ${
            playing ? 'animate-ping' : 'opacity-60'
          }`}
          style={{ backgroundColor: playing ? '#10B981' : themePrimary }}
        />
        <span className="text-white/70">
          {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
        </span>
      </button>
    </div>
  );
}

function DemoBanner({ currentThemeId }: { currentThemeId: string }) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const currentTheme = getThemeById(currentThemeId);

  return (
    <div className="sticky top-0 z-50 bg-black/85 backdrop-blur-xl border-b border-white/15 px-4 py-2.5 shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <span className="text-xl animate-pulse">{currentTheme.particleIcon || '💝'}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 font-semibold border border-pink-500/30">
                {isAr ? 'نموذج تجريبي للقالب' : 'Live Demo'}
              </span>
              <span className="text-white font-bold text-sm">
                {isAr ? currentTheme.nameAr : currentTheme.name}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Theme Switcher Pills */}
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

        {/* CTA to use theme */}
        <Link
          to={`/wizard?theme=${currentTheme.id}`}
          className="btn-primary text-xs py-1.5 px-3.5 shadow-lg shadow-pink-500/30 flex items-center gap-1.5 whitespace-nowrap font-bold"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isAr ? 'اصنع هديتك بهذا القالب' : 'Use This Theme'}</span>
        </Link>
      </div>
    </div>
  );
}

function GiftContent({ gift, isDemo = false }: { gift: Gift; isDemo?: boolean }) {
  const theme = getThemeById(gift.themeId);
  const backgroundStyle = theme.bgGradient || `radial-gradient(ellipse at top, ${theme.bgColor} 0%, #06040d 100%)`;

  const heroBgPhoto = gift.memories?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=1600&auto=format&fit=crop&q=80';

  const { cleanId, isPlaying, togglePlay } = useYouTubeAudio(gift.musicVideoId, gift.musicUrl);

  return (
    <div
      className="min-h-screen text-white relative selection:bg-pink-500 selection:text-white overflow-hidden"
      style={{ background: backgroundStyle }}
    >
      {/* Demo Sticky Bar */}
      {isDemo && <DemoBanner currentThemeId={theme.id} />}

      {/* Floating Translucent Hearts */}
      <FloatingHeartsBackground icon={theme.particleIcon || '❤️'} />

      {/* Top-Right "Our Song" Player Button */}
      {cleanId && (
        <OurSongPillPlayer
          videoId={cleanId}
          title={gift.musicTitle}
          themePrimary={theme.primaryColor}
          playing={isPlaying}
          onTogglePlay={togglePlay}
        />
      )}

      {/* Official YouTube Audio Engine Mount (hidden & non-throttled) */}
      <YouTubeAudioMount cleanId={cleanId} />

      {/* ─── HERO SECTION ─────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20 text-center overflow-hidden z-10">
        {/* Background photo with cinematic vignette overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroBgPhoto}
            alt="Hero romantic background"
            className="w-full h-full object-cover opacity-35 filter blur-[1px] scale-105 transform"
          />
          {/* Dark romantic vignette gradient */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at center, rgba(10, 6, 20, 0.55) 0%, rgba(5, 3, 10, 0.94) 85%, #000000 100%)`,
            }}
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto space-y-6 sm:space-y-8 my-auto">
          {/* Main Couple Names in Calligraphy Script */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="py-4"
          >
            <h1 className="font-cursive text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-white font-normal drop-shadow-[0_4px_30px_rgba(255,255,255,0.4)] flex items-center justify-center gap-3 sm:gap-6 flex-wrap leading-tight">
              <span>{gift.senderName}</span>
              <span className="inline-block animate-heartbeat text-5xl sm:text-6xl md:text-7xl text-red-500 drop-shadow-[0_0_30px_rgba(255,42,112,0.9)]">
                ❤️
              </span>
              <span>{gift.recipientName}</span>
            </h1>
          </motion.div>

          {/* Bilingual Poetic Quotes (matching reference site) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="space-y-3 max-w-2xl mx-auto px-4"
          >
            <p className="font-serif-romantic italic text-lg sm:text-2xl text-white/90 tracking-wide font-normal drop-shadow">
              "{theme.quoteEn || 'Every moment with you became my favorite memory.'}"
            </p>
            <p className="text-base sm:text-xl text-white/80 font-light leading-relaxed">
              "{theme.quoteAr || 'كل لحظة معاكي بقت أجمل ذكرى في حياتي.'}"
            </p>
          </motion.div>

          {/* Hero Action Buttons */}
          <div className="flex gap-4 justify-center flex-wrap pt-4">
            <a
              href="#journey"
              className="btn-primary py-3 px-7 shadow-xl shadow-pink-500/30 flex items-center gap-2 text-sm sm:text-base font-bold rounded-full transition-all hover:scale-105 active:scale-95"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>Open Your Gift</span>
            </a>

            {cleanId && (
              <button
                type="button"
                onClick={togglePlay}
                className="px-6 py-3 rounded-full glass-card flex items-center gap-2.5 text-sm sm:text-base font-semibold text-white/90 hover:text-white backdrop-blur-xl border border-white/20 hover:border-white/40 shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
                style={{
                  boxShadow: `0 4px 20px -2px ${theme.primaryColor}40`,
                }}
              >
                <Music className={`w-4 h-4 ${isPlaying ? 'animate-bounce text-pink-400' : 'text-white/70'}`} />
                <span>{isPlaying ? (gift.musicTitle || 'Playing Our Song') : 'Play Our Song'}</span>
                {isPlaying ? <Pause className="w-3.5 h-3.5 text-white/70 ml-1" /> : <Play className="w-3.5 h-3.5 fill-white ml-1" />}
              </button>
            )}
          </div>

          {/* Start Our Story Down Arrow */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="pt-6"
          >
            <a
              href="#journey"
              className="inline-flex flex-col items-center gap-2 text-white/60 hover:text-white transition-colors group"
            >
              <span className="text-xs uppercase tracking-widest font-medium">Start Our Story</span>
              <ChevronDown className="w-6 h-6 animate-bounce text-pink-400 group-hover:scale-125 transition-transform" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* ─── OUR JOURNEY (TIMELINE) ───────────────────────────────────────── */}
      {gift.showTimeline && (
        <section id="journey" className="py-28 px-4 relative z-10">
          <div className="max-w-5xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-20">
              <h2 className="font-cursive text-5xl sm:text-6xl md:text-7xl text-white drop-shadow-[0_4px_25px_rgba(255,255,255,0.3)]">
                Our Journey
              </h2>
            </div>

            {/* Glowing Laser Timeline */}
            <div className="relative">
              {/* Center Vertical Laser Line */}
              <div
                className="absolute start-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 shadow-lg"
                style={{
                  background: `linear-gradient(to bottom, transparent, ${theme.primaryColor}, ${theme.secondaryColor}, transparent)`,
                  boxShadow: `0 0 15px ${theme.primaryColor}`,
                }}
              />

              <div className="space-y-16 sm:space-y-24">
                {(gift.timelineEntries && gift.timelineEntries.length > 0
                  ? gift.timelineEntries
                  : (gift.memories && gift.memories.length > 0
                      ? gift.memories.slice(0, 6).map((m, idx) => ({
                          id: m.id || idx,
                          title: m.title || (idx === 0 ? 'The First Spark' : (idx === 1 ? 'Falling In Love' : `Our Special Moment #${idx + 1}`)),
                          description: m.caption || (idx === 0 ? 'You are the calm in my chaos. كل الطرق الجميلة انتهت بيكي.' : (idx === 1 ? 'Your smile feels like home. كل لحظة معاكي حياة جديدة.' : 'Every moment with you became my favorite memory.')),
                          imageUrl: m.imageUrl,
                          eventDate: m.memoryDate || (idx === 0 ? 'First Day' : `Chapter ${idx + 1}`),
                          sortOrder: idx,
                        }))
                      : [
                          {
                            id: 1,
                            title: 'The First Spark',
                            description: 'You are the calm in my chaos. كل الطرق الجميلة انتهت بيكي.',
                            imageUrl: heroBgPhoto,
                            eventDate: 'First Day',
                            sortOrder: 0,
                          },
                          {
                            id: 2,
                            title: 'Falling In Love',
                            description: 'Your smile feels like home. وجودك في حياتي نعمة بحمد ربنا عليها كل يوم.',
                            imageUrl: heroBgPhoto,
                            eventDate: 'Forever Begins',
                            sortOrder: 1,
                          },
                        ]
                    )
                ).map((entry, index) => {
                  const isEven = index % 2 === 0;
                  const photoUrl = entry.imageUrl || heroBgPhoto;

                  return (
                    <motion.div
                      key={entry.id || index}
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-50px' }}
                      transition={{ duration: 0.7 }}
                      className={`relative flex flex-col md:flex-row items-center gap-8 ${
                        isEven ? 'md:flex-row' : 'md:flex-row-reverse'
                      }`}
                    >
                      {/* Content Card (Zigzag) */}
                      <div className="w-full md:w-[46%]">
                        <div
                          className="group relative rounded-3xl overflow-hidden glass-card border shadow-2xl backdrop-blur-xl hover:scale-[1.02] transition-all duration-300 min-h-[380px] sm:min-h-[440px] flex flex-col justify-end"
                          style={{
                            borderColor: `${theme.primaryColor}35`,
                            boxShadow: `0 10px 40px -10px ${theme.primaryColor}25`,
                          }}
                        >
                          {/* Photo - Fills entire card */}
                          <img
                            src={photoUrl}
                            alt={entry.title || 'Timeline photo'}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />

                          {/* Dark romantic gradient overlay for high text contrast */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/15 opacity-85 group-hover:opacity-90 transition-opacity" />

                          {/* Content Overlay */}
                          <div className="relative z-10 p-6 sm:p-7 text-center space-y-2">
                            {entry.eventDate && (
                              <span
                                className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase mb-1 backdrop-blur-md border border-white/20 text-white shadow-md"
                                style={{ backgroundColor: `${theme.primaryColor}50` }}
                              >
                                {entry.eventDate}
                              </span>
                            )}
                            {entry.description && (
                              <p className="font-serif-romantic italic text-base sm:text-xl text-white font-normal drop-shadow-md leading-relaxed">
                                "{entry.description}"
                              </p>
                            )}
                            {entry.title && (
                              <p className="text-white/70 text-xs sm:text-sm font-light">
                                {entry.title}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Timeline Center Glowing Orb Node */}
                      <div
                        className="hidden md:flex absolute start-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-2 border-white items-center justify-center z-10 shadow-lg"
                        style={{
                          backgroundColor: theme.primaryColor,
                          boxShadow: `0 0 15px ${theme.primaryColor}`,
                        }}
                      >
                        <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                      </div>

                      {/* Spacer for other side */}
                      <div className="hidden md:block md:w-[46%]" />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── BEAUTIFUL MOMENTS (GALLERY) ──────────────────────────────────── */}
      {gift.showGallery && gift.memories && gift.memories.length > 0 && (
        <section className="py-28 px-4 relative z-10 bg-black/25">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-16">
              <h2 className="font-cursive text-5xl sm:text-6xl md:text-7xl text-white drop-shadow-[0_4px_25px_rgba(255,255,255,0.3)]">
                Beautiful Moments
              </h2>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
              {gift.memories.map((mem, i) => (
                <motion.div
                  key={mem.id || i}
                  initial={{ opacity: 0, scale: 0.92 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: (i % 3) * 0.1, duration: 0.6 }}
                  className="group relative rounded-3xl overflow-hidden glass-card border border-white/10 hover:border-pink-500/50 transition-all duration-500 shadow-2xl"
                  style={{
                    aspectRatio: '4/4.8',
                    boxShadow: `0 10px 30px -10px ${theme.primaryColor}20`,
                  }}
                >
                  <img
                    src={mem.imageUrl}
                    alt={mem.title ?? 'Beautiful moment'}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-75 group-hover:opacity-90 transition-opacity" />

                  <div className="absolute bottom-0 inset-x-0 p-5 space-y-1">
                    {mem.title && (
                      <h4 className="text-white font-bold text-base sm:text-lg drop-shadow">{mem.title}</h4>
                    )}
                    {mem.caption && (
                      <p className="text-white/70 text-xs sm:text-sm line-clamp-2 font-light">
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

      {/* ─── A LETTER TO YOU ──────────────────────────────────────────────── */}
      {gift.showLetter && (
        <section className="py-28 px-4 relative z-10">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="text-center mb-16">
              <h2 className="font-cursive text-5xl sm:text-6xl md:text-7xl text-white drop-shadow-[0_4px_25px_rgba(255,255,255,0.3)]">
                A Letter To You
              </h2>
            </div>

            {/* Letter Glass Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-card p-8 sm:p-14 rounded-3xl border backdrop-blur-2xl relative shadow-2xl text-center space-y-6"
              style={{
                borderColor: `${theme.primaryColor}30`,
                boxShadow: `0 15px 50px -10px ${theme.primaryColor}30`,
              }}
            >
              {/* Romantic English Cursive Quote */}
              <p className="font-cursive text-2xl sm:text-3xl text-pink-300">
                "I never knew love could feel this peaceful until I met you."
              </p>

              {/* Arabic Poetic Letter Body */}
              <div className="text-white/95 leading-[2.2] text-lg sm:text-xl font-light whitespace-pre-wrap max-w-xl mx-auto py-2">
                {gift.letterContent || `${gift.recipientName}،\n\nإنتِ أجمل حاجة حصلتلي في حياتي.\nضحكتك أمان ووجودك راحة لقلبي.\nبحبك بطريقة أكبر من أي كلام.`}
              </div>

              {/* Signature */}
              <div className="pt-4">
                <p
                  className="font-cursive text-3xl sm:text-4xl"
                  style={{ color: theme.primaryColor }}
                >
                  — {gift.letterSignature || gift.senderName}
                </p>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ─── OUR NUMBERS (COUNTERS) ───────────────────────────────────────── */}
      {gift.showCounters && (
        <section className="py-24 px-4 relative z-10 bg-black/20">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="text-center mb-16">
              <h2 className="font-cursive text-5xl sm:text-6xl md:text-7xl text-white drop-shadow-[0_4px_25px_rgba(255,255,255,0.3)]">
                Our Numbers
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {(gift.counters && gift.counters.length > 0
                ? gift.counters
                : [
                    { id: 1, label: 'MEMORIES', targetValue: 1000, icon: 'infinity', sortOrder: 0 },
                    { id: 2, label: 'VIDEOS', targetValue: 50, icon: 'video', sortOrder: 1 },
                    { id: 3, label: 'PHOTOS', targetValue: 150, icon: 'camera', sortOrder: 2 },
                    { id: 4, label: 'DAYS TOGETHER', targetValue: 70, icon: 'heart', sortOrder: 3 },
                  ]
              ).map((counter, i) => {
                const getIcon = () => {
                  switch (counter.icon) {
                    case 'infinity':
                      return <InfinityIcon className="w-7 h-7 text-purple-400 mx-auto mb-3" />;
                    case 'video':
                      return <Video className="w-7 h-7 text-rose-400 mx-auto mb-3" />;
                    case 'camera':
                      return <Camera className="w-7 h-7 text-pink-400 mx-auto mb-3" />;
                    case 'heart':
                      return <Heart className="w-7 h-7 text-red-500 fill-red-500 animate-pulse mx-auto mb-3" />;
                    case 'star':
                      return <Sparkles className="w-7 h-7 text-amber-400 mx-auto mb-3" />;
                    case 'smile':
                      return <span className="text-2xl block mb-2">😊</span>;
                    case 'message':
                      return <span className="text-2xl block mb-2">💌</span>;
                    default:
                      if (i === 0) return <InfinityIcon className="w-7 h-7 text-purple-400 mx-auto mb-3" />;
                      if (i === 1) return <Video className="w-7 h-7 text-rose-400 mx-auto mb-3" />;
                      if (i === 2) return <Camera className="w-7 h-7 text-pink-400 mx-auto mb-3" />;
                      return <Heart className="w-7 h-7 text-red-500 fill-red-500 animate-pulse mx-auto mb-3" />;
                  }
                };

                return (
                  <motion.div
                    key={counter.id || i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="glass-card p-6 sm:p-8 rounded-3xl text-center border shadow-xl hover:scale-105 transition-all duration-300"
                    style={{
                      borderColor: `${theme.primaryColor}25`,
                    }}
                  >
                    {getIcon()}
                    <div className="font-serif-romantic font-bold text-3xl sm:text-4xl text-white mb-1.5">
                      {counter.targetValue.toLocaleString()}+
                    </div>
                    <div className="text-white/60 text-[11px] sm:text-xs font-semibold tracking-widest uppercase">
                      {counter.label}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── FOREVER STARTS WITH YOU (FINAL PROMISE) ──────────────────────── */}
      <section className="py-32 px-4 relative z-10 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Pulsing Red Heart */}
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            className="w-24 h-24 mx-auto flex items-center justify-center text-7xl sm:text-8xl animate-heartbeat drop-shadow-[0_0_35px_rgba(255,42,112,0.9)]"
          >
            ❤️
          </motion.div>

          {/* Calligraphy Title */}
          <h2 className="font-cursive text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white leading-tight drop-shadow-[0_4px_30px_rgba(255,255,255,0.4)]">
            Forever Starts With You ❤️
          </h2>

          {/* Arabic Subtitle */}
          <p className="text-xl sm:text-2xl md:text-3xl text-white/80 font-light">
            إلى الأبد يبدأ بوجودك ❤️
          </p>

          {isDemo && (
            <div className="pt-10">
              <Link
                to={`/wizard?theme=${theme.id}`}
                className="btn-primary text-base sm:text-lg px-8 py-4 sm:px-10 sm:py-5 shadow-2xl shadow-pink-500/40 font-bold inline-flex items-center gap-2.5"
              >
                <Sparkles className="w-5 h-5" />
                <span>اصنع موقعاً مثل هذا لشريك حياتك الآن</span>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────────────────────── */}
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
