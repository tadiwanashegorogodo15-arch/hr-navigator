// Toggle this to true when backend API is ready at /api
const USE_API = false;

const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const ticketForm = document.getElementById('ticketForm');
const logoutBtn = document.getElementById('logoutBtn');
const dashboard = document.getElementById('dashboard');
const ticketsList = document.getElementById('tickets');
const currentUser = document.getElementById('currentUser');

// Local in-memory fallback data (UI will work without backend)
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

/* ---------- API wrapper (calls backend when USE_API=true) ---------- */
async function apiRegister(name, email) {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email })
  });
  return res.json();
}

async function apiLogin(email) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  return res.json();
}

async function apiFetchTickets() {
  const res = await fetch('/api/tickets');
  return res.json();
}

async function apiCreateTicket({ title, description, priority }) {
  const res = await fetch('/api/tickets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description, priority })
  });
  return res.json();
}

/* ---------- UI rendering ---------- */
function renderTickets(tickets = null) {
  ticketsList.innerHTML = '';

  const source = tickets || localTickets;

  if (!source.length) {
    ticketsList.innerHTML = '<li class="ticket-item">No tickets yet.</li>';
    return;
  }

  source.forEach(ticket => {
    const li = document.createElement('li');
    li.className = 'ticket-item';

    li.innerHTML = `
      <div class="ticket-top">
        <span class="ticket-title">${escapeHtml(ticket.title)}</span>
        <span class="ticket-status">Open</span>
      </div>
      <p>${escapeHtml(ticket.description)}</p>
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

  if (USE_API) {
    apiFetchTickets().then(data => {
      if (Array.isArray(data)) renderTickets(data);
      else if (data.tickets) renderTickets(data.tickets);
      else renderTickets([]);
    }).catch(err => {
      console.error('Failed to fetch tickets', err);
      renderTickets([]);
    });
  } else {
    renderTickets();
  }
}

function logout() {
  activeUser = null;
  dashboard.classList.add('hidden');
  document.querySelector('.auth').style.display = 'block';
  document.getElementById('loginForm').reset();
  document.getElementById('registerForm').reset();
  currentUser.textContent = '';
}

/* ---------- Helpers ---------- */
function escapeHtml(unsafe) {
  return unsafe
       .replace(/&/g, "&amp;")
       .replace(/</g, "&lt;")
       .replace(/>/g, "&gt;")
       .replace(/"/g, "&quot;")
       .replace(/'/g, "&#039;");
}

/* ---------- Form handlers ---------- */
registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();

  if (!name || !email) return;

  if (USE_API) {
    try {
      const res = await apiRegister(name, email);
      if (res?.error) return alert(res.error);
      const userName = res?.user?.name || name;
      showDashboard(userName);
      registerForm.reset();
    } catch (err) {
      console.error(err);
      alert('Registration failed');
    }
    return;
  }

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

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = document.getElementById('loginEmail').value.trim();
  if (!email) return;

  if (USE_API) {
    try {
      const res = await apiLogin(email);
      if (res?.error) return alert(res.error);
      const userName = res?.user?.name || email;
      showDashboard(userName);
      loginForm.reset();
    } catch (err) {
      console.error(err);
      alert('Login failed');
    }
    return;
  }

  const foundUser = localUsers.find(user => user.email.toLowerCase() === email.toLowerCase());

  if (!foundUser) {
    alert('No user found with that email.');
    return;
  }

  showDashboard(foundUser.name);
  loginForm.reset();
});

ticketForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const title = document.getElementById('ticketTitle').value.trim();
  const description = document.getElementById('ticketDesc').value.trim();
  const priority = document.getElementById('ticketPriority').value;

  if (!title || !description) return;

  if (USE_API) {
    try {
      const res = await apiCreateTicket({ title, description, priority });
      if (res?.error) return alert(res.error);
      // After create, re-fetch tickets list
      const data = await apiFetchTickets();
      renderTickets(Array.isArray(data) ? data : data.tickets || []);
      ticketForm.reset();
    } catch (err) {
      console.error(err);
      alert('Failed to create ticket');
    }
    return;
  }

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

// initial render (show local tickets when not logged in)
if (!USE_API) renderTickets();
