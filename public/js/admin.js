class InfoboardAdmin {
  constructor() {
    this.token = localStorage.getItem('adminToken');
    this.currentEditId = null;
    this.currentPage = 1;
    
    if (this.token) {
      this.showDashboard();
      this.loadPosts();
    } else {
      this.showLogin();
    }
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.handleLogout());
    }

    // Navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => this.switchSection(e.target.dataset.section));
    });

    // Create post form
    const createForm = document.getElementById('createPostForm');
    if (createForm) {
      createForm.addEventListener('submit', (e) => this.handleCreatePost(e));
      document.getElementById('postImage').addEventListener('change', (e) => this.previewImage(e, 'imagePreview'));
    }

    // Edit modal
    const closeEditModal = document.getElementById('closeEditModal');
    if (closeEditModal) {
      closeEditModal.addEventListener('click', () => this.closeEditModal());
    }

    const editForm = document.getElementById('editPostForm');
    if (editForm) {
      editForm.addEventListener('submit', (e) => this.handleEditPost(e));
      document.getElementById('editPostImage').addEventListener('change', (e) => this.previewImage(e, 'editImagePreview'));
    }

    const deletePostBtn = document.getElementById('deletePostBtn');
    if (deletePostBtn) {
      deletePostBtn.addEventListener('click', () => this.handleDeletePost());
    }

    // Refresh and search
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.loadPosts());
    }

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', () => this.handleSearch());
    }
  }

  async handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');
    
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (!response.ok) {
        throw new Error('Login failed');
      }
      
      const data = await response.json();
      localStorage.setItem('adminToken', data.token);
      this.token = data.token;
      
      this.showDashboard();
      this.loadPosts();
    } catch (err) {
      errorDiv.textContent = 'Invalid credentials';
      errorDiv.style.display = 'block';
      console.error('Login error:', err);
    }
  }

  handleLogout() {
    localStorage.removeItem('adminToken');
    this.token = null;
    this.showLogin();
  }

  showLogin() {
    document.getElementById('loginPage').style.display = 'block';
    document.getElementById('dashboardPage').style.display = 'none';
    document.querySelector('.admin-header').style.display = 'none';
  }

  showDashboard() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('dashboardPage').style.display = 'block';
    document.querySelector('.admin-header').style.display = 'flex';
  }

  switchSection(section) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(section + 'Section').classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    event.target.classList.add('active');
  }

  async loadPosts(page = 1) {
    this.currentPage = page;
    const postsList = document.getElementById('postsList');
    postsList.innerHTML = '<div class="loading">Loading posts...</div>';
    
    try {
      const response = await fetch(`/api/admin/posts?page=${page}`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load posts');
      }
      
      const data = await response.json();
      this.displayPosts(data.posts);
      this.displayPagination(data.total, data.pageSize);
    } catch (err) {
      postsList.innerHTML = '<div class="loading">Failed to load posts</div>';
      console.error('Error loading posts:', err);
    }
  }

  displayPosts(posts) {
    const postsList = document.getElementById('postsList');
    
    if (posts.length === 0) {
      postsList.innerHTML = '<div class="loading">No posts found</div>';
      return;
    }
    
    postsList.innerHTML = posts.map(post => `
      <div class="post-item" onclick="admin.editPost(${post.id})">
        <div class="post-info">
          <h3>${this.escapeHtml(post.title)}</h3>
          <div class="post-meta">${this.escapeHtml(post.content.substring(0, 100))}...</div>
          <div class="post-time">
            ${new Date(post.start_time).toLocaleString()} → ${new Date(post.end_time).toLocaleString()}
          </div>
        </div>
        <div class="post-actions" onclick="event.stopPropagation();">
          <button class="btn btn-secondary" onclick="admin.editPost(${post.id})">Edit</button>
        </div>
      </div>
    `).join('');
  }

  displayPagination(total, pageSize) {
    const pages = Math.ceil(total / pageSize);
    const pagination = document.getElementById('pagination');
    
    if (pages <= 1) {
      pagination.innerHTML = '';
      return;
    }
    
    pagination.innerHTML = Array.from({ length: pages }, (_, i) => `
      <button class="${i + 1 === this.currentPage ? 'active' : ''}" onclick="admin.loadPosts(${i + 1})">
        ${i + 1}
      </button>
    `).join('');
  }

  async handleCreatePost(e) {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('title', document.getElementById('postTitle').value);
    formData.append('content', document.getElementById('postContent').value);
    formData.append('startTime', document.getElementById('postStartTime').value);
    formData.append('endTime', document.getElementById('postEndTime').value);
    
    const imageFile = document.getElementById('postImage').files[0];
    if (imageFile) {
      formData.append('image', imageFile);
    }
    
    const errorDiv = document.getElementById('createError');
    const successDiv = document.getElementById('createSuccess');
    
    try {
      const response = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.token}` },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to create post');
      }
      
      successDiv.textContent = 'Post created successfully!';
      successDiv.classList.add('show');
      errorDiv.classList.remove('show');
      
      e.target.reset();
      document.getElementById('imagePreview').innerHTML = '';
      
      setTimeout(() => {
        this.loadPosts();
        this.switchSection('posts');
      }, 1500);
    } catch (err) {
      errorDiv.textContent = err.message;
      errorDiv.classList.add('show');
      successDiv.classList.remove('show');
      console.error('Error creating post:', err);
    }
  }

  async editPost(id) {
    try {
      const response = await fetch(`/api/admin/posts/${id}`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load post');
      }
      
      const post = await response.json();
      this.currentEditId = post.id;
      
      document.getElementById('editPostTitle').value = post.title;
      document.getElementById('editPostContent').value = post.content;
      document.getElementById('editPostStartTime').value = post.start_time.replace('Z', '').slice(0, 16);
      document.getElementById('editPostEndTime').value = post.end_time.replace('Z', '').slice(0, 16);
      
      // Clear the file input so old files don't get reused
      document.getElementById('editPostImage').value = '';
      
      if (post.image_path) {
        document.getElementById('editImagePreview').innerHTML = `<img src="${post.image_path}" alt="Preview">`;
      } else {
        document.getElementById('editImagePreview').innerHTML = '';
      }
      
      document.getElementById('editModal').style.display = 'flex';
    } catch (err) {
      alert('Failed to load post');
      console.error('Error editing post:', err);
    }
  }

  closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    document.getElementById('editPostImage').value = '';
    document.getElementById('editImagePreview').innerHTML = '';
    this.currentEditId = null;
  }

  async handleEditPost(e) {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('title', document.getElementById('editPostTitle').value);
    formData.append('content', document.getElementById('editPostContent').value);
    formData.append('startTime', document.getElementById('editPostStartTime').value);
    formData.append('endTime', document.getElementById('editPostEndTime').value);
    
    const imageFile = document.getElementById('editPostImage').files[0];
    if (imageFile) {
      formData.append('image', imageFile);
    }
    
    const errorDiv = document.getElementById('editError');
    
    try {
      const response = await fetch(`/api/admin/posts/${this.currentEditId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${this.token}` },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to update post');
      }
      
      this.closeEditModal();
      this.loadPosts(this.currentPage);
    } catch (err) {
      errorDiv.textContent = err.message;
      errorDiv.classList.add('show');
      console.error('Error updating post:', err);
    }
  }

  async handleDeletePost() {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/posts/${this.currentEditId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete post');
      }
      
      this.closeEditModal();
      this.loadPosts(this.currentPage);
    } catch (err) {
      alert('Failed to delete post: ' + err.message);
      console.error('Error deleting post:', err);
    }
  }

  previewImage(e, previewId) {
    const file = e.target.files[0];
    const preview = document.getElementById(previewId);
    
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        preview.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
      };
      reader.readAsDataURL(file);
    } else {
      preview.innerHTML = '';
    }
  }

  handleSearch() {
    // Implement client-side filtering
    const query = document.getElementById('searchInput').value.toLowerCase();
    const postItems = document.querySelectorAll('.post-item');
    
    postItems.forEach(item => {
      const title = item.querySelector('h3').textContent.toLowerCase();
      const content = item.querySelector('.post-meta').textContent.toLowerCase();
      
      if (title.includes(query) || content.includes(query)) {
        item.style.display = '';
      } else {
        item.style.display = 'none';
      }
    });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize on page load
let admin;
document.addEventListener('DOMContentLoaded', () => {
  admin = new InfoboardAdmin();
});
