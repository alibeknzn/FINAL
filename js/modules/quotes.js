/**
 * Quotes Module
 * Handles inspirational quotes functionality
 */

import CONFIG from '../config.js';

/**
 * Initialize quote button functionality
 */
function initQuoteButton() {
  const quoteBtn = document.getElementById('quote-btn');
  const quoteModal = document.getElementById('quote-modal');
  const quoteClose = document.getElementById('quote-close');
  const quoteContent = document.getElementById('quote-content');
  const quoteAuthor = document.getElementById('quote-author');
  const quoteLoading = document.getElementById('quote-loading');

  // Show modal and fetch a quote when button is clicked
  quoteBtn.addEventListener('click', () => {
    // Show modal with loading indicator
    quoteModal.classList.add('active');
    quoteLoading.style.display = 'flex';
    quoteContent.style.display = 'none';
    quoteAuthor.style.display = 'none';

    // Fetch a quote
    fetchRandomQuote()
      .then((quote) => {
        // Hide loading, show quote
        quoteLoading.style.display = 'none';
        quoteContent.style.display = 'block';
        quoteAuthor.style.display = 'block';

        // Update content
        quoteContent.textContent = quote.quote;
        quoteAuthor.textContent = `— ${quote.author}`;
      })
      .catch((error) => {
        // Show error message
        quoteLoading.style.display = 'none';
        quoteContent.style.display = 'block';
        quoteContent.textContent =
          "Oops! Couldn't fetch a quote. Try again later.";
        console.error('Error fetching quote:', error);
      });
  });

  // Close modal when close button is clicked
  quoteClose.addEventListener('click', () => {
    quoteModal.classList.remove('active');
  });

  // Close modal when clicked outside
  document.addEventListener('click', (e) => {
    if (
      !quoteBtn.contains(e.target) &&
      !quoteModal.contains(e.target) &&
      quoteModal.classList.contains('active')
    ) {
      quoteModal.classList.remove('active');
    }
  });
}

/**
 * Fetch a random inspirational quote
 * @returns {Promise} - Promise that resolves with quote data
 */
async function fetchRandomQuote() {
  const apiUrl = CONFIG.QUOTES_API.URL;
  const apiKey = CONFIG.QUOTES_API.KEY;

  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'X-Api-Key': apiKey,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const quotes = await response.json();

  // The API returns an array of quotes, we take the first one
  if (quotes && quotes.length > 0) {
    return quotes[0];
  } else {
    throw new Error('No quotes returned from API');
  }
}

export default {
  initQuoteButton,
  fetchRandomQuote,
};
