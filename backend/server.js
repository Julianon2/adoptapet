require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const helmet = require('helmet');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

console.log('🚀 Iniciando Adoptapet Backend v2.0...');

const app = express();

// ============================================
// CONFIGURACIÓN DE SEGURIDAD
// ============================================

// Helmet para headers de seguridad
app.use(helmet({
  contentSecurityPolicy: false, // Desactivar si usas CDNs
  crossOriginEmbedderPolicy: false
}));

// Protección contra NoSQL injection
app.use(mongoSanitize());

// Compresión de respuestas
app.use(compression());

// Rate limiting general
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por IP
  message: { 
    success: false, 
    message: 'Demasiadas peticiones, intenta más tarde' 
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Rate limiting para autenticación
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // 5 intentos por hora
  message: { 
    success: false, 
    message: 'Demasiados intentos de login, intenta en 1 hora' 
  }
});

// ============================================
// MIDDLEWARE BÁSICO
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// CONFIGURACIÓN DE CORS MEJORADA
// ============================================
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Number']
}));

// ============================================
// CONFIGURACIÓN DE SESIONES MEJORADA
// ============================================
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'adoptapet-secret-2024-change-this',
  resave: false,
  saveUninitialized: false,
  name: 'adoptapet.sid', // Nombre personalizado de cookie
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // true en producción
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  }
};

// En producción, usar store persistente (ej: connect-mongo)
if (process.env.NODE_ENV === 'production' && process.env.MONGO_URI) {
  const MongoStore = require('connect-mongo');
  sessionConfig.store = MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    touchAfter: 24 * 3600 // lazy session update
  });
}

app.use(session(sessionConfig));

// ============================================
// INICIALIZAR PASSPORT
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
  console.log('⚠️  La app continuará sin Google OAuth');
}

// ============================================
// CONECTAR A MONGODB
// ============================================
let mongoConnected = false;

(async () => {
  try {
    // Configurar Mongoose antes de conectar
    const mongoose = require('mongoose');
    mongoose.set('strictQuery', false);
    
    // Deshabilitar warning de índices duplicados
    mongoose.set('autoIndex', true);
    
    const { connectDB } = require('./src/config/database');
    await connectDB();
    mongoConnected = true;
    console.log('✅ MongoDB conectado correctamente');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    console.log('⚠️  La app continuará sin base de datos');
  }
})();

// ============================================
// LOGGING MIDDLEWARE MEJORADO
// ============================================
const logger = require('./src/utils/logger');

app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.log.request(req.method, req.path, res.statusCode, duration);
  });
  
  next();
});

// ============================================
// RUTAS BÁSICAS
// ============================================

// Health check mejorado
app.get('/health', (req, res) => {
  const health = {
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      api: 'operational',
      mongodb: mongoConnected ? 'connected' : 'disconnected',
      googleAuth: passportLoaded ? 'enabled' : 'disabled'
    },
    memory: {
      used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
    }
  };
  
  res.status(200).json(health);
});

// Info del API
app.get('/api/info', (req, res) => {
  res.json({
    name: 'Adoptapet API',
    version: '2.0.0',
    description: 'API para gestión de adopción de mascotas',
    documentation: '/api/docs',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      pets: '/api/pets',
      users: '/api/users',
      applications: '/api/applications'
    }
  });
});

// Ruta de test de configuración
app.get('/test/config', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    config: {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 3000,
      passport: passportLoaded ? '✅ Cargado' : '❌ NO cargado',
      mongodb: mongoConnected ? '✅ Conectado' : '❌ Desconectado',
      session: '✅ Configurado',
      googleClientId: process.env.GOOGLE_CLIENT_ID ? '✅ Configurado' : '❌ NO configurado',
      googleSecret: process.env.GOOGLE_CLIENT_SECRET ? '✅ Configurado' : '❌ NO configurado',
      jwtSecret: process.env.JWT_SECRET ? '✅ Configurado' : '❌ NO configurado',
      mongoUri: process.env.MONGO_URI ? '✅ Configurado' : '❌ NO configurado'
    }
  });
});

// ============================================
// RUTAS DE AUTENTICACIÓN CON GOOGLE OAUTH
// ============================================

if (passportLoaded) {
  // Iniciar autenticación
  app.get('/auth/google', 
    passport.authenticate('google', { 
      scope: ['profile', 'email']
    })
  );

  // Callback de Google
  app.get('/auth/google/callback', 
    passport.authenticate('google', { 
      failureRedirect: `${process.env.FRONTEND_URL || 'http://127.0.0.1:5500'}/login.html?error=auth_failed`,
      session: true
    }),
    (req, res) => {
      try {
        if (!req.user) {
          throw new Error('Usuario no autenticado');
        }
        
        console.log('✅ Usuario autenticado:', req.user.email);
        
        // Generar JWT
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
          { 
            id: req.user._id || req.user.id, 
            email: req.user.email,
            role: req.user.role || 'usuario'
          },
          process.env.JWT_SECRET || 'adoptapet_secreto_super_seguro_2025',
          { expiresIn: '7d' }
        );
        
        // Datos del usuario
        const userData = {
          id: req.user._id || req.user.id,
          nombre: req.user.name,
          email: req.user.email,
          avatar: req.user.avatar,
          rol: req.user.role || 'usuario'
        };
        
        // Redirigir con token
        const frontendUrl = process.env.FRONTEND_URL || 'http://127.0.0.1:5500';
        const redirectUrl = `${frontendUrl}/index.html?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`;
        
        res.redirect(redirectUrl);
        
      } catch (error) {
        console.error('❌ Error en callback de Google:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://127.0.0.1:5500';
        res.redirect(`${frontendUrl}/login.html?error=server_error`);
      }
    }
  );

  // Obtener usuario actual
  app.get('/api/auth/me', (req, res) => {
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
  app.post('/auth/logout', (req, res) => {
    const email = req.user?.email || 'Usuario desconocido';
    
    req.logout((err) => {
      if (err) {
        console.error('❌ Error al cerrar sesión:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Error al cerrar sesión' 
        });
      }
      
      req.session.destroy((err) => {
        if (err) {
          console.error('❌ Error al destruir sesión:', err);
        }
        
        console.log('👋 Sesión cerrada:', email);
        res.clearCookie('adoptapet.sid');
        res.json({ 
          success: true, 
          message: 'Sesión cerrada correctamente' 
        });
      });
    });
  });

} else {
  // Rutas deshabilitadas si no hay Passport
  app.get('/auth/google', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Google OAuth no disponible. Verifica la configuración.'
    });
  });
  
  app.get('/api/auth/me', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Servicio de autenticación no disponible'
    });
  });
}

// ============================================
// RUTAS DE AUTENTICACIÓN TRADICIONAL
// ============================================
try {
  const authRoutes = require('./src/routes/authRoutes');
  app.use('/api/auth', authLimiter, authRoutes);
  require('./src/utils/logger').log.success('Rutas de autenticación tradicional cargadas');
} catch (error) {
  require('./src/utils/logger').log.warning('Rutas de autenticación tradicional no disponibles');
}

// ============================================
// RUTAS DE LA APLICACIÓN
// ============================================

// Mascotas
try {
  const petRoutes = require('./src/routes/petRoutes');
  app.use('/api/pets', petRoutes);
  require('./src/utils/logger').log.success('Rutas de mascotas cargadas');
} catch (error) {
  require('./src/utils/logger').log.warning('Rutas de mascotas no disponibles');
}

// Usuarios
try {
  const userRoutes = require('./src/routes/userRoutes');
  app.use('/api/users', userRoutes);
  require('./src/utils/logger').log.success('Rutas de usuarios cargadas');
} catch (error) {
  require('./src/utils/logger').log.warning('Rutas de usuarios no disponibles');
}

// Solicitudes de adopción
try {
  const applicationRoutes = require('./src/routes/applicationRoutes');
  app.use('/api/applications', applicationRoutes);
  require('./src/utils/logger').log.success('Rutas de solicitudes cargadas');
} catch (error) {
  require('./src/utils/logger').log.warning('Rutas de solicitudes no disponibles');
}

// ============================================
// MANEJO DE ERRORES 404
// ============================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint no encontrado: ${req.method} ${req.path}`,
    suggestion: 'Verifica la documentación en /api/info'
  });
});

// ============================================
// MIDDLEWARE DE MANEJO DE ERRORES GLOBAL
// ============================================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  
  if (process.env.NODE_ENV === 'development') {
    console.error('   Stack:', err.stack);
  }
  
  // Error de CORS
  if (err.message === 'No permitido por CORS') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado por política de CORS',
      origin: req.headers.origin
    });
  }
  
  // Error de validación de Mongoose
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  
  // Error de cast de MongoDB
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'ID inválido'
    });
  }
  
  // Error de duplicado
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      message: `El ${field} ya está registrado`
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expirado'
    });
  }
  
  // Error genérico
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  const logger = require('./src/utils/logger');
  
  // Mostrar banner de inicio
  logger.showStartupBanner({
    port: PORT,
    host: HOST,
    env: process.env.NODE_ENV || 'development',
    passportLoaded,
    mongoConnected
  });
});

// ============================================
// MANEJO DE CIERRE GRACEFUL
// ============================================
const gracefulShutdown = (signal) => {
  const logger = require('./src/utils/logger');
  logger.showShutdown(signal);
  
  server.close(async () => {
    logger.log.success('Servidor HTTP cerrado');
    
    // Cerrar conexión a MongoDB
    if (mongoConnected) {
      try {
        const mongoose = require('mongoose');
        await mongoose.connection.close();
        logger.log.success('MongoDB desconectado');
      } catch (error) {
        logger.log.error('Error al cerrar MongoDB', error);
      }
    }
    
    console.log('👋 Adiós!\n');
    process.exit(0);
  });
  
  // Forzar cierre después de 10 segundos
  setTimeout(() => {
    logger.log.warning('Forzando cierre después de timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
  // En producción, podrías querer cerrar el servidor aquí
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

module.exports = app;