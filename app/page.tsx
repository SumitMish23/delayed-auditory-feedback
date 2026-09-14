"use client";

import { useEffect, useRef, useState } from "react";
import Link from 'next/link';
import { getStoredAudios, SavedAudio, storeAudio } from './core/audio-db';
const presets = [
  { name: "Gentle", value: 120, description: "A comfortable starting point" },
  { name: "Standard", value: 250, description: "Classic DAF timing" },
  { name: "Challenge", value: 400, description: "Push your fluency" }
];

export default function Home() {
  const [delay, setDelay] = useState(250);
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [inputLevel, setInputLevel] = useState(0);
  const [error, setError] = useState("");
  const [savedAudios, setSavedAudios] = useState<SavedAudio[]>([]);
  const [playingAudio, setPlayingAudio] = useState<number | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const audioRef = useRef<{ context: AudioContext; source: MediaStreamAudioSourceNode; delay: DelayNode; gain: GainNode; analyser: AnalyserNode; stream: MediaStream } | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => () => stopSession(), []);

  useEffect(() => {
    getStoredAudios().then(setSavedAudios).catch(() => {
      setSavedAudios([]);
    });
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.delay.delayTime.setTargetAtTime(delay / 1000, audioRef.current.context.currentTime, 0.02);
  }, [delay]);

  function animateLevel() {
    const analyser = audioRef.current?.analyser;
    if (!analyser) return;
    const data = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(data);
    const peak = Math.max(...Array.from(data).map((value) => Math.abs(value - 128))) / 128;
    setInputLevel(Math.min(100, Math.round(peak * 180)));
    animationRef.current = requestAnimationFrame(animateLevel);
  }

  async function toggleSession() {
    if (isActive) {
      const stream = audioRef.current?.stream;
      recording('stop', stream);
      stopSession();
      return;
    }
    try {
      setError("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recording('start', stream);
      const context = new AudioContext();
      const source = context.createMediaStreamSource(stream);
      const delayNode = context.createDelay(1);
      const gain = context.createGain();
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      delayNode.delayTime.value = delay / 1000;
      gain.gain.value = isMuted ? 0 : 0.85;
      source.connect(delayNode).connect(gain).connect(analyser).connect(context.destination);
      audioRef.current = { context, source, delay: delayNode, gain, analyser, stream };
      setIsActive(true);
      animateLevel();
    } catch {
      setError("Microphone access is needed to start. Check your browser permissions and try again !");
    }
  }

  function stopSession() {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    const audio = audioRef.current;
    if (audio) {
      audio.stream.getTracks().forEach((track) => track.stop());
      audio.source.disconnect();
      audio.delay.disconnect();
      audio.gain.disconnect();
      audio.context.close();
      audioRef.current = null;
    }
    setInputLevel(0);
    setIsActive(false);
  }



  function recording(action: 'start' | 'stop', stream: MediaStream | undefined) {
    if (!stream) return;
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (event) => {
      const audioBlob = new Blob([event.data], { type: "audio/webm" });
      const newAudio = {
        name: `recorded-${new Date().toISOString()}.webm`,
        blob: audioBlob,
      };
      storeAudio(newAudio).then((savedAudio) => {
        setSavedAudios((currentAudios) => [...currentAudios, savedAudio]);
      }).catch(() => {
        setError("The recording could not be saved. Please try again.");
      });
    };
    if (action === 'start') {
      recorder.start();
    } else {
      recorder.stop();
    }
  }

  function toggleMute() {
    const next = !isMuted;
    setIsMuted(next);
    if (audioRef.current) audioRef.current.gain.gain.setTargetAtTime(next ? 0 : 0.85, audioRef.current.context.currentTime, 0.02);
  }

  function toggleSavedAudio(index: number) {
    const player = audioPlayerRef.current;
    if (!player) return;
    if (playingAudio === index) {
      player.pause();
      setPlayingAudio(null);
      return;
    }
    player.src = savedAudios[index].url;
    void player.play();
    setPlayingAudio(index);
  }

  return (
    <main className="shell">
      <nav className="nav">
        <div className="brand"><span className="brand-mark">◌</span><span>echo<span className="brand-accent">delay</span></span></div>
        <Link className="nav-status" href="/faq">What is DAF ?</Link>
      </nav>

      <section className="hero">
        <h1>DELAYED <em>AUDITORY</em> FEEDBACK.</h1>
        <p className="hero-copy">Hear yourself with a gentle delay. Build awareness, pacing, and confidence one phrase at a time.</p>
      </section>

      <section className="workspace">
        <div className="control-card">
          <div className="card-heading">
            <div><span className="section-label">01 / SET YOUR DELAY</span><h2>Timing is everything.</h2></div>
            <span className="delay-value">{delay}<small>ms</small></span>
          </div>
          <input aria-label="Delay in milliseconds" className="range" type="range" min="50" max="600" step="10" value={delay} onChange={(event) => setDelay(Number(event.target.value))} style={{ "--progress": `${((delay - 50) / 550) * 100}%` } as React.CSSProperties} />
          <div className="range-labels"><span>50 ms</span><span>600 ms</span></div>
          <div className="presets">
            {presets.map((preset) => <button className={delay === preset.value ? "preset selected" : "preset"} key={preset.name} onClick={() => setDelay(preset.value)}><span>{preset.name}</span><small>{preset.value} ms</small></button>)}
          </div>
        </div>

        <div className={isActive ? "monitor-card active" : "monitor-card"}>
          <div className="monitor-top"><span className="section-label">02 / MONITOR</span><span className="live-pill">{isActive ? "● LIVE" : "○ STANDBY"}</span></div>
          <div className="waveform" aria-label="Microphone input level">
            {Array.from({ length: 34 }).map((_, index) => <span key={index} style={{ height: `${isActive ? Math.max(8, Math.min(86, inputLevel * (0.35 + ((index * 17) % 9) / 10))) : 8}%`, opacity: isActive ? 0.35 + (index % 4) / 8 : 0.22 }} />)}
          </div>
          <div className="monitor-footer"><span>{isActive ? "Listening for your voice" : "Start a session to begin"}</span><span>{isActive ? `${inputLevel}%` : "—"}</span></div>
        </div>
      </section>

      <section className="action-row">
        <button className={isActive ? "start-button stop" : "start-button"} onClick={toggleSession}><span className="button-icon">{isActive ? "■" : "▶"}</span>{isActive ? "End session" : "Start session"}</button>
        <button className="mute-button" onClick={toggleMute} aria-pressed={isMuted}><span>{isMuted ? "◌" : "◉"}</span>{isMuted ? "Sound off" : "Sound on"}</button>
        <div className="privacy-note"><span>⌁</span><p><strong>Your voice stays here.</strong><br />Audio is processed locally and never recorded.</p></div>
      </section>
      {error && <p className="error-message">{error}</p>}

      <section className="recordings-section">
        <div className="recordings-heading">
          <div><span className="section-label">03 / RECORDINGS</span><h2>Your practice archive.</h2></div>
          <span className="recordings-count">{savedAudios.length} RECORDINGS</span>
        </div>
        {savedAudios.length === 0 ? (
          <div className="recordings-empty"><span className="empty-mark">◌</span><p>Your saved practice takes will appear here.</p></div>
        ) : (
          <div className="recordings-list">
            {savedAudios.map((audio, index) => (
              <div className={playingAudio === index ? "recording-row playing" : "recording-row"} key={`${audio.url}-${index}`}>
                <button className="play-button" onClick={() => toggleSavedAudio(index)} aria-label={`${playingAudio === index ? "Pause" : "Play"} ${audio.name}`}>
                  {playingAudio === index ? "Ⅱ" : "▶"}
                </button>
                <div className="recording-details"><strong>{audio.name.replace(".webm", "")}</strong><span>Saved locally · WebM audio</span></div>
                <span className="recording-index">{String(index + 1).padStart(2, "0")}</span>
              </div>
            ))}
          </div>
        )}
        <audio ref={audioPlayerRef} onEnded={() => setPlayingAudio(null)} />
      </section>

      <footer><span>Practice mindfully · Take breaks when you need them. </span></footer>
    </main>
  );
}
