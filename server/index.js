const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const { PrismaClient } = require('@prisma/client');

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Session store using PostgreSQL
app.use(
  session({
    store: new PgSession({ conString: process.env.DATABASE_URL }),
    secret: process.env.SESSION_SECRET || 'change-me',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 8 }
  })
);

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/employees', require('./src/routes/employees'));
app.use('/api/tickets', require('./src/routes/tickets'));

app.get('/', (req, res) => {
  res.json({ message: 'PeopleFlow API' });
});

app.listen(PORT, () => {
  console.log(`PeopleFlow server running on http://localhost:${PORT}`);
});
