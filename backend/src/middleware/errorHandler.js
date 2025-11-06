// src/middleware/errorHandler.js

/**
 * Clase personalizada para errores de la aplicación
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware para manejar errores de MongoDB (Cast Error, Duplicados, Validación)
 */
const handleCastErrorDB = (err) => {
  const message = `Recurso no encontrado. ID inválido: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `El ${field} '${value}' ya existe. Por favor usa otro valor.`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Datos inválidos. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () => 
  new AppError('Token inválido. Por favor inicia sesión nuevamente.', 401);

const handleJWTExpiredError = () => 
  new AppError('Tu sesión ha expirado. Por favor inicia sesión nuevamente.', 401);

/**
 * Enviar error en desarrollo (con stack trace completo)
 */
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

/**
 * Enviar error en producción (solo info necesaria)
 */
const sendErrorProd = (err, res) => {
  // Error operacional: enviar mensaje al cliente
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } 
  // Error de programación: no filtrar detalles
  else {
    console.error('ERROR 💥', err);
    res.status(500).json({
      status: 'error',
      message: 'Algo salió mal en el servidor'
    });
  }
};

/**
 * Middleware global de manejo de errores
 */
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    // Manejar errores específicos de MongoDB
    if (err.nombre === 'CastError') error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    if (err.nombre === 'ValidationError') error = handleValidationErrorDB(error);
    if (err.nombre === 'JsonWebTokenError') error = handleJWTError();
    if (err.nombre === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

/**
 * Middleware para capturar errores asíncronos
 * Evita tener que usar try-catch en cada controlador
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = {
  AppError,
  globalErrorHandler,
  catchAsync
};