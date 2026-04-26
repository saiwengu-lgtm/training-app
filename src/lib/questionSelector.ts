import type { Question, QuestionBankItem, ExamQuestionSelection } from "./types";

/**
 * 随机选题引擎
 * 按照考试设定的抽题规则，从题库中随机抽取题目
 */
export function selectQuestions(
  bank: QuestionBankItem[],
  selection: ExamQuestionSelection
): Question[] {
  const result: Question[] = [];

  for (const rule of selection.rules) {
    // 筛选符合条件的题目
    let pool = bank.filter((q) => {
      // 类型匹配
      if (q.type !== rule.type) return false;
      // 课题匹配（如果指定了课题范围）
      if (selection.categories.length > 0) {
        return selection.categories.includes(q.category);
      }
      return true;
    });

    // 如果指定课题但没匹配到，回退到所有类型匹配的题
    if (pool.length === 0 && selection.categories.length > 0) {
      pool = bank.filter((q) => q.type === rule.type);
    }

    // 随机打乱
    shuffle(pool);

    // 取指定数量（不够取全部）
    const picked = pool.slice(0, rule.count);

    // 转为 Question 格式，加上指定分值
    for (const item of picked) {
      result.push({
        id: `rand_${item.id}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: item.type,
        text: item.text,
        score: rule.score,
        options: [...item.options],
        correctAnswer: [...item.correctAnswer],
        // 问答题特殊处理
        keywords: item.type === "essay" ? (item.keywords ? [...item.keywords] : []) : undefined,
        maxScore: item.type === "essay" ? (item.maxScore || rule.score) : undefined,
      });
    }
  }

  return result;
}

/**
 * 获取考试的满分（自动计算）
 */
export function getExamTotalScore(selection: ExamQuestionSelection): number {
  return selection.rules.reduce((sum, r) => sum + r.count * r.score, 0);
}

/**
 * Fisher-Yates 洗牌
 */
function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
