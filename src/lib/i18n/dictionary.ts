import type { Locale } from "./index";

/**
 * Student-facing interface text.
 *
 * The teacher dashboard stays in English: it is used by one adult who reads
 * English, and translating it would double the maintenance for no gain to the
 * students the study is about.
 *
 * Tagalog here follows how Cookery is actually taught in Philippine classrooms:
 * technical terms that have no natural Tagalog equivalent (recipe, quiz, chef)
 * stay as they are, because inventing translations would read as stilted to a
 * Grade 9 student.
 */
const en = {
  // Navigation
  navHome: "Home",
  navRecipes: "Recipes",
  navQuiz: "Quiz",
  navProgress: "Progress",
  navProfile: "Profile",

  // Splash and auth
  getStarted: "Get Started",
  continueLabel: "Continue",
  createAccount: "Create an account",
  signIn: "Sign In",
  signOut: "Sign Out",
  register: "Register",
  usernameOrEmail: "Username or email",
  password: "Password",
  confirmPassword: "Confirm password",
  fullName: "Full name",
  email: "Email",
  username: "Username",
  gradeAndSection: "Grade level and section",
  forgotPassword: "Forgot your password? Ask your teacher to reset it for you.",
  alreadyHaveAccount: "Already have an account?",
  noAccountYet: "Don't have an account?",

  // Dashboard
  greeting: "Kumusta",
  tagline: "Learn, practice, and cook with confidence.",
  yourProgress: "Your progress",
  lessons: "Lessons",
  seeAll: "See all",
  ofLessons: "of",
  lessonsWord: "lessons",
  quizzesTaken: "quizzes taken",
  averageScore: "average score",
  noLessonsYet: "No lessons yet",
  noLessonsBody: "Your teacher has not published any recipes yet. Check back soon.",

  // Library
  chooseLesson: "Choose a lesson to start learning.",
  searchRecipe: "Search recipe…",
  all: "All",
  viewRecipe: "View Recipe",
  noRecipesHere: "No recipes here yet",

  // Lesson
  overview: "Overview",
  learningObjectives: "Learning Objectives",
  objectivesIntro: "After this lesson, you should be able to:",
  ingredients: "Ingredients",
  ingredientsHint: "Tap each one as you gather it.",
  procedure: "Procedure",
  cookingTechniques: "Cooking Techniques",
  safety: "Kitchen Safety & Sanitation",
  chefTips: "Chef's Tips",
  watchDemonstration: "Watch Demonstration",
  next: "Next",
  back: "Back",
  takeTheQuiz: "Take the Quiz",
  backToRecipes: "Back to Recipes",
  servings: "servings",
  minCooking: "min cooking",

  // Quiz
  submitAnswers: "Submit Answers",
  checking: "Checking…",
  yourAnswers: "Your answers",
  question: "Question",
  correct: "Correct",
  incorrect: "Incorrect",
  notAnswered: "Not answered",
  answersHidden: "Correct answers are hidden. Review the lesson to find them.",
  tryAgain: "Try Again",
  reviewLesson: "Review the Lesson",
  seeMyProgress: "See My Progress",
  wellDone: "Well done! You understood this lesson.",
  goodTry: "Good try! Review the lesson and try again to improve your score.",
  attempt: "Attempt",
  bestScoreCounts: "Your best score is what counts.",
  unansweredWarning: "Unanswered questions are marked wrong.",

  // Progress
  myProgress: "My Progress",
  recipesCompleted: "Recipes completed",
  quizzesCompleted: "Quizzes completed",
  quizzesPassed: "Quizzes passed",
  lessonsCompleted: "Lessons completed",
  quizScores: "Quiz scores",
  completedWhenQuizTaken: "A lesson counts as completed once you have taken its quiz.",
  noQuizzesYet: "No quizzes yet",
  startQuiz: "Start",
  retakeQuiz: "Retake",
  notTakenYet: "Not taken yet",
  best: "Best",
  attempts: "attempts",

  // Profile
  role: "Role",
  notSetYet: "Not set yet",
  changeMyPassword: "Change my password",
  language: "Language",
  languageHint: "Choose the language you read most comfortably.",
} as const;

export type PhraseKey = keyof typeof en;
export type Dictionary = Record<PhraseKey, string>;

const tl: Dictionary = {
  navHome: "Home",
  navRecipes: "Mga Recipe",
  navQuiz: "Pagsusulit",
  navProgress: "Progreso",
  navProfile: "Profile",

  getStarted: "Magsimula",
  continueLabel: "Magpatuloy",
  createAccount: "Gumawa ng account",
  signIn: "Mag-sign In",
  signOut: "Mag-sign Out",
  register: "Magrehistro",
  usernameOrEmail: "Username o email",
  password: "Password",
  confirmPassword: "Ulitin ang password",
  fullName: "Buong pangalan",
  email: "Email",
  username: "Username",
  gradeAndSection: "Baitang at seksyon",
  forgotPassword:
    "Nakalimutan ang password? Hilingin sa iyong guro na i-reset ito para sa iyo.",
  alreadyHaveAccount: "May account ka na?",
  noAccountYet: "Wala ka pang account?",

  greeting: "Kumusta",
  tagline: "Matuto, magsanay, at magluto nang may tiwala sa sarili.",
  yourProgress: "Ang iyong progreso",
  lessons: "Mga Aralin",
  seeAll: "Tingnan lahat",
  ofLessons: "sa",
  lessonsWord: "aralin",
  quizzesTaken: "pagsusulit na nasagutan",
  averageScore: "karaniwang iskor",
  noLessonsYet: "Wala pang aralin",
  noLessonsBody:
    "Wala pang na-publish na recipe ang iyong guro. Bumalik ka mamaya.",

  chooseLesson: "Pumili ng aralin para magsimula.",
  searchRecipe: "Maghanap ng recipe…",
  all: "Lahat",
  viewRecipe: "Tingnan ang Recipe",
  noRecipesHere: "Wala pang recipe dito",

  overview: "Panimula",
  learningObjectives: "Mga Layunin sa Pagkatuto",
  objectivesIntro: "Pagkatapos ng araling ito, dapat mong kayang:",
  ingredients: "Mga Sangkap",
  ingredientsHint: "Pindutin ang bawat isa habang inihahanda mo.",
  procedure: "Paraan ng Pagluluto",
  cookingTechniques: "Mga Teknik sa Pagluluto",
  safety: "Kaligtasan at Kalinisan sa Kusina",
  chefTips: "Mga Tip ng Chef",
  watchDemonstration: "Panoorin ang Demonstrasyon",
  next: "Susunod",
  back: "Bumalik",
  takeTheQuiz: "Sagutan ang Pagsusulit",
  backToRecipes: "Bumalik sa Mga Recipe",
  servings: "serving",
  minCooking: "minutong pagluluto",

  submitAnswers: "Ipasa ang mga Sagot",
  checking: "Sinusuri…",
  yourAnswers: "Ang iyong mga sagot",
  question: "Tanong",
  correct: "Tama",
  incorrect: "Mali",
  notAnswered: "Hindi nasagutan",
  answersHidden:
    "Nakatago ang mga tamang sagot. Balikan ang aralin para mahanap ang mga ito.",
  tryAgain: "Subukan Muli",
  reviewLesson: "Balikan ang Aralin",
  seeMyProgress: "Tingnan ang Aking Progreso",
  wellDone: "Magaling! Naintindihan mo ang araling ito.",
  goodTry:
    "Magandang subok! Balikan ang aralin at subukan muli para tumaas ang iyong iskor.",
  attempt: "Subok",
  bestScoreCounts: "Ang pinakamataas mong iskor ang binibilang.",
  unansweredWarning: "Ang hindi nasagutang tanong ay ibibilang na mali.",

  myProgress: "Aking Progreso",
  recipesCompleted: "Natapos na recipe",
  quizzesCompleted: "Natapos na pagsusulit",
  quizzesPassed: "Naipasang pagsusulit",
  lessonsCompleted: "Natapos na aralin",
  quizScores: "Mga iskor sa pagsusulit",
  completedWhenQuizTaken:
    "Itinuturing na tapos ang aralin kapag nasagutan mo na ang pagsusulit nito.",
  noQuizzesYet: "Wala pang pagsusulit",
  startQuiz: "Simulan",
  retakeQuiz: "Ulitin",
  notTakenYet: "Hindi pa nasasagutan",
  best: "Pinakamataas",
  attempts: "subok",

  role: "Tungkulin",
  notSetYet: "Wala pa",
  changeMyPassword: "Palitan ang aking password",
  language: "Wika",
  languageHint: "Piliin ang wikang pinakamadali mong basahin.",
};

const DICTIONARIES: Record<Locale, Dictionary> = { en, tl };

/** Returns the phrase lookup for a locale. */
export function dictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? en;
}
