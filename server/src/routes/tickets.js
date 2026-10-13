const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');

// GET /api/tickets
router.get('/', async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(tickets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// POST /api/tickets
router.post('/', async (req, res) => {
  const { title, description, priority } = req.body;
  try {
    const t = await prisma.ticket.create({ data: { title, description, priority } });
    res.json(t);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

module.exports = router;
