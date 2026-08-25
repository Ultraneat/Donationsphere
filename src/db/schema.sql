-- =====================================================================
-- SCHEMA DE BASE DE DONNÉES - PLATEFORME DE DONS ET CANDIDATURES
-- OPTIMISÉ POUR SUPABASE POSTGRES AVEC RLS ET TRIGGERS AUTOMATIQUES
-- =====================================================================

-- Activer l'extension UUID si elle n'est pas encore présente
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------
-- 1. Table 'donations' (Les dons publiés)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'cancelled'
    target_amount NUMERIC(15, 2) DEFAULT NULL,
    current_bids_count INT DEFAULT 0, -- Nombre de candidats actifs
    image_url TEXT DEFAULT NULL, -- URL Railway compressée
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ---------------------------------------------------------------------
-- 2. Table 'testimonials' (Témoignages multimédias)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS testimonials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donation_id UUID REFERENCES donations(id) ON DELETE CASCADE,
    media_type VARCHAR(50) NOT NULL, -- 'audio', 'video', 'image'
    railway_media_url TEXT NOT NULL, -- Stocké et compressé sur Railway
    author_name VARCHAR(100) NOT NULL,
    quote TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ---------------------------------------------------------------------
-- 3. Table 'applications' (Suivi en temps réel des candidatures)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donation_id UUID REFERENCES donations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- Identifiant utilisateur
    user_name VARCHAR(100) NOT NULL DEFAULT 'Candidat Anonyme',
    current_step INT DEFAULT 0, -- Étape actuelle (0 à N)
    completion_percentage INT DEFAULT 0, -- Progression globale (0% à 100%)
    rank_position INT DEFAULT 1, -- Classement en temps réel
    risk_level VARCHAR(50) DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
    step_expires_at TIMESTAMP WITH TIME ZONE, -- Compte à rebours dynamique
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ---------------------------------------------------------------------
-- 4. Table 'application_submissions' (Soumission des étapes du formulaire)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS application_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    step_index INT NOT NULL, -- Index de l'étape validée
    form_data JSONB NOT NULL DEFAULT '{}'::jsonb, -- Métadonnées légères
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ---------------------------------------------------------------------
-- 5. Table 'application_messages' (Chat interne autonome)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS application_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    sender_type VARCHAR(50) CHECK (sender_type IN ('system', 'user', 'admin')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ---------------------------------------------------------------------
-- ACTIVER LA SÉCURITÉ PAR LIGNE (RLS) SUR TOUTES LES TABLES
-- ---------------------------------------------------------------------
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_messages ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- DÉFINITION DES POLITIQUES RLS (ROW LEVEL SECURITY)
-- ---------------------------------------------------------------------

-- Dons et témoignages : Lecture publique libre, Écritures pour les admins
CREATE POLICY "lecture_publique_donations" ON donations 
    FOR SELECT USING (true);
CREATE POLICY "admin_all_donations" ON donations 
    FOR ALL USING (true); -- Surchargé par clé service_role en production

CREATE POLICY "lecture_publique_testimonials" ON testimonials 
    FOR SELECT USING (true);
CREATE POLICY "admin_all_testimonials" ON testimonials 
    FOR ALL USING (true);

-- Applications, Soumissions et Messages : Lecture/écriture autorisée pour tous (démo)
CREATE POLICY "allow_all_applications" ON applications 
    FOR ALL USING (true);

CREATE POLICY "allow_all_submissions" ON application_submissions 
    FOR ALL USING (true);

CREATE POLICY "allow_all_messages" ON application_messages 
    FOR ALL USING (true);

-- ---------------------------------------------------------------------
-- DECLARATION DES TRIGGERS POSTGRES POUR LE WORKFLOW AUTOMATIQUE
-- ---------------------------------------------------------------------

-- A. Trigger pour mettre à jour la progression ('completion_percentage') et l'étape ('current_step')
CREATE OR REPLACE FUNCTION handle_submission_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_total_steps INT := 4; -- Processus en 4 étapes
    v_new_percentage INT;
    v_next_step INT;
    v_risk_level VARCHAR(50);
BEGIN
    -- L'étape suivante correspond à l'index de l'étape soumise + 1
    v_next_step := NEW.step_index + 1;
    IF v_next_step > v_total_steps THEN
        v_next_step := v_total_steps;
    END IF;

    -- Calcul du pourcentage d'avancement
    v_new_percentage := CASE 
        WHEN v_next_step = 1 THEN 25
        WHEN v_next_step = 2 THEN 50
        WHEN v_next_step = 3 THEN 75
        WHEN v_next_step = 4 THEN 100
        ELSE 0
    END;

    -- Calcul dynamique du niveau de risque en fonction de la progression
    -- Simule la tension concurrentielle (gamification)
    v_risk_level := CASE 
        WHEN v_new_percentage < 50 THEN 'medium'
        WHEN v_new_percentage = 50 THEN 'high'
        WHEN v_new_percentage = 75 THEN 'critical'
        ELSE 'low' -- Complété
    END;

    -- Mise à jour de la candidature parente
    UPDATE applications
    SET 
        current_step = v_next_step,
        completion_percentage = v_new_percentage,
        risk_level = v_risk_level,
        step_expires_at = NOW() + INTERVAL '1 hour' * (v_total_steps - v_next_step + 1)
    WHERE id = NEW.application_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER after_submission_insert
AFTER INSERT ON application_submissions
FOR EACH ROW
EXECUTE FUNCTION handle_submission_insert();


-- B. Trigger pour générer un message de guidance système automatique lors du passage à l'étape suivante
CREATE OR REPLACE FUNCTION handle_application_step_update()
RETURNS TRIGGER AS $$
DECLARE
    v_guide_text TEXT;
BEGIN
    -- Se déclenche à l'insertion d'une candidature ou au changement d'étape
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.current_step <> NEW.current_step) THEN
        v_guide_text := CASE NEW.current_step
            WHEN 0 THEN 'Bienvenue sur la plateforme ! Commençons votre parcours de candidature. Étape 1 : Saisissez vos coordonnées de base pour ouvrir votre dossier de candidature.'
            WHEN 1 THEN 'Félicitations, l''Étape 1 est validée ! Passez maintenant à l''Étape 2 : Décrivez en quelques lignes l''impact de ce don sur votre quotidien et votre projet de vie.'
            WHEN 2 THEN 'Étape 2 complétée avec succès ! Étape 3 : Veuillez téléverser un justificatif (CNI, passeport ou document officiel). Notre pipeline Railway le compresse au format WebP à la volée.'
            WHEN 3 THEN 'Excellent ! Étape finale 4 : Ajoutez un témoignage oral ou vidéo explicatif. Les candidats avec un message audio personnalisé augmentent leurs chances d''attribution de 80% !'
            WHEN 4 THEN 'Candidature complétée à 100% ! Votre dossier est sécurisé et soumis pour validation finale. L''administrateur examinera vos réponses très prochainement.'
            ELSE 'Votre candidature a été mise à jour. Étape actuelle : Étape ' || NEW.current_step
        END;

        -- Insertion automatique du message système dans le chat interne autonome
        INSERT INTO application_messages (application_id, sender_type, content)
        VALUES (NEW.id, 'system', v_guide_text);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER after_application_step_update
AFTER INSERT OR UPDATE ON applications
FOR EACH ROW
EXECUTE FUNCTION handle_application_step_update();
