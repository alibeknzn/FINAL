/**
 * Main Application File
 * Initializes the application and integrates all modules
 */

import CONFIG from './config.js';
import auth from './modules/auth.js';
import tasks from './modules/tasks.js';
import calendar from './modules/calendar.js';
import quotes from './modules/quotes.js';

// Define global variables
let userProfile = null;

/**
 * Called when the page loads to initialize the client
 */
function handleClientLoad() {
  console.log('Loading GAPI client...');

  // Load in-progress tasks
  tasks.loadInProgressTasks();

  // Try to load profile from localStorage
  const savedProfile = auth.loadSavedProfile();

  if (savedProfile) {
    userProfile = savedProfile;
    // Initialize API client and proceed with stored credentials
    auth.initializeApiClient(true);
  } else {
    // Initialize API client without auto-loading data
    auth.initializeApiClient(false);
  }
}

/**
 * Tab switching handler
 * @param {string} tabName - Name of tab to switch to
 */
function switchTab(tabName) {
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.classList.remove('active');
  });
  event.target.classList.add('active');

  document.querySelectorAll('.tab-content').forEach((content) => {
    content.style.display = 'none';
  });

  if (tabName === 'calendar') {
    document.getElementById('calendar-tab').style.display = 'block';
    calendar.loadCalendarEvents().catch((error) => {
      console.error('Error reloading calendar events:', error);
    });
  } else if (tabName === 'tasks') {
    document.getElementById('tasks-tab').style.display = 'block';
    tasks.loadTasks().catch((error) => {
      console.error('Error reloading tasks:', error);
    });
  }
}

/**
 * Load user data after authentication
 */
function loadUserData() {
  // Display user email
  if (userProfile && userProfile.email) {
    document.getElementById('user-email').textContent = userProfile.email;
  }

  // Remove the login-specific container class
  document.querySelector('.container').classList.remove('container-login');

  // Load calendar events first
  calendar
    .loadCalendarEvents()
    .then(() => {
      // Show content section after data is loaded
      document.getElementById('loading-section').style.display = 'none';
      document.getElementById('content-section').style.display = 'block';

      // Also load tasks in background
      tasks.loadTasks().catch((error) => {
        console.error('Error loading tasks:', error);
      });
    })
    .catch((error) => {
      console.error('Error loading calendar events:', error);

      // Check if this is an auth error
      if (
        error.status === 401 ||
        error.status === 403 ||
        (error.result &&
          error.result.error &&
          (error.result.error.status === 'UNAUTHENTICATED' ||
            error.result.error.status === 'PERMISSION_DENIED'))
      ) {
        console.log('Authentication error detected, clearing stored auth');
        auth.clearStoredAuth();
        auth.showError('Your session has expired. Please sign in again.');
        auth.showLoginScreen();
      } else {
        // For other errors, still show content with error message
        document.getElementById('loading-section').style.display = 'none';
        document.getElementById('content-section').style.display = 'block';
      }
    });
}

/**
 * Initialize the application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
  // Add the login container class on initial load
  document.querySelector('.container').classList.add('container-login');

  // Initialize quote button functionality
  quotes.initQuoteButton();

  // Setup event listeners for tabs
  const tabButtons = document.querySelectorAll('.tab');
  tabButtons.forEach((button) => {
    button.addEventListener('click', function (e) {
      const tabName = this.getAttribute('data-tab');
      switchTab(tabName);
      e.preventDefault();
    });
  });

  // Setup auth button handlers
  const signInButton = document.getElementById('authorize-button');
  const signOutButton = document.getElementById('signout-button');

  if (signInButton) {
    signInButton.addEventListener('click', auth.handleAuthClick);
  }

  if (signOutButton) {
    signOutButton.addEventListener('click', auth.handleSignoutClick);
  }

  // Setup Add Task button click handler
  const addTaskBtn = document.getElementById('add-task-btn');
  if (addTaskBtn) {
    addTaskBtn.addEventListener('click', () => {
      tasks.addNewTask(tasks.activeTaskListId);
    });
  }

  // Load both the Google API libraries
  const script1 = document.createElement('script');
  script1.src = 'https://apis.google.com/js/api.js';
  script1.onload = handleClientLoad;
  document.body.appendChild(script1);
});

// Make functions available globally
window.loadUserData = loadUserData;
window.switchTab = switchTab;
window.handleClientLoad = handleClientLoad;
