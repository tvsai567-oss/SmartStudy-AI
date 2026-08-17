/**
 * SMARTSTUDY AI — Frontend SPA Application Logic
 * Version 2.0.0
 */

// ════════════════════════════════════════════════════════════════════
// CONFIGURATION & STATE
// ════════════════════════════════════════════════════════════════════

const CONFIG = {
  API_URL: '/api',
  STORAGE_KEYS: {
    AUTH_TOKEN: 'smartstudy_auth_token',
    USER_DATA: 'smartstudy_user',
    THEME: 'smartstudy_theme',
    CHATS: 'smartstudy_chats_v2',
    STATS: 'smartstudy_stats_v2',
    QUIZ_HISTORY: 'smartstudy_quiz_history_v2'
  }
};

const state = {
  user: null,
  token: null,
  chats: [],
  currentChatId: null,
  activeAttachment: null, // { file, base64, name, mimetype }
  activeHwFile: null,
  currentQuizData: null,
  currentQuestionIndex: 0,
  userAnswers: [],
  isGenerating: false,
  stats: {
    questionsAsked: 0,
    topicsLearned: 0,
    bestScore: 0,
    dayStreak: 1,
    quizzesTaken: 0,
    totalQuizScore: 0,
    subjectStats: {}
  },
  quizHistory: []
};

// ════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadLocalState();
  initAuth();
  initNavigation();
  initHomeEvents();
  initChatEvents();
  initHomeworkEvents();
  initSubjectsEvents();
  initQuizEvents();
  initProgressEvents();
  initProfileEvents();
  initPasswordToggles();
});

// ════════════════════════════════════════════════════════════════════
// LOCAL STORAGE & STATE MANAGEMENT
// ════════════════════════════════════════════════════════════════════

function loadLocalState() {
  try {
    const savedChats = localStorage.getItem(CONFIG.STORAGE_KEYS.CHATS);
    if (savedChats) state.chats = JSON.parse(savedChats);

    const savedStats = localStorage.getItem(CONFIG.STORAGE_KEYS.STATS);
    if (savedStats) state.stats = { ...state.stats, ...JSON.parse(savedStats) };

    const savedQuizHistory = localStorage.getItem(CONFIG.STORAGE_KEYS.QUIZ_HISTORY);
    if (savedQuizHistory) state.quizHistory = JSON.parse(savedQuizHistory);
  } catch (e) {
    console.warn('Failed to parse cached state:', e);
  }
}

function saveChatsToStorage() {
  try {
    localStorage.setItem(CONFIG.STORAGE_KEYS.CHATS, JSON.stringify(state.chats));
  } catch (e) {
    console.warn('Failed to save chats:', e);
  }
}

function saveStatsToStorage() {
  try {
    localStorage.setItem(CONFIG.STORAGE_KEYS.STATS, JSON.stringify(state.stats));
  } catch (e) {
    console.warn('Failed to save stats:', e);
  }
}

function saveQuizHistoryToStorage() {
  try {
    localStorage.setItem(CONFIG.STORAGE_KEYS.QUIZ_HISTORY, JSON.stringify(state.quizHistory));
  } catch (e) {
    console.warn('Failed to save quiz history:', e);
  }
}

// ════════════════════════════════════════════════════════════════════
// THEME MANAGEMENT
// ════════════════════════════════════════════════════════════════════

function initTheme() {
  const savedTheme = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME) || 'dark';
  applyTheme(savedTheme);

  document.querySelectorAll('.theme-opt').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.theme === savedTheme);
    opt.addEventListener('click', (e) => {
      document.querySelectorAll('.theme-opt').forEach(o => o.classList.remove('active'));
      e.currentTarget.classList.add('active');
      applyTheme(e.currentTarget.dataset.theme);
    });
  });

  const toggleBtns = ['btn-theme-toggle', 'btn-theme-toggle-chat'];
  toggleBtns.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
      });
    }
  });
}

function applyTheme(theme) {
  let effectiveTheme = theme;
  if (theme === 'system') {
    effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-theme', effectiveTheme);
  localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, theme);

  const icon = effectiveTheme === 'dark' ? '🌙' : '☀️';
  const themeIconEl = document.getElementById('theme-icon');
  if (themeIconEl) themeIconEl.textContent = icon;
}

// ════════════════════════════════════════════════════════════════════
// AUTHENTICATION
// ════════════════════════════════════════════════════════════════════

function initAuth() {
  const token = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
  const userStr = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_DATA);

  if (token && userStr) {
    try {
      state.token = token;
      state.user = JSON.parse(userStr);
      onAuthSuccess(false);
    } catch (e) {
      switchView('auth');
    }
  } else {
    switchView('auth');
  }

  // Toggle signup / login forms
  const linkSignup = document.getElementById('link-signup');
  const linkLogin = document.getElementById('link-login');
  const linkForgot = document.getElementById('link-forgot');
  const linkBackLogin = document.getElementById('link-back-login');
  const formLogin = document.getElementById('form-login');
  const formSignup = document.getElementById('form-signup');
  const formForgot = document.getElementById('form-forgot');

  if (linkSignup && linkLogin) {
    linkSignup.addEventListener('click', (e) => {
      e.preventDefault();
      formLogin.classList.add('hidden');
      formForgot.classList.add('hidden');
      formSignup.classList.remove('hidden');
    });

    linkLogin.addEventListener('click', (e) => {
      e.preventDefault();
      formSignup.classList.add('hidden');
      formForgot.classList.add('hidden');
      formLogin.classList.remove('hidden');
    });
  }

  if (linkForgot && formForgot) {
    linkForgot.addEventListener('click', (e) => {
      e.preventDefault();
      formLogin.classList.add('hidden');
      formSignup.classList.add('hidden');
      formForgot.classList.remove('hidden');
      document.getElementById('forgot-step-1').classList.remove('hidden');
      document.getElementById('forgot-step-2').classList.add('hidden');
    });
  }

  if (linkBackLogin && formForgot) {
    linkBackLogin.addEventListener('click', (e) => {
      e.preventDefault();
      formForgot.classList.add('hidden');
      formSignup.classList.add('hidden');
      formLogin.classList.remove('hidden');
    });
  }

  // Send OTP
  const btnSendOtp = document.getElementById('btn-send-otp');
  if (btnSendOtp) {
    btnSendOtp.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = document.getElementById('forgot-email').value.trim();
      const errorDiv = document.getElementById('forgot-error-1');

      if (!email) {
        showError(errorDiv, 'Please enter your registered email address.');
        return;
      }

      setBtnLoading(btnSendOtp, true, 'Sending OTP...');
      hideError(errorDiv);

      try {
        const res = await apiCall('/auth/forgot-password', 'POST', { email });
        showToast(`🔑 OTP Sent! Code: ${res.otp}`, 'success');
        document.getElementById('forgot-step-1').classList.add('hidden');
        document.getElementById('forgot-step-2').classList.remove('hidden');
      } catch (err) {
        showError(errorDiv, err.message || 'Failed to send OTP.');
      } finally {
        setBtnLoading(btnSendOtp, false, 'Send OTP Code 📩');
      }
    });
  }

  // Reset Password
  const btnResetPw = document.getElementById('btn-reset-pw');
  if (btnResetPw) {
    btnResetPw.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = document.getElementById('forgot-email').value.trim();
      const otp = document.getElementById('forgot-otp').value.trim();
      const newPassword = document.getElementById('forgot-new-password').value;
      const errorDiv = document.getElementById('forgot-error-2');

      if (!otp || !newPassword) {
        showError(errorDiv, 'Please enter both the OTP code and your new password.');
        return;
      }

      setBtnLoading(btnResetPw, true, 'Resetting Password...');
      hideError(errorDiv);

      try {
        const res = await apiCall('/auth/reset-password', 'POST', {
          email,
          otp,
          newPassword
        });
        showToast('Password reset successfully! Please sign in.', 'success');
        formForgot.classList.add('hidden');
        formLogin.classList.remove('hidden');
        document.getElementById('login-email').value = email;
      } catch (err) {
        showError(errorDiv, err.message || 'Password reset failed.');
      } finally {
        setBtnLoading(btnResetPw, false, 'Reset Password 🔒');
      }
    });
  }

  // Login Submit
  const btnLogin = document.getElementById('btn-login');
  if (btnLogin) {
    btnLogin.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const errorDiv = document.getElementById('login-error');

      if (!email || !password) {
        showError(errorDiv, 'Please enter both email and password.');
        return;
      }

      setBtnLoading(btnLogin, true);
      hideError(errorDiv);

      try {
        const res = await apiCall('/auth/login', 'POST', { email, password });
        state.token = res.token;
        state.user = res.user;
        saveAuthSession();
        onAuthSuccess(true);
      } catch (err) {
        showError(errorDiv, err.message || 'Login failed. Please check credentials.');
      } finally {
        setBtnLoading(btnLogin, false);
      }
    });
  }

  // Signup Submit
  const btnSignup = document.getElementById('btn-signup');
  if (btnSignup) {
    btnSignup.addEventListener('click', async (e) => {
      e.preventDefault();
      const name = document.getElementById('signup-name').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const password = document.getElementById('signup-password').value;
      const classLevel = document.getElementById('signup-class').value;
      const errorDiv = document.getElementById('signup-error');

      if (!name || !email || !password) {
        showError(errorDiv, 'Please fill in all required fields.');
        return;
      }

      setBtnLoading(btnSignup, true);
      hideError(errorDiv);

      try {
        const res = await apiCall('/auth/register', 'POST', {
          full_name: name,
          email,
          password,
          class_level: parseInt(classLevel) || 8
        });
        state.token = res.token;
        state.user = res.user;
        saveAuthSession();
        onAuthSuccess(true);
      } catch (err) {
        showError(errorDiv, err.message || 'Signup failed. Please try again.');
      } finally {
        setBtnLoading(btnSignup, false);
      }
    });
  }

  // Guest button
  const btnGuest = document.getElementById('btn-guest');
  if (btnGuest) {
    btnGuest.addEventListener('click', (e) => {
      e.preventDefault();
      loginAsGuest();
    });
  }

  // Logout
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', logout);
  }
}

function loginAsGuest() {
  state.token = 'guest_token_' + Date.now();
  state.user = {
    id: 'guest',
    email: 'guest@smartstudy.ai',
    full_name: 'Guest Student',
    class_level: 8
  };
  saveAuthSession();
  onAuthSuccess(true);
}

function saveAuthSession() {
  localStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, state.token);
  localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(state.user));
}

function onAuthSuccess(showWelcomeToast = false) {
  updateUserUI();
  switchView('home');
  renderChatHistoryList();
  renderHomeStats();
  renderRecentChatsHome();
  if (showWelcomeToast) {
    showToast(`Welcome back, ${state.user.full_name}! 👋`, 'success');
  }
}

function logout() {
  state.token = null;
  state.user = null;
  localStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
  localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);
  switchView('auth');
  showToast('Signed out successfully.', 'info');
}

function updateUserUI() {
  if (!state.user) return;

  const name = state.user.full_name || 'Student';
  const cls = state.user.class_level || 8;
  const initial = name.charAt(0).toUpperCase();

  // Sidebar profile
  const sbName = document.getElementById('sidebar-name');
  if (sbName) sbName.textContent = name;
  const sbClass = document.getElementById('sidebar-class');
  if (sbClass) sbClass.textContent = `Class ${cls}`;
  const sbAvatar = document.getElementById('sidebar-avatar');
  if (sbAvatar) sbAvatar.textContent = initial;

  // Home Greeting
  const greetingText = document.getElementById('greeting-text');
  if (greetingText) greetingText.textContent = `Good day, ${name}! 👋`;

  // Profile View elements
  const profNameDisplay = document.getElementById('profile-name-display');
  if (profNameDisplay) profNameDisplay.textContent = name;

  const profEmailDisplay = document.getElementById('profile-email-display');
  if (profEmailDisplay) profEmailDisplay.textContent = state.user.email || 'guest@smartstudy.ai';

  const profClassBadge = document.getElementById('profile-class-badge');
  if (profClassBadge) profClassBadge.textContent = `Class ${cls}`;

  const profAvatarDisplay = document.getElementById('profile-avatar-display');
  if (profAvatarDisplay) profAvatarDisplay.textContent = initial;

  // Form Inputs
  const profNameInput = document.getElementById('prof-name');
  if (profNameInput) profNameInput.value = name;

  const profClassSelect = document.getElementById('prof-class');
  if (profClassSelect) profClassSelect.value = cls;
}

// ════════════════════════════════════════════════════════════════════
// NAVIGATION
// ════════════════════════════════════════════════════════════════════

function initNavigation() {
  // Sidebar & Mobile Nav items
  document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetView = item.dataset.view;
      if (targetView) switchView(targetView);
    });
  });

  // Profile nav button in sidebar
  const btnProfileNav = document.getElementById('btn-profile-nav');
  if (btnProfileNav) {
    btnProfileNav.addEventListener('click', () => switchView('profile'));
  }

  // Back to home button in Chat
  const btnBackHome = document.getElementById('btn-back-to-home');
  if (btnBackHome) {
    btnBackHome.addEventListener('click', () => switchView('home'));
  }

  // New Chat Buttons
  document.querySelectorAll('#btn-new-chat, .mobile-chat-btn').forEach(btn => {
    btn.addEventListener('click', () => createNewChat());
  });
}

function switchView(viewId) {
  const viewAuth = document.getElementById('view-auth');
  const viewApp = document.getElementById('view-app');

  if (viewId === 'auth') {
    if (viewAuth) {
      viewAuth.classList.add('active');
      viewAuth.classList.remove('hidden');
    }
    if (viewApp) {
      viewApp.classList.remove('active');
      viewApp.classList.add('hidden');
    }
    return;
  }

  // Switch to main app layout
  if (viewAuth) {
    viewAuth.classList.remove('active');
    viewAuth.classList.add('hidden');
  }
  if (viewApp) {
    viewApp.classList.add('active');
    viewApp.classList.remove('hidden');
  }

  // Hide all inner content views
  document.querySelectorAll('.content-view').forEach(v => v.classList.add('hidden'));

  // Show target content view
  const targetView = document.getElementById(`view-${viewId}`);
  if (targetView) {
    targetView.classList.remove('hidden');
  } else {
    const homeView = document.getElementById('view-home');
    if (homeView) homeView.classList.remove('hidden');
  }

  // Update Navigation Active state
  document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.view === viewId);
  });

  // View specific refresh
  if (viewId === 'progress') renderProgressView();
  if (viewId === 'subjects') renderSubjectsGrid();
  if (viewId === 'home') {
    renderHomeStats();
    renderRecentChatsHome();
  }
}

// ════════════════════════════════════════════════════════════════════
// HOME VIEW
// ════════════════════════════════════════════════════════════════════

function initHomeEvents() {
  const homeQuestion = document.getElementById('home-question');
  const homeSend = document.getElementById('home-send');

  const handleHomeAsk = () => {
    const q = homeQuestion.value.trim();
    if (!q) return;
    homeQuestion.value = '';
    createNewChat(q);
  };

  if (homeQuestion) {
    homeQuestion.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleHomeAsk();
    });
  }

  if (homeSend) {
    homeSend.addEventListener('click', handleHomeAsk);
  }

  // Subject quick chips
  document.querySelectorAll('#view-home .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const subject = chip.dataset.subject;
      createNewChat(`Let's study ${subject}! What should we learn?`, subject);
    });
  });
}

function renderHomeStats() {
  const qEl = document.getElementById('stat-questions');
  if (qEl) qEl.textContent = state.stats.questionsAsked || 0;

  const tEl = document.getElementById('stat-topics');
  if (tEl) tEl.textContent = state.stats.topicsLearned || 0;

  const sEl = document.getElementById('stat-score');
  if (sEl) sEl.textContent = state.stats.bestScore ? `${state.stats.bestScore}%` : '—';

  const strEl = document.getElementById('stat-streak');
  if (strEl) strEl.textContent = state.stats.dayStreak || 1;
}

function renderRecentChatsHome() {
  const container = document.getElementById('recent-chats');
  if (!container) return;

  if (state.chats.length === 0) {
    container.innerHTML = `
      <div class="empty-state-sm">
        <span>💬</span>
        <p>No chats yet. Ask your first question!</p>
      </div>`;
    return;
  }

  const recent = state.chats.slice(0, 3);
  container.innerHTML = recent.map(chat => `
    <div class="recent-chat-card" onclick="openChatById('${chat.id}')">
      <div class="recent-chat-icon">💬</div>
      <div class="recent-chat-info">
        <h4>${escapeHtml(chat.title || 'Chat')}</h4>
        <p>${escapeHtml(chat.subject || 'General')}</p>
      </div>
      <div class="recent-chat-arrow">→</div>
    </div>
  `).join('');
}

// ════════════════════════════════════════════════════════════════════
// CHAT VIEW
// ════════════════════════════════════════════════════════════════════

function initChatEvents() {
  const chatInput = document.getElementById('chat-input');
  const btnSend = document.getElementById('btn-send');

  if (chatInput && btnSend) {
    chatInput.addEventListener('input', () => {
      chatInput.style.height = 'auto';
      chatInput.style.height = Math.min(chatInput.scrollHeight, 160) + 'px';
      btnSend.disabled = chatInput.value.trim() === '' && !state.activeAttachment;
    });

    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
      }
    });

    btnSend.addEventListener('click', sendChatMessage);
  }

  // File attachment in chat
  const btnAttach = document.getElementById('btn-attach');
  const fileInput = document.getElementById('file-input');
  const btnRemoveAttach = document.getElementById('btn-remove-attachment');

  if (btnAttach && fileInput) {
    btnAttach.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        state.activeAttachment = {
          file,
          name: file.name,
          mimetype: file.type,
          base64: evt.target.result.split(',')[1]
        };

        const preview = document.getElementById('attachment-preview');
        const nameEl = document.getElementById('attachment-name');
        if (preview && nameEl) {
          nameEl.textContent = file.name;
          preview.classList.remove('hidden');
        }
        btnSend.disabled = false;
      };
      reader.readAsDataURL(file);
    });
  }

  if (btnRemoveAttach) {
    btnRemoveAttach.addEventListener('click', () => {
      state.activeAttachment = null;
      document.getElementById('attachment-preview').classList.add('hidden');
      if (fileInput) fileInput.value = '';
      btnSend.disabled = chatInput.value.trim() === '';
    });
  }

  // Suggestion chips
  document.querySelectorAll('#suggestion-chips .chip-sm').forEach(chip => {
    chip.addEventListener('click', () => {
      const q = chip.dataset.q;
      if (q && chatInput) {
        chatInput.value = q;
        sendChatMessage();
      }
    });
  });

  // Rename chat
  const btnRename = document.getElementById('btn-rename-chat');
  if (btnRename) {
    btnRename.addEventListener('click', () => {
      const currentChat = state.chats.find(c => c.id === state.currentChatId);
      if (!currentChat) return;
      const newTitle = prompt('Enter new chat title:', currentChat.title);
      if (newTitle && newTitle.trim()) {
        currentChat.title = newTitle.trim();
        saveChatsToStorage();
        document.getElementById('chat-title-display').textContent = currentChat.title;
        renderChatHistoryList();
      }
    });
  }

  // Chat search
  const chatSearch = document.getElementById('chat-search');
  if (chatSearch) {
    chatSearch.addEventListener('input', (e) => {
      renderChatHistoryList(e.target.value.trim());
    });
  }
}

function createNewChat(initialMessage = null, defaultSubject = 'General') {
  const newChat = {
    id: 'chat_' + Date.now(),
    title: initialMessage ? (initialMessage.slice(0, 25) + '...') : 'New Chat',
    subject: defaultSubject,
    messages: [],
    createdAt: new Date().toISOString()
  };

  state.chats.unshift(newChat);
  state.currentChatId = newChat.id;
  saveChatsToStorage();

  document.getElementById('chat-title-display').textContent = newChat.title;
  document.getElementById('messages-area').innerHTML = `
    <div id="chat-empty" class="chat-empty">
      <div class="chat-empty-icon">🧠</div>
      <h3>SmartStudy AI</h3>
      <p>Ask me anything! I'll explain it in a way that makes perfect sense for your class level.</p>
    </div>
  `;

  renderChatHistoryList();
  switchView('chat');

  if (initialMessage) {
    const input = document.getElementById('chat-input');
    input.value = initialMessage;
    sendChatMessage();
  }
}

function openChatById(chatId) {
  const chat = state.chats.find(c => c.id === chatId);
  if (!chat) return;

  state.currentChatId = chat.id;
  document.getElementById('chat-title-display').textContent = chat.title || 'Chat';

  const messagesArea = document.getElementById('messages-area');
  messagesArea.innerHTML = '';

  if (chat.messages.length === 0) {
    messagesArea.innerHTML = `
      <div id="chat-empty" class="chat-empty">
        <div class="chat-empty-icon">🧠</div>
        <h3>SmartStudy AI</h3>
        <p>Ask me anything!</p>
      </div>`;
  } else {
    chat.messages.forEach(msg => {
      appendChatMessageUI(msg.role, msg.content);
    });
  }

  renderChatHistoryList();
  switchView('chat');
}

function renderChatHistoryList(filterQuery = '') {
  const container = document.getElementById('chat-history-list');
  if (!container) return;

  container.innerHTML = '';

  let filtered = state.chats;
  if (filterQuery) {
    filtered = filtered.filter(c => c.title.toLowerCase().includes(filterQuery.toLowerCase()) || (c.subject && c.subject.toLowerCase().includes(filterQuery.toLowerCase())));
  }

  if (filtered.length === 0) {
    container.innerHTML = `<div style="padding: 12px; text-align: center; color: var(--text-3); font-size: 13px;">No chats found</div>`;
    return;
  }

  filtered.forEach(chat => {
    const el = document.createElement('div');
    el.className = `chat-history-item ${chat.id === state.currentChatId ? 'active' : ''}`;
    el.innerHTML = `
      <div class="chat-history-item-icon">💬</div>
      <div class="chat-history-item-body">
        <div class="chat-history-title">${escapeHtml(chat.title)}</div>
        <div class="chat-history-meta">${escapeHtml(chat.subject || 'General')}</div>
      </div>
    `;
    el.addEventListener('click', () => openChatById(chat.id));
    container.appendChild(el);
  });
}

async function sendChatMessage() {
  if (state.isGenerating) return;

  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text && !state.activeAttachment) return;

  const subjectSelect = document.getElementById('chat-subject-select');
  const subject = subjectSelect ? subjectSelect.value : 'General';

  // Ensure active chat
  let chat = state.chats.find(c => c.id === state.currentChatId);
  if (!chat) {
    chat = {
      id: 'chat_' + Date.now(),
      title: text.slice(0, 25) || 'New Chat',
      subject,
      messages: [],
      createdAt: new Date().toISOString()
    };
    state.chats.unshift(chat);
    state.currentChatId = chat.id;
  }

  if (chat.messages.length === 0 && text) {
    chat.title = text.slice(0, 25) + (text.length > 25 ? '...' : '');
    document.getElementById('chat-title-display').textContent = chat.title;
  }

  // Remove empty state
  const chatEmpty = document.getElementById('chat-empty');
  if (chatEmpty) chatEmpty.remove();

  // Reset input & attachment UI
  input.value = '';
  input.style.height = 'auto';
  document.getElementById('btn-send').disabled = true;

  const attachment = state.activeAttachment;
  state.activeAttachment = null;
  document.getElementById('attachment-preview').classList.add('hidden');

  // Push user message
  const userMsgContent = attachment ? `[Image attached: ${attachment.name}]\n${text}` : text;
  chat.messages.push({ role: 'user', content: userMsgContent });
  appendChatMessageUI('user', userMsgContent);

  // Update Stats
  state.stats.questionsAsked++;
  saveStatsToStorage();
  renderHomeStats();

  // Create assistant message UI container
  const assistantBubble = appendChatMessageUI('assistant', '');
  showTypingIndicator(true);

  state.isGenerating = true;
  let accumulatedText = '';

  const endpoint = attachment ? '/homework/solve' : '/chat';
  const payload = attachment
    ? { message: text, subject, file: attachment }
    : { message: text, history: chat.messages.slice(0, -1), subject };

  try {
    await streamResponse(
      endpoint,
      payload,
      (chunkText) => {
        showTypingIndicator(false);
        accumulatedText += chunkText;
        updateBubbleText(assistantBubble, accumulatedText);
      },
      (fullText) => {
        showTypingIndicator(false);
        const finalContent = fullText || accumulatedText || 'I have analyzed your request.';
        chat.messages.push({ role: 'assistant', content: finalContent });
        saveChatsToStorage();
        renderChatHistoryList();
        state.isGenerating = false;
      },
      (errMessage) => {
        showTypingIndicator(false);
        const errorText = `⚠️ Error: ${errMessage}`;
        updateBubbleText(assistantBubble, errorText);
        chat.messages.push({ role: 'assistant', content: errorText });
        saveChatsToStorage();
        state.isGenerating = false;
      }
    );
  } catch (e) {
    showTypingIndicator(false);
    updateBubbleText(assistantBubble, '⚠️ Request failed. Please check backend connection.');
    state.isGenerating = false;
  }
}

function appendChatMessageUI(role, content) {
  const messagesArea = document.getElementById('messages-area');

  const row = document.createElement('div');
  row.className = `message-row ${role === 'user' ? 'user' : 'assistant'}`;

  const avatar = role === 'user' ? (state.user?.full_name?.charAt(0).toUpperCase() || 'U') : '🧠';
  const renderedHtml = renderMarkdown(content);

  const toolbarHtml = role === 'assistant' ? `
    <div class="message-toolbar">
      <button class="msg-action-btn btn-copy-msg" title="Copy response">📋 Copy</button>
      <button class="msg-action-btn btn-share-msg" title="Share answer">📤 Share</button>
      <button class="msg-action-btn btn-speak-msg" title="Read aloud">🔊 Listen</button>
      <button class="msg-action-btn btn-like-msg" title="Helpful">👍</button>
      <button class="msg-action-btn btn-dislike-msg" title="Not helpful">👎</button>
    </div>
  ` : '';

  row.innerHTML = `
    <div class="message-avatar">${avatar}</div>
    <div class="message-body">
      <div class="message-bubble markdown-body">${renderedHtml}</div>
      ${toolbarHtml}
    </div>
  `;

  messagesArea.appendChild(row);
  messagesArea.scrollTop = messagesArea.scrollHeight;

  if (role === 'assistant') {
    attachToolbarEvents(row, content);
  }

  return row.querySelector('.message-bubble');
}

function attachToolbarEvents(row, rawContent) {
  const bubble = row.querySelector('.message-bubble');
  const btnCopy = row.querySelector('.btn-copy-msg');
  const btnShare = row.querySelector('.btn-share-msg');
  const btnSpeak = row.querySelector('.btn-speak-msg');
  const btnLike = row.querySelector('.btn-like-msg');
  const btnDislike = row.querySelector('.btn-dislike-msg');

  if (btnCopy) {
    btnCopy.addEventListener('click', () => {
      const textToCopy = bubble ? bubble.innerText : rawContent;
      navigator.clipboard.writeText(textToCopy);
      showToast('Response copied to clipboard! 📋', 'success');
    });
  }

  if (btnShare) {
    btnShare.addEventListener('click', () => {
      const textToShare = bubble ? bubble.innerText : rawContent;
      if (navigator.share) {
        navigator.share({
          title: 'SmartStudy AI Answer',
          text: textToShare
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(textToShare);
        showToast('Answer copied to clipboard for sharing! 📤', 'success');
      }
    });
  }

  if (btnSpeak) {
    btnSpeak.addEventListener('click', () => {
      if (window.speechSynthesis) {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
          btnSpeak.classList.remove('speaking');
          btnSpeak.innerHTML = '🔊 Listen';
        } else {
          const textToSpeak = bubble ? bubble.innerText : rawContent;
          const utterance = new SpeechSynthesisUtterance(textToSpeak);
          utterance.onend = () => {
            btnSpeak.classList.remove('speaking');
            btnSpeak.innerHTML = '🔊 Listen';
          };
          btnSpeak.classList.add('speaking');
          btnSpeak.innerHTML = '⏹️ Stop';
          window.speechSynthesis.speak(utterance);
        }
      } else {
        showToast('Text-to-speech is not supported on this browser.', 'warning');
      }
    });
  }

  if (btnLike) {
    btnLike.addEventListener('click', () => {
      showToast('Thank you for your feedback! 👍', 'success');
    });
  }

  if (btnDislike) {
    btnDislike.addEventListener('click', () => {
      showToast('Feedback recorded! We will refine future explanations. 💡', 'info');
    });
  }
}

function updateBubbleText(bubbleEl, rawText) {
  if (!bubbleEl) return;
  bubbleEl.innerHTML = renderMarkdown(rawText);

  const messagesArea = document.getElementById('messages-area');
  if (messagesArea) messagesArea.scrollTop = messagesArea.scrollHeight;
}

function showTypingIndicator(show) {
  const el = document.getElementById('typing-indicator');
  if (el) el.classList.toggle('hidden', !show);
}

// ════════════════════════════════════════════════════════════════════
// HOMEWORK SOLVER VIEW
// ════════════════════════════════════════════════════════════════════

function initHomeworkEvents() {
  const uploadZone = document.getElementById('upload-zone');
  const hwFileInput = document.getElementById('hw-file-input');
  const btnRemoveHw = document.getElementById('btn-remove-hw');

  if (uploadZone && hwFileInput) {
    uploadZone.addEventListener('click', () => hwFileInput.click());

    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));

    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('dragover');
      if (e.dataTransfer.files.length) handleHwFile(e.dataTransfer.files[0]);
    });

    hwFileInput.addEventListener('change', (e) => {
      if (e.target.files.length) handleHwFile(e.target.files[0]);
    });
  }

  if (btnRemoveHw) {
    btnRemoveHw.addEventListener('click', (e) => {
      e.stopPropagation();
      state.activeHwFile = null;
      document.getElementById('upload-placeholder').classList.remove('hidden');
      document.getElementById('upload-preview').classList.add('hidden');
      if (hwFileInput) hwFileInput.value = '';
    });
  }

  // Action toggles
  document.querySelectorAll('.hw-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.hw-action-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Submit Homework
  const btnHwSubmit = document.getElementById('btn-hw-submit');
  if (btnHwSubmit) {
    btnHwSubmit.addEventListener('click', processHomeworkSubmit);
  }

  // Copy result
  const btnCopyHw = document.getElementById('btn-copy-hw');
  if (btnCopyHw) {
    btnCopyHw.addEventListener('click', () => {
      const content = document.getElementById('hw-result-content').innerText;
      navigator.clipboard.writeText(content);
      showToast('Solution copied to clipboard! 📋', 'success');
    });
  }
}

function handleHwFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    state.activeHwFile = {
      file,
      name: file.name,
      mimetype: file.type,
      base64: e.target.result.split(',')[1]
    };

    document.getElementById('upload-placeholder').classList.add('hidden');
    const previewArea = document.getElementById('upload-preview');
    previewArea.classList.remove('hidden');

    if (file.type.startsWith('image/')) {
      const img = document.getElementById('preview-img');
      img.src = e.target.result;
      img.classList.remove('hidden');
      document.getElementById('pdf-preview').classList.add('hidden');
    } else {
      document.getElementById('preview-img').classList.add('hidden');
      const pdfPrev = document.getElementById('pdf-preview');
      pdfPrev.classList.remove('hidden');
      document.getElementById('pdf-name').textContent = file.name;
    }
  };
  reader.readAsDataURL(file);
}

async function processHomeworkSubmit() {
  const qText = document.getElementById('hw-question').value.trim();
  const subject = document.getElementById('hw-subject').value;
  const activeActionBtn = document.querySelector('.hw-action-btn.active');
  const action = activeActionBtn ? activeActionBtn.dataset.action : 'solve';

  if (!qText && !state.activeHwFile) {
    showToast('Please enter a question or upload an image!', 'warning');
    return;
  }

  const btnSubmit = document.getElementById('btn-hw-submit');
  setBtnLoading(btnSubmit, true, 'Analyzing with AI...');

  const resultArea = document.getElementById('hw-result');
  const resultContent = document.getElementById('hw-result-content');
  resultArea.classList.remove('hidden');
  resultContent.innerHTML = '<em>Analyzing homework... 🧠</em>';

  let accumulated = '';

  try {
    const endpoint = `/homework/${action}`;
    const payload = {
      message: qText,
      subject,
      action
    };

    if (state.activeHwFile) {
      payload.file = state.activeHwFile;
    }

    await streamResponse(
      endpoint,
      payload,
      (chunk) => {
        accumulated += chunk;
        resultContent.innerHTML = renderMarkdown(accumulated);
      },
      (fullText) => {
        resultContent.innerHTML = renderMarkdown(fullText || accumulated);
        setBtnLoading(btnSubmit, false, '🤖 Analyze with AI');
        showToast('Homework solution generated!', 'success');
        state.stats.questionsAsked++;
        saveStatsToStorage();
      },
      (err) => {
        resultContent.innerHTML = `<div style="color: var(--error)">Failed: ${err}</div>`;
        setBtnLoading(btnSubmit, false, '🤖 Analyze with AI');
      }
    );
  } catch (err) {
    resultContent.innerHTML = `<div style="color: var(--error)">Error connecting to server.</div>`;
    setBtnLoading(btnSubmit, false, '🤖 Analyze with AI');
  }
}

// ════════════════════════════════════════════════════════════════════
// SUBJECTS VIEW
// ════════════════════════════════════════════════════════════════════

function initSubjectsEvents() {
  // Navigation handled in initNavigation
}

function renderSubjectsGrid() {
  const container = document.getElementById('subjects-grid');
  if (!container) return;

  const subjects = [
    { id: 'math', name: 'Mathematics', icon: '🧮', desc: 'Algebra, Geometry, Calculus & Word Problems', color: '#6366f1' },
    { id: 'sci', name: 'Science', icon: '🔬', desc: 'Physics, Chemistry, Biology & Natural World', color: '#22d3ee' },
    { id: 'eng', name: 'English', icon: '📖', desc: 'Grammar, Essays, Comprehension & Literature', color: '#10b981' },
    { id: 'ss', name: 'Social Studies', icon: '🌍', desc: 'History, Geography, Civics & Culture', color: '#f59e0b' },
    { id: 'cs', name: 'Computer Science', icon: '💻', desc: 'Coding, Algorithms, Logic & Hardware', color: '#ec4899' },
    { id: 'gk', name: 'General Knowledge', icon: '🌟', desc: 'Current Affairs, Science Facts & Trivia', color: '#8b5cf6' }
  ];

  container.innerHTML = subjects.map(s => `
    <div class="subject-card" onclick="startSubjectChat('${s.name}')">
      <div class="subject-card-header">
        <span class="subject-card-icon">${s.icon}</span>
        <h3 class="subject-card-title">${s.name}</h3>
      </div>
      <p class="subject-card-desc">${s.desc}</p>
      <div class="subject-card-footer">
        <span>Start Learning →</span>
      </div>
    </div>
  `).join('');
}

window.startSubjectChat = function(subjectName) {
  createNewChat(`Hi SmartStudy! I want to study ${subjectName}. What should we focus on?`, subjectName);
};

// ════════════════════════════════════════════════════════════════════
// QUIZ VIEW
// ════════════════════════════════════════════════════════════════════

function initQuizEvents() {
  const btnGenerate = document.getElementById('btn-generate-quiz');
  if (btnGenerate) {
    btnGenerate.addEventListener('click', generateQuizSubmit);
  }

  const btnPrev = document.getElementById('btn-quiz-prev');
  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      if (state.currentQuestionIndex > 0) {
        state.currentQuestionIndex--;
        renderQuizPlayingQuestion();
      }
    });
  }

  const btnNext = document.getElementById('btn-quiz-next');
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      if (state.currentQuestionIndex < state.currentQuizData.length - 1) {
        state.currentQuestionIndex++;
        renderQuizPlayingQuestion();
      }
    });
  }

  const btnSubmit = document.getElementById('btn-quiz-submit');
  if (btnSubmit) {
    btnSubmit.addEventListener('click', finishAndSubmitQuiz);
  }

  // Result actions
  const btnRetry = document.getElementById('btn-retry-quiz');
  if (btnRetry) {
    btnRetry.addEventListener('click', () => {
      state.currentQuestionIndex = 0;
      state.userAnswers = new Array(state.currentQuizData.length).fill(null);
      document.getElementById('quiz-results').classList.add('hidden');
      document.getElementById('quiz-playing').classList.remove('hidden');
      renderQuizPlayingQuestion();
    });
  }

  const btnNewQuiz = document.getElementById('btn-new-quiz');
  if (btnNewQuiz) {
    btnNewQuiz.addEventListener('click', () => {
      document.getElementById('quiz-results').classList.add('hidden');
      document.getElementById('quiz-playing').classList.add('hidden');
      document.getElementById('quiz-setup').classList.remove('hidden');
    });
  }
}

async function generateQuizSubmit() {
  const subject = document.getElementById('quiz-subject').value;
  const topic = document.getElementById('quiz-topic').value.trim();
  const count = document.getElementById('quiz-count').value;
  const difficulty = document.getElementById('quiz-difficulty').value;

  if (!subject) {
    showToast('Please select a subject for the quiz!', 'warning');
    return;
  }

  const btnGen = document.getElementById('btn-generate-quiz');
  setBtnLoading(btnGen, true, 'Generating Quiz...');

  try {
    const res = await apiCall('/quiz/generate', 'POST', {
      subject,
      topic,
      count: parseInt(count),
      difficulty
    });

    const quizObj = res.quiz || {};
    const questions = quizObj.questions || (Array.isArray(quizObj) ? quizObj : []);

    if (!questions.length) {
      throw new Error('No quiz questions generated.');
    }

    state.currentQuizData = questions;
    state.currentQuestionIndex = 0;
    state.userAnswers = new Array(questions.length).fill(null);

    document.getElementById('quiz-setup').classList.add('hidden');
    document.getElementById('quiz-playing').classList.remove('hidden');
    document.getElementById('quiz-subject-display').textContent = subject;

    renderQuizPlayingQuestion();
    showToast('Quiz generated! Good luck! 🎯', 'success');
  } catch (err) {
    showToast(err.message || 'Failed to generate quiz.', 'error');
  } finally {
    setBtnLoading(btnGen, false, '🎯 Generate Quiz');
  }
}

function renderQuizPlayingQuestion() {
  const idx = state.currentQuestionIndex;
  const total = state.currentQuizData.length;
  const q = state.currentQuizData[idx];

  document.getElementById('quiz-q-count').textContent = `Question ${idx + 1} of ${total}`;
  document.getElementById('quiz-q-num').textContent = `Question ${idx + 1}`;
  document.getElementById('quiz-question').textContent = q.question;

  const pct = Math.round(((idx + 1) / total) * 100);
  document.getElementById('quiz-progress-fill').style.width = `${pct}%`;

  const container = document.getElementById('quiz-options');
  container.innerHTML = '';

  const letters = ['A', 'B', 'C', 'D'];
  const userAns = state.userAnswers[idx];

  q.options.forEach((optText, optIdx) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option';

    if (userAns !== null) {
      btn.disabled = true;
      if (optIdx === q.correct) btn.classList.add('correct');
      if (userAns === optIdx && userAns !== q.correct) btn.classList.add('wrong');
    }

    btn.innerHTML = `
      <span class="option-letter">${letters[optIdx]}</span>
      <span class="option-text">${escapeHtml(optText)}</span>
    `;

    btn.addEventListener('click', () => {
      state.userAnswers[idx] = optIdx;
      renderQuizPlayingQuestion();
    });

    container.appendChild(btn);
  });

  // Buttons navigation state
  const btnPrev = document.getElementById('btn-quiz-prev');
  if (btnPrev) btnPrev.disabled = idx === 0;

  const btnNext = document.getElementById('btn-quiz-next');
  const btnSubmit = document.getElementById('btn-quiz-submit');

  if (idx === total - 1) {
    if (btnNext) btnNext.classList.add('hidden');
    if (btnSubmit) btnSubmit.classList.remove('hidden');
  } else {
    if (btnNext) btnNext.classList.remove('hidden');
    if (btnSubmit) btnSubmit.classList.add('hidden');
  }
}

async function finishAndSubmitQuiz() {
  let correctCount = 0;
  state.currentQuizData.forEach((q, i) => {
    if (state.userAnswers[i] === q.correct) correctCount++;
  });

  const total = state.currentQuizData.length;
  const scorePct = Math.round((correctCount / total) * 100);

  // Update local stats
  state.stats.quizzesTaken = (state.stats.quizzesTaken || 0) + 1;
  state.stats.totalQuizScore = (state.stats.totalQuizScore || 0) + scorePct;
  if (scorePct > (state.stats.bestScore || 0)) {
    state.stats.bestScore = scorePct;
  }
  saveStatsToStorage();

  // Save to quiz history
  state.quizHistory.unshift({
    date: new Date().toLocaleDateString(),
    subject: document.getElementById('quiz-subject-display').textContent,
    score: scorePct,
    correct: correctCount,
    total
  });
  saveQuizHistoryToStorage();

  // UI Results
  document.getElementById('quiz-playing').classList.add('hidden');
  document.getElementById('quiz-results').classList.remove('hidden');

  document.getElementById('results-pct').textContent = `${scorePct}%`;
  document.getElementById('results-correct').textContent = correctCount;
  document.getElementById('results-wrong').textContent = total - correctCount;

  let emoji = '👍';
  let grade = 'Good Effort!';
  if (scorePct >= 90) { emoji = '🏆'; grade = 'Outstanding!'; }
  else if (scorePct >= 75) { emoji = '🌟'; grade = 'Great Job!'; }
  else if (scorePct >= 50) { emoji = '📚'; grade = 'Keep Practicing!'; }

  document.getElementById('results-emoji').textContent = emoji;
  document.getElementById('results-grade').textContent = grade;

  // Breakdown
  const breakdownContainer = document.getElementById('results-breakdown');
  if (breakdownContainer) {
    breakdownContainer.innerHTML = state.currentQuizData.map((q, i) => {
      const userChoice = state.userAnswers[i];
      const isRight = userChoice === q.correct;
      return `
        <div class="result-breakdown-item ${isRight ? 'correct' : 'wrong'}">
          <h4>Q${i + 1}. ${escapeHtml(q.question)}</h4>
          <p><strong>Your Answer:</strong> ${userChoice !== null ? escapeHtml(q.options[userChoice]) : 'Skipped'} ${isRight ? '✅' : '❌'}</p>
          ${!isRight ? `<p><strong>Correct Answer:</strong> ${escapeHtml(q.options[q.correct])}</p>` : ''}
          ${q.explanation ? `<p class="explanation"><em>${escapeHtml(q.explanation)}</em></p>` : ''}
        </div>
      `;
    }).join('');
  }

  // Backend submission (optional sync)
  try {
    await apiCall('/quiz/evaluate', 'POST', {
      questions: state.currentQuizData,
      answers: state.userAnswers
    });
  } catch (e) {
    console.warn('Backend quiz sync skipped:', e);
  }
}

// ════════════════════════════════════════════════════════════════════
// PROGRESS VIEW
// ════════════════════════════════════════════════════════════════════

function initProgressEvents() {
  const btnPlan = document.getElementById('btn-generate-plan');
  if (btnPlan) {
    btnPlan.addEventListener('click', generateStudyPlanSubmit);
  }

  const btnCopyPlan = document.getElementById('btn-copy-plan');
  if (btnCopyPlan) {
    btnCopyPlan.addEventListener('click', () => {
      const content = document.getElementById('study-plan-content').innerText;
      navigator.clipboard.writeText(content);
      showToast('Study plan copied! 📋', 'success');
    });
  }
}

function renderProgressView() {
  const pQ = document.getElementById('prog-questions');
  if (pQ) pQ.textContent = state.stats.questionsAsked || 0;

  const pQuiz = document.getElementById('prog-quizzes');
  if (pQuiz) pQuiz.textContent = state.stats.quizzesTaken || 0;

  const pAvg = document.getElementById('prog-avg-score');
  if (pAvg) {
    const avg = state.stats.quizzesTaken ? Math.round(state.stats.totalQuizScore / state.stats.quizzesTaken) : null;
    pAvg.textContent = avg ? `${avg}%` : '—';
  }

  const pStr = document.getElementById('prog-streak');
  if (pStr) pStr.textContent = state.stats.dayStreak || 1;

  // Quiz History List
  const historyContainer = document.getElementById('quiz-history-list');
  if (historyContainer) {
    if (!state.quizHistory || state.quizHistory.length === 0) {
      historyContainer.innerHTML = `<div class="empty-state-sm"><span>🧠</span><p>No quizzes taken yet!</p></div>`;
    } else {
      historyContainer.innerHTML = state.quizHistory.slice(0, 5).map(q => `
        <div class="quiz-history-card">
          <div class="qh-info">
            <strong>${escapeHtml(q.subject)} Quiz</strong>
            <span>${q.date}</span>
          </div>
          <div class="qh-score ${q.score >= 70 ? 'high' : 'medium'}">${q.score}% (${q.correct}/${q.total})</div>
        </div>
      `).join('');
    }
  }
}

async function generateStudyPlanSubmit() {
  const subject = document.getElementById('plan-subject').value.trim();
  const days = document.getElementById('plan-days').value;
  const topic = document.getElementById('plan-topic').value.trim();

  if (!subject) {
    showToast('Please enter a subject for the study plan!', 'warning');
    return;
  }

  const btnPlan = document.getElementById('btn-generate-plan');
  setBtnLoading(btnPlan, true, 'Generating Plan...');

  const resultArea = document.getElementById('study-plan-result');
  const resultContent = document.getElementById('study-plan-content');
  resultArea.classList.remove('hidden');
  resultContent.innerHTML = '<em>Generating your personalized study plan... 📅</em>';

  let accumulated = '';

  try {
    await streamResponse(
      '/progress/study-plan',
      { subject, daysAvailable: days, examTopic: topic },
      (chunk) => {
        accumulated += chunk;
        resultContent.innerHTML = renderMarkdown(accumulated);
      },
      (fullText) => {
        resultContent.innerHTML = renderMarkdown(fullText || accumulated);
        setBtnLoading(btnPlan, false, '📅 Generate Plan');
        showToast('Study plan created!', 'success');
      },
      (err) => {
        resultContent.innerHTML = `<div style="color: var(--error)">Error: ${err}</div>`;
        setBtnLoading(btnPlan, false, '📅 Generate Plan');
      }
    );
  } catch (err) {
    resultContent.innerHTML = `<div style="color: var(--error)">Failed to generate plan.</div>`;
    setBtnLoading(btnPlan, false, '📅 Generate Plan');
  }
}

// ════════════════════════════════════════════════════════════════════
// PROFILE VIEW
// ════════════════════════════════════════════════════════════════════

function initProfileEvents() {
  const btnSave = document.getElementById('btn-save-profile');
  if (btnSave) {
    btnSave.addEventListener('click', async () => {
      const name = document.getElementById('prof-name').value.trim();
      const cls = document.getElementById('prof-class').value;

      if (!name) {
        showToast('Name cannot be empty!', 'warning');
        return;
      }

      setBtnLoading(btnSave, true, 'Saving...');

      try {
        const res = await apiCall('/auth/me', 'PUT', {
          full_name: name,
          class_level: parseInt(cls)
        });
        state.user = res.user;
        saveAuthSession();
        updateUserUI();
        showToast('Profile updated successfully! ✅', 'success');
      } catch (e) {
        showToast('Failed to update profile.', 'error');
      } finally {
        setBtnLoading(btnSave, false, 'Save Changes');
      }
    });
  }

  const btnClearData = document.getElementById('btn-clear-data');
  if (btnClearData) {
    btnClearData.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all chat history and progress data?')) {
        state.chats = [];
        state.stats = { questionsAsked: 0, topicsLearned: 0, bestScore: 0, dayStreak: 1, quizzesTaken: 0, totalQuizScore: 0, subjectStats: {} };
        state.quizHistory = [];
        saveChatsToStorage();
        saveStatsToStorage();
        saveQuizHistoryToStorage();
        renderChatHistoryList();
        renderHomeStats();
        showToast('All local data cleared.', 'info');
      }
    });
  }
}

// ════════════════════════════════════════════════════════════════════
// STREAMING & API NETWORK HELPERS
// ════════════════════════════════════════════════════════════════════

async function streamResponse(endpoint, payload, onChunk, onDone, onError) {
  const headers = { 'Content-Type': 'application/json' };
  if (state.token) headers['Authorization'] = `Bearer ${state.token}`;

  let response;
  try {
    response = await fetch(`${CONFIG.API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
  } catch (e) {
    if (onError) onError('Network connection error.');
    return;
  }

  if (!response.ok) {
    if (onError) onError(`Server returned status ${response.status}`);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop(); // keep partial trailing line

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data: ')) {
        const jsonStr = trimmed.slice(6);
        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed.error) {
            if (onError) onError(parsed.error);
            return;
          }
          if (parsed.text && onChunk) {
            onChunk(parsed.text);
          }
          if (parsed.done && onDone) {
            onDone(parsed.fullText);
          }
        } catch (err) {
          // ignore parse errors on SSE line
        }
      }
    }
  }

  if (onDone) onDone();
}

async function apiCall(endpoint, method = 'GET', body = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (state.token) headers['Authorization'] = `Bearer ${state.token}`;

  const opts = { method, headers };
  if (body && method !== 'GET') opts.body = JSON.stringify(body);

  const res = await fetch(`${CONFIG.API_URL}${endpoint}`, opts);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || data.error || 'Server error occurred');
  }

  return data;
}

// ════════════════════════════════════════════════════════════════════
// GENERAL UTILITIES & MARKDOWN RENDERING
// ════════════════════════════════════════════════════════════════════

function renderMarkdown(content) {
  if (!content) return '';
  if (window.marked && window.DOMPurify) {
    return DOMPurify.sanitize(marked.parse(content));
  }
  if (window.marked) {
    return marked.parse(content);
  }
  return escapeHtml(content).replace(/\n/g, '<br>');
}

function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '❌';
  if (type === 'warning') icon = '⚠️';

  toast.innerHTML = `<span class="toast-icon">${icon}</span> <span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

function setBtnLoading(btn, isLoading, loadingText = '') {
  if (!btn) return;
  const textSpan = btn.querySelector('.btn-text');
  const loaderSpan = btn.querySelector('.btn-loader');

  if (isLoading) {
    btn.disabled = true;
    if (textSpan) textSpan.dataset.orig = textSpan.textContent;
    if (textSpan && loadingText) textSpan.textContent = loadingText;
    if (loaderSpan) loaderSpan.classList.remove('hidden');
  } else {
    btn.disabled = false;
    if (textSpan && textSpan.dataset.orig) textSpan.textContent = textSpan.dataset.orig;
    if (loaderSpan) loaderSpan.classList.add('hidden');
  }
}

function showError(errorDiv, msg) {
  if (!errorDiv) return;
  errorDiv.textContent = msg;
  errorDiv.classList.remove('hidden');
}

function hideError(errorDiv) {
  if (!errorDiv) return;
  errorDiv.classList.add('hidden');
}

function initPasswordToggles() {
  document.querySelectorAll('.toggle-pw').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      if (input) {
        const isPw = input.type === 'password';
        input.type = isPw ? 'text' : 'password';
        btn.textContent = isPw ? '🙈' : '👁';
      }
    });
  });
}