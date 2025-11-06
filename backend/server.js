require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');

console.log('🚀 Iniciando Adoptapet Backend...');

const app = express();

// ============================================
// MIDDLEWARE BÁSICO
// ============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// CONFIGURACIÓN DE CORS
// ============================================
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ============================================
// CONFIGURACIÓN DE SESIONES
// ============================================
app.use(session({
  secret: process.env.SESSION_SECRET || 'adoptapet-secret-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// ============================================
// INICIALIZAR PASSPORT (con manejo de errores)
// ============================================
let passport;
let passportLoaded = false;

try {
  passport = require('./src/config/passport');
  app.use(passport.initialize());
  app.use(passport.session());
  passportLoaded = true;
  console.log('✅ Passport cargado correctamente');
} catch (error) {
  console.error('❌ Error al cargar Passport:', error.message);
  console.log('⚠️ La app continuará sin Google OAuth');
}

// ============================================
// CONECTAR A MONGODB (sin bloquear el inicio)
// ============================================
(async () => {
  try {
    const { connectDB } = require('./src/config/database');
    await connectDB();
  } catch (error) {
    console.log('⚠️ MongoDB no disponible - continuando sin BD');
  }
})();

// ============================================
// LOGGING MIDDLEWARE
// ============================================
app.use((req, res, next) => {
  console.log(`📡 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================
// RUTAS BÁSICAS (PRIMERO)
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Adoptapet Backend funcionando correctamente',
    timestamp: new Date().toISOString(),
    googleAuth: passportLoaded ? 'Habilitado ✅' : 'Deshabilitado ❌',
    mongodb: 'Ver logs del servidor'
  });
});

// Ruta de prueba
app.get('/test', (req, res) => {
  res.json({
    status: 'OK',
    passport: passportLoaded ? 'Cargado ✅' : 'NO cargado ❌',
    session: 'Cargado ✅',
    googleClientId: process.env.GOOGLE_CLIENT_ID ? 'Configurado ✅' : 'NO configurado ❌',
    googleSecret: process.env.GOOGLE_CLIENT_SECRET ? 'Configurado ✅' : 'NO configurado ❌',
    jwtSecret: process.env.JWT_SECRET ? 'Configurado ✅' : 'NO configurado ❌',
    mongoUri: process.env.MONGO_URI ? 'Configurado ✅' : 'NO configurado ❌'
  });
});

// ============================================
// RUTAS DE GOOGLE OAUTH (solo si Passport está cargado)
// ============================================

if (passportLoaded) {
  // Iniciar autenticación con Google
  app.get('/auth/google',
    passport.authenticate('google', { 
      scope: ['profile', 'email']
    })
  );

  // Callback de Google
  app.get('/auth/google/callback', 
    passport.authenticate('google', { 
      failureRedirect: 'http://127.0.0.1:5500/login.html?error=auth_failed',
      session: true
    }),
    function(req, res) {
      try {
        console.log('✅ Autenticación exitosa para:', req.user?.email || 'Usuario');
        
        if (!req.user) {
          throw new Error('No se recibió usuario');
        }
        
        // Generar JWT token
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
          { id: req.user._id || req.user.id, email: req.user.email },
          process.env.JWT_SECRET || 'adoptapet_secreto_super_seguro_2025',
          { expiresIn: '7d' }
        );
        
        // Preparar datos del usuario
        const userData = {
          id: req.user._id || req.user.id,
          nombre: req.user.name,
          email: req.user.email,
          avatar: req.user.avatar,
          rol: req.user.role || 'usuario'
        };
        
        // Redirigir al frontend con token
        const redirectUrl = `http://127.0.0.1:5500/index.html?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`;
        
        console.log('🔄 Redirigiendo a:', redirectUrl);
        res.redirect(redirectUrl);
        
      } catch (error) {
        console.error('❌ Error en callback:', error);
        res.redirect('http://127.0.0.1:5500/login.html?error=server_error');
      }
    }
  );

  // Obtener usuario actual
  app.get('/api/auth/me', (req, res) => {
    console.log('🔍 Verificando autenticación...');
    console.log('   Autenticado:', req.isAuthenticated ? req.isAuthenticated() : false);
    
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      res.json({
        success: true,
        user: {
          id: req.user._id || req.user.id,
          nombre: req.user.name,
          email: req.user.email,
          avatar: req.user.avatar,
          rol: req.user.role || 'usuario'
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }
  });

  // Cerrar sesión
  app.get('/auth/logout', (req, res) => {
    const email = req.user?.email || 'Desconocido';
    req.logout(function(err) {
      if (err) { 
        console.error('❌ Error al cerrar sesión:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Error al cerrar sesión' 
        });
      }
      console.log('👋 Sesión cerrada para:', email);
      res.redirect('http://127.0.0.1:5500/login.html');
    });
  });
} else {
  // Rutas alternativas si Passport no está disponible
  app.get('/auth/google', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Google OAuth no disponible. Verifica la configuración de Passport.'
    });
  });
  
  app.get('/api/auth/me', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Autenticación no disponible'
    });
  });
}

// ============================================
// RUTAS DE AUTENTICACIÓN TRADICIONAL
// ============================================
try {
  const authRoutes = require('./src/routes/authRoutes');
  app.use('/api/auth', authRoutes);
  console.log('✅ Rutas de autenticación tradicional cargadas');
} catch (error) {
  console.log('⚠️ No se cargaron rutas de autenticación tradicional');
}

// ============================================
// RUTA 404
// ============================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.path}`,
    availableRoutes: [
      'GET /health',
      'GET /test',
      passportLoaded ? 'GET /auth/google' : null,
      passportLoaded ? 'GET /auth/google/callback' : null,
      passportLoaded ? 'GET /auth/logout' : null,
      passportLoaded ? 'GET /api/auth/me' : null
    ].filter(Boolean)
  });
});

// ============================================
// MIDDLEWARE DE MANEJO DE ERRORES
// ============================================
app.use((err, req, res, next) => {
  console.error('❌ Error global:', err.message);
  console.error('   Stack:', err.stack);
  
  const statusCode = err.statusCode || err.status || 500;
  const status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

  res.status(statusCode).json({
    success: false,
    status: status,
    message: err.message || 'Error del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║  🎉 ADOPTAPET BACKEND INICIADO EXITOSAMENTE 🎉           ║
║                                                           ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  📍 URLs de acceso:                                       ║
║     • Local:    http://localhost:${PORT}                      ║
║     • Red:      http://0.0.0.0:${PORT}                        ║
║                                                           ║
║  🔐 Google OAuth: ${passportLoaded ? 'HABILITADO ✅' : 'DESHABILITADO ❌'}              ║
${passportLoaded ? `║     • Login:    http://localhost:${PORT}/auth/google      ║
║     • Callback: http://localhost:${PORT}/auth/google/callback ║
║     • Logout:   http://localhost:${PORT}/auth/logout      ║` : ''}
║                                                           ║
║  🧪 Endpoints de prueba:                                  ║
║     • Health:   http://localhost:${PORT}/health           ║
║     • Test:     http://localhost:${PORT}/test             ║
║                                                           ║
║  📌 Frontend esperado en:                                 ║
║     • http://127.0.0.1:5500                               ║
║                                                           ║
║  🗂️  Ambiente: ${process.env.NODE_ENV || 'development'}                             ║
║  📅 Iniciado: ${new Date().toLocaleString('es-CO')}       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM recibido. Cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n👋 SIGINT recibido. Cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado');
    process.exit(0);
  });
});

module.exports = app;