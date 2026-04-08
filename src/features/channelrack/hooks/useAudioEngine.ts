import { useRef, useCallback, useEffect } from 'react';

export interface AudioLoopChannelState {
  channelId: string;
  soundId: string;
  active: boolean;
  volume: number;
  steps: boolean[];
}

const audioCtxRef = { current: null as AudioContext | null };

function getAudioContext(): AudioContext {
  if (!audioCtxRef.current) {
    audioCtxRef.current = new AudioContext();
  }
  return audioCtxRef.current;
}

export const useAudioEngine = () => {
  const bufferCache = useRef<Map<string, AudioBuffer>>(new Map());
  const playbackRef = useRef<number | null>(null);
  const currentStepRef = useRef(0);
  const previewSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const channelsRef = useRef<AudioLoopChannelState[]>([]);
  const soundUrlMapRef = useRef<Map<string, string>>(new Map());

  const loadBuffer = useCallback(async (url: string): Promise<AudioBuffer | null> => {
    if (bufferCache.current.has(url)) {
      return bufferCache.current.get(url)!;
    }

    try {
      const ctx = getAudioContext();
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      bufferCache.current.set(url, audioBuffer);
      return audioBuffer;
    } catch (err) {
      console.error('[Audio] Failed to load:', url, err);
      return null;
    }
  }, []);

  const playOnce = useCallback(async (url: string, volume = 1.0): Promise<AudioBufferSourceNode | null> => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const buffer = await loadBuffer(url);
    if (!buffer) return null;

    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    gain.gain.value = volume;
    source.connect(gain).connect(ctx.destination);
    source.start(0);
    return source;
  }, [loadBuffer]);

  const previewSound = useCallback(async (url: string) => {
    if (previewSourceRef.current) {
      try {
        previewSourceRef.current.stop();
      } catch {
        // already stopped
      }
      previewSourceRef.current = null;
    }

    const source = await playOnce(url, 1.0);
    if (!source) return;

    previewSourceRef.current = source;
    setTimeout(() => {
      try {
        source.stop();
      } catch {
        // already stopped
      }
      if (previewSourceRef.current === source) {
        previewSourceRef.current = null;
      }
    }, 3000);

    source.onended = () => {
      if (previewSourceRef.current === source) {
        previewSourceRef.current = null;
      }
    };
  }, [playOnce]);

  const updateLoopData = useCallback((channels: AudioLoopChannelState[], soundUrlMap: Map<string, string>) => {
    channelsRef.current = channels;
    soundUrlMapRef.current = soundUrlMap;
  }, []);

  const stopLoop = useCallback(() => {
    if (playbackRef.current !== null) {
      clearInterval(playbackRef.current);
      playbackRef.current = null;
    }
    currentStepRef.current = 0;
  }, []);

  const startLoop = useCallback((bpm: number) => {
    stopLoop();
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }

    const stepDuration = (60 / bpm / 4) * 1000;
    currentStepRef.current = 0;

    const tick = () => {
      const step = currentStepRef.current;
      const channels = channelsRef.current;
      const soundUrlMap = soundUrlMapRef.current;

      for (const ch of channels) {
        if (!ch.active || !ch.steps[step]) continue;
        const url = soundUrlMap.get(ch.soundId);
        if (url) {
          void playOnce(url, ch.volume);
        }
      }

      currentStepRef.current = (step + 1) % 16;
    };

    tick();
    playbackRef.current = window.setInterval(tick, stepDuration);
  }, [playOnce, stopLoop]);

  useEffect(() => {
    return () => stopLoop();
  }, [stopLoop]);

  return { previewSound, playOnce, startLoop, stopLoop, updateLoopData, currentStep: currentStepRef };
};