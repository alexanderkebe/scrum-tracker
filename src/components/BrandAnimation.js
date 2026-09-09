'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import styles from './BrandAnimation.module.css';

function subscribe(callback) {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  motion.addEventListener('change', callback);
  navigator.connection?.addEventListener('change', callback);
  return () => {
    motion.removeEventListener('change', callback);
    navigator.connection?.removeEventListener('change', callback);
  };
}

function allowAnimation() {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    && !navigator.connection?.saveData;
}

const serverSnapshot = () => false;

/** Shared, decorative brand media for lockups and loading states. */
export default function BrandAnimation({ className = '', playOnce = false, onPlaybackEnd, onPlaybackUnavailable }) {
  const animate = useSyncExternalStore(subscribe, allowAnimation, serverSnapshot);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!allowAnimation() || failed) onPlaybackUnavailable?.();
  }, [animate, failed, onPlaybackUnavailable]);

  return <span className={`${styles.animation} ${className}`} aria-hidden="true">
    <Image src="/loader-poster.jpg" alt="" width={256} height={256} unoptimized />
    {animate && !failed && <video
      autoPlay muted loop={!playOnce} playsInline preload="auto" poster="/loader-poster.jpg"
      disablePictureInPicture tabIndex={-1} onEnded={onPlaybackEnd}
      onError={() => setFailed(true)}
      onCanPlay={event => {
        const playback = event.currentTarget.play();
        playback?.catch(() => setFailed(true));
      }}
    >
      <source src="/loader-v1.mp4" type="video/mp4" />
      <source src="/loader-v1.webm" type="video/webm" />
    </video>}
  </span>;
}
