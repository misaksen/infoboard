class InfoboardDisplay {
  constructor() {
    this.posts = [];
    this.currentIndex = parseInt(localStorage.getItem('currentPostIndex')) || 0;
    this.refreshInterval = parseInt(localStorage.getItem('refreshInterval')) || 30000;
    this.autoRefreshEnabled = localStorage.getItem('autoRefresh') !== 'false';
    this.autoCycleEnabled = localStorage.getItem('autoCycle') !== 'false';
    this.cyclePaused = false;
    
    this.postDisplay = document.getElementById('postDisplay');
    this.controls = document.getElementById('controls');
    this.prevBtn = document.getElementById('prevBtn');
    this.nextBtn = document.getElementById('nextBtn');
    this.currentPostSpan = document.getElementById('currentPost');
    this.totalPostsSpan = document.getElementById('totalPosts');
    this.countdownEl = document.getElementById('countdown');
    this.countdownValueSpan = document.getElementById('countdownValue');
    this.nextCycleTime = null;
    
    this.setupEventListeners();
    this.fetchAndDisplay();
    
    if (this.autoRefreshEnabled) {
      setInterval(() => this.fetchAndDisplay(), this.refreshInterval);
    }
    
    if (this.autoCycleEnabled) {
      this.startAutoCycle();
    }
    
    setInterval(() => this.updateCountdown(), 1000);
  }
  
  startAutoCycle() {
    this.nextCycleTime = Date.now() + this.refreshInterval;
    this.autoCycleInterval = setInterval(() => {
      if (!this.cyclePaused && this.posts.length > 1) {
        this.nextPost();
      }
      this.nextCycleTime = Date.now() + this.refreshInterval;
    }, this.refreshInterval);
  }
  
  stopAutoCycle() {
    if (this.autoCycleInterval) {
      clearInterval(this.autoCycleInterval);
    }
  }

  updateCountdown() {
    if (!this.countdownEl) return;
    
    if (!this.autoCycleEnabled || this.posts.length <= 1 || !this.nextCycleTime) {
      this.countdownEl.style.display = 'none';
      return;
    }
    
    const remainingMs = Math.max(0, this.nextCycleTime - Date.now());
    this.countdownValueSpan.textContent = Math.ceil(remainingMs / 1000);
    this.countdownEl.style.display = 'block';
  }

  setupEventListeners() {
    this.prevBtn.addEventListener('click', () => {
      this.cyclePaused = true;
      this.previousPost();
      setTimeout(() => { this.cyclePaused = false; }, 2000);
    });
    
    this.nextBtn.addEventListener('click', () => {
      this.cyclePaused = true;
      this.nextPost();
      setTimeout(() => { this.cyclePaused = false; }, 2000);
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        this.cyclePaused = true;
        this.previousPost();
        setTimeout(() => { this.cyclePaused = false; }, 2000);
      }
      if (e.key === 'ArrowRight') {
        this.cyclePaused = true;
        this.nextPost();
        setTimeout(() => { this.cyclePaused = false; }, 2000);
      }
    });
  }

  async fetchAndDisplay() {
    try {
      const response = await fetch('/api/public/posts/active');
      
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      
      const data = await response.json();
      this.posts = data.posts || [];
      
      // Keep current index if still valid, otherwise reset
      if (this.currentIndex >= this.posts.length) {
        this.currentIndex = 0;
      }
      
      this.displayPost();
    } catch (err) {
      console.error('Error fetching posts:', err);
      this.postDisplay.innerHTML = `
        <div class="error-message">
          <p>Failed to load posts</p>
          <p style="font-size: 14px; margin-top: 10px;">Check your connection and refresh.</p>
        </div>
      `;
      this.controls.style.display = 'none';
    }
  }

  displayPost() {
    if (this.posts.length === 0) {
      this.postDisplay.innerHTML = '<div class="no-posts">No active posts at the moment</div>';
      this.controls.style.display = 'none';
      this.updateCountdown();
      return;
    }
    
    const post = this.posts[this.currentIndex];
    
    // Save current index to localStorage
    localStorage.setItem('currentPostIndex', this.currentIndex);
    
    let html = '<div class="post-content">';
    
    if (post.title) {
      html += `<h1 class="post-title">${this.escapeHtml(post.title)}</h1>`;
    }
    
    if (post.image_path) {
      html += `<img src="${this.escapeHtml(post.image_path)}" alt="${this.escapeHtml(post.title)}" class="post-image">`;
    }
    
    if (post.content) {
      html += `<div class="post-text">${this.escapeHtml(post.content)}</div>`;
    }
    
    html += '</div>';
    
    this.postDisplay.innerHTML = html;
    
    if (this.posts.length > 1) {
      this.controls.style.display = 'flex';
      this.currentPostSpan.textContent = this.currentIndex + 1;
      this.totalPostsSpan.textContent = this.posts.length;
      
      // Show buttons as always enabled (for continuous cycling)
      this.prevBtn.disabled = false;
      this.nextBtn.disabled = false;
      
      // Add cycling indicator to buttons
      this.prevBtn.title = 'Previous post (or auto-cycle)';
      this.nextBtn.title = 'Next post (or auto-cycle)';
    } else {
      this.controls.style.display = 'none';
    }
    
    this.updateCountdown();
  }

  previousPost() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    } else {
      // Cycle to end when at start
      this.currentIndex = this.posts.length - 1;
    }
    this.displayPost();
  }

  nextPost() {
    if (this.currentIndex < this.posts.length - 1) {
      this.currentIndex++;
    } else {
      // Cycle back to start when at end
      this.currentIndex = 0;
    }
    this.displayPost();
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  new InfoboardDisplay();
});
