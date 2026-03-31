class MathEngine {
  constructor(operations, difficulty) {
    this.operations = (operations && operations.length > 0) ? operations : ['+'];
    this.difficulty  = difficulty || 'easy';
    this.currentQuestion  = null;
    this.lastQuestionString = null;
  }

  _randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Returns { question, answer, operation }
  _buildQuestion() {
    const { min, max } = CONFIG.DIFFICULTIES[this.difficulty];
    const op = this.operations[this._randInt(0, this.operations.length - 1)];
    let a, b, answer, question;

    if (op === '+') {
      a = this._randInt(min, max);
      b = this._randInt(min, max);
      answer   = a + b;
      question = `${a} + ${b} = ?`;
    } else if (op === '-') {
      a = this._randInt(min, max);
      b = this._randInt(min, a);
      answer   = a - b;
      question = `${a} \u2212 ${b} = ?`;
    } else if (op === '*') {
      a = this._randInt(min, max);
      const bMax = this.difficulty === 'hard' ? 12 : max;
      b = this._randInt(min, bMax);
      answer   = a * b;
      question = `${a} \u00d7 ${b} = ?`;
    } else if (op === '/') {
      const result = this._randInt(min, max);
      b = this._randInt(Math.max(min, 1), max);
      a = result * b;
      answer   = result;
      question = `${a} \u00f7 ${b} = ?`;
    } else {
      a = this._randInt(min, max);
      b = this._randInt(min, max);
      answer   = a + b;
      question = `${a} + ${b} = ?`;
    }

    return { question, answer, operation: op };
  }

  _generateChoices(answer) {
    const offsets = [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5];
    const chosen  = new Set([answer]);
    const choices = [answer];

    let attempts = 0;
    while (choices.length < 4 && attempts < 100) {
      attempts++;
      const offset    = offsets[this._randInt(0, offsets.length - 1)];
      const candidate = answer + offset;
      if (candidate < 0)         continue;
      if (chosen.has(candidate)) continue;
      chosen.add(candidate);
      choices.push(candidate);
    }

    // Fisher-Yates shuffle
    for (let i = choices.length - 1; i > 0; i--) {
      const j    = this._randInt(0, i);
      const temp = choices[i];
      choices[i] = choices[j];
      choices[j] = temp;
    }
    return choices;
  }

  // Single question (maintains currentQuestion + lastQuestion state)
  generateQuestion() {
    let qData;
    let retries = 0;
    do {
      const built   = this._buildQuestion();
      const choices = this._generateChoices(built.answer);
      qData = { ...built, choices };
      retries++;
    } while (retries < 3 && qData.question === this.lastQuestionString);

    this.lastQuestionString = qData.question;
    this.currentQuestion    = qData;
    return this.currentQuestion;
  }

  // Generate a batch of n questions, avoiding consecutive repeats within the batch
  generateBatch(n) {
    const questions = [];
    let lastQ = this.lastQuestionString;

    for (let i = 0; i < n; i++) {
      let qData;
      let tries = 0;
      do {
        const built   = this._buildQuestion();
        const choices = this._generateChoices(built.answer);
        qData = { ...built, choices };
        tries++;
      } while (tries < 3 && qData.question === lastQ);

      lastQ = qData.question;
      questions.push(qData);
    }

    this.lastQuestionString = lastQ;
    return questions;
  }

  validate(userAnswer) {
    if (this.currentQuestion === null) return false;
    const parsed = parseInt(userAnswer, 10);
    return !isNaN(parsed) && parsed === this.currentQuestion.answer;
  }

  // Generate a boss question using hard difficulty regardless of selected difficulty
  generateBossQuestion() {
    const savedDifficulty = this.difficulty;
    this.difficulty = 'hard';
    const q = this.generateQuestion();
    this.difficulty = savedDifficulty;
    return q;
  }

  getCurrentQuestion() { return this.currentQuestion; }
}
