"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Shield, Volume2, VolumeX, Play, Pause, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

// Types for the demo player
interface MuteInterval {
  start: number;
  end: number;
  word: string;
  severity: "mild" | "moderate" | "severe" | "religious";
}

interface TranscriptSegment {
  text: string;
  start: number;
  end: number;
}

interface DemoTranscript {
  segments: TranscriptSegment[];
  profanity_timestamps: MuteInterval[];
  duration: number;
}

type FilterMode = "mute" | "bleep";

// YouTube IFrame API types
declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        config: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (event: { target: YTPlayer }) => void;
            onStateChange?: (event: { data: number; target: YTPlayer }) => void;
            onError?: (event: { data: number }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
        BUFFERING: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  destroy: () => void;
}

// Bleep sound constants
const BLEEP_FREQUENCY = 1000; // 1kHz - classic TV censor bleep
const BLEEP_VOLUME = 0.35;
const BLEEP_ATTACK = 0.008; // 8ms attack - fast like real censor bleeps
const BLEEP_RELEASE = 0.025; // 25ms release - slightly slower to avoid clicks

// Fade timing constants (matching Chrome extension)
const FADE_BUFFER = 0.08; // 80ms - start fading/bleeping before interval begins

// Profanity list for demo (subset of full list)
const PROFANITY_MAP: Map<string, MuteInterval["severity"]> = new Map([
  ["fuck", "severe"],
  ["fucking", "severe"],
  ["fucked", "severe"],
  ["fucker", "severe"],
  ["shit", "moderate"],
  ["shits", "moderate"],
  ["shitty", "moderate"],
  ["bullshit", "moderate"],
  ["ass", "moderate"],
  ["asshole", "moderate"],
  ["bitch", "moderate"],
  ["damn", "mild"],
  ["damned", "mild"],
  ["dammit", "mild"],
  ["hell", "mild"],
  ["crap", "mild"],
  ["piss", "mild"],
  ["goddamn", "religious"],
  ["jesus", "religious"],
  ["christ", "religious"],
]);

// Safe words that contain profanity substrings
const SAFE_WORDS = new Set([
  "class",
  "classes",
  "classic",
  "pass",
  "passed",
  "passing",
  "grass",
  "mass",
  "bass",
  "hello",
  "shell",
  "well",
  "spell",
  "smell",
  "bell",
  "cell",
  "fell",
  "tell",
  "sell",
  "yell",
  "assume",
  "asset",
  "assign",
  "assist",
  "assess",
]);

interface DemoPlayerProps {
  videoId?: string;
  className?: string;
}

export function DemoPlayer({
  videoId = "73_1biulkYk",
  className,
}: DemoPlayerProps) {
  const playerRef = useRef<YTPlayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const checkIntervalRef = useRef<number | null>(null);
  const bleepContextRef = useRef<AudioContext | null>(null);
  const bleepOscillatorRef = useRef<OscillatorNode | null>(null);
  const bleepGainRef = useRef<GainNode | null>(null);

  // Use refs for values that need to be accessed in interval callbacks
  // to avoid stale closure issues
  const isMutedRef = useRef(false);
  const filterEnabledRef = useRef(true);
  const filterModeRef = useRef<FilterMode>("mute");
  const muteIntervalsRef = useRef<MuteInterval[]>([]);

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [filterEnabled, setFilterEnabledState] = useState(true);
  const [filterMode, setFilterModeState] = useState<FilterMode>("mute");
  const [isMuted, setIsMutedState] = useState(false);
  const [muteIntervals, setMuteIntervalsState] = useState<MuteInterval[]>([]);

  // Wrapper setters that keep refs in sync
  const setFilterEnabled = (value: boolean) => {
    filterEnabledRef.current = value;
    setFilterEnabledState(value);
  };
  const setFilterMode = (value: FilterMode) => {
    filterModeRef.current = value;
    setFilterModeState(value);
  };
  const setIsMuted = (value: boolean) => {
    isMutedRef.current = value;
    setIsMutedState(value);
  };
  const setMuteIntervals = (value: MuteInterval[]) => {
    muteIntervalsRef.current = value;
    setMuteIntervalsState(value);
  };
  const [currentFilteredWord, setCurrentFilteredWord] = useState<string | null>(
    null
  );
  const [filterCount, setFilterCount] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [transcript, setTranscript] = useState<DemoTranscript | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch transcript from API
  useEffect(() => {
    async function fetchTranscript() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/demo/transcript?videoId=${videoId}`);
        const data = await response.json();

        if (!response.ok || data.error_code === "TRANSCRIPT_NOT_FOUND") {
          // No transcript available - video needs to be filtered first
          // Show video without filtering capability
          console.log("Demo transcript not available:", data.message);
          setTranscript(null);
          setMuteIntervals([]);
          setError(null); // Don't show error - just no filtering available
          setFilterEnabled(false);
        } else {
          setTranscript(data);
          setMuteIntervals(data.profanity_timestamps || []);
          setError(null);
        }
      } catch (err) {
        console.error("Failed to fetch transcript:", err);
        // Network error - still show video
        setTranscript(null);
        setMuteIntervals([]);
        setError(null);
        setFilterEnabled(false);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTranscript();
  }, [videoId]);

  // Initialize YouTube IFrame API
  useEffect(() => {
    // Load YouTube IFrame API script
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // Wait for API to be ready
    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) {
        setTimeout(initPlayer, 100);
        return;
      }

      playerRef.current = new window.YT.Player("demo-youtube-player", {
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            setIsReady(true);
            setDuration(event.target.getDuration());
          },
          onStateChange: (event) => {
            const state = event.data;
            if (state === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              startMonitoring();
            } else if (
              state === window.YT.PlayerState.PAUSED ||
              state === window.YT.PlayerState.ENDED
            ) {
              setIsPlaying(false);
              stopMonitoring();
              stopBleep();
            }
          },
          onError: (event) => {
            console.error("YouTube player error:", event.data);
            setError("Failed to load video");
          },
        },
      });
    };

    window.onYouTubeIframeAPIReady = initPlayer;

    // Check if API is already loaded
    if (window.YT && window.YT.Player) {
      initPlayer();
    }

    return () => {
      stopMonitoring();
      stopBleep();
      if (bleepContextRef.current) {
        bleepContextRef.current.close();
      }
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [videoId]);

  // Initialize audio context for bleep sound
  const initAudioContext = useCallback(() => {
    if (!bleepContextRef.current) {
      bleepContextRef.current = new AudioContext();
      bleepGainRef.current = bleepContextRef.current.createGain();
      bleepGainRef.current.gain.value = 0;
      bleepGainRef.current.connect(bleepContextRef.current.destination);
    }
    if (bleepContextRef.current.state === "suspended") {
      bleepContextRef.current.resume();
    }
  }, []);

  // Start bleep sound - classic TV censor bleep
  const startBleep = useCallback(() => {
    if (!bleepContextRef.current || !bleepGainRef.current) return;
    if (bleepOscillatorRef.current) return; // Already bleeping

    // Create main oscillator
    const oscillator = bleepContextRef.current.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.value = BLEEP_FREQUENCY;

    // Create second oscillator slightly detuned for richness (like Chrome extension)
    const oscillator2 = bleepContextRef.current.createOscillator();
    oscillator2.type = "sine";
    oscillator2.frequency.value = BLEEP_FREQUENCY * 1.001;

    // Create mixer for second oscillator
    const mixer = bleepContextRef.current.createGain();
    mixer.gain.value = 0.5;

    // Connect oscillators
    oscillator.connect(bleepGainRef.current);
    oscillator2.connect(mixer);
    mixer.connect(bleepGainRef.current);

    // Fast attack envelope
    const now = bleepContextRef.current.currentTime;
    bleepGainRef.current.gain.setValueAtTime(0, now);
    bleepGainRef.current.gain.linearRampToValueAtTime(
      BLEEP_VOLUME,
      now + BLEEP_ATTACK
    );

    // Start both oscillators
    oscillator.start(now);
    oscillator2.start(now);

    // Store references for cleanup
    bleepOscillatorRef.current = oscillator;
    (oscillator as unknown as { _osc2: OscillatorNode; _mixer: GainNode })._osc2 = oscillator2;
    (oscillator as unknown as { _osc2: OscillatorNode; _mixer: GainNode })._mixer = mixer;
  }, []);

  // Stop bleep sound with smooth release
  const stopBleep = useCallback(() => {
    if (
      !bleepContextRef.current ||
      !bleepGainRef.current ||
      !bleepOscillatorRef.current
    )
      return;

    const now = bleepContextRef.current.currentTime;
    bleepGainRef.current.gain.setValueAtTime(
      bleepGainRef.current.gain.value,
      now
    );
    bleepGainRef.current.gain.linearRampToValueAtTime(0, now + BLEEP_RELEASE);

    const oscillator = bleepOscillatorRef.current;
    const osc2 = (oscillator as unknown as { _osc2?: OscillatorNode })._osc2;
    const mixer = (oscillator as unknown as { _mixer?: GainNode })._mixer;

    setTimeout(() => {
      try {
        oscillator.stop();
        oscillator.disconnect();
        if (osc2) {
          osc2.stop();
          osc2.disconnect();
        }
        if (mixer) {
          mixer.disconnect();
        }
      } catch {
        // Already stopped
      }
    }, BLEEP_RELEASE * 1000 + 10);

    bleepOscillatorRef.current = null;
  }, []);

  // Find active mute interval - uses ref to avoid stale closures
  const findActiveInterval = useCallback(
    (time: number): MuteInterval | null => {
      const intervals = muteIntervalsRef.current;
      for (const interval of intervals) {
        if (time >= interval.start && time <= interval.end) {
          return interval;
        }
        if (interval.start > time + FADE_BUFFER) break;
      }
      return null;
    },
    []
  );

  // Find approaching interval (within fade buffer before start)
  const findApproachingInterval = useCallback(
    (time: number): MuteInterval | null => {
      const intervals = muteIntervalsRef.current;
      for (const interval of intervals) {
        const fadeStartTime = interval.start - FADE_BUFFER;
        if (time >= fadeStartTime && time < interval.start) {
          return interval;
        }
        if (interval.start > time + FADE_BUFFER) break;
      }
      return null;
    },
    []
  );

  // Track which intervals have been counted to avoid double-counting
  const countedIntervalsRef = useRef<Set<number>>(new Set());

  // Check current time and apply filtering - uses refs to avoid stale closures
  const checkCurrentTime = useCallback(() => {
    if (!playerRef.current || !filterEnabledRef.current) return;

    const time = playerRef.current.getCurrentTime();
    setCurrentTime(time);

    const activeInterval = findActiveInterval(time);
    const approachingInterval = findApproachingInterval(time);

    if (activeInterval) {
      // We're inside a mute interval
      if (!isMutedRef.current) {
        playerRef.current.mute();
        setIsMuted(true);
        setCurrentFilteredWord(activeInterval.word);

        // Count this interval if not already counted
        const intervalIndex = muteIntervalsRef.current.indexOf(activeInterval);
        if (!countedIntervalsRef.current.has(intervalIndex)) {
          countedIntervalsRef.current.add(intervalIndex);
          setFilterCount((prev) => prev + 1);
          setShowNotification(true);
          setTimeout(() => setShowNotification(false), 2000);
        }

        // Start bleep if in bleep mode
        if (filterModeRef.current === "bleep") {
          startBleep();
        }
      }
    } else if (approachingInterval) {
      // We're approaching an interval - start muting/bleeping early
      if (!isMutedRef.current) {
        playerRef.current.mute();
        setIsMuted(true);
        setCurrentFilteredWord(approachingInterval.word);

        // Count this interval if not already counted
        const intervalIndex = muteIntervalsRef.current.indexOf(approachingInterval);
        if (!countedIntervalsRef.current.has(intervalIndex)) {
          countedIntervalsRef.current.add(intervalIndex);
          setFilterCount((prev) => prev + 1);
          setShowNotification(true);
          setTimeout(() => setShowNotification(false), 2000);
        }

        // Start bleep if in bleep mode
        if (filterModeRef.current === "bleep") {
          startBleep();
        }
      }
    } else {
      // We're outside all intervals
      if (isMutedRef.current) {
        playerRef.current.unMute();
        setIsMuted(false);
        setCurrentFilteredWord(null);
        stopBleep();
      }
    }
  }, [findActiveInterval, findApproachingInterval, startBleep, stopBleep]);

  // Start monitoring playback
  const startMonitoring = useCallback(() => {
    if (checkIntervalRef.current) return;
    initAudioContext();
    checkIntervalRef.current = window.setInterval(checkCurrentTime, 10);
  }, [checkCurrentTime, initAudioContext]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }
  }, []);

  // Re-check current time when filter state changes while playing
  useEffect(() => {
    if (isPlaying && filterEnabled) {
      checkCurrentTime();
    }
  }, [filterEnabled, filterMode, isPlaying, checkCurrentTime]);

  // Handle filter toggle
  const handleFilterToggle = () => {
    const newEnabled = !filterEnabledRef.current;
    setFilterEnabled(newEnabled);

    if (!newEnabled && playerRef.current) {
      // Disable filter - unmute if currently muted
      if (isMutedRef.current) {
        playerRef.current.unMute();
        setIsMuted(false);
        stopBleep();
      }
    }
  };

  // Handle mode toggle
  const handleModeToggle = () => {
    const newMode = filterModeRef.current === "mute" ? "bleep" : "mute";
    setFilterMode(newMode);

    if (isMutedRef.current) {
      if (newMode === "bleep") {
        startBleep();
      } else {
        stopBleep();
      }
    }
  };

  // Handle play/pause
  const handlePlayPause = () => {
    if (!playerRef.current || !isReady) return;
    initAudioContext();

    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  // Handle restart
  const handleRestart = () => {
    if (!playerRef.current || !isReady) return;
    playerRef.current.seekTo(0, true);
    setFilterCount(0);
    setCurrentTime(0);
    countedIntervalsRef.current.clear(); // Reset counted intervals
  };

  // Handle seek
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current || !isReady || duration === 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;

    playerRef.current.seekTo(newTime, true);
    setCurrentTime(newTime);
  };

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate progress percentage
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (error) {
    return (
      <div
        className={cn(
          "relative rounded-2xl border border-border bg-card shadow-2xl overflow-hidden",
          className
        )}
      >
        <div className="aspect-video bg-[#0F0F0F] flex items-center justify-center">
          <p className="text-white/60">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Glow effect behind player */}
      <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-3xl blur-2xl opacity-50" />

      {/* Browser Chrome */}
      <div className="relative rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Browser Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
            <div className="w-3 h-3 rounded-full bg-[#28CA41]" />
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-background/80 border border-border max-w-md w-full">
              <Shield className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-sm text-muted-foreground truncate">
                youtube.com/watch?v={videoId}
              </span>
            </div>
          </div>
          <div className="w-16" />
        </div>

        {/* Video Player */}
        <div className="relative aspect-video bg-[#0F0F0F]">
          {/* YouTube iframe */}
          <div
            id="demo-youtube-player"
            className="absolute inset-0 w-full h-full"
          />

          {/* Loading overlay */}
          {(isLoading || !isReady) && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white/60 text-sm">Loading demo...</p>
              </div>
            </div>
          )}

          {/* Play overlay when not playing */}
          {isReady && !isPlaying && !isLoading && (
            <div
              className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 cursor-pointer"
              onClick={handlePlayPause}
            >
              <div className="play-button glow-red">
                <svg viewBox="0 0 24 24" className="w-8 h-8">
                  <path d="M8 5v14l11-7z" fill="white" />
                </svg>
              </div>
            </div>
          )}

          {/* SafePlay Active Badge */}
          {filterEnabled && (
            <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-medium shadow-lg z-20">
              <Shield className="w-4 h-4" />
              <span>SafePlay Active</span>
            </div>
          )}

          {/* Filter notification popup */}
          {showNotification && currentFilteredWord && (
            <div className="absolute top-4 left-4 flex items-center gap-3 px-4 py-2.5 rounded-lg bg-black/80 backdrop-blur-sm border border-white/10 text-white animate-fade-in z-20">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <VolumeX className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Profanity filtered</p>
                <p className="text-xs text-white/60">
                  Word {filterMode === "bleep" ? "bleeped" : "muted"} at{" "}
                  {formatTime(currentTime)}
                </p>
              </div>
            </div>
          )}

          {/* Controls Bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 z-20">
            {/* Progress Bar */}
            <div
              className="relative h-1 bg-white/30 rounded-full mb-3 group cursor-pointer hover:h-1.5 transition-all"
              onClick={handleSeek}
            >
              {/* Progress */}
              <div
                className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              >
                {/* Scrubber */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full scale-0 group-hover:scale-100 transition-transform" />
              </div>
              {/* Mute interval markers */}
              {muteIntervals.map((interval, i) => (
                <div
                  key={i}
                  className="absolute top-0 h-full bg-white/80 rounded-full"
                  style={{
                    left: `${(interval.start / duration) * 100}%`,
                    width: `${Math.max(
                      0.5,
                      ((interval.end - interval.start) / duration) * 100
                    )}%`,
                  }}
                />
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                {/* Play/Pause */}
                <button
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  onClick={handlePlayPause}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" fill="white" />
                  ) : (
                    <Play className="w-6 h-6" fill="white" />
                  )}
                </button>
                {/* Restart */}
                <button
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  onClick={handleRestart}
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
                {/* Volume indicator */}
                <div className="p-1">
                  {isMuted ? (
                    <VolumeX className="w-5 h-5 text-primary" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </div>
                {/* Time */}
                <span className="text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              {/* Center - Filter info */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">
                  {muteIntervals.length} profanities detected
                </span>
              </div>

              {/* Right - Filter controls */}
              <div className="flex items-center gap-2">
                {/* Mode toggle */}
                <button
                  className={cn(
                    "text-xs px-2 py-1 rounded font-medium transition-colors",
                    filterEnabled
                      ? "bg-primary/20 text-primary"
                      : "bg-white/10 text-white/60"
                  )}
                  onClick={handleModeToggle}
                  disabled={!filterEnabled}
                >
                  {filterMode === "bleep" ? "BLEEP" : "MUTE"} MODE
                </button>
                {/* Filter toggle */}
                <button
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors",
                    filterEnabled
                      ? "bg-primary text-white"
                      : "bg-white/20 text-white"
                  )}
                  onClick={handleFilterToggle}
                >
                  <Shield className="w-3.5 h-3.5" />
                  {filterEnabled ? "ON" : "OFF"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive hint */}
      <p className="text-center text-sm text-muted-foreground mt-4">
        {muteIntervals.length > 0 ? (
          <>
            Toggle the filter to see the difference. Try both{" "}
            <span className="font-medium text-foreground">mute</span> and{" "}
            <span className="font-medium text-foreground">bleep</span> modes.
          </>
        ) : (
          <>
            Watch how SafePlay filters profanity in real-time.{" "}
            <span className="font-medium text-foreground">
              {muteIntervals.length} profane words detected in this video.
            </span>
          </>
        )}
      </p>
    </div>
  );
}
