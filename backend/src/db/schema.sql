-- ============================================================================
-- SCHÉMA DE PRODUCTION UNIFIÉ — 14 TABLES — TUI MASTER DATA IA
-- Base de données cible : tui_masterdata_prod
-- Charset : utf8mb4 / utf8mb4_unicode_ci
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Table: users
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) NOT NULL DEFAULT 'admin',
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `geographic_scope` VARCHAR(50) NOT NULL DEFAULT 'GLOBAL',
  `language` VARCHAR(10) NOT NULL DEFAULT 'fr',
  `must_change_password` TINYINT(1) NOT NULL DEFAULT 0,
  `failed_attempts` INT NOT NULL DEFAULT 0,
  `failed_login_attempts` INT NOT NULL DEFAULT 0,
  `locked_until` DATETIME DEFAULT NULL,
  `last_login_at` DATETIME DEFAULT NULL,
  `vendor_id` INT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Table: projects
CREATE TABLE IF NOT EXISTS `projects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `currencies` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`currencies`)),
  `created_by` INT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_projects_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Table: project_countries
CREATE TABLE IF NOT EXISTS `project_countries` (
  `project_id` INT NOT NULL,
  `country_code` VARCHAR(3) NOT NULL,
  `required_documents` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`required_documents`)),
  PRIMARY KEY (`project_id`, `country_code`),
  CONSTRAINT `fk_project_countries_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Table: user_projects
CREATE TABLE IF NOT EXISTS `user_projects` (
  `user_id` INT NOT NULL,
  `project_id` INT NOT NULL,
  `assigned_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `project_id`),
  CONSTRAINT `fk_user_projects_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_projects_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Table: vendors
CREATE TABLE IF NOT EXISTS `vendors` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `vendor_code` VARCHAR(50) DEFAULT NULL,
  `sap_vendor_id` VARCHAR(50) DEFAULT NULL,
  `company_name` VARCHAR(255) DEFAULT NULL,
  `legal_name` VARCHAR(255) NOT NULL,
  `trade_name` VARCHAR(255) DEFAULT NULL,
  `vat_number` VARCHAR(50) DEFAULT NULL,
  `tax_id_vat` VARCHAR(50) NOT NULL,
  `siret` VARCHAR(50) DEFAULT NULL,
  `address` TEXT NOT NULL,
  `country` VARCHAR(3) NOT NULL,
  `iban` VARCHAR(42) NOT NULL,
  `bic_swift` VARCHAR(15) NOT NULL,
  `bank_name` VARCHAR(150) DEFAULT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  `risk_score` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `segment` VARCHAR(50) NOT NULL DEFAULT 'OCCASIONAL',
  `annual_spend` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `project_id` INT DEFAULT NULL,
  `geographic_scope` VARCHAR(50) DEFAULT 'WESTERN',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_vendors_sap_id` (`sap_vendor_id`),
  INDEX `idx_vendors_vat` (`tax_id_vat`),
  INDEX `idx_vendors_project` (`project_id`),
  CONSTRAINT `fk_vendors_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Table: vendor_requests
CREATE TABLE IF NOT EXISTS `vendor_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `requester_id` INT DEFAULT NULL,
  `vendor_id` INT DEFAULT NULL,
  `project_id` INT DEFAULT NULL,
  `assigned_agent_id` INT DEFAULT NULL,
  `type` VARCHAR(50) DEFAULT 'CREATION',
  `request_type` VARCHAR(50) NOT NULL DEFAULT 'CREATION',
  `status` VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  `geographic_scope` VARCHAR(50) DEFAULT 'WESTERN',
  `onboarding_token` VARCHAR(100) DEFAULT NULL,
  `token_expires_at` DATETIME DEFAULT NULL,
  `draft_data` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`draft_data`)),
  `temporary_data` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`temporary_data`)),
  `extracted_ocr_data` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`extracted_ocr_data`)),
  `ai_result` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`ai_result`)),
  `anomaly_score` DECIMAL(5,3) DEFAULT NULL,
  `risk_score` DECIMAL(5,2) DEFAULT NULL,
  `risk_tier` VARCHAR(50) DEFAULT NULL,
  `risk_factors` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`risk_factors`)),
  `fraud_alert` TINYINT(1) NOT NULL DEFAULT 0,
  `fraud_details` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`fraud_details`)),
  `recommendation` VARCHAR(255) DEFAULT NULL,
  `review_comment` TEXT DEFAULT NULL,
  `rejection_reason` TEXT DEFAULT NULL,
  `sap_idoc_payload` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`sap_idoc_payload`)),
  `submitted_at` DATETIME DEFAULT NULL,
  `decided_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_requests_status` (`status`),
  INDEX `idx_requests_requester` (`requester_id`),
  INDEX `idx_requests_vendor` (`vendor_id`),
  INDEX `idx_requests_project` (`project_id`),
  CONSTRAINT `fk_requests_requester` FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_requests_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_requests_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Table: documents
CREATE TABLE IF NOT EXISTS `documents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `vendor_request_id` INT DEFAULT NULL,
  `request_id` INT DEFAULT NULL,
  `type` VARCHAR(50) DEFAULT 'OTHER',
  `doc_type` VARCHAR(50) DEFAULT 'OTHER',
  `file_name` VARCHAR(255) NOT NULL,
  `stored_name` VARCHAR(255) DEFAULT NULL,
  `file_path` VARCHAR(500) NOT NULL,
  `file_size` INT DEFAULT 0,
  `size` INT DEFAULT 0,
  `mime_type` VARCHAR(100) NOT NULL,
  `sha256` VARCHAR(64) DEFAULT NULL,
  `ocr_extracted_data` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`ocr_extracted_data`)),
  `ocr_confidence` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`ocr_confidence`)),
  `uploaded_by` INT DEFAULT NULL,
  `uploaded_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_documents_request` (`vendor_request_id`),
  CONSTRAINT `fk_documents_request` FOREIGN KEY (`vendor_request_id`) REFERENCES `vendor_requests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Table: invitations
CREATE TABLE IF NOT EXISTS `invitations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL,
  `project_id` INT DEFAULT NULL,
  `requester_id` INT DEFAULT NULL,
  `token_hash` VARCHAR(255) NOT NULL,
  `vendor_request_id` INT DEFAULT NULL,
  `expires_at` DATETIME NOT NULL,
  `used_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_invitations_token` (`token_hash`),
  INDEX `idx_invitations_email` (`email`),
  CONSTRAINT `fk_invitations_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_invitations_requester` FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_invitations_request` FOREIGN KEY (`vendor_request_id`) REFERENCES `vendor_requests` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Table: messages
CREATE TABLE IF NOT EXISTS `messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `vendor_request_id` INT NOT NULL,
  `sender_id` INT NOT NULL,
  `body` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `read_at` DATETIME DEFAULT NULL,
  INDEX `idx_messages_request` (`vendor_request_id`),
  CONSTRAINT `fk_messages_request` FOREIGN KEY (`vendor_request_id`) REFERENCES `vendor_requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_messages_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Table: notifications
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `type` VARCHAR(100) NOT NULL,
  `payload` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payload`)),
  `read_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_notifications_user` (`user_id`),
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Table: audit_logs (Table d'audit unique et inaltérable avec chaînage SHA-256)
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `vendor_request_id` INT DEFAULT NULL,
  `request_id` INT DEFAULT NULL,
  `actor_id` INT DEFAULT NULL,
  `user_id` INT DEFAULT NULL,
  `target_user_id` INT DEFAULT NULL,
  `action` VARCHAR(100) NOT NULL,
  `old_data` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_data`)),
  `new_data` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_data`)),
  `old_value` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `new_value` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `ip` VARCHAR(45) DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `user_agent` VARCHAR(255) DEFAULT NULL,
  `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `prev_hash` CHAR(64) DEFAULT NULL,
  `row_hash` CHAR(64) DEFAULT NULL,
  INDEX `idx_audit_actor` (`actor_id`),
  INDEX `idx_audit_target` (`target_user_id`),
  INDEX `idx_audit_request` (`vendor_request_id`),
  INDEX `idx_audit_action` (`action`),
  INDEX `idx_audit_timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Table: sap_sync_logs
CREATE TABLE IF NOT EXISTS `sap_sync_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `vendor_request_id` INT NOT NULL,
  `attempt` INT NOT NULL DEFAULT 1,
  `status` VARCHAR(50) NOT NULL,
  `http_code` INT DEFAULT NULL,
  `response` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`response`)),
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_sap_sync_request` (`vendor_request_id`),
  CONSTRAINT `fk_sap_sync_request` FOREIGN KEY (`vendor_request_id`) REFERENCES `vendor_requests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Table: refresh_tokens
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `token` TEXT DEFAULT NULL,
  `token_hash` VARCHAR(255) DEFAULT NULL,
  `expires_at` DATETIME NOT NULL,
  `revoked_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_refresh_tokens_user` (`user_id`),
  CONSTRAINT `fk_refresh_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Table: ai_settings
CREATE TABLE IF NOT EXISTS `ai_settings` (
  `key_name` VARCHAR(100) NOT NULL PRIMARY KEY,
  `setting_value` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`setting_value`)),
  `description` VARCHAR(255) DEFAULT NULL,
  `updated_by` INT DEFAULT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- TRIGGERS D'IMMUABILITÉ SOX SUR audit_logs
-- ============================================================================

DROP TRIGGER IF EXISTS `audit_logs_prevent_update`;
CREATE TRIGGER `audit_logs_prevent_update`
BEFORE UPDATE ON `audit_logs`
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La table audit_logs est en ajout seul (SOX Compliance).';
END;

DROP TRIGGER IF EXISTS `audit_logs_prevent_delete`;
CREATE TRIGGER `audit_logs_prevent_delete`
BEFORE DELETE ON `audit_logs`
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La suppression est strictement interdite sur la table audit_logs (SOX Compliance).';
END;
