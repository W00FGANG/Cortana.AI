"use client";

import { useEffect, useState, useRef } from "react";
import { useTheme } from "next-themes";
import {
  Volume1,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Bell,
  BellRing,
  BellOff,
  ShieldCheck,
  Activity,
  Check,
  RotateCcw,
  Sparkles,
  Sliders,
  Sun,
  Moon,
  Monitor,
  RefreshCw,
  Info,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  HelpCircle,
  Radio,
  SlidersHorizontal,
  Lock,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";

interface AgentSummary {
  id: string;
  name: string;
  role: string;
  avatar?: string | null;
}

interface SettingsClientProps {
  agents: AgentSummary[];
}

export function SettingsClient({ agents }: SettingsClientProps) {
  const { theme, setTheme } = useTheme();

  // Voice Assistant Settings
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceRate, setVoiceRate] = useState(1.0);
  const [voicePitch, setVoicePitch] = useState(1.0);
  const [voiceName, setVoiceName] = useState("");
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [isTestingVoice, setIsTestingVoice] = useState(false);

  // Sound & Notifications
  const [audioChimes, setAudioChimes] = useState(true);
  const [chimeVolume, setChimeVolume] = useState(70);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const [showBrowserGuide, setShowBrowserGuide] = useState(false);
  const [inWebNotification, setInWebNotification] = useState<{
    title: string;
    body: string;
    time: string;
  } | null>(null);

  // Operational Guardrails
  const [stalledDetection, setStalledDetection] = useState(true);
  const [strictApprovals, setStrictApprovals] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(5);

  // Appearance & Display
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");

  // Diagnostics & Status
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Mount state to prevent initial hydration toggle animations
  const [isMounted, setIsMounted] = useState(false);

  // Load saved preferences on client mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const v = localStorage.getItem("corvana_voice_assistant");
      if (v !== null) setVoiceEnabled(v !== "false");

      const r = localStorage.getItem("corvana_voice_rate");
      if (r) setVoiceRate(parseFloat(r) || 1.0);

      const p = localStorage.getItem("corvana_voice_pitch");
      if (p) setVoicePitch(parseFloat(p) || 1.0);

      const vn = localStorage.getItem("corvana_voice_name");
      if (vn) setVoiceName(vn);

      const as = localStorage.getItem("corvana_voice_autospeak");
      if (as !== null) setAutoSpeak(as !== "false");

      const ac = localStorage.getItem("corvana_audio_chimes");
      if (ac !== null) setAudioChimes(ac !== "false");

      const cv = localStorage.getItem("corvana_chime_volume");
      if (cv !== null) setChimeVolume(parseInt(cv, 10) || 70);

      const sd = localStorage.getItem("corvana_stalled_detection");
      if (sd !== null) setStalledDetection(sd !== "false");

      const sa = localStorage.getItem("corvana_strict_approvals");
      if (sa !== null) setStrictApprovals(sa === "true");

      const den = localStorage.getItem("corvana_density");
      if (den === "compact" || den === "comfortable") setDensity(den);

      const ref = localStorage.getItem("corvana_refresh_interval");
      if (ref) setRefreshInterval(parseInt(ref, 10) || 5);

      const ne = localStorage.getItem("corvana_notifications_enabled");
      if ("Notification" in window) {
        setNotificationPermission(Notification.permission);
        if (Notification.permission === "granted") {
          setNotificationsEnabled(ne !== "false");
        } else {
          setNotificationsEnabled(false);
        }
      }

      // Load Speech Synthesis voices
      const loadVoices = () => {
        if (window.speechSynthesis) {
          const list = window.speechSynthesis.getVoices();
          setAvailableVoices(list);
          if (!vn && list.length > 0) {
            const defaultVoice = list.find((vox) => vox.lang.includes("en")) || list[0];
            if (defaultVoice) setVoiceName(defaultVoice.name);
          }
        }
      };

      loadVoices();
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }

      // All saved states are now loaded: reveal the settings screen
      setIsMounted(true);
    }
  }, []);

  const triggerToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => {
      setSaveToast(null);
    }, 2800);
  };

  const handleVoiceToggle = (newState: boolean) => {
    setVoiceEnabled(newState);
    if (typeof window !== "undefined") {
      localStorage.setItem("corvana_voice_assistant", String(newState));
      window.dispatchEvent(
        new CustomEvent("corvana_voice_setting_changed", { detail: { enabled: newState } })
      );
      if (!newState && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      triggerToast(newState ? "AI Voice Assistant Enabled" : "AI Voice Assistant Muted");
    }
  };

  const handleVoiceRateChange = (newRate: number) => {
    setVoiceRate(newRate);
    localStorage.setItem("corvana_voice_rate", String(newRate));
  };

  const handleVoicePitchChange = (newPitch: number) => {
    setVoicePitch(newPitch);
    localStorage.setItem("corvana_voice_pitch", String(newPitch));
  };

  const handleVoiceSelect = (name: string) => {
    setVoiceName(name);
    localStorage.setItem("corvana_voice_name", name);
  };

  const handleAutoSpeakToggle = (state: boolean) => {
    setAutoSpeak(state);
    if (typeof window !== "undefined") {
      localStorage.setItem("corvana_voice_autospeak", String(state));
      window.dispatchEvent(
        new CustomEvent("corvana_voice_setting_changed", { detail: { autospeak: state } })
      );
    }
    triggerToast(state ? "Auto-speak enabled" : "Auto-speak disabled");
  };

  const handleAudioChimesToggle = (state: boolean) => {
    setAudioChimes(state);
    localStorage.setItem("corvana_audio_chimes", String(state));
    triggerToast(state ? "Audio chimes enabled" : "Audio chimes disabled");
  };

  const handleChimeVolumeChange = (newVol: number) => {
    setChimeVolume(newVol);
    localStorage.setItem("corvana_chime_volume", String(newVol));
  };

  const playChime = (overrideVol?: number) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const vol = overrideVol !== undefined ? overrideVol : chimeVolume;
      if (vol <= 0) return;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc2.type = "sine";

      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      osc2.frequency.setValueAtTime(783.99, ctx.currentTime + 0.08); // G5
      osc2.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.25); // C6

      // Scale maximum gain based on volume percentage (0% to 100%)
      const maxGain = 0.12 * (vol / 100);
      gain.gain.setValueAtTime(maxGain, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0005, ctx.currentTime + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime + 0.08);
      osc1.stop(ctx.currentTime + 0.35);
      osc2.stop(ctx.currentTime + 0.35);
    } catch (err) {
      console.error("Audio chime error:", err);
    }
  };

  const testVoiceSpeech = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    setIsTestingVoice(true);
    window.speechSynthesis.cancel();

    const text = "Corvana AI voice assistant is active and operational. Ready to assist your workflow.";
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = voiceRate;
    utterance.pitch = voicePitch;

    if (voiceName) {
      const selected = availableVoices.find((v) => v.name === voiceName);
      if (selected) utterance.voice = selected;
    }

    utterance.onend = () => {
      setIsTestingVoice(false);
      (window as any)._testUtterance = null;
    };
    utterance.onerror = () => {
      setIsTestingVoice(false);
      (window as any)._testUtterance = null;
    };

    (window as any)._testUtterance = utterance;
    window.speechSynthesis.speak(utterance);
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  };

  const handleNotificationToggle = () => {
    const next = !notificationsEnabled;
    setNotificationsEnabled(next);
    localStorage.setItem("corvana_notifications_enabled", String(next));
    triggerToast(next ? "In-web notifications enabled" : "In-web notifications muted");
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("Notifications are not supported in this browser.");
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === "granted") {
        setNotificationsEnabled(true);
        localStorage.setItem("corvana_notifications_enabled", "true");
        new Notification("Corvana.AI Notifications Enabled", {
          body: "You will receive live web alerts for task completions and pending approvals.",
          icon: "/assets/CorvanaLogo.jpg",
        });
        triggerToast("In-web notifications enabled");
      } else if (perm === "denied") {
        setNotificationsEnabled(false);
        localStorage.setItem("corvana_notifications_enabled", "false");
        setShowBrowserGuide(true);
        triggerToast("Notifications blocked in browser");
      }
    } catch (err) {
      console.error("Permission request error:", err);
    }
  };

  const recheckNotificationPermission = () => {
    if ("Notification" in window) {
      const perm = Notification.permission;
      setNotificationPermission(perm);
      if (perm === "granted") {
        setNotificationsEnabled(true);
        localStorage.setItem("corvana_notifications_enabled", "true");
        setShowBrowserGuide(false);
        triggerToast("Browser notifications are now allowed!");
      } else if (perm === "denied") {
        setShowBrowserGuide(true);
        triggerToast("Still blocked. Follow the steps in your browser settings.");
      } else {
        triggerToast("Permission is set to ask. Click 'Enable Notifications' to prompt.");
      }
    }
  };

  const sendTestNotification = () => {
    if (audioChimes) {
      playChime();
    }

    // Trigger rich in-web notification alert
    setInWebNotification({
      title: "Corvana.AI Alert",
      body: "Test notification working! In-web alerts will appear here when agents complete runs or require approval.",
      time: "Just now",
    });

    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      setInWebNotification(null);
    }, 6000);

    // Also attempt browser notification if permission is granted
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try {
        const notif = new Notification("Corvana.AI Test Alert", {
          body: "Your notification settings are working properly! You will receive live task updates.",
          icon: "/assets/CorvanaLogo.jpg",
          tag: "corvana-test-" + Date.now(),
        });
        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      } catch {}
    }

    triggerToast("In-web notification sent!");
  };

  const resetToDefaults = () => {
    if (confirm("Reset all settings to default values?")) {
      handleVoiceToggle(true);
      handleVoiceRateChange(1.0);
      handleVoicePitchChange(1.0);
      handleAutoSpeakToggle(true);
      handleAudioChimesToggle(true);
      handleChimeVolumeChange(70);
      setStalledDetection(true);
      localStorage.setItem("corvana_stalled_detection", "true");
      setStrictApprovals(false);
      localStorage.setItem("corvana_strict_approvals", "false");
      setDensity("comfortable");
      localStorage.setItem("corvana_density", "comfortable");
      setRefreshInterval(5);
      localStorage.setItem("corvana_refresh_interval", "5");
      triggerToast("All settings reset to defaults");
    }
  };

  if (!isMounted) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200 max-w-5xl">
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-3 shadow-xl text-sm font-medium border border-slate-700 dark:border-slate-300 animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 dark:text-emerald-600" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* In-Web Alert Banner */}
      {inWebNotification && (
        <div className="fixed top-6 right-6 z-50 flex items-start gap-3 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 p-4 shadow-2xl max-w-sm w-full animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
            <BellRing className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{inWebNotification.title}</p>
              <span className="text-[10px] text-slate-400">{inWebNotification.time}</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              {inWebNotification.body}
            </p>
          </div>
          <button
            onClick={() => setInWebNotification(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Settings</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your AI voice assistant, workflow automation guardrails, notifications, and workspace preferences.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={resetToDefaults}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Defaults
          </button>
        </div>
      </header>

      {/* SECTION 1: AI VOICE ASSISTANT (FEATURED) */}
      <section className="rounded-2xl border border-blue-100 dark:border-blue-900/40 bg-gradient-to-b from-blue-50/40 via-white to-white dark:from-blue-950/20 dark:via-slate-900 dark:to-slate-900 p-6 shadow-sm space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-xl border ${
                isMounted ? "transition-all duration-200" : "!transition-none"
              } ${
                voiceEnabled
                  ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20"
                  : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 border-slate-200 dark:border-slate-700"
              }`}
            >
              {voiceEnabled ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">AI Voice Assistant</h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    voiceEnabled
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {voiceEnabled ? "Enabled" : "Muted"}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Toggle browser speech synthesis and voice microphone commands for all autonomous agents across Corvana.AI.
              </p>
            </div>
          </div>

          {/* Master Toggle Switch */}
          <button
            id="toggle-voice-assistant"
            role="switch"
            aria-checked={voiceEnabled}
            onClick={() => handleVoiceToggle(!voiceEnabled)}
            className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
              isMounted ? "transition-colors duration-200 ease-in-out" : "!transition-none"
            } ${
              voiceEnabled ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
            }`}
          >
            <span className="sr-only">Toggle AI Voice Assistant</span>
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 ${
                isMounted ? "transition-transform duration-200 ease-in-out" : "!transition-none"
              } ${
                voiceEnabled ? "translate-x-7" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Detailed Voice Settings (Expandable when enabled) */}
        <div
          className={`grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 ${
            isMounted ? "transition-opacity duration-200" : "!transition-none"
          } ${
            voiceEnabled ? "opacity-100" : "opacity-40 pointer-events-none"
          }`}
        >
          {/* Voice Persona / Engine */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 text-blue-500" />
              Synthesizer Voice
            </label>
            <select
              disabled={!voiceEnabled || availableVoices.length === 0}
              value={voiceName}
              onChange={(e) => handleVoiceSelect(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableVoices.length === 0 ? (
                <option value="">Default Voice</option>
              ) : (
                availableVoices.map((vox) => (
                  <option key={vox.name} value={vox.name}>
                    {vox.name} ({vox.lang})
                  </option>
                ))
              )}
            </select>
            <p className="text-xs text-slate-400">Selects the text-to-speech voice for Kainoa, Maya, Nora, Kent & Harper.</p>
          </div>

          {/* Voice Rate / Speed */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5 text-blue-500" />
                Speech Speed ({voiceRate}x)
              </label>
              <div className="flex gap-1.5">
                {[0.9, 1.0, 1.15].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => handleVoiceRateChange(spd)}
                    className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                      voiceRate === spd
                        ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 font-semibold"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.4"
              step="0.05"
              value={voiceRate}
              disabled={!voiceEnabled}
              onChange={(e) => handleVoiceRateChange(parseFloat(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Auto-Speak on Profile Page */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Auto-Speak Agent Status</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Speak status overview automatically when opening agent pages.</p>
            </div>
            <button
              role="switch"
              aria-checked={autoSpeak}
              disabled={!voiceEnabled}
              onClick={() => handleAutoSpeakToggle(!autoSpeak)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent focus:outline-none ${
                isMounted ? "transition-colors duration-200 ease-in-out" : "!transition-none"
              } ${
                autoSpeak && voiceEnabled ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 ${
                  isMounted ? "transition-transform duration-200 ease-in-out" : "!transition-none"
                } ${
                  autoSpeak && voiceEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Test Voice Button */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Audio Playback Test</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Preview speech synthesis using current voice and rate.</p>
            </div>
            <button
              type="button"
              disabled={!voiceEnabled || isTestingVoice}
              onClick={testVoiceSpeech}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors disabled:opacity-50 shadow-sm"
            >
              {isTestingVoice ? (
                <>
                  <Activity className="h-3.5 w-3.5 animate-spin" />
                  Speaking...
                </>
              ) : (
                <>
                  <Volume2 className="h-3.5 w-3.5" />
                  Test Voice
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 2: WORKFLOW GUARDRAILS & APPROVALS */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Workflow Guardrails & Approvals</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Control human-in-the-loop authorization gates and queue policies.
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {/* Stalled Execution Watcher */}
          <div className="py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Stalled Execution Auto-Detection
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
                Automatically mark workflows running longer than 60 minutes as &quot;Stalled&quot; to prevent hanging agent state.
              </p>
            </div>
            <button
              role="switch"
              aria-checked={stalledDetection}
              onClick={() => {
                const next = !stalledDetection;
                setStalledDetection(next);
                localStorage.setItem("corvana_stalled_detection", String(next));
                triggerToast(next ? "Stalled detection enabled" : "Stalled detection disabled");
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent focus:outline-none ${
                isMounted ? "transition-colors duration-200 ease-in-out" : "!transition-none"
              } ${
                stalledDetection ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 ${
                  isMounted ? "transition-transform duration-200 ease-in-out" : "!transition-none"
                } ${
                  stalledDetection ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Strict Outbound Approvals */}
          <div className="py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Strict Outbound Confirmation
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
                Require double-confirmation dialogs before approving live email transmissions or external social posts.
              </p>
            </div>
            <button
              role="switch"
              aria-checked={strictApprovals}
              onClick={() => {
                const next = !strictApprovals;
                setStrictApprovals(next);
                localStorage.setItem("corvana_strict_approvals", String(next));
                triggerToast(next ? "Strict confirmation enabled" : "Strict confirmation disabled");
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent focus:outline-none ${
                isMounted ? "transition-colors duration-200 ease-in-out" : "!transition-none"
              } ${
                strictApprovals ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 ${
                  isMounted ? "transition-transform duration-200 ease-in-out" : "!transition-none"
                } ${
                  strictApprovals ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 3: SOUND EFFECTS & DESKTOP NOTIFICATIONS */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Audio Cues & Notifications</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure acoustic feedback and browser notification alerts.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          {/* Audio Chimes Card */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Task Completion Chime</p>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      audioChimes && chimeVolume > 0
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                        : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {audioChimes && chimeVolume > 0 ? "Active" : "Muted"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Synthesize an acoustic notification chime upon background workflow completion.
                </p>
              </div>
              <button
                role="switch"
                aria-checked={audioChimes}
                onClick={() => handleAudioChimesToggle(!audioChimes)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent focus:outline-none ${
                  isMounted ? "transition-colors duration-200 ease-in-out" : "!transition-none"
                } ${
                  audioChimes ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 ${
                    isMounted ? "transition-transform duration-200 ease-in-out" : "!transition-none"
                  } ${
                    audioChimes ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Volume Control Slider & Presets */}
            <div
              className={`space-y-2 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 ${
                audioChimes ? "opacity-100" : "opacity-40 pointer-events-none"
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <label className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  {chimeVolume === 0 ? (
                    <VolumeX className="h-3.5 w-3.5 text-slate-400" />
                  ) : chimeVolume < 50 ? (
                    <Volume1 className="h-3.5 w-3.5 text-blue-500" />
                  ) : (
                    <Volume2 className="h-3.5 w-3.5 text-blue-500" />
                  )}
                  Chime Volume ({chimeVolume}%)
                </label>
                <div className="flex gap-1">
                  {[25, 50, 75, 100].map((v) => (
                    <button
                      key={v}
                      type="button"
                      disabled={!audioChimes}
                      onClick={() => {
                        handleChimeVolumeChange(v);
                        playChime(v);
                      }}
                      className={`px-1.5 py-0.5 text-[11px] rounded border transition-colors ${
                        chimeVolume === v
                          ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 font-semibold"
                          : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {v}%
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={chimeVolume}
                disabled={!audioChimes}
                onChange={(e) => handleChimeVolumeChange(parseInt(e.target.value, 10))}
                className="w-full accent-blue-600 cursor-pointer"
              />

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  disabled={!audioChimes}
                  onClick={() => playChime()}
                  className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                  <Volume2 className="h-3.5 w-3.5" />
                  Play sample chime
                </button>
              </div>
            </div>
          </div>

          {/* In-Web & Browser Notifications Card */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">In-Web & Browser Notifications</p>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      notificationPermission === "granted" && notificationsEnabled
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                        : notificationPermission === "denied"
                        ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400"
                        : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {notificationPermission === "granted"
                      ? notificationsEnabled
                        ? "Allowed & Active"
                        : "Muted in App"
                      : notificationPermission === "denied"
                      ? "Blocked by Browser"
                      : "Permission Needed"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Receive instant system alerts when Kainoa or Maya require approval or complete runs.
                </p>
              </div>

              {/* If permission is already granted, render Toggle Switch */}
              {notificationPermission === "granted" && (
                <button
                  role="switch"
                  aria-checked={notificationsEnabled}
                  onClick={handleNotificationToggle}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent focus:outline-none ${
                    isMounted ? "transition-colors duration-200 ease-in-out" : "!transition-none"
                  } ${
                    notificationsEnabled ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 ${
                      isMounted ? "transition-transform duration-200 ease-in-out" : "!transition-none"
                    } ${
                      notificationsEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              )}
            </div>

            {/* Notification Actions based on Browser Permission State */}
            <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
              {notificationPermission === "granted" ? (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {notificationsEnabled
                      ? "Notifications are active and will appear directly in your web dashboard."
                      : "Notifications are permitted but currently muted in Corvana."}
                  </p>
                  <button
                    type="button"
                    disabled={!notificationsEnabled}
                    onClick={sendTestNotification}
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium disabled:opacity-50"
                  >
                    <BellRing className="h-3.5 w-3.5" />
                    Send Test Alert
                  </button>
                </div>
              ) : notificationPermission === "denied" ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-2.5">
                    <Lock className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs">
                      <p className="font-semibold text-red-900 dark:text-red-200">
                        Browser blocked notifications for this site
                      </p>
                      <p className="text-red-700 dark:text-red-300">
                        Modern browsers require unblocking notifications directly in your browser site settings.
                      </p>
                    </div>
                  </div>

                  {/* Browser Guidance Guide */}
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setShowBrowserGuide(!showBrowserGuide)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {showBrowserGuide ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      {showBrowserGuide ? "Hide browser settings guide" : "How to allow notifications in browser"}
                    </button>

                    {showBrowserGuide && (
                      <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-2 animate-in fade-in duration-200">
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          Follow these quick steps to unblock:
                        </p>
                        <ol className="list-decimal list-inside space-y-1.5 text-slate-500 dark:text-slate-400">
                          <li>Look at the address bar at the top (left of <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">localhost:3000</code>).</li>
                          <li>Click the <strong className="text-slate-700 dark:text-slate-200">Site Settings / Lock / Tune icon</strong> (🔒 or 🎛️).</li>
                          <li>Find <strong className="text-slate-700 dark:text-slate-200">Notifications</strong> and switch from <span className="text-red-500 font-medium">Block</span> to <span className="text-emerald-500 font-medium">Allow</span>.</li>
                          <li>Click the button below to re-check permissions.</li>
                        </ol>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={recheckNotificationPermission}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium transition-colors"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Re-check Browser Permissions
                    </button>
                  </div>
                </div>
              ) : (
                /* Default permission state (never asked) */
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Enable notifications to receive alerts when tasks need approval.
                  </p>
                  <button
                    type="button"
                    onClick={requestNotificationPermission}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-sm"
                  >
                    <BellRing className="h-3.5 w-3.5" />
                    Enable Notifications
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: APPEARANCE & THEME */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Interface & Appearance</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Customize theme colors and layout density.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Theme Mode
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: "light", label: "Light", icon: Sun },
              { key: "dark", label: "Dark", icon: Moon },
              { key: "system", label: "System", icon: Monitor },
            ].map((t) => {
              const Icon = t.icon;
              const isSelected = theme === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTheme(t.key)}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-500 shadow-sm"
                      : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-8 animate-pulse max-w-5xl">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="h-8 w-36 rounded-lg bg-slate-200 dark:bg-slate-800 mb-2" />
          <div className="h-4 w-72 rounded bg-slate-200/70 dark:bg-slate-800/70" />
        </div>
        <div className="h-9 w-28 rounded-lg bg-slate-200 dark:bg-slate-800" />
      </header>

      {/* Featured Voice Skeleton */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-slate-200 dark:bg-slate-800" />
            <div className="space-y-2">
              <div className="h-5 w-44 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-64 rounded bg-slate-200/70 dark:bg-slate-800/70" />
            </div>
          </div>
          <div className="h-7 w-14 rounded-full bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>

      {/* Guardrails Skeleton */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <div className="h-5 w-48 rounded bg-slate-200 dark:bg-slate-800 mb-4" />
        <div className="space-y-3">
          <div className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800/50" />
          <div className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800/50" />
          <div className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800/50" />
        </div>
      </div>

      {/* Audio & Notification Skeleton */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <div className="h-5 w-48 rounded bg-slate-200 dark:bg-slate-800 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-24 rounded-xl bg-slate-100 dark:bg-slate-800/50" />
          <div className="h-24 rounded-xl bg-slate-100 dark:bg-slate-800/50" />
        </div>
      </div>
    </div>
  );
}
