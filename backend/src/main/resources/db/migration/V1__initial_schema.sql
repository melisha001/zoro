-- Zoro English Academy PostgreSQL Schema Migration V1

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'ADMIN', 'TRAINER', 'STUDENT'
    phone VARCHAR(50),
    avatar TEXT,
    status VARCHAR(50) DEFAULT 'Active',
    address TEXT,
    joined_on VARCHAR(50),
    specialty VARCHAR(255),
    code VARCHAR(50),
    salary_amount NUMERIC(12, 2) DEFAULT 0,
    salary_credit_date VARCHAR(20),
    course VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
    id VARCHAR(128) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    mode VARCHAR(50), -- 'Online', 'Recorded', 'Hybrid'
    level VARCHAR(50),
    audience VARCHAR(50) DEFAULT 'student', -- 'student', 'trainer'
    duration VARCHAR(100),
    price NUMERIC(10, 2) DEFAULT 0,
    original_price NUMERIC(10, 2) DEFAULT 0,
    thumbnail TEXT,
    preview_video_url TEXT,
    enrolled INT DEFAULT 0,
    rating NUMERIC(3, 2) DEFAULT 5.0,
    status VARCHAR(50) DEFAULT 'Active',
    assigned_trainer VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS course_modules (
    id VARCHAR(128) PRIMARY KEY,
    course_id VARCHAR(128) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    module_order INT NOT NULL DEFAULT 1,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration VARCHAR(100),
    video_storage_ref JSONB,
    after_session_assessment JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS course_resources (
    id VARCHAR(128) PRIMARY KEY,
    course_id VARCHAR(128) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    module_id VARCHAR(128) REFERENCES course_modules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50),
    file_size VARCHAR(50),
    target_audience VARCHAR(50) DEFAULT 'all',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS batches (
    id VARCHAR(128) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    course_id VARCHAR(128),
    trainer_name VARCHAR(255),
    trainer_id VARCHAR(64),
    days TEXT,
    session VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_course_batches (
    id BIGSERIAL PRIMARY KEY,
    student_id VARCHAR(64) NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    batch_name VARCHAR(255) NOT NULL,
    batch_id VARCHAR(128),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS enrollments (
    id VARCHAR(128) PRIMARY KEY,
    student_id VARCHAR(64) NOT NULL,
    student_email VARCHAR(255) NOT NULL,
    course_id VARCHAR(128) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    course_title VARCHAR(255),
    batch_name VARCHAR(255),
    enrolled_date VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS enrollment_requests (
    id VARCHAR(128) PRIMARY KEY,
    student_id VARCHAR(64) NOT NULL,
    student_name VARCHAR(255),
    student_email VARCHAR(255),
    student_phone VARCHAR(50),
    course_id VARCHAR(128) NOT NULL,
    course_title VARCHAR(255) NOT NULL,
    mode VARCHAR(50),
    batch_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Pending',
    request_date VARCHAR(50),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS schedules (
    id VARCHAR(128) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    course VARCHAR(255) NOT NULL,
    course_id VARCHAR(128),
    batch VARCHAR(255) NOT NULL,
    batch_id VARCHAR(128),
    trainer VARCHAR(255) NOT NULL,
    trainer_id VARCHAR(64),
    time VARCHAR(100) NOT NULL,
    date VARCHAR(50) NOT NULL,
    mode VARCHAR(100),
    meet_link TEXT,
    students_count INT DEFAULT 25,
    status VARCHAR(50) DEFAULT 'Upcoming',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance_records (
    id VARCHAR(128) PRIMARY KEY,
    schedule_id VARCHAR(128),
    student_id VARCHAR(64) NOT NULL,
    student_name VARCHAR(255),
    course_id VARCHAR(128),
    batch_id VARCHAR(128),
    date VARCHAR(50),
    status VARCHAR(50) NOT NULL,
    remarks TEXT,
    recorded_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_fees (
    id VARCHAR(128) PRIMARY KEY,
    student_id VARCHAR(64) NOT NULL,
    student_name VARCHAR(255),
    course VARCHAR(255) NOT NULL,
    batch VARCHAR(255),
    total_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    due_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Pending',
    date VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fee_payments (
    id VARCHAR(128) PRIMARY KEY,
    fee_id VARCHAR(128) NOT NULL REFERENCES student_fees(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'Online',
    transaction_ref VARCHAR(100),
    payment_date VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assignments (
    id VARCHAR(128) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    course VARCHAR(255) NOT NULL,
    course_id VARCHAR(128),
    batch VARCHAR(255),
    batch_id VARCHAR(128),
    trainer VARCHAR(255),
    due_date VARCHAR(50),
    description TEXT,
    attachment JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assignment_submissions (
    id VARCHAR(128) PRIMARY KEY,
    mode VARCHAR(50),
    course_title VARCHAR(255),
    course_id VARCHAR(128),
    batch_name VARCHAR(255),
    student_name VARCHAR(255),
    student_email VARCHAR(255),
    assignment_title VARCHAR(255),
    source_type VARCHAR(50),
    source_id VARCHAR(128),
    submitted_at VARCHAR(50),
    answer_text TEXT,
    attachment JSONB,
    status VARCHAR(50) DEFAULT 'Pending Correction',
    assigned_trainer VARCHAR(255),
    corrected_by VARCHAR(255),
    corrected_at VARCHAR(50),
    remarks TEXT,
    score VARCHAR(50),
    correction_attachment JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_progress (
    id BIGSERIAL PRIMARY KEY,
    student_id VARCHAR(255) NOT NULL,
    course_id VARCHAR(128) NOT NULL,
    module_id VARCHAR(128) NOT NULL,
    last_position INT DEFAULT 0,
    completion_percentage INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Not Started',
    last_accessed_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_student_course_module UNIQUE (student_id, course_id, module_id)
);

CREATE TABLE IF NOT EXISTS doubts (
    id VARCHAR(128) PRIMARY KEY,
    student_id VARCHAR(64),
    student_name VARCHAR(255),
    course_id VARCHAR(128),
    course_title VARCHAR(255),
    module_id VARCHAR(128),
    module_title VARCHAR(255),
    question TEXT NOT NULL,
    trainer_name VARCHAR(255),
    reply TEXT,
    reply_date VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS enquiries (
    id VARCHAR(128) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    course_interest VARCHAR(255),
    message TEXT,
    status VARCHAR(50) DEFAULT 'New',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(128) PRIMARY KEY,
    recipient_role VARCHAR(50),
    recipient_id VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(255),
    user_name VARCHAR(255),
    action VARCHAR(255) NOT NULL,
    details TEXT,
    ip_address VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expenses (
    id VARCHAR(128) PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    date VARCHAR(50) NOT NULL,
    description TEXT,
    receipt_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS salary_records (
    id VARCHAR(128) PRIMARY KEY,
    trainer_id VARCHAR(64) NOT NULL,
    trainer_name VARCHAR(255) NOT NULL,
    month VARCHAR(50) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Paid',
    payment_date VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS competitions (
    id VARCHAR(128) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    start_date VARCHAR(50),
    end_date VARCHAR(50),
    registration_fee NUMERIC(10, 2) DEFAULT 0,
    description TEXT,
    rules TEXT,
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS competition_modules (
    id VARCHAR(128) PRIMARY KEY,
    competition_id VARCHAR(128) NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    round_number INT DEFAULT 1,
    description TEXT,
    assessment_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS competition_registrations (
    id VARCHAR(128) PRIMARY KEY,
    competition_id VARCHAR(128) NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    student_id VARCHAR(64),
    student_name VARCHAR(255),
    student_email VARCHAR(255),
    payment_status VARCHAR(50) DEFAULT 'Paid',
    score NUMERIC(6, 2),
    rank INT,
    certificate_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS website_settings (
    id VARCHAR(64) PRIMARY KEY,
    hero_headline TEXT,
    hero_subheadline TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address TEXT,
    banner_announcement TEXT,
    settings_json JSONB,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS videos (
    id VARCHAR(128) PRIMARY KEY,
    bunny_video_id VARCHAR(128) UNIQUE NOT NULL,
    library_id INT NOT NULL DEFAULT 770045,
    title VARCHAR(255) NOT NULL,
    course_id VARCHAR(128),
    module_id VARCHAR(128),
    duration_seconds INT DEFAULT 0,
    status INT DEFAULT 0,
    status_label VARCHAR(50) DEFAULT 'Processing',
    storage_key VARCHAR(255),
    direct_stream_url TEXT,
    hls_playlist_url TEXT,
    thumbnail_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indices for fast querying
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_schedules_batch ON schedules(batch_id);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(date);
CREATE INDEX IF NOT EXISTS idx_submissions_course ON assignment_submissions(course_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON assignment_submissions(student_email);
CREATE INDEX IF NOT EXISTS idx_progress_student ON student_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_videos_course ON videos(course_id);
