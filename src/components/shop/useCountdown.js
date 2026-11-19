import { useEffect, useState } from 'react';

// Counts down from a number of seconds reported by the server (so the deadline doesn't depend on
// the phone's clock being right). Re-syncs whenever the server sends a new value.
export const useCountdown = (secondsFromServer) => {
  const [remaining, setRemaining] = useState(secondsFromServer);
  const [source, setSource] = useState(secondsFromServer);

  // Adopt a new server value in the same render it arrives, so the UI never shows a stale value.
  if (secondsFromServer !== source) {
    setSource(secondsFromServer);
    setRemaining(secondsFromServer);
  }

  useEffect(() => {
    if (secondsFromServer === null || secondsFromServer === undefined) return undefined;
    const startedAt = Date.now();
    const timer = setInterval(() => {
      setRemaining(Math.max(0, secondsFromServer - Math.floor((Date.now() - startedAt) / 1000)));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsFromServer]);

  return remaining;
};

export const formatDuration = (seconds) => {
  if (seconds === null || seconds === undefined) return '';
  const s = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};
