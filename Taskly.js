/* ================== BACKEND CONFIGURATION ================== */
const API_BASE_URL = 'https://taskly-backend-2-qxyx.onrender.com/api'; // Change this to your backend URL
let authToken = localStorage.getItem('tasklyToken') || null;

/* ================== API HELPER FUNCTIONS ================== */
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers
        });

        if (!response.ok) {
            if (response.status === 401) {
                // Token expired or invalid
                localStorage.removeItem('tasklyToken');
                authToken = null;
                showPage('loginPage');
                throw new Error('Session expired. Please log in again.');
            }
            throw new Error(`API request failed: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Request Error:', error);
        // Fallback to localStorage for offline mode
        if (isOffline()) {
            return { success: false, error: 'Offline mode' };
        }
        throw error;
    }
}

function isOffline() {
    return !navigator.onLine;
}

function setAuthToken(token) {
    authToken = token;
    localStorage.setItem('tasklyToken', token);
}

function clearAuthToken() {
    authToken = null;
    localStorage.removeItem('tasklyToken');
}

/* ================== BACKEND USER FUNCTIONS ================== */
async function registerUser(userData) {
    try {
        const response = await apiRequest('/register', {
            method: 'POST',
            body: JSON.stringify({
                email: userData.email,
                password: userData.pass,
                firstName: userData.fName,
                lastName: userData.lName
            })
        });

        if (response.success) {
            setAuthToken(response.token);
            setCurrentUser(response.user);
            initUserData(response.user.email);
            return { success: true, user: response.user };
        } else {
            return { success: false, error: response.error };
        }
    } catch (error) {
        // Fallback to localStorage if backend is unavailable
        if (isOffline()) {
            return registerUserLocal(userData);
        }
        return { success: false, error: error.message };
    }
}

async function loginUser(email, password) {
    try {
        const response = await apiRequest('/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (response.success) {
            setAuthToken(response.token);
            setCurrentUser(response.user);
            initUserData(response.user.email);
            return { success: true, user: response.user };
        } else {
            return { success: false, error: response.error };
        }
    } catch (error) {
        // Fallback to localStorage if backend is unavailable
        if (isOffline()) {
            return loginUserLocal(email, password);
        }
        return { success: false, error: error.message };
    }
}

async function getUserProfile() {
    try {
        const response = await apiRequest('/profile');
        if (response.success) {
            return { success: true, user: response.user };
        }
        return { success: false, error: response.error };
    } catch (error) {
        // Fallback to localStorage
        const user = getCurrentUser();
        return { success: true, user: user || {} };
    }
}

async function updateUserProfile(updates) {
    try {
        const response = await apiRequest('/profile', {
            method: 'PUT',
            body: JSON.stringify(updates)
        });

        if (response.success) {
            const currentUser = getCurrentUser();
            const updatedUser = { ...currentUser, ...response.user };
            setCurrentUser(updatedUser);
            return { success: true, user: updatedUser };
        }
        return { success: false, error: response.error };
    } catch (error) {
        // Fallback to localStorage
        const currentUser = getCurrentUser();
        const updatedUser = { ...currentUser, ...updates };
        setCurrentUser(updatedUser);
        updateUserLocal(currentUser.email, updatedUser);
        return { success: true, user: updatedUser };
    }
}

async function changePassword(currentPassword, newPassword) {
    try {
        const response = await apiRequest('/change-password', {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword })
        });

        if (response.success) {
            return { success: true, message: response.message };
        }
        return { success: false, error: response.error };
    } catch (error) {
        // Fallback to localStorage
        return changePasswordLocal(currentPassword, newPassword);
    }
}

/* ================== BACKEND TASK FUNCTIONS ================== */
async function getTasks() {
    try {
        const response = await apiRequest('/tasks');
        if (response.success) {
            return { success: true, tasks: response.tasks || [] };
        }
        return { success: false, error: response.error, tasks: [] };
    } catch (error) {
        // Fallback to localStorage
        const tasks = getUserTasks();
        return { success: true, tasks };
    }
}

async function createTask(task) {
    try {
        const response = await apiRequest('/tasks', {
            method: 'POST',
            body: JSON.stringify(task)
        });

        if (response.success) {
            return { success: true, task: response.task };
        }
        return { success: false, error: response.error };
    } catch (error) {
        // Fallback to localStorage
        return createTaskLocal(task);
    }
}

async function updateTask(taskId, updates) {
    try {
        const response = await apiRequest(`/tasks/${taskId}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });

        if (response.success) {
            return { success: true, task: response.task };
        }
        return { success: false, error: response.error };
    } catch (error) {
        // Fallback to localStorage
        return updateTaskLocal(taskId, updates);
    }
}

async function deleteTask(taskId) {
    try {
        const response = await apiRequest(`/tasks/${taskId}`, {
            method: 'DELETE'
        });

        if (response.success) {
            return { success: true };
        }
        return { success: false, error: response.error };
    } catch (error) {
        // Fallback to localStorage
        return deleteTaskLocal(taskId);
    }
}

async function archiveTask(taskId) {
    try {
        const response = await apiRequest(`/tasks/${taskId}/archive`, {
            method: 'POST'
        });

        if (response.success) {
            return { success: true, task: response.task };
        }
        return { success: false, error: response.error };
    } catch (error) {
        // Fallback to localStorage
        return archiveTaskLocal(taskId);
    }
}

async function getArchivedTasks() {
    try {
        const response = await apiRequest('/tasks/archived');
        if (response.success) {
            return { success: true, tasks: response.tasks || [] };
        }
        return { success: false, error: response.error, tasks: [] };
    } catch (error) {
        // Fallback to localStorage
        const trash = getUserTrash();
        return { success: true, tasks: trash };
    }
}

async function restoreTask(taskId) {
    try {
        const response = await apiRequest(`/tasks/${taskId}/restore`, {
            method: 'POST'
        });

        if (response.success) {
            return { success: true, task: response.task };
        }
        return { success: false, error: response.error };
    } catch (error) {
        // Fallback to localStorage
        return restoreTaskLocal(taskId);
    }
}

/* ================== LOCALSTORAGE FALLBACK FUNCTIONS ================== */
function registerUserLocal(userData) {
    const users = getAllUsers();
    if (findUserByEmail(userData.email)) {
        return { success: false, error: 'User already exists' };
    }

    const user = {
        ...userData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        hasSeenTutorial: false
    };

    saveUser(user);
    return { success: true, user };
}

function loginUserLocal(email, password) {
    const user = findUserByEmail(email.toLowerCase());
    if (!user) {
        return { success: false, error: 'User not found' };
    }
    if (user.pass !== password) {
        return { success: false, error: 'Invalid password' };
    }

    setCurrentUser(user);
    return { success: true, user };
}

function changePasswordLocal(currentPassword, newPassword) {
    const user = getCurrentUser();
    if (!user) {
        return { success: false, error: 'User not logged in' };
    }
    if (user.pass !== currentPassword) {
        return { success: false, error: 'Current password is incorrect' };
    }

    user.pass = newPassword;
    setCurrentUser(user);
    updateUserLocal(user.email, user);
    return { success: true, message: 'Password changed successfully' };
}

function createTaskLocal(task) {
    const tasks = getUserTasks();
    const newTask = {
        ...task,
        id: Date.now().toString(),
        created_at: new Date().toISOString()
    };
    tasks.push(newTask);
    saveUserTasks(tasks);
    return { success: true, task: newTask };
}

function updateTaskLocal(taskId, updates) {
    const tasks = getUserTasks();
    const index = tasks.findIndex(t => t.id === taskId || t.id === parseInt(taskId));
    if (index === -1) return { success: false, error: 'Task not found' };
    
    tasks[index] = { ...tasks[index], ...updates };
    saveUserTasks(tasks);
    return { success: true, task: tasks[index] };
}

function deleteTaskLocal(taskId) {
    const tasks = getUserTasks();
    const index = tasks.findIndex(t => t.id === taskId || t.id === parseInt(taskId));
    if (index === -1) return { success: false, error: 'Task not found' };
    
    tasks.splice(index, 1);
    saveUserTasks(tasks);
    return { success: true };
}

function archiveTaskLocal(taskId) {
    const tasks = getUserTasks();
    const index = tasks.findIndex(t => t.id === taskId || t.id === parseInt(taskId));
    if (index === -1) return { success: false, error: 'Task not found' };
    
    const taskToArchive = { 
        ...tasks[index], 
        archived: true, 
        archived_at: new Date().toISOString() 
    };
    
    const trash = getUserTrash();
    trash.push(taskToArchive);
    saveUserTrash(trash);
    
    tasks.splice(index, 1);
    saveUserTasks(tasks);
    return { success: true, task: taskToArchive };
}

function restoreTaskLocal(taskId) {
    const trash = getUserTrash();
    const index = trash.findIndex(t => t.id === taskId || t.id === parseInt(taskId));
    if (index === -1) return { success: false, error: 'Task not found in archive' };
    
    const taskToRestore = { ...trash[index] };
    delete taskToRestore.archived;
    delete taskToRestore.archived_at;
    
    const tasks = getUserTasks();
    tasks.push(taskToRestore);
    saveUserTasks(tasks);
    
    trash.splice(index, 1);
    saveUserTrash(trash);
    return { success: true, task: taskToRestore };
}

/* ================== PAGE HISTORY STACK ================== */
let pageHistory = [];

/* ================== PAGE SWITCHER ================== */
function showPage(id) {
  // Don't add login/register pages to history
  if (!['loginPage', 'registerPage', 'forgotPasswordPage', 'changePasswordPage'].includes(id)) {
    pageHistory = pageHistory.filter(page => page !== id);
    pageHistory.push(id);
  }

  const pages = [
    'loginPage', 'registerPage', 'dashboardPage', 'forgotPasswordPage',
    'aboutPage', 'privacyPage', 'settingsPage', 'editProfilePage', 'profilePage',
    'changePasswordPage', 'trashPage'
  ];
  
  pages.forEach(p => {
    const el = document.getElementById(p);
    if (!el) return;

    if (['loginPage', 'registerPage', 'dashboardPage', 'editProfilePage', 'forgotPasswordPage', 'profilePage', 'changePasswordPage'].includes(p)) {
      el.classList.toggle('hidden', p !== id);
    } else {
      el.classList.toggle('show', p === id);
    }
    el.setAttribute('aria-hidden', p !== id ? 'true' : 'false');
  });

  // Load data when showing specific pages
  if (id === 'profilePage') {
    loadProfilePage();
  } else if (id === 'editProfilePage') {
    loadEditProfile();
  } else if (id === 'trashPage') {
    loadTrashPage();
  }

  applyTheme();
  updateThemeHeaders();
}

// Show login page initially
showPage('loginPage');

/* ================== GO BACK FUNCTION ================== */
function goBack() {
  if (pageHistory.length <= 1) {
    showPage('dashboardPage');
    pageHistory = ['dashboardPage'];
    return;
  }

  pageHistory.pop();
  const previousPage = pageHistory[pageHistory.length - 1];

  if (previousPage) {
    showPage(previousPage);
  } else {
    showPage('dashboardPage');
    pageHistory = ['dashboardPage'];
  }
}

/* ================== THEME MANAGEMENT ================== */
function getTheme() {
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.theme) {
    return currentUser.theme;
  }
  return localStorage.getItem('tasklyTheme') || 'light';
}

function saveTheme(theme) {
  const currentUser = getCurrentUser();
  if (currentUser) {
    currentUser.theme = theme;
    updateUserLocal(currentUser.email, currentUser);
    // Also try to update on backend
    updateUserProfile({ theme });
  }
  localStorage.setItem('tasklyTheme', theme);
}

function applyTheme() {
  const theme = getTheme();
  const root = document.documentElement;

  // Check if we're on an auth page
  const isAuthPage =
    document.getElementById('loginPage') && !document.getElementById('loginPage').classList.contains('hidden') ||
    document.getElementById('registerPage') && !document.getElementById('registerPage').classList.contains('hidden') ||
    document.getElementById('forgotPasswordPage') && !document.getElementById('forgotPasswordPage').classList.contains('hidden') ||
    document.getElementById('changePasswordPage') && !document.getElementById('changePasswordPage').classList.contains('hidden');

  // Don't apply theme changes to auth pages
  if (isAuthPage) {
    return;
  }

  // Apply theme to non-auth pages
  if (theme === 'dark') {
    root.style.setProperty('--bg-primary', '#121212');
    root.style.setProperty('--bg-secondary', '#1e1e1e');
    root.style.setProperty('--text-primary', '#ffffff');
    root.style.setProperty('--text-secondary', '#b0b0b0');
    root.style.setProperty('--accent-color', '#bb86fc');
    root.style.setProperty('--accent-secondary', '#9c64f7');
    root.style.setProperty('--border-color', '#333333');
    root.style.setProperty('--card-bg', '#1e1e1e');
    root.style.setProperty('--shadow-color', 'rgba(0, 0, 0, 0.4)');
    root.style.setProperty('--glow-color', 'rgba(187, 134, 252, 0.6)');
  } else if (theme === 'blue') {
    root.style.setProperty('--bg-primary', '#e3f2fd');
    root.style.setProperty('--bg-secondary', '#bbdefb');
    root.style.setProperty('--text-primary', '#0a2942');
    root.style.setProperty('--text-secondary', '#2c3e50');
    root.style.setProperty('--accent-color', '#2196f3');
    root.style.setProperty('--accent-secondary', '#1976d2');
    root.style.setProperty('--border-color', '#90caf9');
    root.style.setProperty('--card-bg', '#bbdefb');
    root.style.setProperty('--shadow-color', 'rgba(33, 150, 243, 0.15)');
    root.style.setProperty('--glow-color', 'rgba(33, 150, 243, 0.6)');
  } else if (theme === 'green') {
    root.style.setProperty('--bg-primary', '#e8f5e9');
    root.style.setProperty('--bg-secondary', '#c8e6c9');
    root.style.setProperty('--text-primary', '#1a331a');
    root.style.setProperty('--text-secondary', '#2d4d2d');
    root.style.setProperty('--accent-color', '#4caf50');
    root.style.setProperty('--accent-secondary', '#388e3c');
    root.style.setProperty('--border-color', '#a5d6a7');
    root.style.setProperty('--card-bg', '#c8e6c9');
    root.style.setProperty('--shadow-color', 'rgba(76, 175, 80, 0.15)');
    root.style.setProperty('--glow-color', 'rgba(76, 175, 80, 0.6)');
  } else { // light theme (default)
    root.style.setProperty('--bg-primary', '#F8F4E5');
    root.style.setProperty('--bg-secondary', '#FFFFFF');
    root.style.setProperty('--text-primary', '#2C1810');
    root.style.setProperty('--text-secondary', '#8B7355');
    root.style.setProperty('--accent-color', '#FFC107');
    root.style.setProperty('--accent-secondary', '#FFB300');
    root.style.setProperty('--border-color', '#E6D7C4');
    root.style.setProperty('--card-bg', '#FFFFFF');
    root.style.setProperty('--shadow-color', 'rgba(77, 53, 32, 0.08)');
    root.style.setProperty('--glow-color', 'rgba(255, 193, 7, 0.6)');
  }

  // Update active theme preview
  document.querySelectorAll('.theme-preview').forEach(preview => {
    preview.classList.remove('active');
    if (preview.dataset.theme === theme) {
      preview.classList.add('active');
    }
  });
}

function updateThemeHeaders() {
  const theme = getTheme();
  const headers = document.querySelectorAll('.profile-header, .edit-header, .settings-header, .about-header, .privacy-header, .trash-header');

  headers.forEach(header => {
    if (theme === 'dark') {
      header.style.background = '#1a1a2e';
      header.style.color = 'white';
    } else if (theme === 'blue') {
      header.style.background = '#0d47a1';
      header.style.color = 'white';
    } else if (theme === 'green') {
      header.style.background = '#1b5e20';
      header.style.color = 'white';
    } else {
      header.style.background = '#2C1810';
      header.style.color = 'white';
    }
  });
}

function toggleTheme(theme) {
  saveTheme(theme);
  applyTheme();
  updateThemeHeaders();
}

/* ================== CHANGE PASSWORD ================== */
function openChangePasswordPage() {
  showPage('changePasswordPage');
}

async function changePassword() {
  const currentPass = document.getElementById('currentPassword').value.trim();
  const newPass = document.getElementById('newPassword').value.trim();
  const confirmPass = document.getElementById('confirmPassword').value.trim();

  if (!currentPass || !newPass || !confirmPass) {
    alert('Please fill all fields');
    return;
  }

  if (newPass.length < 6) {
    alert('New password must be at least 6 characters');
    return;
  }

  if (newPass !== confirmPass) {
    alert('New passwords do not match');
    return;
  }

  const result = await changePassword(currentPass, newPass);
  if (result.success) {
    alert('Password changed successfully!');
    showPage('settingsPage');
  } else {
    alert(result.error || 'Failed to change password');
  }
}

/* ================== EMAIL VALIDATION ================== */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateEmail(email) {
  const emailLower = email.toLowerCase().trim();

  if (!emailLower) {
    return { isValid: false, message: 'Email is required' };
  }

  if (!isValidEmail(emailLower)) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }

  return { isValid: true, message: 'Valid email' };
}

/* ================== USER DATABASE (LOCALSTORAGE) ================== */
function getAllUsers() {
  const usersStr = localStorage.getItem('tasklyUsers');
  return usersStr ? JSON.parse(usersStr) : [];
}

function getCurrentUser() {
  const userStr = localStorage.getItem('tasklyUser');
  return userStr ? JSON.parse(userStr) : null;
}

function setCurrentUser(user) {
  localStorage.setItem('tasklyUser', JSON.stringify(user));
}

function saveUser(user) {
  const users = getAllUsers();
  users.push(user);
  localStorage.setItem('tasklyUsers', JSON.stringify(users));
  setCurrentUser(user);
  initUserData(user.email);
}

function findUserByEmail(email) {
  const users = getAllUsers();
  return users.find(user => user.email === email);
}

function updateUserLocal(email, updatedUser) {
  const users = getAllUsers();
  const index = users.findIndex(user => user.email === email);
  if (index !== -1) {
    users[index] = { ...users[index], ...updatedUser };
    localStorage.setItem('tasklyUsers', JSON.stringify(users));

    const currentUser = getCurrentUser();
    if (currentUser && currentUser.email === email) {
      setCurrentUser(users[index]);
    }
    return true;
  }
  return false;
}

/* ================== USER-SPECIFIC DATA ================== */
function initUserData(email) {
  if (!localStorage.getItem(`tasklyTasks_${email}`)) {
    localStorage.setItem(`tasklyTasks_${email}`, JSON.stringify([]));
  }
  if (!localStorage.getItem(`tasklyReminders_${email}`)) {
    localStorage.setItem(`tasklyReminders_${email}`, JSON.stringify([]));
  }
  if (!localStorage.getItem(`tasklyTrash_${email}`)) {
    localStorage.setItem(`tasklyTrash_${email}`, JSON.stringify([]));
  }
  if (!localStorage.getItem(`tasklyProfileImg_${email}`)) {
    const defaultImg = `https://ui-avatars.com/api/?name=${encodeURIComponent('User')}&background=FFC107&color=2C1810&size=200`;
    localStorage.setItem(`tasklyProfileImg_${email}`, defaultImg);
  }
}

function getUserTasks() {
  const user = getCurrentUser();
  if (!user || !user.email) return [];
  const tasksStr = localStorage.getItem(`tasklyTasks_${user.email}`);
  return tasksStr ? JSON.parse(tasksStr) : [];
}

function saveUserTasks(tasks) {
  const user = getCurrentUser();
  if (!user || !user.email) return;
  localStorage.setItem(`tasklyTasks_${user.email}`, JSON.stringify(tasks));
}

function getUserReminders() {
  const user = getCurrentUser();
  if (!user || !user.email) return [];
  const remindersStr = localStorage.getItem(`tasklyReminders_${user.email}`);
  return remindersStr ? JSON.parse(remindersStr) : [];
}

function saveUserReminders(reminders) {
  const user = getCurrentUser();
  if (!user || !user.email) return;
  localStorage.setItem(`tasklyReminders_${user.email}`, JSON.stringify(reminders));
}

function getUserTrash() {
  const user = getCurrentUser();
  if (!user || !user.email) return [];
  const trashStr = localStorage.getItem(`tasklyTrash_${user.email}`);
  return trashStr ? JSON.parse(trashStr) : [];
}

function saveUserTrash(trash) {
  const user = getCurrentUser();
  if (!user || !user.email) return;
  localStorage.setItem(`tasklyTrash_${user.email}`, JSON.stringify(trash));
}

function getUserProfileImg() {
  const user = getCurrentUser();
  if (!user || !user.email) {
    return 'https://via.placeholder.com/200';
  }
  const img = localStorage.getItem(`tasklyProfileImg_${user.email}`);
  return img || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fName || user.first_name || 'User')}&background=FFC107&color=2C1810&size=200`;
}

function saveUserProfileImg(imgUrl) {
  const user = getCurrentUser();
  if (!user || !user.email) return;
  localStorage.setItem(`tasklyProfileImg_${user.email}`, imgUrl);
}

/* ================== GOOGLE SIGN-IN ================== */
function simulateGoogleSignInFlow(isRegister = false) {
  const googleModal = document.createElement('div');
  googleModal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  `;

  const googleContent = document.createElement('div');
  googleContent.style.cssText = `
    background: white;
    padding: 30px;
    border-radius: 12px;
    width: 90%;
    max-width: 400px;
    text-align: center;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  `;

  const isLoginPage = !document.getElementById('loginPage').classList.contains('hidden');

  if (isLoginPage) {
    googleContent.innerHTML = `
      <h3 style="margin-bottom: 20px; color: #333;">Google Sign-In</h3>
      <p style="color: #666; margin-bottom: 20px;">Enter your Google email to sign in</p>
      <input type="email" id="googleEmailInput" placeholder="yourname@gmail.com" 
        style="width: 100%; padding: 12px; margin-bottom: 15px; border: 2px solid #ddd; border-radius: 8px; font-size: 16px;">
      <div id="emailValidationMessage" style="color: #e74c3c; font-size: 14px; margin-bottom: 10px; min-height: 20px;"></div>
      <div style="display: flex; gap: 10px; justify-content: center;">
        <button id="googleCancel" style="padding: 12px 24px; background: #f0f0f0; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
          Cancel
        </button>
        <button id="googleContinue" style="padding: 12px 24px; background: #4285F4; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
          Continue
        </button>
      </div>
    `;
  } else {
    googleContent.innerHTML = `
      <h3 style="margin-bottom: 20px; color: #333;">Google Sign-Up</h3>
      <p style="color: #666; margin-bottom: 20px;">Enter your Google email to create account</p>
      <input type="email" id="googleEmailInput" placeholder="yourname@gmail.com" 
        style="width: 100%; padding: 12px; margin-bottom: 15px; border: 2px solid #ddd; border-radius: 8px; font-size: 16px;">
      <div id="emailValidationMessage" style="color: #e74c3c; font-size: 14px; margin-bottom: 10px; min-height: 20px;"></div>
      <div style="display: flex; gap: 10px; justify-content: center;">
        <button id="googleCancel" style="padding: 12px 24px; background: #f0f0f0; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
          Cancel
        </button>
        <button id="googleContinue" style="padding: 12px 24px; background: #4285F4; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
          Continue
        </button>
      </div>
    `;
  }

  googleModal.appendChild(googleContent);
  document.body.appendChild(googleModal);

  setTimeout(() => {
    document.getElementById('googleEmailInput').focus();
  }, 100);

  const emailInput = document.getElementById('googleEmailInput');
  const validationMessage = document.getElementById('emailValidationMessage');

  emailInput.addEventListener('input', () => {
    const email = emailInput.value.trim();
    if (!email) {
      validationMessage.textContent = '';
      return;
    }

    const validation = validateEmail(email);
    if (!validation.isValid) {
      validationMessage.textContent = validation.message;
      validationMessage.style.color = '#e74c3c';
    } else {
      validationMessage.textContent = '✓ Valid email format';
      validationMessage.style.color = '#27ae60';
    }
  });

  document.getElementById('googleCancel').addEventListener('click', () => {
    document.body.removeChild(googleModal);
  });

  document.getElementById('googleContinue').addEventListener('click', async () => {
    const googleEmail = emailInput.value.trim();

    if (!googleEmail) {
      alert('Please enter an email address');
      return;
    }

    const emailValidation = validateEmail(googleEmail);
    if (!emailValidation.isValid) {
      alert(emailValidation.message);
      return;
    }

    const emailLower = googleEmail.toLowerCase();
    
    try {
      // Try backend first
      const loginResult = await loginUser(emailLower, 'google-temp-password');
      if (loginResult.success) {
        document.body.removeChild(googleModal);
        showPage('dashboardPage');
        loadTasks();
        loadProfilePreview();
        startReminderTimers();
        alert(`Welcome back ${loginResult.user.firstName || loginResult.user.fName}!`);
        return;
      }
    } catch (error) {
      // Fallback to localStorage
      const existingUser = findUserByEmail(emailLower);
      if (existingUser) {
        if (existingUser.isGoogleUser) {
          setCurrentUser(existingUser);
          document.body.removeChild(googleModal);
          showPage('dashboardPage');
          loadTasks();
          loadProfilePreview();
          startReminderTimers();
          alert(`Welcome back ${existingUser.fName}!`);
        } else {
          alert('This email is already registered with regular account. Please use email/password login.');
        }
        return;
      }
    }

    // New Google user
    document.body.removeChild(googleModal);
    createGoogleAccountWithPassword(emailLower);
  });

  emailInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('googleContinue').click();
    }
  });

  googleModal.addEventListener('click', (e) => {
    if (e.target === googleModal) {
      document.body.removeChild(googleModal);
    }
  });
}

function createGoogleAccountWithPassword(googleEmail) {
  const passwordModal = document.createElement('div');
  passwordModal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  `;

  const passwordContent = document.createElement('div');
  passwordContent.style.cssText = `
    background: white;
    padding: 30px;
    border-radius: 12px;
    width: 90%;
    max-width: 400px;
    text-align: center;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  `;

  const emailName = googleEmail.split('@')[0];
  const suggestedFirstName = emailName.split('.')[0] || 'User';
  const suggestedLastName = emailName.split('.')[1] || 'Name';

  passwordContent.innerHTML = `
    <h3 style="margin-bottom: 20px; color: #333;">Create Account</h3>
    <p style="color: #666; margin-bottom: 10px;">Email: <strong>${googleEmail}</strong></p>
    <p style="color: #666; margin-bottom: 20px;">Create a password for your account</p>
    
    <div style="margin-bottom: 15px; text-align: left;">
      <label style="display: block; margin-bottom: 5px; font-weight: 600;">First Name</label>
      <input type="text" id="googleFirstName" value="${suggestedFirstName.charAt(0).toUpperCase() + suggestedFirstName.slice(1)}" placeholder="First name" 
        style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 16px;">
    </div>
    
    <div style="margin-bottom: 15px; text-align: left;">
      <label style="display: block; margin-bottom: 5px; font-weight: 600;">Last Name</label>
      <input type="text" id="googleLastName" value="${suggestedLastName.charAt(0).toUpperCase() + suggestedLastName.slice(1)}" placeholder="Last name" 
        style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 16px;">
    </div>
    
    <div style="margin-bottom: 15px; text-align: left;">
      <label style="display: block; margin-bottom: 5px; font-weight: 600;">Password</label>
      <input type="password" id="googlePassword" placeholder="Password (min 6 characters)" 
        style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 16px;">
      <div id="passwordStrength" style="font-size: 12px; margin-top: 5px;"></div>
    </div>
    
    <div style="margin-bottom: 20px; text-align: left;">
      <label style="display: block; margin-bottom: 5px; font-weight: 600;">Confirm Password</label>
      <input type="password" id="googleConfirmPassword" placeholder="Confirm password" 
        style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 16px;">
      <div id="passwordMatch" style="font-size: 12px; margin-top: 5px;"></div>
    </div>
    
    <div style="display: flex; gap: 10px; justify-content: center;">
      <button id="googleCreateCancel" style="padding: 12px 24px; background: #f0f0f0; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
        Cancel
      </button>
      <button id="googleCreateAccount" style="padding: 12px 24px; background: #4285F4; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
        Create Account
      </button>
    </div>
  `;

  passwordModal.appendChild(passwordContent);
  document.body.appendChild(passwordModal);

  setTimeout(() => {
    document.getElementById('googleFirstName').focus();
  }, 100);

  const passwordInput = document.getElementById('googlePassword');
  const confirmInput = document.getElementById('googleConfirmPassword');
  const passwordStrength = document.getElementById('passwordStrength');
  const passwordMatch = document.getElementById('passwordMatch');

  passwordInput.addEventListener('input', () => {
    const password = passwordInput.value;
    let strength = 'Weak';
    let color = '#e74c3c';

    if (password.length >= 8) {
      strength = 'Good';
      color = '#f39c12';
    }
    if (password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) {
      strength = 'Strong';
      color = '#27ae60';
    }

    passwordStrength.textContent = `Strength: ${strength}`;
    passwordStrength.style.color = color;
  });

  confirmInput.addEventListener('input', () => {
    if (passwordInput.value && confirmInput.value) {
      if (passwordInput.value === confirmInput.value) {
        passwordMatch.textContent = '✓ Passwords match';
        passwordMatch.style.color = '#27ae60';
      } else {
        passwordMatch.textContent = '✗ Passwords do not match';
        passwordMatch.style.color = '#e74c3c';
      }
    } else {
      passwordMatch.textContent = '';
    }
  });

  document.getElementById('googleCreateCancel').addEventListener('click', () => {
    document.body.removeChild(passwordModal);
  });

  document.getElementById('googleCreateAccount').addEventListener('click', async () => {
    const fName = document.getElementById('googleFirstName').value.trim();
    const lName = document.getElementById('googleLastName').value.trim();
    const password = passwordInput.value.trim();
    const confirmPassword = confirmInput.value.trim();

    if (!fName || !lName || !password || !confirmPassword) {
      alert('Please fill all fields');
      return;
    }

    if (password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    const googleUser = {
      fName,
      lName,
      email: googleEmail,
      pass: password,
      bio: `Hello! I'm ${fName} ${lName}. I'm using Taskly to organize my tasks.`,
      isGoogleUser: true,
      createdAt: new Date().toISOString(),
      theme: 'light',
      hasSeenTutorial: false
    };

    // Try backend registration first
    const registerResult = await registerUser({
      email: googleEmail,
      pass: password,
      fName,
      lName
    });

    if (registerResult.success) {
      document.body.removeChild(passwordModal);
      showPage('dashboardPage');
      loadTasks();
      loadProfilePreview();
      loadProfilePage();
      startReminderTimers();
      alert(`Welcome ${fName}! Your account has been created.`);
    } else {
      // Fallback to localStorage
      saveUser(googleUser);
      document.body.removeChild(passwordModal);
      showPage('dashboardPage');
      loadTasks();
      loadProfilePreview();
      loadProfilePage();
      startReminderTimers();
      alert(`Welcome ${fName}! Your account has been created.`);
    }
  });

  const inputs = ['googleFirstName', 'googleLastName', 'googlePassword', 'googleConfirmPassword'];
  inputs.forEach(inputId => {
    document.getElementById(inputId).addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        document.getElementById('googleCreateAccount').click();
      }
    });
  });

  passwordModal.addEventListener('click', (e) => {
    if (e.target === passwordModal) {
      document.body.removeChild(passwordModal);
    }
  });
}

/* ================== SIDEBAR FUNCTIONS ================== */
let hambOpen = false;

function closeSidebar() {
  hambOpen = false;
  const sidebar = document.getElementById('sidebar');
  const hamburger = document.getElementById('hamburger');
  if (sidebar) sidebar.classList.remove('show');
  if (hamburger) {
    hamburger.classList.remove('open');
    const line = hamburger.querySelector('.line');
    if (line) line.textContent = '☰';
  }
}

/* ================== PROFILE FUNCTIONS ================== */
function loadProfilePreview() {
  const user = getCurrentUser();
  const img = getUserProfileImg();
  const profileNameText = document.getElementById('profileNameText');
  const profileEmailText = document.getElementById('profileEmailText');
  
  if (profileNameText && profileEmailText) {
    if (user && (user.fName || user.first_name)) {
      profileNameText.textContent = `${user.first_name || user.fName || ''} ${user.last_name || user.lName || ''}`;
      profileEmailText.textContent = user.email || '';
    } else {
      profileNameText.textContent = 'Guest';
      profileEmailText.textContent = '';
    }
  }
}

async function loadProfilePage() {
  try {
    const result = await getUserProfile();
    const user = result.success ? result.user : getCurrentUser();
    const img = getUserProfileImg();

    const profilePageName = document.getElementById('profilePageName');
    const profilePageEmail = document.getElementById('profilePageEmail');
    const profilePageBio = document.getElementById('profilePageBio');
    const profilePageImg = document.getElementById('profilePageImg');
    const profilePageJoinDate = document.getElementById('profilePageJoinDate');
    const profileTaskStats = document.getElementById('profileTaskStats');

    if (profilePageName) profilePageName.textContent = user ? `${user.first_name || user.fName || ''} ${user.last_name || user.lName || ''}` : 'Guest';
    if (profilePageEmail) profilePageEmail.textContent = user ? user.email : '';
    if (profilePageBio) profilePageBio.textContent = user ? user.bio || 'No bio yet. Click "Edit Profile" to add one!' : 'Please log in to view profile';
    if (profilePageImg) profilePageImg.src = img;

    if (user && (user.createdAt || user.created_at) && profilePageJoinDate) {
      const joinDate = new Date(user.createdAt || user.created_at);
      profilePageJoinDate.textContent = `Joined ${joinDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    } else if (profilePageJoinDate) {
      profilePageJoinDate.textContent = 'Member since recently';
    }

    const tasks = getUserTasks();
    if (profileTaskStats) profileTaskStats.textContent = `${tasks.length} tasks`;
  } catch (error) {
    console.error('Error loading profile:', error);
  }
}

function loadEditProfile() {
  const user = getCurrentUser();
  if (!user) {
    alert('Please log in to edit profile');
    showPage('loginPage');
    return;
  }
  
  const editFirstFull = document.getElementById('editFirstFull');
  const editLastFull = document.getElementById('editLastFull');
  const editBioFull = document.getElementById('editBioFull');
  const editProfilePreviewFull = document.getElementById('editProfilePreviewFull');
  
  if (editFirstFull) editFirstFull.value = user.first_name || user.fName || '';
  if (editLastFull) editLastFull.value = user.last_name || user.lName || '';
  if (editBioFull) editBioFull.value = user.bio || '';
  const img = getUserProfileImg();
  if (editProfilePreviewFull) editProfilePreviewFull.src = img;
}

async function saveEditProfile() {
  const editFirstFull = document.getElementById('editFirstFull');
  const editLastFull = document.getElementById('editLastFull');
  const editBioFull = document.getElementById('editBioFull');
  const editProfilePreviewFull = document.getElementById('editProfilePreviewFull');
  
  if (!editFirstFull || !editLastFull) return;
  
  const firstName = editFirstFull.value.trim();
  const lastName = editLastFull.value.trim();
  const bio = editBioFull ? editBioFull.value.trim() : '';

  if (!firstName || !lastName) {
    alert('First name and last name are required');
    return;
  }

  const user = getCurrentUser();
  if (!user) {
    alert('Please log in to save changes');
    return;
  }
  
  const updates = {
    firstName,
    lastName,
    bio
  };

  const result = await updateUserProfile(updates);
  if (result.success) {
    if (editProfilePreviewFull) {
      saveUserProfileImg(editProfilePreviewFull.src);
    }

    alert('Profile updated successfully!');
    loadProfilePreview();
    loadProfilePage();
    showPage('profilePage');
  } else {
    alert(result.error || 'Failed to update profile');
  }
}

/* ================== EDIT EMAIL ================== */
function openEditEmailModal() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  `;

  const content = document.createElement('div');
  content.style.cssText = `
    background: white;
    padding: 30px;
    border-radius: 12px;
    width: 90%;
    max-width: 400px;
    text-align: center;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  `;

  content.innerHTML = `
    <h3 style="margin-bottom: 20px; color: #333;">Change Email Address</h3>
    <p style="color: #666; margin-bottom: 10px;">Current email: <strong>${currentUser.email}</strong></p>
    
    <div style="margin-bottom: 15px; text-align: left;">
      <label style="display: block; margin-bottom: 5px; font-weight: 600;">New Email</label>
      <input type="email" id="newEmailInput" placeholder="new@example.com" 
        style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 16px;">
    </div>
    
    <div style="margin-bottom: 15px; text-align: left;">
      <label style="display: block; margin-bottom: 5px; font-weight: 600;">Confirm Password</label>
      <input type="password" id="confirmPasswordForEmail" placeholder="Enter your password" 
        style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 16px;">
    </div>
    
    <div id="emailChangeMessage" style="color: #e74c3c; font-size: 14px; margin-bottom: 10px; min-height: 20px;"></div>
    
    <div style="display: flex; gap: 10px; justify-content: center;">
      <button id="cancelEmailChange" style="padding: 12px 24px; background: #f0f0f0; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
        Cancel
      </button>
      <button id="saveEmailChange" style="padding: 12px 24px; background: #4285F4; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
        Update Email
      </button>
    </div>
  `;

  modal.appendChild(content);
  document.body.appendChild(modal);

  setTimeout(() => {
    const input = document.getElementById('newEmailInput');
    if (input) input.focus();
  }, 100);

  document.getElementById('cancelEmailChange').addEventListener('click', () => {
    document.body.removeChild(modal);
  });

  document.getElementById('saveEmailChange').addEventListener('click', async () => {
    const newEmail = document.getElementById('newEmailInput').value.trim().toLowerCase();
    const password = document.getElementById('confirmPasswordForEmail').value.trim();
    const messageEl = document.getElementById('emailChangeMessage');

    if (!newEmail || !password) {
      messageEl.textContent = 'Please fill all fields';
      return;
    }

    if (newEmail === currentUser.email) {
      messageEl.textContent = 'New email is the same as current email';
      return;
    }

    const emailValidation = validateEmail(newEmail);
    if (!emailValidation.isValid) {
      messageEl.textContent = emailValidation.message;
      return;
    }

    // Note: Email change would require backend API support
    // For now, we'll show a message that this feature requires backend
    messageEl.textContent = 'Email change requires backend API support. Please contact support.';
    
    // In a real implementation, you would call an API endpoint here
    // await apiRequest('/change-email', { method: 'POST', body: JSON.stringify({ newEmail, password }) });
  });
}

/* ================== NOTIFICATIONS ================== */
function notifyPanelOpen() {
  const list = document.getElementById('notifyList');
  const rems = getUserReminders();
  if (list) {
    list.innerHTML = rems.length ? rems.slice().reverse().map(r => `
      <div class="pop-item">${r.title} — ${new Date(r.reminderAt).toLocaleString()}</div>
    `).join('') : '<div style="color:#666">No reminders</div>';
  }
  const notifyPanel = document.getElementById('notifyPanel');
  if (notifyPanel) notifyPanel.classList.add('show');
}

function notifyPanelClose() {
  const notifyPanel = document.getElementById('notifyPanel');
  if (notifyPanel) notifyPanel.classList.remove('show');
}

/* ================== BACKDROP ================== */
function showBackdrop() {
  const backdrop = document.getElementById('backdrop');
  const frame = document.getElementById('frame');
  if (backdrop) backdrop.classList.add('show');
  if (frame) frame.classList.add('scaled');
}

function hideBackdrop() {
  const backdrop = document.getElementById('backdrop');
  const frame = document.getElementById('frame');
  if (backdrop) backdrop.classList.remove('show');
  if (frame) frame.classList.remove('scaled');
}

/* ================== TASK MANAGEMENT ================== */
let editingIndex = null;
let editingTaskId = null;
let reminderTimers = [];

function openAddCard(editTask = null) {
  editingIndex = editTask ? editTask.index : null;
  editingTaskId = editTask ? editTask.id : null;
  const addCardTitle = document.getElementById('addCardTitle');
  if (addCardTitle) {
    addCardTitle.textContent = editTask === null ? 'Add New Task' : 'Edit Task';
  }
  
  if (editTask) {
    document.getElementById('taskTitle').value = editTask.title;
    document.getElementById('taskDescription').value = editTask.description || editTask.desc || '';
    document.getElementById('taskDate').value = editTask.date;
    document.getElementById('taskTime').value = editTask.time;
    document.getElementById('taskPriority').value = editTask.priority || '';
    
    if (editTask.reminder && editTask.reminder.offsetMin != null) {
      const off = editTask.reminder.offsetMin;
      if ([5, 10, 30].includes(off)) {
        document.getElementById('taskReminder').value = String(off);
        document.getElementById('taskReminderCustom').style.display = 'none';
      } else {
        document.getElementById('taskReminder').value = 'custom';
        document.getElementById('taskReminderCustom').style.display = 'inline-block';
        document.getElementById('taskReminderCustom').value = off;
      }
    } else {
      document.getElementById('taskReminder').value = 'none';
      document.getElementById('taskReminderCustom').style.display = 'none';
      document.getElementById('taskReminderCustom').value = '';
    }
  } else {
    resetAddForm();
  }
  
  const addTaskCard = document.getElementById('addTaskCard');
  if (addTaskCard) {
    addTaskCard.classList.add('show');
    addTaskCard.setAttribute('aria-hidden', 'false');
    addTaskCard.scrollTop = 0;
  }
  showBackdrop();
}

function hideAddCard() {
  const addTaskCard = document.getElementById('addTaskCard');
  if (addTaskCard) {
    addTaskCard.classList.remove('show');
    addTaskCard.setAttribute('aria-hidden', 'true');
  }
  resetAddForm();
  hideBackdrop();
}

function resetAddForm() {
  ['taskTitle', 'taskDescription', 'taskDate', 'taskTime'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const taskPriority = document.getElementById('taskPriority');
  if (taskPriority) taskPriority.selectedIndex = 0;
  const taskReminder = document.getElementById('taskReminder');
  if (taskReminder) taskReminder.value = 'none';
  const taskReminderCustom = document.getElementById('taskReminderCustom');
  if (taskReminderCustom) {
    taskReminderCustom.style.display = 'none';
    taskReminderCustom.value = '';
  }
  editingIndex = null;
  editingTaskId = null;
}

async function saveTask() {
  const title = document.getElementById('taskTitle').value.trim();
  const desc = document.getElementById('taskDescription').value.trim();
  const date = document.getElementById('taskDate').value;
  const time = document.getElementById('taskTime').value;
  const priority = document.getElementById('taskPriority').value;
  const remind = document.getElementById('taskReminder').value;
  const customMin = document.getElementById('taskReminderCustom').value ? parseInt(document.getElementById('taskReminderCustom').value, 10) : null;

  if (!title || !desc || !date || !time || !priority) {
    alert('Please fill all fields');
    return;
  }

  let offsetMin = null;
  if (remind === '5') offsetMin = 5;
  else if (remind === '10') offsetMin = 10;
  else if (remind === '30') offsetMin = 30;
  else if (remind === 'custom' && customMin && !isNaN(customMin)) offsetMin = customMin;

  const taskDateTime = new Date(date + 'T' + time);
  let reminderAt = null;
  if (offsetMin !== null) reminderAt = new Date(taskDateTime.getTime() - offsetMin * 60 * 1000);

  const taskObj = {
    title,
    description: desc,
    date,
    time,
    priority,
    reminder: reminderAt ? {
      reminderAt: reminderAt.getTime(),
      reminderAtHuman: reminderAt.toLocaleString(),
      offsetMin
    } : null
  };

  let result;
  if (editingTaskId) {
    result = await updateTask(editingTaskId, taskObj);
  } else {
    result = await createTask(taskObj);
  }

  if (result.success) {
    persistReminders();
    scheduleAllReminders();
    hideAddCard();
    loadTasks();
  } else {
    alert(result.error || 'Failed to save task');
  }
}

function persistReminders() {
  const tasks = getUserTasks();
  const rems = [];
  tasks.forEach((t, idx) => {
    if (t.reminder && t.reminder.reminderAt) rems.push({
      index: idx,
      title: t.title,
      reminderAt: t.reminder.reminderAt
    });
  });
  saveUserReminders(rems);
}

function clearAllTimers() {
  reminderTimers.forEach(t => clearTimeout(t.id));
  reminderTimers = [];
}

function scheduleAllReminders() {
  clearAllTimers();
  const tasks = getUserTasks();
  tasks.forEach((t, idx) => {
    if (t.reminder && t.reminder.reminderAt) {
      const ms = t.reminder.reminderAt - Date.now();
      if (ms > 0) {
        const id = setTimeout(() => {
          alert('Reminder — ' + t.title + ' at ' + new Date(t.reminder.reminderAt).toLocaleString());
          notifyPanelOpen();
          reminderTimers = reminderTimers.filter(x => x.id !== id);
        }, ms);
        reminderTimers.push({ id, index: idx });
      }
    }
  });
}

function startReminderTimers() {
  scheduleAllReminders();
}

/* ================== SWIPE HANDLERS ================== */
async function doDeleteTask(taskId, index) {
  if (!confirm('Are you sure you want to delete this task?')) return;

  const result = await deleteTask(taskId);
  if (result.success) {
    persistReminders();
    scheduleAllReminders();
    loadTasks();
    alert('Task deleted successfully.');
  } else {
    alert(result.error || 'Failed to delete task');
  }
}

async function archiveTaskHandler(taskId, index) {
  const result = await archiveTask(taskId);
  if (result.success) {
    persistReminders();
    scheduleAllReminders();
    loadTasks();
    alert(`Task "${result.task.title}" archived. You can restore it from the Archive page.`);
  } else {
    alert(result.error || 'Failed to archive task');
  }
}

function attachSwipeHandlers(surface, archiveBg, delBg, task) {
  let startX = 0, currentX = 0, touching = false;
  const threshold = 80;

  function unify(e) { return e.changedTouches ? e.changedTouches[0] : e; }

  function onStart(e) {
    const ev = unify(e);
    startX = ev.clientX;
    currentX = 0;
    touching = true;
    surface.style.transition = 'none';

    archiveBg.classList.remove('archive-active');
    delBg.classList.remove('delete-active');

    if (e.type === 'mousedown') {
      document.addEventListener('mousemove', onMove);
    }
  }

  function onMove(e) {
    if (!touching) return;
    const ev = unify(e);
    currentX = ev.clientX - startX;

    if (currentX < -20) {
      const tx = Math.max(currentX, -120);
      surface.style.transform = `translateX(${tx}px)`;
      const ratio = Math.min(Math.abs(tx) / threshold, 1);

      archiveBg.style.opacity = ratio;
      delBg.style.opacity = 0;

      if (Math.abs(currentX) > threshold / 2) {
        archiveBg.classList.add('archive-active');
      } else {
        archiveBg.classList.remove('archive-active');
      }

    } else if (currentX > 20) {
      const tx = Math.min(currentX, 120);
      surface.style.transform = `translateX(${tx}px)`;
      const ratio = Math.min(Math.abs(tx) / threshold, 1);

      delBg.style.opacity = ratio;
      archiveBg.style.opacity = 0;

      if (Math.abs(currentX) > threshold / 2) {
        delBg.classList.add('delete-active');
      } else {
        delBg.classList.remove('delete-active');
      }
    } else {
      archiveBg.style.opacity = 0;
      delBg.style.opacity = 0;
      archiveBg.classList.remove('archive-active');
      delBg.classList.remove('delete-active');
    }
  }

  function onEnd(e) {
    touching = false;
    surface.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';

    if (Math.abs(currentX) > threshold) {
      if (currentX < 0) {
        surface.style.transform = 'translateX(-100%)';
        setTimeout(() => archiveTaskHandler(task.id, task.index), 300);
      } else {
        surface.style.transform = 'translateX(100%)';
        setTimeout(() => doDeleteTask(task.id, task.index), 300);
      }
    } else {
      surface.style.transform = '';
      archiveBg.style.opacity = 0;
      delBg.style.opacity = 0;
      archiveBg.classList.remove('archive-active');
      delBg.classList.remove('delete-active');
    }

    if (e.type === 'mouseup') {
      document.removeEventListener('mousemove', onMove);
    }
  }

  surface.addEventListener('touchstart', onStart, { passive: true });
  surface.addEventListener('touchmove', onMove, { passive: true });
  surface.addEventListener('touchend', onEnd, { passive: true });

  surface.addEventListener('mousedown', onStart);
  surface.addEventListener('mouseup', onEnd);
  surface.addEventListener('mouseleave', () => {
    if (touching) onEnd({ type: 'mouseup' });
  });

  archiveBg.addEventListener('click', () => {
    archiveBg.classList.add('archive-active');
    surface.style.transform = 'translateX(-100%)';
    setTimeout(() => archiveTaskHandler(task.id, task.index), 300);
  });

  delBg.addEventListener('click', () => {
    delBg.classList.add('delete-active');
    surface.style.transform = 'translateX(100%)';
    setTimeout(() => doDeleteTask(task.id, task.index), 300);
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"]/g, s => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  }[s]));
}

async function renderTasksList(tasks) {
  const tasksContainer = document.getElementById('tasksContainer');
  if (!tasksContainer) return;
  
  tasksContainer.innerHTML = '';
  
  if (!tasks || !tasks.length) {
    const empty = document.createElement('div');
    empty.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
      color: var(--text-secondary);
      margin-top: 40px;
    `;
    
    empty.innerHTML = `
      <div style="
        font-size: 48px;
        margin-bottom: 16px;
        opacity: 0.7;
        animation: float 3s ease-in-out infinite;
      ">📝</div>
      <h3 style="
        font-size: 20px;
        font-weight: 700;
        margin-bottom: 8px;
        color: var(--text-primary);
      ">Your tasks are waiting!</h3>
      <p style="
        font-size: 16px;
        line-height: 1.5;
        max-width: 280px;
        margin-bottom: 20px;
        opacity: 0.9;
      ">No tasks yet. Tap the <span style="color: var(--accent-color); font-weight: 700;">+</span> button below to add your first task and start organizing!</p>
      <div style="
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--accent-color);
        font-weight: 600;
        font-size: 15px;
      ">
        <span>👇</span>
        <span>Tap the floating button</span>
        <span>👇</span>
      </div>
    `;
    
    tasksContainer.appendChild(empty);
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }
    `;
    document.head.appendChild(style);
    
    return;
  }

  tasks.forEach((t, idx) => {
    const wrap = document.createElement('div');
    wrap.className = 'swipe-wrap';
    wrap.dataset.index = idx;
    wrap.dataset.taskId = t.id;

    const archiveBg = document.createElement('div');
    archiveBg.className = 'archive-bg';
    archiveBg.innerHTML = '<span>📁</span>';

    const delBg = document.createElement('div');
    delBg.className = 'delete-bg';
    delBg.innerHTML = '<span>🗑</span>';

    const surface = document.createElement('div');
    surface.className = 'task-surface';
    surface.innerHTML = `
      <div style="position:relative;">
        <div class="priority ${t.priority}">${t.priority}</div>
        <strong>${escapeHtml(t.title)}</strong>
        <p>${escapeHtml(t.description || t.desc || '')}</p>
        <small>${t.date} ${t.time}</small>
      </div>`;
    
    surface.addEventListener('click', (e) => {
      e.stopPropagation();
      openAddCard({ ...t, index: idx });
    });

    attachSwipeHandlers(surface, archiveBg, delBg, { ...t, index: idx });

    wrap.appendChild(archiveBg);
    wrap.appendChild(delBg);
    wrap.appendChild(surface);
    tasksContainer.appendChild(wrap);
  });
}

async function loadTasks() {
  const result = await getTasks();
  if (result.success) {
    renderTasksList(result.tasks);
    persistReminders();
  } else {
    // Fallback to localStorage
    const tasks = getUserTasks();
    renderTasksList(tasks);
    persistReminders();
  }
}

/* ================== TRASH/ARCHIVE FUNCTIONS ================== */
async function loadTrashPage() {
  const result = await getArchivedTasks();
  const tasks = result.success ? result.tasks : getUserTrash();
  const container = document.getElementById('trashContainer');

  const trashCount = document.getElementById('trashCount');
  const trashSize = document.getElementById('trashSize');
  
  if (trashCount) trashCount.textContent = `${tasks.length} tasks`;

  const trashJSON = JSON.stringify(tasks);
  const sizeKB = Math.round((trashJSON.length * 2) / 1024);
  if (trashSize) trashSize.textContent = `${sizeKB} KB`;

  if (!container) return;
  container.innerHTML = '';

  if (!tasks || !tasks.length) {
    const empty = document.createElement('div');
    empty.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
      color: var(--text-secondary);
      margin-top: 40px;
    `;
    
    empty.innerHTML = `
      <div style="
        font-size: 48px;
        margin-bottom: 16px;
        opacity: 0.7;
      ">📂</div>
      <h3 style="
        font-size: 20px;
        font-weight: 700;
        margin-bottom: 8px;
        color: var(--text-primary);
      ">Archive is empty</h3>
      <p style="
        font-size: 16px;
        line-height: 1.5;
        max-width: 280px;
        margin-bottom: 20px;
        opacity: 0.9;
      ">No archived tasks yet. Swipe left on tasks in your main list to archive them here.</p>
      <p style="
        font-size: 14px;
        color: var(--text-secondary);
        opacity: 0.8;
      ">Archived tasks are kept for 30 days</p>
    `;
    
    container.appendChild(empty);
    return;
  }

  const sortedTrash = [...tasks].sort((a, b) => {
    return new Date(b.archived_at || b.archivedAt || 0) - new Date(a.archived_at || a.archivedAt || 0);
  });

  sortedTrash.forEach((task, index) => {
    const wrap = document.createElement('div');
    wrap.className = 'swipe-wrap';

    const surface = document.createElement('div');
    surface.className = 'task-surface task-archived';
    surface.innerHTML = `
      <div style="position:relative;">
        <div class="priority ${task.priority}">${task.priority}</div>
        <strong>${escapeHtml(task.title)}</strong>
        <p>${escapeHtml(task.description || task.desc || '')}</p>
        <small>${task.date} ${task.time}</small>
        <div style="margin-top: 8px; font-size: 12px; color: var(--text-secondary);">
          Archived: ${task.archived_at || task.archivedAt ? new Date(task.archived_at || task.archivedAt).toLocaleDateString() : 'Unknown'}
        </div>
      </div>
      <div style="display: flex; gap: 8px; margin-top: 12px;">
        <button class="restore-btn" data-task-id="${task.id}" data-index="${index}" style="
          background: var(--success-color); 
          color: white; 
          border: none; 
          padding: 8px 16px; 
          border-radius: 6px; 
          font-size: 14px;
          cursor: pointer;
        ">Restore</button>
        <button class="delete-permanent-btn" data-task-id="${task.id}" data-index="${index}" style="
          background: var(--danger-color); 
          color: white; 
          border: none; 
          padding: 8px 16px; 
          border-radius: 6px; 
          font-size: 14px;
          cursor: pointer;
        ">Delete</button>
      </div>
    `;

    wrap.appendChild(surface);
    container.appendChild(wrap);
  });

  container.addEventListener('click', async (e) => {
    if (e.target.classList.contains('restore-btn')) {
      e.stopPropagation();
      const taskId = e.target.dataset.taskId;
      const index = parseInt(e.target.dataset.index);
      await restoreFromTrash(taskId, index);
    } else if (e.target.classList.contains('delete-permanent-btn')) {
      e.stopPropagation();
      const taskId = e.target.dataset.taskId;
      const index = parseInt(e.target.dataset.index);
      await deletePermanently(taskId, index);
    }
  });
}

async function restoreFromTrash(taskId, index) {
  const result = await restoreTask(taskId);
  if (result.success) {
    loadTrashPage();
    loadTasks();
    persistReminders();
    scheduleAllReminders();
    alert(`Task "${result.task.title}" restored successfully!`);
  } else {
    alert(result.error || 'Failed to restore task');
  }
}

async function deletePermanently(taskId, index) {
  if (!confirm('Are you sure you want to permanently delete this task? This action cannot be undone.')) {
    return;
  }

  const result = await deleteTask(taskId);
  if (result.success) {
    loadTrashPage();
    alert('Task permanently deleted.');
  } else {
    alert(result.error || 'Failed to delete task');
  }
}

/* ================== TUTORIAL SYSTEM ================== */
let currentStep = 0;
const totalSteps = 5;

const tutorialData = [
  {
    title: "Add Tasks",
    description: "Tap the + button at the bottom right to add new tasks. You can set title, description, due date, time, priority, and reminders.",
    demo: `
      <div class="tutorial-demo">
        <div class="tutorial-icon">📝</div>
        <div class="tutorial-arrow">→</div>
        <div class="tutorial-icon">📅</div>
        <div class="tutorial-arrow">→</div>
        <div class="tutorial-icon">⏰</div>
        <div class="tutorial-arrow">→</div>
        <div class="tutorial-icon">💾</div>
      </div>
    `
  },
  {
    title: "Swipe to Archive",
    description: "Swipe tasks LEFT to archive them. Archived tasks are moved to the Archive page where you can restore them later.",
    demo: `
      <div class="tutorial-demo">
        <div class="tutorial-icon">📁</div>
        <div class="tutorial-arrow">←</div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:5px;">
          <div class="tutorial-icon">📝</div>
          <small style="color:var(--text-secondary);">Task</small>
        </div>
        <div class="tutorial-arrow" style="transform:rotate(180deg);">←</div>
        <div class="tutorial-icon">📂</div>
      </div>
    `
  },
  {
    title: "Swipe to Delete",
    description: "Swipe tasks RIGHT to permanently delete them. Be careful - deleted tasks cannot be recovered!",
    demo: `
      <div class="tutorial-demo">
        <div class="tutorial-icon">🗑️</div>
        <div class="tutorial-arrow">→</div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:5px;">
          <div class="tutorial-icon">📝</div>
          <small style="color:var(--text-secondary);">Task</small>
        </div>
        <div class="tutorial-arrow" style="transform:rotate(180deg);">→</div>
        <div class="tutorial-icon">❌</div>
      </div>
    `
  },
  {
    title: "Access Archive & Settings",
    description: "Tap the ☰ menu button to access Archive, Settings, About, and Privacy pages. Archived tasks are kept for 30 days.",
    demo: `
      <div class="tutorial-demo">
        <div class="tutorial-icon">☰</div>
        <div class="tutorial-arrow">→</div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
          <div class="tutorial-icon">📂</div>
          <div class="tutorial-icon">⚙️</div>
          <div class="tutorial-icon">ℹ️</div>
          <small style="color:var(--text-secondary);">Menu</small>
        </div>
      </div>
    `
  },
  {
    title: "Manage Your Profile",
    description: "Tap the 👤 icon to access your profile. You can edit your name, bio, and profile picture. Log out from here too.",
    demo: `
      <div class="tutorial-demo">
        <div class="tutorial-icon">👤</div>
        <div class="tutorial-arrow">→</div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
          <div class="tutorial-icon">✏️</div>
          <div class="tutorial-icon">📸</div>
          <div class="tutorial-icon">🚪</div>
          <small style="color:var(--text-secondary);">Profile</small>
        </div>
      </div>
    `
  }
];

function showTutorialStep(step) {
  currentStep = step;
  const tutorialSteps = document.getElementById('tutorialSteps');
  const tutorialProgress = document.getElementById('tutorialProgress');
  const nextTutorialBtn = document.getElementById('nextTutorial');
  const skipTutorialBtn = document.getElementById('skipTutorial');

  if (!tutorialSteps || !tutorialProgress || !nextTutorialBtn || !skipTutorialBtn) return;

  tutorialSteps.innerHTML = `
    <div class="tutorial-step">
      <h3><span>${step + 1}</span> ${tutorialData[step].title}</h3>
      <p>${tutorialData[step].description}</p>
      ${tutorialData[step].demo}
    </div>
  `;

  tutorialProgress.innerHTML = '';
  for (let i = 0; i < totalSteps; i++) {
    const dot = document.createElement('div');
    dot.className = `progress-dot ${i === step ? 'active' : ''}`;
    tutorialProgress.appendChild(dot);
  }

  if (step === totalSteps - 1) {
    nextTutorialBtn.textContent = 'Finish Tutorial';
    nextTutorialBtn.className = 'tutorial-btn finish';
  } else {
    nextTutorialBtn.textContent = 'Next →';
    nextTutorialBtn.className = 'tutorial-btn next';
  }

  skipTutorialBtn.style.display = step === totalSteps - 1 ? 'none' : 'block';
}

function endTutorial() {
  const tutorialOverlay = document.getElementById('tutorialOverlay');
  if (tutorialOverlay) tutorialOverlay.classList.remove('show');
  const user = getCurrentUser();
  if (user) {
    user.hasSeenTutorial = true;
    updateUserLocal(user.email, user);
    updateUserProfile({ hasSeenTutorial: true });
  }
}

function handleNextTutorial() {
  if (currentStep < totalSteps - 1) {
    showTutorialStep(currentStep + 1);
  } else {
    endTutorial();
  }
}

/* ================== EVENT LISTENERS INITIALIZATION ================== */
function initializeEventListeners() {
  // Navigation
  document.getElementById('goRegister')?.addEventListener('click', () => showPage('registerPage'));
  document.getElementById('goLogin')?.addEventListener('click', () => showPage('loginPage'));
  document.getElementById('forgotPassword')?.addEventListener('click', () => showPage('forgotPasswordPage'));
  document.getElementById('backToLogin')?.addEventListener('click', () => showPage('loginPage'));

  // Login
  document.getElementById('loginBtn')?.addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPass').value.trim();

    if (!email || !pass) {
      alert('Please enter email and password');
      return;
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      alert(emailValidation.message);
      return;
    }

    const emailLower = email.toLowerCase();
    const result = await loginUser(emailLower, pass);

    if (result.success) {
      showPage('dashboardPage');
      loadTasks();
      loadProfilePreview();
      startReminderTimers();
      
      if (!result.user.hasSeenTutorial) {
        setTimeout(() => {
          showTutorialStep(0);
          document.getElementById('tutorialOverlay').classList.add('show');
          updateUserProfile({ hasSeenTutorial: true });
        }, 1000);
      }
    } else {
      alert(result.error || 'Login failed');
    }
  });

  // Register
  document.getElementById('registerBtn')?.addEventListener('click', handleRegister);

  // Forgot password
  document.getElementById('resetPasswordBtn')?.addEventListener('click', handleForgotPassword);

  // Google buttons
  document.getElementById('googleSign')?.addEventListener('click', () => simulateGoogleSignInFlow(false));
  document.getElementById('googleRegister')?.addEventListener('click', () => simulateGoogleSignInFlow(true));

  // Task buttons
  document.getElementById('openAddTask')?.addEventListener('click', () => openAddCard());
  document.getElementById('saveTaskBtn')?.addEventListener('click', saveTask);
  document.getElementById('cancelAddBtn')?.addEventListener('click', hideAddCard);
  document.getElementById('closeTaskCard')?.addEventListener('click', hideAddCard);

  // Task reminder select
  document.getElementById('taskReminder')?.addEventListener('change', (e) => {
    document.getElementById('taskReminderCustom').style.display = e.target.value === 'custom' ? 'inline-block' : 'none';
  });

  // Sidebar
  document.getElementById('hamburger')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.add('show');
    document.getElementById('hamburger').classList.add('open');
    const line = document.getElementById('hamburger').querySelector('.line');
    if (line) line.textContent = '✖';
  });

  document.getElementById('closeSidebarBtn')?.addEventListener('click', closeSidebar);

  // Sidebar navigation
  document.getElementById('navAbout')?.addEventListener('click', () => { closeSidebar(); showPage('aboutPage'); });
  document.getElementById('navPrivacy')?.addEventListener('click', () => { closeSidebar(); showPage('privacyPage'); });
  document.getElementById('navSettings')?.addEventListener('click', () => { closeSidebar(); showPage('settingsPage'); });
  document.getElementById('navProfile')?.addEventListener('click', () => { closeSidebar(); loadProfilePage(); showPage('profilePage'); });
  document.getElementById('navTrash')?.addEventListener('click', () => { closeSidebar(); showPage('trashPage'); });
  document.getElementById('navTutorial')?.addEventListener('click', () => { closeSidebar(); showTutorialStep(0); document.getElementById('tutorialOverlay').classList.add('show'); });

  // Profile and notifications
  document.getElementById('profileIcon')?.addEventListener('click', (e) => {
    e.stopPropagation();
    notifyPanelClose();
    document.getElementById('profilePanel').classList.toggle('show');
  });

  document.getElementById('notifyIcon')?.addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('profilePanel').classList.remove('show');
    const notifyPanel = document.getElementById('notifyPanel');
    notifyPanel.classList.contains('show') ? notifyPanelClose() : notifyPanelOpen();
  });

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    document.getElementById('profilePanel').classList.remove('show');
    clearAuthToken();
    localStorage.removeItem('tasklyUser');
    showPage('loginPage');
  });

  document.getElementById('openEditProfileFromPopup')?.addEventListener('click', () => {
    document.getElementById('profilePanel').classList.remove('show');
    loadProfilePage();
    showPage('profilePage');
  });

  // Profile page
  document.getElementById('profilePageEditBtn')?.addEventListener('click', () => {
    loadEditProfile();
    showPage('editProfilePage');
  });

  document.getElementById('closeProfilePage')?.addEventListener('click', () => goBack());

  // Edit profile page
  document.getElementById('closeEditPage')?.addEventListener('click', () => goBack());
  document.getElementById('saveEditFull')?.addEventListener('click', saveEditProfile);

  // Edit profile image
  document.getElementById('editImageInputFull')?.addEventListener('change', (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      document.getElementById('editProfilePreviewFull').src = r.result;
      saveUserProfileImg(r.result);
    };
    r.readAsDataURL(f);
  });

  // Notifications
  document.getElementById('clearNotifications')?.addEventListener('click', () => {
    saveUserReminders([]);
    const notifyList = document.getElementById('notifyList');
    if (notifyList) notifyList.innerHTML = '<div style="color:#666">All reminders cleared</div>';
  });

  // Search
  document.getElementById('searchIcon')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const searchInput = document.getElementById('searchInput');
    if (searchInput.classList.contains('show')) {
      searchInput.classList.remove('show');
      searchInput.value = '';
      loadTasks();
    } else {
      searchInput.classList.add('show');
      searchInput.focus();
    }
  });

  document.getElementById('searchInput')?.addEventListener('input', async (e) => {
    const q = e.target.value.trim().toLowerCase();
    const result = await getTasks();
    const tasks = result.success ? result.tasks : getUserTasks();
    const filteredTasks = tasks.filter(t => 
      (t.title + ' ' + (t.description || t.desc || '')).toLowerCase().includes(q)
    );
    renderTasksList(filteredTasks);
  });

  // Backdrop
  document.getElementById('backdrop')?.addEventListener('click', () => {
    hideAddCard();
    hideBackdrop();
  });

  // Password toggles
  document.getElementById('toggleLoginPass')?.addEventListener('click', () => {
    const input = document.getElementById('loginPass');
    const toggle = document.getElementById('toggleLoginPass');
    if (input.type === 'password') {
      input.type = 'text';
      toggle.textContent = '🙈';
    } else {
      input.type = 'password';
      toggle.textContent = '👁️‍🗨️';
    }
  });

  document.getElementById('toggleRegisterPass')?.addEventListener('click', () => {
    const input = document.getElementById('registerPass');
    const toggle = document.getElementById('toggleRegisterPass');
    if (input.type === 'password') {
      input.type = 'text';
      toggle.textContent = '🙈';
    } else {
      input.type = 'password';
      toggle.textContent = '👁️‍🗨️';
    }
  });

  document.getElementById('toggleRegisterConfirm')?.addEventListener('click', () => {
    const input = document.getElementById('registerConfirm');
    const toggle = document.getElementById('toggleRegisterConfirm');
    if (input.type === 'password') {
      input.type = 'text';
      toggle.textContent = '🙈';
    } else {
      input.type = 'password';
      toggle.textContent = '👁️‍🗨️';
    }
  });

  // Remember me
  document.getElementById('rememberMe')?.addEventListener('change', (e) => {
    if (e.target.checked) {
      localStorage.setItem('rememberedEmail', document.getElementById('loginEmail').value);
    } else {
      localStorage.removeItem('rememberedEmail');
    }
  });

  // Theme previews
  document.querySelectorAll('.theme-preview').forEach(preview => {
    preview.addEventListener('click', () => {
      const theme = preview.dataset.theme;
      toggleTheme(theme);
    });
  });

  // Close panels on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#profilePanel') && !e.target.closest('#profileIcon')) {
      document.getElementById('profilePanel')?.classList.remove('show');
    }
    if (!e.target.closest('#notifyPanel') && !e.target.closest('#notifyIcon')) {
      document.getElementById('notifyPanel')?.classList.remove('show');
    }
    if (!e.target.closest('#sidebar') && !e.target.closest('#hamburger')) {
      closeSidebar();
    }
  });

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideAddCard();
      hideBackdrop();
      document.getElementById('tutorialOverlay')?.classList.remove('show');
    }
  });

  // Tutorial
  document.getElementById('nextTutorial')?.addEventListener('click', handleNextTutorial);
  document.getElementById('skipTutorial')?.addEventListener('click', endTutorial);
  document.getElementById('closeTutorial')?.addEventListener('click', endTutorial);
  document.getElementById('tutorialOverlay')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('tutorialOverlay')) {
      endTutorial();
    }
  });

  // Change password
  const changePasswordBtn = document.querySelector('#changePasswordPage .btn-primary');
  if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', changePassword);
  }

  // Trash page buttons
  document.getElementById('restoreAllBtn')?.addEventListener('click', async () => {
    const result = await getArchivedTasks();
    const tasks = result.success ? result.tasks : getUserTrash();
    if (!tasks.length) {
      alert('No tasks to restore.');
      return;
    }
    if (!confirm(`Restore all ${tasks.length} archived tasks?`)) {
      return;
    }

    // Note: This would require a bulk restore endpoint
    alert('Bulk restore requires backend API support. Please restore tasks individually.');
  });

  document.getElementById('emptyTrashBtn')?.addEventListener('click', () => {
    const trash = getUserTrash();
    if (!trash.length) {
      alert('Trash is already empty.');
      return;
    }
    if (!confirm(`Permanently delete all ${trash.length} archived tasks? This action cannot be undone.`)) {
      return;
    }
    saveUserTrash([]);
    loadTrashPage();
    alert(`All ${trash.length} tasks permanently deleted.`);
  });

  // Edit photo click
  const editPhoto = document.querySelector('.edit-photo');
  if (editPhoto) {
    editPhoto.addEventListener('click', e => {
      if (e.target.matches('.edit-photo') || e.offsetY > 130) {
        document.getElementById('editImageInputFull').click();
      }
    });
  }
}

async function handleRegister() {
  const fName = document.getElementById('registerFirstName').value.trim();
  const lName = document.getElementById('registerLastName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const pass = document.getElementById('registerPass').value.trim();
  const conf = document.getElementById('registerConfirm').value.trim();

  if (!fName || !lName || !email || !pass || !conf) {
    alert('Please fill all fields');
    return;
  }

  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    alert(emailValidation.message);
    return;
  }

  if (pass !== conf) {
    alert('Passwords do not match');
    return;
  }

  if (pass.length < 6) {
    alert('Password must be at least 6 characters');
    return;
  }

  const emailLower = email.toLowerCase();
  const result = await registerUser({
    email: emailLower,
    pass,
    fName,
    lName
  });

  if (result.success) {
    alert('Registration successful! Please sign in.');
    showPage('loginPage');
  } else {
    alert(result.error || 'Registration failed');
  }
}

function handleForgotPassword() {
  const email = document.getElementById('forgotEmail').value.trim();

  if (!email) {
    alert('Please enter your email address');
    return;
  }

  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    alert(emailValidation.message);
    return;
  }

  alert(`Password reset instructions have been sent to ${email}\n\n(In a real app, this would send an email with reset link)`);
  showPage('loginPage');
}

/* ================== INITIALIZATION ================== */
window.addEventListener('DOMContentLoaded', async () => {
  // Load remembered email
  const savedEmail = localStorage.getItem('rememberedEmail');
  if (savedEmail) {
    document.getElementById('loginEmail').value = savedEmail;
    document.getElementById('rememberMe').checked = true;
  }

  // Initialize data
  if (!localStorage.getItem('tasklyUsers')) {
    localStorage.setItem('tasklyUsers', JSON.stringify([]));
  }

  // Initialize event listeners
  initializeEventListeners();

  // Apply theme
  applyTheme();
  updateThemeHeaders();

  // Load data if logged in
  const token = localStorage.getItem('tasklyToken');
  if (token) {
    authToken = token;
    try {
      const result = await getUserProfile();
      if (result.success) {
        setCurrentUser(result.user);
        loadProfilePreview();
        loadTasks();
        startReminderTimers();
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  }
});

// Make functions available globally
window.showPage = showPage;
window.goBack = goBack;
window.toggleTheme = toggleTheme;
window.openChangePasswordPage = openChangePasswordPage;
window.changePassword = changePassword;
window.loadTasks = loadTasks;
window.openEditEmailModal = openEditEmailModal;
window.loadEditProfile = loadEditProfile;
window.loadProfilePage = loadProfilePage;