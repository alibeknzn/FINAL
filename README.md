# FINAL

# Homework assistant

A web application that integrates Google Calendar and Google Tasks to help users manage events, tasks, and receive inspirational quotes. Built using vanilla JavaScript and Google APIs.

---

## ✨ Features

* **Google Sign-In** using OAuth2
* **View Upcoming Calendar Events** (next 30 days)
* **Task Manager** with 3 states: To Do, In Progress, Completed
* **Add Task Modal Form** (with due date and notes)
* **Quotes Generator** (fetches from public API)
* **Persistent LocalStorage for in-progress tasks**
* **Responsive Layout** with tab switching (Calendar / Tasks)

---

## 📊 Technologies Used

* HTML + CSS (UI)
* JavaScript Modules (ES6)
* Google Identity Services
* Google Calendar API
* Google Tasks API
* External Quotes API

---

## 🔧 Installation & Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/alibeknzn/FINAL.git
   cd FINAL
   ```

2. Add your `config.js` file in the `js/` folder:

   ```js
   const CONFIG = {
     API: {
       CLIENT_ID: 'YOUR_CLIENT_ID',
       API_KEY: 'YOUR_API_KEY',
       SCOPES: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/tasks',
       DISCOVERY_DOCS: [
         'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
         'https://www.googleapis.com/discovery/v1/apis/tasks/v1/rest'
       ]
     },
     STORAGE: {
       TOKEN: 'google_token',
       PROFILE: 'user_profile',
       EXPIRY: 'token_expiry',
       IN_PROGRESS: 'in_progress_tasks'
     },
     QUOTES_API: {
       URL: 'https://api.api-ninjas.com/v1/quotes?category=success',
       KEY: 'YOUR_QUOTES_API_KEY'
     }
   };

   export default CONFIG;
   ```

3.  view the deployed version:
   👉 [https://final-ll4s.vercel.app/](https://final-ll4s.vercel.app/)

---

## 📂 Project Structure

```
├── index.html
├── css/
│   └── components
      ├── auth.css
      ├── buttons.css
      ├── calendar.css
      ├── layout.css
      ├── modals.css
      ├── tasks.css
  └── main.css
├── js/
│   ├── app.js
│   ├── auth.js
│   ├── calendar.js
│   ├── tasks.js
│   ├── quotes.js
│   ├── utils.js
│   └── config.js (you create this)
├── assets/
│   └── logo.png
```

---

## ⚠️ Requirements

* Google Cloud Project with:

  * **OAuth Consent Screen** configured
  * **Calendar API** and **Tasks API** enabled
* Valid **Quotes API Key** (from api-ninjas or similar)

---
