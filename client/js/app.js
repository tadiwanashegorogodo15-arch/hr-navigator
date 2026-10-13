const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const ticketForm = document.getElementById('ticketForm');
const logoutBtn = document.getElementById('logoutBtn');
const dashboard = document.getElementById('dashboard');
const ticketsList = document.getElementById('tickets');
const currentUser = document.getElementById('currentUser');

const localUsers = [
  { id: 1, name: 'Admin User', email: 'admin@hrnav.com' }
];

let localTickets = [
  {
    id: 1,
    title: 'Need employee onboarding checklist',
    description: 'Prepare onboarding materials for new team members.',
    priority: 'high'
  },
  {
    id: 2,
    title: 'Update payroll form',
    description: 'Review and revise deduction and benefits form.',
    priority: 'medium'
  }
];

let activeUser = null;

function renderTickets() {
  ticketsList.innerHTML = '';

  if (!localTickets.length) {
    ticketsList.innerHTML = '<li class="ticket-item">No tickets yet.</li>';
    return;
  }

  localTickets.forEach(ticket => {
    const li = document.createElement('li');
    li.className = 'ticket-item';

    li.innerHTML = `
      <div class="ticket-top">
        <span class="ticket-title">${ticket.title}</span>
        <span class="ticket-status">Open</span>
      </div>
      <p>${ticket.description}</p>
      <span class="ticket-priority priority-${ticket.priority}">${ticket.priority}</span>
    `;

    ticketsList.appendChild(li);
  });
}

function showDashboard(userName) {
  activeUser = userName;
  currentUser.textContent = `Logged in as: ${userName}`;
  dashboard.classList.remove('hidden');
  document.querySelector('.auth').style.display = 'none';
  renderTickets();
}

function logout() {
  activeUser = null;
  dashboard.classList.add('hidden');
  document.querySelector('.auth').style.display = 'block';
  document.getElementById('loginForm').reset();
  document.getElementById('registerForm').reset();
  currentUser.textContent = '';
}

registerForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();

  if (!name || !email) return;

  const exists = localUsers.some(user => user.email.toLowerCase() === email.toLowerCase());

  if (exists) {
    alert('User already exists. Please login instead.');
    return;
  }

  const newUser = { id: Date.now(), name, email };
  localUsers.push(newUser);
  showDashboard(newUser.name);
  registerForm.reset();
});

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const email = document.getElementById('loginEmail').value.trim();
  const foundUser = localUsers.find(user => user.email.toLowerCase() === email.toLowerCase());

  if (!foundUser) {
    alert('No user found with that email.');
    return;
  }

  showDashboard(foundUser.name);
  loginForm.reset();
});

ticketForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const title = document.getElementById('ticketTitle').value.trim();
  const description = document.getElementById('ticketDesc').value.trim();
  const priority = document.getElementById('ticketPriority').value;

  if (!title || !description) return;

  localTickets.unshift({
    id: Date.now(),
    title,
    description,
    priority
  });

  renderTickets();
  ticketForm.reset();
});

logoutBtn.addEventListener('click', logout);

renderTickets();
