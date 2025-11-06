// src/routes/shelterRoutes.js
const express = require('express');
const shelterController = require('../controllers/shelterController');
const { protect, restrictTo } = require('../middleware/auth');
const {
  createShelterValidation,
  updateShelterValidation
} = require('../middleware/validations/shelterValidations');

const router = express.Router();

// ==========================================
// RUTAS PÚBLICAS
// ==========================================

/**
 * @route   GET /api/v1/shelters
 * @desc    Obtener todos los refugios
 * @access  Public
 * @query   ?page=1&limit=10&city=Bogotá&country=Colombia
 */
router.get('/', shelterController.getAllShelters);

/**
 * @route   GET /api/v1/shelters/search
 * @desc    Buscar refugios
 * @access  Public
 * @query   ?q=san+francisco&city=Bogotá
 */
router.get('/search', shelterController.searchShelters);

/**
 * @route   GET /api/v1/shelters/:id
 * @desc    Obtener un refugio por ID
 * @access  Public
 */
router.get('/:id', shelterController.getShelterById);

/**
 * @route   GET /api/v1/shelters/:id/stats
 * @desc    Obtener estadísticas de un refugio
 * @access  Public
 */
router.get('/:id/stats', shelterController.getShelterStats);

// ==========================================
// RUTAS PROTEGIDAS
// ==========================================

/**
 * @route   GET /api/v1/shelters/my-shelter
 * @desc    Obtener mi refugio (del usuario autenticado)
 * @access  Private (Shelter)
 */
router.get('/my/shelter', protect, restrictTo('shelter', 'admin'), shelterController.getMyShelter);

/**
 * @route   POST /api/v1/shelters
 * @desc    Crear nuevo refugio
 * @access  Private (Shelter, Admin)
 * @body    { name, description, location, phone, email, ... }
 */
router.post(
  '/',
  protect,
  restrictTo('shelter', 'admin'),
  createShelterValidation,
  shelterController.createShelter
);

/**
 * @route   PATCH /api/v1/shelters/:id
 * @desc    Actualizar refugio
 * @access  Private (Shelter owner, Admin)
 */
router.patch(
  '/:id',
  protect,
  restrictTo('shelter', 'admin'),
  updateShelterValidation,
  shelterController.updateShelter
);

/**
 * @route   DELETE /api/v1/shelters/:id
 * @desc    Desactivar refugio
 * @access  Private (Shelter owner, Admin)
 */
router.delete(
  '/:id',
  protect,
  restrictTo('shelter', 'admin'),
  shelterController.deleteShelter
);

module.exports = router;