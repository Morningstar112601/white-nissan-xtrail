// admin.js — Admin Control Panel Application Script

let token = localStorage.getItem('admin_token') || '';

document.addEventListener('DOMContentLoaded', () => {
  initApp();
  setupEventListeners();
});

// App Initialization
async function initApp() {
  if (token) {
    const valid = await checkAuthStatus();
    if (valid) {
      showDashboard();
      loadAllData();
      return;
    }
  }
  showLogin();
}

// Authentication Check
async function checkAuthStatus() {
  try {
    const res = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      document.getElementById('display-admin-name').textContent = data.user.username;
      return true;
    }
  } catch (err) {
    console.error('Auth verify error:', err);
  }
  localStorage.removeItem('admin_token');
  token = '';
  return false;
}

function showLogin() {
  document.getElementById('login-section').classList.remove('hidden');
  document.getElementById('dashboard-section').classList.add('hidden');
}

function showDashboard() {
  document.getElementById('login-section').classList.add('hidden');
  document.getElementById('dashboard-section').classList.remove('hidden');
}

// Event Listeners Setup
function setupEventListeners() {
  // Login Form
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (res.ok) {
        token = data.token;
        localStorage.setItem('admin_token', token);
        showToast('Login successful!', 'success');
        showDashboard();
        loadAllData();
      } else {
        showToast(data.error || 'Invalid credentials', 'error');
      }
    } catch (err) {
      showToast('Network error during login', 'error');
    }
  });

  // Logout Button
  document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('admin_token');
    token = '';
    showToast('Logged out', 'success');
    showLogin();
  });

  // Tab Navigation
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');
      switchTab(tabName);
    });
  });

  // Quick Add Project
  document.getElementById('quick-add-project-btn').addEventListener('click', () => {
    openProjectModal();
  });

  // Forms Submit Handlers
  document.getElementById('project-form').addEventListener('submit', handleSaveProject);
  document.getElementById('skill-form').addEventListener('submit', handleSaveSkill);
  document.getElementById('experience-form').addEventListener('submit', handleSaveExperience);
  document.getElementById('resume-upload-form').addEventListener('submit', handleUploadResume);
  document.getElementById('settings-profile-form').addEventListener('submit', handleSaveSettings);
  document.getElementById('change-password-form').addEventListener('submit', handleChangePassword);
  document.getElementById('custom-field-form').addEventListener('submit', handleAddCustomField);
  
  const projSettingsForm = document.getElementById('projects-page-settings-form');
  if (projSettingsForm) {
    projSettingsForm.addEventListener('submit', handleSaveSettings);
  }
}

// Tab Switching
function switchTab(tabName) {
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

  const activeBtn = document.querySelector(`.sidebar-nav .nav-item[data-tab="${tabName}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  const activePane = document.getElementById(`tab-${tabName}`);
  if (activePane) activePane.classList.add('active');

  const titleMap = {
    overview: 'Dashboard Overview',
    projects: 'Projects Manager',
    skills: 'Technical Skills',
    experience: 'Experience & Resume',
    messages: 'Contact Messages Inbox',
    settings: 'Site & Security Settings'
  };
  document.getElementById('page-title').textContent = titleMap[tabName] || 'Dashboard';
}

// Data Loader
async function loadAllData() {
  await Promise.all([
    loadOverviewStats(),
    loadProjects(),
    loadSkills(),
    loadExperience(),
    loadMessages(),
    loadSettings()
  ]);
}

// OVERVIEW & STATS
async function loadOverviewStats() {
  try {
    const [projects, skills, experiences, messages] = await Promise.all([
      fetch('/api/projects').then(r => r.json()),
      fetch('/api/skills').then(r => r.json()),
      fetch('/api/experience').then(r => r.json()),
      fetch('/api/contact', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json())
    ]);

    document.getElementById('stat-projects').textContent = projects.length || 0;
    document.getElementById('stat-skills').textContent = skills.length || 0;
    document.getElementById('stat-experiences').textContent = experiences.length || 0;
    
    const messageList = Array.isArray(messages) ? messages : [];
    document.getElementById('stat-messages').textContent = messageList.length;

    const unreadCount = messageList.filter(m => !m.is_read).length;
    document.getElementById('unread-count').textContent = unreadCount;

    // Featured projects preview
    const featuredList = projects.filter(p => p.is_featured);
    const featuredContainer = document.getElementById('overview-featured-projects');
    if (featuredList.length === 0) {
      featuredContainer.innerHTML = `<p class="muted">No featured projects set.</p>`;
    } else {
      featuredContainer.innerHTML = featuredList.map(p => `
        <div style="padding: 10px 0; border-bottom: 1px solid var(--admin-border);">
          <strong>${p.title}</strong>
          <p style="margin: 4px 0 0; font-size: 0.85rem; color: var(--admin-text-muted);">${p.description}</p>
        </div>
      `).join('');
    }

    // Recent messages preview
    const recentMessagesContainer = document.getElementById('overview-recent-messages');
    if (messageList.length === 0) {
      recentMessagesContainer.innerHTML = `<p class="muted">No messages received yet.</p>`;
    } else {
      recentMessagesContainer.innerHTML = messageList.slice(0, 3).map(m => `
        <div style="padding: 10px 0; border-bottom: 1px solid var(--admin-border);">
          <div style="display:flex; justify-content:space-between;">
            <strong>${m.sender_name}</strong>
            <span style="font-size:0.75rem; color:var(--admin-text-muted);">${new Date(m.created_at).toLocaleDateString()}</span>
          </div>
          <p style="margin: 4px 0 0; font-size: 0.85rem; color: var(--admin-text-muted);">${m.subject || 'Inquiry'}</p>
        </div>
      `).join('');
    }

  } catch (err) {
    console.error('Stats loading error:', err);
  }
}

// PROJECTS
async function loadProjects() {
  try {
    const res = await fetch('/api/projects');
    const projects = await res.json();
    const container = document.getElementById('admin-projects-list');

    if (!projects.length) {
      container.innerHTML = `<p class="muted">No projects found. Click 'Add Project' to create one.</p>`;
      return;
    }

    container.innerHTML = projects.map(p => `
      <div class="admin-project-card">
        <div class="project-img-wrapper">
          <img src="${p.image_url || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800'}" alt="${p.title}">
          ${p.is_featured ? `<span class="featured-badge"><i class="fa-solid fa-star"></i> Featured</span>` : ''}
        </div>
        <div class="project-card-body">
          <h4>${p.title}</h4>
          <p>${p.description}</p>
          <div class="project-tags-list">
            ${(p.tags || '').split(',').filter(Boolean).map(t => `<span class="tag-chip">${t.trim()}</span>`).join('')}
          </div>
          <div class="card-actions">
            <button class="btn btn-outline btn-sm" onclick="editProject(${p.id})"><i class="fa-solid fa-pen"></i> Edit</button>
            <button class="btn btn-danger-outline btn-sm" onclick="deleteProject(${p.id})"><i class="fa-solid fa-trash"></i> Delete</button>
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    showToast('Failed to load projects', 'error');
  }
}

function openProjectModal(project = null) {
  document.getElementById('project-form').reset();
  if (project) {
    document.getElementById('project-modal-title').innerHTML = '<i class="fa-solid fa-pen"></i> Edit Project';
    document.getElementById('project-id').value = project.id;
    document.getElementById('project-title').value = project.title;
    document.getElementById('project-description').value = project.description;
    document.getElementById('project-detailed_desc').value = project.detailed_desc || '';
    document.getElementById('project-tags').value = project.tags || '';
    document.getElementById('project-live_url').value = project.live_url || '';
    document.getElementById('project-github_url').value = project.github_url || '';
    
    const imgUrls = project.images && project.images.length ? project.images.join(', ') : (project.image_url || '');
    document.getElementById('project-image_urls').value = imgUrls;
    document.getElementById('project-display_order').value = project.display_order || 0;
    document.getElementById('project-is_featured').checked = !!project.is_featured;
  } else {
    document.getElementById('project-modal-title').innerHTML = '<i class="fa-solid fa-folder-plus"></i> Add New Project';
    document.getElementById('project-id').value = '';
  }
  document.getElementById('project-modal').classList.remove('hidden');
}

function closeProjectModal() {
  document.getElementById('project-modal').classList.add('hidden');
}

async function editProject(id) {
  const res = await fetch(`/api/projects/${id}`);
  const project = await res.json();
  openProjectModal(project);
}

async function deleteProject(id) {
  if (!confirm('Are you sure you want to delete this project?')) return;
  try {
    const res = await fetch(`/api/projects/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      showToast('Project deleted', 'success');
      loadProjects();
      loadOverviewStats();
    } else {
      showToast('Failed to delete project', 'error');
    }
  } catch (err) {
    showToast('Error deleting project', 'error');
  }
}

async function handleSaveProject(e) {
  e.preventDefault();
  const id = document.getElementById('project-id').value;
  const formData = new FormData();

  formData.append('title', document.getElementById('project-title').value);
  formData.append('description', document.getElementById('project-description').value);
  formData.append('detailed_desc', document.getElementById('project-detailed_desc').value);
  formData.append('tags', document.getElementById('project-tags').value);
  formData.append('live_url', document.getElementById('project-live_url').value);
  formData.append('github_url', document.getElementById('project-github_url').value);
  formData.append('image_urls', document.getElementById('project-image_urls').value);
  formData.append('display_order', document.getElementById('project-display_order').value);
  formData.append('is_featured', document.getElementById('project-is_featured').checked ? 1 : 0);

  const fileInput = document.getElementById('project-image-file');
  if (fileInput.files && fileInput.files.length) {
    for (let i = 0; i < fileInput.files.length; i++) {
      formData.append('images', fileInput.files[i]);
    }
  }

  const url = id ? `/api/projects/${id}` : '/api/projects';
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    if (res.ok) {
      showToast(id ? 'Project updated' : 'Project created', 'success');
      closeProjectModal();
      loadProjects();
      loadOverviewStats();
    } else {
      const err = await res.json();
      showToast(err.error || 'Save failed', 'error');
    }
  } catch (err) {
    showToast('Network error saving project', 'error');
  }
}

// SKILLS
async function loadSkills() {
  try {
    const res = await fetch('/api/skills');
    const skills = await res.json();
    const container = document.getElementById('admin-skills-list');

    if (!skills.length) {
      container.innerHTML = `<tr><td colspan="5" class="text-muted">No skills found.</td></tr>`;
      return;
    }

    container.innerHTML = skills.map(s => `
      <tr>
        <td>${s.display_order}</td>
        <td><strong>${s.category}</strong></td>
        <td>${s.name}</td>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <span>${s.percentage}%</span>
            <div style="flex-grow:1; height:6px; background:rgba(255,255,255,0.1); border-radius:3px; overflow:hidden;">
              <div style="width:${s.percentage}%; height:100%; background:var(--admin-accent-purple);"></div>
            </div>
          </div>
        </td>
        <td>
          <button class="btn btn-outline btn-sm" onclick='editSkill(${JSON.stringify(s)})'><i class="fa-solid fa-pen"></i></button>
          <button class="btn btn-danger-outline btn-sm" onclick="deleteSkill(${s.id})"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    showToast('Failed to load skills', 'error');
  }
}

function openSkillModal(skill = null) {
  document.getElementById('skill-form').reset();
  if (skill) {
    document.getElementById('skill-modal-title').innerHTML = '<i class="fa-solid fa-pen"></i> Edit Skill';
    document.getElementById('skill-id').value = skill.id;
    document.getElementById('skill-category').value = skill.category;
    document.getElementById('skill-name').value = skill.name;
    document.getElementById('skill-percentage').value = skill.percentage;
    document.getElementById('skill-display_order').value = skill.display_order || 0;
  } else {
    document.getElementById('skill-modal-title').innerHTML = '<i class="fa-solid fa-bolt"></i> Add Technical Skill';
    document.getElementById('skill-id').value = '';
  }
  document.getElementById('skill-modal').classList.remove('hidden');
}

function closeSkillModal() {
  document.getElementById('skill-modal').classList.add('hidden');
}

function editSkill(skill) {
  openSkillModal(skill);
}

async function deleteSkill(id) {
  if (!confirm('Delete this skill entry?')) return;
  try {
    const res = await fetch(`/api/skills/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      showToast('Skill deleted', 'success');
      loadSkills();
      loadOverviewStats();
    }
  } catch (err) {
    showToast('Failed to delete skill', 'error');
  }
}

async function handleSaveSkill(e) {
  e.preventDefault();
  const id = document.getElementById('skill-id').value;
  const payload = {
    category: document.getElementById('skill-category').value,
    name: document.getElementById('skill-name').value,
    percentage: parseInt(document.getElementById('skill-percentage').value, 10),
    display_order: parseInt(document.getElementById('skill-display_order').value, 10)
  };

  const url = id ? `/api/skills/${id}` : '/api/skills';
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      showToast('Skill saved successfully', 'success');
      closeSkillModal();
      loadSkills();
      loadOverviewStats();
    }
  } catch (err) {
    showToast('Error saving skill', 'error');
  }
}

// EXPERIENCE & RESUME
async function loadExperience() {
  try {
    const res = await fetch('/api/experience');
    const experiences = await res.json();
    const container = document.getElementById('admin-experience-list');

    if (!experiences.length) {
      container.innerHTML = `<p class="muted">No work/education entries found.</p>`;
      return;
    }

    container.innerHTML = experiences.map(e => `
      <div class="admin-card mb-3" style="margin-bottom:14px;">
        <div class="card-header">
          <div>
            <span class="badge" style="text-transform:uppercase; font-size:0.7rem; background:rgba(255,255,255,0.06); padding:3px 8px; border-radius:4px; margin-bottom:4px; display:inline-block;">${e.type}</span>
            <h4 style="margin:4px 0 2px; font-size:1.1rem;">${e.title}</h4>
            <div style="color:var(--admin-accent-cyan); font-size:0.9rem;">${e.organization} ${e.location ? '• ' + e.location : ''}</div>
          </div>
          <div>
            <button class="btn btn-outline btn-sm" onclick='editExperience(${JSON.stringify(e)})'><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-danger-outline btn-sm" onclick="deleteExperience(${e.id})"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
        <div style="font-size:0.85rem; color:var(--admin-text-muted); margin-bottom:8px;">
          <i class="fa-regular fa-calendar"></i> ${e.start_date} — ${e.end_date || 'Present'}
        </div>
        <p style="margin:0; font-size:0.9rem; color:var(--admin-text-main);">${e.description || ''}</p>
      </div>
    `).join('');
  } catch (err) {
    showToast('Failed to load experiences', 'error');
  }
}

function openExperienceModal(exp = null) {
  document.getElementById('experience-form').reset();
  if (exp) {
    document.getElementById('experience-modal-title').innerHTML = '<i class="fa-solid fa-pen"></i> Edit Experience';
    document.getElementById('experience-id').value = exp.id;
    document.getElementById('experience-type').value = exp.type;
    document.getElementById('experience-title').value = exp.title;
    document.getElementById('experience-organization').value = exp.organization;
    document.getElementById('experience-location').value = exp.location || '';
    document.getElementById('experience-start_date').value = exp.start_date || '';
    document.getElementById('experience-end_date').value = exp.end_date || '';
    document.getElementById('experience-description').value = exp.description || '';
    document.getElementById('experience-display_order').value = exp.display_order || 0;
  } else {
    document.getElementById('experience-modal-title').innerHTML = '<i class="fa-solid fa-briefcase"></i> Add Experience / Education';
    document.getElementById('experience-id').value = '';
  }
  document.getElementById('experience-modal').classList.remove('hidden');
}

function closeExperienceModal() {
  document.getElementById('experience-modal').classList.add('hidden');
}

function editExperience(exp) {
  openExperienceModal(exp);
}

async function deleteExperience(id) {
  if (!confirm('Delete this experience entry?')) return;
  try {
    const res = await fetch(`/api/experience/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      showToast('Experience deleted', 'success');
      loadExperience();
      loadOverviewStats();
    }
  } catch (err) {
    showToast('Failed to delete entry', 'error');
  }
}

async function handleSaveExperience(e) {
  e.preventDefault();
  const id = document.getElementById('experience-id').value;
  const payload = {
    type: document.getElementById('experience-type').value,
    title: document.getElementById('experience-title').value,
    organization: document.getElementById('experience-organization').value,
    location: document.getElementById('experience-location').value,
    start_date: document.getElementById('experience-start_date').value,
    end_date: document.getElementById('experience-end_date').value,
    description: document.getElementById('experience-description').value,
    display_order: parseInt(document.getElementById('experience-display_order').value, 10) || 0
  };

  const url = id ? `/api/experience/${id}` : '/api/experience';
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      showToast('Saved successfully', 'success');
      closeExperienceModal();
      loadExperience();
      loadOverviewStats();
    }
  } catch (err) {
    showToast('Error saving experience', 'error');
  }
}

function openResumeUploadModal() {
  document.getElementById('resume-modal').classList.remove('hidden');
}
function closeResumeModal() {
  document.getElementById('resume-modal').classList.add('hidden');
}

async function handleUploadResume(e) {
  e.preventDefault();
  const fileInput = document.getElementById('resume-file-input');
  if (!fileInput.files[0]) return;

  const formData = new FormData();
  formData.append('resume', fileInput.files[0]);

  try {
    const res = await fetch('/api/experience/upload-resume', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    const data = await res.json();
    if (res.ok) {
      showToast('Resume uploaded successfully!', 'success');
      closeResumeModal();
    } else {
      showToast(data.error || 'Upload failed', 'error');
    }
  } catch (err) {
    showToast('Resume upload failed', 'error');
  }
}

// MESSAGES INBOX
async function loadMessages() {
  try {
    const res = await fetch('/api/contact', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const messages = await res.json();
    const container = document.getElementById('admin-messages-list');

    if (!messages.length) {
      container.innerHTML = `<p class="muted">Your inbox is empty.</p>`;
      return;
    }

    container.innerHTML = messages.map(m => `
      <div class="message-item ${m.is_read ? '' : 'unread'}">
        <div class="message-header">
          <div>
            <span class="message-sender">${m.sender_name}</span>
            <a href="mailto:${m.sender_email}" class="message-email"><i class="fa-regular fa-envelope"></i> ${m.sender_email}</a>
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
            <span class="message-date">${new Date(m.created_at).toLocaleString()}</span>
            ${!m.is_read ? `<button class="btn btn-outline btn-sm" onclick="markMessageRead(${m.id})">Mark Read</button>` : ''}
            <button class="btn btn-danger-outline btn-sm" onclick="deleteMessage(${m.id})"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
        <div class="message-subject">Subject: ${m.subject || 'General Inquiry'}</div>
        <div class="message-content">${m.message}</div>
      </div>
    `).join('');
  } catch (err) {
    showToast('Failed to load messages', 'error');
  }
}

async function markMessageRead(id) {
  try {
    const res = await fetch(`/api/contact/${id}/read`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      showToast('Marked as read', 'success');
      loadMessages();
      loadOverviewStats();
    }
  } catch (err) {
    showToast('Failed to update message', 'error');
  }
}

async function deleteMessage(id) {
  if (!confirm('Delete this message?')) return;
  try {
    const res = await fetch(`/api/contact/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      showToast('Message deleted', 'success');
      loadMessages();
      loadOverviewStats();
    }
  } catch (err) {
    showToast('Failed to delete message', 'error');
  }
}

// SITE SETTINGS & DYNAMIC CUSTOM FIELDS
const standardSettingKeys = ['name', 'title', 'hero_headline', 'hero_subtitle', 'badge_1', 'badge_2', 'badge_3', 'email', 'phone', 'location', 'availability', 'linkedin', 'github', 'twitter', 'facebook', 'projects_page_title', 'projects_page_subtitle', 'projects_maintenance_mode', 'projects_maintenance_message'];

async function loadSettings() {
  try {
    const res = await fetch('/api/settings');
    const settings = await res.json();

    // Fill standard fields
    standardSettingKeys.forEach(k => {
      const el = document.querySelector(`.setting-field[data-key="${k}"], input[data-key="${k}"]`);
      if (el) {
        if (el.type === 'checkbox') {
          el.checked = settings[k] === '1' || settings[k] === 1 || settings[k] === 'true' || settings[k] === true;
        } else {
          el.value = settings[k] || '';
        }
      }
    });

    // Populate custom dynamic fields
    const customContainer = document.getElementById('custom-fields-container');
    if (customContainer) {
      customContainer.innerHTML = '';
      for (const [key, value] of Object.entries(settings)) {
        if (!standardSettingKeys.includes(key) && key !== 'resume_filename' && key !== 'resume_url') {
          renderCustomFieldInput(key, key.replace(/_/g, ' ').toUpperCase(), value);
        }
      }
    }
  } catch (err) {
    showToast('Failed to load settings', 'error');
  }
}

function renderCustomFieldInput(key, labelName, val = '') {
  const customContainer = document.getElementById('custom-fields-container');
  const fieldWrapper = document.createElement('div');
  fieldWrapper.className = 'form-group custom-field-wrapper';
  fieldWrapper.style.background = 'rgba(255, 255, 255, 0.02)';
  fieldWrapper.style.padding = '12px';
  fieldWrapper.style.borderRadius = '10px';
  fieldWrapper.style.border = '1px dashed var(--admin-border)';

  fieldWrapper.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
      <label style="margin:0; font-weight:700; color:var(--admin-accent-cyan);"><i class="fa-solid fa-tag"></i> ${labelName}</label>
      <button type="button" class="btn btn-danger-outline btn-sm" onclick="this.closest('.custom-field-wrapper').remove()" style="padding:2px 8px;"><i class="fa-solid fa-xmark"></i> Remove</button>
    </div>
    <input type="text" data-key="${key}" class="form-input setting-field" value="${val}">
  `;
  customContainer.appendChild(fieldWrapper);
}

function promptAddCustomField() {
  document.getElementById('custom-field-modal').classList.remove('hidden');
}

function closeCustomFieldModal() {
  document.getElementById('custom-field-modal').classList.add('hidden');
}

function handleAddCustomField(e) {
  e.preventDefault();
  const labelName = document.getElementById('custom-field-name').value.trim();
  const initialVal = document.getElementById('custom-field-val').value.trim();
  if (!labelName) return;

  const key = labelName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  renderCustomFieldInput(key, labelName, initialVal);
  closeCustomFieldModal();
  document.getElementById('custom-field-form').reset();
  showToast(`Custom field '${labelName}' added! Click Save Settings to persist.`, 'success');
}

async function handleSaveSettings(e) {
  e.preventDefault();
  const payload = {};
  
  // Gather all fields with data-key
  document.querySelectorAll('[data-key]').forEach(el => {
    const key = el.getAttribute('data-key');
    if (key) {
      if (el.type === 'checkbox') {
        payload[key] = el.checked ? '1' : '0';
      } else {
        payload[key] = el.value;
      }
    }
  });

  try {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      showToast('Settings saved successfully!', 'success');
      loadSettings();
    } else {
      showToast('Failed to save settings', 'error');
    }
  } catch (err) {
    showToast('Error saving settings', 'error');
  }
}

async function handleChangePassword(e) {
  e.preventDefault();
  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  if (newPassword !== confirmPassword) {
    showToast('New passwords do not match!', 'error');
    return;
  }

  try {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });

    const data = await res.json();
    if (res.ok) {
      showToast('Password updated successfully!', 'success');
      document.getElementById('change-password-form').reset();
    } else {
      showToast(data.error || 'Password update failed', 'error');
    }
  } catch (err) {
    showToast('Error changing password', 'error');
  }
}

// Toast System
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="fa-solid ${type === 'success' ? 'fa-circle-check text-success' : 'fa-circle-exclamation text-danger'}"></i>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
