/**
 * YouTube Utility Helper
 * Extracts video IDs from all formats of YouTube links (desktop, mobile, shorts, embeds, shares, etc.)
 */
export function extractYouTubeId(url?: string | null): string {
  if (!url) return '';
  const trimmed = url.trim();

  // If already an 11-char YouTube ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Common YouTube URL patterns:
  // - youtube.com/watch?v=ID
  // - youtube.com/watch?feature=...&v=ID
  // - youtu.be/ID
  // - youtube.com/embed/ID
  // - youtube.com/shorts/ID
  // - music.youtube.com/watch?v=ID
  const match = trimmed.match(
    /(?:youtube(?:-nocookie)?\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/ ]{11})/i
  );

  return match ? match[1] : '';
}

/**
 * Builds a reliable embed URL for background music playback
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  const cleanId = extractYouTubeId(videoId);
  if (!cleanId) return '';

  const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : '';
  const params = new URLSearchParams({
    autoplay: '1',
    controls: '0',
    loop: '1',
    playlist: cleanId,
    enablejsapi: '1',
    playsinline: '1',
    rel: '0',
    modestbranding: '1',
  });

  if (origin && !origin.startsWith('file:')) {
    params.set('origin', origin);
  }

  return `https://www.youtube-nocookie.com/embed/${cleanId}?${params.toString()}`;
}
