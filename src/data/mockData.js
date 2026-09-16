export const INITIAL_COURSES = [
  {
    id: 'english-comm',
    title: 'English Communication',
    subtitle: 'Speak Fluent. Express Confidently.',
    description: 'Interactive spoken English, vocabulary building, public speaking, and creative writing tailored for young learners.',
    duration: '4 Months',
    mode: 'Online',
    ageGroup: '7–15 Years',
    certificate: 'Yes',
    rating: 4.8,
    enrolled: 95,
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=800',
    overview: 'Comprehensive program focused on grammar fundamentals, accent neutralization, storytelling, debate, and everyday conversational confidence.',
    benefits: ['Fluency enhancement', 'Public speaking practice', 'Vocabulary expansion'],
    modules: [
      {
        id: 'mod-1',
        title: 'Module 1: Basics of Communication',
        description: 'Introduction to effective listening, articulation, and everyday dialogue.',
        lessons: [
          { id: 'les-1', title: 'Lesson 1: Introduction to Spoken English', youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', content: 'Learn the fundamentals of pitch, tone, and confidence when speaking.' },
          { id: 'les-2', title: 'Lesson 2: Listening & Response Skills', youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', content: 'Active listening techniques and quick conversational response patterns.' }
        ]
      },
      {
        id: 'mod-2',
        title: 'Module 2: Vocabulary & Sentence Structure',
        description: 'Expanding word bank, idiom usage, and grammatically precise sentences.',
        lessons: [
          { id: 'les-3', title: 'Lesson 1: Daily Essential Vocabulary', youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', content: '50 essential daily communication phrases and contextual usage.' }
        ]
      }
    ],
    faqs: [{ q: 'Is this suitable for beginners?', a: 'Yes, students are grouped according to their baseline evaluation.' }]
  },
  {
    id: 'abacus-3',
    title: 'Abacus Level 3',
    subtitle: 'Master Calculations. Build Confidence.',
    description: 'Our Abacus course helps children improve concentration, memory and numerical skills through fun and interactive learning.',
    duration: '3 Months',
    mode: 'Online / Offline',
    ageGroup: '6–14 Years',
    certificate: 'Yes',
    rating: 4.9,
    enrolled: 128,
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=800',
    overview: 'Level 3 introduces advanced mental math techniques, multi-digit multiplication, division shortcuts, and speed calculations using the soroban abacus.',
    benefits: [
      'Increases processing speed and calculation accuracy',
      'Enhances memory retention and photographic memory',
      'Fosters logical thinking and problem-solving skills',
      'Boosts academic confidence in mathematics'
    ],
    modules: [
      {
        id: 'mod-a1',
        title: 'Module 1: Soroban Bead Techniques',
        description: 'Mastering upper bead and lower bead rapid movements.',
        lessons: [
          { id: 'les-a1', title: 'Lesson 1: Division Basics on Soroban', youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', content: 'Step-by-step division methods using soroban rods.' }
        ]
      }
    ],
    faqs: [
      { q: 'Is prior abacus knowledge required?', a: 'Completion of Abacus Level 1 & 2 or a quick assessment is recommended.' }
    ]
  },
  {
    id: 'chess-basic',
    title: 'Chess Mastery',
    subtitle: 'Think Ahead. Master Strategy.',
    description: 'Learn tactics, openings, endgames, and grandmaster strategies from certified FIDE rated coaches.',
    duration: '3 Months',
    mode: 'Online / Offline',
    ageGroup: '6–16 Years',
    certificate: 'Yes',
    rating: 4.95,
    enrolled: 110,
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&q=80&w=800',
    overview: 'Structured chess training covering basic piece movement to complex tactical combinations and tournament prep.',
    benefits: ['Strategic planning skills', 'Patience & focus enhancement', 'Pattern recognition'],
    modules: [],
    faqs: [{ q: 'Do we play online matches?', a: 'Yes, weekly supervised online practice games are hosted.' }]
  }
];

export const COURSES = INITIAL_COURSES;

export const COMPETITION = {
  title: 'Zoro English Academy National Competition 2026',
  tagline: 'Think Faster. Speak Confidently. Grow Stronger.',
  date: '20 January 2026',
  fee: '₹500',
  lastDateToRegister: '10 January 2026',
  mode: 'Online',
  bannerUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=1200',
  about: 'The Zoro English Academy National Competition is India’s premier speed communication and mental math showdown. Over 5,000 young prodigies compete live online in public speaking, vocabulary recall, and speed calculations.',
  prizes: [
    { rank: '1st Place', reward: '₹25,000 Cash + Gold Trophy + Champion Certificate' },
    { rank: '2nd Place', reward: '₹15,000 Cash + Silver Trophy + Excellence Certificate' },
    { rank: '3rd Place', reward: '₹10,000 Cash + Bronze Trophy + Merit Certificate' },
    { rank: 'Top 50 Finisher', reward: 'Medal of Honor + Special Recognition Kit' }
  ],
  instructions: [
    'Each participant must have a stable internet connection and webcam turned on.',
    'Test rounds consist of 50 speed questions to be answered in 5 minutes.',
    'Calculators or external aids are strictly prohibited.',
    'Practice mock papers are made available 7 days prior in the student portal.'
  ]
};

export const ADMIN_STATS = {
  newAdmissions: 24,
  feeRevenue: '₹1,85,000',
  studentsJoined: 21,
  activeStudents: 128,
  pendingFees: '₹92,000',
  assignmentsPending: 7,
  unresolvedDoubts: 3,
  totalSessions: 56,
  admissionsChart: [
    { month: 'Jan', count: 8 },
    { month: 'Feb', count: 12 },
    { month: 'Mar', count: 10 },
    { month: 'Apr', count: 15 },
    { month: 'May', count: 18 },
    { month: 'Jun', count: 14 },
    { month: 'Jul', count: 20 },
    { month: 'Aug', count: 22 },
    { month: 'Sep', count: 24 }
  ],
  revenueChart: [
    { month: 'Jan', amount: 65000 },
    { month: 'Feb', amount: 80000 },
    { month: 'Mar', amount: 95000 },
    { month: 'Apr', amount: 110000 },
    { month: 'May', amount: 130000 },
    { month: 'Jun', amount: 145000 },
    { month: 'Jul', amount: 160000 },
    { month: 'Aug', amount: 175000 },
    { month: 'Sep', amount: 185000 }
  ]
};

export const TRAINER_DATA = {
  name: 'Priya',
  role: 'English & Lead Skill Trainer',
  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
  myStudents: 24,
  todaysSessionsCount: 3,
  upcomingSessionsCount: 5,
  pendingAssignments: 7,
  toBeCorrected: 5,
  unresolvedDoubts: 2,
  todaysSessions: [
    { id: 's1', time: '5:00 PM', course: 'English Communication', topic: 'Public Speaking', students: 12, status: 'Upcoming', meetUrl: 'https://meet.google.com/abc-defg-hij' },
    { id: 's2', time: '6:00 PM', course: 'Abacus L3', topic: 'Division', students: 15, status: 'Live Soon', meetUrl: 'https://meet.google.com/xyz-uvwx-rst' },
    { id: 's3', time: '7:00 PM', course: 'Chess Basic', topic: 'Pawn Moves', students: 10, status: 'Scheduled', meetUrl: 'https://meet.google.com/lmn-opqr-stu' }
  ]
};

export const STUDENT_DATA = {
  name: 'Arjun',
  avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
  quote: 'Small Steps Big Progress',
  upcomingSessionsCount: 3,
  pendingAssignmentsCount: 2,
  myDoubtsCount: 1,
  attendancePercentage: '92%',
  nextSession: {
    course: 'English Communication',
    topic: 'Public Speaking Workshop',
    date: '12 September 2026',
    time: '6:00 PM – 7:00 PM',
    trainer: 'Priya',
    platform: 'Google Meet',
    meetUrl: 'https://meet.google.com/abc-defg-hij'
  },
  recentAssignments: [
    { id: 'w5', title: 'Worksheet 5', course: 'English Communication', topic: 'Speech Draft', dueDate: '15 Sep 2026', assignedOn: '10 Sep 2026', status: 'Pending' },
    { id: 'w4', title: 'Vocabulary Quiz', course: 'English Communication', topic: 'Essential Phrases', dueDate: '20 Sep 2026', assignedOn: '12 Sep 2026', status: 'Submitted' }
  ],
  doubts: [
    { id: 'DBT-000124', course: 'English Communication', topic: 'Pronunciation', question: 'How do I reduce my native accent when presenting in public?', status: 'Resolved', answer: 'Focus on syllable stress and record yourself daily.' },
    { id: 'DBT-000123', course: 'English Communication', topic: 'Grammar', question: 'Should we clear lower beads first in 3x2 digit multiplication?', status: 'Answered', answer: 'Yes, always clear multiplier units before shifting to tens.' }
  ]
};
