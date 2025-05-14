/**
 * Configuration file for the application
 * Contains API credentials, endpoints, and storage keys
 */

// Google API Configuration
const CONFIG = {
  // API credentials
  API: {
    CLIENT_ID:
      '238459408958-ug5nb6iam75o9pbemkca73iimlss78vf.apps.googleusercontent.com',
    API_KEY: 'AIzaSyAR4A_D28oNNn_tCl6_VWgbKnhw_NSkJzo',
    DISCOVERY_DOCS: [
      'https://www.googleapis.com/discovery/v1/apis/tasks/v1/rest',
      'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
    ],
    SCOPES:
      'https://www.googleapis.com/auth/tasks https://www.googleapis.com/auth/calendar',
  },

  // Local storage keys
  STORAGE: {
    TOKEN: 'google_token',
    PROFILE: 'user_profile',
    EXPIRY: 'token_expiry',
    IN_PROGRESS: 'tasks_in_progress',
  },

  // Quotes API
  QUOTES_API: {
    URL: 'https://api.api-ninjas.com/v1/quotes',
    KEY: 'kMPqtMH7/9ofago3kS7vnA==0nZjNtQVBixZHilY',
  },
};

export default CONFIG;
