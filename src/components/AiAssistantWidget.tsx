import React, { useState, useEffect, useRef } from "react";
import { Sparkles, X, Send, Bot, User, HelpCircle, ArrowRight, Paperclip, Mic, Square, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Message {
  id: string;
  sender: "user" | "ai";
  content: string;
  attachment?: any;
  created_at: string;
}

interface AiAssistantWidgetProps {
  currentUser?: any;
}

export default function AiAssistantWidget({ currentUser }: AiAssistantWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const userName = currentUser ? (currentUser.name || currentUser.email) : "";
    setMessages([
      {
        id: "welcome",
        sender: "ai",
        content: currentUser
          ? `Bonjour ${userName} (${currentUser.role === 'admin' ? 'Administrateur' : 'Candidat Connecté'}) ! Je suis votre Conseiller Solidaire. Je suis à votre service pour vous orienter sur vos dossiers et notre catalogue. Comment puis-je vous guider ?`
          : "Bonjour ! Je suis votre Conseiller Solidaire. Je connais parfaitement tout notre catalogue de dons (véhicules, immobilier, matériel professionnel, fonds d'aide). Comment puis-je vous guider aujourd'hui ?",
        created_at: new Date().toISOString()
      }
    ]);
  }, [currentUser]);
  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  // Note vocale
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<any>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const quickQuestions = [
    "Comment postuler à un don ?",
    "Quels sont les critères d'éligibilité ?",
    "Y a-t-il des frais cachés ou de transfert ?",
    "Je cherche un véhicule utilitaire."
  ];

  useEffect(() => {
    if (isOpen) {
      setHasNewMessage(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachment({
          name: file.name,
          type: file.type,
          data: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          setAttachment({
            name: `Note_Vocale_${Date.now().toString().slice(-4)}.webm`,
            type: "audio/webm",
            data: reader.result as string,
            is_audio: true
          });
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Erreur micro:", err);
      alert("Impossible d'accéder au microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const handleSendMessage = async (textToSend: string) => {
    if ((!textToSend.trim() && !attachment) || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      content: textToSend.trim(),
      attachment: attachment,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setAttachment(null);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.sender === "user" ? ("user" as const) : ("model" as const),
        content: m.content
      }));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: textToSend.trim() || "Consulter le catalogue", 
          history,
          user: currentUser ? {
            name: currentUser.name || currentUser.email,
            email: currentUser.email,
            role: currentUser.role || "Demandeur"
          } : null
        })
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          sender: "ai",
          content: data.response,
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMsg]);
        if (!isOpen) {
          setHasNewMessage(true);
        }
      } else {
        throw new Error("Erreur serveur");
      }
    } catch (err) {
      console.error("Erreur widget assistant:", err);
      const errorMsg: Message = {
        id: `ai-err-${Date.now()}`,
        sender: "ai",
        content: "Désolé, je rencontre une petite difficulté de connexion. Veuillez réessayer dans quelques instants.",
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Bouton de déclenchement flottant */}
      <motion.button
        id="assistant-widget-trigger"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`relative h-14 w-14 rounded-full flex items-center justify-center cursor-pointer shadow-xl transition-all ${
          isOpen 
            ? "bg-slate-900 text-white" 
            : "bg-gradient-to-tr from-indigo-600 via-violet-600 to-purple-600 text-white"
        }`}
      >
        {isOpen ? (
          <X className="h-6 w-6 animate-spin-once" />
        ) : (
          <div className="relative">
            <Sparkles className="h-6 w-6 animate-pulse" />
            {hasNewMessage && (
              <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-rose-500 rounded-full border-2 border-white animate-bounce" />
            )}
          </div>
        )}
      </motion.button>

      {/* Fenêtre de discussion du Conseiller Solidaire */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="assistant-widget-window"
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.94 }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed bottom-22 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[380px] max-h-[calc(100vh-110px)] h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col z-50"
          >
            {/* En-tête du Conseiller */}
            <div className="p-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-inner">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold tracking-tight flex items-center gap-1.5">
                    Conseiller Solidaire
                    <span className="px-1.5 py-0.5 bg-indigo-500/30 text-indigo-300 rounded-full text-[8px] font-black uppercase tracking-wider">
                      Assistance 24/7
                    </span>
                  </h4>
                  <p className="text-[9px] text-indigo-200/80 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    En ligne • Réponses instantanées
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Zone de Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/50 min-h-0">
              {messages.map((msg, idx) => {
                const isAi = msg.sender === "ai";
                const isAudio = msg.attachment && (msg.attachment.is_audio || msg.attachment.name?.endsWith(".webm"));

                return (
                  <div
                    key={`ai-msg-${msg.id || idx}-${idx}`}
                    className={`flex gap-2 max-w-[88%] ${isAi ? "mr-auto" : "ml-auto flex-row-reverse"}`}
                  >
                    <div className={`h-6 w-6 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-bold ${
                      isAi 
                        ? "bg-indigo-50 text-indigo-600 border border-indigo-100" 
                        : "bg-indigo-600 text-white"
                    }`}>
                      {isAi ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                    </div>
                    
                    <div className="space-y-1">
                      <div className={`p-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                        isAi 
                          ? "bg-white text-slate-800 rounded-tl-none border border-slate-100" 
                          : "bg-indigo-600 text-white rounded-tr-none"
                      }`}>
                        {msg.content}

                        {/* Rendu audio vocal */}
                        {isAudio && (
                          <div className="mt-2 p-1.5 bg-slate-100/90 rounded-lg border border-slate-200 flex flex-col gap-1 text-slate-800 min-w-[170px]">
                            <span className="text-[8px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                              <Volume2 size={10} className="text-indigo-600" /> Note Vocale
                            </span>
                            <audio src={msg.attachment.data} controls className="h-7 w-full outline-none" />
                          </div>
                        )}

                        {/* Rendu pièce jointe */}
                        {msg.attachment && !isAudio && (
                          <div className={`mt-1.5 p-1 rounded border flex items-center gap-1.5 ${isAi ? "bg-slate-50 border-slate-200" : "bg-indigo-500/50 border-indigo-400"}`}>
                            <Paperclip size={11} className={isAi ? "text-slate-400" : "text-indigo-200"} />
                            <span className="text-[9px] font-bold truncate max-w-[150px]">{msg.attachment.name}</span>
                          </div>
                        )}
                      </div>
                      <span className={`text-[8px] text-slate-400 block ${!isAi && "text-right"}`}>
                        {new Date(msg.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex gap-2 max-w-[85%] mr-auto">
                  <div className="h-6 w-6 rounded-lg shrink-0 flex items-center justify-center bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                  <div className="bg-white text-slate-500 rounded-2xl rounded-tl-none border border-slate-100 p-2.5 shadow-sm text-xs italic flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-bounce" />
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-bounce delay-100" />
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-bounce delay-200" />
                    Recherche dans le catalogue...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Questions rapides ou prompts de suggestion */}
            {messages.length === 1 && (
              <div className="p-2.5 bg-slate-50 border-t border-slate-100 shrink-0">
                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <HelpCircle className="h-3 w-3 text-indigo-500" /> Suggestions rapides
                </p>
                <div className="grid grid-cols-1 gap-1">
                  {quickQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q)}
                      className="text-left text-[11px] bg-white hover:bg-indigo-50/50 hover:border-indigo-200 border border-slate-200/60 rounded-lg p-2 text-slate-700 font-medium transition-all shadow-sm cursor-pointer flex items-center justify-between group"
                    >
                      <span className="truncate pr-2">{q}</span>
                      <ArrowRight className="h-3 w-3 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Aperçu de la pièce jointe en cours */}
            {attachment && (
              <div className="p-2 bg-indigo-50 border-t border-indigo-100 flex items-center justify-between text-xs text-indigo-800 shrink-0">
                <div className="flex items-center gap-1.5 truncate">
                  <Paperclip size={12} className="text-indigo-600 shrink-0" />
                  <span className="truncate font-bold text-[10px]">{attachment.name}</span>
                </div>
                <button onClick={() => setAttachment(null)} className="text-indigo-400 hover:text-indigo-700">
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Formulaire d'envoi avec option Pièces Jointes et Vocaux */}
            <div className="p-2.5 bg-white border-t border-slate-100 shrink-0">
              {isRecording ? (
                <div className="flex items-center justify-between bg-rose-50 border border-rose-100 p-2 rounded-xl animate-pulse">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-600 animate-ping" />
                    <span className="text-xs font-extrabold text-rose-700">Enregistrement... {recordingSeconds}s</span>
                  </div>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="bg-rose-600 text-white p-1.5 rounded-lg flex items-center justify-center cursor-pointer hover:bg-rose-700"
                  >
                    <Square className="h-3 w-3 fill-current" />
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage(input);
                  }}
                  className="flex items-center gap-1.5"
                >
                  <label className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer text-slate-400 transition-all flex items-center justify-center shrink-0">
                    <Paperclip className="h-3.5 w-3.5" />
                    <input type="file" className="hidden" onChange={handleFileChange} />
                  </label>

                  <button
                    type="button"
                    onClick={startRecording}
                    className="p-2 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 rounded-xl text-slate-400 transition-all flex items-center justify-center shrink-0 cursor-pointer"
                    title="Enregistrer un message vocal"
                  >
                    <Mic className="h-3.5 w-3.5" />
                  </button>

                  <input
                    type="text"
                    placeholder="Posez votre question..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isLoading}
                    className="flex-1 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white rounded-xl px-3 py-2 text-xs transition-all placeholder:text-slate-400"
                  />

                  <button
                    type="submit"
                    disabled={(!input.trim() && !attachment) || isLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white h-8 w-8 rounded-xl flex items-center justify-center shadow-md cursor-pointer transition-all shrink-0"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

