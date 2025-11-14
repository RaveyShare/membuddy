CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  wechat_openid VARCHAR(64),
  wechat_unionid VARCHAR(64),
  wechat_nickname VARCHAR(255),
  wechat_avatar VARCHAR(512),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_wechat_openid (wechat_openid),
  INDEX idx_users_wechat_unionid (wechat_unionid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE memory_items (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  title VARCHAR(255),
  content LONGTEXT NOT NULL,
  category VARCHAR(64) DEFAULT '其他',
  tags JSON,
  type VARCHAR(32) DEFAULT 'general',
  difficulty VARCHAR(16) DEFAULT 'medium',
  mastery INT DEFAULT 0,
  review_count INT DEFAULT 0,
  review_date DATETIME NULL,
  next_review_date DATETIME NULL,
  starred TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_memory_items_user (user_id),
  INDEX idx_memory_items_created (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE memory_aids (
  memory_item_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  mind_map_data JSON,
  mnemonics_data JSON,
  sensory_associations_data JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (memory_item_id, user_id),
  INDEX idx_memory_aids_item (memory_item_id),
  FOREIGN KEY (memory_item_id) REFERENCES memory_items(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE review_schedules (
  id CHAR(36) PRIMARY KEY,
  memory_item_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  review_date DATETIME NOT NULL,
  completed TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_review_schedules_user (user_id),
  INDEX idx_review_schedules_item (memory_item_id),
  INDEX idx_review_schedules_date (review_date),
  FOREIGN KEY (memory_item_id) REFERENCES memory_items(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE shares (
  id CHAR(36) PRIMARY KEY,
  memory_item_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  share_type VARCHAR(32) NOT NULL,
  content_id VARCHAR(64),
  share_content JSON NOT NULL,
  expires_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_shares_user (user_id),
  INDEX idx_shares_item (memory_item_id),
  INDEX idx_shares_type (share_type),
  FOREIGN KEY (memory_item_id) REFERENCES memory_items(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;