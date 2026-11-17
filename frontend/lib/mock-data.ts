import { Subject, Topic, Question, PracticeTest } from './exam-types'

export const INITIAL_SUBJECTS: Subject[] = [
  {
    id: 1,
    name: 'Computer & Information Technology',
    code: 'CIT',
    description: 'Computer Fundamentals, Hardware, Software, Networking, Internet, DBMS, MS Office',
    icon: 'cpu',
    questionCount: 0,
    topicCount: 7,
    status: 'active',
    createdAt: '2026-02-01',
  },
  {
    id: 2,
    name: 'Reasoning & Mental Ability',
    code: 'RMA',
    description: 'Blood Relation, Coding-Decoding, Series, Direction, Analogy, Ranking, Puzzle',
    icon: 'brain',
    questionCount: 0,
    topicCount: 7,
    status: 'active',
    createdAt: '2026-02-01',
  },
  {
    id: 3,
    name: 'Mathematics',
    code: 'MATH',
    description: 'Percentage, Profit-Loss, Average, Ratio, Time & Work, SI-CI',
    icon: 'calculator',
    questionCount: 0,
    topicCount: 6,
    status: 'active',
    createdAt: '2026-02-01',
  },
  {
    id: 4,
    name: 'General Knowledge (GK)',
    code: 'GK',
    description: 'Rajasthan GK, India GK, History, Geography, Polity, Current Affairs, General Science',
    icon: 'globe',
    questionCount: 0,
    topicCount: 7,
    status: 'active',
    createdAt: '2026-02-01',
  },
]

export const INITIAL_TOPICS: Topic[] = [
  // Subject 1: CIT
  { id: 101, subjectId: 1, parentId: null, name: 'Computer Fundamentals', code: 'CIT-CF', priority: 'high', level: 1, orderIndex: 1, questionCount: 0 },
  { id: 102, subjectId: 1, parentId: null, name: 'Hardware', code: 'CIT-HW', priority: 'medium', level: 1, orderIndex: 2, questionCount: 0 },
  { id: 103, subjectId: 1, parentId: null, name: 'Software', code: 'CIT-SW', priority: 'medium', level: 1, orderIndex: 3, questionCount: 0 },
  { id: 104, subjectId: 1, parentId: null, name: 'Networking', code: 'CIT-NET', priority: 'high', level: 1, orderIndex: 4, questionCount: 0 },
  { id: 105, subjectId: 1, parentId: null, name: 'Internet', code: 'CIT-INT', priority: 'high', level: 1, orderIndex: 5, questionCount: 0 },
  { id: 106, subjectId: 1, parentId: null, name: 'DBMS', code: 'CIT-DBMS', priority: 'high', level: 1, orderIndex: 6, questionCount: 0 },
  { id: 107, subjectId: 1, parentId: null, name: 'MS Office', code: 'CIT-MSO', priority: 'high', level: 1, orderIndex: 7, questionCount: 0 },

  // Subject 2: RMA
  { id: 201, subjectId: 2, parentId: null, name: 'Blood Relation', code: 'RMA-BR', priority: 'high', level: 1, orderIndex: 1, questionCount: 0 },
  { id: 202, subjectId: 2, parentId: null, name: 'Coding-Decoding', code: 'RMA-CD', priority: 'high', level: 1, orderIndex: 2, questionCount: 0 },
  { id: 203, subjectId: 2, parentId: null, name: 'Series', code: 'RMA-SER', priority: 'high', level: 1, orderIndex: 3, questionCount: 0 },
  { id: 204, subjectId: 2, parentId: null, name: 'Direction', code: 'RMA-DIR', priority: 'medium', level: 1, orderIndex: 4, questionCount: 0 },
  { id: 205, subjectId: 2, parentId: null, name: 'Analogy', code: 'RMA-ANA', priority: 'medium', level: 1, orderIndex: 5, questionCount: 0 },
  { id: 206, subjectId: 2, parentId: null, name: 'Ranking', code: 'RMA-RNK', priority: 'medium', level: 1, orderIndex: 6, questionCount: 0 },
  { id: 207, subjectId: 2, parentId: null, name: 'Puzzle', code: 'RMA-PUZ', priority: 'high', level: 1, orderIndex: 7, questionCount: 0 },

  // Subject 3: MATH
  { id: 301, subjectId: 3, parentId: null, name: 'Percentage', code: 'MTH-PCT', priority: 'high', level: 1, orderIndex: 1, questionCount: 0 },
  { id: 302, subjectId: 3, parentId: null, name: 'Profit-Loss', code: 'MTH-PL', priority: 'high', level: 1, orderIndex: 2, questionCount: 0 },
  { id: 303, subjectId: 3, parentId: null, name: 'Average', code: 'MTH-AVG', priority: 'medium', level: 1, orderIndex: 3, questionCount: 0 },
  { id: 304, subjectId: 3, parentId: null, name: 'Ratio', code: 'MTH-RAT', priority: 'high', level: 1, orderIndex: 4, questionCount: 0 },
  { id: 305, subjectId: 3, parentId: null, name: 'Time & Work', code: 'MTH-TW', priority: 'high', level: 1, orderIndex: 5, questionCount: 0 },
  { id: 306, subjectId: 3, parentId: null, name: 'SI-CI', code: 'MTH-SICI', priority: 'medium', level: 1, orderIndex: 6, questionCount: 0 },

  // Subject 4: GK
  { id: 401, subjectId: 4, parentId: null, name: 'Rajasthan GK', code: 'GK-RAJ', priority: 'high', level: 1, orderIndex: 1, questionCount: 0 },
  { id: 402, subjectId: 4, parentId: null, name: 'India GK', code: 'GK-IND', priority: 'high', level: 1, orderIndex: 2, questionCount: 0 },
  { id: 403, subjectId: 4, parentId: null, name: 'History', code: 'GK-HIS', priority: 'medium', level: 1, orderIndex: 3, questionCount: 0 },
  { id: 404, subjectId: 4, parentId: null, name: 'Geography', code: 'GK-GEO', priority: 'high', level: 1, orderIndex: 4, questionCount: 0 },
  { id: 405, subjectId: 4, parentId: null, name: 'Polity', code: 'GK-POL', priority: 'medium', level: 1, orderIndex: 5, questionCount: 0 },
  { id: 406, subjectId: 4, parentId: null, name: 'Current Affairs', code: 'GK-CA', priority: 'high', level: 1, orderIndex: 6, questionCount: 0 },
  { id: 407, subjectId: 4, parentId: null, name: 'General Science', code: 'GK-GS', priority: 'medium', level: 1, orderIndex: 7, questionCount: 0 },
]

export const INITIAL_QUESTIONS: Question[] = []

export const INITIAL_TESTS: PracticeTest[] = [
  {
    id: 1,
    title: 'Rajasthan Informatics Assistant Official Practice Drill 01',
    description: 'Official practice drill covering all 4 core subjects: Computer & IT, Reasoning, Mathematics, and General Knowledge (GK).',
    durationMinutes: 30,
    totalQuestions: 0,
    totalMarks: 0,
    passingPercentage: 40,
    questionIds: [],
    createdAt: '2026-02-01',
  },
]
