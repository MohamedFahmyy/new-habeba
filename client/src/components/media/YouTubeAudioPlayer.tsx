import React, { useEffect, useRef, useState, useCallback } from 'react';
import { extractYouTubeId } from '../../lib/youtube';

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}

interface YouTubeAudioPlayerProps {
  videoId?: string;
  musicUrl?: string;
  onStateChange?: (isPlaying: boolean) => void;
}

export function useYouTubeAudio(videoId?: string, musicUrl?: string) {
  const cleanId = extractYouTubeId(videoId) || extractYouTubeId(musicUrl);
  const playerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const manuallyPausedRef = useRef(false);

  // Play audio safely
  const play = useCallback(() => {
    manuallyPausedRef.current = false;
    if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
      try {
        playerRef.current.unMute();
        playerRef.current.setVolume(75);
        playerRef.current.playVideo();
      } catch (err) {
        console.warn('YouTube playVideo error:', err);
      }
    }
  }, []);

  // Pause audio safely
  const pause = useCallback(() => {
    manuallyPausedRef.current = true;
    if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
      try {
        playerRef.current.pauseVideo();
      } catch (err) {
        console.warn('YouTube pauseVideo error:', err);
      }
    }
    setIsPlaying(false);
  }, []);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, pause, play]);

  useEffect(() => {
    if (!cleanId) return;

    let destroyed = false;
    const containerId = 'yt-bg-audio-container';

    // 1. Ensure YouTube API script is loaded
    function loadYouTubeAPI(): Promise<void> {
      return new Promise((resolve) => {
        if (window.YT && window.YT.Player) {
          resolve();
          return;
        }

        const existingScript = document.getElementById('youtube-iframe-api-script');
        if (!existingScript) {
          const tag = document.createElement('script');
          tag.id = 'youtube-iframe-api-script';
          tag.src = 'https://www.youtube.com/iframe_api';
          document.head.appendChild(tag);
        }

        const prevCallback = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          if (typeof prevCallback === 'function') prevCallback();
          resolve();
        };
      });
    }

    // 2. Initialize Player
    function initPlayer() {
      if (destroyed || !window.YT || !window.YT.Player) return;

      const container = document.getElementById(containerId);
      if (!container) return;

      try {
        playerRef.current = new window.YT.Player(containerId, {
          height: '2',
          width: '2',
          videoId: cleanId,
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            loop: 1,
            playlist: cleanId,
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
            origin: typeof window !== 'undefined' ? window.location.origin : '',
          },
          events: {
            onReady: (event: any) => {
              if (destroyed) return;
              setIsReady(true);
              try {
                event.target.setVolume(75);
                // Attempt autoplay
                event.target.playVideo();
              } catch (e) {}
            },
            onStateChange: (event: any) => {
              if (destroyed) return;
              // YT.PlayerState.PLAYING = 1
              if (event.data === 1) {
                setIsPlaying(true);
              }
              // YT.PlayerState.PAUSED = 2, ENDED = 0
              else if (event.data === 2) {
                setIsPlaying(false);
              } else if (event.data === 0) {
                // Loop song
                event.target.playVideo();
              }
            },
            onError: (err: any) => {
              console.warn('YouTube Audio Player warning/error code:', err.data);
            },
          },
        });
      } catch (err) {
        console.warn('Error creating YT.Player:', err);
      }
    }

    loadYouTubeAPI().then(() => {
      // Allow slight tick for container to mount
      setTimeout(initPlayer, 100);
    });

    // 3. User Gesture Unlock: Any touch or click will unlock audio if browser autoplay was blocked
    const unlockOnGesture = () => {
      if (!manuallyPausedRef.current && playerRef.current && typeof playerRef.current.playVideo === 'function') {
        try {
          playerRef.current.unMute();
          playerRef.current.setVolume(75);
          playerRef.current.playVideo();
        } catch (e) {}
      }
    };

    window.addEventListener('click', unlockOnGesture, { passive: true });
    window.addEventListener('touchstart', unlockOnGesture, { passive: true });
    window.addEventListener('scroll', unlockOnGesture, { passive: true, once: true });
    window.addEventListener('keydown', unlockOnGesture, { passive: true });

    return () => {
      destroyed = true;
      window.removeEventListener('click', unlockOnGesture);
      window.removeEventListener('touchstart', unlockOnGesture);
      window.removeEventListener('scroll', unlockOnGesture);
      window.removeEventListener('keydown', unlockOnGesture);

      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch (e) {}
        playerRef.current = null;
      }
    };
  }, [cleanId]);

  return { cleanId, isPlaying, isReady, togglePlay, play, pause };
}

/**
 * Invisible DOM element where YouTube renders the player
 * Placed in viewport with 2px size and 0.001 opacity so Chrome/Safari never throttles it
 */
export function YouTubeAudioMount({ cleanId }: { cleanId?: string }) {
  if (!cleanId) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        bottom: '0px',
        right: '0px',
        width: '2px',
        height: '2px',
        opacity: 0.001,
        pointerEvents: 'none',
        zIndex: -999,
        overflow: 'hidden',
      }}
    >
      <div id="yt-bg-audio-container" />
    </div>
  );
}
