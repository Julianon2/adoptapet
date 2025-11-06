// src/controllers/shelterController.js
const Shelter = require('../models/Shelter');
const User = require('../models/User');
const { catchAsync } = require('../middleware/errorHandler');
const { AppError } = require('../middleware/errorHandler');
const { 
  successResponse, 
  createdResponse, 
  paginatedResponse,
  deletedResponse 
} = require('../middleware/responseHandler');

/**
 * CREAR REFUGIO
 * POST /api/v1/shelters
 */
exports.createShelter = catchAsync(async (req, res, next) => {
  // Verificar que el usuario tenga rol de shelter
  if (req.user.role !== 'shelter' && req.user.role !== 'admin') {
    return next(new AppError('Solo usuarios con rol de refugio pueden crear refugios', 403));
  }

  // Verificar si el usuario ya tiene un refugio
  const existingShelter = await Shelter.findOne({ user: req.user.id });
  if (existingShelter) {
    return next(new AppError('Ya tienes un refugio registrado', 400));
  }

  // Crear el refugio
  const shelterData = {
    ...req.body,
    user: req.user.id
  };

  const shelter = await Shelter.create(shelterData);

  createdResponse(res, { shelter }, 'Refugio creado exitosamente');
});

/**
 * OBTENER TODOS LOS REFUGIOS
 * GET /api/v1/shelters
 */
exports.getAllShelters = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // Filtros
  const query = { isActive: true };
  
  if (req.query.city) {
    query['location.city'] = new RegExp(req.query.city, 'i');
  }
  
  if (req.query.country) {
    query['location.country'] = new RegExp(req.query.country, 'i');
  }

  const shelters = await Shelter.find(query)
    .populate('user', 'nombre email')
    .skip(skip)
    .limit(limit)
    .sort('-createdAt');

  const total = await Shelter.countDocuments(query);

  paginatedResponse(res, { shelters }, page, limit, total, 'Refugios obtenidos exitosamente');
});

/**
 * OBTENER UN REFUGIO POR ID
 * GET /api/v1/shelters/:id
 */
exports.getShelterById = catchAsync(async (req, res, next) => {
  const shelter = await Shelter.findById(req.params.id)
    .populate('user', 'nombre email phone');

  if (!shelter) {
    return next(new AppError('Refugio no encontrado', 404));
  }

  successResponse(res, { shelter }, 'Refugio obtenido exitosamente');
});

/**
 * OBTENER MI REFUGIO
 * GET /api/v1/shelters/my-shelter
 */
exports.getMyShelter = catchAsync(async (req, res, next) => {
  const shelter = await Shelter.findOne({ user: req.user.id })
    .populate('user', 'nombre email phone');

  if (!shelter) {
    return next(new AppError('No tienes un refugio registrado', 404));
  }

  successResponse(res, { shelter }, 'Tu refugio obtenido exitosamente');
});

/**
 * ACTUALIZAR REFUGIO
 * PATCH /api/v1/shelters/:id
 */
exports.updateShelter = catchAsync(async (req, res, next) => {
  const shelter = await Shelter.findById(req.params.id);

  if (!shelter) {
    return next(new AppError('Refugio no encontrado', 404));
  }

  // Verificar permisos: solo el dueño o admin pueden actualizar
  if (req.user.role !== 'admin' && shelter.user.toString() !== req.user.id) {
    return next(new AppError('No tienes permiso para actualizar este refugio', 403));
  }

  // No permitir cambiar el usuario propietario
  delete req.body.user;
  delete req.body.totalPets;

  const updatedShelter = await Shelter.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('user', 'nombre email');

  successResponse(res, { shelter: updatedShelter }, 'Refugio actualizado exitosamente');
});

/**
 * ELIMINAR/DESACTIVAR REFUGIO
 * DELETE /api/v1/shelters/:id
 */
exports.deleteShelter = catchAsync(async (req, res, next) => {
  const shelter = await Shelter.findById(req.params.id);

  if (!shelter) {
    return next(new AppError('Refugio no encontrado', 404));
  }

  // Verificar permisos
  if (req.user.role !== 'admin' && shelter.user.toString() !== req.user.id) {
    return next(new AppError('No tienes permiso para eliminar este refugio', 403));
  }

  // En lugar de eliminar, desactivar
  shelter.isActive = false;
  await shelter.save();

  deletedResponse(res, 'Refugio desactivado exitosamente');
});

/**
 * BUSCAR REFUGIOS
 * GET /api/v1/shelters/search
 */
exports.searchShelters = catchAsync(async (req, res, next) => {
  const { q, city, country } = req.query;

  const query = { isActive: true };

  if (q) {
    query.$or = [
      { name: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } }
    ];
  }

  if (city) {
    query['location.city'] = new RegExp(city, 'i');
  }

  if (country) {
    query['location.country'] = new RegExp(country, 'i');
  }

  const shelters = await Shelter.find(query)
    .populate('user', 'nombre email')
    .limit(20)
    .sort('-createdAt');

  successResponse(res, { shelters, count: shelters.length }, 'Búsqueda completada');
});

/**
 * OBTENER ESTADÍSTICAS DEL REFUGIO
 * GET /api/v1/shelters/:id/stats
 */
exports.getShelterStats = catchAsync(async (req, res, next) => {
  const shelter = await Shelter.findById(req.params.id);

  if (!shelter) {
    return next(new AppError('Refugio no encontrado', 404));
  }

  // Obtener estadísticas de mascotas
  const Pet = require('../models/Pet');
  
  const totalPets = await Pet.countDocuments({ shelter: shelter._id });
  const availablePets = await Pet.countDocuments({ shelter: shelter._id, status: 'available' });
  const adoptedPets = await Pet.countDocuments({ shelter: shelter._id, status: 'adopted' });
  const pendingPets = await Pet.countDocuments({ shelter: shelter._id, status: 'pending' });

  const stats = {
    shelter: {
      name: shelter.name,
      location: shelter.location
    },
    pets: {
      total: totalPets,
      available: availablePets,
      adopted: adoptedPets,
      pending: pendingPets
    },
    adoptionRate: totalPets > 0 ? ((adoptedPets / totalPets) * 100).toFixed(2) + '%' : '0%'
  };

  successResponse(res, { stats }, 'Estadísticas obtenidas exitosamente');
});