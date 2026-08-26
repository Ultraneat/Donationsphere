import React, { useState, useEffect, useRef } from "react";
import { Donation, Testimonial } from "../types";
import { 
  Gift, 
  Tag, 
  Users, 
  Play, 
  Pause, 
  Volume2, 
  Video, 
  Flame, 
  TrendingUp, 
  ChevronRight, 
  Award,
  Sparkles,
  Search,
  MapPin,
  User,
  X,
  FileText,
  Check,
  Send,
  AlertCircle,
  MessageSquare,
  Lock,
  UserPlus,
  Eye,
  EyeOff,
  LogIn,
  Info,
  Layers,
  Home,
  Car,
  DollarSign,
  Package,
  SlidersHorizontal,
  ArrowUpDown,
  CheckCircle,
  RotateCcw,
  Paperclip,
  ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getSocket, sendMessage, joinConversation } from "../lib/socket";

interface DonationCatalogProps {
  donations: Donation[];
  testimonials: Testimonial[];
  onApply: (donation: Donation, candidateName: string) => void;
  activeApplicationId: string | null;
  currentUser: any;
  onRegisterUser: (name: string, email: string) => void;
  adminDefinedFields: Array<{key: string, label: string, type: string, placeholder: string}>;
  partners?: any[];
  applications?: any[];
  platformHeroImage?: string;
  onViewDonation?: (id: string) => void;
}

export default function DonationCatalog({ 
  donations, 
  testimonials, 
  onApply, 
  activeApplicationId,
  currentUser,
  onRegisterUser,
  adminDefinedFields,
  partners = [],
  applications = [],
  platformHeroImage,
  onViewDonation
}: DonationCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("Tous");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("Toutes");
  const [selectedTension, setSelectedTension] = useState<string>("Tous");
  const [sortBy, setSortBy] = useState<string>("recent");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [activeVideoTestimonial, setActiveVideoTestimonial] = useState<Testimonial | null>(null);
  
  // Modals States
  const [selectedDonationForDetails, setSelectedDonationForDetails] = useState<Donation | null>(null);
  const [selectedDonationForAgent, setSelectedDonationForAgent] = useState<Donation | null>(null);
  const [selectedDonationForBids, setSelectedDonationForBids] = useState<Donation | null>(null);
  const [selectedDonationForApplyDirect, setSelectedDonationForApplyDirect] = useState<Donation | null>(null);

  // Sync selected donation with prop updates for real-time bid/participant changes
  useEffect(() => {
    if (selectedDonationForApplyDirect) {
      const updated = donations.find(d => d.id === selectedDonationForApplyDirect.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedDonationForApplyDirect)) {
        setSelectedDonationForApplyDirect(updated);
      }
    }
    if (selectedDonationForBids) {
      const updated = donations.find(d => d.id === selectedDonationForBids.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedDonationForBids)) {
        setSelectedDonationForBids(updated);
      }
    }
    if (selectedDonationForDetails) {
      const updated = donations.find(d => d.id === selectedDonationForDetails.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedDonationForDetails)) {
        setSelectedDonationForDetails(updated);
      }
    }
  }, [donations, selectedDonationForApplyDirect, selectedDonationForBids, selectedDonationForDetails]);

  // Agent interactive chat simulator (for anonymous visitors too)
  const [agentChats, setAgentChats] = useState<Record<string, Array<{sender: 'user' | 'agent', content: string, time: string}>>>({});
  const [chatInput, setChatInput] = useState<string>("");
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [chatFile, setChatFile] = useState<any>(null);
  const [chatAttachment, setChatAttachment] = useState<any>(null);
  const [agentIsTyping, setAgentIsTyping] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Registration step inside postulation flow
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [isModalLogin, setIsModalLogin] = useState(false);

  const [formResponses, setFormResponses] = useState<Record<string, string>>({});
  
  // Persistance d'un ID unique pour les visiteurs non connectés
  const [guestId] = useState(() => {
    const saved = localStorage.getItem("chat_guest_id");
    if (saved) return saved;
    const newId = "guest_" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("chat_guest_id", newId);
    return newId;
  });

  const effectiveUserId = currentUser?.id || guestId;

  const [unifiedMessages, setUnifiedMessages] = useState<any[]>([]);

  // Real-time chat sync
  useEffect(() => {
    const socket = getSocket();
    
    // Rejoindre la room spécifique à l'utilisateur pour la confidentialité
    joinConversation(effectiveUserId);
    
    const encodedName = encodeURIComponent(currentUser?.name || currentUser?.email || "");

    const fetchUnifiedMessages = () => {
      fetch(`/api/all-user-messages?user_id=${effectiveUserId}&user_name=${encodedName}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setUnifiedMessages(data);
          }
        })
        .catch(err => console.error("Erreur chargement messages unifiés:", err));
    };

    // Charger l'historique filtré par user_id et user_name (pour support hérité)
    const fetchLegacyChats = () => {
      fetch(`/api/agent-conversations?user_id=${effectiveUserId}&user_name=${encodedName}`)
        .then(res => res.json())
        .then(data => setAgentChats(data))
        .catch(err => console.error("Erreur chargement chats hérités:", err));
    };

    fetchUnifiedMessages();
    fetchLegacyChats();

    // Polling de synchronisation (toutes les 4 secondes)
    const interval = setInterval(() => {
      fetchUnifiedMessages();
      fetchLegacyChats();
    }, 4000);

    const handleMessageReceived = (payload: any) => {
      // Sécurité supplémentaire côté client : ignorer les messages qui ne nous sont pas destinés
      if (payload.user_id && payload.user_id !== effectiveUserId && !currentUser?.role?.includes('admin')) {
        return;
      }

      // 1. Mettre à jour les messages unifiés
      setUnifiedMessages(prev => {
        if (prev.some((m: any) => m.id === payload.id || (m.content === payload.content && m.created_at === payload.created_at))) {
          return prev;
        }
        return [...prev, payload].sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
      });

      // 2. Mettre à jour les chats hérités (par donation_id)
      setAgentChats(prev => {
        const list = prev[payload.donation_id] || [];
        if (list.some((m: any) => m.id === payload.id || (m.content === payload.content && m.created_at === payload.created_at && m.sender === payload.sender))) {
          return prev;
        }
        return {
          ...prev,
          [payload.donation_id]: [...list, {
            ...payload,
            time: new Date(payload.created_at || Date.now()).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
          }]
        };
      });
    };

    socket.on("message:received", handleMessageReceived);
    socket.on("application_message:received", handleMessageReceived);

    return () => {
      clearInterval(interval);
      socket.off("message:received", handleMessageReceived);
      socket.off("application_message:received", handleMessageReceived);
    };
  }, [effectiveUserId, currentUser?.role, currentUser?.name, currentUser?.email]);

  // Bid simulation
  const [priorityScore, setPriorityScore] = useState<number>(65);
  const [urgencyReason, setUrgencyReason] = useState<string>("");
  const [bidSubmitted, setBidSubmitted] = useState<boolean>(false);

  const handleChatScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100;
    setShouldAutoScroll(isAtBottom);
  };

  // Auto-scroll chat modal
  useEffect(() => {
    if (shouldAutoScroll) {
      const container = document.getElementById("live-chat-panel");
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [agentChats, unifiedMessages, agentIsTyping, shouldAutoScroll]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Immobilier": return Home;
      case "Véhicules": return Car;
      case "Financier": return DollarSign;
      case "Matériel": return Package;
      default: return Layers;
    }
  };

  const getCategoryCount = (category: string) => {
    if (category === "Tous") return donations.length;
    return donations.filter(d => d.category === category).length;
  };

  // Filter and sort donations dynamically
  const uniqueLocations = ["Toutes", ...Array.from(new Set(donations.map(d => d.location).filter(Boolean).map(l => l!.trim()))).sort()];

  const filteredDonations = donations.filter(don => {
    const matchesCategory = selectedCategory === "Tous" || don.category === selectedCategory;
    const matchesLocation = selectedLocation === "Toutes" || (don.location && don.location.trim() === selectedLocation);
    
    let matchesTension = true;
    if (selectedTension !== "Tous") {
      if (selectedTension === "Critique") {
        matchesTension = don.current_bids_count >= 5;
      } else if (selectedTension === "Soutenue") {
        matchesTension = don.current_bids_count >= 3 && don.current_bids_count < 5;
      } else if (selectedTension === "Disponible") {
        matchesTension = don.current_bids_count < 3;
      }
    }

    const matchesSearch = don.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          don.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (don.location && don.location.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesLocation && matchesTension && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === "bids_high") return b.current_bids_count - a.current_bids_count;
    if (sortBy === "bids_low") return a.current_bids_count - b.current_bids_count;
    if (sortBy === "value_high") return (b.target_amount || 0) - (a.target_amount || 0);
    if (sortBy === "value_low") return (a.target_amount || 0) - (b.target_amount || 0);
    const dateA = new Date(a.created_at || 0).getTime();
    const dateB = new Date(b.created_at || 0).getTime();
    return dateB - dateA;
  });

  const getTensionIndex = (bidsCount: number) => {
    if (bidsCount >= 5) return { label: "Demande Critique", color: "text-red-700 bg-red-50 border-red-100", icon: Flame };
    if (bidsCount >= 3) return { label: "Demande Soutenue", color: "text-amber-700 bg-amber-50 border-amber-100", icon: TrendingUp };
    return { label: "Opportunité Disponible", color: "text-emerald-700 bg-emerald-50 border-emerald-100", icon: Sparkles };
  };

  const handleApplyClick = (donation: Donation) => {
    const candidateName = currentUser ? currentUser.name : (regName || "Visiteur");
    onApply(donation, candidateName);
    setSelectedDonationForApplyDirect(null);
    setFormResponses({});
  };

  // Registration / Login handler inside modal
  const handleModalRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (isModalLogin) {
      if (!regEmail) return;
      // Login simulation: derive a name from email
      const nameFromEmail = regEmail.split("@")[0];
      const capitalizedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
      onRegisterUser(capitalizedName, regEmail);
    } else {
      if (!regName || !regEmail) return;
      onRegisterUser(regName, regEmail);
    }
    // Reset states
    setRegName("");
    setRegEmail("");
    setRegPassword("");
    setShowModalPassword(false);
  };

  // Submit agent chat message (Real-time with Socket.io)
  const handleAgentChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!chatInput.trim() && !chatAttachment) || !selectedDonationForAgent || isSendingChat) return;

    setIsSendingChat(true);
    const donationId = selectedDonationForAgent.id;
    const payload = {
      donation_id: donationId,
      sender: 'user' as const,
      content: chatInput.trim(),
      attachment: chatAttachment,
      user_name: currentUser?.name || "Visiteur",
      user_id: effectiveUserId,
      is_auth: !!currentUser,
      created_at: new Date().toISOString()
    };

    try {
      const res = await fetch(`/api/agent-conversations/${donationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const savedMsg = await res.json();
        // Mettre à jour immédiatement localement pour une réactivité instantanée de l'IHM
        setUnifiedMessages(prev => {
          if (prev.some((m: any) => m.id === savedMsg.id || (m.content === savedMsg.content && m.created_at === savedMsg.created_at))) {
            return prev;
          }
          return [...prev, savedMsg].sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
        });
        setAgentChats(prev => {
          const list = prev[donationId] || [];
          if (list.some((m: any) => m.id === savedMsg.id || (m.content === savedMsg.content && m.created_at === savedMsg.created_at))) {
            return prev;
          }
          return {
            ...prev,
            [donationId]: [...list, savedMsg]
          };
        });
      }
      setChatAttachment(null);
    } catch (err) {
      console.error("Erreur persistance message:", err);
    } finally {
      setIsSendingChat(false);
      setChatInput("");
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

  const handlePriorityBidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBidSubmitted(true);
    setTimeout(() => {
      setBidSubmitted(false);
      setUrgencyReason("");
      setSelectedDonationForBids(null);
    }, 2500);
  };

  const handleResetFilters = () => {
    setSelectedCategory("Tous");
    setSelectedLocation("Toutes");
    setSelectedTension("Tous");
    setSearchTerm("");
    setSortBy("recent");
  };

  return (
    <div className="space-y-12" id="donation-catalog-root">
      {/* Hero Section Haute de Gamme */}
      <div className="bg-slate-900 text-white rounded-2xl p-8 sm:p-12 shadow-xl relative overflow-hidden group/hero" id="catalog-hero">
        {/* Image de fond avec opacité */}
        <div className="absolute inset-0 z-0">
          <img 
            src={platformHeroImage || "/assets/images/fedex_delivery_car_keys.jpg"} 
            alt="Attribution Solidaire" 
            className="w-full h-full object-cover opacity-40 group-hover/hero:scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent" />
        </div>

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(99,102,241,0.12),transparent_50%)] pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4 animate-fadeIn">
          <span className="px-3 py-1 bg-indigo-500/15 text-indigo-300 border border-indigo-400/20 rounded-full text-[11px] font-bold tracking-wider uppercase inline-block">
            Attribution Solidaire & Transparente
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Plateforme de redistribution <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-emerald-300">
              de dons solidaires de tout genre.
            </span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
            Découvrez nos offres de dons (immobilier, véhicules, subventions financières, équipements) destinées à soutenir vos projets. Suivez l'indice de priorité et l'historique des demandes en toute clarté.
          </p>
        </div>
      </div>

      {/* Barre de Filtres & Recherche Améliorée et Ultra-Harmonieuse */}
      <div className="space-y-4" id="catalog-filters-container">
        <div className="flex flex-col xl:flex-row gap-4 justify-between items-stretch xl:items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm animate-fadeIn" id="catalog-filters">
          
          {/* Catégories Dynamiques */}
          <div className="flex flex-nowrap md:flex-wrap gap-2 items-center overflow-x-auto pb-2 xl:pb-0 scrollbar-hide snap-x w-full">
            {["Tous", "Immobilier", "Véhicules", "Financier", "Matériel", "Mixte"].map((cat) => {
              const IconComponent = getCategoryIcon(cat);
              const count = getCategoryCount(cat);
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  id={`filter-btn-${cat}`}
                  onClick={() => setSelectedCategory(cat)}
                  className={`snap-start px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center gap-2 border whitespace-nowrap flex-shrink-0 ${
                    isActive
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/15"
                      : "bg-slate-50 border-slate-200/60 text-slate-600 hover:bg-slate-100/80"
                  }`}
                >
                  <IconComponent className={`h-3.5 w-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{cat}</span>
                  <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                    isActive 
                      ? "bg-indigo-500 text-white" 
                      : "bg-slate-200/80 text-slate-600"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Recherche & Filtres Avancés */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Zone de recherche */}
            <div className="relative flex-1 sm:w-72" id="search-container">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Rechercher par titre, description, ville..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-400"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Actions de filtrage */}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold border transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                  showAdvancedFilters || selectedLocation !== "Toutes" || selectedTension !== "Tous" || sortBy !== "recent"
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-extrabold shadow-sm"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>Filtres</span>
                {(selectedLocation !== "Toutes" || selectedTension !== "Tous" || sortBy !== "recent") && (
                  <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
                )}
              </button>

              {(selectedCategory !== "Tous" || selectedLocation !== "Toutes" || selectedTension !== "Tous" || searchTerm !== "" || sortBy !== "recent") && (
                <button
                  onClick={handleResetFilters}
                  title="Réinitialiser tous les filtres"
                  className="px-3 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Effacer</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Panneau des Filtres Avancés Dépliable */}
        <AnimatePresence>
          {showAdvancedFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden bg-slate-50 border border-slate-100 rounded-xl p-4 shadow-inner"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Localisation dynamique */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-emerald-500" />
                    Localisation géographique
                  </label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer"
                  >
                    {uniqueLocations.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc === "Toutes" ? "Toutes les localisations" : loc}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Niveau d'attribution / Tension */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Flame className="h-3 w-3 text-red-500" />
                    Indice de demande / Tension
                  </label>
                  <select
                    value={selectedTension}
                    onChange={(e) => setSelectedTension(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer"
                  >
                    <option value="Tous">Tous les niveaux d'intérêt</option>
                    <option value="Critique">Critique (≥ 5 demandes)</option>
                    <option value="Soutenue">Soutenue (3 - 4 demandes)</option>
                    <option value="Disponible">Opportunités libres (&lt; 3 demandes)</option>
                  </select>
                </div>

                {/* Tri des résultats */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <ArrowUpDown className="h-3 w-3 text-indigo-500" />
                    Trier les offres
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer"
                  >
                    <option value="recent">Plus récentes d'abord</option>
                    <option value="bids_high">Demandes : Les plus convoitées</option>
                    <option value="bids_low">Demandes : Les moins convoitées</option>
                    <option value="value_high">Valeur estimée : Décroissante</option>
                    <option value="value_low">Valeur estimée : Croissante</option>
                  </select>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Catalogue des dons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="donations-grid">
        {filteredDonations.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Gift className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Aucun don ne correspond à vos critères.</p>
          </div>
        ) : (
          filteredDonations.map((don, idx) => {
            const tension = getTensionIndex(don.current_bids_count);
            const TensionIcon = tension.icon;

            return (
              <div 
                key={`don-${don.id}-${idx}`} 
                id={`donation-card-${don.id}`}
                className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden group"
              >
                {/* Image de présentation */}
                <div className="relative h-48 bg-slate-100 overflow-hidden">
                  <img 
                    src={don.image_url || "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=600"} 
                    alt={don.title} 
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=600";
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    <span className="px-2.5 py-1 bg-white/95 backdrop-blur-sm text-slate-800 text-[10px] font-bold rounded-md shadow-sm border border-slate-200/50 flex items-center gap-1">
                      <Tag className="h-3 w-3 text-indigo-600" />
                      {don.category}
                    </span>
                  </div>

                  {don.location && (
                    <div className="absolute bottom-3 left-3">
                      <span className="px-2.5 py-1 bg-slate-900/85 backdrop-blur-sm text-white text-[10px] font-medium rounded-md shadow-sm flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-emerald-400" />
                        {don.location}
                      </span>
                    </div>
                  )}
                </div>

                {/* Contenu de la fiche */}
                <div className="p-5 pb-4 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center gap-2">
                      <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border flex items-center gap-1 ${tension.color}`}>
                        <TensionIcon className="h-3 w-3 animate-pulse" />
                        {tension.label}
                      </span>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1 bg-slate-50 border border-slate-100/80 px-1.5 py-0.5 rounded text-[10px]" title="Nombre de personnes ayant consulté ce don">
                          <Eye className="h-3 w-3 text-slate-400" />
                          <span>{don.views_count || 0}</span>
                        </span>
                        <span>
                          {don.current_bids_count} {don.current_bids_count > 1 ? "demandes" : "demande"}
                        </span>
                      </div>
                    </div>

                    <h3 
                      onClick={() => {
                        setSelectedDonationForDetails(don);
                        onViewDonation?.(don.id);
                      }}
                      className="text-base font-bold text-slate-900 line-clamp-1 cursor-pointer hover:text-indigo-600 transition-colors"
                      title="Cliquez pour voir les détails"
                    >
                      {don.title}
                    </h3>
                    
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                      <span className="text-slate-400">Donateur :</span>
                      <span className="text-indigo-600 bg-indigo-50/70 border border-indigo-100/50 px-1.5 py-0.5 rounded font-semibold text-[10px]">
                        {don.donor_name || "Anonyme"}
                      </span>
                    </div>

                    <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed">{don.description}</p>
                  </div>

                  {/* Spécifications rapides (Max 2 clés) */}
                  {don.specifications && (
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px]">
                      {Object.entries(don.specifications).slice(0, 2).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center px-1">
                          <span className="text-slate-400 truncate">{key}</span>
                          <span className="font-semibold text-slate-700 truncate">{value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {don.target_amount && (
                    <div className="p-2.5 bg-indigo-50/40 rounded-lg border border-indigo-100/50 flex items-center justify-between">
                      <span className="text-[11px] text-indigo-800 font-semibold">Valeur estimée</span>
                      <span className="text-sm font-extrabold text-indigo-900">{don.target_amount.toLocaleString("fr-FR")} €</span>
                    </div>
                  )}

                  {/* Boutons d'actions principaux */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    {(() => {
                      const hasAlreadyApplied = currentUser && applications?.some(app => 
                        app.donation_id === don.id && 
                        (app.user_id === currentUser.id || app.user_email === currentUser.email)
                      );

                      if (hasAlreadyApplied) {
                        return (
                          <div
                            className="col-span-2 px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 animate-fadeIn"
                          >
                            <ShieldCheck className="h-4 w-4 text-emerald-600" />
                            Dossier déjà soumis
                          </div>
                        );
                      }

                      return (
                        <>
                          <button
                            onClick={() => {
                              setSelectedDonationForDetails(don);
                              onViewDonation?.(don.id);
                            }}
                            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-all border border-slate-200/60 cursor-pointer flex items-center justify-center gap-1"
                          >
                            Voir fiche
                          </button>
                          <button
                            onClick={() => setSelectedDonationForApplyDirect(don)}
                            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm hover:shadow cursor-pointer flex items-center justify-center gap-1"
                          >
                            Je postule
                          </button>
                        </>
                      );
                    })()}
                    <button
                      onClick={() => {
                        setSelectedDonationForAgent(don);
                        // Initialize chat history if not already present
                        if (!agentChats[don.id]) {
                          setAgentChats(prev => ({
                            ...prev,
                            [don.id]: [
                              { sender: 'agent', content: `Bonjour ! Je suis l'agent d'attribution en charge du don : "${don.title}". Vous pouvez me poser toutes vos questions ici en direct.`, time: "Maintenant" }
                            ]
                          }));
                        }
                      }}
                      className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-all border border-slate-200/60 cursor-pointer flex items-center justify-center gap-1"
                    >
                      Discuter avec l'agent
                    </button>
                    <button
                      onClick={() => setSelectedDonationForBids(don)}
                      className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold transition-all border border-amber-200/50 cursor-pointer flex items-center justify-center gap-1"
                    >
                      Priorité & Enchères
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* --- SECTION TEMOIGNAGES MULTIMEDIAS INTERACTIFS (PREUVE SOCIALE) --- */}
      <section className="bg-slate-900 text-white rounded-2xl p-6 sm:p-10 space-y-8 relative overflow-hidden" id="multimedia-testimonials">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(16,185,129,0.08),transparent_50%)] pointer-events-none" />
        
        <div className="text-center space-y-2 relative z-10">
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-400/20 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block">
            Preuve Sociale & Impact Réel
          </span>
          <h2 className="text-2xl sm:text-3xl font-black">Témoignages de nos bénéficiaires</h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">Découvrez comment les attributions solidaire de DonationSphere transforment le quotidien de vraies personnes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {(() => {
            const approvedTestimonials = testimonials.filter(t => t.approved);
            
            if (approvedTestimonials.length === 0) {
              return (
                <div className="col-span-full py-12 text-center bg-slate-800/40 border border-dashed border-slate-700/50 rounded-2xl">
                  <Sparkles className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-xs font-medium italic">Aucun témoignage n'a encore été publié pour cette période.</p>
                </div>
              );
            }

            return approvedTestimonials.map((t, idx) => (
              <div key={`approved-testi-${t.id || idx}-${idx}`} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 rounded-md text-[9px] font-extrabold uppercase flex items-center gap-1">
                      {t.media_type === "audio" ? <Volume2 className="h-3 w-3" /> : t.media_type === "video" ? <Video className="h-3 w-3" /> : t.media_type === "image" ? <FileText className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                      {t.media_type === "audio" ? "Témoignage Audio" : t.media_type === "video" ? "Témoignage Vidéo" : t.media_type === "image" ? "Témoignage Visuel" : "Citation"}
                    </span>
                    <span className="text-[10px] text-slate-500">{new Date(t.created_at || Date.now()).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</span>
                  </div>
                  {t.quote && (
                    <p className="text-slate-300 text-xs sm:text-sm italic leading-relaxed">
                      "{t.quote}"
                    </p>
                  )}
                </div>

                {t.media_type === "audio" && t.railway_media_url && (
                  <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/40 flex items-center gap-4">
                    <button
                      onClick={() => setPlayingAudioId(playingAudioId === t.id ? null : t.id)}
                      className="h-10 w-10 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-full flex items-center justify-center font-bold shadow transition-all cursor-pointer flex-shrink-0"
                    >
                      {playingAudioId === t.id ? <Pause className="h-4.5 w-4.5 fill-current" /> : <Play className="h-4.5 w-4.5 fill-current ml-0.5" />}
                    </button>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-extrabold text-white truncate max-w-[150px]">{t.author_name}</span>
                        <span className="font-mono text-slate-400">
                          {playingAudioId === t.id ? "Actif" : "Audio"}
                        </span>
                      </div>
                      <div className="flex items-end gap-0.5 h-6">
                        {[4, 8, 2, 6, 9, 3, 5, 8, 4, 7, 2, 5, 8, 4, 9, 3, 6, 8, 2, 5, 7, 3, 9, 4, 6].map((h, i) => (
                          <div
                            key={`freq-bar-catalog-${t.id || 'id'}-${i}`}
                            className={`flex-1 rounded-sm transition-all duration-300 ${
                              playingAudioId === t.id ? "bg-emerald-400 animate-pulse" : "bg-slate-700"
                            }`}
                            style={{ height: playingAudioId === t.id ? `${h * 10}%` : "15%" }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {t.media_type === "video" && t.railway_media_url && (
                  <div 
                    onClick={() => setActiveVideoTestimonial(t)}
                    className="relative h-28 bg-slate-950 rounded-xl overflow-hidden border border-slate-700/50 flex items-center justify-center group cursor-pointer"
                  >
                    <img 
                      src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=400" 
                      alt="Miniature vidéo bénéficiaire" 
                      className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-all duration-500"
                    />
                    <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/30 transition-colors" />
                    <div className="h-10 w-10 bg-white text-slate-950 rounded-full flex items-center justify-center font-bold shadow-lg transition-transform duration-300 group-hover:scale-110 z-10">
                      <Play className="h-4.5 w-4.5 fill-current ml-0.5 text-indigo-600" />
                    </div>
                    <div className="absolute bottom-2.5 left-3 z-10 text-[10px] font-extrabold text-white">
                      {t.author_name} (Témoignage Vidéo)
                    </div>
                  </div>
                )}

                {t.media_type === "image" && t.railway_media_url && (
                  <div className="relative h-32 bg-slate-950 rounded-xl overflow-hidden border border-slate-700/50 flex items-center justify-center group">
                    <img 
                      src={t.railway_media_url} 
                      alt={t.author_name} 
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=600";
                      }}
                      className="w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute bottom-2.5 left-3 z-10 text-[10px] font-extrabold text-white bg-slate-950/40 px-2 py-0.5 rounded">
                      {t.author_name}
                    </div>
                  </div>
                )}

                {t.media_type === "text" && (
                  <div className="mt-auto pt-4 border-t border-slate-700/30">
                    <span className="text-[10px] font-black text-white">{t.author_name}</span>
                  </div>
                )}
              </div>
            ));
          })()}
        </div>
      </section>


      {/* --- MODALES --- */}

      {/* 1. Modale de Fiche de Don Détaillée (SANS numéro de téléphone agent) */}
      <AnimatePresence>
        {selectedDonationForDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDonationForDetails(null)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden z-10 flex flex-col border border-slate-100"
            >
              {/* Header Image */}
              <div className="relative h-60 bg-slate-100">
                <img 
                  src={selectedDonationForDetails.image_url || "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=600"} 
                  alt={selectedDonationForDetails.title} 
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=600";
                  }}
                  className="w-full h-full object-cover"
                />
                <button 
                  onClick={() => setSelectedDonationForDetails(null)}
                  className="absolute top-4 right-4 bg-slate-900/80 hover:bg-slate-900 text-white p-2 rounded-full backdrop-blur-sm transition-all shadow cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-white text-slate-800 text-xs font-bold rounded-lg shadow-sm border border-slate-200 flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5 text-indigo-600" />
                    {selectedDonationForDetails.category}
                  </span>
                </div>
                {selectedDonationForDetails.location && (
                  <div className="absolute bottom-4 left-4">
                    <span className="px-3 py-1 bg-slate-900/85 backdrop-blur-sm text-white text-xs font-medium rounded-lg flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                      {selectedDonationForDetails.location}
                    </span>
                  </div>
                )}
              </div>

              {/* Info Body */}
              <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-20rem)]">
                <div className="space-y-2">
                  <div className="flex justify-between items-center gap-2">
                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${getTensionIndex(selectedDonationForDetails.current_bids_count).color}`}>
                      {getTensionIndex(selectedDonationForDetails.current_bids_count).label}
                    </span>
                    <div className="text-xs text-slate-500 font-semibold flex items-center gap-3">
                      <span className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded text-[11px]" title="Nombre de personnes ayant consulté ce don">
                        <Eye className="h-3.5 w-3.5 text-slate-400" />
                        <span>{selectedDonationForDetails.views_count || 0} consultations</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {selectedDonationForDetails.current_bids_count} demandeurs enregistrés
                      </span>
                    </div>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">{selectedDonationForDetails.title}</h2>
                </div>

                {/* ENCART PÉDAGOGIQUE ENCHÈRE SOLIDAIRE NON-MONÉTAIRE & POSITION */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-4.5 space-y-3 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-100 text-amber-800 rounded-xl flex-shrink-0 mt-0.5">
                      <Award className="h-5 w-5" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <h4 className="text-xs font-extrabold text-amber-900 uppercase tracking-wide">
                        Indice de Priorité & Position Solidaire
                      </h4>
                      {currentUser ? (
                        <p className="text-xs text-slate-700">
                          Votre position estimée dans la file d'attribution :{" "}
                          <span className="font-extrabold text-indigo-700 text-sm bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                            {Math.max(1, Math.round((1 - (priorityScore - 10) / 90) * selectedDonationForDetails.current_bids_count))}e
                          </span>{" "}
                          sur <span className="font-bold text-slate-800">{selectedDonationForDetails.current_bids_count} structure(s)</span>.
                        </p>
                      ) : (
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Connectez-vous pour simuler et déclarer l'indice d'urgence sociale de votre structure.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1.5 pt-1.5 border-t border-amber-200/50">
                    <span className="font-bold text-amber-800 flex items-center gap-1">
                      <Info className="h-4 w-4" />
                      Pas d'enchère financière, aucun frais requis
                    </span>
                    <p className="leading-relaxed text-[11px] text-slate-600">
                      Ici, l'attribution se fait selon un **algorithme d'impact humanitaire et d'urgence d'utilité publique**. 
                      Il ne s'agit **en aucun cas d'une enchère payante**. Vous ne devez et ne pouvez rien verser financièrement. 
                      Les critères que vous déclarez (via le bouton <span className="font-semibold text-amber-700">Priorité & Enchères</span>) 
                      permettent à l'agent d'attribution d'analyser vos besoins immédiats et d'affecter le don de manière équitable et solidaire.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description Complète</h4>
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{selectedDonationForDetails.description}</p>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="font-bold text-slate-700">Donateur initiateur :</span>
                    <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-bold border border-indigo-100">
                      {selectedDonationForDetails.donor_name || "Anonyme"}
                    </span>
                  </div>
                </div>

                {/* Spécifications Détaillées */}
                {selectedDonationForDetails.specifications && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fiche Technique / Spécifications</h4>
                    <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                            <th className="px-4 py-2.5">Caractéristique</th>
                            <th className="px-4 py-2.5">Valeur / Détail</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {Object.entries(selectedDonationForDetails.specifications).map(([key, value]) => (
                            <tr key={key} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-2.5 font-medium text-slate-500">{key}</td>
                              <td className="px-4 py-2.5 font-bold text-slate-900">{value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TÉMOIGNAGES RATTACHÉS À CE DON */}
                {(() => {
                  const donationTestimonials = testimonials.filter(
                    (t) => t.donation_id === selectedDonationForDetails.id || t.donation_id === String(selectedDonationForDetails.id)
                  );
                  if (donationTestimonials.length === 0) return null;

                  return (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Users className="h-4 w-4 text-indigo-500" /> Témoignages & Preuves d'Impact ({donationTestimonials.length})
                      </h4>
                      <div className="flex gap-3 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory -mx-2 px-2 scrollbar-hide">
                        {donationTestimonials.map((t, idx) => (
                          <div key={`don-testi-${t.id || 'id'}-${idx}`} className="min-w-[260px] max-w-[260px] snap-center p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-2.5 flex-shrink-0">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-black text-slate-900 truncate pr-2">{t.author_name}</span>
                              <span className="text-[8px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide flex-shrink-0">
                                {t.media_type === "audio" ? "🔊 Audio" : t.media_type === "image" ? "🖼️ Image" : t.media_type === "video" ? "📺 YouTube" : "📝 Citation"}
                              </span>
                            </div>

                            {t.quote && (
                              <p className="text-xs text-slate-600 italic leading-relaxed line-clamp-3">
                                "{t.quote}"
                              </p>
                            )}

                            {/* Lecteur Audio Intégré */}
                            {t.media_type === "audio" && (
                              <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setPlayingAudioId(playingAudioId === t.id ? null : t.id)}
                                  className="h-6 w-6 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-full flex items-center justify-center font-bold shadow transition-all cursor-pointer flex-shrink-0"
                                >
                                  {playingAudioId === t.id ? (
                                    <Pause className="h-3 w-3 fill-current" />
                                  ) : (
                                    <Play className="h-3 w-3 fill-current ml-0.5" />
                                  )}
                                </button>
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-end gap-[1px] h-3">
                                    {[3, 7, 2, 6, 8, 3, 5, 8, 4, 7, 2, 5, 8, 4].map((h, i) => (
                                      <div
                                        key={`freq-bar-details-${t.id || 'id'}-${i}`}
                                        className={`flex-1 rounded-sm transition-all duration-300 ${
                                          playingAudioId === t.id ? "bg-emerald-400 animate-pulse" : "bg-slate-200"
                                        }`}
                                        style={{
                                          height: playingAudioId === t.id ? `${h * 12}%` : "15%",
                                        }}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Image WebP Intégrée */}
                            {t.media_type === "image" && t.railway_media_url && (
                              <div className="relative rounded-lg overflow-hidden border border-slate-200 h-20 bg-slate-100">
                                <img
                                  src={t.railway_media_url}
                                  alt="Témoignage visuel"
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}

                            {/* Vidéo YouTube intégrée */}
                            {t.media_type === "video" && t.railway_media_url && (
                              <div className="relative rounded-lg overflow-hidden border border-slate-200 h-20 bg-slate-950 flex items-center justify-center group">
                                <img
                                  src="https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=300"
                                  alt="Vidéo d'impact miniature"
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover opacity-60"
                                />
                                <button
                                  type="button"
                                  onClick={() => setActiveVideoTestimonial(t)}
                                  className="absolute h-7 w-7 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-all cursor-pointer"
                                >
                                  <Play className="h-3 w-3 fill-current ml-0.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Agent en charge (SANS NUMÉRO DE TÉLÉPHONE) */}
                {selectedDonationForDetails.agent_name && (
                  <div className="p-4 bg-indigo-50/50 border border-indigo-100/40 rounded-xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow">
                        {selectedDonationForDetails.agent_name.charAt(0)}
                      </div>
                      <div>
                        <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider block">Agent Référent du Don</span>
                        <span className="text-sm font-extrabold text-slate-900">{selectedDonationForDetails.agent_name}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const don = selectedDonationForDetails;
                        setSelectedDonationForDetails(null);
                        setSelectedDonationForAgent(don);
                        if (!agentChats[don.id]) {
                          setAgentChats(prev => ({
                            ...prev,
                            [don.id]: [
                              { sender: 'agent', content: `Bonjour ! Je suis l'agent d'attribution en charge du don : "${don.title}". Vous pouvez me poser toutes vos questions ici en direct.`, time: "Maintenant" }
                            ]
                          }));
                        }
                      }}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow cursor-pointer flex items-center gap-1"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Ouvrir Chat Direct
                    </button>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end items-center gap-2">
                <button
                  onClick={() => setSelectedDonationForDetails(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-200/50 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Fermer la fiche
                </button>
                {(() => {
                  const don = selectedDonationForDetails;
                  const hasAlreadyApplied = currentUser && don && applications?.some(app => 
                    app.donation_id === don.id && 
                    (app.user_id === currentUser.id || app.user_email === currentUser.email)
                  );

                  if (hasAlreadyApplied) {
                    return (
                      <div className="px-5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-bold flex items-center gap-1.5 animate-fadeIn">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        Dossier déjà soumis
                      </div>
                    );
                  }

                  return (
                    <button
                      onClick={() => {
                        const don = selectedDonationForDetails;
                        setSelectedDonationForDetails(null);
                        setSelectedDonationForApplyDirect(don);
                      }}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow cursor-pointer"
                    >
                      Je postule à ce don
                    </button>
                  );
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Modale de Chat Instantané en Direct de l'Agent (SANS inscription requise) */}
      <AnimatePresence>
        {selectedDonationForAgent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDonationForAgent(null)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden z-10 flex flex-col border border-slate-100 h-[460px]"
            >
              {/* Header Chat */}
              <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-xs text-white">
                    {selectedDonationForAgent.agent_name?.charAt(0)}
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-white block">{selectedDonationForAgent.agent_name}</span>
                    <span className="text-[9px] text-emerald-400 font-bold block flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Agent référent (En ligne)
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedDonationForAgent(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-full cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Chat Messages Panel */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50" id="live-chat-panel" onScroll={handleChatScroll}>
                {(() => {
                  const filteredMessages = unifiedMessages.filter((m: any) => m.donation_id === selectedDonationForAgent.id);
                  const msgs = filteredMessages.length > 0 
                    ? filteredMessages 
                    : [
                        {
                          sender: 'agent',
                          sender_type: 'admin',
                          content: `Bonjour ! Je suis l'agent d'attribution en charge du don : "${selectedDonationForAgent.title}". Vous pouvez me poser toutes vos questions ici en direct.`,
                          created_at: new Date().toISOString()
                        }
                      ];

                  return msgs.map((msg, idx) => {
                    const isSystem = msg.sender_type === "system" || msg.sender === "system";
                    const isAdmin = msg.sender_type === "admin" || msg.sender === "agent";
                    const isUser = msg.sender_type === "user" || msg.sender === "user";

                    return (
                      <div 
                        key={idx} 
                        className={`flex flex-col max-w-[85%] ${isUser ? "ml-auto items-end" : "mr-auto items-start"}`}
                      >
                        <span className="text-[9px] font-bold text-slate-400 mb-0.5 flex items-center gap-1">
                          {isSystem ? "🤖 Système d'instruction" : isUser ? "Vous" : (msg.user_name || selectedDonationForAgent.agent_name || "Agent")}
                          {isUser && (
                            <span className={`px-1.5 py-0.5 rounded-full text-[7px] uppercase tracking-tighter ${
                              currentUser ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                            }`}>
                              {currentUser ? "Connecté" : "Invité"}
                            </span>
                          )}
                        </span>
                        <div className={`p-2.5 rounded-xl text-xs leading-relaxed shadow-sm ${
                          isSystem 
                            ? "bg-slate-100 text-slate-700 rounded-tl-none border border-slate-200/50"
                            : isUser 
                              ? "bg-indigo-600 text-white rounded-tr-none" 
                              : "bg-white text-slate-800 rounded-tl-none border border-slate-200/40"
                        }`}>
                          {msg.content}
                          {msg.attachment && (
                            <div className={`mt-2 p-1.5 rounded border flex items-center gap-2 max-w-fit ${isUser ? "bg-indigo-500/50 border-indigo-400" : "bg-slate-50 border-slate-200"}`}>
                              <Paperclip size={12} className={isUser ? "text-indigo-200" : "text-slate-400"} />
                              <a 
                                href={typeof msg.attachment === 'string' ? msg.attachment : (msg.attachment.url || msg.attachment.data)} 
                                download={msg.attachment.name || "piece_jointe"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`text-[10px] font-bold hover:underline truncate max-w-[180px] ${isUser ? "text-white" : "text-indigo-600"}`}
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
                {agentIsTyping && (
                  <div className="mr-auto text-slate-400 text-xs italic flex items-center gap-1 p-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" />
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce delay-100" />
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce delay-200" />
                    L'agent répond...
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Chat */}
              <div className="p-3 bg-white border-t border-slate-100 space-y-2">
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
                <form onSubmit={handleAgentChatSubmit} className="flex gap-2">
                  <label className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer text-slate-400 transition-all flex items-center justify-center">
                    <Paperclip className="h-3.5 w-3.5" />
                    <input type="file" className="hidden" onChange={handleChatFileChange} />
                  </label>
                  <input
                    type="text"
                    placeholder="Écrivez votre message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                  <button
                    type="submit"
                    disabled={(!chatInput.trim() && !chatAttachment) || isSendingChat}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-lg shadow-md transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
                  >
                    {isSendingChat ? <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Modale d'Enchères Solidaires */}
      <AnimatePresence>
        {selectedDonationForBids && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDonationForBids(null)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white w-full max-w-md rounded-2xl shadow-xl z-10 border border-slate-100 max-h-[90vh] flex flex-col overflow-hidden"
            >
              {/* En-tête fixe */}
              <div className="flex justify-between items-start p-6 pb-4 border-b border-slate-100 flex-shrink-0">
                <div className="space-y-1">
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-extrabold rounded-full uppercase tracking-wider inline-block">
                    Priorisation Solidaire Équitable
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900">Indice & Options d'attribution</h3>
                </div>
                <button 
                  onClick={() => setSelectedDonationForBids(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Corps défilant */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs space-y-2 text-slate-600">
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4 text-indigo-500" />
                    Qu'est-ce que la priorisation solidaire ?
                  </span>
                  <p className="leading-relaxed text-[11px]">
                    Nos dons ne sont pas attribués au plus offrant financièrement, mais selon un **système de priorisation d'urgence sociale et d'impact de projet**. **Il s'agit d'un processus 100% gratuit et solidaire, aucun paiement n'est requis ni accepté**. Déclarez votre urgence pour ajuster l'indice d'attribution solidaire.
                  </p>
                </div>

                {bidSubmitted ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2 text-emerald-950"
                  >
                    <Check className="h-6 w-6 text-emerald-600 mx-auto" />
                    <h4 className="text-xs font-bold">Critères d'urgence enregistrés !</h4>
                    <p className="text-[11px] text-emerald-800 leading-normal">
                      Votre indice d'attribution a été calculé et intégré aux algorithmes de priorisation d'urgence sociale de l'agent.
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handlePriorityBidSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>Niveau d'urgence déclaré</span>
                        <span className="text-indigo-600">{priorityScore}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={priorityScore}
                        onChange={(e) => setPriorityScore(Number(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none"
                      />
                      <div className="flex justify-between text-[9px] text-slate-400 font-medium">
                        <span>Modéré (Projet à moyen terme)</span>
                        <span>Urgent (Besoins vitaux immédiats)</span>
                      </div>

                      {/* POSITION DYNAMIQUE REATIVE AU SLIDER */}
                      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-center justify-between text-xs mt-2.5">
                        <span className="text-indigo-950 font-semibold flex items-center gap-1">
                          <Award className="h-4 w-4 text-indigo-600" />
                          Position estimée :
                        </span>
                        <span className="font-extrabold text-indigo-700 bg-white px-2.5 py-1 rounded-lg border border-indigo-100">
                          {Math.max(1, Math.round((1 - (priorityScore - 10) / 90) * selectedDonationForBids.current_bids_count))}e sur {selectedDonationForBids.current_bids_count}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">Justification de l'urgence (Synthèse)</label>
                      <textarea
                        required
                        rows={2}
                        value={urgencyReason}
                        onChange={(e) => setUrgencyReason(e.target.value)}
                        placeholder="Pourquoi votre demande nécessite-t-elle une attribution prioritaire ?"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                      />
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setSelectedDonationForBids(null)}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow cursor-pointer"
                      >
                        Enregistrer les critères
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Modale de Postulation "Je postule" (avec Inscription Interne s'il n'est pas connecté) */}
      <AnimatePresence>
        {selectedDonationForApplyDirect && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDonationForApplyDirect(null)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white w-full max-w-md rounded-2xl shadow-xl z-10 border border-slate-100 max-h-[90vh] flex flex-col overflow-hidden"
            >
              {/* En-tête fixe */}
              <div className="flex justify-between items-start p-6 pb-4 border-b border-slate-100 flex-shrink-0">
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-extrabold rounded-full uppercase tracking-wider inline-block">
                    Dossier d'Instruction Solidaire
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900">Postuler à ce don</h3>
                </div>
                <button 
                  onClick={() => setSelectedDonationForApplyDirect(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Corps du formulaire défilant */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                  <p className="font-semibold">
                    Don sélectionné : <span className="text-indigo-600">{selectedDonationForApplyDirect.title}</span>
                  </p>
                </div>

                {/* FLUX CONDITIONNEL : S'inscrire d'abord (sans quitter la fenêtre de postulation !) */}
                {!currentUser ? (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl space-y-1 text-amber-950">
                      <p className="text-xs font-bold flex items-center gap-1.5">
                        <Lock className="h-4 w-4 text-amber-600" />
                        {isModalLogin ? "Connexion requise pour postuler" : "Inscription requise pour postuler"}
                      </p>
                      <p className="text-[10px] text-amber-900 leading-normal">
                        {isModalLogin 
                          ? "Connectez-vous à votre compte existant. Après authentification, vous pourrez remplir immédiatement votre dossier de candidature."
                          : "Créez un compte instantanément. Dès que vous cliquez sur s'inscrire, la fenêtre de postulation se mettra à jour pour finaliser votre dossier."}
                      </p>
                    </div>

                    <form onSubmit={handleModalRegister} className="space-y-3">
                      {!isModalLogin && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Votre Nom ou Nom d'association</label>
                          <input
                            type="text"
                            required
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                            placeholder="Ex: Marie, Association Aide Plus..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      )}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Adresse E-mail</label>
                        <input
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="nom@exemple.com"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Mot de passe</label>
                        <div className="relative">
                          <input
                            type={showModalPassword ? "text" : "password"}
                            required
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-10 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowModalPassword(!showModalPassword)}
                            className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 focus:outline-none p-0.5 rounded cursor-pointer"
                            title={showModalPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                          >
                            {showModalPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-all shadow cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        {isModalLogin ? (
                          <>
                            <LogIn className="h-4 w-4" />
                            Se connecter & Continuer
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4" />
                            Créer mon compte & Continuer
                          </>
                        )}
                      </button>
                    </form>

                    <div className="text-center pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setIsModalLogin(!isModalLogin);
                          // Reset inputs for clean transition
                          setRegName("");
                          setRegEmail("");
                          setRegPassword("");
                          setShowModalPassword(false);
                        }}
                        className="text-xs text-indigo-600 hover:underline font-semibold cursor-pointer"
                      >
                        {isModalLogin 
                          ? "Pas encore de compte ? S'inscrire gratuitement" 
                          : "Vous avez déjà un compte ? Se connecter"}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* FLUX : Remplissage des champs d'information définis par l'admin */
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Champs d'informations requis</h4>
                      
                      {adminDefinedFields.map((field, idx) => (
                        <div key={`admin-field-${field.key || 'key'}-${idx}`} className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 block">{field.label}</label>
                          {field.type === "textarea" ? (
                            <textarea
                              required
                              rows={3}
                              value={formResponses[field.key] || ""}
                              onChange={(e) => setFormResponses({...formResponses, [field.key]: e.target.value})}
                              placeholder={field.placeholder}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          ) : field.type === "file" ? (
                            <div className="relative border border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-3.5 transition-all bg-slate-50 flex flex-col items-center justify-center gap-1 cursor-pointer">
                              <input
                                type="file"
                                required
                                onChange={(e) => {
                                  const fileName = e.target.files?.[0]?.name || "";
                                  setFormResponses({...formResponses, [field.key]: fileName});
                                }}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                              />
                              <div className="h-7 w-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <FileText className="h-4 w-4" />
                              </div>
                              <span className="text-xs font-semibold text-slate-700 text-center truncate max-w-full px-2">
                                {formResponses[field.key] || field.placeholder || "Sélectionner un fichier"}
                              </span>
                              <span className="text-[9px] text-slate-400">
                                Format requis : PDF, PNG, JPG (Max. 5 Mo)
                              </span>
                            </div>
                          ) : (
                            <input
                              required
                              type={field.type}
                              value={formResponses[field.key] || ""}
                              onChange={(e) => setFormResponses({...formResponses, [field.key]: e.target.value})}
                              placeholder={field.placeholder}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* VISUALISATION DE LA POSITION DE L'ENCHÈRE SOLIDAIRE EN DIRECT */}
                    <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/60 text-xs flex justify-between items-center">
                      <div className="space-y-0.5">
                        <p className="font-extrabold text-indigo-950">Calcul de tension solidaire</p>
                        <p className="text-[10px] text-indigo-800">Votre rang d'urgence calculé en direct</p>
                      </div>
                      <span className="bg-indigo-600 text-white font-extrabold px-3 py-1 rounded-lg text-xs shadow-sm">
                        Position : #{Math.max(1, Math.round((1 - (priorityScore - 10) / 90) * (selectedDonationForApplyDirect?.current_bids_count || 0)))}
                      </span>
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedDonationForApplyDirect(null)}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={() => handleApplyClick(selectedDonationForApplyDirect)}
                        disabled={Object.keys(formResponses).length < adminDefinedFields.length}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        Transmettre et finaliser
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- SECTION PARTENAIRES LOGISTIQUES & INSTITUTIONNELS --- */}
      {partners && partners.length > 0 && (
        <section className="py-12 border-t border-slate-100 space-y-8" id="platform-partners">
          <div className="text-center space-y-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Nos Partenaires de Confiance</h3>
            <p className="text-slate-500 text-[11px]">Ils nous accompagnent dans la logistique, le transport et le financement solidaire.</p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            {partners.map((partner, idx) => (
              <a 
                key={`partner-${partner.id || idx}-${idx}`} 
                href={partner.website || "#"} 
                target="_blank" 
                rel="noreferrer"
                className="h-8 md:h-10 hover:scale-110 transition-transform flex items-center justify-center"
                title={partner.name}
              >
                <img 
                  src={partner.logo_url} 
                  alt={partner.name} 
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=150";
                  }}
                  className="max-h-full max-w-[120px] object-contain" 
                />
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Pop-up Lecteur Vidéo simulé pour les témoignages */}
      <AnimatePresence>
        {activeVideoTestimonial && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveVideoTestimonial(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-black w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden z-10 p-1 border border-slate-800"
            >
              {/* Fake Premium HTML5 Video Player */}
              <div className="relative aspect-video bg-slate-900 flex items-center justify-center overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=600" 
                  alt="Vidéo en cours de lecture" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover opacity-80"
                />
                
                {/* Overlay controls */}
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.7),transparent)]" />
                
                <button 
                  onClick={() => setActiveVideoTestimonial(null)}
                  className="absolute top-4 right-4 bg-slate-900/80 hover:bg-slate-900 text-white p-1.5 rounded-full backdrop-blur-sm transition-all"
                >
                  <X className="h-4.5 w-4.5" />
                </button>

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-14 w-14 bg-indigo-600/90 text-white rounded-full flex items-center justify-center font-bold animate-pulse shadow-xl">
                    <Pause className="h-6 w-6 fill-current" />
                  </div>
                </div>

                <div className="absolute bottom-4 inset-x-4 space-y-2">
                  <div className="flex justify-between items-center text-xs text-slate-300">
                    <span className="font-extrabold text-white">{activeVideoTestimonial.author_name}</span>
                    <span className="font-mono text-slate-400">00:34 / 01:24</span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 w-[40%]" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
