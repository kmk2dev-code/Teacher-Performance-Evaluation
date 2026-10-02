-- MRWS e-Service: Teacher Performance Evaluation
-- MySQL 8 / MariaDB 10.6+
CREATE TABLE evaluation_forms (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  position_name VARCHAR(100) NOT NULL,
  rank_name VARCHAR(100) NULL,
  version VARCHAR(30) NOT NULL DEFAULT '2569',
  effective_from DATE NULL,
  effective_to DATE NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE evaluation_components (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  form_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(30) NOT NULL,
  title VARCHAR(500) NOT NULL,
  max_score DECIMAL(8,2) NOT NULL,
  raw_max_score DECIMAL(8,2) NULL,
  sequence_no INT NOT NULL,
  scoring_config JSON NULL,
  FOREIGN KEY (form_id) REFERENCES evaluation_forms(id),
  UNIQUE KEY uq_form_component (form_id, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE evaluation_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  component_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(30) NOT NULL,
  title VARCHAR(1000) NOT NULL,
  section_code VARCHAR(30) NULL,
  max_raw_score DECIMAL(8,2) NULL,
  rating_min DECIMAL(5,2) NULL,
  rating_max DECIMAL(5,2) NULL,
  scoring_config JSON NULL,
  sequence_no INT NOT NULL,
  FOREIGN KEY (component_id) REFERENCES evaluation_components(id),
  UNIQUE KEY uq_component_item (component_id, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE teachers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_code VARCHAR(50) NOT NULL UNIQUE,
  prefix VARCHAR(50) NULL,
  first_name VARCHAR(150) NOT NULL,
  last_name VARCHAR(150) NOT NULL,
  position_name VARCHAR(100) NOT NULL DEFAULT 'ครู',
  rank_name VARCHAR(100) NULL,
  salary DECIMAL(12,2) NULL,
  department VARCHAR(255) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE evaluation_periods (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  academic_year VARCHAR(20) NOT NULL,
  fiscal_year VARCHAR(20) NULL,
  round_no TINYINT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'open',
  UNIQUE KEY uq_period (academic_year, round_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE evaluations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  teacher_id BIGINT UNSIGNED NOT NULL,
  form_id BIGINT UNSIGNED NOT NULL,
  period_id BIGINT UNSIGNED NOT NULL,
  evaluator_user_id BIGINT UNSIGNED NULL,
  self_submitted_at DATETIME NULL,
  boss_submitted_at DATETIME NULL,
  self_total DECIMAL(8,2) NULL,
  boss_total DECIMAL(8,2) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'draft',
  form_snapshot JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id),
  FOREIGN KEY (form_id) REFERENCES evaluation_forms(id),
  FOREIGN KEY (period_id) REFERENCES evaluation_periods(id),
  INDEX idx_eval_teacher_period (teacher_id, period_id),
  INDEX idx_eval_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE evaluation_scores (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  evaluation_id BIGINT UNSIGNED NOT NULL,
  item_id BIGINT UNSIGNED NOT NULL,
  self_level DECIMAL(5,2) NULL,
  boss_level DECIMAL(5,2) NULL,
  self_score DECIMAL(8,2) NULL,
  boss_score DECIMAL(8,2) NULL,
  note TEXT NULL,
  FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES evaluation_items(id),
  UNIQUE KEY uq_eval_item (evaluation_id, item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE evaluation_attachments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  evaluation_id BIGINT UNSIGNED NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  storage_path VARCHAR(1000) NOT NULL,
  mime_type VARCHAR(150) NULL,
  file_size BIGINT UNSIGNED NULL,
  uploaded_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE evaluation_audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  evaluation_id BIGINT UNSIGNED NULL,
  user_id BIGINT UNSIGNED NULL,
  action VARCHAR(50) NOT NULL,
  old_data JSON NULL,
  new_data JSON NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_eval (evaluation_id),
  INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed the six teacher evaluation profiles.
INSERT INTO evaluation_forms (code,title,position_name,rank_name,version) VALUES
('TEACHER_ASSISTANT','แบบประเมินผลการปฏิบัติงาน ตำแหน่งครูผู้ช่วย','ครูผู้ช่วย',NULL,'2569'),
('TEACHER_NONE','แบบประเมินผลการปฏิบัติงาน ตำแหน่งครู ยังไม่มีวิทยฐานะ','ครู','ไม่มีวิทยฐานะ','2569'),
('TEACHER_CK','แบบประเมินผลการปฏิบัติงาน ตำแหน่งครู วิทยฐานะครูชำนาญการ','ครู','ครูชำนาญการ','2569'),
('TEACHER_CKP','แบบประเมินผลการปฏิบัติงาน ตำแหน่งครู วิทยฐานะครูชำนาญการพิเศษ','ครู','ครูชำนาญการพิเศษ','2569'),
('TEACHER_CE','แบบประเมินผลการปฏิบัติงาน ตำแหน่งครู วิทยฐานะครูเชี่ยวชาญ','ครู','ครูเชี่ยวชาญ','2569'),
('TEACHER_CEP','แบบประเมินผลการปฏิบัติงาน ตำแหน่งครู วิทยฐานะครูเชี่ยวชาญพิเศษ','ครู','ครูเชี่ยวชาญพิเศษ','2569');
