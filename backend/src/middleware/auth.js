// =============================================
// MIDDLEWARE DE AUTENTICACIÓN - ADOPTAPET
// =============================================

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ✅ IMPORTANTE: debe coincidir con el secreto usado al firmar tokens en server.js
const JWT_SECRET = process.env.JWT_SECRET || 'adoptapet_secreto_super_seguro_2025';

// =============================================
// PROTEGER RUTAS - Verificar JWT Token (Header o Cookie)
// =============================================
exports.protect = async (req, res, next) => {
  try {
    let token;

    // 1. Buscar token en Authorization Header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // 2. Buscar token en Cookie
    else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    // 3. Si no hay token, denegar acceso
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado. Por favor inicia sesión.'
      });
    }

    // 4. Verificar token
    const decoded = jwt.verify(token, JWT_SECRET);

    // 5. Buscar usuario
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'El usuario al que pertenece este token ya no existe'
      });
    }

    // 6. Verificar si el usuario está activo
    // (si tu app no usa status, coméntalo o asegúrate que sea 'active' en DB)
    if (user.status && user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Esta cuenta ha sido desactivada'
      });
    }

    // 7. Adjuntar usuario a la request
    req.user = user;

    // 8. Permitir acceso a la ruta
    next();
  } catch (error) {
    console.error('❌ Error en middleware protect:', error.message);

    // 👇 útil para diferenciar casos
    // JsonWebTokenError / TokenExpiredError
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado'
    });
  }
};

// =============================================
// AUTORIZAR ROLES ESPECÍFICOS
// =============================================
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado'
      });
    }

    // Validar rol (usar 'role', no 'rol')
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `No tienes permiso para realizar esta acción. Se requiere uno de los siguientes roles: ${roles.join(', ')}.`
      });
    }

    next();
  };
};

// Alias para compatibilidad (opcional)
exports.authorize = exports.restrictTo;

// =============================================
// VERIFICAR SI ES DUEÑO DEL RECURSO
// =============================================
exports.isOwner = (resourceUserId) => {
  return (req, res, next) => {
    // Si es admin, puede hacer todo
    if (req.user.role === 'admin') {
      return next();
    }

    // Verificar si es el dueño
    if (req.user.id !== resourceUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para modificar este recurso'
      });
    }

    next();
  };
};

// =============================================
// MIDDLEWARE OPCIONAL DE AUTENTICACIÓN
// =============================================
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (user && (!user.status || user.status === 'active')) {
        req.user = user;
      }
    } catch (err) {
      // Token inválido → continuar sin usuario
    }

    next();
  } catch (error) {
    console.error('❌ Error en optionalAuth:', error.message);
    next();
  }
};
