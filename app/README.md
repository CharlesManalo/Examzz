# StudyQuiz Pro - Student Document Quiz & Exam Platform

A modern, production-ready web application where students can upload study materials and automatically generate interactive quizzes, mock exams, and lesson reviews. Built with React, TypeScript, and Tailwind CSS.

![StudyQuiz Pro](https://img.shields.io/badge/StudyQuiz-Pro-violet?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-cyan?style=for-the-badge&logo=tailwindcss)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Deployment Guide](#deployment-guide)
  - [Netlify Deployment](#netlify-deployment)
  - [GitHub Integration](#github-integration)
- [Project Structure](#project-structure)
- [Core Functions](#core-functions)
- [Database Schema](#database-schema)
- [Quiz Generation Algorithm](#quiz-generation-algorithm)
- [User Guide](#user-guide)
- [Admin Panel](#admin-panel)
- [Monetization](#monetization)
- [Analytics](#analytics)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Document Processing
- **Multi-format Support**: PDF, Word (.docx), PowerPoint (.pptx), Excel (.xlsx)
- **Drag & Drop Upload**: Intuitive file upload with progress tracking
- **Batch Processing**: Upload up to 15 files per session (25MB max per file)
- **Text Extraction**: Automatic content extraction from all supported formats

### Quiz Generation (Rule-Based, No AI)
- **Definition Questions**: Detects "X is..." patterns and creates "What is X?" questions
- **Fill-in-the-Blank**: Identifies key terms and creates cloze questions
- **Keyword Questions**: Extracts important terms from headings
- **Multiple Choice**: Generates distractors from document content
- **Question Shuffling**: Randomizes question and answer order

### Exam Interface (Kahoot-Style)
- **One Question Per Screen**: Clean, focused interface
- **Countdown Timer**: 30 seconds per question
- **Large Answer Buttons**: Easy selection on all devices
- **Instant Feedback**: Visual indicators for correct/incorrect answers
- **Progress Tracking**: Progress bar and question dots
- **Score Calculation**: Percentage and detailed breakdown

### Dashboard (Bento Box Layout)
- **Quick Actions**: Upload, Generate Quiz, Mock Exam, Lesson Review
- **Study Progress**: Visual progress bars and statistics
- **Recent Activity**: Latest quizzes and uploaded files
- **Weak Topics**: Track areas needing improvement
- **Premium Card**: Upgrade prompt for monetization

### User Management
- **Email Authentication**: Registration and login system
- **Session Management**: Persistent login with localStorage
- **Profile Dashboard**: User stats and history
- **Premium Status**: Free/Premium user tiers

### Analytics & Monitoring
- **User Metrics**: Total users, daily active users
- **Usage Stats**: Files uploaded, quizzes completed
- **Performance**: Average scores, completion rates
- **Admin Dashboard**: Platform health monitoring

### Monetization Ready
- **Google AdSense**: Pre-configured ad placeholders
- **Premium Plans**: Upgrade prompts and feature gating
- **Ad Locations**: Dashboard sidebar, between quizzes, results page

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | React 18, TypeScript 5 |
| **Styling** | Tailwind CSS 3, shadcn/ui |
| **Build Tool** | Vite 7 |
| **State Management** | React Hooks, localStorage |
| **Document Processing** | mammoth.js, xlsx, pdf-parse |
| **Icons** | Lucide React |
| **Notifications** | Sonner |
| **Deployment** | Netlify Ready |

---

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/studyquiz-pro.git
cd studyquiz-pro
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```

4. **Open browser**
Navigate to `http://localhost:5173`

### Build for Production
```bash
npm run build
```

The build output will be in the `dist/` directory.

---

## Deployment Guide

### Netlify Deployment

#### Method 1: Drag & Drop (Quickest)

1. Build your project:
```bash
npm run build
```

2. Go to [Netlify](https://app.netlify.com/)

3. Drag and drop the `dist/` folder to the deploy area

4. Your site is live! 🎉

#### Method 2: GitHub Integration (Recommended)

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/studyquiz-pro.git
git push -u origin main
```

2. **Connect to Netlify**
   - Go to [Netlify Dashboard](https://app.netlify.com/)
   - Click "Add new site" → "Import an existing project"
   - Select GitHub and authorize Netlify
   - Choose your repository

3. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Click "Deploy site"

4. **Enable Auto-Deploy**
   - Go to Site settings → Build & deploy
   - Ensure "Auto publish" is enabled
   - Any push to main branch will trigger redeployment

#### Method 3: Netlify CLI

1. **Install Netlify CLI**
```bash
npm install -g netlify-cli
```

2. **Login to Netlify**
```bash
netlify login
```

3. **Initialize site**
```bash
netlify init
```

4. **Deploy**
```bash
netlify deploy --prod --dir=dist
```

### Custom Domain Setup

1. Go to Site settings → Domain management
2. Click "Add custom domain"
3. Enter your domain (e.g., `studyquiz.com`)
4. Follow DNS configuration instructions
5. Enable HTTPS (SSL certificate auto-provisioned)

---

## Project Structure

```
studyquiz-pro/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   └── ui/            # shadcn/ui components
│   ├── sections/          # Page sections
│   │   ├── Navbar.tsx     # Navigation bar
│   │   ├── Home.tsx       # Landing page
│   │   ├── Login.tsx      # Login page
│   │   ├── Register.tsx   # Registration page
│   │   ├── Dashboard.tsx  # User dashboard (Bento layout)
│   │   ├── Upload.tsx     # File upload page
│   │   ├── Exam.tsx       # Kahoot-style exam interface
│   │   ├── Results.tsx    # Quiz results page
│   │   ├── Review.tsx     # Answer review page
│   │   ├── Admin.tsx      # Admin dashboard
│   │   └── Footer.tsx     # Footer with ads
│   ├── services/          # Business logic
│   │   ├── database.ts    # LocalStorage database
│   │   ├── documentProcessor.ts  # File text extraction
│   │   └── quizGenerator.ts      # Quiz generation algorithm
│   ├── types/             # TypeScript types
│   │   └── index.ts       # Type definitions
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions
│   ├── App.tsx            # Main app component
│   ├── App.css            # Global styles
│   └── main.tsx           # Entry point
├── dist/                  # Build output
├── index.html             # HTML template
├── package.json           # Dependencies
├── tailwind.config.js     # Tailwind configuration
├── tsconfig.json          # TypeScript configuration
└── vite.config.ts         # Vite configuration
```

---

## Core Functions

### Database Service (`src/services/database.ts`)

#### User Management
```typescript
// Create new user
createUser(user: Omit<User, 'id' | 'createdAt'>): User

// Get all users
getUsers(): User[]

// Get user by email
getUserByEmail(email: string): User | undefined

// Update user
updateUser(id: string, updates: Partial<User>): User | null

// Get current logged-in user
getCurrentUser(): User | null

// Set current user session
setCurrentUser(user: User | null): void
```

#### File Management
```typescript
// Save uploaded file
createFile(file: Omit<UploadedFile, 'id' | 'uploadDate'>): UploadedFile

// Get all files for a user
getFilesByUserId(userId: string): UploadedFile[]

// Delete a file
deleteFile(id: string): boolean
```

#### Quiz Management
```typescript
// Create new quiz
createQuiz(quiz: Omit<Quiz, 'id' | 'createdAt'>): Quiz

// Get quizzes by user
getQuizzesByUserId(userId: string): Quiz[]

// Get quiz by ID
getQuizById(id: string): Quiz | undefined

// Create questions for a quiz
createQuestions(questions: Omit<Question, 'id'>[]): Question[]

// Get questions for a quiz
getQuestionsByQuizId(quizId: string): Question[]
```

#### Results & Analytics
```typescript
// Save quiz result
createResult(result: Omit<QuizResult, 'id' | 'completedAt'>): QuizResult

// Get results by user
getResultsByUserId(userId: string): QuizResult[]

// Get platform analytics
getAnalytics(): UserAnalytics

// Track active user for analytics
trackActiveUser(): void
```

### Document Processor (`src/services/documentProcessor.ts`)

```typescript
// Process any supported document type
processDocument(file: File): Promise<ExtractedContent>

// Validate file type
isValidFileType(file: File): boolean

// Validate file size (25MB max)
isValidFileSize(file: File): boolean

// Format bytes to readable size
formatFileSize(bytes: number): string

// Get file type label
getFileTypeLabel(fileName: string): string
```

### Quiz Generator (`src/services/quizGenerator.ts`)

```typescript
// Generate quiz from extracted content
generateQuiz(
  content: ExtractedContent,
  options?: Partial<QuizGenerationOptions>
): Omit<Question, 'id' | 'quizId'>[]

// Get quiz title by type
getQuizTitle(quizType: QuizType): string

// Get recommended question count
getRecommendedQuestionCount(quizType: QuizType): number
```

---

## Database Schema

### Users Collection
```typescript
interface User {
  id: string;           // Unique identifier
  email: string;        // User email
  password: string;     // Hashed password
  createdAt: string;    // ISO timestamp
  lastLogin: string;    // ISO timestamp
  isPremium: boolean;   // Premium status
}
```

### Files Collection
```typescript
interface UploadedFile {
  id: string;           // Unique identifier
  userId: string;       // Owner reference
  fileName: string;     // Original filename
  fileType: 'pdf' | 'docx' | 'pptx' | 'xlsx';
  fileSize: number;     // Size in bytes
  extractedText: string; // Extracted content
  uploadDate: string;   // ISO timestamp
}
```

### Quizzes Collection
```typescript
interface Quiz {
  id: string;           // Unique identifier
  userId: string;       // Creator reference
  quizType: 'quiz' | 'mock-exam' | 'full-exam' | 'lesson-review';
  title: string;        // Quiz title
  totalQuestions: number;
  createdAt: string;    // ISO timestamp
  fileIds: string[];    // Source files
}
```

### Questions Collection
```typescript
interface Question {
  id: string;           // Unique identifier
  quizId: string;       // Parent quiz reference
  question: string;     // Question text
  options: string[];    // Answer choices (4)
  correctAnswer: number; // Index of correct answer
  questionType: 'definition' | 'fill-blank' | 'keyword' | 'multiple-choice';
  explanation?: string; // Optional explanation
}
```

### Results Collection
```typescript
interface QuizResult {
  id: string;           // Unique identifier
  userId: string;       // Test taker reference
  quizId: string;       // Quiz reference
  score: number;        // Percentage (0-100)
  correctAnswers: number;
  wrongAnswers: number;
  completedAt: string;  // ISO timestamp
  answers: UserAnswer[]; // Detailed answers
  timeSpent: number;    // Seconds
}

interface UserAnswer {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  timeSpent: number;
}
```

### Analytics Collection
```typescript
interface UserAnalytics {
  totalUsers: number;
  activeUsersToday: number;
  totalExams: number;
  totalQuizzes: number;
  filesUploaded: number;
  quizzesCompleted: number;
  averageScore: number;
  lastUpdated: string;
}
```

---

## Quiz Generation Algorithm

### Step 1: Text Extraction
- PDF: Text extraction via pdf-parse
- Word: Mammoth.js for clean text extraction
- PowerPoint: Slide text extraction
- Excel: Cell content concatenation

### Step 2: Content Analysis
```typescript
// Extract sentences
const sentences = text.match(/[^.!?]+[.!?]+/g);

// Extract headings (capitalized, short lines)
const headings = lines.filter(line => 
  line.length > 5 && 
  line.length < 100 &&
  line === line.toUpperCase()
);

// Extract keywords (frequent capitalized words)
const keywords = extractFrequentWords(text);
```

### Step 3: Question Generation Patterns

#### Definition Detection
```
Pattern: "Photosynthesis is the process..."
Question: "What is photosynthesis?"
Answer: "Process plants use to convert sunlight into energy"
```

#### Fill-in-the-Blank
```
Original: "Photosynthesis occurs in the chloroplast."
Question: "Photosynthesis occurs in the ______."
Answer: "chloroplast"
```

#### Keyword Questions
```
Heading: "The Water Cycle"
Question: "Which process is part of the water cycle?"
Options: ["Evaporation", "Combustion", "Radiation", "Oxidation"]
```

### Step 4: Distractor Generation
- Extract related terms from document
- Use other keywords as wrong answers
- Shuffle options and track correct index

---

## User Guide

### Getting Started

1. **Register an Account**
   - Click "Get Started" on homepage
   - Enter email and password
   - Or use demo credentials: `demo@studyquiz.com` / `demo123`

2. **Upload Study Materials**
   - Go to Dashboard → Upload Files
   - Drag & drop or select files
   - Supported: PDF, Word, PowerPoint, Excel
   - Max 15 files, 25MB each

3. **Generate a Quiz**
   - Select quiz type (Quick Quiz, Mock Exam, etc.)
   - Click "Generate Quiz"
   - Wait for processing

4. **Take the Quiz**
   - Answer each question within 30 seconds
   - Click your chosen answer
   - See instant feedback
   - Click "Next" to continue

5. **Review Results**
   - View your score and breakdown
   - See correct/incorrect answers
   - Review explanations
   - Retry or share results

### Quiz Types

| Type | Questions | Best For |
|------|-----------|----------|
| Quick Quiz | 10 | Quick review |
| Mock Exam | 25 | Exam simulation |
| Full Exam | 50 | Comprehensive test |
| Lesson Review | 15 | Topic revision |

---

## Admin Panel

### Access
- Login with: `admin@studyquiz.com`
- Password: Any (create admin user manually)

### Features
- **Platform Stats**: Users, files, quizzes, exams
- **Recent Activity**: Latest users, files, quizzes
- **System Health**: Uptime, status, growth metrics
- **Data Management**: Clear database, refresh stats

### Admin Functions
```typescript
// Get all platform data
const users = getUsers();
const files = getFiles();
const quizzes = getQuizzes();
const analytics = getAnalytics();

// Clear all data (use with caution!)
clearDatabase();
```

---

## Monetization

### Google AdSense Integration

1. **Sign up** at [Google AdSense](https://www.google.com/adsense)

2. **Add your site** and verify ownership

3. **Get ad code** and replace placeholders:

```tsx
// In Footer.tsx, replace:
<div className="bg-white/50 border-2 border-dashed...">
  <p>Advertisement Space - Google AdSense Ready</p>
</div>

// With your AdSense code:
<ins className="adsbygoogle"
  style={{ display: 'block' }}
  data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
  data-ad-slot="XXXXXXXXXX"
  data-ad-format="auto"
/>
```

### Premium Plan Setup

1. **Enable payment provider** (Stripe recommended)

2. **Update upgrade handler** in Dashboard.tsx:

```typescript
const handleUpgrade = async () => {
  // Redirect to Stripe checkout
  const session = await createCheckoutSession(user.id);
  window.location.href = session.url;
};
```

3. **Unlock premium features** based on `user.isPremium`

### Ad Locations (Pre-configured)
- ✅ Dashboard sidebar
- ✅ Footer banner
- ⬜ Between quiz questions (ready to add)
- ⬜ After exam results (ready to add)

---

## Analytics

### Built-in Metrics

| Metric | Description | Location |
|--------|-------------|----------|
| Total Users | Registered accounts | Admin dashboard |
| Active Today | Daily active users | Admin dashboard |
| Files Uploaded | Total documents | Admin dashboard |
| Quizzes Created | Generated quizzes | Admin dashboard |
| Exams Completed | Finished quizzes | Admin dashboard |
| Average Score | Platform-wide average | Admin dashboard |

### Google Analytics Integration

1. **Create GA4 property** at [Google Analytics](https://analytics.google.com)

2. **Add tracking code** to index.html:

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Custom Events
Track these user actions:
- File upload completion
- Quiz generation
- Quiz start/finish
- Score achieved
- Premium upgrade click

---

## API Reference

### Type Definitions

```typescript
// View types
type View = 'home' | 'dashboard' | 'upload' | 'quiz' | 
            'exam' | 'results' | 'review' | 'login' | 
            'register' | 'admin';

// Quiz types
type QuizType = 'quiz' | 'mock-exam' | 'full-exam' | 'lesson-review';

// Question types
type QuestionType = 'definition' | 'fill-blank' | 'keyword' | 'multiple-choice';
```

### Navigation

```typescript
// Navigate to view
onNavigate(view: View): void

// Common navigation paths
onNavigate('dashboard');  // User dashboard
onNavigate('upload');     // File upload
onNavigate('login');      // Login page
onNavigate('admin');      // Admin panel
```

---

## Environment Variables

Create `.env` file for configuration:

```env
# App
VITE_APP_NAME=StudyQuiz Pro
VITE_APP_URL=https://your-domain.com

# Analytics (optional)
VITE_GA_ID=G-XXXXXXXXXX

# Ads (optional)
VITE_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX

# Features
VITE_MAX_FILE_SIZE=26214400
VITE_MAX_FILES=15
```

---

## Troubleshooting

### Common Issues

#### Build Fails
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### LocalStorage Full
```typescript
// Clear old data
localStorage.clear();
// Or use clearDatabase() from admin panel
```

#### File Upload Errors
- Check file size (< 25MB)
- Verify file format (PDF, DOCX, PPTX, XLSX)
- Try a different browser

#### Quiz Not Generating
- Ensure file has extractable text
- Try a document with more content
- Check browser console for errors

### Browser Support
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

---

## Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Development Guidelines
- Follow TypeScript strict mode
- Use functional components with hooks
- Maintain component modularity
- Add JSDoc comments for functions
- Test on mobile and desktop

---

## Future Enhancements

### Phase 2 Features (Planned)
- [ ] AI-powered quiz generation (GPT integration)
- [ ] AI tutor explanations
- [ ] Flashcards mode
- [ ] Study planner/calendar
- [ ] Mobile app (React Native)
- [ ] Social sharing
- [ ] Leaderboards
- [ ] Study groups

### Architecture Ready For
- Backend API integration
- Real database (PostgreSQL/MongoDB)
- User authentication (Auth0/Firebase)
- Cloud storage (AWS S3)
- Serverless functions

---

## License

MIT License - feel free to use for personal or commercial projects.

---

## Support

- **Documentation**: This README
- **Issues**: GitHub Issues
- **Email**: support@studyquiz.com

---

## Credits

Built with:
- [React](https://react.dev)
- [Vite](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Lucide Icons](https://lucide.dev)

---

**Made with ❤️ for students everywhere**
