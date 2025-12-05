const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const settingsController = require('../controllers/settingsController');

// Obtener ajustes
router.get('/', protect, settingsController.getSettings);

// Actualizar ajustes generales
router.put('/update', protect, settingsController.updateSettings);

// Cambiar contraseña
router.put('/change-password', protect, settingsController.changePassword);

module.exports = router;
