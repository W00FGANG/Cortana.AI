"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, MicOff, Volume2, VolumeX } from "lucide-react";

interface AgentChatBubbleProps {
  agentId: string;
  agentName: string;
  agentRole: string;
  agentAvatar?: string | null;
  agentIcon: React.ReactNode;
  currentTaskTitle?: string;
  recentActivities?: string[];
  theme: {
    bg: string;
    tail: string;
    avatarBorder: string;
    fallbackIcon: string;
  };
}

export function AgentChatBubble({
  agentId,
  agentName,
  agentRole,
  agentAvatar,
  agentIcon,
  currentTaskTitle,
  recentActivities = [],
  theme,
}: AgentChatBubbleProps) {
  const hasStarted = useRef(false);
  const [isMounted, setIsMounted] = useState(false);
  const [completion, setCompletion] = useState("");
  const [displayedText, setDisplayedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const isVoiceEnabledRef = useRef(false);
  const [autoSpeakEnabled, setAutoSpeakEnabled] = useState(true);
  const autoSpeakRef = useRef(true);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const isAudioMutedRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("corvana_voice_assistant");
      const enabled = stored !== "false";
      setIsVoiceEnabled(enabled);
      isVoiceEnabledRef.current = enabled;

      const as = localStorage.getItem("corvana_voice_autospeak");
      const asEnabled = as !== "false";
      setAutoSpeakEnabled(asEnabled);
      autoSpeakRef.current = asEnabled;
      setIsAudioMuted(!asEnabled);
      isAudioMutedRef.current = !asEnabled;

      setIsMounted(true);

      if (enabled && !hasStarted.current) {
        hasStarted.current = true;
        generateResponse();
      }

      const handleVoiceChange = (e: any) => {
        if (e.detail?.enabled !== undefined) {
          const val = e.detail.enabled;
          setIsVoiceEnabled(val);
          isVoiceEnabledRef.current = val;
          if (!val && window.speechSynthesis) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
          } else if (val && !hasStarted.current) {
            hasStarted.current = true;
            generateResponse();
          }
        }

        if (e.detail?.autospeak !== undefined) {
          const asVal = e.detail.autospeak;
          setAutoSpeakEnabled(asVal);
          autoSpeakRef.current = asVal;
          setIsAudioMuted(!asVal);
          isAudioMutedRef.current = !asVal;
          if (!asVal && window.speechSynthesis) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
          }
        } else {
          const latestAs = localStorage.getItem("corvana_voice_autospeak") !== "false";
          setAutoSpeakEnabled(latestAs);
          autoSpeakRef.current = latestAs;
          setIsAudioMuted(!latestAs);
          isAudioMutedRef.current = !latestAs;
        }
      };

      window.addEventListener("corvana_voice_setting_changed", handleVoiceChange);
      window.addEventListener("storage", handleVoiceChange);
      return () => {
        window.removeEventListener("corvana_voice_setting_changed", handleVoiceChange);
        window.removeEventListener("storage", handleVoiceChange);
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      };
    }
  }, []);

  const speakText = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    if (!text.trim()) return;

    const utterance = new SpeechSynthesisUtterance(text);

    // Apply voice settings from localStorage
    const savedRate = localStorage.getItem("corvana_voice_rate");
    if (savedRate) utterance.rate = parseFloat(savedRate) || 1.0;

    const savedPitch = localStorage.getItem("corvana_voice_pitch");
    if (savedPitch) utterance.pitch = parseFloat(savedPitch) || 1.0;

    const savedVoice = localStorage.getItem("corvana_voice_name");
    if (savedVoice) {
      const voices = window.speechSynthesis.getVoices();
      const match = voices.find((v) => v.name === savedVoice);
      if (match) utterance.voice = match;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      (window as any)._agentUtterance = null;
    };

    utterance.onerror = (e) => {
      console.warn("Speech synthesis error or autoplay restricted:", e);
      setIsSpeaking(false);
      (window as any)._agentUtterance = null;
    };

    // Keep reference on window to prevent Chrome V8 garbage collection bug
    (window as any)._agentUtterance = utterance;

    window.speechSynthesis.speak(utterance);

    // Chrome resume workaround
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      (window as any)._agentUtterance = null;
    }
  };

  const handleSpeakerButtonClick = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsAudioMuted(true);
      isAudioMutedRef.current = true;
    } else if (isAudioMuted) {
      setIsAudioMuted(false);
      isAudioMutedRef.current = false;
      const textToSpeak = completion || displayedText;
      if (textToSpeak) {
        speakText(textToSpeak);
      }
    } else {
      const textToSpeak = completion || displayedText;
      if (textToSpeak) {
        speakText(textToSpeak);
      }
    }
  };

  // Typewriter effect
  useEffect(() => {
    if (completion.length > displayedText.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(completion.slice(0, displayedText.length + 1));
      }, 15);
      
      return () => clearTimeout(timeout);
    }
  }, [completion, displayedText]);

  const generateResponse = (prompt?: string) => {
    setIsLoading(true);
    setCompletion("");
    setDisplayedText("");
    setError(null);
    stopSpeaking();

    fetch(`/api/agents/${agentId}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentName,
        agentRole,
        currentTaskTitle,
        recentActivities,
        userPrompt: prompt,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(await res.text());
        }
        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let fullText = "";
        
        async function readStream() {
          while (true) {
            const { done, value } = await reader!.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            fullText += chunk;
            setCompletion((prev) => prev + chunk);
          }
          setIsLoading(false);

          // Auto-Speak final response only if enabled in Settings
          if (isVoiceEnabledRef.current && autoSpeakRef.current && fullText) {
            speakText(fullText);
          }
        }
        
        readStream();
      })
      .catch((err) => {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      });
  };

  const toggleListen = () => {
    if (isListening) return;
    stopSpeaking();
    
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      alert("Speech recognition is not supported in this browser. Try Google Chrome.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        generateResponse(transcript);
      }
    };
    
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  if (!isMounted || !isVoiceEnabled) {
    return null;
  }

  return (
    <div className={`flex items-start gap-4 p-5 rounded-2xl border shadow-sm relative mt-4 ${theme.bg}`}>
      
      <div className="shrink-0 z-10">
        {agentAvatar ? (
          <img 
            src={agentAvatar} 
            alt={agentName} 
            className={`h-10 w-10 rounded-full object-cover border-2 shadow-sm ${theme.avatarBorder}`} 
          />
        ) : (
          <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${theme.fallbackIcon}`}>
            {agentIcon}
          </div>
        )}
      </div>
      <div className="z-10 flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900 dark:text-slate-50">{agentName}</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">Status Update</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleSpeakerButtonClick}
              disabled={isLoading || (!completion && !displayedText)}
              className={`p-1.5 rounded-full transition-colors ${
                isSpeaking
                  ? "bg-blue-600 text-white animate-pulse"
                  : isAudioMuted
                  ? "bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:hover:bg-slate-700"
                  : "bg-indigo-50 text-indigo-500 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
              title={
                isSpeaking
                  ? "Stop Speaking"
                  : isAudioMuted
                  ? "Unmute & Speak Status"
                  : "Replay Status Aloud"
              }
            >
              {isAudioMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <button
              onClick={toggleListen}
              disabled={isListening || isLoading}
              className={`p-1.5 rounded-full transition-colors ${
                isListening 
                  ? "bg-red-100 text-red-600 animate-pulse" 
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              }`}
              title="Speak to Agent"
            >
              {isListening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </button>
          </div>
        </div>
        
        <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed min-h-[40px]">
          {error ? (
            <div className="text-red-500 bg-red-50/50 p-2 rounded-md border border-red-200 text-xs">
              ⚠️ {error.message || "Failed to connect to LLM. Check server logs."}
            </div>
          ) : !completion && isLoading ? (
            <div className="flex items-center gap-2 text-slate-500 h-full mt-1">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="animate-pulse">Thinking...</span>
            </div>
          ) : (
            <p className="whitespace-pre-wrap">
              {displayedText}
              {(isLoading || displayedText.length < completion.length) && (
                <span className="inline-block w-1.5 h-4 ml-0.5 align-middle bg-slate-400 animate-pulse"></span>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
