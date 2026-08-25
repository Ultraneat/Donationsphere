import React, { useState, useEffect, useRef } from "react";
import { Mail, Phone, MapPin, Send, Paperclip, X, MessageSquare } from "lucide-react";
import { getSocket, joinConversation } from "../lib/socket";

interface ContactPageProps {
  currentUser?: any;
}

export default function ContactPage({ currentUser }: ContactPageProps) {
  const [guestId] = useState(() => {
    const saved = localStorage.getItem("chat_guest_id");
    if (saved) return saved;
    const newId = "guest_" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("chat_guest_id", newId);
    return newId;
  });

  const effectiveUserId = currentUser?.id || guestId;

  const [formData, setFormData] = useState({
    name: currentUser?.name || currentUser?.email?.split("@")[0] || "",
    email: currentUser?.email || "",
    phone: "",
    subject: "Demande de renseignements généraux",
  });

  const contactDonationId = formData.email 
    ? `contact_${formData.email.replace(/[@.]/g, "_")}` 
    : `contact_${effectiveUserId}`;

  const [unifiedMessages, setUnifiedMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [chatAttachment, setChatAttachment] = useState<any>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom (confined to chat container, never scrolls window)
  useEffect(() => {
    const container = document.getElementById("contact-chat-panel");
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [unifiedMessages]);

  // Real-time chat sync
  useEffect(() => {
    const socket = getSocket();
    
    // Rejoindre la room spécifique de l'utilisateur
    joinConversation(effectiveUserId);
    
    const encodedName = encodeURIComponent(formData.name || "Visiteur");

    const fetchMessages = () => {
      fetch(`/api/agent-conversations/${contactDonationId}?user_id=${effectiveUserId}&user_name=${encodedName}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setUnifiedMessages(data);
          }
        })
        .catch(err => console.warn("Erreur chargement messages contact:", err));
    };

    fetchMessages();

    // Polling toutes les 4 secondes pour garantir la synchronisation
    const interval = setInterval(fetchMessages, 4000);

    const handleMessageReceived = (payload: any) => {
      if (payload.donation_id === contactDonationId) {
        setUnifiedMessages(prev => {
          if (prev.some((m: any) => m.id === payload.id || (m.content === payload.content && m.created_at === payload.created_at))) {
            return prev;
          }
          return [...prev, payload].sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
        });
      }
    };

    socket.on("message:received", handleMessageReceived);
    socket.on("application_message:received", handleMessageReceived);

    return () => {
      clearInterval(interval);
      socket.off("message:received", handleMessageReceived);
      socket.off("application_message:received", handleMessageReceived);
    };
  }, [effectiveUserId, contactDonationId, formData.name]);

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!chatInput.trim() && !chatAttachment) || isSendingChat) return;

    setIsSendingChat(true);

    const payload = {
      donation_id: contactDonationId,
      sender: 'user' as const,
      content: chatInput.trim(),
      user_name: formData.name || "Visiteur",
      user_id: effectiveUserId,
      is_auth: !!currentUser,
      attachment: chatAttachment,
      created_at: new Date().toISOString()
    };

    try {
      await fetch(`/api/agent-conversations/${contactDonationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      // Ajout optimiste
      setUnifiedMessages(prev => [
        ...prev,
        { ...payload, id: `temp-${Date.now()}` }
      ]);
      
      setChatInput("");
      setChatAttachment(null);
    } catch (err) {
      console.error("Erreur d'envoi du message de chat:", err);
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleChatFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 900 * 1024) {
        alert("Fichier trop volumineux. La taille maximale autorisée est de 900 Ko.");
        e.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setChatAttachment({
          name: file.name,
          type: file.type,
          data: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-12 py-4 animate-fadeIn" id="contact-page-root">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-[11px] font-bold tracking-wider uppercase inline-block">
          Contact & Support
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Une question ou un projet à proposer ? <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-emerald-600">
            Échangez en direct avec nos agents d'attribution.
          </span>
        </h1>
        <p className="text-slate-600 text-sm leading-relaxed">
          Que vous soyez un donateur potentiel (particulier ou entreprise) ou un porteur de projet, notre secrétariat d'attribution répond à toutes vos questions instantanément par chat.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto items-start" id="contact-content-grid">
        {/* Colonne Gauche: Coordonnées de contact */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl space-y-6 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(16,185,129,0.08),transparent_50%)] pointer-events-none" />
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold">Secrétariat Général</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Notre secrétariat traite les demandes de dons de tout genre sur le territoire national et à l'international.
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-3 text-xs sm:text-sm">
                <div className="h-9 w-9 bg-slate-800 text-emerald-400 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="h-4.5 w-4.5" />
                </div>
                <div>
                  <span className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider">Téléphone d'Urgence</span>
                  <span className="font-semibold">+33 (0)1 45 67 89 10</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs sm:text-sm">
                <div className="h-9 w-9 bg-slate-800 text-indigo-400 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <div>
                  <span className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider">E-mail de contact (Cliquable)</span>
                  <a 
                    href="mailto:donationspheresolidaire@gmail.com?subject=Contact%20DonationSphere" 
                    className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors underline decoration-indigo-400/30 hover:decoration-indigo-300"
                    title="Cliquer pour ouvrir votre boîte mail"
                  >
                    contact@donationsphere.online
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs sm:text-sm">
                <div className="h-9 w-9 bg-slate-800 text-pink-400 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-4.5 w-4.5" />
                </div>
                <div>
                  <span className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider">Siège Social</span>
                  <span className="font-semibold text-slate-300">12 Avenue des Champs-Élysées, 75008 Paris</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne Droite: Formulaire d'identification + Chat interactif */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          
          {/* Section d'identification */}
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              Vos informations d'identification
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-wide">Votre Nom Complet / Structure</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Clara, Fondation Humanitaire..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-wide">Adresse Email</label>
                <input
                  type="email"
                  required
                  placeholder="clara@domaine.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-wide">Téléphone (Facultatif)</label>
                <input
                  type="tel"
                  placeholder="06 12 34 56 78"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-wide">Objet de votre demande</label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                >
                  <option value="Demande de renseignements généraux">Demande de renseignements généraux</option>
                  <option value="Proposer un don (Immobilier, Véhicules, Finance)">Proposer un don (Immobilier, Véhicules, Finance)</option>
                  <option value="Aide sur l'instruction d'un dossier actif">Aide sur l'instruction d'un dossier actif</option>
                  <option value="Proposition de partenariat institutionnel">Proposition de partenariat institutionnel</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section Chat en direct */}
          <div className="border border-slate-200/80 rounded-xl overflow-hidden flex flex-col bg-slate-50 shadow-sm">
            
            {/* Header du chat */}
            <div className="bg-indigo-600 px-4 py-3 text-white flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-indigo-200" />
                <div>
                  <h4 className="text-xs font-bold leading-tight">Chat en direct avec l'administration</h4>
                  <p className="text-[9px] text-indigo-200/90">Vous échangez sous le profil de : <span className="font-semibold text-white">{formData.name || "Visiteur"}</span></p>
                </div>
              </div>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1 uppercase tracking-wider">
                <span className="h-1 w-1 rounded-full bg-emerald-400 animate-ping" />
                En ligne
              </span>
            </div>

            {/* Zone des messages */}
            <div className="h-[280px] overflow-y-auto p-4 space-y-3" id="contact-chat-panel">
              {(() => {
                const msgs = unifiedMessages.length > 0
                  ? unifiedMessages
                  : [
                      {
                        sender: 'agent' as const,
                        sender_type: 'admin' as const,
                        content: `Bonjour ${formData.name || "Visiteur"} ! Je suis l'agent d'attribution en charge de votre demande : "${formData.subject}". Posez-moi vos questions ici en direct, nous vous lisons en temps réel.`,
                        created_at: new Date().toISOString()
                      }
                    ];

                return msgs.map((msg, idx) => {
                  const isSystem = msg.sender_type === "system" || msg.sender === "system";
                  const isAdmin = msg.sender_type === "admin" || msg.sender === "agent";
                  const isUser = msg.sender_type === "user" || msg.sender === "user";

                  return (
                    <div 
                      key={msg.id || `msg-${idx}`} 
                      className={`flex flex-col max-w-[85%] ${isUser ? "ml-auto items-end" : "mr-auto items-start"}`}
                    >
                      <span className="text-[8px] font-black text-slate-400 mb-0.5 uppercase tracking-wider px-1">
                        {isSystem ? "🤖 Système d'instruction" : isUser ? "Vous" : (msg.user_name || "Agent DonationSphere")}
                      </span>
                      <div className={`p-2.5 rounded-xl text-xs leading-relaxed shadow-sm ${
                        isSystem 
                          ? "bg-slate-100 text-slate-700 rounded-tl-none border border-slate-200/50"
                          : isUser 
                            ? "bg-indigo-600 text-white rounded-tr-none font-medium" 
                            : "bg-white text-slate-800 rounded-tl-none border border-slate-200/40"
                      }`}>
                        {msg.content}
                        {msg.attachment && (
                          <div className={`mt-2 p-1.5 rounded border flex items-center gap-2 max-w-fit ${isUser ? "bg-indigo-500/50 border-indigo-400" : "bg-slate-50 border-slate-200"}`}>
                            <Paperclip size={10} className={isUser ? "text-indigo-200" : "text-slate-400"} />
                            <a 
                              href={typeof msg.attachment === 'string' ? msg.attachment : (msg.attachment.url || msg.attachment.data)} 
                              download={msg.attachment.name || "piece_jointe"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`text-[9px] font-bold hover:underline truncate max-w-[180px] ${isUser ? "text-white" : "text-indigo-600"}`}
                            >
                              {msg.attachment.name || "Pièce jointe"}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
              <div ref={chatEndRef} />
            </div>

            {/* Entrée de texte */}
            <div className="p-3 bg-white border-t border-slate-150 space-y-2">
              {chatAttachment && (
                <div className="flex items-center justify-between p-2 bg-indigo-50 border border-indigo-100 rounded-lg">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Paperclip className="h-3 w-3 text-indigo-500" />
                    <span className="text-[10px] text-indigo-700 truncate">{chatAttachment.name}</span>
                  </div>
                  <button onClick={() => setChatAttachment(null)} className="text-indigo-400 hover:text-indigo-600">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              
              <form onSubmit={handleSendChatMessage} className="flex gap-2">
                <label className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer text-slate-400 transition-all flex items-center justify-center flex-shrink-0">
                  <Paperclip className="h-3.5 w-3.5" />
                  <input type="file" className="hidden" onChange={handleChatFileChange} />
                </label>
                
                <input
                  type="text"
                  placeholder="Écrivez votre message à l'agent..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
                
                <button
                  type="submit"
                  disabled={(!chatInput.trim() && !chatAttachment) || isSendingChat}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-lg shadow-md transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 flex-shrink-0"
                >
                  {isSendingChat ? <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                </button>
              </form>
            </div>
            
          </div>
          
        </div>
      </div>
    </div>
  );
}
