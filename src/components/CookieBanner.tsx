import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, X, Check } from 'lucide-react';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Vérifier si le consentement a déjà été donné
    const hasConsented = localStorage.getItem('rgpd_consent');
    if (!hasConsented) {
      // Un petit délai pour ne pas agresser l'utilisateur dès la première frame
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('rgpd_consent', 'all');
    setIsVisible(false);
  };

  const handleDeclineAll = () => {
    localStorage.setItem('rgpd_consent', 'necessary_only');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 150, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 150, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 pointer-events-none flex justify-center"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-4xl w-full p-5 sm:p-6 flex flex-col md:flex-row gap-6 items-center pointer-events-auto">
            <div className="flex-1 flex gap-4">
              <div className="hidden sm:flex h-12 w-12 bg-indigo-50 text-indigo-600 rounded-full items-center justify-center flex-shrink-0">
                <Shield className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  Respect de votre vie privée et de vos données
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Dans le cadre de la réglementation européenne (RGPD), DonationSphere utilise des cookies strictement nécessaires au fonctionnement de la plateforme d'attribution solidaire. Nous pouvons également utiliser des cookies analytiques pour améliorer nos services, avec votre accord.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto flex-shrink-0">
              <button
                onClick={handleDeclineAll}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors w-full sm:w-auto"
              >
                Continuer sans accepter
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors w-full sm:w-auto flex items-center justify-center gap-1.5"
              >
                <Check className="h-4 w-4" />
                Tout accepter
              </button>
            </div>
            
            <button
              onClick={handleDeclineAll}
              className="absolute top-3 right-3 p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors md:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
