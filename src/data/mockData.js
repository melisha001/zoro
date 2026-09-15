export const COURSES = [
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
    videoUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=800',
    overview: 'Level 3 introduces advanced mental math techniques, multi-digit multiplication, division shortcuts, and speed calculations using the soroban abacus.',
    benefits: [
      'Increases processing speed and calculation accuracy',
      'Enhances memory retention and photographic memory',
      'Fosters logical thinking and problem-solving skills',
      'Boosts academic confidence in mathematics'
    ],
    curriculum: [
      'Module 1: Advanced Bead Movement Techniques',
      'Module 2: 3-Digit Addition & Subtraction',
      'Module 3: Speed Multiplication Shortcuts',
      'Module 4: Division Fundamentals',
      'Module 5: Mental Math Practice & Speed Tests'
    ],
    faqs: [
      { q: 'Is prior abacus knowledge required?', a: 'Completion of Abacus Level 1 & 2 or a quick assessment is recommended.' },
      { q: 'Are physical abacus frames provided?', a: 'Yes! A complimentary student kit including the physical Soroban board and practice workbooks will be delivered.' },
      { q: 'What is the batch size?', a: 'We maintain small interactive batches of maximum 8-10 students per trainer.' }
    ]
  },
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
    videoUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=800',
    overview: 'Comprehensive program focused on grammar fundamentals, accent neutralization, storytelling, debate, and everyday conversational confidence.',
    benefits: ['Fluency enhancement', 'Public speaking practice', 'Vocabulary expansion'],
    curriculum: ['Grammar Essentials', 'Storytelling & Narration', 'Public Speaking Workshop'],
    faqs: [{ q: 'Is this suitable for beginners?', a: 'Yes, students are grouped according to their baseline evaluation.' }]
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
    videoUrl: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&q=80&w=800',
    overview: 'Structured chess training covering basic piece movement to complex tactical combinations and tournament prep.',
    benefits: ['Strategic planning skills', 'Patience & focus enhancement', 'Pattern recognition'],
    curriculum: ['Board Setup & Rules', 'Tactical Patterns (Forks, Pins)', 'Endgame Principles'],
    faqs: [{ q: 'Do we play online matches?', a: 'Yes, weekly supervised online practice games are hosted.' }]
  },
  {
    id: 'logical-reasoning',
    title: 'Logical Reasoning',
    subtitle: 'Analyze. Solve. Excel.',
    description: 'Puzzles, Olympiad math preparation, spatial reasoning, and critical thinking challenges.',
    duration: '2 Months',
    mode: 'Online',
    ageGroup: '8–14 Years',
    certificate: 'Yes',
    rating: 4.75,
    enrolled: 74,
    videoUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=800',
    overview: 'Sharpens aptitude and competitive exam readiness through non-verbal reasoning, series completion, and logic grids.',
    benefits: ['Olympiad readiness', 'Analytical mindset', 'Abstract reasoning'],
    curriculum: ['Pattern Completion', 'Number & Alphabet Series', 'Spatial Visualization'],
    faqs: [{ q: 'Does this help with school exams?', a: 'Absolutely! It strengthens problem-solving across STEM subjects.' }]
  },
  {
    id: 'personality-dev',
    title: 'Personality Development',
    subtitle: 'Lead. Adapt. Shine.',
    description: 'Empowering children with emotional intelligence, leadership skills, body language, and etiquette.',
    duration: '2 Months',
    mode: 'Online',
    ageGroup: '9–16 Years',
    certificate: 'Yes',
    rating: 4.85,
    enrolled: 62,
    videoUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800',
    overview: 'Holistic growth workshops covering emotional regulation, peer collaboration, digital mindfulness, and presentation skills.',
    benefits: ['Self-confidence boost', 'Team collaboration skills', 'Positive body language'],
    curriculum: ['Mindset & Self-Image', 'Effective Communication', 'Time & Goal Management'],
    faqs: [{ q: 'Are sessions interactive?', a: '100% activity-driven with roleplays and group discussions.' }]
  }
];

export const COMPETITION = {
  title: 'Zoro National Abacus Competition 2026',
  tagline: 'Think Faster. Grow Stronger.',
  date: '20 January 2026',
  fee: '₹500',
  lastDateToRegister: '10 January 2026',
  mode: 'Online',
  bannerUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=1200',
  about: 'The Zoro National Abacus Competition is India’s premier speed arithmetic showdown. Over 5,000 young prodigies compete live online in speed calculation, mental math accuracy, and flash memory rounds.',
  prizes: [
    { rank: '1st Place', reward: '₹25,000 Cash + Gold Trophy + Champion Certificate' },
    { rank: '2nd Place', reward: '₹15,000 Cash + Silver Trophy + Excellence Certificate' },
    { rank: '3rd Place', reward: '₹10,000 Cash + Bronze Trophy + Merit Certificate' },
    { rank: 'Top 50 Finisher', reward: 'Medal of Honor + Special Recognition Kit' }
  ],
  instructions: [
    'Each participant must have a stable internet connection and webcam turned on.',
    'Test rounds consist of 50 mental math questions to be solved in 5 minutes.',
    'Calculators or scratch paper are strictly prohibited.',
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
  role: 'Abacus & Math Lead Trainer',
  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
  myStudents: 24,
  todaysSessionsCount: 3,
  upcomingSessionsCount: 5,
  pendingAssignments: 7,
  toBeCorrected: 5,
  unresolvedDoubts: 2,
  todaysSessions: [
    { id: 's1', time: '5:00 PM', course: 'Abacus L2', topic: 'Multiplication', students: 12, status: 'Upcoming' },
    { id: 's2', time: '6:00 PM', course: 'Abacus L3', topic: 'Division', students: 15, status: 'Live Soon' },
    { id: 's3', time: '7:00 PM', course: 'Chess Basic', topic: 'Pawn Moves', students: 10, status: 'Scheduled' }
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
    course: 'Abacus Level 3',
    topic: 'Division',
    date: '12 September 2026',
    time: '6:00 PM – 7:00 PM',
    trainer: 'Priya',
    platform: 'Google Meet'
  },
  recentAssignments: [
    { id: 'w5', title: 'Worksheet 5', course: 'Abacus Level 3', topic: 'Division', dueDate: '15 Sep 2026', assignedOn: '10 Sep 2026', status: 'Pending' },
    { id: 'w4', title: 'Division Practice', course: 'Abacus Level 3', topic: 'Division Basics', dueDate: '20 Sep 2026', assignedOn: '12 Sep 2026', status: 'Submitted' }
  ],
  doubts: [
    { id: 'DBT-000124', course: 'Abacus Level 3', topic: 'Division sums', question: 'How do I handle remainders when dividing 4-digit numbers on the soroban?', status: 'Resolved', answer: 'Move the quotient bead 1 column left after remainder subtraction.' },
    { id: 'DBT-000123', course: 'Abacus Level 3', topic: 'Multiplication method', question: 'Should we clear lower beads first in 3x2 digit multiplication?', status: 'Answered', answer: 'Yes, always clear multiplier units before shifting to tens.' },
    { id: 'DBT-000122', course: 'Abacus Level 3', topic: 'Carry forward', question: 'I am getting confused in complementary addition carry-overs.', status: 'Resolved', answer: 'Review Worksheet 4 page 12 for the 5s complement rule.' },
    { id: 'DBT-000121', course: 'Abacus Level 3', topic: 'Practice questions', question: 'Is worksheet 6 mandatory before Friday live session?', status: 'Open', answer: null }
  ]
};
