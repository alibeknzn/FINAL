/**
 * Authentication Module
 * Handles Google authentication and user profile management
 */

import CONFIG from '../config.js';

// Global variables
let userProfile = null;
let isAuthorized = false;

/**
 * Initialize the API client
 * @param {boolean} autoLoadData - Whether to auto-load data after initialization
 * @returns {Promise} - Promise that resolves when initialization is complete
 */
async function initializeApiClient(autoLoadData) {
  try {
    await gapi.load('client', async () => {
      try {
        await gapi.client.init({
          apiKey: CONFIG.API.API_KEY,
          discoveryDocs: CONFIG.API.DISCOVERY_DOCS,
        });
        console.log('GAPI client initialized');

        // If we have stored credentials, load user data
        if (autoLoadData && userProfile) {
          // Set the token from localStorage
          const token = localStorage.getItem(CONFIG.STORAGE.TOKEN);
          if (token) {
            gapi.client.setToken({ access_token: token });

            // Show loading and load user data
            document.getElementById('auth-section').style.display = 'none';
            document.getElementById('loading-section').style.display = 'block';

            // This function will be defined in another module
            window.loadUserData();
          } else {
            showLoginScreen();
          }
        } else {
          showLoginScreen();
        }
      } catch (error) {
        console.error('Error initializing GAPI client:', error);
        showError(
          'Failed to initialize Google API. Please check your connection and try again.',
        );
        showLoginScreen();
      }
    });
  } catch (error) {
    console.error('Error loading GAPI client:', error);
    showError(
      'Failed to load Google API. Please refresh the page and try again.',
    );
    showLoginScreen();
  }
}

/**
 * Show the login screen
 */
function showLoginScreen() {
  document.getElementById('auth-section').style.display = 'block';
  document.getElementById('loading-section').style.display = 'none';
  document.getElementById('content-section').style.display = 'none';

  // Add the login-specific container class to better showcase the background image
  document.querySelector('.container').classList.add('container-login');
}

/**
 * Handle auth button click - using the new Identity Services
 */
function handleAuthClick() {
  console.log('Auth button clicked, starting sign-in process...');

  // Show loading indicator while authenticating
  document.getElementById('auth-section').style.display = 'none';
  document.getElementById('loading-section').style.display = 'block';

  // Use newer Identity Services library
  google.accounts.oauth2
    .initTokenClient({
      client_id: CONFIG.API.CLIENT_ID,
      scope: CONFIG.API.SCOPES,
      prompt: 'consent',
      callback: handleAuthResponse,
    })
    .requestAccessToken();
}

/**
 * Handle the auth response
 * @param {Object} response - The auth response from Google
 */
function handleAuthResponse(response) {
  console.log('Auth response received:', response);

  if (response.error) {
    console.error('Error in auth response:', response.error);
    showError('Authentication failed: ' + response.error);
    showLoginScreen();
    return;
  }

  if (response.access_token) {
    // Store the token
    const tokenExpiryTime = new Date().getTime() + response.expires_in * 1000;
    localStorage.setItem(CONFIG.STORAGE.TOKEN, response.access_token);
    localStorage.setItem(CONFIG.STORAGE.EXPIRY, tokenExpiryTime.toString());

    // Set the token for API calls
    gapi.client.setToken({ access_token: response.access_token });

    // Get user profile
    fetchUserProfile()
      .then(() => {
        window.loadUserData();
      })
      .catch((error) => {
        console.error('Error fetching user profile:', error);
        showError('Failed to fetch user profile. Please try again.');
        showLoginScreen();
      });
  } else {
    showError('No access token received. Please try again.');
    showLoginScreen();
  }
}

/**
 * Fetch the user profile using the UserInfo endpoint
 * @returns {Promise} - Promise that resolves with user profile
 */
async function fetchUserProfile() {
  try {
    // Use the UserInfo endpoint instead of People API
    const response = await fetch(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        headers: {
          Authorization: 'Bearer ' + localStorage.getItem(CONFIG.STORAGE.TOKEN),
        },
      },
    );

    if (!response.ok) {
      throw new Error(`UserInfo request failed with status ${response.status}`);
    }

    const data = await response.json();

    // Extract profile info
    userProfile = {
      id: data.sub,
      name: data.name || 'User',
      email: data.email || 'No email',
      imageUrl: data.picture || '',
    };

    console.log('User profile:', userProfile);

    // Store profile in localStorage
    localStorage.setItem(CONFIG.STORAGE.PROFILE, JSON.stringify(userProfile));

    return userProfile;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw new Error('Failed to fetch user profile');
  }
}

/**
 * Handle sign-out click
 */
function handleSignoutClick() {
  console.log('Sign-out button clicked');

  // Clear stored auth data
  clearStoredAuth();

  // Reset API client token
  gapi.client.setToken(null);

  // Show login screen
  showLoginScreen();
}

/**
 * Clear stored auth data
 */
function clearStoredAuth() {
  localStorage.removeItem(CONFIG.STORAGE.TOKEN);
  localStorage.removeItem(CONFIG.STORAGE.PROFILE);
  localStorage.removeItem(CONFIG.STORAGE.EXPIRY);
  userProfile = null;
  isAuthorized = false;
}

/**
 * Show an error message to the user
 * @param {string} message - Error message to display
 */
function showError(message) {
  alert(message);
}

/**
 * Try to load the profile from localStorage
 * @returns {Object|null} - User profile if found, otherwise null
 */
function loadSavedProfile() {
  const savedProfile = localStorage.getItem(CONFIG.STORAGE.PROFILE);
  const tokenExpiry = localStorage.getItem(CONFIG.STORAGE.EXPIRY);

  // Check if we have a valid token that hasn't expired
  if (
    savedProfile &&
    tokenExpiry &&
    new Date().getTime() < parseInt(tokenExpiry, 10)
  ) {
    userProfile = JSON.parse(savedProfile);
    console.log('Restored profile from localStorage:', userProfile);
    return userProfile;
  }

  return null;
}

/**
 * Get current user profile
 * @returns {Object|null} - Current user profile or null if not authenticated
 */
function getUserProfile() {
  return userProfile;
}

/**
 * Check if user is authorized
 * @returns {boolean} - True if authorized, false otherwise
 */
function isUserAuthorized() {
  return isAuthorized;
}

/**
 * Set authorization state
 * @param {boolean} state - New authorization state
 */
function setAuthorized(state) {
  isAuthorized = state;
}

// Export functions that will be used by other modules
export default {
  initializeApiClient,
  showLoginScreen,
  handleAuthClick,
  handleSignoutClick,
  showError,
  loadSavedProfile,
  getUserProfile,
  isUserAuthorized,
  setAuthorized,
};
