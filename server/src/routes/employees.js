const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');

// GET /api/employees
router.get('/', async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(employees);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// POST /api/employees
router.post('/', async (req, res) => {
  const { firstName, lastName, email, phone, department, position, salary, status, startDate, avatarUrl } = req.body;
  try {
    const emp = await prisma.employee.create({ data: {
      firstName, lastName, email, phone, department, position,
      salary: salary ? Number(salary) : undefined, status, startDate: startDate ? new Date(startDate) : undefined,
      avatarUrl
    } });
    res.json(emp);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

// PUT /api/employees/:id
router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    const emp = await prisma.employee.update({ where: { id }, data: req.body });
    res.json(emp);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// DELETE /api/employees/:id
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    await prisma.employee.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

module.exports = router;
