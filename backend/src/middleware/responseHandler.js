// src/middleware/responseHandler.js

/**
 * Respuesta exitosa estándar
 */
const successResponse = (res, data, message = 'Operación exitosa', statusCode = 200) => {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data
  });
};

/**
 * Respuesta exitosa con token (para autenticación)
 */
const successResponseWithToken = (res, token, data, message = 'Operación exitosa') => {
  return res.status(200).json({
    status: 'success',
    message,
    token,
    data
  });
};

/**
 * Respuesta para recursos creados
 */
const createdResponse = (res, data, message = 'Recurso creado exitosamente') => {
  return res.status(201).json({
    status: 'success',
    message,
    data
  });
};

/**
 * Respuesta para eliminación exitosa
 */
const deletedResponse = (res, message = 'Recurso eliminado exitosamente') => {
  return res.status(200).json({
    status: 'success',
    message,
    data: null
  });
};

/**
 * Respuesta con paginación
 */
const paginatedResponse = (res, data, page, limit, total, message = 'Datos obtenidos exitosamente') => {
  return res.status(200).json({
    status: 'success',
    message,
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1
    }
  });
};

module.exports = {
  successResponse,
  successResponseWithToken,
  createdResponse,
  deletedResponse,
  paginatedResponse
};