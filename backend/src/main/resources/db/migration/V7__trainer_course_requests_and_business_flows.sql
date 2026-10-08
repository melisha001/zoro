-- Flyway Migration V7: Trainer course requests and business flow enhancements

CREATE TABLE IF NOT EXISTS trainer_course_requests (
    id VARCHAR(128) PRIMARY KEY,
    trainer_id VARCHAR(64) NOT NULL,
    trainer_name VARCHAR(255),
    trainer_email VARCHAR(255),
    course_id VARCHAR(128) NOT NULL,
    course_title VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    request_date VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tcr_trainer FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_tcr_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_tcr_trainer_id ON trainer_course_requests(trainer_id);
CREATE INDEX IF NOT EXISTS idx_tcr_course_id ON trainer_course_requests(course_id);
CREATE INDEX IF NOT EXISTS idx_tcr_status ON trainer_course_requests(status);
