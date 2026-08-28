/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Donation, Testimonial, Application, ApplicationMessage, DbStatus, WorkflowStep } from "./types";
import DonationCatalog from "./components/DonationCatalog";
import CandidateDashboard from "./components/CandidateDashboard";
import AdminDashboard from "./components/AdminDashboard";
import AboutUs from "./components/AboutUs";
import ContactPage from "./components/ContactPage";
import PrivacyPolicy from "./components/PrivacyPolicy";
import TermsOfUse from "./components/TermsOfUse";
import CookieBanner from "./components/CookieBanner";
import AiAssistantWidget from "./components/AiAssistantWidget";
import { registerUser, getSocket } from "./lib/socket";
import { 
  Gift, 
  Layers, 
  ShieldAlert, 
  Loader2, 
  Activity, 
  HelpCircle,
  Database,
  ArrowRight,
  User,
  LogOut,
  X,
  Lock,
  Mail,
  UserCheck,
  Eye,
  EyeOff,
  Send,
  ShieldCheck,
  Globe
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Toaster, toast } from "react-hot-toast";

// Son de notification (Bip court)
const playNotificationSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // La 5
    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.3);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.3);
  } catch (e) {
    // Silencieux si bloqué par le navigateur
  }
};

const DEFAULT_WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: "step_coords",
    label: "Coordonnées",
    description: "Coordonnées de contact du demandeur. Veuillez renseigner votre nom complet, e-mail et numéro de téléphone.",
    iconName: "FileText",
    requiredFileType: "none",
  },
  {
    id: "step_project",
    label: "Projet d'Usage",
    description: "Descriptif du projet solidaire et de l'usage prévu pour le don. Précisez l'impact visé pour votre communauté.",
    iconName: "Sparkles",
    requiredFileType: "none",
  },
  {
    id: "step_identity",
    label: "Identité Officielle",
    description: "Justificatif officiel d'identité (CNI, Passeport, Statuts de l'association) à des fins de certification.",
    iconName: "ShieldCheck",
    requiredFileType: "image",
  },
  {
    id: "step_motivation",
    label: "Lettre de Motivation",
    description: "Message de motivation personnalisé destiné à la commission d'attribution solidaire.",
    iconName: "Mic",
    requiredFileType: "none",
    hasTextField: true,
    textFieldLabel: "Message de motivation",
    textFieldPlaceholder: "Expliquez l'urgence de votre besoin...",
  },
  {
    id: "step_delivery_choice",
    label: "Mode de Transfert",
    description: "Choix du mode de livraison si don en nature, ou mode de réception si don financier.",
    iconName: "Truck",
    requiredFileType: "none"
  }
];

const LANGUAGES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'hr', label: 'Hrvatski', flag: '🇭🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' }
];

const clearGoogtransCookie = () => {
  try {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    const domains = [hostname, `.${hostname}`, ''];
    
    // Dynamically add parent domains (e.g., .run.app, .europe-west3.run.app)
    for (let i = 0; i < parts.length - 1; i++) {
      const parent = parts.slice(i).join('.');
      domains.push(parent);
      domains.push(`.${parent}`);
    }
    
    domains.forEach(dom => {
      const domStr = dom ? `; domain=${dom}` : '';
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/${domStr}`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=;${domStr}`;
    });
  } catch (e) {
    console.error("Cookie clean error", e);
  }
};

export default function App() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [currentLang, setCurrentLang] = useState<string>(() => {
    try {
      return localStorage.getItem("user_lang") || "fr";
    } catch {
      return "fr";
    }
  });

  const changeGoogleTranslate = (langCode: string) => {
    try {
      const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (select) {
        select.value = langCode;
        select.dispatchEvent(new Event('change'));
      } else {
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          const retrySelect = document.querySelector('.goog-te-combo') as HTMLSelectElement;
          if (retrySelect) {
            retrySelect.value = langCode;
            retrySelect.dispatchEvent(new Event('change'));
            clearInterval(interval);
          } else if (attempts > 30) {
            clearInterval(interval);
          }
        }, 200);
      }
    } catch (e) {
      console.error("Google translate trigger error", e);
    }
  };

  const handleLanguageChange = (langCode: string) => {
    try {
      setCurrentLang(langCode);
      localStorage.setItem("user_lang", langCode);
      localStorage.setItem("user_language_initialized", "true");
      
      // Clear existing cookies first to avoid conflicts
      clearGoogtransCookie();
      
      if (langCode !== "fr") {
        document.cookie = `googtrans=/fr/${langCode}; path=/;`;
        document.cookie = `googtrans=/fr/${langCode}; path=/; domain=${window.location.hostname};`;
        document.cookie = `googtrans=/fr/${langCode}; path=/; domain=.${window.location.hostname};`;
      }

      // Reload page to force Google Translate to initialize in the correct language from the cookie
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const savedLangOnBoot = localStorage.getItem("user_lang") || "fr";
    if (savedLangOnBoot === "fr") {
      clearGoogtransCookie();
    }

    const initTranslation = () => {
      if (document.getElementById("google-translate-script")) {
        // If already loaded, trigger translation to match saved preference
        const savedLang = localStorage.getItem("user_lang") || "fr";
        if (savedLang !== "fr") {
          changeGoogleTranslate(savedLang);
        }
        return;
      }

      (window as any).googleTranslateElementInit = () => {
        new (window as any).google.translate.TranslateElement({
          pageLanguage: 'fr',
          includedLanguages: 'fr,en,hr,de,es,it,nl,pt',
          autoDisplay: false
        }, 'google_translate_element');

        // Once initialized, trigger saved language if not French
        const savedLang = localStorage.getItem("user_lang") || "fr";
        if (savedLang !== "fr") {
          setTimeout(() => changeGoogleTranslate(savedLang), 500);
        }
      };

      if (!document.getElementById("google_translate_element")) {
        const div = document.createElement("div");
        div.id = "google_translate_element";
        // Keep it rendered offscreen so the Google widget script actually initializes its children DOM elements
        div.style.position = "absolute";
        div.style.top = "-9999px";
        div.style.left = "-9999px";
        div.style.width = "1px";
        div.style.height = "1px";
        div.style.overflow = "hidden";
        document.body.appendChild(div);
      }

      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.type = "text/javascript";
      script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      document.body.appendChild(script);
    };

    initTranslation();

    // Détection automatique lors de la première visite du pays/navigateur
    try {
      const isInitialized = localStorage.getItem("user_language_initialized");
      if (!isInitialized) {
        const detected = (navigator.language || (navigator as any).userLanguage || "fr").split("-")[0].toLowerCase();
        const supported = ["en", "hr", "de", "es", "it", "nl", "pt"];
        if (supported.includes(detected) && detected !== "fr") {
          document.cookie = `googtrans=/fr/${detected}; path=/;`;
          document.cookie = `googtrans=/fr/${detected}; path=/; domain=${window.location.hostname};`;
          document.cookie = `googtrans=/fr/${detected}; path=/; domain=.${window.location.hostname};`;
          localStorage.setItem("user_language_initialized", "true");
          localStorage.setItem("user_lang", detected);
          window.location.reload();
        } else {
          localStorage.setItem("user_language_initialized", "true");
          localStorage.setItem("user_lang", "fr");
        }
      }
    } catch (e) {
      console.error("Erreur de détection de langue", e);
    }
  }, []);

  // Navigation active tab: 'catalog', 'dashboard', 'about', 'contact', 'admin'
  const [activeTab, setActiveTab] = useState<"catalog" | "dashboard" | "about" | "contact" | "admin" | "privacy" | "terms">(() => {
    try {
      const saved = localStorage.getItem("activeTab");
      if (saved && ["catalog", "dashboard", "about", "contact", "admin"].includes(saved)) {
        return saved as any;
      }
    } catch {}
    return "catalog";
  });
  
  // Base de données state
  const [donations, setDonations] = useState<Donation[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [messages, setMessages] = useState<Record<string, ApplicationMessage[]>>({});
  const [submissions, setSubmissions] = useState<Record<string, any[]>>({});
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);
  const [partners, setPartners] = useState<any[]>([]);

  // Workflow steps configurables par l'admin
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>(() => {
    const saved = localStorage.getItem("workflow_steps");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse workflow steps", e);
      }
    }
    return DEFAULT_WORKFLOW_STEPS;
  });

  useEffect(() => {
    localStorage.setItem("workflow_steps", JSON.stringify(workflowSteps));
  }, [workflowSteps]);

  // Dynamic application form fields (now synced with API)
  const [adminDefinedFields, setAdminDefinedFields] = useState<Array<{key: string, label: string, type: string, placeholder: string}>>([]);
  const [platformLogo, setPlatformLogo] = useState<string>("/assets/images/logo_donationsphere_1785861089629.jpg");
  const [platformHeroImage, setPlatformHeroImage] = useState<string>("/assets/images/fedex_delivery_car_keys.jpg");

  // Charger les paramètres depuis l'API
  const fetchSettings = async () => {
    try {
      const [resFields, resWorkflow, resLogo, resHero] = await Promise.all([
        fetch("/api/settings/admin_defined_fields"),
        fetch("/api/settings/workflow_steps"),
        fetch("/api/settings/platform_logo").catch(() => null),
        fetch("/api/settings/platform_hero_image").catch(() => null)
      ]);

      if (resFields.ok) {
        const data = await resFields.json();
        setAdminDefinedFields(data);
      }

      if (resWorkflow.ok) {
        const data = await resWorkflow.json();
        if (data && Array.isArray(data)) {
          setWorkflowSteps(data);
          localStorage.setItem("workflow_steps", JSON.stringify(data));
        }
      }

      if (resLogo && resLogo.ok) {
        const logoUrl = await resLogo.json().catch(() => null);
        if (logoUrl && typeof logoUrl === "string") {
          setPlatformLogo(logoUrl);
        }
      }

      if (resHero && resHero.ok) {
        const heroUrl = await resHero.json().catch(() => null);
        if (heroUrl && typeof heroUrl === "string") {
          setPlatformHeroImage(heroUrl);
        }
      }
    } catch (e) {
      console.error("Erreur lors du chargement des paramètres", e);
    }
  };

  const savePlatformHeroImage = async (imageUrl: string) => {
    const loadingToast = toast.loading("Enregistrement de l'image de couverture...");
    try {
      const res = await fetch("/api/settings/platform_hero_image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: imageUrl })
      });
      if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);
      setPlatformHeroImage(imageUrl);
      toast.dismiss(loadingToast);
      toast.success("Image de couverture sauvegardée !");
    } catch (e) {
      console.error("Erreur", e);
      toast.dismiss(loadingToast);
      toast.error("Erreur de connexion.");
      setPlatformHeroImage(imageUrl);
    }
  };

  const savePlatformLogo = async (logoUrl: string) => {
    const loadingToast = toast.loading("Enregistrement du logo sur le serveur...");
    try {
      const res = await fetch("/api/settings/platform_logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: logoUrl })
      });
      if (!res.ok) {
        throw new Error(`Erreur HTTP: ${res.status}`);
      }
      setPlatformLogo(logoUrl);
      toast.dismiss(loadingToast);
      toast.success("Logo sauvegardé avec succès sur le serveur !");
    } catch (e) {
      console.error("Erreur lors de la sauvegarde du logo", e);
      toast.dismiss(loadingToast);
      toast.error("Impossible de sauvegarder le logo sur le serveur.");
    }
  };

  const saveAdminFields = async (fields: any[]) => {
    try {
      await fetch("/api/settings/admin_defined_fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: fields })
      });
      setAdminDefinedFields(fields);
    } catch (e) {
      console.error("Erreur lors de la sauvegarde des paramètres", e);
    }
  };

  const saveWorkflowSteps = async (steps: WorkflowStep[]) => {
    console.log("[WORKFLOW] Tentative de sauvegarde des étapes:", steps.length);
    try {
      const res = await fetch("/api/settings/workflow_steps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: steps })
      });
      if (res.ok) {
        const data = await res.json();
        console.log("[WORKFLOW] Sauvegarde réussie sur le serveur.");
        if (data && Array.isArray(data)) {
          setWorkflowSteps(data);
          localStorage.setItem("workflow_steps", JSON.stringify(data));
        }
      } else {
        console.error("[WORKFLOW] Erreur serveur lors de la sauvegarde:", res.status);
      }
    } catch (e) {
      console.error("[WORKFLOW] Exception lors de la sauvegarde du workflow", e);
    }
  };
  
  // Candidature active dans le dashboard
  const [activeApplicationId, setActiveApplicationId] = useState<string | null>(() => {
    try {
      return localStorage.getItem("activeApplicationId");
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Authentification fictive pour simulation publique
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; id?: string; role?: string } | null>(() => {
    try {
      const saved = localStorage.getItem("currentUser");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const isAdmin = currentUser?.role === "admin" || currentUser?.email === "admin@donationsphere.com" || currentUser?.email === "asthedio@gmail.com";
  const isResponsable = currentUser?.role === "responsable";
  const hasManagementAccess = isAdmin || isResponsable;
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState<boolean>(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState<boolean>(false);
  const [resetEmailSent, setResetEmailSent] = useState<boolean>(false);
  const [isUpdatePasswordMode, setIsUpdatePasswordMode] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState<string>("");
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState<boolean>(false);

  useEffect(() => {
    // Vérifier si on est sur la page de réinitialisation de mot de passe (via Supabase redirect)
    if (window.location.hash.includes("type=recovery") || window.location.pathname.includes("/reset-password")) {
      setIsUpdatePasswordMode(true);
    }
  }, []);

  // Synchronisation avec localStorage
  useEffect(() => {
    try {
      localStorage.setItem("activeTab", activeTab);
    } catch {}
  }, [activeTab]);

  useEffect(() => {
    try {
      if (activeApplicationId) {
        localStorage.setItem("activeApplicationId", activeApplicationId);
      } else {
        localStorage.removeItem("activeApplicationId");
      }
    } catch {}
  }, [activeApplicationId]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
      } else {
        localStorage.removeItem("currentUser");
      }
    } catch {}
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      registerUser({
        name: currentUser.name,
        is_admin: currentUser.email === "admin@donationsphere.com" || currentUser.email === "asthedio@gmail.com" || currentUser.email?.toLowerCase().includes("admin") || currentUser.role === "admin" || currentUser.role === "responsable",
        is_auth: true,
        email: currentUser.email
      });
    } else {
      registerUser({
        name: "Visiteur",
        is_admin: false,
        is_auth: false
      });
    }
  }, [currentUser]);

  useEffect(() => {
    const socket = getSocket();
    const handleAppMessage = (payload: any) => {
      setMessages(prev => {
        const list = prev[payload.application_id] || [];
        if (list.some(m => m.id === payload.id)) return prev;
        return {
          ...prev,
          [payload.application_id]: [...list, payload]
        };
      });

      // Notification visuelle et sonore si le message vient de l'agent ou du système
      if (payload.sender_type !== "user") {
        playNotificationSound();
        toast(`Nouveau message: ${payload.content.substring(0, 50)}${payload.content.length > 50 ? '...' : ''}`, {
          icon: '💬',
          position: 'top-right',
          duration: 4000
        });
      }
    };

    const handleDirectMessage = (payload: any) => {
      // Déclencher une notification si c'est l'agent qui répond
      if (payload.sender === "agent") {
        playNotificationSound();
        toast("L'agent vous a répondu dans le chat en direct", {
          icon: '🤖',
          position: 'top-right'
        });
      }
    };

    const handleDonationUpdated = (updatedDon: Donation) => {
      setDonations(prev => prev.map(d => d.id === updatedDon.id ? updatedDon : d));
    };

    socket.on("application_message:received", handleAppMessage);
    socket.on("message:received", handleDirectMessage);
    socket.on("donation:updated", handleDonationUpdated);
    return () => {
      socket.off("application_message:received", handleAppMessage);
      socket.off("message:received", handleDirectMessage);
      socket.off("donation:updated", handleDonationUpdated);
    };
  }, []);
  const [authEmail, setAuthEmail] = useState<string>("");
  const [authPassword, setAuthPassword] = useState<string>("");
  const [authName, setAuthName] = useState<string>("");

  // Charger les données initiales depuis le serveur Express
  const fetchAllData = async () => {
    try {
      const [resDons, resTestimonials, resApps, resStatus, resPartners, resSubmissions] = await Promise.all([
        fetch("/api/donations"),
        fetch("/api/testimonials"),
        fetch("/api/applications"),
        fetch("/api/db-status"),
        fetch("/api/partners"),
        fetch("/api/submissions")
      ]);

      await fetchSettings();

      const donsData = await resDons.json();
      const testimonialsData = await resTestimonials.json();
      const appsData = await resApps.json();
      const statusData = await resStatus.json();
      const partnersData = await resPartners.json();
      const subsData = await resSubmissions.json();

      const uniqueApps = appsData.filter((app: any, index: number, self: any[]) => 
        index === self.findIndex((a) => a.id === app.id)
      );
      const uniqueDons = donsData.filter((don: any, index: number, self: any[]) => 
        index === self.findIndex((d) => d.id === don.id)
      );
      const uniqueTestimonials = testimonialsData.filter((t: any, index: number, self: any[]) => 
        index === self.findIndex((te) => te.id === t.id)
      );

      const uniquePartners = partnersData.filter((p: any, index: number, self: any[]) => 
        index === self.findIndex((partner) => partner.id === p.id)
      );

      setDonations(uniqueDons);
      setTestimonials(uniqueTestimonials);
      setApplications(uniqueApps);
      setDbStatus(statusData);
      setPartners(uniquePartners);

      // Organiser les soumissions par application_id
      const subsMap: Record<string, any[]> = {};
      subsData.forEach((sub: any) => {
        if (!subsMap[sub.application_id]) subsMap[sub.application_id] = [];
        if (!subsMap[sub.application_id].some((s: any) => s.id === sub.id)) {
          subsMap[sub.application_id].push(sub);
        }
      });
      setSubmissions(subsMap);

      // Filtrer les candidatures éligibles à l'auto-sélection pour l'utilisateur courant (les admins voient tout)
      const eligibleApps = uniqueApps.filter((app: any) => {
        if (isAdmin || isResponsable) return true;
        if (currentUser) {
          return app.user_id === currentUser.id;
        }
        return false;
      });

      const isCurrentActiveValid = activeApplicationId && eligibleApps.some(app => app.id === activeApplicationId);

      if (eligibleApps.length > 0 && (!activeApplicationId || !isCurrentActiveValid)) {
        const latestApp = eligibleApps[0];
        setActiveApplicationId(latestApp.id);
        fetchMessages(latestApp.id);
      } else if (eligibleApps.length === 0) {
        setActiveApplicationId(null);
      }

      // Récupérer les messages uniquement pour les applications éligibles (uniques)
      for (const app of eligibleApps) {
        fetchMessages(app.id);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des données :", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (appId: string) => {
    if (!appId || typeof appId !== 'string' || appId === "undefined" || appId === "null") return;
    try {
      const res = await fetch(`/api/messages/${appId}`);
      if (!res.ok) return;
      const data = await res.json();
      setMessages(prev => ({ ...prev, [appId]: data }));
    } catch (e) {
      // Ignorer les erreurs de fetch silencieusement pour éviter de polluer la console
      // si l'application est en cours de fermeture ou si le réseau est instable
    }
  };

  useEffect(() => {
    fetchAllData();
    
    // Polling d'actualisation légère toutes les 4 secondes (Simule Supabase Realtime)
    const interval = setInterval(() => {
      fetch("/api/applications")
        .then(res => res.json())
        .then(appsData => {
          setApplications(appsData);
          
          const uniqueApps = appsData.filter((app: any, index: number, self: any[]) => 
            index === self.findIndex((a) => a.id === app.id)
          );
          
          const eligibleApps = uniqueApps.filter((app: any) => {
            if (isAdmin || isResponsable) return true;
            if (currentUser) {
              return app.user_id === currentUser.id;
            }
            return false;
          });

          const isCurrentActiveValid = activeApplicationId && eligibleApps.some(app => app.id === activeApplicationId);

          if (eligibleApps.length > 0 && (!activeApplicationId || !isCurrentActiveValid)) {
            const latestApp = eligibleApps[0];
            setActiveApplicationId(latestApp.id);
            fetchMessages(latestApp.id);
          } else if (eligibleApps.length === 0 && activeApplicationId) {
            setActiveApplicationId(null);
          } else if (activeApplicationId) {
            fetchMessages(activeApplicationId);
          }
        });
    }, 4000);

    return () => clearInterval(interval);
  }, [activeApplicationId, currentUser, isAdmin, isResponsable]);

  // ACTION : Enregistrer une vue/consultation pour un don
  const handleViewDonation = async (id: string) => {
    try {
      const response = await fetch(`/api/donations/${id}/view`, { method: "POST" });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setDonations(prev => prev.map(d => d.id === id ? { ...d, views_count: result.views_count } : d));
        }
      }
    } catch (e) {
      console.error("Erreur incrementation des vues:", e);
    }
  };

  // ACTION : Créer une candidature (Fast-Track)
  const handleApply = async (donation: Donation, candidateName: string) => {
    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donation_id: donation.id,
          user_name: currentUser ? currentUser.name : candidateName,
          user_id: currentUser ? currentUser.id : undefined,
          user_email: currentUser ? currentUser.email : undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || "Une erreur est survenue lors de l'envoi de votre candidature.");
        return;
      }

      const newApp = await response.json();
      
      // Mettre à jour l'arborescence des états
      setApplications(prev => [newApp, ...prev]);
      setActiveApplicationId(newApp.id);
      
      // Charger le message système d'initialisation
      await fetchMessages(newApp.id);

      toast.success("Votre dossier de candidature a été créé avec succès !");

      // Rediriger immédiatement vers le tracker de candidature
      setActiveTab("dashboard");
      
      // Mettre à jour le compteur sur le don localement
      setDonations(prev => prev.map(d => d.id === donation.id ? { ...d, current_bids_count: d.current_bids_count + 1 } : d));
    } catch (err) {
      console.error("Erreur d'ouverture de dossier :", err);
      toast.error("Impossible d'ouvrir le dossier. Veuillez réessayer.");
    }
  };

  // ACTION : Envoyer un message dans le chat candidat
  const handleSendMessage = async (content: string, attachment?: any) => {
    if (!activeApplicationId) return;

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          application_id: activeApplicationId,
          sender_type: "user",
          content,
          attachment: attachment || null
        })
      });

      const newMsg = await res.json();
      
      // Mettre à jour les messages localement
      setMessages(prev => ({
        ...prev,
        [activeApplicationId]: [...(prev[activeApplicationId] || []), newMsg]
      }));

      // Simulation de réponse de guidance automatique (si sandbox/local)
      if (!dbStatus?.connectedToSupabase) {
        setTimeout(async () => {
          const systemRes = await fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              application_id: activeApplicationId,
              sender_type: "system",
              content: "Votre message a été enregistré dans votre dossier d'instruction. Un de nos agents d'attribution en prendra connaissance très rapidement !"
            })
          });
          const systemMsg = await systemRes.json();
          setMessages(prev => ({
            ...prev,
            [activeApplicationId]: [...(prev[activeApplicationId] || []), systemMsg]
          }));
        }, 1500);
      }
    } catch (e) {
      console.error("Échec d'envoi du message", e);
    }
  };

  // ACTION : Envoyer un message admin
  const handleSendAdminMessage = async (appId: string, content: string, attachment?: any) => {
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          application_id: appId,
          sender_type: "admin",
          content,
          attachment: attachment || null
        })
      });

      const newMsg = await res.json();
      setMessages(prev => ({
        ...prev,
        [appId]: [...(prev[appId] || []), newMsg]
      }));
    } catch (e) {
      console.error("Échec envoi réponse admin", e);
    }
  };

  // ACTION : Soumettre une étape
  const handleSubmitStep = async (stepIndex: number, formData: any) => {
    if (!activeApplicationId) return;

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          application_id: activeApplicationId,
          step_index: stepIndex,
          form_data: formData
        })
      });

      await response.json();

      // Calcul dynamique basé sur la configuration réelle du workflow d'instruction
      const nextStep = stepIndex + 1;
      const totalSteps = workflowSteps.length;
      const boundedNextStep = nextStep > totalSteps ? totalSteps : nextStep;
      const newPercentage = Math.round((boundedNextStep / totalSteps) * 100);

      const riskLevel = newPercentage < 40 ? 'low' :
                        newPercentage < 70 ? 'medium' :
                        newPercentage < 90 ? 'high' : 'critical';

      // Mettre à jour la candidature sur le serveur
      await fetch(`/api/applications/${activeApplicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_step: boundedNextStep,
          completion_percentage: newPercentage,
          risk_level: riskLevel
        })
      });

      // Émettre un message système personnalisé selon la prochaine étape réelle
      const nextWorkflowStep = workflowSteps[boundedNextStep];
      let guideText = "";
      if (boundedNextStep >= totalSteps) {
        guideText = `Félicitations ! Votre dossier d'instruction est maintenant complété à 100% (${boundedNextStep}/${totalSteps} étapes passées). Il est en cours de révision de conformité finale par la commission solidaire.`;
      } else if (nextWorkflowStep) {
        guideText = `Étape ${stepIndex + 1} complétée avec succès ! Passage à l'Étape ${boundedNextStep + 1} : "${nextWorkflowStep.label}". Consignes de l'agent : ${nextWorkflowStep.description}`;
      }

      if (guideText) {
        await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            application_id: activeApplicationId,
            sender_type: "system",
            content: guideText
          })
        });
      }

      // Recharger toutes les données pour rafraîchir le pourcentage d'avancement, l'étape active, etc.
      await fetchAllData();
      await fetchMessages(activeApplicationId);
    } catch (err) {
      console.error("Erreur de soumission d'étape :", err);
    }
  };

  // ACTION : Réinitialiser la DB démo locale
  const handleResetDb = async () => {
    setLoading(true);
    try {
      await fetch("/api/db-reset", { method: "POST" });
      setActiveApplicationId(null);
      await fetchAllData();
      setActiveTab("catalog");
    } catch (e) {
      console.error("Impossible de réinitialiser", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubmission = async (id: string) => {
    try {
      const res = await fetch(`/api/submissions/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Document supprimé avec succès");
        await fetchAllData();
        return true;
      }
      return false;
    } catch (err) {
      toast.error("Erreur lors de la suppression du document");
      return false;
    }
  };

  // ACTION : Publier un nouveau don
  const handleCreateDonation = async (donationData: any) => {
    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(donationData)
      });
      const newDon = await res.json();
      setDonations(prev => [newDon, ...prev]);
      return newDon;
    } catch (e) {
      console.error("Échec publication don", e);
      return null;
    }
  };

  // ACTION : Supprimer définitivement un don (Admin)
  const handleDeleteDonation = async (id: string) => {
    try {
      const res = await fetch(`/api/donations/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setDonations(prev => prev.filter(d => d.id !== id));
        toast.success("Don supprimé avec succès !");
        return true;
      } else {
        const err = await res.json();
        toast.error(err.error || "Échec de la suppression");
        return false;
      }
    } catch (e) {
      console.error("Échec suppression don", e);
      toast.error("Erreur réseau lors de la suppression");
      return false;
    }
  };

  // ACTION : Mettre à jour une application (Admin)
  const handleUpdateApplication = async (id: string, updates: any) => {
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      const updatedApp = await res.json();
      
      setApplications(prev => prev.map(a => a.id === id ? updatedApp : a));
      
      // Si c'est l'application active en cours d'examen, on rafraîchit l'affichage
      if (activeApplicationId === id) {
        fetchAllData();
      }
    } catch (e) {
      console.error("Échec mise à jour application", e);
    }
  };

  // ACTION : Supprimer définitivement une application (Admin)
  const handleDeleteApplication = async (id: string) => {
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "DELETE"
      });
      
      if (res.ok) {
        setApplications(prev => prev.filter(a => a.id !== id));
        if (activeApplicationId === id) {
          setActiveApplicationId(null);
        }
        toast.success("Dossier de candidature supprimé avec succès !");
      } else {
        const err = await res.json();
        toast.error(err.error || "Impossible de supprimer le dossier.");
      }
    } catch (e) {
      console.error("Échec de la suppression de la candidature", e);
      toast.error("Une erreur réseau est survenue.");
    }
  };

  // Simulation Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword || isAuthLoading) return;
    
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });
      
      if (res.ok) {
        const user = await res.json();
        setCurrentUser(user);
        setIsLoginOpen(false);
        setAuthEmail("");
        setAuthPassword("");
      } else {
        const err = await res.json();
        setAuthError(err.error || "Adresse e-mail ou mot de passe incorrect.");
      }
    } catch (e) {
      console.error("Erreur de connexion", e);
      setAuthError("Erreur réseau ou serveur. Veuillez réessayer.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Simulation Inscription
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authName || !authEmail || !authPassword) return;

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: authName, email: authEmail, password: authPassword })
      });

      if (res.ok) {
        const user = await res.json();
        setCurrentUser(user);
        setIsRegisterOpen(false);
        setAuthName("");
        setAuthEmail("");
        setAuthPassword("");
      } else {
        const err = await res.json();
        alert(err.error || "Échec de l'inscription");
      }
    } catch (e) {
      console.error("Erreur d'inscription", e);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab("catalog");
    setIsLogoutConfirmOpen(false);
  };

  const handleResetPasswordRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || isAuthLoading) return;
    
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail })
      });
      if (res.ok) {
        setResetEmailSent(true);
      } else {
        const err = await res.json();
        setAuthError(err.error || "Erreur lors de la demande");
      }
    } catch (e) {
      setAuthError("Erreur réseau");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || isAuthLoading) return;

    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword })
      });
      if (res.ok) {
        alert("Mot de passe mis à jour ! Veuillez vous connecter.");
        setIsUpdatePasswordMode(false);
        window.location.href = "/";
      } else {
        const err = await res.json();
        setAuthError(err.error || "Échec de la mise à jour");
      }
    } catch (e) {
      setAuthError("Erreur réseau");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleRegisterUser = (name: string, email: string) => {
    setCurrentUser({
      name,
      email
    });
  };

  const userSpecificApplications = applications.filter((app: any) => {
    if (isAdmin || isResponsable) return true;
    if (currentUser) {
      return app.user_id === currentUser.id;
    }
    return false;
  });

  const activeApp = userSpecificApplications.find(a => a.id === activeApplicationId);
  const activeDonation = activeApp ? donations.find(d => d.id === activeApp.donation_id) : null;

  useEffect(() => {
    if (activeTab === "admin" && !hasManagementAccess) {
      setActiveTab("catalog");
    }
  }, [activeTab, currentUser, hasManagementAccess]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-3" id="loading-spinner-root">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
        <p className="text-slate-500 text-xs font-semibold tracking-wider uppercase">Chargement de la Plateforme d'Attribution...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans flex flex-col justify-between" id="app-root">
      <Toaster />
      <CookieBanner />
      <div className="w-full">
        {/* MAIN NAVBAR */}
        <header className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm" id="main-header">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
            
            {/* Logo public épuré */}
            <div className="flex items-center gap-2.5 cursor-pointer flex-shrink-0" id="brand-logo" onClick={() => setActiveTab("catalog")}>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center overflow-hidden shadow-md">
                <img 
                  src={platformLogo} 
                  alt="Logo DonationSphere" 
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=200";
                  }}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="hidden sm:block">
                <span className="font-extrabold text-slate-950 text-base sm:text-lg block leading-none tracking-tight">
                  DonationSphere
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-1">
                  Solidarité & Redistribution
                </span>
              </div>
            </div>

            {/* Menu de Navigation Épuré */}
            <nav className="hidden lg:flex items-center gap-1" id="nav-tabs">
              <button
                id="tab-catalog-btn"
                onClick={() => setActiveTab("catalog")}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "catalog"
                    ? "bg-slate-100 text-slate-900 border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50/50"
                }`}
              >
                Vitrine des Dons
              </button>

              {currentUser && (
                <button
                  id="tab-dashboard-btn"
                  onClick={() => setActiveTab(hasManagementAccess ? "admin" : "dashboard")}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all relative cursor-pointer ${
                    activeTab === "dashboard" || activeTab === "admin"
                      ? "bg-slate-100 text-slate-900 border border-slate-200/50"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50/50"
                  }`}
                >
                  {isAdmin ? "Espace Admin" : isResponsable ? "Gestion des Dossiers" : "Suivi des Demandes"}
                  {activeApplicationId && (
                    <span className="absolute top-1 right-1 flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-600"></span>
                    </span>
                  )}
                </button>
              )}

              <button
                id="tab-about-btn"
                onClick={() => setActiveTab("about")}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "about"
                    ? "bg-slate-100 text-slate-900 border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50/50"
                }`}
              >
                Qui sommes-nous
              </button>

              <button
                id="tab-contact-btn"
                onClick={() => setActiveTab("contact")}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "contact"
                    ? "bg-slate-100 text-slate-900 border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50/50"
                }`}
              >
                Contact
              </button>

            </nav>
 
            {/* Barre de navigation mobile / Tablettes compacte */}
            <div className="lg:hidden flex items-center flex-1 justify-center px-1 sm:px-2">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] sm:text-xs font-bold text-slate-700 focus:outline-none w-full max-w-[130px] sm:max-w-[160px] truncate"
              >
                <option value="catalog">Vitrine des Dons</option>
                {currentUser && (
                  <option value={hasManagementAccess ? "admin" : "dashboard"}>
                    {isAdmin ? "Espace Admin" : isResponsable ? "Gestion des Dossiers" : "Suivi des Demandes"}
                  </option>
                )}
                <option value="about">Qui sommes-nous</option>
                <option value="contact">Contact</option>
              </select>
            </div>

            {/* Sélecteur de Langue Dynamique (Google Translate) */}
            <div className="flex items-center" id="language-switcher-container">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 rounded-xl px-2.5 py-1.5 hover:bg-slate-100/70 transition-all shadow-sm">
                <Globe className="h-3.5 w-3.5 text-slate-500" />
                <select
                  value={currentLang}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="bg-transparent text-[11px] sm:text-xs font-bold text-slate-700 focus:outline-none cursor-pointer pr-1"
                  title="Choisir la langue / Choose language"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code} className="text-slate-800 bg-white">
                      {lang.flag} {isMobile ? lang.code.toUpperCase() : lang.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Authentification publique simulée */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0" id="auth-buttons">
              {currentUser ? (
                <div className="flex items-center gap-1 sm:gap-3 bg-slate-50 border border-slate-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl">
                  <button
                    onClick={() => setActiveTab(hasManagementAccess ? "admin" : "dashboard")}
                    className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity cursor-pointer focus:outline-none"
                    title="Aller au tableau de bord"
                  >
                    <div className="h-6 w-6 sm:h-7 sm:w-7 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-xs">
                      {currentUser.name.charAt(0)}
                    </div>
                    <span className="text-[11px] sm:text-xs font-bold text-slate-700 hidden sm:inline">
                      {currentUser.name}
                    </span>
                  </button>
                  <button 
                    onClick={() => setIsLogoutConfirmOpen(true)}
                    title="Se déconnecter"
                    className="p-1 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <button
                    onClick={() => setIsLoginOpen(true)}
                    className="px-2 sm:px-3 py-1.5 hover:bg-slate-100 text-slate-700 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                  >
                    Connexion
                  </button>
                  <button
                    onClick={() => setIsRegisterOpen(true)}
                    className="px-2 sm:px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] sm:text-xs font-bold shadow-sm transition-all cursor-pointer whitespace-nowrap"
                  >
                    Inscription
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* MAIN CONTENTS CONTAINER */}
        <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8" id="main-content-layout">
          
          {activeTab === "catalog" && (
            <DonationCatalog
              donations={donations}
              testimonials={testimonials}
              onApply={handleApply}
              activeApplicationId={activeApplicationId}
              currentUser={currentUser}
              onRegisterUser={handleRegisterUser}
              adminDefinedFields={adminDefinedFields}
              partners={partners}
              applications={applications}
              platformHeroImage={platformHeroImage}
              onViewDonation={handleViewDonation}
            />
          )}

          {activeTab === "dashboard" && (
            <CandidateDashboard
              application={activeApp || null}
              donationTitle={activeDonation?.title || (activeApp ? (donations.find(d => d.id === activeApp.donation_id)?.title) : "") || "Don en cours"}
              donationCategory={activeDonation?.category || (activeApp ? (donations.find(d => d.id === activeApp.donation_id)?.category) : "") || "Matériel"}
              messages={activeApplicationId ? (messages[activeApplicationId] || []) : []}
              onSendMessage={handleSendMessage}
              onSubmitStep={handleSubmitStep}
              workflowSteps={workflowSteps}
              submissions={submissions[activeApplicationId] || []}
              allApplications={applications}
              allDonations={donations}
              currentUser={currentUser}
              onSetActiveApplicationId={(id) => {
                setActiveApplicationId(id);
                fetchMessages(id);
              }}
              testimonials={testimonials}
              onRefreshData={fetchAllData}
            />
          )}

          {activeTab === "about" && <AboutUs />}

          {activeTab === "contact" && <ContactPage currentUser={currentUser} />}
          {activeTab === "privacy" && <PrivacyPolicy />}
          {activeTab === "terms" && <TermsOfUse />}

          {activeTab === "admin" && (
            <AdminDashboard
              donations={donations}
              applications={applications}
              messages={messages}
              dbStatus={dbStatus}
              currentUser={currentUser}
              onResetDb={handleResetDb}
              onCreateDonation={handleCreateDonation}
              onDeleteDonation={handleDeleteDonation}
              onUpdateApplication={handleUpdateApplication}
              onDeleteApplication={handleDeleteApplication}
              onSendAdminMessage={handleSendAdminMessage}
              adminDefinedFields={adminDefinedFields}
              onChangeFields={saveAdminFields}
              workflowSteps={workflowSteps}
              onChangeWorkflowSteps={saveWorkflowSteps}
              testimonials={testimonials}
              onRefreshData={fetchAllData}
              submissions={submissions}
              onDeleteSubmission={handleDeleteSubmission}
              platformLogo={platformLogo}
              onChangeLogo={savePlatformLogo}
              platformHeroImage={platformHeroImage}
              onChangeHeroImage={savePlatformHeroImage}
            />
          )}

        </main>
      </div>

      {/* FOOTER PUBLIC PROPRE */}
      <footer className="bg-white border-t border-slate-100 py-6 mt-12 w-full" id="main-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400">
          <p>© 2026 DonationSphere. Plateforme d'Attribution Solidaire et Humanitaire.</p>
          <div className="flex gap-4">
            <span className="hover:text-slate-600 transition-colors cursor-pointer" onClick={() => setActiveTab("terms")}>Conditions d'Utilisation</span>
            <span className="hover:text-slate-600 transition-colors cursor-pointer" onClick={() => setActiveTab("privacy")}>Protection des Données</span>
            <span className="hover:text-slate-600 transition-colors cursor-pointer" onClick={() => setActiveTab("about")}>Charte Éthique</span>
          </div>
        </div>
      </footer>

      {/* --- MODAL DE CONNEXION --- */}
      <AnimatePresence>
        {isLoginOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLoginOpen(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden z-10 p-6 space-y-4 border border-slate-100"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-extrabold rounded-full uppercase tracking-wider inline-block">
                    Accès Citoyen
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">Se connecter</h3>
                </div>
                <button 
                  onClick={() => setIsLoginOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Adresse E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="votre.nom@exemple.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Mot de passe</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-10 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none p-0.5 rounded cursor-pointer"
                      title={showLoginPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    >
                      {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setIsLoginOpen(false);
                        setIsResetPasswordOpen(true);
                      }}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                </div>

                {authError && (
                  <div className="p-2.5 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-[11px] font-bold">
                    <span className="h-1.5 w-1.5 bg-red-500 rounded-full animate-pulse" />
                    {authError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 ${isAuthLoading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {isAuthLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Connexion en cours...
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4" />
                      Se connecter de manière sécurisée
                    </>
                  )}
                </button>
              </form>

              <div className="text-center pt-2">
                <button 
                  onClick={() => {
                    setIsLoginOpen(false);
                    setIsRegisterOpen(true);
                  }}
                  className="text-xs text-indigo-600 hover:underline font-semibold"
                >
                  Pas encore de compte ? S'inscrire gratuitement
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL D'INSCRIPTION --- */}
      <AnimatePresence>
        {isRegisterOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRegisterOpen(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden z-10 p-6 space-y-4 border border-slate-100"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-extrabold rounded-full uppercase tracking-wider inline-block">
                    Création de compte
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">S'inscrire sur la plateforme</h3>
                </div>
                <button 
                  onClick={() => setIsRegisterOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Prénom / Structure publique</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Samuel, Association Espoir..."
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Adresse E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="votre.adresse@domaine.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Mot de passe</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type={showRegisterPassword ? "text" : "password"}
                      required
                      placeholder="Minimum 6 caractères"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-10 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none p-0.5 rounded cursor-pointer"
                      title={showRegisterPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    >
                      {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  S'inscrire et commencer
                </button>
              </form>

              <div className="text-center pt-2">
                <button 
                  onClick={() => {
                    setIsRegisterOpen(false);
                    setIsLoginOpen(true);
                  }}
                  className="text-xs text-indigo-600 hover:underline font-semibold"
                >
                  Vous avez déjà un compte ? Se connecter
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL MOT DE PASSE OUBLIÉ --- */}
      <AnimatePresence>
        {isResetPasswordOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsResetPasswordOpen(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden z-10 p-6 space-y-4 border border-slate-100"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-extrabold rounded-full uppercase tracking-wider inline-block">
                    Récupération
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">Mot de passe oublié</h3>
                </div>
                <button 
                  onClick={() => setIsResetPasswordOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {!resetEmailSent ? (
                <form onSubmit={handleResetPasswordRequest} className="space-y-4">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Saisissez votre adresse e-mail pour recevoir un lien de réinitialisation sécurisé.
                  </p>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Adresse E-mail</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        placeholder="votre.nom@exemple.com"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {authError && (
                    <div className="p-2 bg-red-50 text-red-600 text-[10px] font-bold rounded border border-red-100">
                      {authError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isAuthLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {isAuthLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Envoyer le lien
                  </button>
                </form>
              ) : (
                <div className="py-4 text-center space-y-4">
                  <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900">E-mail envoyé !</h4>
                    <p className="text-xs text-slate-500">
                      Un lien de récupération a été envoyé à {authEmail}. Vérifiez votre boîte de réception.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsResetPasswordOpen(false)}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-lg text-xs transition-all"
                  >
                    Fermer
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL MISE À JOUR MOT DE PASSE (POST-RECOVERY) --- */}
      <AnimatePresence>
        {isUpdatePasswordMode && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" />

            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden z-10 p-6 space-y-4 border border-slate-100"
            >
              <div className="space-y-1">
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-extrabold rounded-full uppercase tracking-wider inline-block">
                  Sécurité
                </span>
                <h3 className="text-lg font-bold text-slate-900">Nouveau mot de passe</h3>
                <p className="text-xs text-slate-500">Veuillez définir votre nouveau mot de passe sécurisé.</p>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Nouveau Mot de passe</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-10 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {authError && (
                  <div className="p-2 bg-red-50 text-red-600 text-[10px] font-bold rounded border border-red-100">
                    {authError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {isAuthLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  Mettre à jour le mot de passe
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
  
      {/* --- MODAL CONFIRMATION DÉCONNEXION --- */}
      <AnimatePresence>
        {isLogoutConfirmOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLogoutConfirmOpen(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />
  
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white w-full max-w-[320px] rounded-2xl shadow-xl overflow-hidden z-10 p-6 space-y-5 border border-slate-100 text-center"
            >
              <div className="h-12 w-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <LogOut className="h-6 w-6" />
              </div>
              
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Se déconnecter ?</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Êtes-vous sûr de vouloir mettre fin à votre session ?
                </p>
              </div>
  
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setIsLogoutConfirmOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-md shadow-red-600/10 transition-all cursor-pointer"
                >
                  Déconnexion
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AiAssistantWidget currentUser={currentUser} />
  
    </div>
  );
}
