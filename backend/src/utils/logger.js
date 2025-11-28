/**
 * Sistema de logging para Adoptapet Backend
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

/**
 * Muestra el banner de inicio del servidor
 */
exports.showStartupBanner = (config) => {
  const {
    port = 5000,
    host = '0.0.0.0',
    env = 'development',
    passportLoaded = false,
    mongoConnected = false
  } = config;

  const envDisplay = env.toUpperCase().padEnd(11);
  const googleStatus = passportLoaded ? '✅ ACTIVO' : '❌ INACTIVO';
  const mongoStatus = mongoConnected ? '✅ CONECTADO' : '❌ DESCONECTADO';
  const fecha = new Date().toLocaleString('es-CO');

  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║  🐾 ADOPTAPET BACKEND v2.0 - RUNNING 🐾                  ║
║                                                           ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  📍 Server:                                               ║
║     • Local:     http://localhost:${port}                     ║
║     • Network:   http://${host}:${port}                        ║
║     • Ambiente:  ${envDisplay}                       ║
║                                                           ║
║  🔐 Servicios:                                            ║
║     • Google OAuth:  ${googleStatus.padEnd(22)}       ║
║     • MongoDB:       ${mongoStatus.padEnd(22)}       ║
║     • Rate Limiting: ✅ ACTIVO                            ║
║     • Security:      ✅ HELMET                            ║
║     • Compression:   ✅ GZIP                              ║
║                                                           ║
║  🌐 Endpoints principales:                                ║
║     • Health:    /health                                  ║
║     • API Info:  /api/info                                ║
║     • Auth:      /api/auth                                ║
║     • Pets:      /api/pets                                ║
║     • Users:     /api/users                               ║
║                                                           ║
║  📅 Iniciado: ${fecha}       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);

  if (env !== 'production') {
    console.log('💡 Modo desarrollo - Logs detallados activados\n');
  }
};

/**
 * Logger personalizado para diferentes niveles
 */
exports.log = {
  success: (message) => {
    console.log(`${colors.green}✅ ${message}${colors.reset}`);
  },
  
  error: (message, error = null) => {
    console.error(`${colors.red}❌ ${message}${colors.reset}`);
    if (error && process.env.NODE_ENV === 'development') {
      console.error(colors.red, error, colors.reset);
    }
  },
  
  warning: (message) => {
    console.warn(`${colors.yellow}⚠️  ${message}${colors.reset}`);
  },
  
  info: (message) => {
    console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
  },
  
  debug: (message, data = null) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`${colors.cyan}🔍 ${message}${colors.reset}`);
      if (data) {
        console.log(colors.cyan, data, colors.reset);
      }
    }
  },
  
  request: (method, path, statusCode, duration) => {
    const emoji = statusCode < 400 ? '✅' : '❌';
    const color = statusCode < 400 ? colors.green : colors.red;
    console.log(`${color}${emoji} ${method} ${path} - ${statusCode} (${duration}ms)${colors.reset}`);
  }
};

/**
 * Muestra información de configuración
 */
exports.showConfig = (config) => {
  console.log('\n📋 Configuración cargada:');
  console.log('   • Puerto:', config.port || 5000);
  console.log('   • Ambiente:', config.env || 'development');
  console.log('   • MongoDB:', config.mongoUri ? '✅' : '❌');
  console.log('   • Google OAuth:', config.googleClientId ? '✅' : '❌');
  console.log('   • JWT Secret:', config.jwtSecret ? '✅' : '❌');
  console.log('');
};

/**
 * Muestra mensaje de cierre
 */
exports.showShutdown = (signal) => {
  console.log(`\n${colors.yellow}👋 ${signal} recibido. Cerrando servidor...${colors.reset}`);
};

module.exports = exports;