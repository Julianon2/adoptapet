// src/controllers/petController.js
const Pet = require('../models/Pet');
const Shelter = require('../models/Shelter');
const { catchAsync } = require('../middleware/errorHandler');
const { AppError } = require('../middleware/errorHandler');
const { 
  successResponse, 
  createdResponse, 
  paginatedResponse,
  deletedResponse 
} = require('../middleware/responseHandler');

/**
 * CREAR NUEVA MASCOTA
 * POST /api/v1/pets
 */
exports.createPet = catchAsync(async (req, res, next) => {
  // Solo shelters pueden crear mascotas
  if (req.user.role !== 'shelter' && req.user.role !== 'admin') {
    return next(new AppError('Solo refugios pueden publicar mascotas', 403));
  }

  // Buscar el shelter del usuario
  const shelter = await Shelter.findOne({ user: req.user.id });
  if (!shelter) {
    return next(new AppError('Debes tener un refugio registrado para publicar mascotas', 400));
  }

  // Crear la mascota
  const petData = {
    ...req.body,
    shelter: shelter._id
  };

  const pet = await Pet.create(petData);

  // Actualizar contador de mascotas del refugio
  shelter.totalPets += 1;
  await shelter.save();

  createdResponse(res, { pet }, 'Mascota publicada exitosamente');
});

/**
 * OBTENER TODAS LAS MASCOTAS (con filtros y paginación)
 * GET /api/v1/pets
 */
exports.getAllPets = catchAsync(async (req, res, next) => {
  // Construir query
  const queryObj = { ...req.query };
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach(el => delete queryObj[el]);

  // Filtros avanzados (gte, gt, lte, lt)
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

  let query = Pet.find(JSON.parse(queryStr)).populate('shelter', 'nombre location phone');

  // Solo mostrar mascotas disponibles por defecto
  if (!queryObj.status) {
    query = query.find({ status: 'available' });
  }

  // Ordenamiento
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt'); // Por defecto más recientes primero
  }

  // Selección de campos
  if (req.query.fields) {
    const fields = req.query.fields.split(',').join(' ');
    query = query.select(fields);
  }

  // Paginación
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  query = query.skip(skip).limit(limit);

  // Ejecutar query
  const pets = await query;
  const total = await Pet.countDocuments(JSON.parse(queryStr));

  paginatedResponse(res, { pets }, page, limit, total, 'Mascotas obtenidas exitosamente');
});

/**
 * OBTENER UNA MASCOTA POR ID
 * GET /api/v1/pets/:id
 */
exports.getPetById = catchAsync(async (req, res, next) => {
  const pet = await Pet.findById(req.params.id)
    .populate('shelter', 'nombre location phone email website')
    .populate('adoptedBy', 'nombre email phone');

  if (!pet) {
    return next(new AppError('Mascota no encontrada', 404));
  }

  successResponse(res, { pet }, 'Mascota obtenida exitosamente');
});

/**
 * ACTUALIZAR MASCOTA
 * PATCH /api/v1/pets/:id
 */
exports.updatePet = catchAsync(async (req, res, next) => {
  const pet = await Pet.findById(req.params.id).populate('shelter');

  if (!pet) {
    return next(new AppError('Mascota no encontrada', 404));
  }

  // Verificar permisos: solo el shelter dueño o admin pueden actualizar
  const shelter = await Shelter.findOne({ user: req.user.id });
  
  if (req.user.role !== 'admin' && (!shelter || pet.shelter._id.toString() !== shelter._id.toString())) {
    return next(new AppError('No tienes permiso para actualizar esta mascota', 403));
  }

  // No permitir cambiar ciertos campos
  delete req.body.shelter;
  delete req.body.adoptedBy;
  delete req.body.adoptionDate;

  const updatedPet = await Pet.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  successResponse(res, { pet: updatedPet }, 'Mascota actualizada exitosamente');
});

/**
 * ELIMINAR MASCOTA
 * DELETE /api/v1/pets/:id
 */
exports.deletePet = catchAsync(async (req, res, next) => {
  const pet = await Pet.findById(req.params.id).populate('shelter');

  if (!pet) {
    return next(new AppError('Mascota no encontrada', 404));
  }

  // Verificar permisos
  const shelter = await Shelter.findOne({ user: req.user.id });
  
  if (req.user.role !== 'admin' && (!shelter || pet.shelter._id.toString() !== shelter._id.toString())) {
    return next(new AppError('No tienes permiso para eliminar esta mascota', 403));
  }

  // No permitir eliminar si ya fue adoptada
  if (pet.status === 'adopted') {
    return next(new AppError('No puedes eliminar una mascota que ya fue adoptada', 400));
  }

  await Pet.findByIdAndDelete(req.params.id);

  // Actualizar contador del refugio
  if (shelter) {
    shelter.totalPets = Math.max(0, shelter.totalPets - 1);
    await shelter.save();
  }

  deletedResponse(res, 'Mascota eliminada exitosamente');
});

/**
 * BUSCAR MASCOTAS (por nombre, especie, raza, etc.)
 * GET /api/v1/pets/search
 */
exports.searchPets = catchAsync(async (req, res, next) => {
  const { q, species, gender, size, age } = req.query;

  const query = { status: 'available' };

  // Búsqueda por texto
  if (q) {
    query.$or = [
      { name: { $regex: q, $options: 'i' } },
      { breed: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } }
    ];
  }

  // Filtros específicos
  if (species) query.species = species;
  if (gender) query.gender = gender;
  if (size) query.size = size;
  if (age) query.age = age;

  const pets = await Pet.find(query)
    .populate('shelter', 'nombre location')
    .limit(20)
    .sort('-createdAt');

  successResponse(res, { pets, count: pets.length }, 'Búsqueda completada');
});

/**
 * OBTENER MASCOTAS DE UN SHELTER ESPECÍFICO
 * GET /api/v1/pets/shelter/:shelterId
 */
exports.getPetsByShelterId = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const pets = await Pet.find({ shelter: req.params.shelterId })
    .skip(skip)
    .limit(limit)
    .sort('-createdAt');

  const total = await Pet.countDocuments({ shelter: req.params.shelterId });

  paginatedResponse(res, { pets }, page, limit, total, 'Mascotas del refugio obtenidas');
});