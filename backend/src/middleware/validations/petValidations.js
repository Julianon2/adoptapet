// src/middleware/validations/petValidations.js
const { body, query, validationResult } = require('express-validator');
const { AppError } = require('../errorHandler');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg);
    return next(new AppError(errorMessages.join('. '), 400));
  }
  next();
};

/**
 * Validaciones para CREAR MASCOTA
 */
exports.createPetValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('El nombre de la mascota es obligatorio')
    .isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  
  body('species')
    .notEmpty().withMessage('La especie es obligatoria')
    .isIn(['dog', 'cat', 'bird', 'rabbit', 'other']).withMessage('Especie no válida'),
  
  body('breed')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('La raza no puede exceder 100 caracteres'),
  
  body('age')
    .notEmpty().withMessage('La edad es obligatoria')
    .isIn(['puppy', 'young', 'adult', 'senior']).withMessage('Edad no válida'),
  
  body('gender')
    .notEmpty().withMessage('El género es obligatorio')
    .isIn(['male', 'female', 'unknown']).withMessage('Género no válido'),
  
  body('size')
    .notEmpty().withMessage('El tamaño es obligatorio')
    .isIn(['small', 'medium', 'large', 'extra-large']).withMessage('Tamaño no válido'),
  
  body('color')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('El color no puede exceder 50 caracteres'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('La descripción no puede exceder 1000 caracteres'),
  
  body('personality')
    .optional()
    .isArray().withMessage('La personalidad debe ser un array')
    .custom((value) => {
      const validTraits = ['friendly', 'calm', 'playful', 'energetic', 'shy', 'affectionate', 'independent', 'protective'];
      return value.every(trait => validTraits.includes(trait));
    }).withMessage('Rasgos de personalidad no válidos'),
  
  body('healthStatus')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('El estado de salud no puede exceder 500 caracteres'),
  
  body('vaccinated')
    .optional()
    .isBoolean().withMessage('Vaccinated debe ser true o false'),
  
  body('sterilized')
    .optional()
    .isBoolean().withMessage('Sterilized debe ser true o false'),
  
  body('specialNeeds')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Las necesidades especiales no pueden exceder 500 caracteres'),
  
  body('photos')
    .optional()
    .isArray().withMessage('Photos debe ser un array')
    .custom((value) => {
      return value.every(url => typeof url === 'string');
    }).withMessage('Todas las fotos deben ser URLs válidas'),
  
  handleValidationErrors
];

/**
 * Validaciones para ACTUALIZAR MASCOTA
 */
exports.updatePetValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  
  body('species')
    .optional()
    .isIn(['dog', 'cat', 'bird', 'rabbit', 'other']).withMessage('Especie no válida'),
  
  body('breed')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('La raza no puede exceder 100 caracteres'),
  
  body('age')
    .optional()
    .isIn(['puppy', 'young', 'adult', 'senior']).withMessage('Edad no válida'),
  
  body('gender')
    .optional()
    .isIn(['male', 'female', 'unknown']).withMessage('Género no válido'),
  
  body('size')
    .optional()
    .isIn(['small', 'medium', 'large', 'extra-large']).withMessage('Tamaño no válido'),
  
  body('status')
    .optional()
    .isIn(['available', 'pending', 'adopted']).withMessage('Estado no válido'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('La descripción no puede exceder 1000 caracteres'),
  
  handleValidationErrors
];

/**
 * Validaciones para BÚSQUEDA
 */
exports.searchPetsValidation = [
  query('species')
    .optional()
    .isIn(['dog', 'cat', 'bird', 'rabbit', 'other']).withMessage('Especie no válida'),
  
  query('gender')
    .optional()
    .isIn(['male', 'female', 'unknown']).withMessage('Género no válido'),
  
  query('size')
    .optional()
    .isIn(['small', 'medium', 'large', 'extra-large']).withMessage('Tamaño no válido'),
  
  query('age')
    .optional()
    .isIn(['puppy', 'young', 'adult', 'senior']).withMessage('Edad no válida'),
  
  handleValidationErrors
];