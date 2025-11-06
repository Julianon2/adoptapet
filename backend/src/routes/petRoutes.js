// src/routes/petRoutes.js
const express = require('express');
const petController = require('../controllers/petController');
const { protect, restrictTo } = require('../middleware/auth');
const {
  createPetValidation,
  updatePetValidation,
  searchPetsValidation
} = require('../middleware/validations/petValidations');

const router = express.Router();

// ==========================================
// RUTAS PÚBLICAS
// ==========================================

/**
 * @route   GET /api/v1/pets
 * @desc    Obtener todas las mascotas (con filtros y paginación)
 * @access  Public
 * @query   ?species=dog&gender=male&age=puppy&page=1&limit=10&sort=-createdAt
 */
router.get('/', petController.getAllPets);

/**
 * @route   GET /api/v1/pets/search
 * @desc    Buscar mascotas por nombre, raza, etc.
 * @access  Public
 * @query   ?q=golden&species=dog&size=large
 */
router.get('/search', searchPetsValidation, petController.searchPets);

/**
 * @route   GET /api/v1/pets/shelter/:shelterId
 * @desc    Obtener mascotas de un refugio específico
 * @access  Public
 */
router.get('/shelter/:shelterId', petController.getPetsByShelterId);

/**
 * @route   GET /api/v1/pets/:id
 * @desc    Obtener una mascota por ID
 * @access  Public
 */
router.get('/:id', petController.getPetById);

// ==========================================
// RUTAS PROTEGIDAS (Solo refugios y admins)
// ==========================================

/**
 * @route   POST /api/v1/pets
 * @desc    Crear nueva mascota
 * @access  Private (Shelter, Admin)
 * @body    { name, species, breed, age, gender, size, description, photos, ... }
 */
router.post(
  '/',
  protect,
  restrictTo('shelter', 'admin'),
  createPetValidation,
  petController.createPet
);

/**
 * @route   PATCH /api/v1/pets/:id
 * @desc    Actualizar mascota
 * @access  Private (Shelter owner, Admin)
 */
router.patch(
  '/:id',
  protect,
  restrictTo('shelter', 'admin'),
  updatePetValidation,
  petController.updatePet
);

/**
 * @route   DELETE /api/v1/pets/:id
 * @desc    Eliminar mascota
 * @access  Private (Shelter owner, Admin)
 */
router.delete(
  '/:id',
  protect,
  restrictTo('shelter', 'admin'),
  petController.deletePet
);

module.exports = router;