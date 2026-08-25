import React, { useState } from "react";
import { Award, ShieldCheck, Heart, Users, Target, CheckCircle2, ChevronDown, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function AboutUs() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const commitments = [
    {
      title: "Transparence Absolue",
      desc: "Chaque don publié fait l'objet d'un processus de priorisation équitable. Aucun arbitrage n'est fait de manière occulte.",
      icon: ShieldCheck,
      color: "text-indigo-600 bg-indigo-50"
    },
    {
      title: "Impact Social Prioritaire",
      desc: "Nos algorithmes d'attribution solidaire placent l'urgence sociale et la viabilité des projets au cœur de l'examen des dossiers.",
      icon: Target,
      color: "text-emerald-600 bg-emerald-50"
    },
    {
      title: "Accompagnement Humain",
      desc: "Des agents référents d'attribution accompagnent chaque demandeur tout au long de l'instruction de son dossier.",
      icon: Users,
      color: "text-pink-600 bg-pink-50"
    }
  ];

  const faqs = [
    {
      question: "Comment fonctionne le processus d'attribution des dons ?",
      answer: "Chaque don publié fait l'objet d'un examen transparent. Les candidats déposent un dossier d'instruction en 4 étapes clés (coordonnées de contact, projet d'usage, justificatif officiel d'identité et note de motivation). Notre algorithme d'urgence pondère les besoins réels pour guider la commission d'attribution solidaire."
    },
    {
      question: "Qu'est-ce que l'indice de priorité ou l'enchère de besoin social ?",
      answer: "Contrairement aux enchères financières classiques, notre système utilise une 'enchère de tension' où la position du candidat fluctue en direct selon l'urgence de sa situation sociale, le type de structure demanderesse (association, citoyen isolé, collectivité) et le besoin déclaré."
    },
    {
      question: "La plateforme est-elle entièrement gratuite ?",
      answer: "Oui. DonationSphere est une plateforme d'utilité publique. Aucun frais n'est prélevé, que ce soit pour les donateurs qui cèdent leurs actifs ou pour les demandeurs solidaires qui reçoivent les attributions."
    },
    {
      question: "Comment puis-je contacter l'agent en charge d'un don ?",
      answer: "Chaque fiche de don dispose d'une messagerie instantanée en direct. Pas besoin de vous connecter pour poser une première question : vous pouvez échanger instantanément avec l'agent référent directement depuis la vitrine pour obtenir des clarifications."
    },
    {
      question: "Quels sont les délais d'arbitrage de la commission ?",
      answer: "Dès que votre dossier d'instruction est complété à 100%, l'agent référent l'analyse et transmet ses conclusions sous 48 à 72 heures. Vous recevez ensuite une notification directe de validation ou de réorientation."
    }
  ];

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  return (
    <div className="space-y-12 py-4 animate-fadeIn" id="about-us-root">
      {/* Hero Section d'À Propos */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-[11px] font-bold tracking-wider uppercase inline-block">
          Qui Sommes-Nous ?
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Unir les ressources pour <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-emerald-600">
            propulser la solidarité universelle.
          </span>
        </h1>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          DonationSphere est une plateforme d'utilité publique dédiée à l'attribution optimisée et équitable de dons matériels, immobiliers et financiers de grande valeur pour les associations, collectivités et citoyens porteurs de projets solidaires.
        </p>
      </div>

      {/* Grid d'engagements */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto" id="commitments-grid">
        {commitments.map((com, idx) => {
          const Icon = com.icon;
          return (
            <div key={`commitment-${idx}`} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${com.color} shadow-sm`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">{com.title}</h3>
                <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">{com.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mission & Objectifs */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-10 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center" id="mission-panel">
        <div className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Notre But Ultime</h2>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
            Face au gaspillage de ressources industrielles, de véhicules réutilisables ou de locaux vacants, DonationSphere offre un canal de redistribution fluide et réglementé.
          </p>
          <div className="space-y-2">
            {[
              "Valorisation des actifs immobiliers inexploités",
              "Redistribution d'utilitaires pour décarboner la logistique sociale",
              "Subventions financières directes pour l'aide d'urgence",
              "Zéro opacité : traçabilité complète des attributions de dons"
            ].map((text, i) => (
              <div key={`mission-obj-${i}`} className="flex items-center gap-2 text-slate-700 text-xs sm:text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative h-64 bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
          <img 
            src="https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=600" 
            alt="Solidarité et partage" 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* SECTION FAQ ACCORDÉON INTERACTIF */}
      <div className="max-w-3xl mx-auto space-y-6 pt-6" id="faq-section">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest flex items-center justify-center gap-1.5">
            <HelpCircle className="h-4 w-4" />
            Transparence d'Attribution
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900">Foire Aux Questions</h2>
          <p className="text-slate-500 text-xs sm:text-sm">Tout savoir sur le processus d'instruction et l'attribution équitable des ressources.</p>
        </div>

        <div className="space-y-3" id="faq-accordion-container">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div 
                key={`faq-${idx}`} 
                className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-200"
                id={`faq-item-${idx}`}
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-5 py-4 flex justify-between items-center text-left hover:bg-slate-50/50 transition-colors cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="font-bold text-slate-800 text-xs sm:text-sm pr-4">{faq.question}</span>
                  <ChevronDown className={`h-4.5 w-4.5 text-slate-400 transition-transform duration-300 flex-shrink-0 ${isOpen ? "rotate-180 text-indigo-600" : ""}`} />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <div className="px-5 pb-4 pt-1 border-t border-slate-50 text-slate-600 text-xs sm:text-sm leading-relaxed bg-slate-50/30">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
