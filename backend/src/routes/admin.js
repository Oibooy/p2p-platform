const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Получение списка пользователей
router.get('/users', verifyToken, checkRole('admin'), async (req, res) => {
  const { page = 1, limit = 10, role, status, search } = req.query;

  try {
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.isActive = status === 'active';
    if (search) filter.username = { $regex: search, $options: 'i' };

    const skip = (page - 1) * limit;
    const users = await User.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-password'); // Исключение пароля из ответа

    const total = await User.countDocuments(filter);

    res.json({ users, total });
  } catch (err) {
    console.error('Error fetching users:', err.message);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// Получение информации о конкретном пользователе
router.get('/users/:id', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json(user);
  } catch (err) {
    console.error('Error fetching user:', err.message);
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
});

// Изменение роли пользователя
router.patch('/users/:id/role', verifyToken, checkRole('admin'), async (req, res) => {
  const { role } = req.body;

  if (!['user', 'moderator', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role specified.' });
  }

  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json(user);
  } catch (err) {
    console.error('Error updating user role:', err.message);
    res.status(500).json({ error: 'Failed to update user role.' });
  }
});

// Изменение статуса пользователя
router.patch('/users/:id/status', verifyToken, checkRole('admin'), async (req, res) => {
  const { status } = req.body;

  if (!['active', 'inactive'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status specified.' });
  }

  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: status === 'active' }, { new: true });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json(user);
  } catch (err) {
    console.error('Error updating user status:', err.message);
    res.status(500).json({ error: 'Failed to update user status.' });
  }
});

// Удаление пользователя
router.delete('/users/:id', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.status(200).json({ message: 'User deleted successfully.' });
  } catch (err) {
    console.error('Error deleting user:', err.message);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

// Изменение комиссии
router.post('/commission', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const { newRate } = req.body;
    if (newRate < 0 || newRate > 1000) {
      return res.status(400).json({ error: 'Commission rate must be between 0 and 1000 basis points (0-10%)' });
    }

    const escrowContract = await ethers.getContractAt("MTTEscrow", process.env.ESCROW_CONTRACT_ADDRESS);
    const tx = await escrowContract.setCommissionRate(newRate);
    await tx.wait();

    res.json({ message: 'Commission rate updated successfully', newRate });
  } catch (error) {
    console.error('Error updating commission rate:', error);
    res.status(500).json({ error: 'Failed to update commission rate' });
  }
});

module.exports = router;

