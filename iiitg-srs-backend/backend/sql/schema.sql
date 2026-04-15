-- =============================================
-- IIIT Guwahati Semester Registration System
-- PostgreSQL Schema (with password support)
-- =============================================

-- Create database (run separately if needed):
-- CREATE DATABASE iiitg_srs;

-- Enums
CREATE TYPE user_role AS ENUM ('student', 'warden', 'finance', 'student_affairs', 'academic_affairs', 'admin');
CREATE TYPE payment_category AS ENUM ('loan', 'scholarship', 'self_financed');
CREATE TYPE approval_stage AS ENUM ('draft', 'section_review', 'advisor_review', 'submitted', 'final_approved', 'rejected');
CREATE TYPE approval_status AS ENUM ('approved', 'rejected', 'pending');

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role user_role NOT NULL DEFAULT 'student',
    roll_no VARCHAR(50),
    department VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- User Roles (for granular permissions)
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    role user_role NOT NULL,
    UNIQUE (user_id, role)
);

-- Courses
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    credits INTEGER NOT NULL CHECK (credits > 0),
    department VARCHAR(100) NOT NULL,
    semester INTEGER NOT NULL CHECK (semester > 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Registrations
CREATE TABLE registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    roll_no VARCHAR(50) NOT NULL,
    department VARCHAR(100) NOT NULL,
    category VARCHAR(1) NOT NULL CHECK (category IN ('1', '2', '3')),
    current_stage approval_stage NOT NULL DEFAULT 'draft',
    remarks TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Form A (Course Registration)
CREATE TABLE form_a (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID REFERENCES registrations(id) ON DELETE CASCADE NOT NULL UNIQUE,
    total_credits INTEGER NOT NULL DEFAULT 0,
    semester INTEGER NOT NULL,
    academic_year VARCHAR(20) NOT NULL
);

-- Form A ↔ Courses (many-to-many)
CREATE TABLE form_a_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_a_id UUID REFERENCES form_a(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES courses(id) NOT NULL,
    UNIQUE (form_a_id, course_id)
);

-- Form B (Fee Details)
CREATE TABLE form_b (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID REFERENCES registrations(id) ON DELETE CASCADE NOT NULL UNIQUE,
    payment_category payment_category NOT NULL,
    tuition_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
    hostel_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
    other_fees NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
    late_fine NUMERIC(10, 2) DEFAULT 0,
    payment_details TEXT
);

-- Approvals (multi-stage workflow)
CREATE TABLE approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID REFERENCES registrations(id) ON DELETE CASCADE NOT NULL,
    stage approval_stage NOT NULL,
    status approval_status NOT NULL DEFAULT 'pending',
    approved_by VARCHAR(255),
    approved_by_user_id UUID REFERENCES users(id),
    remarks TEXT,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (registration_id, stage)
);

-- System Settings
CREATE TABLE system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_registrations_student ON registrations(student_id);
CREATE INDEX idx_registrations_stage ON registrations(current_stage);
CREATE INDEX idx_approvals_registration ON approvals(registration_id);
CREATE INDEX idx_form_a_registration ON form_a(registration_id);
CREATE INDEX idx_form_b_registration ON form_b(registration_id);
CREATE INDEX idx_users_role ON users(role);

-- Seed: Settings
INSERT INTO system_settings (key, value) VALUES ('registration_enabled', '{"enabled": true}'::jsonb);

-- Seed: Courses
INSERT INTO courses (code, name, credits, department, semester) VALUES
    ('CS301', 'Data Structures & Algorithms', 4, 'CSE', 3),
    ('CS302', 'Operating Systems', 4, 'CSE', 3),
    ('CS303', 'Database Management Systems', 4, 'CSE', 3),
    ('CS304', 'Computer Networks', 3, 'CSE', 3),
    ('MA301', 'Probability & Statistics', 3, 'Mathematics', 3),
    ('HS301', 'Technical Communication', 2, 'HSS', 3),
    ('CS401', 'Machine Learning', 4, 'CSE', 5),
    ('CS402', 'Compiler Design', 3, 'CSE', 5),
    ('EC301', 'Digital Signal Processing', 3, 'ECE', 5),
    ('CS501', 'Artificial Intelligence', 4, 'CSE', 7);

-- Seed: Demo Users (password: 'demo' for all)
-- bcrypt hash of 'demo': $2a$10$...
INSERT INTO users (name, email, role, roll_no, department) VALUES
    ('Arjun Kumar', 'student@iiitg.ac.in', 'student', '2021101', 'CSE'),
    ('Dr. Priya Sharma', 'warden@iiitg.ac.in', 'warden', NULL, NULL),
    ('Rajesh Verma', 'finance@iiitg.ac.in', 'finance', NULL, NULL),
    ('Dr. Meena Gupta', 'studentaffairs@iiitg.ac.in', 'student_affairs', NULL, NULL),
    ('Prof. Suresh Iyer', 'academic@iiitg.ac.in', 'academic_affairs', NULL, NULL),
    ('System Admin', 'admin@iiitg.ac.in', 'admin', NULL, NULL);
