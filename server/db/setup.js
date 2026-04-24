const { Pool } = require('pg');
require('dotenv').config();

const setupDatabase = async () => {
  const adminPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    const dbName = process.env.DB_NAME || 'ai_education_suite';
    const checkDb = await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (checkDb.rows.length === 0) {
      console.log(`Creating database: ${dbName}`);
      await adminPool.query(`CREATE DATABASE ${dbName}`);
      console.log('Database created successfully');
    } else {
      console.log('Database already exists');
    }
  } catch (err) {
    console.error('Error creating database:', err.message);
  } finally {
    await adminPool.end();
  }

  const appPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'ai_education_suite',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    // Create tables
    await appPool.query(`
      -- Users table (enhanced with role, profile fields, verification)
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        role VARCHAR(20) DEFAULT 'student',
        bio TEXT,
        avatar_url VARCHAR(500),
        phone VARCHAR(50),
        timezone VARCHAR(100) DEFAULT 'UTC',
        email_verified BOOLEAN DEFAULT FALSE,
        onboarding_completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Essays table
      CREATE TABLE IF NOT EXISTS essays (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(500) NOT NULL,
        content TEXT NOT NULL,
        grade VARCHAR(10),
        score INTEGER,
        feedback TEXT,
        strengths TEXT,
        improvements TEXT,
        grammar_issues TEXT,
        ai_response JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Music lessons table
      CREATE TABLE IF NOT EXISTS music_lessons (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        instrument VARCHAR(100) NOT NULL,
        skill_level VARCHAR(50) NOT NULL,
        topic VARCHAR(255) NOT NULL,
        lesson_content TEXT,
        practice_exercises TEXT,
        tips TEXT,
        progress_notes TEXT,
        ai_response JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Quizzes table
      CREATE TABLE IF NOT EXISTS quizzes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(500) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        difficulty VARCHAR(50) NOT NULL,
        source_content TEXT,
        questions JSONB,
        num_questions INTEGER DEFAULT 10,
        ai_response JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Reading analyses table
      CREATE TABLE IF NOT EXISTS reading_analyses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(500) NOT NULL,
        content TEXT NOT NULL,
        reading_level VARCHAR(100),
        grade_level VARCHAR(50),
        difficulty_score INTEGER,
        vocabulary_complexity VARCHAR(100),
        sentence_complexity VARCHAR(100),
        recommendations TEXT,
        ai_response JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Learning paths table
      CREATE TABLE IF NOT EXISTS learning_paths (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(500) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        current_level VARCHAR(100) NOT NULL,
        target_level VARCHAR(100) NOT NULL,
        goals TEXT,
        milestones JSONB,
        resources JSONB,
        timeline TEXT,
        ai_response JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Language sessions table (AI Language Immersion)
      CREATE TABLE IF NOT EXISTS language_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        target_language VARCHAR(100) NOT NULL,
        native_language VARCHAR(100) DEFAULT 'English',
        proficiency_level VARCHAR(100) NOT NULL,
        topic VARCHAR(500) NOT NULL,
        session_type VARCHAR(50) DEFAULT 'conversation',
        lesson_content TEXT,
        vocabulary JSONB,
        grammar_notes TEXT,
        exercises JSONB,
        cultural_notes TEXT,
        pronunciation_guide TEXT,
        ai_response JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Password reset tokens (Feature 1)
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Refresh tokens (Feature 32)
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        revoked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- User settings (Feature 4)
      CREATE TABLE IF NOT EXISTS user_settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        theme VARCHAR(20) DEFAULT 'light',
        language VARCHAR(10) DEFAULT 'en',
        notifications_enabled BOOLEAN DEFAULT TRUE,
        email_notifications BOOLEAN DEFAULT TRUE,
        items_per_page INTEGER DEFAULT 15,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Progress entries (Feature 34)
      CREATE TABLE IF NOT EXISTS progress_entries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        feature_type VARCHAR(50) NOT NULL,
        item_id INTEGER,
        action VARCHAR(100) NOT NULL,
        score INTEGER,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Notifications (Feature 12)
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) DEFAULT 'info',
        title VARCHAR(255) NOT NULL,
        message TEXT,
        link VARCHAR(500),
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Feedback (Feature 28)
      CREATE TABLE IF NOT EXISTS feedback (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) DEFAULT 'general',
        subject VARCHAR(500) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        admin_response TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Contact messages (Feature 27)
      CREATE TABLE IF NOT EXISTS contact_messages (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        name VARCHAR(255),
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(500) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'new',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Audit logs (Feature 24)
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50),
        entity_id INTEGER,
        old_values JSONB,
        new_values JSONB,
        ip_address VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Uploads (Feature 22)
      CREATE TABLE IF NOT EXISTS uploads (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        filename VARCHAR(500) NOT NULL,
        original_name VARCHAR(500) NOT NULL,
        mime_type VARCHAR(100),
        size INTEGER,
        entity_type VARCHAR(50),
        entity_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_essays_user_id ON essays(user_id);
      CREATE INDEX IF NOT EXISTS idx_music_lessons_user_id ON music_lessons(user_id);
      CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON quizzes(user_id);
      CREATE INDEX IF NOT EXISTS idx_reading_analyses_user_id ON reading_analyses(user_id);
      CREATE INDEX IF NOT EXISTS idx_learning_paths_user_id ON learning_paths(user_id);
      CREATE INDEX IF NOT EXISTS idx_language_sessions_user_id ON language_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
      CREATE INDEX IF NOT EXISTS idx_progress_user_id ON progress_entries(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_uploads_user_id ON uploads(user_id);
    `);

    // Add columns to existing users table if they don't exist (migration-safe)
    const addColumnIfNotExists = async (table, column, definition) => {
      try {
        await appPool.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${definition}`);
      } catch (e) {
        // Column might already exist
      }
    };

    await addColumnIfNotExists('users', 'role', "VARCHAR(20) DEFAULT 'student'");
    await addColumnIfNotExists('users', 'bio', 'TEXT');
    await addColumnIfNotExists('users', 'avatar_url', 'VARCHAR(500)');
    await addColumnIfNotExists('users', 'phone', 'VARCHAR(50)');
    await addColumnIfNotExists('users', 'timezone', "VARCHAR(100) DEFAULT 'UTC'");
    await addColumnIfNotExists('users', 'email_verified', 'BOOLEAN DEFAULT FALSE');
    await addColumnIfNotExists('users', 'onboarding_completed', 'BOOLEAN DEFAULT FALSE');
    await addColumnIfNotExists('users', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

    console.log('All tables created successfully');
  } catch (err) {
    console.error('Error creating tables:', err.message);
  } finally {
    await appPool.end();
  }
};

setupDatabase()
  .then(() => {
    console.log('Database setup complete');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Database setup failed:', err);
    process.exit(1);
  });
