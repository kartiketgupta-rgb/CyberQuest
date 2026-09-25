USE defaultdb;

CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  email VARCHAR(100) NULL,
  password VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS questions (
  question_id INT AUTO_INCREMENT PRIMARY KEY,
  question_text TEXT NOT NULL,
  option1 VARCHAR(500) NOT NULL,
  option2 VARCHAR(500) NOT NULL,
  option3 VARCHAR(500) NOT NULL,
  option4 VARCHAR(500) NOT NULL,
  correct_option INT NOT NULL,
  difficulty ENUM('easy','medium','hard','expert') NOT NULL DEFAULT 'medium',
  UNIQUE KEY uq_question_text (question_text(255))
);

CREATE TABLE IF NOT EXISTS scores (
  score_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  score INT NOT NULL,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS question_history (
  history_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  question_id INT NOT NULL,
  played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_question (user_id, question_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(question_id) ON DELETE CASCADE
);
