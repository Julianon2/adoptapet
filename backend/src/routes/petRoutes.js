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
// RUTAS PÚBLICAS - ESPECÍFICAS PRIMERO
// ==========================================

/**
 * @route   GET /api/pets/adopcion
 * @desc    Obtener mascotas disponibles en adopción
 * @access  Public
 */
router.get('/adopcion', petController.getMascotasEnAdopcion);

/**
 * @route   GET /api/pets/search
 * @desc    Buscar mascotas por nombre, raza, etc.
 * @access  Public
 */
router.get('/search', searchPetsValidation, petController.searchPets);

/**
 * @route   GET /api/pets/shelter/:shelterId
 * @desc    Obtener mascotas de un refugio específico
 * @access  Public
 */
router.get('/shelter/:shelterId', petController.getPetsByShelterId);

// ==========================================
// RUTAS PROTEGIDAS - ESPECÍFICAS
// ==========================================

/**
 * @route   POST /api/pets/publicar-adopcion
 * @desc    Publicar mascota en adopción (cualquier usuario autenticado)
 * @access  Private (Authenticated users)
 */
router.post(
  '/publicar-adopcion',
  protect,
  petController.publicarMascotaAdopcion
);

/**
 * @route   POST /api/pets
 * @desc    Crear nueva mascota (solo refugios/admins)
 * @access  Private (Shelter, Admin)
 */
router.post(
  '/',
  protect,
  restrictTo('shelter', 'admin'),
  createPetValidation,
  petController.createPet
);

// ==========================================
// RUTAS CON PARÁMETROS - AL FINAL
// ==========================================

/**
 * @route   GET /api/pets/:id
 * @desc    Obtener una mascota por ID
 * @access  Public
 */
router.get('/:id', petController.getPetById);

/**
 * @route   PATCH /api/pets/:id
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
 * @route   DELETE /api/pets/:id
 * @desc    Eliminar mascota
 * @access  Private (Shelter owner, Admin)
 */
router.delete(
  '/:id',
  protect,
  restrictTo('shelter', 'admin'),
  petController.deletePet
);

/**
 * @route   GET /api/pets
 * @desc    Obtener todas las mascotas (con filtros y paginación)
 * @access  Public
 * @note    Esta va al final para no interferir con rutas específicas
 */
router.get('/', petController.getAllPets);

module.exports = router;