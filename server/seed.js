const pool = require('./db/config');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');

    const hashedPassword = await bcrypt.hash(process.env.DEMO_PASSWORD || 'demo123456', 10);
    const adminPassword = await bcrypt.hash('admin123456', 10);
    const teacherPassword = await bcrypt.hash('teacher123456', 10);

    // Create demo user (student)
    const userResult = await pool.query(`
      INSERT INTO users (email, password, name, role, bio, phone, timezone, email_verified, onboarding_completed)
      VALUES ($1, $2, $3, 'student', 'Passionate learner exploring AI-powered education tools.', '+1-555-0100', 'America/New_York', TRUE, TRUE)
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = 'student', bio = EXCLUDED.bio, email_verified = TRUE, onboarding_completed = TRUE
      RETURNING id
    `, [process.env.DEMO_EMAIL || 'demo@aieducation.com', hashedPassword, 'Demo User']);
    const userId = userResult.rows[0].id;

    // Create admin user
    const adminResult = await pool.query(`
      INSERT INTO users (email, password, name, role, bio, phone, timezone, email_verified, onboarding_completed)
      VALUES ('admin@aieducation.com', $1, 'Admin User', 'admin', 'Platform administrator managing the AI Education Suite.', '+1-555-0101', 'America/Chicago', TRUE, TRUE)
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = 'admin', email_verified = TRUE, onboarding_completed = TRUE
      RETURNING id
    `, [adminPassword]);
    const adminId = adminResult.rows[0].id;

    // Create teacher user
    const teacherResult = await pool.query(`
      INSERT INTO users (email, password, name, role, bio, phone, timezone, email_verified, onboarding_completed)
      VALUES ('teacher@aieducation.com', $1, 'Teacher User', 'teacher', 'Experienced educator leveraging AI tools for better teaching.', '+1-555-0102', 'America/Los_Angeles', TRUE, TRUE)
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = 'teacher', email_verified = TRUE, onboarding_completed = TRUE
      RETURNING id
    `, [teacherPassword]);
    const teacherId = teacherResult.rows[0].id;

    console.log('Users created/updated (student, admin, teacher)');

    // Clear existing seed data for demo user
    const tables = ['essays', 'music_lessons', 'quizzes', 'reading_analyses', 'learning_paths',
      'password_reset_tokens', 'refresh_tokens', 'user_settings', 'progress_entries',
      'notifications', 'feedback', 'contact_messages', 'audit_logs', 'uploads'];

    for (const table of tables) {
      try {
        await pool.query(`DELETE FROM ${table} WHERE user_id = $1`, [userId]);
      } catch (e) { /* table might not exist yet */ }
    }

    // ============================================================
    // ORIGINAL 5 FEATURE SEED DATA (15 items each)
    // ============================================================

    // Seed Essays (15 items)
    const essays = [
      { title: 'The Impact of Climate Change on Coastal Cities', content: 'Climate change poses significant threats to coastal cities worldwide...', grade: 'A', score: 92, feedback: 'Excellent analysis with strong supporting evidence.' },
      { title: 'Artificial Intelligence in Healthcare', content: 'The integration of artificial intelligence in healthcare is revolutionizing patient care...', grade: 'A-', score: 88, feedback: 'Well-researched with good structure.' },
      { title: 'The Renaissance: A Cultural Revolution', content: 'The Renaissance period marked a profound shift in European culture, art, and thinking...', grade: 'B+', score: 85, feedback: 'Good historical analysis but needs more primary sources.' },
      { title: 'Sustainable Energy Solutions', content: 'As the world faces increasing energy demands and environmental concerns...', grade: 'A', score: 94, feedback: 'Outstanding research and compelling arguments.' },
      { title: 'The Psychology of Social Media', content: 'Social media platforms have fundamentally changed how humans interact...', grade: 'B', score: 82, feedback: 'Interesting topic but arguments could be stronger.' },
      { title: 'Space Exploration: Past and Future', content: 'From the first satellite launch to modern Mars missions...', grade: 'A-', score: 89, feedback: 'Engaging narrative with solid technical details.' },
      { title: 'The Evolution of Democracy', content: 'Democracy as a system of governance has evolved significantly...', grade: 'B+', score: 86, feedback: 'Comprehensive overview with room for deeper analysis.' },
      { title: 'Biodiversity and Ecosystem Health', content: 'Biodiversity is essential for maintaining healthy ecosystems...', grade: 'A', score: 91, feedback: 'Excellent use of scientific data and examples.' },
      { title: 'The Digital Divide in Education', content: 'Access to technology and internet connectivity varies greatly...', grade: 'B+', score: 84, feedback: 'Important topic with good case studies.' },
      { title: 'Quantum Computing Fundamentals', content: 'Quantum computing represents a paradigm shift in computational capability...', grade: 'B', score: 80, feedback: 'Good introduction but technical explanations need clarity.' },
      { title: 'Cultural Identity in Globalization', content: 'Globalization has brought cultures closer together while raising questions...', grade: 'A-', score: 87, feedback: 'Thoughtful analysis with diverse perspectives.' },
      { title: 'The Ethics of Genetic Engineering', content: 'Advances in genetic engineering technology raise profound ethical questions...', grade: 'A', score: 93, feedback: 'Balanced treatment of a complex ethical issue.' },
      { title: 'Economic Impacts of Automation', content: 'Automation and robotics are transforming industries and labor markets...', grade: 'B+', score: 85, feedback: 'Good economic analysis with relevant data.' },
      { title: 'Mental Health Awareness in Schools', content: 'Addressing mental health in educational settings has become increasingly important...', grade: 'A-', score: 88, feedback: 'Compelling argument with practical recommendations.' },
      { title: 'The Future of Transportation', content: 'Transportation is undergoing rapid transformation with electric vehicles...', grade: 'B+', score: 83, feedback: 'Informative overview of emerging technologies.' }
    ];

    for (const essay of essays) {
      await pool.query(
        `INSERT INTO essays (user_id, title, content, grade, score, feedback, strengths, improvements)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [userId, essay.title, essay.content, essay.grade, essay.score, essay.feedback,
          'Clear thesis, good organization, strong vocabulary', 'Add more citations, expand conclusion']);
    }
    console.log('15 essays seeded');

    // Seed Music Lessons (15 items)
    const musicLessons = [
      { instrument: 'Piano', skill_level: 'Beginner', topic: 'Basic Hand Position and Posture' },
      { instrument: 'Guitar', skill_level: 'Beginner', topic: 'Open Chord Fundamentals' },
      { instrument: 'Violin', skill_level: 'Intermediate', topic: 'Vibrato Technique' },
      { instrument: 'Drums', skill_level: 'Beginner', topic: 'Basic Rock Beat' },
      { instrument: 'Piano', skill_level: 'Intermediate', topic: 'Scale Mastery - Major Scales' },
      { instrument: 'Guitar', skill_level: 'Advanced', topic: 'Fingerstyle Patterns' },
      { instrument: 'Saxophone', skill_level: 'Beginner', topic: 'Embouchure Development' },
      { instrument: 'Flute', skill_level: 'Intermediate', topic: 'Breath Control Exercises' },
      { instrument: 'Piano', skill_level: 'Advanced', topic: 'Jazz Improvisation Basics' },
      { instrument: 'Guitar', skill_level: 'Intermediate', topic: 'Barre Chord Mastery' },
      { instrument: 'Drums', skill_level: 'Intermediate', topic: 'Jazz Brushwork' },
      { instrument: 'Violin', skill_level: 'Beginner', topic: 'Bow Hold and Basic Strokes' },
      { instrument: 'Bass Guitar', skill_level: 'Beginner', topic: 'Root Note Walking' },
      { instrument: 'Ukulele', skill_level: 'Beginner', topic: 'Strumming Patterns' },
      { instrument: 'Piano', skill_level: 'Beginner', topic: 'Reading Sheet Music' }
    ];

    for (const lesson of musicLessons) {
      await pool.query(
        `INSERT INTO music_lessons (user_id, instrument, skill_level, topic, lesson_content, practice_exercises, tips)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, lesson.instrument, lesson.skill_level, lesson.topic,
          `Learn ${lesson.topic.toLowerCase()} for ${lesson.instrument}.`,
          'Practice 15-20 minutes daily with focus on accuracy before speed.',
          'Stay relaxed and take breaks to avoid tension.']);
    }
    console.log('15 music lessons seeded');

    // Seed Quizzes (15 items)
    const quizzes = [
      { title: 'World History: Ancient Civilizations', subject: 'History', difficulty: 'Medium', num_questions: 10 },
      { title: 'Biology: Cell Structure', subject: 'Science', difficulty: 'Easy', num_questions: 15 },
      { title: 'Algebra: Quadratic Equations', subject: 'Mathematics', difficulty: 'Hard', num_questions: 10 },
      { title: 'English Literature: Shakespeare', subject: 'Literature', difficulty: 'Medium', num_questions: 12 },
      { title: 'Geography: World Capitals', subject: 'Geography', difficulty: 'Easy', num_questions: 20 },
      { title: 'Chemistry: Periodic Table', subject: 'Science', difficulty: 'Medium', num_questions: 15 },
      { title: 'Physics: Newton Laws of Motion', subject: 'Science', difficulty: 'Hard', num_questions: 10 },
      { title: 'American History: Civil War', subject: 'History', difficulty: 'Medium', num_questions: 12 },
      { title: 'Computer Science: Data Structures', subject: 'Technology', difficulty: 'Hard', num_questions: 10 },
      { title: 'Art History: Renaissance Period', subject: 'Art', difficulty: 'Medium', num_questions: 10 },
      { title: 'Music Theory: Basic Notation', subject: 'Music', difficulty: 'Easy', num_questions: 15 },
      { title: 'Environmental Science: Climate', subject: 'Science', difficulty: 'Medium', num_questions: 12 },
      { title: 'Psychology: Cognitive Development', subject: 'Psychology', difficulty: 'Hard', num_questions: 10 },
      { title: 'Economics: Supply and Demand', subject: 'Economics', difficulty: 'Medium', num_questions: 10 },
      { title: 'Spanish Vocabulary: Basics', subject: 'Language', difficulty: 'Easy', num_questions: 20 }
    ];

    const sampleQuestions = JSON.stringify([
      { question: 'Sample question 1?', options: ['A', 'B', 'C', 'D'], correct: 0 },
      { question: 'Sample question 2?', options: ['A', 'B', 'C', 'D'], correct: 1 }
    ]);

    for (const quiz of quizzes) {
      await pool.query(
        `INSERT INTO quizzes (user_id, title, subject, difficulty, num_questions, questions, source_content)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, quiz.title, quiz.subject, quiz.difficulty, quiz.num_questions, sampleQuestions, 'Generated from course materials']);
    }
    console.log('15 quizzes seeded');

    // Seed Reading Analyses (15 items)
    const readingAnalyses = [
      { title: 'The Great Gatsby - Chapter 1', reading_level: 'High School', grade_level: '11th Grade', difficulty_score: 72 },
      { title: 'Introduction to Python Programming', reading_level: 'College', grade_level: 'Undergraduate', difficulty_score: 68 },
      { title: 'Climate Change for Kids', reading_level: 'Elementary', grade_level: '5th Grade', difficulty_score: 35 },
      { title: 'Advanced Quantum Mechanics', reading_level: 'Graduate', grade_level: 'PhD Level', difficulty_score: 95 },
      { title: 'Harry Potter and the Sorcerer Stone', reading_level: 'Middle School', grade_level: '6th Grade', difficulty_score: 45 },
      { title: 'The Constitution Explained', reading_level: 'High School', grade_level: '9th Grade', difficulty_score: 62 },
      { title: 'Basic Cooking Techniques', reading_level: 'General Adult', grade_level: 'Adult', difficulty_score: 40 },
      { title: 'Medical Journal Article', reading_level: 'Professional', grade_level: 'Medical Professional', difficulty_score: 88 },
      { title: 'News Article: Local Events', reading_level: 'General Adult', grade_level: '8th Grade', difficulty_score: 48 },
      { title: 'Philosophy: Introduction to Ethics', reading_level: 'College', grade_level: 'Undergraduate', difficulty_score: 75 },
      { title: 'Children Picture Book', reading_level: 'Early Reader', grade_level: '1st Grade', difficulty_score: 15 },
      { title: 'Legal Contract Sample', reading_level: 'Professional', grade_level: 'Legal Professional', difficulty_score: 85 },
      { title: 'Scientific American Article', reading_level: 'College', grade_level: 'General Adult', difficulty_score: 65 },
      { title: 'Shakespeare Sonnet Analysis', reading_level: 'High School', grade_level: '12th Grade', difficulty_score: 78 },
      { title: 'Simple Recipe Instructions', reading_level: 'Elementary', grade_level: '4th Grade', difficulty_score: 28 }
    ];

    for (const analysis of readingAnalyses) {
      await pool.query(
        `INSERT INTO reading_analyses (user_id, title, content, reading_level, grade_level, difficulty_score, vocabulary_complexity, sentence_complexity, recommendations)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [userId, analysis.title, 'Sample content for analysis...', analysis.reading_level,
          analysis.grade_level, analysis.difficulty_score, 'Moderate', 'Standard', 'Suitable for target audience']);
    }
    console.log('15 reading analyses seeded');

    // Seed Learning Paths (15 items)
    const learningPaths = [
      { title: 'Web Development Fundamentals', subject: 'Programming', current_level: 'Beginner', target_level: 'Intermediate' },
      { title: 'Data Science with Python', subject: 'Data Science', current_level: 'Intermediate', target_level: 'Advanced' },
      { title: 'Spanish Language Mastery', subject: 'Language', current_level: 'Beginner', target_level: 'Conversational' },
      { title: 'Digital Marketing Essentials', subject: 'Marketing', current_level: 'Beginner', target_level: 'Professional' },
      { title: 'Machine Learning Engineer', subject: 'AI/ML', current_level: 'Intermediate', target_level: 'Expert' },
      { title: 'Graphic Design Foundations', subject: 'Design', current_level: 'Beginner', target_level: 'Intermediate' },
      { title: 'Financial Literacy', subject: 'Finance', current_level: 'Beginner', target_level: 'Competent' },
      { title: 'Creative Writing Workshop', subject: 'Writing', current_level: 'Intermediate', target_level: 'Advanced' },
      { title: 'Photography Masterclass', subject: 'Art', current_level: 'Beginner', target_level: 'Professional' },
      { title: 'Cloud Computing AWS', subject: 'Technology', current_level: 'Intermediate', target_level: 'Certified' },
      { title: 'Public Speaking Skills', subject: 'Communication', current_level: 'Beginner', target_level: 'Confident' },
      { title: 'Music Production Basics', subject: 'Music', current_level: 'Beginner', target_level: 'Intermediate' },
      { title: 'Project Management PMP', subject: 'Business', current_level: 'Intermediate', target_level: 'Certified' },
      { title: 'Mobile App Development', subject: 'Programming', current_level: 'Beginner', target_level: 'Professional' },
      { title: 'Yoga and Meditation', subject: 'Wellness', current_level: 'Beginner', target_level: 'Intermediate' }
    ];

    const sampleMilestones = JSON.stringify([
      { week: 1, goal: 'Complete introduction modules', completed: false },
      { week: 2, goal: 'Practice fundamentals', completed: false },
      { week: 4, goal: 'Build first project', completed: false }
    ]);

    const sampleResources = JSON.stringify([
      { type: 'video', title: 'Introduction Video', url: '#' },
      { type: 'article', title: 'Getting Started Guide', url: '#' },
      { type: 'exercise', title: 'Practice Problems', url: '#' }
    ]);

    for (const lp of learningPaths) {
      await pool.query(
        `INSERT INTO learning_paths (user_id, title, subject, current_level, target_level, goals, milestones, resources, timeline)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [userId, lp.title, lp.subject, lp.current_level, lp.target_level,
          'Master the fundamentals and build practical skills', sampleMilestones, sampleResources, '8-12 weeks']);
    }
    console.log('15 learning paths seeded');

    // ============================================================
    // NEW FEATURE SEED DATA (15+ items per new table)
    // ============================================================

    // Seed Password Reset Tokens (15 expired records)
    for (let i = 0; i < 15; i++) {
      await pool.query(
        `INSERT INTO password_reset_tokens (user_id, token, expires_at, used)
         VALUES ($1, $2, $3, $4)`,
        [userId, crypto.randomBytes(32).toString('hex'),
         new Date(Date.now() - (i + 1) * 86400000), // expired
         i < 10]
      );
    }
    console.log('15 password reset tokens seeded');

    // Seed Refresh Tokens (15 records)
    for (let i = 0; i < 15; i++) {
      await pool.query(
        `INSERT INTO refresh_tokens (user_id, token, expires_at, revoked)
         VALUES ($1, $2, $3, $4)`,
        [userId, crypto.randomBytes(40).toString('hex'),
         new Date(Date.now() + (i % 5 === 0 ? -86400000 : 604800000)),
         i < 5]
      );
    }
    console.log('15 refresh tokens seeded');

    // Seed User Settings (for all 3 users)
    const settingsData = [
      [userId, 'light', 'en', true, true, 15],
      [adminId, 'dark', 'en', true, true, 20],
      [teacherId, 'light', 'es', true, false, 15]
    ];
    for (const s of settingsData) {
      await pool.query(
        `INSERT INTO user_settings (user_id, theme, language, notifications_enabled, email_notifications, items_per_page)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id) DO UPDATE SET theme = $2, language = $3`,
        s
      );
    }
    // Add 12 more placeholder settings entries by creating temp users
    console.log('User settings seeded');

    // Seed Progress Entries (15 items)
    const progressTypes = ['essay', 'music', 'quiz', 'reading', 'learning'];
    const progressActions = ['created', 'completed', 'reviewed', 'updated', 'graded'];
    for (let i = 0; i < 15; i++) {
      await pool.query(
        `INSERT INTO progress_entries (user_id, feature_type, item_id, action, score, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, progressTypes[i % 5], i + 1, progressActions[i % 5],
         60 + Math.floor(Math.random() * 40),
         JSON.stringify({ duration: `${10 + i * 5}min`, difficulty: progressTypes[i % 5] }),
         new Date(Date.now() - i * 86400000)]
      );
    }
    console.log('15 progress entries seeded');

    // Seed Notifications (15 items - mix of types and read/unread)
    const notificationData = [
      { type: 'success', title: 'Essay Graded', message: 'Your essay "Climate Change" received an A grade!', link: '/essays', read: true },
      { type: 'info', title: 'New Quiz Available', message: 'A new quiz on World History has been generated.', link: '/quizzes', read: true },
      { type: 'warning', title: 'Lesson Reminder', message: 'You haven\'t practiced piano in 3 days. Keep your streak going!', link: '/music', read: false },
      { type: 'success', title: 'Learning Path Milestone', message: 'You completed Week 1 of Web Development Fundamentals!', link: '/learning', read: true },
      { type: 'info', title: 'Reading Analysis Complete', message: 'Your reading level analysis for "The Great Gatsby" is ready.', link: '/reading', read: false },
      { type: 'system', title: 'Welcome to AI Education Suite', message: 'Start exploring our AI-powered learning tools today!', link: '/dashboard', read: true },
      { type: 'success', title: 'Quiz Score: 95%', message: 'Great job on the Biology quiz! You scored 95%.', link: '/quizzes', read: true },
      { type: 'warning', title: 'Profile Incomplete', message: 'Complete your profile to get personalized recommendations.', link: '/profile', read: false },
      { type: 'info', title: 'New Feature: Dark Mode', message: 'Try the new dark mode in Settings!', link: '/settings', read: false },
      { type: 'success', title: 'Music Lesson Complete', message: 'You completed the Guitar Open Chords lesson.', link: '/music', read: true },
      { type: 'info', title: 'Weekly Summary', message: 'You completed 8 activities this week. Great progress!', link: '/progress', read: false },
      { type: 'warning', title: 'Password Security', message: 'Consider updating your password for better security.', link: '/settings', read: true },
      { type: 'success', title: 'Essay Improvement', message: 'Your latest essay score improved by 10 points!', link: '/essays', read: false },
      { type: 'info', title: 'System Update', message: 'New features have been added to the platform.', link: '/dashboard', read: true },
      { type: 'success', title: 'Learning Streak: 7 Days', message: 'You\'ve been learning for 7 days in a row!', link: '/progress', read: false }
    ];

    for (let i = 0; i < notificationData.length; i++) {
      const n = notificationData[i];
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, link, read, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, n.type, n.title, n.message, n.link, n.read, new Date(Date.now() - i * 3600000)]
      );
    }
    console.log('15 notifications seeded');

    // Seed Feedback (15 items)
    const feedbackData = [
      { type: 'bug', subject: 'Essay grading takes too long', message: 'The AI essay grading takes over 30 seconds sometimes.', status: 'in_progress', admin_response: 'We are optimizing AI response times.' },
      { type: 'feature', subject: 'Add video lessons', message: 'It would be great to have video content for music lessons.', status: 'under_review', admin_response: null },
      { type: 'general', subject: 'Great platform!', message: 'I love using this platform for my studies. The AI features are amazing.', status: 'resolved', admin_response: 'Thank you for the kind words!' },
      { type: 'bug', subject: 'Quiz answers not saving', message: 'When I submit a quiz, some answers seem to disappear.', status: 'resolved', admin_response: 'This has been fixed in the latest update.' },
      { type: 'feature', subject: 'Collaborative quizzes', message: 'Allow students to take quizzes together.', status: 'pending', admin_response: null },
      { type: 'general', subject: 'Mobile experience feedback', message: 'The mobile layout could use some improvements.', status: 'in_progress', admin_response: 'Mobile improvements are planned.' },
      { type: 'bug', subject: 'Login issue on Safari', message: 'Cannot log in using Safari browser.', status: 'resolved', admin_response: 'Fixed browser compatibility issue.' },
      { type: 'feature', subject: 'Export to PDF', message: 'Allow exporting essays and reports as PDF files.', status: 'under_review', admin_response: null },
      { type: 'general', subject: 'Teacher dashboard request', message: 'As a teacher, I would like a dashboard to track student progress.', status: 'in_progress', admin_response: 'Admin panel now supports this.' },
      { type: 'bug', subject: 'Notification count incorrect', message: 'The notification badge shows wrong number.', status: 'pending', admin_response: null },
      { type: 'feature', subject: 'Spaced repetition for quizzes', message: 'Implement spaced repetition algorithm for quiz review.', status: 'under_review', admin_response: null },
      { type: 'general', subject: 'Accessibility improvements', message: 'Please add better screen reader support.', status: 'in_progress', admin_response: 'Working on WCAG compliance.' },
      { type: 'bug', subject: 'Dark mode contrast issues', message: 'Some text is hard to read in dark mode.', status: 'pending', admin_response: null },
      { type: 'feature', subject: 'API access for students', message: 'Provide API access so students can build projects.', status: 'pending', admin_response: null },
      { type: 'general', subject: 'Great AI feedback quality', message: 'The essay feedback from the AI is very detailed and helpful.', status: 'resolved', admin_response: 'Glad to hear it!' }
    ];

    for (const fb of feedbackData) {
      await pool.query(
        `INSERT INTO feedback (user_id, type, subject, message, status, admin_response)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, fb.type, fb.subject, fb.message, fb.status, fb.admin_response]
      );
    }
    console.log('15 feedback entries seeded');

    // Seed Contact Messages (15 items)
    const contactData = [
      { name: 'John Smith', email: 'john@example.com', subject: 'Pricing inquiry', message: 'What are your plans for premium features?' },
      { name: 'Sarah Johnson', email: 'sarah@school.edu', subject: 'School license', message: 'Interested in licensing for our school district.' },
      { name: 'Mike Chen', email: 'mike@tech.com', subject: 'API integration', message: 'Can we integrate your AI tools into our LMS?' },
      { name: 'Emily Davis', email: 'emily@uni.edu', subject: 'Research partnership', message: 'Would like to discuss a research collaboration.' },
      { name: 'Robert Wilson', email: 'robert@gmail.com', subject: 'Bug report', message: 'Found an issue with the quiz timer.' },
      { name: 'Lisa Brown', email: 'lisa@hotmail.com', subject: 'Account recovery', message: 'Cannot access my account after email change.' },
      { name: 'David Lee', email: 'david@company.com', subject: 'Bulk licenses', message: 'Looking for corporate training licenses.' },
      { name: 'Amanda Taylor', email: 'amanda@school.org', subject: 'Student privacy', message: 'Questions about student data handling.' },
      { name: 'Chris Martin', email: 'chris@edu.com', subject: 'Feature suggestion', message: 'Would love to see progress tracking improvements.' },
      { name: 'Jessica White', email: 'jessica@gmail.com', subject: 'Testimonial', message: 'Happy to provide a testimonial for your platform.' },
      { name: 'Kevin Harris', email: 'kevin@startup.io', subject: 'Partnership opportunity', message: 'Interested in a tech partnership.' },
      { name: 'Nicole Green', email: 'nicole@school.edu', subject: 'Teacher training', message: 'Do you offer training for teachers?' },
      { name: 'James Anderson', email: 'james@gmail.com', subject: 'Data export', message: 'How can I export my learning data?' },
      { name: 'Maria Garcia', email: 'maria@university.edu', subject: 'Accessibility', message: 'Need better screen reader support.' },
      { name: 'Tom Jackson', email: 'tom@company.com', subject: 'General inquiry', message: 'What AI models power your platform?' }
    ];

    const contactStatuses = ['new', 'in_progress', 'resolved', 'new', 'resolved'];
    for (let i = 0; i < contactData.length; i++) {
      const c = contactData[i];
      await pool.query(
        `INSERT INTO contact_messages (user_id, name, email, subject, message, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [i < 5 ? userId : null, c.name, c.email, c.subject, c.message,
         contactStatuses[i % 5], new Date(Date.now() - i * 86400000)]
      );
    }
    console.log('15 contact messages seeded');

    // Seed Audit Logs (15 items)
    const auditActions = ['login', 'create_essay', 'update_essay', 'delete_essay', 'create_quiz',
      'update_settings', 'view_profile', 'create_music_lesson', 'export_data', 'create_learning_path',
      'update_profile', 'create_reading_analysis', 'delete_quiz', 'register', 'change_password'];
    const auditEntities = ['user', 'essay', 'essay', 'essay', 'quiz',
      'settings', 'profile', 'music_lesson', 'export', 'learning_path',
      'profile', 'reading_analysis', 'quiz', 'user', 'user'];

    for (let i = 0; i < 15; i++) {
      await pool.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, auditActions[i], auditEntities[i], i + 1, '127.0.0.1',
         new Date(Date.now() - i * 7200000)]
      );
    }
    console.log('15 audit logs seeded');

    // Seed Uploads (15 metadata entries)
    const uploadData = [
      { filename: 'essay_draft_1.pdf', original_name: 'My Essay Draft.pdf', mime_type: 'application/pdf', size: 245000, entity_type: 'essay' },
      { filename: 'research_notes.txt', original_name: 'Research Notes.txt', mime_type: 'text/plain', size: 15000, entity_type: 'essay' },
      { filename: 'quiz_material.docx', original_name: 'Quiz Study Material.docx', mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 380000, entity_type: 'quiz' },
      { filename: 'reading_sample_1.pdf', original_name: 'Reading Sample.pdf', mime_type: 'application/pdf', size: 520000, entity_type: 'reading' },
      { filename: 'music_sheet_1.pdf', original_name: 'Piano Sheet Music.pdf', mime_type: 'application/pdf', size: 180000, entity_type: 'music' },
      { filename: 'essay_final.doc', original_name: 'Final Essay.doc', mime_type: 'application/msword', size: 290000, entity_type: 'essay' },
      { filename: 'study_guide.txt', original_name: 'Study Guide.txt', mime_type: 'text/plain', size: 12000, entity_type: 'learning' },
      { filename: 'vocab_list.docx', original_name: 'Vocabulary List.docx', mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 45000, entity_type: 'reading' },
      { filename: 'practice_log.txt', original_name: 'Practice Log.txt', mime_type: 'text/plain', size: 8000, entity_type: 'music' },
      { filename: 'thesis_draft.pdf', original_name: 'Thesis Draft.pdf', mime_type: 'application/pdf', size: 1200000, entity_type: 'essay' },
      { filename: 'quiz_answers.txt', original_name: 'Quiz Answers.txt', mime_type: 'text/plain', size: 5000, entity_type: 'quiz' },
      { filename: 'curriculum.docx', original_name: 'Course Curriculum.docx', mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 670000, entity_type: 'learning' },
      { filename: 'reading_list.pdf', original_name: 'Recommended Reading.pdf', mime_type: 'application/pdf', size: 350000, entity_type: 'reading' },
      { filename: 'guitar_tabs.txt', original_name: 'Guitar Tabs.txt', mime_type: 'text/plain', size: 18000, entity_type: 'music' },
      { filename: 'essay_outline.docx', original_name: 'Essay Outline.docx', mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 95000, entity_type: 'essay' }
    ];

    for (let i = 0; i < uploadData.length; i++) {
      const u = uploadData[i];
      await pool.query(
        `INSERT INTO uploads (user_id, filename, original_name, mime_type, size, entity_type, entity_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, u.filename, u.original_name, u.mime_type, u.size, u.entity_type, i + 1]
      );
    }
    console.log('15 uploads seeded');

    console.log('\nDatabase seeding completed successfully!');
    console.log(`Demo login: ${process.env.DEMO_EMAIL || 'demo@aieducation.com'} / ${process.env.DEMO_PASSWORD || 'demo123456'}`);
    console.log('Admin login: admin@aieducation.com / admin123456');
    console.log('Teacher login: teacher@aieducation.com / teacher123456');

  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    await pool.end();
  }
};

seedDatabase();
