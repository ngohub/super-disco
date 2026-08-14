/* ==========================================================================
   عين المعرفة - Post-Video Quiz Controller
   ========================================================================== */

class QuizController {
  constructor() {
    this.currentVideo = null;
    this.currentIndex = 0;
    this.score = 0;
    this.userAnswers = [];
    this.hasAnsweredCurrent = false;

    this.modalOverlay = document.getElementById('quiz-modal');
    this.progressFill = document.getElementById('quiz-progress-fill');
    this.counterText = document.getElementById('quiz-counter');
    this.questionTitle = document.getElementById('quiz-question-title');
    this.optionsGrid = document.getElementById('quiz-options-grid');
    this.explanationBox = document.getElementById('quiz-explanation-box');
    this.nextBtn = document.getElementById('quiz-next-btn');
    this.resultContainer = document.getElementById('quiz-result-view');
    this.questionContainer = document.getElementById('quiz-question-view');
  }

  startQuiz(videoObj) {
    this.currentVideo = videoObj;
    this.currentIndex = 0;
    this.score = 0;
    this.userAnswers = [];
    this.hasAnsweredCurrent = false;

    // Reset views
    this.questionContainer.style.display = 'block';
    this.resultContainer.style.display = 'none';

    // Show modal
    this.modalOverlay.classList.add('active');
    this.renderQuestion();
  }

  renderQuestion() {
    const q = this.currentVideo.questions[this.currentIndex];
    const total = this.currentVideo.questions.length;
    this.hasAnsweredCurrent = false;

    // Progress Bar
    const progressPercent = ((this.currentIndex + 1) / total) * 100;
    this.progressFill.style.width = `${progressPercent}%`;

    // Counter
    this.counterText.textContent = `السؤال ${this.currentIndex + 1} من ${total}`;

    // Question title
    this.questionTitle.textContent = q.text;

    // Clear Options & Explanation
    this.optionsGrid.innerHTML = '';
    this.explanationBox.style.display = 'none';
    this.explanationBox.textContent = '';
    this.nextBtn.style.display = 'none';

    // Render Options
    q.options.forEach((optText, index) => {
      const optionCard = document.createElement('div');
      optionCard.className = 'quiz-option-card';
      optionCard.innerHTML = `
        <span>${optText}</span>
        <i class="far fa-circle option-check-icon"></i>
      `;

      optionCard.addEventListener('click', () => {
        if (!this.hasAnsweredCurrent) {
          this.handleAnswerSelection(index, q, optionCard);
        }
      });

      this.optionsGrid.appendChild(optionCard);
    });
  }

  handleAnswerSelection(selectedIndex, questionObj, selectedCard) {
    this.hasAnsweredCurrent = true;
    const allCards = this.optionsGrid.children;
    const isCorrect = selectedIndex === questionObj.correct;

    // Disable clicks on all options
    Array.from(allCards).forEach(card => card.classList.add('disabled'));

    if (isCorrect) {
      this.score++;
      selectedCard.classList.add('correct');
      selectedCard.querySelector('.option-check-icon').className = 'fas fa-check-circle';
      window.soundEngine.playCorrect();
    } else {
      selectedCard.classList.add('incorrect');
      selectedCard.querySelector('.option-check-icon').className = 'fas fa-times-circle';
      
      // Highlight the correct one
      allCards[questionObj.correct].classList.add('correct');
      allCards[questionObj.correct].querySelector('.option-check-icon').className = 'fas fa-check-circle';
      window.soundEngine.playWrong();
    }

    // Show Explanation
    this.explanationBox.innerHTML = `<strong>💡 التوضيح العلمي:</strong> ${questionObj.explanation}`;
    this.explanationBox.style.display = 'block';

    // Next Button text adjustment
    const isLast = this.currentIndex === this.currentVideo.questions.length - 1;
    this.nextBtn.textContent = isLast ? 'عرض النتيجة النهائية 🏆' : 'السؤال التالي ⬅️';
    this.nextBtn.style.display = 'inline-flex';
  }

  nextQuestion() {
    window.soundEngine.playClick();
    this.currentIndex++;

    if (this.currentIndex < this.currentVideo.questions.length) {
      this.renderQuestion();
    } else {
      this.showResults();
    }
  }

  showResults() {
    this.questionContainer.style.display = 'none';
    this.resultContainer.style.display = 'block';

    const total = this.currentVideo.questions.length;
    const percentage = Math.round((this.score / total) * 100);

    const scoreBadge = document.getElementById('quiz-result-score');
    const title = document.getElementById('quiz-result-title');
    const desc = document.getElementById('quiz-result-desc');

    scoreBadge.textContent = `${this.score} من ${total} (${percentage}%)`;

    if (percentage >= 60) {
      title.textContent = 'رائع جداً! أحسنت صنعاً 🌟';
      desc.textContent = `لقد اجتزت اختبار درس "${this.currentVideo.title}" بنجاح وحصلت على +${this.currentVideo.points} نقطة وسام الشرف!`;
      window.soundEngine.playFanfare();
      this.triggerConfetti();

      // Dispatch event to main app to save progress & points
      if (window.appController) {
        window.appController.completeVideoQuiz(this.currentVideo.id, this.currentVideo.points, this.currentVideo.badgeId);
      }
    } else {
      title.textContent = 'حاول مرة أخرى! 💪';
      desc.textContent = 'يمكنك إعادة مشاهدة الفيديو الوثائقي وإعادة الاختبار لتحقيق العلامة الكاملة والحصول على النقاط.';
    }
  }

  closeModal() {
    this.modalOverlay.classList.remove('active');
  }

  triggerConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        r: Math.random() * 8 + 4,
        d: Math.random() * 25 + 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 10 - 10,
        tiltAngleIncremental: Math.random() * 0.07 + 0.05,
        tiltAngle: 0
      });
    }

    let animationFrame;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.tilt = Math.sin(p.tiltAngle) * 15;

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();

        if (p.y > canvas.height) {
          particles[i] = {
            x: Math.random() * canvas.width,
            y: -20,
            r: p.r,
            d: p.d,
            color: p.color,
            tilt: p.tilt,
            tiltAngleIncremental: p.tiltAngleIncremental,
            tiltAngle: p.tiltAngle
          };
        }
      });

      animationFrame = requestAnimationFrame(render);
    };

    render();

    setTimeout(() => {
      cancelAnimationFrame(animationFrame);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, 4500);
  }
}

window.quizController = new QuizController();
