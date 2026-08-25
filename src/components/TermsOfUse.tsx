import React from 'react';
import { FileSignature, AlertCircle, HandHeart, Scale, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function TermsOfUse() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-12"
    >
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center h-16 w-16 bg-indigo-50 text-indigo-600 rounded-2xl mb-4">
          <FileSignature className="h-8 w-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Conditions Générales d'Utilisation
        </h1>
        <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
          Les présentes conditions définissent les règles d'utilisation de DonationSphere, plateforme d'attribution solidaire et non-lucrative.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-10 space-y-10">
        
        {/* Section 1 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <HandHeart className="h-5 w-5 text-indigo-500" />
            1. Objet de la plateforme
          </h2>
          <div className="text-sm text-slate-600 leading-relaxed space-y-3 pl-7">
            <p>
              DonationSphere est un service numérique de redistribution solidaire permettant la mise en relation entre des offres de dons (équipements, véhicules, immobilier, fonds) et des structures ou personnes exprimant un besoin social ou humanitaire.
            </p>
            <p className="font-semibold text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-100">
              Il est strictement rappelé que la plateforme opère selon un modèle d'attribution basé sur un algorithme d'urgence et d'impact. En aucun cas, des frais de participation ou de "mise aux enchères" financière ne sont demandés aux demandeurs.
            </p>
          </div>
        </section>

        {/* Section 2 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-indigo-500" />
            2. Accès et Inscription
          </h2>
          <div className="text-sm text-slate-600 leading-relaxed space-y-3 pl-7">
            <p>L'accès à la plateforme est gratuit. Pour soumettre une demande de don, l'utilisateur doit :</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Créer un compte de manière loyale, en fournissant des informations exactes.</li>
              <li>Fournir les justificatifs officiels lors des étapes de candidature (le cas échéant).</li>
              <li>Ne pas multiplier les comptes frauduleux sous peine d'exclusion de l'écosystème.</li>
            </ul>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Scale className="h-5 w-5 text-indigo-500" />
            3. Règle d'attribution et Arbitrage
          </h2>
          <div className="text-sm text-slate-600 leading-relaxed space-y-3 pl-7">
            <p>
              Les soumissions sont traitées par la commission d'attribution. La décision de la commission est souveraine et s'appuie sur :
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Le niveau de priorité sociale déclaré.</li>
              <li>L'historique des attributions (rotation équitable).</li>
              <li>La pertinence et l'utilité du projet présenté par rapport au don concerné.</li>
            </ul>
            <p>
              La plateforme n'a aucune obligation de résultat quant à l'attribution d'un don à un utilisateur spécifique.
            </p>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-indigo-500" />
            4. Responsabilités de l'utilisateur
          </h2>
          <div className="text-sm text-slate-600 leading-relaxed space-y-3 pl-7">
            <p>
              L'utilisateur s'engage à utiliser DonationSphere de bonne foi et s'interdit formellement :
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>De revendre à titre lucratif un équipement ou un bien acquis via un don solidaire de la plateforme.</li>
              <li>De falsifier ses déclarations d'urgence sociale ou ses justificatifs.</li>
              <li>D'adopter un comportement abusif, harcelant ou irrespectueux envers les équipes de modération et responsables de dons via le système de chat.</li>
            </ul>
            <p className="mt-4 italic">
              Le non-respect de ces obligations peut entraîner la suppression immédiate du compte et d'éventuelles poursuites.
            </p>
          </div>
        </section>

      </div>
    </motion.div>
  );
}
