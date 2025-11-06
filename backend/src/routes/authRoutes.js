// =============================================
// RUTAS DE AUTENTICACIÓN - Adoptapet
// =============================================

const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Validaciones
const {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation
} = require('../middleware/validations/authValidations');

// =============================================
// RUTAS PÚBLICAS
// =============================================

/**
 * @route   POST /api/auth/register
 * @desc    Registrar nuevo usuario
 * @access  Public
 */
router.post('/register', registerValidation, authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión
 * @access  Public
 */
router.post('/login', loginValidation, authController.login);

/**
 * @route   GET /api/auth/test
 * @desc    Verificar que las rutas están montadas correctamente
 * @access  Public
 */
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: '✅ Rutas de autenticación funcionando',
    timestamp: new Date().toISOString()
  });
});

// =============================================
// RUTAS DE GOOGLE OAUTH
// =============================================

/**
 * @route   GET /auth/google
 * @desc    Iniciar autenticación con Google
 * @access  Public
 */
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: 'http://127.0.0.1:5500/login.html?error=auth_failed', // ✅ PUERTO CORRECTO (Live Server)
    session: false
  }),
  authController.googleCallback
);

/**
 * @route   GET /auth/google/callback
 * @desc    Callback de Google OAuth
 * @access  Public
 */
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: 'http://127.0.0.1:5000/login.html?error=auth_failed',
    session: false
  }),
  authController.googleCallback
);

// =============================================
// RUTAS PROTEGIDAS
// =============================================

/**
 * @route   GET /api/auth/me
 * @desc    Obtener perfil del usuario autenticado
 * @access  Private
 */
router.get('/me', protect, authController.getMe);

module.exports = router;