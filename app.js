/* ==========================================================================
   عين المعرفة - Main Application Controller
   ========================================================================== */

class AppController {
  constructor() {
    this.userState = {
      points: 100,
      streak: 3,
      completedVideos: [],
      unlockedBadges: ['b_atom']
    };

    this.activeCategory = 'all';
    this.currentPlayingVideo = null;

    this.init();
  }

  init() {
    this.loadUserState();
    this.bindEvents();
    this.renderCategoryTabs();
    this.renderVideosGrid();
    this.updateUserStatsUI();
  }

  loadUserState() {
    const saved = localStorage.getItem('ain_marifa_user');
    if (saved) {
      try {
        this.userState = { ...this.userState, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Failed to parse saved user state', e);
      }
    }
  }

  saveUserState() {
    localStorage.setItem('ain_marifa_user', JSON.stringify(this.userState));
    this.updateUserStatsUI();
  }

  updateUserStatsUI() {
    document.getElementById('user-points').textContent = `${this.userState.points} ⭐`;
    document.getElementById('user-streak').textContent = `${this.userState.streak} أيام 🔥`;
  }

  bindEvents() {
    // Dark mode toggle
    const themeBtn = document.getElementById('theme-toggle-btn');
    themeBtn.addEventListener('click', () => {
      window.soundEngine.playClick();
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      themeBtn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    });

    // Sound toggle
    const soundBtn = document.getElementById('sound-toggle-btn');
    soundBtn.addEventListener('click', () => {
      const enabled = window.soundEngine.toggleSound();
      window.soundEngine.playClick();
      soundBtn.innerHTML = enabled ? '<i class="fas fa-volume-up"></i>' : '<i class="fas fa-volume-mute"></i>';
    });

    // Search bar
    const searchInput = document.getElementById('search-videos-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.renderVideosGrid(e.target.value.trim());
      });
    }

    // Modal Close Buttons
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        window.soundEngine.playClick();
        const targetModal = e.target.closest('.modal-overlay');
        if (targetModal) {
          targetModal.classList.remove('active');
          // If video modal closed, stop video iframe
          const iframe = targetModal.querySelector('iframe');
          if (iframe) {
            iframe.src = iframe.src; // resets iframe video
          }
        }
      });
    });

    // Quiz next button
    document.getElementById('quiz-next-btn').addEventListener('click', () => {
      window.quizController.nextQuestion();
    });

    // Navigation Modals
    document.getElementById('nav-badges-btn').addEventListener('click', () => {
      window.soundEngine.playClick();
      this.openBadgesModal();
    });

    document.getElementById('nav-leaderboard-btn').addEventListener('click', () => {
      window.soundEngine.playClick();
      this.openLeaderboardModal();
    });

    // Post-Video Quiz Start Button inside Video Modal
    document.getElementById('start-quiz-from-video-btn').addEventListener('click', () => {
      window.soundEngine.playClick();
      document.getElementById('video-modal').classList.remove('active');
      const videoIframe = document.querySelector('#video-modal iframe');
      if (videoIframe) videoIframe.src = videoIframe.src;

      if (this.currentPlayingVideo) {
        window.quizController.startQuiz(this.currentPlayingVideo);
      }
    });
  }

  renderCategoryTabs() {
    const tabsContainer = document.getElementById('category-tabs-container');
    if (!tabsContainer) return;

    tabsContainer.innerHTML = '';

    PLATFORM_DATA.categories.forEach(cat => {
      const tab = document.createElement('button');
      tab.className = `category-tab ${this.activeCategory === cat.id ? 'active' : ''}`;
      tab.innerHTML = `<i class="fas ${cat.icon}"></i> ${cat.title}`;

      tab.addEventListener('click', () => {
        window.soundEngine.playClick();
        this.activeCategory = cat.id;
        document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.renderVideosGrid();
      });

      tabsContainer.appendChild(tab);
    });
  }

  renderVideosGrid(searchTerm = '') {
    const grid = document.getElementById('videos-grid');
    if (!grid) return;

    grid.innerHTML = '';

    let filtered = PLATFORM_DATA.videos;

    if (this.activeCategory !== 'all') {
      filtered = filtered.filter(v => v.subject === this.activeCategory);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(v => 
        v.title.toLowerCase().includes(term) || 
        v.description.toLowerCase().includes(term) ||
        v.category.toLowerCase().includes(term)
      );
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
          <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.4;"></i>
          <h3>لم نجد فيديوهات مطابقة لمدخلات البحث!</h3>
          <p>جرّب اختيار تصنيف آخر أو تنظيف شريط البحث.</p>
        </div>
      `;
      return;
    }

    filtered.forEach(video => {
      const isCompleted = this.userState.completedVideos.includes(video.id);

      const card = document.createElement('div');
      card.className = 'video-card';
      card.innerHTML = `
        <div class="video-thumbnail-wrapper" style="background: ${video.thumbnailBg}">
          ${video.svgIcon}
          <div class="play-badge"><i class="fas fa-play"></i></div>
          <span class="duration-tag"><i class="far fa-clock"></i> ${video.duration}</span>
          <span class="subject-badge ${video.subject}">${video.subjectName}</span>
        </div>
        <div class="video-card-content">
          <h3 class="video-card-title">${video.title}</h3>
          <p class="video-card-desc">${video.description}</p>
          <div class="video-card-footer">
            <span class="reward-info"><i class="fas fa-star"></i> +${video.points} نقطة</span>
            <span class="quiz-status-pill ${isCompleted ? 'completed' : 'pending'}">
              ${isCompleted ? 'تم اجتياز الاختبار ✓' : 'اختبار متاح 📝'}
            </span>
          </div>
        </div>
      `;

      card.addEventListener('click', () => {
        window.soundEngine.playClick();
        this.openVideoModal(video);
      });

      grid.appendChild(card);
    });
  }

  openVideoModal(videoObj) {
    this.currentPlayingVideo = videoObj;
    const modal = document.getElementById('video-modal');
    
    document.getElementById('video-modal-title').textContent = videoObj.title;
    document.getElementById('video-modal-subject').textContent = videoObj.subjectName;
    document.getElementById('video-modal-desc').textContent = videoObj.description;

    const iframe = modal.querySelector('iframe');
    if (iframe) {
      iframe.src = `${videoObj.videoUrl}?autoplay=1&rel=0`;
    }

    modal.classList.add('active');
  }

  completeVideoQuiz(videoId, points, badgeId) {
    if (!this.userState.completedVideos.includes(videoId)) {
      this.userState.completedVideos.push(videoId);
      this.userState.points += points;
    }

    if (badgeId && !this.userState.unlockedBadges.includes(badgeId)) {
      this.userState.unlockedBadges.push(badgeId);
    }

    this.saveUserState();
    this.renderVideosGrid();
  }

  openBadgesModal() {
    const modal = document.getElementById('badges-modal');
    const container = document.getElementById('badges-grid-container');
    container.innerHTML = '';

    PLATFORM_DATA.badges.forEach(badge => {
      const isUnlocked = this.userState.unlockedBadges.includes(badge.id);
      const card = document.createElement('div');
      card.className = `badge-card ${isUnlocked ? 'unlocked' : ''}`;
      card.innerHTML = `
        <div class="badge-icon">${badge.title.split(' ').pop()}</div>
        <div class="badge-title">${badge.title}</div>
        <div class="badge-desc">${isUnlocked ? badge.desc : '🔒 شاهد الفيديو وحل الاختبار لفتح الشارة'}</div>
      `;
      container.appendChild(card);
    });

    modal.classList.add('active');
  }

  openLeaderboardModal() {
    const modal = document.getElementById('leaderboard-modal');
    const container = document.getElementById('leaderboard-list-container');
    container.innerHTML = '';

    // Create realistic leaderboard combining user with static data
    const listData = [...PLATFORM_DATA.leaderboard];
    
    // Check if current student beats existing ones
    const currentStudent = {
      rank: 0,
      name: 'أنت (بطل 1 إعدادي)',
      points: this.userState.points,
      badgeCount: this.userState.unlockedBadges.length,
      avatar: '🌟'
    };

    listData.push(currentStudent);
    listData.sort((a, b) => b.points - a.points);

    listData.forEach((item, index) => {
      const rank = index + 1;
      const row = document.createElement('div');
      row.className = 'leaderboard-item';
      if (item.name.includes('أنت')) {
        row.style.background = 'var(--primary-light)';
        row.style.borderColor = 'var(--primary)';
      }

      row.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.85rem;">
          <div class="leaderboard-rank rank-${rank <= 3 ? rank : 'other'}">${rank}</div>
          <span style="font-size: 1.3rem;">${item.avatar}</span>
          <strong style="font-size: 1.05rem;">${item.name}</strong>
        </div>
        <div style="font-weight: 800; color: var(--accent-gold);">
          ⭐ ${item.points} نقطة
        </div>
      `;
      container.appendChild(row);
    });

    modal.classList.add('active');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.appController = new AppController();
});
