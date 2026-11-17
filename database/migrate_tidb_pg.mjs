import pg from 'pg'
const { Client } = pg

const config = {
  host: process.env.DB_HOST || '1m3ur6d1ukkdkt94.gateway01.us-east-1.prod.aws.pg.tidbcloud.com',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || '1m3ur6d1ukkdkt94.postgres',
  password: process.env.DB_PASSWORD || 'OI9j3fqXI41kT2ciiCLd9fm1Du2dHKwR',
  database: process.env.DB_NAME || 'exam',
  ssl: { rejectUnauthorized: false }
}

async function migrate() {
  const client = new Client(config)
  await client.connect()
  console.log('Connected to TiDB Cloud PostgreSQL gateway successfully!')

  console.log('Creating tables...')

  const queries = [
    // 1. Roles
    `CREATE TABLE IF NOT EXISTS roles (
      id BIGSERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description VARCHAR(255),
      CONSTRAINT uq_roles_name UNIQUE (name)
    )`,

    // 2. Admin Users
    `CREATE TABLE IF NOT EXISTS admin_users (
      id BIGSERIAL PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      status VARCHAR(50) DEFAULT 'active',
      last_login_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL,
      CONSTRAINT uq_admin_email UNIQUE (email)
    )`,

    // 3. Admin Role Map
    `CREATE TABLE IF NOT EXISTS admin_role_map (
      admin_id BIGINT NOT NULL,
      role_id BIGINT NOT NULL,
      PRIMARY KEY (admin_id, role_id)
    )`,

    // 4. Admin Activity Logs
    `CREATE TABLE IF NOT EXISTS admin_activity_logs (
      id BIGSERIAL PRIMARY KEY,
      admin_id BIGINT NOT NULL,
      action VARCHAR(150) NOT NULL,
      entity_type VARCHAR(100),
      entity_id BIGINT NULL,
      details TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // 5. Students
    `CREATE TABLE IF NOT EXISTS students (
      id BIGSERIAL PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      username VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL,
      mobile VARCHAR(20) NULL,
      profile_photo VARCHAR(1000),
      date_of_birth DATE NULL,
      gender VARCHAR(50) NULL,
      state VARCHAR(100),
      district VARCHAR(100),
      account_status VARCHAR(50) DEFAULT 'active',
      email_verified_at TIMESTAMP NULL,
      mobile_verified_at TIMESTAMP NULL,
      last_login_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL,
      CONSTRAINT uq_student_username UNIQUE (username),
      CONSTRAINT uq_student_email UNIQUE (email)
    )`,

    // 6. Student Credentials
    `CREATE TABLE IF NOT EXISTS student_credentials (
      student_id BIGINT PRIMARY KEY,
      password_hash VARCHAR(255) NOT NULL,
      password_changed_at TIMESTAMP NULL,
      failed_login_attempts INT DEFAULT 0,
      locked_until TIMESTAMP NULL
    )`,

    // 7. Student Preferences
    `CREATE TABLE IF NOT EXISTS student_preferences (
      student_id BIGINT PRIMARY KEY,
      language_code VARCHAR(10) DEFAULT 'hi',
      theme VARCHAR(20) DEFAULT 'system',
      notifications_enabled BOOLEAN DEFAULT TRUE,
      updated_at TIMESTAMP NULL
    )`,

    // 8. Exams
    `CREATE TABLE IF NOT EXISTS exams (
      id BIGSERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(100) NOT NULL,
      description TEXT,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL,
      CONSTRAINT uq_exams_code UNIQUE (code)
    )`,

    // 9. Subjects
    `CREATE TABLE IF NOT EXISTS subjects (
      id BIGSERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(100) NOT NULL,
      description TEXT,
      icon VARCHAR(100) DEFAULT 'book',
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL,
      CONSTRAINT uq_subjects_code UNIQUE (code)
    )`,

    // 10. Exam Subjects
    `CREATE TABLE IF NOT EXISTS exam_subjects (
      id BIGSERIAL PRIMARY KEY,
      exam_id BIGINT NOT NULL,
      subject_id BIGINT NOT NULL,
      order_index INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT uq_exam_subject UNIQUE (exam_id, subject_id)
    )`,

    // 11. Topics
    `CREATE TABLE IF NOT EXISTS topics (
      id BIGSERIAL PRIMARY KEY,
      subject_id BIGINT NOT NULL,
      parent_id BIGINT NULL,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL,
      code VARCHAR(100) NULL,
      description TEXT,
      priority VARCHAR(50) DEFAULT 'medium',
      level INT DEFAULT 1,
      order_index INT DEFAULT 0,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL,
      CONSTRAINT uq_subject_slug UNIQUE (subject_id, slug)
    )`,

    // 12. Questions
    `CREATE TABLE IF NOT EXISTS questions (
      id BIGSERIAL PRIMARY KEY,
      subject_id BIGINT NOT NULL,
      topic_id BIGINT NOT NULL,
      question_text TEXT NOT NULL,
      question_type VARCHAR(50) DEFAULT 'single_choice',
      difficulty VARCHAR(50) DEFAULT 'medium',
      status VARCHAR(50) DEFAULT 'pending',
      explanation TEXT,
      default_marks DECIMAL(7,2) DEFAULT 1.00,
      default_negative_marks DECIMAL(7,2) DEFAULT 0.25,
      language_code VARCHAR(10) DEFAULT 'hi',
      source VARCHAR(255) NULL,
      created_by BIGINT NULL,
      reviewed_by BIGINT NULL,
      reviewed_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL
    )`,

    // 13. Question Options
    `CREATE TABLE IF NOT EXISTS question_options (
      id BIGSERIAL PRIMARY KEY,
      question_id BIGINT NOT NULL,
      option_key VARCHAR(10) NOT NULL,
      option_text TEXT NOT NULL,
      is_correct SMALLINT DEFAULT 0,
      order_index INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT uq_question_option UNIQUE (question_id, option_key)
    )`,

    // 14. Question Tags
    `CREATE TABLE IF NOT EXISTS question_tags (
      id BIGSERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT uq_question_tags_name UNIQUE (name)
    )`,

    // 15. Question Tag Map
    `CREATE TABLE IF NOT EXISTS question_tag_map (
      question_id BIGINT NOT NULL,
      tag_id BIGINT NOT NULL,
      PRIMARY KEY (question_id, tag_id)
    )`,

    // 16. Assessments
    `CREATE TABLE IF NOT EXISTS assessments (
      id BIGSERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL,
      description TEXT,
      exam_id BIGINT NULL,
      subject_id BIGINT NULL,
      topic_id BIGINT NULL,
      assessment_type VARCHAR(50) NOT NULL,
      duration_minutes INT NOT NULL DEFAULT 60,
      total_questions INT DEFAULT 0,
      total_marks DECIMAL(8,2) DEFAULT 100.00,
      passing_percentage DECIMAL(5,2) DEFAULT 40.00,
      shuffle_questions BOOLEAN DEFAULT FALSE,
      shuffle_options BOOLEAN DEFAULT FALSE,
      allow_retake BOOLEAN DEFAULT TRUE,
      show_result_immediately BOOLEAN DEFAULT TRUE,
      show_correct_answers BOOLEAN DEFAULT TRUE,
      start_at TIMESTAMP NULL,
      end_at TIMESTAMP NULL,
      max_attempts INT NULL,
      status VARCHAR(50) DEFAULT 'draft',
      created_by BIGINT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL,
      CONSTRAINT uq_assessments_slug UNIQUE (slug)
    )`,

    // 17. Assessment Sections
    `CREATE TABLE IF NOT EXISTS assessment_sections (
      id BIGSERIAL PRIMARY KEY,
      assessment_id BIGINT NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      duration_minutes INT NULL,
      total_questions INT DEFAULT 0,
      total_marks DECIMAL(8,2) DEFAULT 0.00,
      order_index INT DEFAULT 0
    )`,

    // 18. Assessment Questions
    `CREATE TABLE IF NOT EXISTS assessment_questions (
      id BIGSERIAL PRIMARY KEY,
      assessment_id BIGINT NOT NULL,
      section_id BIGINT NULL,
      question_id BIGINT NOT NULL,
      order_index INT DEFAULT 0,
      marks DECIMAL(7,2) NOT NULL DEFAULT 1.00,
      negative_marks DECIMAL(7,2) NOT NULL DEFAULT 0.25,
      CONSTRAINT uq_assessment_question UNIQUE (assessment_id, question_id)
    )`,

    // 19. Assessment Attempts
    `CREATE TABLE IF NOT EXISTS assessment_attempts (
      id BIGSERIAL PRIMARY KEY,
      student_id BIGINT NOT NULL,
      assessment_id BIGINT NOT NULL,
      attempt_number INT NOT NULL DEFAULT 1,
      status VARCHAR(50) DEFAULT 'in_progress',
      start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      end_time TIMESTAMP NULL,
      submission_time TIMESTAMP NULL,
      total_questions INT DEFAULT 0,
      attempted_questions INT DEFAULT 0,
      correct_answers INT DEFAULT 0,
      incorrect_answers INT DEFAULT 0,
      unanswered_questions INT DEFAULT 0,
      obtained_marks DECIMAL(8,2) DEFAULT 0.00,
      total_marks DECIMAL(8,2) DEFAULT 0.00,
      percentage DECIMAL(6,2) DEFAULT 0.00,
      accuracy DECIMAL(6,2) DEFAULT 0.00,
      time_taken_seconds INT DEFAULT 0,
      passed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP NULL,
      updated_at TIMESTAMP NULL,
      CONSTRAINT uq_student_attempt UNIQUE (student_id, assessment_id, attempt_number)
    )`,

    // 20. Assessment Attempt Questions
    `CREATE TABLE IF NOT EXISTS assessment_attempt_questions (
      id BIGSERIAL PRIMARY KEY,
      attempt_id BIGINT NOT NULL,
      question_id BIGINT NOT NULL,
      question_version INT NOT NULL DEFAULT 1,
      order_index INT NOT NULL,
      marks DECIMAL(7,2) NOT NULL,
      negative_marks DECIMAL(7,2) NOT NULL,
      question_snapshot TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT uq_attempt_question UNIQUE (attempt_id, question_id),
      CONSTRAINT uq_attempt_order UNIQUE (attempt_id, order_index)
    )`,

    // 21. Attempt Answers
    `CREATE TABLE IF NOT EXISTS attempt_answers (
      id BIGSERIAL PRIMARY KEY,
      attempt_id BIGINT NOT NULL,
      attempt_question_id BIGINT NOT NULL,
      answer_status VARCHAR(50) DEFAULT 'unanswered',
      selected_option_key VARCHAR(10) NULL,
      is_correct SMALLINT NULL,
      marks_awarded DECIMAL(7,2) DEFAULT 0.00,
      time_spent_seconds INT DEFAULT 0,
      first_answered_at TIMESTAMP NULL,
      last_answered_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL,
      CONSTRAINT uq_attempt_answer UNIQUE (attempt_id, attempt_question_id)
    )`,

    // 22. Attempt Results
    `CREATE TABLE IF NOT EXISTS attempt_results (
      id BIGSERIAL PRIMARY KEY,
      attempt_id BIGINT NOT NULL,
      total_questions INT NOT NULL,
      attempted_questions INT NOT NULL,
      correct_answers INT NOT NULL,
      incorrect_answers INT NOT NULL,
      unanswered_questions INT NOT NULL,
      positive_marks DECIMAL(8,2) DEFAULT 0.00,
      negative_marks DECIMAL(8,2) DEFAULT 0.00,
      obtained_marks DECIMAL(8,2) DEFAULT 0.00,
      total_marks DECIMAL(8,2) DEFAULT 0.00,
      percentage DECIMAL(6,2) DEFAULT 0.00,
      accuracy DECIMAL(6,2) DEFAULT 0.00,
      passed BOOLEAN DEFAULT FALSE,
      calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT uq_attempt_result UNIQUE (attempt_id)
    )`,

    // 23. Student Question Reports
    `CREATE TABLE IF NOT EXISTS student_question_reports (
      id BIGSERIAL PRIMARY KEY,
      student_id BIGINT NOT NULL,
      question_id BIGINT NOT NULL,
      report_type VARCHAR(100) NOT NULL,
      description TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      reviewed_by BIGINT NULL,
      reviewed_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // 24. Student Bookmarks
    `CREATE TABLE IF NOT EXISTS student_bookmarks (
      id BIGSERIAL PRIMARY KEY,
      student_id BIGINT NOT NULL,
      question_id BIGINT NOT NULL,
      note TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT uq_student_bookmark UNIQUE (student_id, question_id)
    )`,

    // 25. System Settings
    `CREATE TABLE IF NOT EXISTS system_settings (
      setting_key VARCHAR(100) PRIMARY KEY,
      setting_value TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  ]

  for (const q of queries) {
    try {
      await client.query(q)
    } catch (err) {
      console.error('Error running DDL query:', q.split('\n')[0], err.message)
      throw err
    }
  }

  console.log('✓ All 24 tables verified/created successfully!')

  // Check if roles need seeding
  const { rows: roleRows } = await client.query('SELECT COUNT(*) as count FROM roles')
  if (parseInt(roleRows[0].count) === 0) {
    console.log('Seeding initial roles...')
    const roles = [
      [1, 'super_admin', 'Complete system access'],
      [2, 'admin', 'Administrative access'],
      [3, 'question_manager', 'Manage question bank'],
      [4, 'exam_manager', 'Manage exams and assessments'],
      [5, 'moderator', 'Review questions and reports']
    ]
    for (const r of roles) {
      await client.query('INSERT INTO roles (id, name, description) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', r)
    }
  }

  // Check if admin user exists
  const { rows: adminRows } = await client.query('SELECT COUNT(*) as count FROM admin_users')
  if (parseInt(adminRows[0].count) === 0) {
    console.log('Seeding initial admin user Puneet...')
    await client.query(`
      INSERT INTO admin_users (id, full_name, email, password_hash, status, created_at)
      VALUES (1, 'Admin Puneet', 'admin@examforge.in', '$2a$10$e8V95yQx8zY8R1m2/q7L4O5a0b7n8p9q', 'active', NOW())
      ON CONFLICT DO NOTHING
    `)
    await client.query('INSERT INTO admin_role_map (admin_id, role_id) VALUES (1, 1) ON CONFLICT DO NOTHING')
  }

  // Check if student exists
  const { rows: studentRows } = await client.query('SELECT COUNT(*) as count FROM students')
  if (parseInt(studentRows[0].count) === 0) {
    console.log('Seeding initial student Puneet...')
    await client.query(`
      INSERT INTO students (id, full_name, username, email, mobile, state, district, account_status, created_at)
      VALUES (1, 'Puneet', 'puneet', 'puneet@examforge.in', '9876543210', 'Rajasthan', 'Jaipur', 'active', NOW())
      ON CONFLICT DO NOTHING
    `)
  }

  // Check if exam exists
  const { rows: examRows } = await client.query('SELECT COUNT(*) as count FROM exams')
  if (parseInt(examRows[0].count) === 0) {
    console.log('Seeding Rajasthan Informatics Assistant Exam...')
    await client.query(`
      INSERT INTO exams (id, name, code, description, status, created_at)
      VALUES (1, 'Rajasthan Informatics Assistant (सूचना सहायक)', 'RAJ_IA_2026', 'RSMSSB Informatics Assistant Examination', 'active', NOW())
      ON CONFLICT DO NOTHING
    `)
  }

  // Check if subjects exist
  const { rows: subRows } = await client.query('SELECT COUNT(*) as count FROM subjects')
  if (parseInt(subRows[0].count) === 0) {
    console.log('Seeding official subjects...')
    const subjects = [
      [1, 'Computer & Information Technology', 'CIT', 'Computer Fundamentals, Hardware, Software, Networking, Internet, DBMS, MS Office'],
      [2, 'Reasoning & Mental Ability', 'RMA', 'Blood Relation, Coding-Decoding, Series, Direction, Analogy, Ranking, Puzzle'],
      [3, 'Mathematics', 'MATH', 'Percentage, Profit-Loss, Average, Ratio, Time & Work, SI-CI'],
      [4, 'General Knowledge (GK)', 'GK', 'Rajasthan GK, India GK, History, Geography, Polity, Current Affairs, General Science'],
      [5, 'General Science', 'GEN_SCIENCE', 'Physics, Chemistry, Life Sciences and Everyday Science concepts'],
      [6, 'Hindi Language', 'HINDI', 'General Hindi grammar, vocabulary, idioms and comprehension for Rajasthan exams'],
      [7, 'English Language', 'ENGLISH', 'English grammar, vocabulary, error spotting and sentence rearrangement']
    ]

    for (const s of subjects) {
      await client.query(
        'INSERT INTO subjects (id, name, code, description, icon, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW()) ON CONFLICT DO NOTHING',
        [s[0], s[1], s[2], s[3], 'book', 'active']
      )
      await client.query(
        'INSERT INTO exam_subjects (exam_id, subject_id) VALUES (1, $1) ON CONFLICT DO NOTHING',
        [s[0]]
      )
    }
  }

  // Check if topics exist
  const { rows: topicRows } = await client.query('SELECT COUNT(*) as count FROM topics')
  if (parseInt(topicRows[0].count) === 0) {
    console.log('Seeding official topics...')
    const topics = [
      // Subject 1: CIT
      [101, 1, 'Computer Fundamentals', 'computer-fundamentals', 'high', 1],
      [102, 1, 'Hardware', 'hardware', 'medium', 2],
      [103, 1, 'Software', 'software', 'medium', 3],
      [104, 1, 'Networking', 'networking', 'high', 4],
      [105, 1, 'Internet', 'internet', 'high', 5],
      [106, 1, 'DBMS', 'dbms', 'high', 6],
      [107, 1, 'MS Office', 'ms-office', 'high', 7],

      // Subject 2: RMA
      [201, 2, 'Blood Relation', 'blood-relation', 'high', 1],
      [202, 2, 'Coding-Decoding', 'coding-decoding', 'high', 2],
      [203, 2, 'Series', 'series', 'high', 3],
      [204, 2, 'Direction', 'direction', 'medium', 4],
      [205, 2, 'Analogy', 'analogy', 'medium', 5],
      [206, 2, 'Ranking', 'ranking', 'medium', 6],
      [207, 2, 'Puzzle', 'puzzle', 'high', 7],

      // Subject 3: MATH
      [301, 3, 'Percentage', 'percentage', 'high', 1],
      [302, 3, 'Profit-Loss', 'profit-loss', 'high', 2],
      [303, 3, 'Average', 'average', 'medium', 3],
      [304, 3, 'Ratio', 'ratio', 'medium', 4],
      [305, 3, 'Time & Work', 'time-and-work', 'high', 5],
      [306, 3, 'SI-CI', 'si-ci', 'high', 6],

      // Subject 4: GK
      [401, 4, 'Rajasthan GK', 'rajasthan-gk', 'high', 1],
      [402, 4, 'India GK', 'india-gk', 'medium', 2],
      [403, 4, 'History', 'history', 'medium', 3],
      [404, 4, 'Geography', 'geography', 'high', 4],
      [405, 4, 'Polity', 'polity', 'medium', 5],
      [406, 4, 'Current Affairs', 'current-affairs', 'high', 6],
      [407, 4, 'General Science', 'general-science', 'medium', 7]
    ]

    for (const t of topics) {
      await client.query(
        'INSERT INTO topics (id, subject_id, name, slug, priority, order_index, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) ON CONFLICT DO NOTHING',
        [t[0], t[1], t[2], t[3], t[4], t[5], 'active']
      )
    }
  }

  // Check if questions exist
  const { rows: qRows } = await client.query('SELECT COUNT(*) as count FROM questions')
  if (parseInt(qRows[0].count) === 0) {
    console.log('Seeding official questions (Hindi & English)...')
    const questions = [
      {
        id: 1,
        subject_id: 1,
        topic_id: 106,
        question_text: 'Which normal form is based on the concept of "Full Functional Dependency"?',
        difficulty: 'medium',
        language_code: 'en',
        explanation: 'Second Normal Form (2NF) requires that the relation must be in 1NF and no non-prime attribute is partially dependent on any candidate key of a table (Full Functional Dependency).',
        options: [
          ['A', 'First Normal Form (1NF)', false],
          ['B', 'Second Normal Form (2NF)', true],
          ['C', 'Third Normal Form (3NF)', false],
          ['D', 'Boyce-Codd Normal Form (BCNF)', false],
        ],
      },
      {
        id: 2,
        subject_id: 1,
        topic_id: 104,
        question_text: 'IPv4 एड्रेस का आकार (Size) कितना होता है?',
        difficulty: 'easy',
        language_code: 'hi',
        explanation: 'IPv4 एड्रेस 32 बिट्स (4 बाइट्स) का होता है, जबकि IPv6 एड्रेस 128 बिट्स (16 बाइट्स) का होता है।',
        options: [
          ['A', '16 बिट्स', false],
          ['B', '32 बिट्स', true],
          ['C', '64 बिट्स', false],
          ['D', '128 बिट्स', false],
        ],
      },
      {
        id: 3,
        subject_id: 2,
        topic_id: 201,
        question_text: 'एक लड़के की तस्वीर की ओर इशारा करते हुए सुरेश ने कहा, "वह मेरी माँ के इकलौते बेटे का बेटा है।" सुरेश का उस लड़के से क्या संबंध है?',
        difficulty: 'easy',
        language_code: 'hi',
        explanation: 'सुरेश की माँ का इकलौता बेटा खुद सुरेश है। इसलिए वह लड़का सुरेश का बेटा है, यानी सुरेश उसका पिता है।',
        options: [
          ['A', 'भाई', false],
          ['B', 'चाचा', false],
          ['C', 'पिता', true],
          ['D', 'दादा', false],
        ],
      },
      {
        id: 4,
        subject_id: 2,
        topic_id: 202,
        question_text: 'यदि किसी कूट भाषा में "COMPUTER" को "RFUVQNPC" लिखा जाता है, तो "MEDICINE" को उसी भाषा में क्या लिखा जाएगा?',
        difficulty: 'medium',
        language_code: 'hi',
        explanation: 'पहले और आखिरी अक्षर आपस में बदल जाते हैं और उल्टे क्रम में लिखे जाते हैं, तथा बीच के प्रत्येक अक्षर में +1 की वृद्धि होती है। अतः MEDICINE बन जाता है EOJDJEFM।',
        options: [
          ['A', 'EOJDJEFM', true],
          ['B', 'MFEDJJOE', false],
          ['C', 'EOJDEJFM', false],
          ['D', 'MFEJDJOE', false],
        ],
      },
      {
        id: 5,
        subject_id: 3,
        topic_id: 301,
        question_text: 'यदि बिजली के बिल में 20% की छूट दी जाती है, तब भी ₹100 का भुगतान करना बाकी है। मूल बिल राशि कितनी थी?',
        difficulty: 'easy',
        language_code: 'hi',
        explanation: 'छूट के बाद शेष प्रतिशत = 80%। यदि 80% = ₹100 है, तो कुल बिल = (100 × 100) / 80 = ₹125।',
        options: [
          ['A', '₹110', false],
          ['B', '₹120', false],
          ['C', '₹125', true],
          ['D', '₹130', false],
        ],
      },
      {
        id: 6,
        subject_id: 3,
        topic_id: 302,
        question_text: 'एक वस्तु को ₹1440 में बेचने पर एक व्यापारी को 20% का लाभ होता है। वस्तु का क्रय मूल्य (Cost Price) क्या है?',
        difficulty: 'easy',
        language_code: 'hi',
        explanation: 'क्रय मूल्य = (विक्रय मूल्य × 100) / (100 + लाभ%) = (1440 × 100) / 120 = ₹1200।',
        options: [
          ['A', '₹1100', false],
          ['B', '₹1200', true],
          ['C', '₹1250', false],
          ['D', '₹1300', false],
        ],
      },
      {
        id: 7,
        subject_id: 4,
        topic_id: 401,
        question_text: 'राजस्थान के जयपुर में प्रसिद्ध "हवा महल" का निर्माण किसने करवाया था?',
        difficulty: 'easy',
        language_code: 'hi',
        explanation: 'जयपुर में स्थित हवा महल का निर्माण 1799 ईस्वी में सवाई प्रताप सिंह ने करवाया था। इसके प्रमुख वास्तुकार लालचंद उस्ता थे। इसमें कुल 953 झरोखे हैं।',
        options: [
          ['A', 'सवाई जयसिंह', false],
          ['B', 'सवाई मानसिंह', false],
          ['C', 'सवाई प्रताप सिंह', true],
          ['D', 'राजा भारमल', false],
        ],
      },
      {
        id: 8,
        subject_id: 4,
        topic_id: 404,
        question_text: 'राजस्थान की किस नदी को "कामधेनु" एवं "चर्मण्वती" के नाम से जाना जाता है?',
        difficulty: 'easy',
        language_code: 'hi',
        explanation: 'चम्बल नदी को राजस्थान की कामधेनु और प्राचीन चर्मण्वती नदी कहा जाता है। यह राजस्थान की प्रमुख बारहमासी नदी है।',
        options: [
          ['A', 'बनास', false],
          ['B', 'चम्बल', true],
          ['C', 'लूनी', false],
          ['D', 'माही', false],
        ],
      },
    ]

    for (const q of questions) {
      await client.query(
        `INSERT INTO questions 
         (id, subject_id, topic_id, question_text, question_type, difficulty, status, explanation, default_marks, default_negative_marks, language_code, source, created_at)
         VALUES ($1, $2, $3, $4, 'single_choice', $5, 'approved', $6, 1.00, 0.25, $7, 'Rajasthan IA Official Bank', NOW())
         ON CONFLICT DO NOTHING`,
        [q.id, q.subject_id, q.topic_id, q.question_text, q.difficulty, q.explanation, q.language_code]
      )

      for (let i = 0; i < q.options.length; i++) {
        const opt = q.options[i]
        await client.query(
          `INSERT INTO question_options (question_id, option_key, option_text, is_correct, order_index)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT DO NOTHING`,
          [q.id, opt[0], opt[1], opt[2], i + 1]
        )
      }
    }
  }

  // Check if assessment exists
  const { rows: aRows } = await client.query('SELECT COUNT(*) as count FROM assessments')
  if (parseInt(aRows[0].count) === 0) {
    console.log('Seeding Practice Drill 01...')
    await client.query(`
      INSERT INTO assessments 
      (id, title, slug, description, exam_id, subject_id, topic_id, assessment_type, duration_minutes, total_questions, total_marks, passing_percentage, status, created_at)
      VALUES (1, 'Rajasthan Informatics Assistant (सूचना सहायक) Practice Drill 01', 'rajasthan-ia-drill-01', 'Official practice drill covering Computer & IT, Reasoning, Mathematics, and Rajasthan General Knowledge.', 1, NULL, NULL, 'mock', 30, 8, 8.00, 40.00, 'published', NOW())
      ON CONFLICT DO NOTHING
    `)

    for (let i = 1; i <= 8; i++) {
      await client.query(
        `INSERT INTO assessment_questions (assessment_id, section_id, question_id, order_index, marks, negative_marks)
         VALUES (1, NULL, $1, $2, 1.00, 0.25)
         ON CONFLICT DO NOTHING`,
        [i, i]
      )
    }
  }

  // Reset sequences so serial auto-increments start after the highest manual IDs
  const tablesWithSerial = ['roles', 'admin_users', 'students', 'exams', 'subjects', 'topics', 'questions', 'question_options', 'assessments', 'assessment_questions']
  for (const t of tablesWithSerial) {
    try {
      await client.query(`SELECT setval(pg_get_serial_sequence('${t}', 'id'), COALESCE(MAX(id), 1)) FROM ${t}`)
    } catch (e) {
      // Ignore if no sequence
    }
  }

  console.log('\n=============================================')
  console.log('✅ TiDB Cloud Database successfully migrated & seeded!')
  console.log('=============================================')

  const stats = await Promise.all([
    client.query('SELECT COUNT(*) as count FROM subjects'),
    client.query('SELECT COUNT(*) as count FROM topics'),
    client.query('SELECT COUNT(*) as count FROM questions'),
    client.query('SELECT COUNT(*) as count FROM question_options'),
    client.query('SELECT COUNT(*) as count FROM assessments')
  ])

  console.log(`Subjects: ${stats[0].rows[0].count}`)
  console.log(`Topics: ${stats[1].rows[0].count}`)
  console.log(`Questions: ${stats[2].rows[0].count}`)
  console.log(`Question Options: ${stats[3].rows[0].count}`)
  console.log(`Assessments: ${stats[4].rows[0].count}`)

  await client.end()
}

migrate().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
