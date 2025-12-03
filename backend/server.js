require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const helmet = require('helmet');
const compression = require('compression');

const rateLimit = require('express-rate-limit');

console.log('🚀 Iniciando Adoptapet Backend v2.0...');

const app = express();

// ============================================
// 1. CORS - DEBE IR PRIMERO ⚠️
// ============================================
app.use(cors({
  origin: true, // Acepta cualquier origen
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ============================================
// 2. HELMET - Seguridad de headers
// ============================================
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// ============================================
// 3. COMPRESIÓN
// ============================================
app.use(compression());

// ============================================
// 4. BODY PARSERS (antes de mongoSanitize)
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// 5. PROTECCIÓN NoSQL (después de parsers)
// ============================================
// ============================================
// 5. PROTECCIÓN NoSQL INJECTION (Manual)
// ============================================
app.use((req, res, next) => {
  // Función para sanitizar objetos recursivamente
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    for (let key in obj) {
      // Eliminar claves que empiezan con $ o contienen puntos
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else if (typeof obj[key] === 'object') {
        // Recursivo para objetos anidados
        sanitize(obj[key]);
      }
    }
    return obj;
  };
  
  // Sanitizar body, query y params
  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);
  
  next();
});

console.log('✅ Protección NoSQL Injection activada');
// ============================================
// 6. RATE LIMITING
// ============================================
// ============================================
// 6. RATE LIMITING - CONFIGURACIÓN CORREGIDA
// ============================================

// Limiter general para todas las rutas API
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // 1000 peticiones (MUY permisivo para desarrollo)
  message: { 
    success: false, 
    message: 'Demasiadas peticiones, intenta más tarde' 
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Limiter para autenticación (MÁS PERMISIVO)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos (antes era 1 hora)
  max: 100, // 100 intentos (antes eran solo 5) ✅
  message: { 
    success: false, 
    message: 'Demasiados intentos de login, intenta en 15 minutos' 
  },
  skipSuccessfulRequests: true, // No contar logins exitosos ✅
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================
// 7. CONFIGURACIÓN DE SESIONES
// ============================================
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'adoptapet-secret-2024-change-this',
  resave: false,
  saveUninitialized: false,
  name: 'adoptapet.sid',
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  }
};

if (process.env.NODE_ENV === 'production' && process.env.MONGO_URI) {
  const MongoStore = require('connect-mongo');
  sessionConfig.store = MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    touchAfter: 24 * 3600
  });
}

app.use(session(sessionConfig));

// ============================================
// 8. PASSPORT
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
// 9. MONGODB
// ============================================
let mongoConnected = false;

(async () => {
  try {
    const mongoose = require('mongoose');
    mongoose.set('strictQuery', false);
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
// 10. LOGGING
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

app.get('/test/config', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    config: {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 5000,
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
// RUTAS DE GOOGLE OAUTH
// ============================================
if (passportLoaded) {
  app.get('/auth/google', 
    passport.authenticate('google', { 
      scope: ['profile', 'email']
    })
  );

  app.get('/auth/google/callback', 
    passport.authenticate('google', { 
      failureRedirect: `${process.env.FRONTEND_URL || 'http://127.0.0.1:5000'}/login.html?error=auth_failed`,
      session: true
    }),
    (req, res) => {
      try {
        if (!req.user) {
          throw new Error('Usuario no autenticado');
        }
        
        console.log('✅ Usuario autenticado:', req.user.email);
        
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
        
        const userData = {
          id: req.user._id || req.user.id,
          nombre: req.user.name,
          email: req.user.email,
          avatar: req.user.avatar,
          rol: req.user.role || 'usuario'
        };
        
        const frontendUrl = process.env.FRONTEND_URL || 'http://127.0.0.1:5000';
        const redirectUrl = `${frontendUrl}/index.html?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`;
        
        res.redirect(redirectUrl);
        
      } catch (error) {
        console.error('❌ Error en callback de Google:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://127.0.0.1:5000';
        res.redirect(`${frontendUrl}/login.html?error=server_error`);
      }
    }
  );

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
  logger.log.success('Rutas de autenticación tradicional cargadas');
} catch (error) {
  logger.log.warning('Rutas de autenticación tradicional no disponibles');
}

// ============================================
// RUTAS DE LA APLICACIÓN
// ============================================
try {
  const petRoutes = require('./src/routes/petRoutes');
  app.use('/api/pets', petRoutes);
  logger.log.success('Rutas de mascotas cargadas');
} catch (error) {
  logger.log.warning('Rutas de mascotas no disponibles');
}

try {
  const userRoutes = require('./src/routes/userRoutes');
  app.use('/api/users', userRoutes);
  logger.log.success('Rutas de usuarios cargadas');
} catch (error) {
  logger.log.warning('Rutas de usuarios no disponibles');
}

try {
  const applicationRoutes = require('./src/routes/applicationRoutes');
  app.use('/api/applications', applicationRoutes);
  logger.log.success('Rutas de solicitudes cargadas');
} catch (error) {
  logger.log.warning('Rutas de solicitudes no disponibles');
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
  
  if (err.message === 'No permitido por CORS') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado por política de CORS',
      origin: req.headers.origin
    });
  }
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'ID inválido'
    });
  }
  
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      message: `El ${field} ya está registrado`
    });
  }
  
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
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  logger.showStartupBanner({
    port: PORT,
    host: HOST,
    env: process.env.NODE_ENV || 'development',
    passportLoaded,
    mongoConnected
  });
});

// ============================================
// CIERRE GRACEFUL
// ============================================
const gracefulShutdown = (signal) => {
  logger.showShutdown(signal);
  
  server.close(async () => {
    logger.log.success('Servidor HTTP cerrado');
    
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
  
  setTimeout(() => {
    logger.log.warning('Forzando cierre después de timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

module.exports = app;