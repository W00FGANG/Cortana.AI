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
  recentActivities: string[];
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
  recentActivities,
  theme,
}: AgentChatBubbleProps) {
  const hasStarted = useRef(false);
  const [completion, setCompletion] = useState("");
  const [displayedText, setDisplayedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const isVoiceEnabledRef = useRef(true);

  const toggleVoice = () => {
    const newState = !isVoiceEnabled;
    setIsVoiceEnabled(newState);
    isVoiceEnabledRef.current = newState;
    
    // Immediately stop speaking if muted
    if (!newState && typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
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

          // Speak the final response
          if (isVoiceEnabledRef.current && fullText && typeof window !== "undefined" && window.speechSynthesis) {
            window.speechSynthesis.cancel(); // Cancel any ongoing speech
            const utterance = new SpeechSynthesisUtterance(fullText);
            window.speechSynthesis.speak(utterance);
          }
        }
        
        readStream();
      })
      .catch((err) => {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (!hasStarted.current) {
      hasStarted.current = true;
      generateResponse();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleListen = () => {
    if (isListening) return;
    
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

  return (
    <div className={`flex items-start gap-4 p-5 rounded-2xl border shadow-sm relative ml-2 mt-4 ${theme.bg}`}>
      {/* Chat Bubble Tail */}
      <div className={`absolute -left-2 top-6 w-4 h-4 border-l border-b transform rotate-45 ${theme.tail}`}></div>
      
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
              onClick={toggleVoice}
              className={`p-1.5 rounded-full transition-colors ${
                !isVoiceEnabled
                  ? "bg-slate-100 text-slate-400 dark:bg-slate-800"
                  : "bg-indigo-50 text-indigo-500 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
              }`}
              title={isVoiceEnabled ? "Mute Agent Voice" : "Enable Agent Voice"}
            >
              {isVoiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
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
