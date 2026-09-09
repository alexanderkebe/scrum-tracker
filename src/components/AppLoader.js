'use client';

import BrandAnimation from './BrandAnimation';
import styles from './AppLoader.module.css';

/** One shared asset for page, splash, and button loading states. */
export default function AppLoader({ label = 'Loading…', fullScreen = false, inline = false, playOnce = false, onPlaybackEnd, onPlaybackUnavailable }) {
  return <span className={`${styles.loader} ${fullScreen ? styles.fullScreen : ''} ${inline ? styles.inline : ''}`} role="status" aria-live="polite">
    <BrandAnimation className={styles.art} playOnce={playOnce} onPlaybackEnd={onPlaybackEnd} onPlaybackUnavailable={onPlaybackUnavailable} />
    <span className={styles.label}>{label}</span>
  </span>;
}
