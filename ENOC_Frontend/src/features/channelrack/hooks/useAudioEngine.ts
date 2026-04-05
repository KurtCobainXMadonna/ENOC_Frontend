import { useEffect, useRef } from "react";
import * as Tone from "tone";

export function useAudioEngine(bpm: number = 120) {
  const playersRef = useRef<Map<string, Tone.Player>>(new Map());
  const sequenceRef = useRef<Tone.Sequence | null>(null);

  const loadSample = async (channelId: string, blobUrl: string) => {
    const player = new Tone.Player(blobUrl).toDestination();
    await Tone.loaded();
    playersRef.current.set(channelId, player);
  };

  const startSequencer = (
    channels: Array<{ id: string; steps: boolean[] }>
  ) => {
    Tone.getTransport().bpm.value = bpm;

    sequenceRef.current = new Tone.Sequence(
      (time, stepIndex) => {
        channels.forEach((channel) => {
          if (channel.steps[stepIndex]) {
            playersRef.current.get(channel.id)?.start(time);
          }
        });
      },
      [...Array(16).keys()],
      "16n"
    );

    sequenceRef.current.start(0);
    Tone.getTransport().start();
  };

  const stopSequencer = () => {
    sequenceRef.current?.stop();
    Tone.getTransport().stop();
  };

  return { loadSample, startSequencer, stopSequencer };
}