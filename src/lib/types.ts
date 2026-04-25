// 题目类型
export type QuestionType = "single" | "multiple" | "judge" | "essay";

// 题目
export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  score: number;           // 每题分值（默认1）
  options: string[];       // 单选题/多选题选项
  correctAnswer: number[]; // 单选: [index]; 多选: [index...]; 判断: [0/1]
  keywords?: { keyword: string; score: number }[]; // 问答题关键词
  maxScore?: number;       // 问答题最高分
}

// 课程
export interface Course {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  requiredExamId?: string; // 关联考试ID，看完视频才能考
  duration: number;        // 视频时长(秒)
  createdAt: string;
}

// 考试
export interface Exam {
  id: string;
  title: string;
  description: string;
  passingScore: number;    // 及格分数
  questions: Question[];
  createdAt: string;
}

// 视频观看记录
export interface WatchRecord {
  id: string;
  userId: string;
  courseId: string;
  progress: number;        // 0-100 %
  completed: boolean;
  updatedAt: string;
}

// 考试记录
export interface ExamRecord {
  id: string;
  userId: string;
  examId: string;
  answers: (number[] | string)[];
  score: number;
  total: number;
  detail: { qId: string; type: QuestionType; score: number; maxScore: number }[];
  passed: boolean;
  completedAt: string;
}

// 员工
export interface Employee {
  id: string;
  name: string;
  department: string;
  employeeId: string;   // 工号
  browserId?: string;    // 绑定的浏览器ID
  createdAt: string;
}
