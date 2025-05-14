/**
 * Tasks Module
 * Handles task management functionality
 */

import CONFIG from '../config.js';
import utils from './utils.js';

// Store in-progress tasks
let inProgressTasks = {};
let activeTaskListId = '';

/**
 * Load in-progress tasks from localStorage
 */
function loadInProgressTasks() {
  const storedTasks = localStorage.getItem(CONFIG.STORAGE.IN_PROGRESS);
  if (storedTasks) {
    inProgressTasks = JSON.parse(storedTasks);
    console.log('Loaded in-progress tasks from localStorage:', inProgressTasks);
  }
}

/**
 * Save in-progress tasks to localStorage
 */
function saveInProgressTasks() {
  localStorage.setItem(
    CONFIG.STORAGE.IN_PROGRESS,
    JSON.stringify(inProgressTasks),
  );
  console.log('Saved in-progress tasks to localStorage:', inProgressTasks);
}

/**
 * Get task status (considering in-progress state from localStorage)
 * @param {Object} task - Task object
 * @returns {string} - Task status: 'completed', 'in_progress', or 'needsAction'
 */
function getTaskStatus(task) {
  // If task is marked as in-progress in localStorage
  if (inProgressTasks[task.id] === 'in_progress') {
    return 'in_progress';
  }
  // Otherwise use the API status
  return task.status === 'completed' ? 'completed' : 'needsAction';
}

/**
 * Update the UI based on task status
 * @param {HTMLElement} taskElement - Task element in DOM
 * @param {string} status - New status
 */
function updateTaskUI(taskElement, status) {
  if (!taskElement) return;

  const titleElement = taskElement.querySelector('.task-title');
  const checkbox = taskElement.querySelector('.task-checkbox');

  // Remove all possible status classes from title
  titleElement.classList.remove('completed', 'in-progress');

  // Remove all possible status classes from checkbox
  checkbox.classList.remove('in-progress');

  // Get or create status label
  let statusLabel = taskElement.querySelector('.task-status-label');
  if (!statusLabel) {
    statusLabel = document.createElement('span');
    statusLabel.className = 'task-status-label';

    // Get or create meta row
    let metaRow = taskElement.querySelector('.task-meta-row');
    if (!metaRow) {
      metaRow = document.createElement('div');
      metaRow.className = 'task-meta-row';
      const contentDiv = taskElement.querySelector('.task-content');

      // Find the title row and insert meta row after it
      const titleRow = contentDiv.querySelector('.task-title-row');
      if (titleRow) {
        titleRow.insertAdjacentElement('afterend', metaRow);
      } else {
        contentDiv.appendChild(metaRow);
      }
    }

    // Add status label to meta row
    metaRow.prepend(statusLabel);
  }

  // Remove all status classes from label
  statusLabel.classList.remove('todo', 'in-progress', 'completed');

  // Apply appropriate styling based on status
  if (status === 'completed') {
    titleElement.classList.add('completed');
    checkbox.checked = true;
    statusLabel.textContent = 'Completed';
    statusLabel.classList.add('completed');
    taskElement.setAttribute('data-status', 'completed');
  } else if (status === 'in_progress') {
    titleElement.classList.add('in-progress');
    checkbox.classList.add('in-progress');
    checkbox.checked = true; // Fill the checkbox for in-progress
    statusLabel.textContent = 'In Progress';
    statusLabel.classList.add('in-progress');
    taskElement.setAttribute('data-status', 'in_progress');
  } else {
    // needsAction (todo)
    checkbox.checked = false;
    statusLabel.textContent = 'To Do';
    statusLabel.classList.add('todo');
    taskElement.setAttribute('data-status', 'needsAction');
  }

  console.log(
    'Updated UI for task:',
    taskElement.dataset.taskId,
    'to status:',
    status,
  );
}

/**
 * Update task status
 * @param {string} taskListId - Task list ID
 * @param {string} taskId - Task ID
 * @param {string} newStatus - New status
 * @returns {Promise} - Promise that resolves when update is complete
 */
function updateTaskStatus(taskListId, taskId, newStatus) {
  console.log('Updating task status:', taskId, 'to', newStatus);

  // Get DOM elements
  const taskElement = document.querySelector(`li[data-task-id="${taskId}"]`);

  // Update UI immediately for better user experience
  updateTaskUI(taskElement, newStatus);

  // Handle based on status
  if (newStatus === 'in_progress') {
    // Store in-progress status in localStorage
    inProgressTasks[taskId] = 'in_progress';
    saveInProgressTasks();
    return Promise.resolve(); // No API call needed
  } else {
    // Remove from in-progress if it was there
    if (inProgressTasks[taskId]) {
      delete inProgressTasks[taskId];
      saveInProgressTasks();
    }

    // Call the API to update the task
    return gapi.client.tasks.tasks
      .patch({
        tasklist: taskListId,
        task: taskId,
        resource: {
          id: taskId,
          status: newStatus === 'completed' ? 'completed' : 'needsAction',
        },
      })
      .then((response) => {
        console.log('Task status updated successfully in API:', response);
      })
      .catch((error) => {
        console.error('Error updating task status:', error);
        alert(
          'Failed to update task: ' +
            (error.result?.error?.message || error.message || 'Unknown error'),
        );

        // Revert UI changes on error
        console.log('Reverting UI due to API error');
        // Use the task element's data-status attribute if available, or fall back to API status
        const actualStatus =
          taskElement.getAttribute('data-status') || 'needsAction';
        updateTaskUI(taskElement, actualStatus);
      });
  }
}

/**
 * Render a task item
 * @param {Object} task - Task object
 * @param {string} taskListId - Task list ID
 * @returns {HTMLElement} - List item element for task
 */
function renderTaskItem(task, taskListId) {
  const li = document.createElement('li');
  li.className = 'task-item';
  li.dataset.taskId = task.id;
  li.dataset.taskListId = taskListId;

  // Get current status (including in-progress from localStorage)
  const status = getTaskStatus(task);

  // Save the initial status to the task element
  li.setAttribute('data-status', status);

  // Format due date if exists
  let dueDate = '';
  if (task.due) {
    const date = new Date(task.due);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    // Format the date based on proximity
    if (date.toDateString() === today.toDateString()) {
      dueDate = '<span class="due-date due-today">Today</span>';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      dueDate = '<span class="due-date due-tomorrow">Tomorrow</span>';
    } else {
      const options = { month: 'short', day: 'numeric' };
      if (date.getFullYear() !== today.getFullYear()) {
        options.year = 'numeric';
      }
      dueDate = `<span class="due-date">${date.toLocaleDateString(
        undefined,
        options,
      )}</span>`;
    }
  }

  // Format notes if exist (truncated)
  let notes = '';
  if (task.notes) {
    notes = `
      <div class="task-notes">
        ${utils.truncateText(task.notes, 100)}
      </div>
    `;
  }

  // Simplified HTML structure with horizontal layout for title and date
  li.innerHTML = `
    <div class="task-item-header">
      <div class="task-checkbox-wrapper">
        <input type="checkbox" class="task-checkbox ${
          status === 'in_progress' ? 'in-progress' : ''
        }" ${
    status === 'completed' || status === 'in_progress' ? 'checked' : ''
  }>
      </div>
      <div class="task-content">
        <div class="task-title-row">
          <span class="task-title ${
            status === 'completed'
              ? 'completed'
              : status === 'in_progress'
              ? 'in-progress'
              : ''
          }">
            ${task.title || 'Untitled Task'}
          </span>
          ${dueDate}
        </div>
        
        <div class="task-meta-row">
          <span class="task-status-label ${
            status === 'completed'
              ? 'completed'
              : status === 'in_progress'
              ? 'in-progress'
              : 'todo'
          }">
            ${
              status === 'completed'
                ? 'Completed'
                : status === 'in_progress'
                ? 'In Progress'
                : 'To Do'
            }
          </span>
        </div>
        
        ${notes}
      </div>
    </div>
  `;

  // Add checkbox click handler that cycles through the three states
  const checkbox = li.querySelector('.task-checkbox');
  checkbox.addEventListener('click', function (event) {
    event.stopPropagation();

    // Get current status from the task element's data-status attribute
    const currentStatus = li.getAttribute('data-status');

    let newStatus;

    // Cycle through the states: Todo -> In Progress -> Completed -> Todo
    if (currentStatus === 'needsAction') {
      newStatus = 'in_progress';
    } else if (currentStatus === 'in_progress') {
      newStatus = 'completed';
    } else {
      // completed
      newStatus = 'needsAction';
    }

    console.log(`Cycling task from ${currentStatus} to ${newStatus}`);

    // Important: Prevent the default behavior which would toggle the checkbox
    event.preventDefault();

    // Force checkbox state update to match the new status
    if (newStatus === 'needsAction') {
      this.checked = false;
    } else {
      this.checked = true;
    }

    // Update the task status (this will also update the checkbox state)
    updateTaskStatus(taskListId, task.id, newStatus);
  });

  return li;
}

/**
 * Load tasks from Google Tasks API
 * @returns {Promise} - Promise that resolves with tasks data
 */
function loadTasks() {
  const taskList = document.getElementById('task-list');
  taskList.innerHTML = '<li>Loading tasks...</li>';

  console.log('Starting to load task lists...');

  // Check if API is properly initialized
  if (!gapi.client.tasks) {
    console.error('Tasks API not loaded properly');
    taskList.innerHTML =
      '<li>Error: Google Tasks API not loaded. Check your API key and console for details.</li>';
    return Promise.reject(new Error('Tasks API not loaded'));
  }

  return gapi.client.tasks.tasklists
    .list()
    .then((response) => {
      console.log('Task lists response:', response);

      if (!response.result.items || response.result.items.length === 0) {
        console.log('No task lists found');
        taskList.innerHTML =
          '<li>No task lists found. Create a task list in Google Tasks first.</li>';
        return null;
      }

      activeTaskListId = response.result.items[0].id;
      console.log('Using task list ID:', activeTaskListId);

      return gapi.client.tasks.tasks.list({ tasklist: activeTaskListId });
    })
    .then((resp) => {
      if (!resp) return; // Handle if previous promise didn't return tasks

      console.log('Tasks response:', resp);
      const tasks = resp.result.items || [];
      taskList.innerHTML = '';

      if (tasks.length === 0) {
        console.log('No tasks found in list');
        taskList.innerHTML = '<li>No tasks found in this list.</li>';
        return;
      }

      console.log(`Found ${tasks.length} tasks, rendering...`);
      tasks.forEach((task) => {
        console.log('Task:', task.title, 'Status:', task.status);
        // Use the new renderTaskItem function
        const taskItem = renderTaskItem(task, activeTaskListId);
        taskList.appendChild(taskItem);
      });

      return tasks;
    })
    .catch((error) => {
      console.error('Error in loadTasks:', error);
      taskList.innerHTML = `<li>Error loading tasks: ${
        error.message || 'Unknown error'
      }</li>`;
      throw error;
    });
}

/**
 * Add a new task
 * @param {string} taskListId - Task list ID
 */
function addNewTask(taskListId) {
  // Instead of using prompt, show the modal
  const modal = document.getElementById('task-modal-overlay');
  const taskForm = document.getElementById('add-task-form');
  const closeButton = document.getElementById('modal-close');
  const cancelButton = document.getElementById('cancel-task-btn');
  const submitButton = document.getElementById('submit-task-btn');

  // Clear any previous values in the form
  taskForm.reset();

  // Show the modal
  modal.classList.add('active');

  // Focus on the title input
  setTimeout(() => {
    document.getElementById('task-title').focus();
  }, 100);

  // Close modal function
  const closeModal = () => {
    modal.classList.remove('active');
  };

  // Handle form submission
  const handleSubmit = () => {
    const taskTitle = document.getElementById('task-title').value.trim();
    const taskNotes = document.getElementById('task-notes').value.trim();
    const taskDue = document.getElementById('task-due').value;

    if (!taskTitle) return; // Don't submit if title is empty

    console.log(
      'Adding new task:',
      taskTitle,
      'with notes:',
      taskNotes,
      'due:',
      taskDue,
    );

    // Close the modal
    closeModal();

    // Show loading indicator
    const taskList = document.getElementById('task-list');
    const loadingLi = document.createElement('li');
    loadingLi.textContent = 'Adding task...';
    loadingLi.className = 'task-item loading';
    taskList.appendChild(loadingLi);

    // Prepare task resource with optional fields
    const taskResource = {
      title: taskTitle,
      status: 'needsAction', // Always start as "To Do"
    };

    // Add notes if provided
    if (taskNotes) {
      taskResource.notes = taskNotes;
    }

    // Add due date if provided
    if (taskDue) {
      // Convert to RFC 3339 timestamp for the end of the day
      const dueDate = new Date(taskDue);
      dueDate.setHours(23, 59, 59);
      taskResource.due = dueDate.toISOString();
    }

    // Call the API to add the task
    gapi.client.tasks.tasks
      .insert({
        tasklist: taskListId,
        resource: taskResource,
      })
      .then((response) => {
        console.log('Task added successfully:', response);
        // No need to handle "in_progress" as all tasks start as "To Do"

        // Reload the tasks list
        loadTasks();
      })
      .catch((error) => {
        console.error('Error adding task:', error);
        alert(
          'Failed to add task: ' +
            (error.result?.error?.message || error.message || 'Unknown error'),
        );
        // Remove the loading indicator
        taskList.removeChild(loadingLi);
      });
  };

  // Event listeners for modal controls
  closeButton.onclick = closeModal;
  cancelButton.onclick = closeModal;
  submitButton.onclick = handleSubmit;

  // Handle Enter key in form
  taskForm.onkeydown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault(); // Prevent form submission
      handleSubmit();
    }
  };

  // Handle click outside modal to close
  modal.onclick = (e) => {
    if (e.target === modal) {
      closeModal();
    }
  };
}

// Export functions
export default {
  loadInProgressTasks,
  saveInProgressTasks,
  getTaskStatus,
  updateTaskUI,
  updateTaskStatus,
  renderTaskItem,
  loadTasks,
  addNewTask,
  // Add a getter for the active task list ID
  get activeTaskListId() {
    return activeTaskListId;
  },
};
