interface CharInfo {
  char: string;
  isCorrect: boolean;
  isReplaced: boolean; // серый цвет
}

/**
 * Вычисляет расстояние Левенштейна и строит оптимальное выравнивание
 */
function levenshteinAlignment(input: string, correct: string): { inputAligned: string[], correctAligned: string[] } {
  const m = input.length;
  const n = correct.length;

  // DP таблица для расстояния
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  // Инициализация
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  // Заполнение таблицы
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (input[i - 1] === correct[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // удаление
          dp[i][j - 1] + 1,     // вставка
          dp[i - 1][j - 1] + 1  // замена
        );
      }
    }
  }

  // Backtracking для построения выравнивания
  const inputAligned: string[] = [];
  const correctAligned: string[] = [];

  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && input[i - 1] === correct[j - 1]) {
      // Совпадение
      inputAligned.unshift(input[i - 1]);
      correctAligned.unshift(correct[j - 1]);
      i--;
      j--;
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      // Замена
      inputAligned.unshift(input[i - 1]);
      correctAligned.unshift(correct[j - 1]);
      i--;
      j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      // Удаление (лишняя буква в input)
      inputAligned.unshift(input[i - 1]);
      correctAligned.unshift('-'); // пропуск в correct
      i--;
    } else if (j > 0 && dp[i][j] === dp[i][j - 1] + 1) {
      // Вставка (пропущенная буква в input)
      inputAligned.unshift('-'); // пропуск в input - показываем как "-"
      correctAligned.unshift(correct[j - 1]);
      j--;
    } else {
      // Fallback
      if (i > 0) {
        inputAligned.unshift(input[i - 1]);
        correctAligned.unshift('-');
        i--;
      } else if (j > 0) {
        inputAligned.unshift('-');
        correctAligned.unshift(correct[j - 1]);
        j--;
      }
    }
  }

  return { inputAligned, correctAligned };
}

/**
 * Улучшенное сравнение слов с использованием алгоритма Левенштейна
 */
export const compareWords = (input: string, correct: string): CharInfo[] => {
  const { inputAligned, correctAligned } = levenshteinAlignment(input, correct);
  const result: CharInfo[] = [];

  for (let i = 0; i < inputAligned.length; i++) {
    const inputChar = inputAligned[i];
    const correctChar = correctAligned[i];

    if (inputChar === '-') {
      // Пропущенная буква - показываем как "-" серым
      result.push({
        char: '-',
        isCorrect: false,
        isReplaced: true, // серый цвет
      });
    } else if (inputChar === correctChar) {
      // Совпадение - зеленый
      result.push({
        char: inputChar,
        isCorrect: true,
        isReplaced: false,
      });
    } else {
      // Несовпадение или замена - красный
      result.push({
        char: inputChar,
        isCorrect: false,
        isReplaced: false,
      });
    }
  }

  return result;
};

/**
 * Проверяет, полностью ли совпадает введенное слово с правильным
 */
export const isWordCorrect = (input: string, correct: string): boolean => {
  return input === correct;
};

/**
 * Выравнивание правильного слова с использованием алгоритма Левенштейна
 */
export const getCorrectWithMissing = (input: string, correct: string): CharInfo[] => {
  const { inputAligned, correctAligned } = levenshteinAlignment(input, correct);
  const result: CharInfo[] = [];

  for (let i = 0; i < correctAligned.length; i++) {
    const inputChar = inputAligned[i];
    const correctChar = correctAligned[i];

    if (correctChar === '-') {
      // Лишняя буква в input - не показываем в нижней строке
      continue;
    }

    if (inputChar === correctChar) {
      // Совпадение - зеленый
      result.push({
        char: correctChar,
        isCorrect: true,
        isReplaced: false,
      });
    } else if (inputChar === '-') {
      // Пропущенная буква в input - показываем правильную букву зеленым
      result.push({
        char: correctChar,
        isCorrect: true,
        isReplaced: false,
      });
    } else {
      // Замена - серый
      result.push({
        char: correctChar,
        isCorrect: false,
        isReplaced: true,
      });
    }
  }

  return result;
};
