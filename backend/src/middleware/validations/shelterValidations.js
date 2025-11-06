// src/middleware/validations/shelterValidations.js
const { body, validationResult } = require('express-validator');
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
 * Validaciones para CREAR REFUGIO
 */
exports.createShelterValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('El nombre del refugio es obligatorio')
    .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('La descripción no puede exceder 1000 caracteres'),
  
  body('location.address')
    .trim()
    .notEmpty().withMessage('La dirección es obligatoria')
    .isLength({ max: 200 }).withMessage('La dirección no puede exceder 200 caracteres'),
  
  body('location.city')
    .trim()
    .notEmpty().withMessage('La ciudad es obligatoria')
    .isLength({ max: 100 }).withMessage('La ciudad no puede exceder 100 caracteres'),
  
  body('location.state')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('El estado/departamento no puede exceder 100 caracteres'),
  
  body('location.country')
    .trim()
    .notEmpty().withMessage('El país es obligatorio')
    .isLength({ max: 100 }).withMessage('El país no puede exceder 100 caracteres'),
  
  body('location.coordinates')
    .optional()
    .isArray().withMessage('Las coordenadas deben ser un array')
    .custom((value) => {
      if (value && value.length === 2) {
        const [lng, lat] = value;
        if (typeof lng !== 'number' || typeof lat !== 'number') {
          throw new Error('Las coordenadas deben ser números');
        }
        if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
          throw new Error('Coordenadas fuera de rango válido');
        }
      }
      return true;
    }),
  
  body('phone')
    .trim()
    .notEmpty().withMessage('El teléfono es obligatorio')
    .isMobilePhone('any').withMessage('Número de teléfono inválido'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('Debe ser un email válido')
    .normalizeEmail(),
  
  body('website')
    .optional()
    .trim()
    .isURL().withMessage('Debe ser una URL válida'),
  
  body('socialMedia.facebook')
    .optional()
    .trim()
    .isURL().withMessage('URL de Facebook inválida'),
  
  body('socialMedia.instagram')
    .optional()
    .trim()
    .isURL().withMessage('URL de Instagram inválida'),
  
  body('socialMedia.twitter')
    .optional()
    .trim()
    .isURL().withMessage('URL de Twitter inválida'),
  
  body('capacity')
    .optional()
    .isInt({ min: 1 }).withMessage('La capacidad debe ser un número positivo'),
  
  body('photos')
    .optional()
    .isArray().withMessage('Photos debe ser un array'),
  
  handleValidationErrors
];

/**
 * Validaciones para ACTUALIZAR REFUGIO
 */
exports.updateShelterValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('La descripción no puede exceder 1000 caracteres'),
  
  body('location.address')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('La dirección no puede exceder 200 caracteres'),
  
  body('location.city')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('La ciudad no puede exceder 100 caracteres'),
  
  body('location.country')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('El país no puede exceder 100 caracteres'),
  
  body('phone')
    .optional()
    .trim()
    .isMobilePhone('any').withMessage('Número de teléfono inválido'),
  
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Debe ser un email válido')
    .normalizeEmail(),
  
  body('website')
    .optional()
    .trim()
    .isURL().withMessage('Debe ser una URL válida'),
  
  body('capacity')
    .optional()
    .isInt({ min: 1 }).withMessage('La capacidad debe ser un número positivo'),
  
  // Prohibir cambiar estos campos
  body('user').not().exists().withMessage('No puedes cambiar el usuario propietario'),
  body('totalPets').not().exists().withMessage('No puedes cambiar el contador de mascotas directamente'),
  
  handleValidationErrors
];