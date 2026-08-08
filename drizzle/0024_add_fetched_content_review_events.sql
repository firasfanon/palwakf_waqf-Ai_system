CREATE TABLE IF NOT EXISTS `fetched_content_review_events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fetched_content_id` int NOT NULL,
  `event_type` enum('route','extraction','classification','decision','approval','rejection','manual_update','bulk_action') NOT NULL,
  `event_source` enum('system','ai','reviewer','admin') NOT NULL DEFAULT 'system',
  `route` varchar(32) DEFAULT NULL,
  `previous_status` enum('pending','approved','rejected','processing') DEFAULT NULL,
  `next_status` enum('pending','approved','rejected','processing') DEFAULT NULL,
  `confidence` decimal(5,4) DEFAULT NULL,
  `notes` text,
  `payload` text,
  `actor_user_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `review_event_content_idx` (`fetched_content_id`),
  KEY `review_event_type_idx` (`event_type`),
  KEY `review_event_actor_idx` (`actor_user_id`),
  KEY `review_event_created_idx` (`created_at`),
  CONSTRAINT `fetched_content_review_events_fetched_content_id_fk`
    FOREIGN KEY (`fetched_content_id`) REFERENCES `fetched_content` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fetched_content_review_events_actor_user_id_fk`
    FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
);
