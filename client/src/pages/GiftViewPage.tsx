import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Heart, Music, MapPin, Play, Pause } from 'lucide-react';
import { useState, useRef } from 'react';
import { giftsApi } from '../services/api';
import type { Gift } from '../types';
import { getThemeById } from '../lib/themes';

function YouTubeMusicPlayer({ videoId, title }: { videoId: string; title?: string }) {
  const [playing, setPlaying] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <div className="fixed bottom-6 end-6 z-50">
      <div className="glass-card p-4 flex items-center gap-3 shadow-2xl shadow-pink-500/20">
        <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center ${playing ? 'animate-spin' : ''}`}
          style={{ animationDuration: '3s' }}>
          <Music className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white/70 text-xs">♪ Our Song</p>
          <p className="text-white text-sm font-medium truncate max-w-[140px]">{title ?? 'Playing...'}</p>
        </div>
        <button
          onClick={() => setPlaying(!playing)}
          className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center hover:bg-pink-400 transition-colors"
        >
          {playing ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" />}
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

function GiftContent({ gift }: { gift: Gift }) {
  const theme = getThemeById(gift.themeId);
  const [letterOpen, setLetterOpen] = useState(false);

  return (
    <div className={`min-h-screen ${theme.bgColor !== '#0d0d1a' ? '' : 'bg-[#0d0d1a]'}`}
      style={{ background: `linear-gradient(135deg, ${theme.bgColor} 0%, #1a0010 100%)` }}>

      {/* YouTube Music Player */}
      {gift.musicVideoId && (
        <YouTubeMusicPlayer videoId={gift.musicVideoId} title={gift.musicTitle} />
      )}

      {/* Welcome Screen */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl opacity-20"
            style={{ background: theme.primaryColor }} />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full blur-3xl opacity-15"
            style={{ background: theme.secondaryColor }} />
        </div>
        <div className="text-center relative z-10 max-w-2xl mx-auto">
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }}
            className="text-8xl mb-6 animate-heartbeat inline-block"
          >
            ❤️
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
            className="text-xl text-white/60 mb-3 font-light"
          >
            {gift.senderName} → {gift.recipientName}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}
            className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight"
          >
            {gift.title}
          </motion.h1>
          {gift.welcomeMessage && (
            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3 }}
              className="text-lg text-white/70 leading-relaxed"
            >
              {gift.welcomeMessage}
            </motion.p>
          )}
        </div>
      </section>

      {/* Timeline */}
      {gift.showTimeline && gift.timelineEntries && gift.timelineEntries.length > 0 && (
        <section className="py-20 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-white text-center mb-16">Our Story ❤️</h2>
            <div className="relative">
              <div className="absolute start-8 top-0 bottom-0 w-0.5 opacity-30"
                style={{ background: theme.primaryColor }} />
              <div className="space-y-12">
                {gift.timelineEntries.map((entry, i) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="relative flex gap-6"
                  >
                    <div className="w-16 h-16 rounded-full border-2 flex items-center justify-center shrink-0 z-10 bg-[#0d0d1a]"
                      style={{ borderColor: theme.primaryColor }}>
                      <Heart className="w-6 h-6" style={{ color: theme.primaryColor }} />
                    </div>
                    <div className="glass-card p-6 flex-1">
                      <p className="text-xs font-medium mb-1 opacity-60" style={{ color: theme.primaryColor }}>{entry.eventDate}</p>
                      <h3 className="text-white font-bold text-xl mb-2">{entry.title}</h3>
                      {entry.description && <p className="text-white/60 leading-relaxed">{entry.description}</p>}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Gallery */}
      {gift.showGallery && gift.memories && gift.memories.length > 0 && (
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-white text-center mb-12">Our Memories 📸</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {gift.memories.map((mem, i) => (
                <motion.div
                  key={mem.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative aspect-square overflow-hidden rounded-2xl glass-card"
                >
                  {mem.imageUrl && !mem.imageUrl.includes('/placeholder') ? (
                    <img
                      src={mem.imageUrl}
                      alt={mem.title ?? 'Memory'}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/5">
                      <Heart className="w-8 h-8 text-pink-400/40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-3 start-3 end-3">
                      {mem.title && <p className="text-white font-medium text-sm">{mem.title}</p>}
                      {mem.caption && <p className="text-white/60 text-xs mt-0.5">{mem.caption}</p>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Love Letter */}
      {gift.showLetter && gift.letterContent && (
        <section className="py-20 px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white text-center mb-12">
              {gift.letterTitle ?? 'A Letter For You 💌'}
            </h2>
            <div className="relative">
              {/* Envelope */}
              <motion.div
                className="cursor-pointer"
                onClick={() => setLetterOpen(true)}
                animate={letterOpen ? { opacity: 0, scale: 0.8 } : { opacity: 1, scale: 1 }}
              >
                {!letterOpen && (
                  <div className="glass-card p-16 text-center">
                    <div className="text-6xl mb-4">💌</div>
                    <p className="text-white/60">Click to open your love letter</p>
                    <p className="text-white/40 text-sm mt-2">اضغط لفتح رسالة الحب</p>
                  </div>
                )}
              </motion.div>

              {letterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="glass-card p-8"
                >
                  <div className="text-4xl text-center mb-6">💌</div>
                  <div className="text-white/80 leading-relaxed whitespace-pre-wrap text-lg">
                    {gift.letterContent}
                  </div>
                  {gift.letterSignature && (
                    <p className="text-right mt-8 text-xl font-bold" style={{ color: theme.primaryColor }}>
                      — {gift.letterSignature}
                    </p>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Counters */}
      {gift.showCounters && gift.counters && gift.counters.length > 0 && (
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white text-center mb-12">By The Numbers 🔢</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {gift.counters.map((counter) => (
                <div key={counter.id} className="glass-card p-6 text-center">
                  <div className="text-4xl font-bold mb-2" style={{ color: theme.primaryColor }}>
                    {counter.targetValue.toLocaleString()}
                  </div>
                  <div className="text-white/60 text-sm">{counter.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Surprise / Final Promise */}
      {gift.showSurprise && gift.surpriseTitle && (
        <section className="py-20 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="text-7xl mb-8 animate-heartbeat">💝</div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">{gift.surpriseTitle}</h2>
            {gift.surpriseMessage && (
              <p className="text-xl text-white/70 leading-relaxed">{gift.surpriseMessage}</p>
            )}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-12 text-center text-white/20 text-sm border-t border-white/5">
        <p>Made with <Heart className="w-3 h-3 inline text-pink-400 fill-pink-400" /> on Habeba</p>
      </footer>
    </div>
  );
}

export default function GiftViewPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['gift', 'public', slug],
    queryFn: () => giftsApi.getPublic(slug!).then(r => r.data.gift),
    enabled: !!slug,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d1a] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-heartbeat">❤️</div>
          <p className="text-white/50">Preparing your romantic gift...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    const status = (error as any)?.response?.status;
    return (
      <div className="min-h-screen bg-[#0d0d1a] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">{status === 402 ? '🔒' : '💔'}</div>
          <h1 className="text-2xl font-bold text-white mb-3">
            {status === 402 ? 'Gift Not Yet Activated' : 'Gift Not Found'}
          </h1>
          <p className="text-white/50">
            {status === 402
              ? 'This gift link has not been activated yet. Please ask the creator to complete the activation.'
              : 'This romantic gift page could not be found or may be private.'}
          </p>
        </div>
      </div>
    );
  }

  if (!data) return null;
  return <GiftContent gift={data} />;
}
