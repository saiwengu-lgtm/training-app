import type { Question } from "./types";

/**
 * 评分引擎
 */
export function scoreQuestion(
  question: Question,
  userAnswer: number[] | string
): { score: number; maxScore: number } {
  const maxScore = question.score || 1;

  switch (question.type) {
    case "single":
      return scoreSingle(question, userAnswer as number[], maxScore);
    case "multiple":
      return scoreMultiple(question, userAnswer as number[]);
    case "judge":
      return scoreJudge(question, userAnswer as number[], maxScore);
    case "essay":
      return scoreEssay(question, userAnswer as string);
    default:
      return { score: 0, maxScore: 0 };
  }
}

// 单选题：选对满分，选错0分
function scoreSingle(q: Question, answer: number[], maxScore: number): { score: number; maxScore: number } {
  if (answer.length === 0) return { score: 0, maxScore };
  return {
    score: answer[0] === q.correctAnswer[0] ? maxScore : 0,
    maxScore,
  };
}

// 多选题：全部选对满分；少选每个正确选项得(maxScore/正确选项数)分；选错0分
function scoreMultiple(q: Question, answer: number[]): { score: number; maxScore: number } {
  const correct = q.correctAnswer;
  const maxScore = q.score || correct.length;
  if (maxScore === 0) return { score: 0, maxScore: 0 };

  // 检查是否有错误选项
  const hasWrong = answer.some((a) => !correct.includes(a));
  if (hasWrong) return { score: 0, maxScore };

  // 少选：选中的正确选项得分
  if (answer.length < correct.length) {
    const partialPerOption = maxScore / correct.length;
    return { score: Math.round(answer.length * partialPerOption * 100) / 100, maxScore };
  }

  // 全对
  return { score: maxScore, maxScore };
}

// 判断题：选对满分
function scoreJudge(q: Question, answer: number[], maxScore: number): { score: number; maxScore: number } {
  return scoreSingle(q, answer, maxScore);
}

// 问答题：关键词匹配计分
function scoreEssay(q: Question, answer: string): { score: number; maxScore: number } {
  const maxScore = q.maxScore || q.score || 10;
  if (!answer || !q.keywords || q.keywords.length === 0) {
    return { score: 0, maxScore };
  }

  let totalScore = 0;
  for (const kw of q.keywords) {
    if (answer.includes(kw.keyword)) {
      totalScore += kw.score;
    }
  }

  return { score: Math.min(totalScore, maxScore), maxScore };
}
