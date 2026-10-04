-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : dim. 27 sep. 2026 à 14:33
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `masterdata_ia`
--

-- --------------------------------------------------------

--
-- Structure de la table `admin_actions`
--

CREATE TABLE `admin_actions` (
  `id` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL COMMENT 'Administrateur ├á l origine de l action',
  `target_user_id` int(11) DEFAULT NULL COMMENT 'Utilisateur affect├® par l action',
  `action` varchar(100) NOT NULL COMMENT 'Code action (ex: USER_CREATED, USER_DEACTIVATED, ROLE_UPDATED...)',
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'D├®tails des modifications (anciens/nouveaux droits, p├®rim├¿tres...)' CHECK (json_valid(`details`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `timestamp` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `admin_actions`
--

INSERT INTO `admin_actions` (`id`, `admin_id`, `target_user_id`, `action`, `details`, `ip_address`, `timestamp`) VALUES
(1, 6, 2, 'USER_CREATED', '{\"role\": \"REQUESTER\", \"geographic_scope\": \"WESTERN\", \"email\": \"requester.western@group.com\"}', '10.10.0.1', '2026-01-15 08:30:00'),
(2, 6, 3, 'USER_CREATED', '{\"role\": \"REQUESTER\", \"geographic_scope\": \"NORDIC\", \"email\": \"requester.nordic@group.com\"}', '10.10.0.1', '2026-01-20 10:00:00'),
(3, 6, 4, 'USER_CREATED', '{\"role\": \"MASTER_DATA_AGENT\", \"geographic_scope\": \"GLOBAL\", \"email\": \"agent.global@group.com\"}', '10.10.0.1', '2026-01-10 09:00:00'),
(4, 6, 5, 'USER_CREATED', '{\"role\": \"MANAGER_APPROVAL\", \"geographic_scope\": \"GLOBAL\", \"email\": \"manager.global@group.com\"}', '10.10.0.1', '2026-01-05 08:00:00'),
(5, 6, 2, 'SCOPE_VERIFIED', '{\"action\": \"P├®rim├¿tre WESTERN confirm├® par audit interne\"}', '10.10.0.1', '2026-02-01 14:00:00');

-- --------------------------------------------------------

--
-- Structure de la table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL,
  `request_id` int(11) DEFAULT NULL COMMENT 'Demande concern├®e le cas ├®ch├®ant',
  `user_id` int(11) DEFAULT NULL COMMENT 'Auteur de l action (NULL si d├®clench├® par syst├¿me/IA)',
  `action` varchar(100) NOT NULL COMMENT 'Code action (ex: REQUEST_CREATED, AI_SCREENED, AGENT_VALIDATED...)',
  `old_value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Snapshot des valeurs avant modification' CHECK (json_valid(`old_value`)),
  `new_value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Snapshot des valeurs apr├¿s modification' CHECK (json_valid(`new_value`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `timestamp` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `request_id`, `user_id`, `action`, `old_value`, `new_value`, `ip_address`, `user_agent`, `timestamp`) VALUES
(1, 1, 1, 'REQUEST_CREATED', NULL, '{\"status\": \"DRAFT\", \"scope\": \"WESTERN\"}', '192.168.1.45', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '2026-03-01 09:15:00'),
(2, 1, 1, 'DOCUMENTS_UPLOADED', NULL, '{\"uploaded_files\": [\"RIB_Novatech_Solutions_CM.pdf\", \"KBIS_Novatech_Solutions_2026.pdf\", \"Attestation_Fiscale_DGFiP_Novatech.pdf\"]}', '192.168.1.45', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '2026-03-01 09:18:30'),
(3, 1, 1, 'REQUEST_SUBMITTED', '{\"status\": \"DRAFT\"}', '{\"status\": \"SUBMITTED\"}', '192.168.1.45', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '2026-03-01 09:20:00'),
(4, 2, 2, 'REQUEST_CREATED', NULL, '{\"status\": \"DRAFT\", \"legal_name\": \"CyberDefense Security Services SARL\"}', '10.20.4.12', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', '2026-02-28 13:50:00'),
(5, 2, 2, 'REQUEST_SUBMITTED', '{\"status\": \"DRAFT\"}', '{\"status\": \"SUBMITTED\"}', '10.20.4.12', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', '2026-02-28 14:04:00'),
(6, 2, NULL, 'AI_SCREENING_EXECUTED', '{\"status\": \"SUBMITTED\"}', '{\"status\": \"PENDING_AGENT\", \"risk_score\": 14.20, \"risk_tier\": \"LOW\", \"fraud_alert\": false}', '127.0.0.1 (AI-Engine)', 'FastAPI-Microservice/1.0', '2026-02-28 14:05:30'),
(7, 3, 2, 'REQUEST_SUBMITTED', '{\"status\": \"DRAFT\"}', '{\"status\": \"SUBMITTED\"}', '10.20.4.12', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', '2026-02-27 10:10:00'),
(8, 3, NULL, 'AI_FRAUD_ALERT_TRIGGERED', '{\"status\": \"SUBMITTED\"}', '{\"status\": \"PENDING_AGENT\", \"risk_score\": 89.50, \"risk_tier\": \"CRITICAL\", \"fraud_alert\": true, \"reasons\": [\"TAX_HAVEN_SC\", \"COUNTRY_MISMATCH_CY\", \"DISPOSABLE_EMAIL\"]}', '127.0.0.1 (AI-Engine)', 'FastAPI-Microservice/1.0', '2026-02-27 10:12:45'),
(9, 5, 4, 'AGENT_VALIDATION_PASSED', '{\"status\": \"PENDING_AGENT\"}', '{\"status\": \"PENDING_MANAGER\", \"agent_id\": 4, \"notes\": \"Dossier complet et v├®rifi├® sur le registre YTJ.\"}', '10.20.2.88', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '2026-02-25 15:45:00'),
(10, 7, 5, 'MANAGER_APPROVED', '{\"status\": \"PENDING_MANAGER\"}', '{\"status\": \"APPROVED\", \"manager_id\": 5}', '10.20.1.15', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '2026-02-13 18:00:00'),
(11, 7, 5, 'SAP_SYNC_COMPLETED', '{\"status\": \"APPROVED\"}', '{\"status\": \"SAP_SYNCED\", \"sap_vendor_id\": \"VEND-001005\", \"idoc_type\": \"CREMAS05\", \"idoc_number\": \"0000000004928173\"}', '10.20.1.15', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '2026-02-14 09:35:00'),
(12, 8, 5, 'MANAGER_REJECTED', '{\"status\": \"PENDING_MANAGER\"}', '{\"status\": \"REJECTED\", \"reason\": \"Kbis falsifi├® et IBAN non conforme\"}', '10.20.1.15', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '2026-02-06 11:20:00'),
(13, 1, 2, 'AI_SCREENING_STARTED', '{\"status\":\"SUBMITTED\"}', '{\"status\":\"AI_SCREENING\"}', '::1', 'python-requests/2.34.2', '2026-09-26 21:39:12'),
(14, 1, 2, 'AI_FRAUD_ALERT_TRIGGERED', '{\"status\":\"AI_SCREENING\"}', '{\"status\":\"PENDING_AGENT\",\"risk_score\":40,\"risk_tier\":\"MEDIUM\",\"fraud_alert\":true,\"dedup_summary\":\"Aucun doublon détecté\"}', '::1', 'python-requests/2.34.2', '2026-09-26 21:39:14'),
(15, 6, 5, 'SAP_SYNC_COMPLETED', '{\"status\":\"APPROVED\"}', '{\"status\":\"SAP_SYNCED\",\"sap_vendor_id\":\"VEND-001006\",\"idoc_type\":\"CREMAS05\",\"idoc_number\":\"0000000097323484\",\"preventive_blocked\":false,\"vendor_status\":\"ACTIVE\"}', '::1', 'python-requests/2.34.2', '2026-09-26 21:39:14');

-- --------------------------------------------------------

--
-- Structure de la table `documents`
--

CREATE TABLE `documents` (
  `id` int(11) NOT NULL,
  `request_id` int(11) NOT NULL COMMENT 'Demande rattach├®e',
  `doc_type` enum('RIB','KBIS','TAX_CERTIFICATE','IDENTITY_PROOF','OTHER') NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` int(11) NOT NULL COMMENT 'Taille en octets',
  `mime_type` varchar(100) NOT NULL,
  `ocr_extracted_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Donn├®es brutes extraites par le module OCR (JSON)' CHECK (json_valid(`ocr_extracted_data`)),
  `ocr_confidence` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Indices de confiance OCR par attribut (JSON)' CHECK (json_valid(`ocr_confidence`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `documents`
--

INSERT INTO `documents` (`id`, `request_id`, `doc_type`, `file_name`, `file_path`, `file_size`, `mime_type`, `ocr_extracted_data`, `ocr_confidence`, `created_at`) VALUES
(1, 1, 'RIB', 'RIB_Novatech_Solutions_CM.pdf', '/uploads/requests/1/RIB_Novatech_Solutions_CM.pdf', 245800, 'application/pdf', '{\"iban\": \"FR7610278060500001234567845\", \"bic\": \"CMCIFR2AXXX\", \"account_holder\": \"NOVATECH SOLUTIONS FRANCE SAS\", \"bank_name\": \"CREDIT MUTUEL ILE-DE-FRANCE\", \"agency\": \"PARIS TURBIGO\"}', '{\"iban\": 0.99, \"bic\": 0.98, \"account_holder\": 0.96, \"bank_name\": 0.95, \"overall\": 0.97}', '2026-03-01 09:16:00'),
(2, 1, 'KBIS', 'KBIS_Novatech_Solutions_2026.pdf', '/uploads/requests/1/KBIS_Novatech_Solutions_2026.pdf', 512400, 'application/pdf', '{\"siren\": \"987654321\", \"siret\": \"98765432100018\", \"legal_name\": \"NOVATECH SOLUTIONS FRANCE\", \"legal_form\": \"Societe par Actions Simplifiee (SAS)\", \"capital\": \"50000 EUR\", \"address\": \"28 RUE DE TURBIGO 75003 PARIS\", \"registration_date\": \"2019-04-12\", \"rcs_city\": \"PARIS\"}', '{\"siren\": 0.99, \"legal_name\": 0.97, \"address\": 0.94, \"overall\": 0.96}', '2026-03-01 09:17:00'),
(3, 1, 'TAX_CERTIFICATE', 'Attestation_Fiscale_DGFiP_Novatech.pdf', '/uploads/requests/1/Attestation_Fiscale_DGFiP_Novatech.pdf', 189300, 'application/pdf', '{\"tax_id_vat\": \"FR55987654321\", \"authority\": \"DGFIP PARIS CENTRE\", \"regular_status\": true, \"issue_date\": \"2026-01-15\"}', '{\"tax_id_vat\": 0.99, \"overall\": 0.98}', '2026-03-01 09:18:00'),
(4, 2, 'RIB', 'RIB_BNP_CyberDefense.pdf', '/uploads/requests/2/RIB_BNP_CyberDefense.pdf', 310500, 'application/pdf', '{\"iban\": \"FR763000400852000098765432133\", \"bic\": \"BNPAFRPPXXX\", \"account_holder\": \"CYBERDEFENSE SECURITY SERVICES SARL\", \"bank_name\": \"BNP PARIBAS\"}', '{\"iban\": 1.0, \"bic\": 0.99, \"account_holder\": 0.98, \"overall\": 0.99}', '2026-02-28 14:02:00'),
(5, 2, 'KBIS', 'KBIS_CyberDefense_2026.pdf', '/uploads/requests/2/KBIS_CyberDefense_2026.pdf', 480200, 'application/pdf', '{\"siren\": \"998877665\", \"legal_name\": \"CYBERDEFENSE SECURITY SERVICES\", \"address\": \"12 AVENUE DES CHAMPS-ELYSEES 75008 PARIS\"}', '{\"siren\": 0.98, \"legal_name\": 0.97, \"overall\": 0.97}', '2026-02-28 14:03:00'),
(6, 3, 'RIB', 'Bank_Letter_Cyprus_Apex.pdf', '/uploads/requests/3/Bank_Letter_Cyprus_Apex.pdf', 145000, 'application/pdf', '{\"iban\": \"CY17002001280000001200542389\", \"bic\": \"BCYPCY2NXXX\", \"account_holder\": \"APEX CONSULTING SEYCHELLES\", \"bank_name\": \"BANK OF CYPRUS PUBLIC COMPANY LTD\"}', '{\"iban\": 0.92, \"bic\": 0.91, \"overall\": 0.91}', '2026-02-27 10:11:00');

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `role` enum('VENDOR','REQUESTER','MASTER_DATA_AGENT','MANAGER_APPROVAL','ADMIN') NOT NULL,
  `geographic_scope` enum('WESTERN','NORDIC','TGBST','GLOBAL') NOT NULL DEFAULT 'GLOBAL',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `full_name`, `role`, `geographic_scope`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'contact@novatech-solutions.fr', '$2b$10$yLchecK61S51nmsayiTixOaJvoj4SwVBUdAoZLvGUtHwS.NgiftS.', 'Jean Dupont (Novatech Solutions)', 'VENDOR', 'WESTERN', 1, '2026-03-01 09:00:00', '2026-09-26 20:22:13'),
(2, 'requester.western@group.com', '$2b$10$yLchecK61S51nmsayiTixOaJvoj4SwVBUdAoZLvGUtHwS.NgiftS.', 'Sophie Martin (Acheteur IT France)', 'REQUESTER', 'WESTERN', 1, '2026-01-15 08:30:00', '2026-09-26 20:22:13'),
(3, 'requester.nordic@group.com', '$2b$10$yLchecK61S51nmsayiTixOaJvoj4SwVBUdAoZLvGUtHwS.NgiftS.', 'Lars Lindqvist (Acheteur Nordique)', 'REQUESTER', 'NORDIC', 1, '2026-01-20 10:00:00', '2026-09-26 20:22:13'),
(4, 'agent.global@group.com', '$2b$10$yLchecK61S51nmsayiTixOaJvoj4SwVBUdAoZLvGUtHwS.NgiftS.', 'Alexandre Dupont (Agent Master Data)', 'MASTER_DATA_AGENT', 'GLOBAL', 1, '2026-01-10 09:00:00', '2026-09-26 20:22:13'),
(5, 'manager.global@group.com', '$2b$10$yLchecK61S51nmsayiTixOaJvoj4SwVBUdAoZLvGUtHwS.NgiftS.', 'Claire Vasseur (Directrice Tr├®sorerie)', 'MANAGER_APPROVAL', 'GLOBAL', 1, '2026-01-05 08:00:00', '2026-09-26 20:22:13'),
(6, 'admin@group.com', '$2b$10$yLchecK61S51nmsayiTixOaJvoj4SwVBUdAoZLvGUtHwS.NgiftS.', 'Marc Lefebvre (Administrateur Syst├¿me)', 'ADMIN', 'GLOBAL', 1, '2026-01-01 00:00:00', '2026-09-26 20:22:13');

-- --------------------------------------------------------

--
-- Structure de la table `vendors`
--

CREATE TABLE `vendors` (
  `id` int(11) NOT NULL,
  `sap_vendor_id` varchar(50) DEFAULT NULL COMMENT 'Num├®ro de compte fournisseur SAP (ex: VEND-001001)',
  `legal_name` varchar(255) NOT NULL COMMENT 'Raison sociale l├®gale',
  `trade_name` varchar(255) DEFAULT NULL COMMENT 'Nom commercial / Marque',
  `tax_id_vat` varchar(50) NOT NULL COMMENT 'Num├®ro de TVA intracommunautaire ou ID fiscal',
  `country` varchar(3) NOT NULL COMMENT 'Code ISO pays (FR, DE, SE, GB, US...)',
  `address` text NOT NULL COMMENT 'Adresse du si├¿ge social',
  `iban` varchar(42) NOT NULL COMMENT 'IBAN standardis├®',
  `bic_swift` varchar(15) NOT NULL COMMENT 'Code BIC/SWIFT bancaire',
  `bank_name` varchar(150) NOT NULL COMMENT 'Nom de l ├®tablissement bancaire',
  `status` enum('ACTIVE','BLOCKED','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  `risk_score` decimal(5,2) NOT NULL DEFAULT 0.00 COMMENT 'Score de risque global 0-100',
  `segment` enum('STRATEGIC','RECURRENT','OCCASIONAL','AT_RISK') NOT NULL DEFAULT 'OCCASIONAL',
  `annual_spend` decimal(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Montant annuel estim├® ou engag├® (Ôé¼)',
  `geographic_scope` enum('WESTERN','NORDIC','TGBST','GLOBAL') NOT NULL DEFAULT 'WESTERN',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `vendors`
--

INSERT INTO `vendors` (`id`, `sap_vendor_id`, `legal_name`, `trade_name`, `tax_id_vat`, `country`, `address`, `iban`, `bic_swift`, `bank_name`, `status`, `risk_score`, `segment`, `annual_spend`, `geographic_scope`, `created_at`, `updated_at`) VALUES
(1, 'VEND-001001', 'Acme Industrial Systems SAS', 'Acme Tech', 'FR32123456789', 'FR', '15 Boulevard Haussmann, 75009 Paris', 'FR7630001007941234567890185', 'BNPAFRPPXXX', 'BNP Paribas', 'ACTIVE', 12.50, 'STRATEGIC', 4500000.00, 'WESTERN', '2025-06-15 10:00:00', '2026-09-26 20:22:13'),
(2, 'VEND-001002', 'Nordic Timber & Pulp AB', 'NordicPulp', 'SE556123456701', 'SE', 'Storgatan 42, 111 22 Stockholm', 'SE4550000000054912345678', 'HANDSEMX', 'Handelsbanken', 'ACTIVE', 18.00, 'RECURRENT', 1250000.00, 'NORDIC', '2025-08-20 11:30:00', '2026-09-26 20:22:13'),
(3, 'VEND-001003', 'Global Cloud Hosting Ltd', 'GlobalCloud', 'GB987654321', 'GB', '25 Finsbury Circus, London EC2M 7EE', 'GB29NWBK60161331926819', 'NWBKGB2LXXX', 'National Westminster Bank', 'ACTIVE', 8.50, 'STRATEGIC', 3200000.00, 'GLOBAL', '2025-09-10 14:00:00', '2026-09-26 20:22:13'),
(4, 'VEND-001004', 'Bavaria Automotive Logistics GmbH', 'BavariaAuto', 'DE123456789', 'DE', 'Leopoldstra├ƒe 150, 80804 M├╝nchen', 'DE89370400440532013000', 'DBEUMM21XXX', 'Deutsche Bank AG', 'ACTIVE', 15.00, 'RECURRENT', 890000.00, 'WESTERN', '2025-11-04 16:15:00', '2026-09-26 20:22:13'),
(5, 'VEND-001005', 'Helios Solar Components SAS', 'Helios Solar', 'FR88776655443', 'FR', '8 Rue de la Paix, 69002 Lyon', 'FR7610058000019876543210944', 'HSBCFRPPXXX', 'HSBC Continental Europe', 'ACTIVE', 24.00, 'OCCASIONAL', 480000.00, 'WESTERN', '2026-02-14 09:30:00', '2026-09-26 20:22:13'),
(6, 'VEND-001006', 'Starlight Software Solutions Inc', 'Starlight Dev', 'US882341982', 'US', '500 Howard Street, Suite 400, San Francisco, CA 94105', 'US64SVBKUS6S3300958879', 'SVBKUS6SXXX', 'Silicon Valley Bank', 'ACTIVE', 21.00, 'RECURRENT', 750000.00, 'GLOBAL', '2026-09-26 21:39:14', '2026-09-26 21:39:14');

-- --------------------------------------------------------

--
-- Structure de la table `vendor_requests`
--

CREATE TABLE `vendor_requests` (
  `id` int(11) NOT NULL,
  `requester_id` int(11) DEFAULT NULL COMMENT 'Utilisateur interne ayant initi├® ou sponsoris├® la demande',
  `vendor_id` int(11) DEFAULT NULL COMMENT 'Lien vers vendors.id si demande de modification ou apr├¿s cr├®ation SAP',
  `request_type` enum('CREATION','UPDATE_BANK','UPDATE_LEGAL') NOT NULL DEFAULT 'CREATION',
  `status` enum('DRAFT','SUBMITTED','AI_SCREENING','PENDING_AGENT','PENDING_MANAGER','APPROVED','REJECTED','SAP_SYNCED') NOT NULL DEFAULT 'DRAFT',
  `geographic_scope` enum('WESTERN','NORDIC','TGBST','GLOBAL') NOT NULL,
  `onboarding_token` varchar(100) DEFAULT NULL COMMENT 'Jeton d onboarding s├®curis├® pour acc├¿s direct VENDOR',
  `token_expires_at` datetime DEFAULT NULL COMMENT 'Date d expiration du lien d onboarding',
  `temporary_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'Donn├®es d├®clar├®es en attente de validation (JSON)' CHECK (json_valid(`temporary_data`)),
  `risk_score` decimal(5,2) DEFAULT NULL COMMENT 'Score de risque calcul├® par l IA (0 ├á 100)',
  `risk_tier` enum('LOW','MEDIUM','HIGH','CRITICAL') DEFAULT NULL COMMENT 'Niveau de s├®v├®rit├® du risque',
  `risk_factors` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Facteurs d explication du score (type SHAP avec poids)' CHECK (json_valid(`risk_factors`)),
  `fraud_alert` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Indicateur d alerte anti-fraude',
  `fraud_details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'R├®sultats d├®taill├®s des 5 axes du microservice IA' CHECK (json_valid(`fraud_details`)),
  `sap_idoc_payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Payload IDoc simul├® (CREMAS05 / ADRMAS03-FIDCC1)' CHECK (json_valid(`sap_idoc_payload`)),
  `rejection_reason` text DEFAULT NULL COMMENT 'Motif en cas de rejet',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `vendor_requests`
--

INSERT INTO `vendor_requests` (`id`, `requester_id`, `vendor_id`, `request_type`, `status`, `geographic_scope`, `onboarding_token`, `token_expires_at`, `temporary_data`, `risk_score`, `risk_tier`, `risk_factors`, `fraud_alert`, `fraud_details`, `sap_idoc_payload`, `rejection_reason`, `created_at`, `updated_at`) VALUES
(1, 2, NULL, 'CREATION', 'PENDING_AGENT', 'WESTERN', 'tok_novatech_onboard_2026_abc1', '2026-04-30 23:59:59', '{\"legal_name\": \"Novatech Solutions France SAS\", \"trade_name\": \"Novatech IT\", \"tax_id_vat\": \"FR55987654321\", \"country\": \"FR\", \"address\": \"28 Rue de Turbigo, 75003 Paris\", \"iban\": \"FR7610278060500001234567845\", \"bic_swift\": \"CMCIFR2AXXX\", \"bank_name\": \"Cr├®dit Mutuel\", \"annual_spend\": 250000.00, \"contact_name\": \"Jean Dupont\", \"contact_email\": \"contact@novatech-solutions.fr\", \"contact_phone\": \"+33 1 42 68 55 00\"}', 40.00, 'MEDIUM', '[{\"factor\":\"Juridiction fiscale\",\"status\":\"PASSED\",\"impact\":-10,\"detail\":\"Pays d\'implantation réputé coopératif et transparent\"},{\"factor\":\"Cohérence territoriale bancaire\",\"status\":\"PASSED\",\"impact\":-10,\"detail\":\"Le compte bancaire est domicilié dans le pays d\'immatriculation\"},{\"factor\":\"Canal de communication\",\"status\":\"PASSED\",\"impact\":-5,\"detail\":\"Adresse email professionnelle vérifiable\"},{\"factor\":\"Contrôle Modulo 97 IBAN\",\"status\":\"FAILED\",\"impact\":40,\"detail\":\"Échec de l\'algorithme mathématique ISO 13616\"},{\"factor\":\"Unicité du tiers\",\"status\":\"PASSED\",\"impact\":-10,\"detail\":\"Aucun tiers doublon identifié dans le référentiel\"},{\"factor\":\"Rapprochement OCR vs Déclaré\",\"status\":\"PASSED\",\"impact\":-15,\"detail\":\"Forte concordance documentaire (100.0%)\"}]', 1, '{\"isolation_forest_score\":0.539,\"anomaly_detected\":false,\"tax_haven\":false,\"tax_haven_name\":null,\"country_mismatch\":false,\"declared_country\":\"FR\",\"iban_country\":\"FR\",\"disposable_email\":false,\"disposable_domain\":null,\"iban_valid\":false,\"iban_error\":\"Checksum Modulo 97 invalide (reste différent de 1)\",\"fraud_flags\":[\"Coordonnées bancaires invalides : Checksum Modulo 97 invalide (reste différent de 1)\"],\"deduplication\":{\"duplicate_found\":false,\"collision_type\":\"NONE\",\"max_similarity\":0,\"top_match\":null,\"summary\":\"Aucun doublon détecté\",\"matches\":[]},\"ocr_comparison\":{\"concordance_rate\":100,\"total_checks\":4,\"passed_checks\":4,\"has_mismatch\":false,\"comparisons\":[{\"field\":\"iban\",\"label\":\"Numéro IBAN\",\"declared\":\"FR7610278060500001234567845\",\"ocr\":\"FR7610278060500001234567845\",\"matches\":true,\"severity\":\"OK\"},{\"field\":\"bic_swift\",\"label\":\"Code BIC / SWIFT\",\"declared\":\"CMCIFR2AXXX\",\"ocr\":\"CMCIFR2AXXX\",\"matches\":true,\"severity\":\"OK\"},{\"field\":\"legal_name\",\"label\":\"Dénomination / Titulaire compte\",\"declared\":\"NOVATECH SOLUTIONS FRANCE SAS\",\"ocr\":\"NOVATECH SOLUTIONS FRANCE SAS\",\"matches\":true,\"similarity_score\":1,\"severity\":\"OK\"},{\"field\":\"tax_id_vat\",\"label\":\"Identifiant fiscal / TVA\",\"declared\":\"FR55987654321\",\"ocr\":\"FR55987654321\",\"matches\":true,\"severity\":\"OK\"}]},\"preventive_block_required\":false}', NULL, NULL, '2026-03-01 09:15:00', '2026-09-26 21:39:14'),
(2, 2, NULL, 'CREATION', 'PENDING_AGENT', 'WESTERN', 'tok_cyberdefense_2026_xyz2', '2026-04-15 23:59:59', '{\"legal_name\": \"CyberDefense Security Services SARL\", \"trade_name\": \"CyberDef\", \"tax_id_vat\": \"FR44998877665\", \"country\": \"FR\", \"address\": \"12 Avenue des Champs-├ëlys├®es, 75008 Paris\", \"iban\": \"FR763000400852000098765432133\", \"bic_swift\": \"BNPAFRPPXXX\", \"bank_name\": \"BNP Paribas\", \"annual_spend\": 600000.00, \"contact_name\": \"Marie Laurent\", \"contact_email\": \"m.laurent@cyberdefense-sec.fr\", \"contact_phone\": \"+33 1 53 00 22 11\"}', 14.20, 'LOW', '[{\"factor\": \"Format IBAN\", \"status\": \"PASSED\", \"impact\": -15, \"detail\": \"Modulo 97 ISO 13616 valide\"}, {\"factor\": \"Concordance OCR / RIB\", \"status\": \"PASSED\", \"impact\": -20, \"detail\": \"100% de concordance IBAN, BIC et raison sociale\"}, {\"factor\": \"Anciennet├® entreprise\", \"status\": \"PASSED\", \"impact\": -10, \"detail\": \"Entreprise ├®tablie depuis 7 ans (RCS Paris)\"}, {\"factor\": \"Absence de doublon\", \"status\": \"PASSED\", \"impact\": -15, \"detail\": \"Num├®ro de TVA et IBAN uniques dans le groupe\"}]', 0, '{\"isolation_forest_score\": -0.68, \"anomaly_detected\": false, \"country_mismatch\": false, \"tax_haven\": false, \"disposable_email\": false, \"duplicate_vat_found\": false, \"max_name_similarity\": 0.28, \"ocr_mismatch_detected\": false}', NULL, NULL, '2026-02-28 14:00:00', '2026-02-28 14:05:30'),
(3, 2, NULL, 'CREATION', 'PENDING_AGENT', 'TGBST', 'tok_apex_fraud_flagged_333', '2026-03-31 23:59:59', '{\"legal_name\": \"Apex Consulting Seychelles Offshore Ltd\", \"trade_name\": \"Apex Global\", \"tax_id_vat\": \"SC999888777\", \"country\": \"SC\", \"address\": \"Suite 101, Premier Building, Victoria, Mah├®, Seychelles\", \"iban\": \"CY17002001280000001200542389\", \"bic_swift\": \"BCYPCY2NXXX\", \"bank_name\": \"Bank of Cyprus\", \"annual_spend\": 2800000.00, \"contact_name\": \"Unknown Agent\", \"contact_email\": \"procurement@temp-mail.org\", \"contact_phone\": \"+248 4 123 456\"}', 89.50, 'CRITICAL', '[{\"factor\": \"Paradis Fiscal (Tax Haven)\", \"status\": \"FAILED\", \"impact\": 35, \"detail\": \"Si├¿ge social localis├® aux Seychelles (Juridiction non-coop├®rative UE)\"}, {\"factor\": \"Incoh├®rence G├®ographique IBAN\", \"status\": \"FAILED\", \"impact\": 25, \"detail\": \"Entreprise aux Seychelles (SC) mais IBAN domicili├® ├á Chypre (CY)\"}, {\"factor\": \"Adresse email jetable / anonyme\", \"status\": \"FAILED\", \"impact\": 20, \"detail\": \"Domaine temp-mail.org identifi├® comme fournisseur temporaire jetable\"}, {\"factor\": \"D├®pense pr├®visionnelle atypique\", \"status\": \"WARNING\", \"impact\": 15, \"detail\": \"Volume pr├®visionnel 2.8MÔé¼ sans historique contractuel\"}]', 1, '{\"isolation_forest_score\": 0.82, \"anomaly_detected\": true, \"country_mismatch\": true, \"declared_country\": \"SC\", \"iban_country\": \"CY\", \"tax_haven\": true, \"disposable_email\": true, \"disposable_domain\": \"temp-mail.org\", \"duplicate_vat_found\": false, \"max_name_similarity\": 0.15, \"ocr_mismatch_detected\": true, \"ocr_notes\": \"Discordance flagrante entre adresse facture et Kbis fourni\"}', NULL, NULL, '2026-02-27 10:10:00', '2026-02-27 10:12:45'),
(4, 2, NULL, 'CREATION', 'PENDING_AGENT', 'WESTERN', 'tok_acme_dup_warning_444', '2026-03-25 23:59:59', '{\"legal_name\": \"Acme Industrie France SAS\", \"trade_name\": \"Acme Systems\", \"tax_id_vat\": \"FR32123456789\", \"country\": \"FR\", \"address\": \"17 Boulevard Haussmann, 75009 Paris\", \"iban\": \"FR7620041010050500013245601\", \"bic_swift\": \"SOGEFR2AXXX\", \"bank_name\": \"Soci├®t├® G├®n├®rale\", \"annual_spend\": 1500000.00, \"contact_name\": \"Alain Dupr├®\", \"contact_email\": \"a.dupre@acme-france-systems.com\", \"contact_phone\": \"+33 1 44 20 80 90\"}', 76.00, 'HIGH', '[{\"factor\": \"Collision Num├®ro de TVA Strict\", \"status\": \"FAILED\", \"impact\": 40, \"detail\": \"Num├®ro de TVA FR32123456789 d├®j├á enregistr├® sur le fournisseur VEND-001001 (Acme Industrial Systems SAS)\"}, {\"factor\": \"Similarit├® Lexicale ├ëlev├®e (RapidFuzz)\", \"status\": \"WARNING\", \"impact\": 25, \"detail\": \"Score RapidFuzz token_sort_ratio = 88.5% avec le fournisseur existant VEND-001001\"}, {\"factor\": \"Modification IBAN non autoris├®e\", \"status\": \"WARNING\", \"impact\": 20, \"detail\": \"Tentative de saisie d un nouvel IBAN pour un tiers d├®j├á r├®f├®renc├® sans proc├®dure de modification bancaire formelle\"}]', 1, '{\"isolation_forest_score\": 0.65, \"anomaly_detected\": true, \"duplicate_vat_found\": true, \"colliding_vendor_id\": 1, \"colliding_sap_vendor_id\": \"VEND-001001\", \"colliding_vendor_name\": \"Acme Industrial Systems SAS\", \"rapidfuzz_token_sort_ratio\": 88.5, \"tfidf_cosine_similarity\": 0.912, \"country_mismatch\": false, \"tax_haven\": false, \"disposable_email\": false}', NULL, NULL, '2026-02-26 16:30:00', '2026-02-26 16:34:10'),
(5, 3, NULL, 'CREATION', 'PENDING_MANAGER', 'NORDIC', 'tok_nordic_energy_555', '2026-04-10 23:59:59', '{\"legal_name\": \"Nordic Clean Energy Oy\", \"trade_name\": \"Nordic Energy\", \"tax_id_vat\": \"FI12345678\", \"country\": \"FI\", \"address\": \"Mannerheimintie 14, 00100 Helsinki\", \"iban\": \"FI2112345600000785\", \"bic_swift\": \"NDEAFIHHXXX\", \"bank_name\": \"Nordea Bank Abp\", \"annual_spend\": 950000.00, \"contact_name\": \"Kari Korhonen\", \"contact_email\": \"k.korhonen@nordicenergy.fi\", \"contact_phone\": \"+358 9 1234567\"}', 19.50, 'LOW', '[{\"factor\": \"V├®rification OCR\", \"status\": \"PASSED\", \"impact\": -15, \"detail\": \"Concordance totale KBIS finnois (YTJ) et RIB Nordea\"}, {\"factor\": \"Contr├┤le Fraude IA\", \"status\": \"PASSED\", \"impact\": -20, \"detail\": \"Score IsolationForest nominal (-0.72)\"}, {\"factor\": \"Validation D├®duplication\", \"status\": \"PASSED\", \"impact\": -15, \"detail\": \"Fournisseur in├®dit dans le groupe\"}]', 0, '{\"isolation_forest_score\": -0.72, \"anomaly_detected\": false, \"country_mismatch\": false, \"tax_haven\": false, \"disposable_email\": false, \"duplicate_vat_found\": false, \"max_name_similarity\": 0.22, \"agent_reviewed_by\": 4, \"agent_notes\": \"Dossier complet, Kbis officiel finnois v├®rifi├® au registre du commerce YTJ. Bon pour approbation.\"}', NULL, NULL, '2026-02-25 11:00:00', '2026-02-25 15:45:00'),
(6, 2, 6, 'CREATION', 'SAP_SYNCED', 'GLOBAL', 'tok_starlight_approved_666', '2026-03-31 23:59:59', '{\"legal_name\": \"Starlight Software Solutions Inc\", \"trade_name\": \"Starlight Dev\", \"tax_id_vat\": \"US882341982\", \"country\": \"US\", \"address\": \"500 Howard Street, Suite 400, San Francisco, CA 94105\", \"iban\": \"US64SVBKUS6S3300958879\", \"bic_swift\": \"SVBKUS6SXXX\", \"bank_name\": \"Silicon Valley Bank\", \"annual_spend\": 750000.00, \"contact_name\": \"David Miller\", \"contact_email\": \"d.miller@starlight-soft.com\", \"contact_phone\": \"+1 415 555 0199\"}', 21.00, 'LOW', '[{\"factor\": \"Contr├┤le W-9 & TVA US\", \"status\": \"PASSED\", \"impact\": -15, \"detail\": \"Certificat W-9 valid├®\"}, {\"factor\": \"Approbation Hi├®rarchique\", \"status\": \"PASSED\", \"impact\": -25, \"detail\": \"Approuv├® par Directrice Tr├®sorerie Claire Vasseur\"}]', 0, '{\"isolation_forest_score\": -0.65, \"anomaly_detected\": false, \"agent_validated\": true, \"manager_approved\": true, \"approval_notes\": \"Fournisseur SaaS strat├®gique valid├® par la DSI et la Tr├®sorerie.\"}', '{\"idoc_type\":\"CREMAS05\",\"message_type\":\"CREMAS\",\"idoc_number\":\"0000000097323484\",\"sap_vendor_id\":\"VEND-001006\",\"status\":\"POSTED_SUCCESSFULLY\",\"direction\":\"OUTBOUND\",\"receiver_partner\":\"SAP_ERP_PRD_100\",\"sync_timestamp\":\"2026-09-26T20:39:14.129Z\",\"preventive_block_applied\":false,\"control_record\":{\"TABNAM\":\"EDI_DC40\",\"MANDT\":\"100\",\"DOCNUM\":\"0000000097323484\",\"MESTYP\":\"CREMAS\",\"IDOCTYP\":\"CREMAS05\",\"SNDPRT\":\"LS\",\"SNDPRN\":\"MASTERDATA_IA\",\"RCVPRN\":\"SAP_PRD\"},\"segments\":{\"E1LFA1M\":{\"LIFNR\":\"VEND-001006\",\"NAME1\":\"Starlight Software Solutions Inc\",\"NAME2\":\"Starlight Dev\",\"ORT01\":\"Suite 400\",\"PSTLZ\":\"75001\",\"LAND1\":\"US\",\"STCEG\":\"US882341982\",\"SPERR\":\"\"},\"E1LFB1M\":{\"BUKRS\":\"1000\",\"AKONT\":\"0000160000\",\"ZWELS\":\"T\",\"SPERR\":\"\"},\"E1LFBKM\":{\"BANKS\":\"US\",\"BANKL\":\"SVBKU\",\"BANKN\":\"00958879\",\"IBAN\":\"US64SVBKUS6S3300958879\",\"SWIFT\":\"SVBKUS6SXXX\",\"BKONT\":\"01\"}}}', NULL, '2026-02-20 09:00:00', '2026-09-26 21:39:14'),
(7, 2, 5, 'CREATION', 'SAP_SYNCED', 'WESTERN', 'tok_helios_synced_777', '2026-03-01 23:59:59', '{\"legal_name\": \"Helios Solar Components SAS\", \"trade_name\": \"Helios Solar\", \"tax_id_vat\": \"FR88776655443\", \"country\": \"FR\", \"address\": \"8 Rue de la Paix, 69002 Lyon\", \"iban\": \"FR7610058000019876543210944\", \"bic_swift\": \"HSBCFRPPXXX\", \"bank_name\": \"HSBC Continental Europe\", \"annual_spend\": 480000.00, \"contact_name\": \"Paul Val├®ry\", \"contact_email\": \"p.valery@helios-solar.fr\", \"contact_phone\": \"+33 4 78 00 11 22\"}', 24.00, 'LOW', '[{\"factor\": \"Analyse Globale Risque\", \"status\": \"PASSED\", \"impact\": -20, \"detail\": \"Dossier conforme, aucune anomalie\"}]', 0, '{\"status\": \"OK\", \"sap_status\": \"CREMAS05_POSTED_SUCCESSFULLY\"}', '{\"idoc_type\": \"CREMAS05\", \"message_type\": \"CREMAS\", \"idoc_number\": \"0000000004928173\", \"sap_vendor_id\": \"VEND-001005\", \"sync_timestamp\": \"2026-02-14T09:30:00Z\", \"segments\": {\"E1LFA1M\": {\"LIFNR\": \"VEND-001005\", \"NAME1\": \"Helios Solar Components SAS\", \"ORT01\": \"Lyon\", \"PSTLZ\": \"69002\", \"LAND1\": \"FR\", \"STCEG\": \"FR88776655443\"}, \"E1LFB1M\": {\"BUKRS\": \"1000\", \"AKONT\": \"0000160000\", \"ZWELS\": \"T\"}, \"E1LFBKM\": {\"BANKS\": \"FR\", \"BANKL\": \"10058\", \"BANKN\": \"00001987654\", \"IBAN\": \"FR7610058000019876543210944\", \"SWIFT\": \"HSBCFRPPXXX\"}}}', NULL, '2026-02-10 10:00:00', '2026-02-14 09:35:00'),
(8, 2, NULL, 'CREATION', 'REJECTED', 'WESTERN', 'tok_fake_logistics_rej_888', '2026-02-28 23:59:59', '{\"legal_name\": \"Fake Logistics Express EURL\", \"trade_name\": \"FakeLog\", \"tax_id_vat\": \"FR00112233445\", \"country\": \"FR\", \"address\": \"1 Boite Postale Inexistante, 13001 Marseille\", \"iban\": \"FR7630001000000000000000099\", \"bic_swift\": \"FAKEXXXX\", \"bank_name\": \"Banque Fictive\", \"annual_spend\": 120000.00, \"contact_name\": \"Escroc Pr├®sum├®\", \"contact_email\": \"scam@fakemail.com\", \"contact_phone\": \"+33 6 00 00 00 00\"}', 95.00, 'CRITICAL', '[{\"factor\": \"Falsification KBIS\", \"status\": \"FAILED\", \"impact\": 50, \"detail\": \"Num├®ro SIREN inexistant dans la base Infogreffe / INSEE\"}, {\"factor\": \"Checksum IBAN Erron├®\", \"status\": \"FAILED\", \"impact\": 30, \"detail\": \"Cl├® modulo 97 invalide pour le compte renseign├®\"}]', 1, '{\"fraud_score\": 0.95, \"rejection_confirmed\": true}', NULL, 'Rejet imm├®diat : Kbis falsifi├® (SIREN fant├┤me), IBAN invalide au contr├┤le modulo 97 et adresse de bo├«te postale sans consistance physique.', '2026-02-05 08:30:00', '2026-02-06 11:20:00');

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `admin_actions`
--
ALTER TABLE `admin_actions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_admin_act_admin` (`admin_id`),
  ADD KEY `idx_admin_act_target` (`target_user_id`),
  ADD KEY `idx_admin_act_time` (`timestamp`);

--
-- Index pour la table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_audit_req` (`request_id`),
  ADD KEY `idx_audit_user` (`user_id`),
  ADD KEY `idx_audit_action` (`action`),
  ADD KEY `idx_audit_timestamp` (`timestamp`);

--
-- Index pour la table `documents`
--
ALTER TABLE `documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_doc_request` (`request_id`),
  ADD KEY `idx_doc_type` (`doc_type`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_users_role` (`role`),
  ADD KEY `idx_users_scope` (`geographic_scope`),
  ADD KEY `idx_users_active` (`is_active`);

--
-- Index pour la table `vendors`
--
ALTER TABLE `vendors`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sap_vendor_id` (`sap_vendor_id`),
  ADD KEY `idx_vendors_vat` (`tax_id_vat`),
  ADD KEY `idx_vendors_iban` (`iban`),
  ADD KEY `idx_vendors_legal_name` (`legal_name`),
  ADD KEY `idx_vendors_sap_id` (`sap_vendor_id`),
  ADD KEY `idx_vendors_scope` (`geographic_scope`),
  ADD KEY `idx_vendors_segment` (`segment`),
  ADD KEY `idx_vendors_status` (`status`);

--
-- Index pour la table `vendor_requests`
--
ALTER TABLE `vendor_requests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `onboarding_token` (`onboarding_token`),
  ADD KEY `idx_vr_status` (`status`),
  ADD KEY `idx_vr_scope` (`geographic_scope`),
  ADD KEY `idx_vr_token` (`onboarding_token`),
  ADD KEY `idx_vr_created` (`created_at`),
  ADD KEY `idx_vr_fraud` (`fraud_alert`),
  ADD KEY `idx_vr_requester` (`requester_id`),
  ADD KEY `idx_vr_vendor` (`vendor_id`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `admin_actions`
--
ALTER TABLE `admin_actions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT pour la table `documents`
--
ALTER TABLE `documents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT pour la table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT pour la table `vendors`
--
ALTER TABLE `vendors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT pour la table `vendor_requests`
--
ALTER TABLE `vendor_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `admin_actions`
--
ALTER TABLE `admin_actions`
  ADD CONSTRAINT `admin_actions_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `admin_actions_ibfk_2` FOREIGN KEY (`target_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `vendor_requests` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `audit_logs_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `documents`
--
ALTER TABLE `documents`
  ADD CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `vendor_requests` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `vendor_requests`
--
ALTER TABLE `vendor_requests`
  ADD CONSTRAINT `vendor_requests_ibfk_1` FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `vendor_requests_ibfk_2` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
