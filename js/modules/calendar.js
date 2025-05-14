/**
 * Calendar Module
 * Handles calendar event functionality
 */

import utils from './utils.js';
import auth from './auth.js';

/**
 * Load calendar events and return promise
 * @returns {Promise} - Promise that resolves with calendar events
 */
function loadCalendarEvents() {
  const eventsContainer = document.getElementById('events-list');
  eventsContainer.innerHTML =
    '<p class="loading-message">Loading your calendar events...</p>';

  const today = new Date();
  const thirtyDaysLater = new Date(today);
  thirtyDaysLater.setDate(today.getDate() + 30);

  console.log(
    'Fetching calendar events from',
    today.toISOString(),
    'to',
    thirtyDaysLater.toISOString(),
  );

  return gapi.client.calendar.events
    .list({
      calendarId: 'primary',
      timeMin: today.toISOString(),
      timeMax: thirtyDaysLater.toISOString(),
      showDeleted: false,
      singleEvents: true,
      maxResults: 20,
      orderBy: 'startTime',
    })
    .then((response) => {
      console.log('Calendar API response:', response);
      const events = response.result.items;
      console.log('Found', events ? events.length : 0, 'calendar events');

      if (events && events.length > 0) {
        console.log('First event:', events[0]);
      }

      displayEvents(events);
      return events;
    })
    .catch((error) => {
      console.error('Error fetching calendar events', error);
      eventsContainer.innerHTML =
        '<p class="error-message">Error loading events: ' +
        (error.result?.error?.message || error.message || 'Unknown error') +
        '</p>';

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
      }

      throw error;
    });
}

/**
 * Display events in the UI
 * @param {Array} events - Array of calendar events
 */
function displayEvents(events) {
  const eventsContainer = document.getElementById('events-list');

  if (!events || events.length === 0) {
    eventsContainer.innerHTML =
      '<p class="no-events">No upcoming events found in your calendar.</p>';
    return;
  }

  // Group events by date
  const eventsByDate = {};
  events.forEach((event) => {
    const start = event.start.dateTime
      ? new Date(event.start.dateTime)
      : new Date(event.start.date);
    const dateStr = start.toISOString().split('T')[0]; // YYYY-MM-DD format

    if (!eventsByDate[dateStr]) {
      eventsByDate[dateStr] = [];
    }
    eventsByDate[dateStr].push(event);
  });

  let html = '';

  // Sort dates chronologically
  const sortedDates = Object.keys(eventsByDate).sort();

  sortedDates.forEach((dateStr) => {
    const date = new Date(dateStr);
    const dateOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    const formattedDate = date.toLocaleDateString(undefined, dateOptions);

    // Add date header
    html += `<div class="date-header">${formattedDate}</div>`;
    html += '<div class="events-grid">';

    // Add events for this date
    eventsByDate[dateStr].forEach((event) => {
      const start = event.start.dateTime
        ? new Date(event.start.dateTime)
        : new Date(event.start.date);
      const end = event.end.dateTime
        ? new Date(event.end.dateTime)
        : new Date(event.start.date);

      const timeOptions = { hour: '2-digit', minute: '2-digit' };

      const startTimeStr = event.start.dateTime
        ? start.toLocaleTimeString(undefined, timeOptions)
        : 'All day';
      const endTimeStr = event.end.dateTime
        ? end.toLocaleTimeString(undefined, timeOptions)
        : '';

      const timeStr = startTimeStr + (endTimeStr ? ` - ${endTimeStr}` : '');

      // Format calendar color
      const calendarColor = event.colorId ? `color-${event.colorId}` : '';

      html += `
        <div class="event-card ${calendarColor}">
          <div class="event-time">${timeStr}</div>
          <div class="event-title">${event.summary || 'Untitled Event'}</div>
          ${
            event.location
              ? `<div class="event-location">📍 ${event.location}</div>`
              : ''
          }
          ${
            event.description
              ? `<div class="event-description">${utils.truncateText(
                  event.description,
                  100,
                )}</div>`
              : ''
          }
          ${
            event.hangoutLink
              ? `<div class="event-meet"><a href="${event.hangoutLink}" target="_blank">Join Google Meet</a></div>`
              : ''
          }
        </div>
      `;
    });

    html += '</div>';
  });

  eventsContainer.innerHTML = html;
}

// Export functions
export default {
  loadCalendarEvents,
  displayEvents,
};
