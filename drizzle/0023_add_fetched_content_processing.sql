ALTER TABLE fetched_content
  ADD COLUMN ai_category ENUM('law','jurisprudence','majalla','historical','administrative','reference') NULL,
  ADD COLUMN ai_keywords TEXT NULL,
  ADD COLUMN ai_summary TEXT NULL,
  ADD COLUMN ai_confidence DECIMAL(5,4) NULL,
  ADD COLUMN ai_reasoning TEXT NULL,
  ADD COLUMN processed_at TIMESTAMP NULL,
  ADD COLUMN processing_version VARCHAR(50) NULL,
  ADD COLUMN processing_error TEXT NULL;
