// routes/user.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// ===========================
// 1. Obtener perfil del usuario autenticado
// ===========================
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener el perfil'
    });
  }
});

// ===========================
// 2. Actualizar perfil (nombre, email, foto, etc.)
// ===========================
router.put('/profile', protect, async (req, res) => {
  const { name, email, avatar } = req.body;

  // Campos permitidos para actualizar
  const updates = {};
  if (name) updates.name = name;
  if (email) updates.email = email;
  if (avatar) updates.avatar = avatar;

  try {
  // Si se intenta cambiar el email, verificar que no esté en uso
  if (email) {
    const existingUser = await User.findOne({ email, _id: { $ne: req.userId } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Este email ya está registrado por otro usuario'
      });
    }
  }

  const user = await User.findByIdAndUpdate(
    req.userId,
    { $set: updates },
    { new: true, runValidators: true }
  ).select('-password');

  res.json({
    success: true,
    message: 'Perfil actualizado correctamente',
    user
  });
} catch (error) {
  console.error('Error al actualizar perfil:', error);
  res.status(500).json({
    success: false,
    message: 'Error al actualizar el perfil'
  });
}
});

// ===========================
// 3. Cambiar contraseña
// ===========================
router.put('/change-password', verifyToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Debes enviar la contraseña actual y la nueva'
    });
  }

  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar contraseña actual
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña actual es incorrecta'
      });
    }

    // Hashear nueva contraseña
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.json({
      success: true,
      message: 'Contraseña actualizada correctamente'
    });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar la contraseña'
    });
  }
});

// ===========================
// 4. (Opcional) Eliminar cuenta
// ===========================
router.delete('/delete', protect, async (req, res) => { 
  try {
    const user = await User.findByIdAndDelete(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Cuenta eliminada permanentemente'
    });
  } catch (error) {
    console.error('Error al eliminar cuenta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la cuenta'
    });
  }
});

module.exports = router;