'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import AppLoader from './AppLoader';
import styles from './StartupSplash.module.css';

const STORAGE_KEY = 'scrum-tracker:splash-v1:completed';
const FULL_PLAYS = 3;

function completedPlays() {
  const value = Number(localStorage.getItem(STORAGE_KEY));
  return Number.isInteger(value) && value > 0 ? value : 0;
}

// The root layout persists during navigation, so a visit plays at most once.
export default function StartupSplash({ children }) {
  const [phase, setPhase] = useState('checking');
  const finished = useRef(false);

  useEffect(() => {
    const check = setTimeout(() => {
      try {
        setPhase(completedPlays() < FULL_PLAYS ? 'playing' : 'done');
      } catch {
        // If storage is blocked, avoid imposing an uncountable delay every visit.
        setPhase('done');
      }
    }, 0);
    return () => clearTimeout(check);
  }, []);

  const dismiss = useCallback(() => setPhase('done'), []);
  const complete = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    try {
      localStorage.setItem(STORAGE_KEY, String(Math.min(FULL_PLAYS, completedPlays() + 1)));
    } catch { /* Storage may become unavailable during playback. */ }
    dismiss();
  }, [dismiss]);

  useEffect(() => {
    if (phase !== 'playing') return;
    // Broken/stalled media must not lock someone out of the app.
    const watchdog = setTimeout(dismiss, 30000);
    return () => clearTimeout(watchdog);
  }, [phase, dismiss]);

  const visible = phase !== 'done';
  return <>
    <div className={visible ? styles.pendingContent : undefined} inert={visible} aria-hidden={visible || undefined}>
      {children}
    </div>
    {visible && <div className={styles.overlay}>
      {phase === 'playing' && <AppLoader
        fullScreen label="Welcome to Scrum Tracker" playOnce
        onPlaybackEnd={complete} onPlaybackUnavailable={dismiss}
      />}
    </div>}
  </>;
}
