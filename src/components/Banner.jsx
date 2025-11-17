import React, { useEffect, useRef, useState } from 'react';

/**
 * Banner component with:
 * - top thin bar containing logo + glare (always visible)
 * - portrait/tall: uses /verticalloop.mp4 and fills viewport (no pink gaps)
 * - wide: uses /loopvideo.mp4 with exact desktop sizing (1500x650) centered
 * - loader shows for 3s; video autoplay muted looped; no controls
 *
 * Added: small "Listen now" audio player at top-right (no autoplay).
 * Custom controls: Prev / Play(stop) / Next + skip tracks.
 */

const MOBILE_ASPECT_THRESHOLD = 1.7;
const SMALL_WIDTH_MAX = 480;

export default function Banner() {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const [loaderHidden, setLoaderHidden] = useState(false);
  const [isPortraitTall, setIsPortraitTall] = useState(false);
  const [videoSrc, setVideoSrc] = useState('/verticalvideo.mp4');

  // Playlist — use the filenames you placed in public/
  const playlist = ['/popular.mp3', '/american.mp3', '/tongue.mp3', '/inusa.mp3'];

  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    function decidePortraitTall() {
      const w = window.innerWidth || document.documentElement.clientWidth;
      const h = window.innerHeight || document.documentElement.clientHeight;
      const ratio = h / Math.max(1, w);
      return ratio >= MOBILE_ASPECT_THRESHOLD || w <= SMALL_WIDTH_MAX;
    }

    const initial = decidePortraitTall();
    setIsPortraitTall(initial);
    setVideoSrc(initial ? '/verticalvideo.mp4' : '/mainvideo.mp4');

    let tid = null;
    function onResize() {
      if (tid) clearTimeout(tid);
      tid = setTimeout(() => {
        const portrait = decidePortraitTall();
        setIsPortraitTall(portrait);
        setVideoSrc(portrait ? '/verticalvideo.mp4' : '/mainvideo.mp4');
      }, 120);
    }
    window.addEventListener('resize', onResize);
    return () => {
      if (tid) clearTimeout(tid);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    v.preload = 'auto';
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.autoplay = true;
    v.setAttribute('aria-hidden', 'true'); // decorative background

    v.play().catch(() => { /* ignore autoplay rejection */ });

    const timer = setTimeout(() => {
      setLoaderHidden(true);
      v.play().catch(() => {});
    }, 3000);

    return () => clearTimeout(timer);
  }, [videoSrc]);

  // When trackIndex changes, load that track into audio element
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.src = playlist[trackIndex] || '';
    a.load();
    if (isPlaying) {
      a.play().catch(() => setIsPlaying(false));
    }
  }, [trackIndex]);

  // Sync isPlaying when audio ends or is paused by native controls
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    function onEnded() {
      if (trackIndex < playlist.length - 1) {
        setTrackIndex((t) => t + 1);
        setIsPlaying(true); // auto-play next
      } else {
        setIsPlaying(false);
      }
    }
    function onPlay() { setIsPlaying(true); }
    function onPause() { setIsPlaying(false); }

    a.addEventListener('ended', onEnded);
    a.addEventListener('play', onPlay);
    a.addEventListener('pause', onPause);

    return () => {
      a.removeEventListener('ended', onEnded);
      a.removeEventListener('play', onPlay);
      a.removeEventListener('pause', onPause);
    };
  }, [trackIndex, playlist.length]);

  function togglePlayPause() {
    const a = audioRef.current;
    if (!a) return;
    if (isPlaying) {
      a.pause();
      setIsPlaying(false);
    } else {
      if (!a.src) {
        a.src = playlist[trackIndex] || '';
        a.load();
      }
      a.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }

  function nextTrack() {
    setTrackIndex((t) => (t + 1) % playlist.length);
    setIsPlaying(true); // automatically play next
  }

  function prevTrack() {
    setTrackIndex((t) => (t - 1 + playlist.length) % playlist.length);
    setIsPlaying(true); // play automatically
  }

  return (
    <>
      <div id="loaderOverlay" className={loaderHidden ? 'hidden' : ''} aria-hidden={loaderHidden ? 'true' : 'false'}>
        <img src="/spining.gif" alt="loading" id="loaderGif" />
      </div>

      <section className={`banner ${isPortraitTall ? 'portrait' : ''}`} id="banner" aria-labelledby="home">
        <div className="bannerTopBar" role="banner" aria-hidden="false">
          <a
            className="logo"
            href="https://www.tiktok.com/@boy.throb"
            target="_blank"
            rel="noreferrer noopener"
            aria-label="BoyThrob TikTok"
          >
            <img src="/boylogo.png" alt="BoyThrob logo" />
          </a>
        </div>

        <div className="bannerPlayer" aria-hidden="false">
          <div className="playerInner" role="region" aria-label="Listen now">
            <div className="playerLabel">Listen now</div>
            <div className="customControls" aria-hidden={false}>
              <button type="button" className="ctrl prev" onClick={(e) => { e.stopPropagation(); prevTrack(); }} aria-label="Previous track" title="Previous">◀︎</button>
              <button type="button" className="ctrl play" onClick={(e) => { e.stopPropagation(); togglePlayPause(); }} aria-pressed={isPlaying} aria-label={isPlaying ? 'Pause' : 'Play'} title={isPlaying ? 'Pause' : 'Play'}>{isPlaying ? '□' : '▶︎'}</button>
              <button type="button" className="ctrl next" onClick={(e) => { e.stopPropagation(); nextTrack(); }} aria-label="Next track" title="Next">▶︎</button>
            </div>

            <audio ref={audioRef} preload="none" style={{ display: 'none' }} aria-hidden="true">
              <source src={playlist[trackIndex]} type="audio/mpeg" />
            </audio>
          </div>
        </div>

        <video
          id="mainVideo"
          ref={videoRef}
          src={videoSrc}
          playsInline
          muted
          loop
          preload="auto"
          autoPlay
          className={`bannerVideo ${isPortraitTall ? 'portrait' : ''}`}
        />
      </section>

      <style>{`
        .bannerPlayer {
          position: absolute;
          top: 10px;
          right: 12px;
          z-index: 12;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          pointer-events: auto;
        }
        .bannerPlayer .playerInner {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.06);
          padding: 8px 10px;
          border-radius: 10px;
          backdrop-filter: blur(6px);
          border: 1px solid rgba(255,255,255,0.06);
        }
        .bannerPlayer .playerLabel {
          font-size: 13px;
          font-weight: 700;
          color: var(--white);
          text-shadow: 0 2px 0 rgba(0,0,0,0.06);
          font-family: 'Luckiest Guy', system-ui, sans-serif;
          white-space: nowrap;
        }
        .customControls { display:flex; gap:6px; align-items:center; }
        .ctrl {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.12);
          color: var(--white);
          padding: 6px 8px;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
          min-width: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .ctrl:active { transform: translateY(1px); }
        .ctrl:focus { outline: 2px solid rgba(255,255,255,0.9); outline-offset: 2px; }
        @media (max-width: 520px) {
          .bannerPlayer { top: 8px; right: 8px; }
          .bannerPlayer .playerInner { padding: 6px 8px; gap:6px; }
          .playerLabel { font-size: 12px; }
          .ctrl { padding: 6px 6px; min-width: 28px; }
        }
        .banner > * { position: relative; z-index: 2; }
      `}</style>
    </>
  );
}
