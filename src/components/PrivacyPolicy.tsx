import React from 'react';
import { Shield, Lock, FileText, Server, Eye, Database } from 'lucide-react';
import { motion } from 'motion/react';

export default function PrivacyPolicy() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-12"
    >
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center h-16 w-16 bg-indigo-50 text-indigo-600 rounded-2xl mb-4">
          <Shield className="h-8 w-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Politique de Protection des Données
        </h1>
        <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
          DonationSphere s'engage à protéger la vie privée de ses utilisateurs. Cette politique explique comment nous collectons, utilisons et protégeons vos données personnelles conformément au RGPD.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-10 space-y-10">
        
        {/* Section 1 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Database className="h-5 w-5 text-indigo-500" />
            1. Données collectées
          </h2>
          <div className="text-sm text-slate-600 leading-relaxed space-y-3 pl-7">
            <p>
              Dans le cadre de l'utilisation de DonationSphere, nous pouvons être amenés à collecter les catégories de données suivantes :
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Données d'identification :</strong> Nom, prénom, adresse e-mail, numéro de téléphone, rôle sur la plateforme (Admin, Demandeur, Responsable).</li>
              <li><strong>Données relatives aux candidatures :</strong> Motivations, pièces justificatives fournies lors de la demande de dons.</li>
              <li><strong>Données de connexion :</strong> Adresses IP, logs de connexion, informations de navigation, identifiants d'appareils.</li>
            </ul>
          </div>
        </section>

        {/* Section 2 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Server className="h-5 w-5 text-indigo-500" />
            2. Finalités du traitement
          </h2>
          <div className="text-sm text-slate-600 leading-relaxed space-y-3 pl-7">
            <p>Vos données sont traitées pour les finalités suivantes :</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Permettre le bon fonctionnement de la plateforme d'attribution solidaire.</li>
              <li>Gérer et évaluer les demandes de dons avec un indice de priorité sociale.</li>
              <li>Assurer la communication entre les bénéficiaires et les responsables.</li>
              <li>Garantir la sécurité de la plateforme et prévenir la fraude.</li>
            </ul>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Lock className="h-5 w-5 text-indigo-500" />
            3. Sécurité et conservation
          </h2>
          <div className="text-sm text-slate-600 leading-relaxed space-y-3 pl-7">
            <p>
              DonationSphere applique des mesures techniques et organisationnelles strictes pour garantir la sécurité de vos données (chiffrement, contrôles d'accès).
            </p>
            <p>
              Les données liées à une demande de don sont conservées pendant toute la durée du traitement du dossier, puis archivées selon les obligations légales, pour une durée n'excédant pas 5 ans après la clôture du compte ou de l'attribution.
            </p>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Eye className="h-5 w-5 text-indigo-500" />
            4. Vos droits (RGPD)
          </h2>
          <div className="text-sm text-slate-600 leading-relaxed space-y-3 pl-7">
            <p>
              Conformément à la réglementation (RGPD), vous disposez des droits suivants concernant vos données :
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Droit d'accès et de portabilité :</strong> Obtenir une copie de vos données.</li>
              <li><strong>Droit de rectification :</strong> Modifier des données inexactes.</li>
              <li><strong>Droit à l'effacement :</strong> Demander la suppression de votre compte et de vos données ("droit à l'oubli").</li>
              <li><strong>Droit d'opposition et de limitation :</strong> Vous opposer au traitement pour des motifs légitimes.</li>
            </ul>
            <p className="mt-4">
              Pour exercer vos droits, vous pouvez nous contacter via la page Contact ou écrire au Délégué à la Protection des Données (DPO) de la plateforme.
            </p>
          </div>
        </section>

      </div>
    </motion.div>
  );
}
