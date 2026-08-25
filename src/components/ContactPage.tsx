import React, { useState } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Général",
    message: ""
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "Général",
        message: ""
      });
    }, 3000);
  };

  return (
    <div className="space-y-12 py-4 animate-fadeIn" id="contact-page-root">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-[11px] font-bold tracking-wider uppercase inline-block">
          Contactez-Nous
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Une question ou un projet à proposer ? <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-emerald-600">
            Nos agents d'attribution sont à votre écoute.
          </span>
        </h1>
        <p className="text-slate-600 text-sm leading-relaxed">
          Que vous soyez un donateur potentiel (particulier ou entreprise) ou un porteur de projet en quête d'accompagnement solidaire, notre secrétariat d'attribution vous répond sous 24h.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl mx-auto items-start" id="contact-content-grid">
        {/* Colonne Gauche: Coordonnées de contact */}
        <div className="lg:col-span-5 space-y-6">
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
                <div className="h-9 w-9 bg-slate-800 text-emerald-400 rounded-lg flex items-center justify-center">
                  <Phone className="h-4.5 w-4.5" />
                </div>
                <div>
                  <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider">Téléphone d'Urgence</span>
                  <span className="font-semibold">+33 (0)1 45 67 89 10</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs sm:text-sm">
                <div className="h-9 w-9 bg-slate-800 text-indigo-400 rounded-lg flex items-center justify-center">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <div>
                  <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider">E-mail de contact</span>
                  <span className="font-semibold">contact@donationsphere.org</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs sm:text-sm">
                <div className="h-9 w-9 bg-slate-800 text-pink-400 rounded-lg flex items-center justify-center">
                  <MapPin className="h-4.5 w-4.5" />
                </div>
                <div>
                  <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider">Siège Social</span>
                  <span className="font-semibold text-slate-300">12 Avenue des Champs-Élysées, 75008 Paris</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne Droite: Formulaire de contact */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-sm">
          {submitted ? (
            <div className="py-8 text-center space-y-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
              <h3 className="text-lg font-bold text-slate-900">Message envoyé avec succès !</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Merci de nous avoir contactés. Nos conseillers d'attribution prendront connaissance de votre message et vous répondront dans les plus brefs délais.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Votre Nom Complet / Structure</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Clara, Fondation Humanitaire..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Adresse Email</label>
                  <input
                    type="email"
                    required
                    placeholder="clara@domaine.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Téléphone (Facultatif)</label>
                  <input
                    type="tel"
                    placeholder="06 12 34 56 78"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Objet de votre demande</label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                >
                  <option value="Général">Demande de renseignements généraux</option>
                  <option value="ProposerDon">Proposer un don (Immobilier, Véhicules, Finance)</option>
                  <option value="AideInstruction">Aide sur l'instruction d'un dossier actif</option>
                  <option value="Partenariat">Proposition de partenariat institutionnel</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Votre Message</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Décrivez votre demande de façon détaillée..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="h-4 w-4" />
                Envoyer le message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
