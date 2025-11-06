// =============================================
// CONFIGURACIÓN DE BASE DE DATOS - MONGODB ATLAS
// =============================================

const mongoose = require('mongoose');

/**
 * Conectar a MongoDB Atlas
 * Esta función establece la conexión entre nuestra app y la base de datos
 */
const connectDB = async () => {
    try {
        console.log('🔄 Intentando conectar a MongoDB Atlas...');
        
        // Verificar que exista la URI
        const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
        
        if (!mongoUri) {
            console.log('⚠️ MONGO_URI no configurado en .env');
            console.log('💡 La app funcionará sin base de datos (solo Google OAuth)');
            return null;
        }
        
        // Opciones de conexión optimizadas
        const options = {
            maxPoolSize: 10,                // Máximo 10 conexiones simultáneas
            serverSelectionTimeoutMS: 5000, // Timeout de 5 segundos
            socketTimeoutMS: 45000,         // Timeout de socket de 45 segundos
            family: 4                       // Usar IPv4
        };

        // Realizar la conexión
        const conn = await mongoose.connect(mongoUri, options);
        
        // Mostrar información de éxito
        console.log('✅ MongoDB Atlas conectado exitosamente');
        console.log(`📍 Host: ${conn.connection.host}`);
        console.log(`🗃️  Base de datos: ${conn.connection.name}`);
        console.log(`🔌 Puerto: ${conn.connection.port || 'N/A'}`);
        
        return conn;
        
    } catch (error) {
        console.log('\n⚠️ ============================================');
        console.log('⚠️ NO SE PUDO CONECTAR A MONGODB ATLAS');
        console.log('⚠️ ============================================');
        
        // Diferentes tipos de errores comunes
        if (error.code === 'ETIMEDOUT') {
            console.log('⏱️  Error: Conexión tardó demasiado (timeout)');
            console.log('💡 Solución: Verificar conexión a internet');
        } else if (error.code === 'ENOTFOUND') {
            console.log('🔍 Error: Host no encontrado');
            console.log('💡 Solución: Verificar URL de MongoDB Atlas en .env');
        } else if (error.name === 'MongoParseError') {
            console.log('📝 Error: Formato incorrecto en URL de MongoDB');
            console.log('💡 Solución: Revisar MONGO_URI en .env');
        } else if (error.name === 'MongoNetworkError' || error.name === 'MongoServerSelectionError') {
            console.log('🌐 Error: No se puede acceder al servidor de MongoDB');
            console.log('💡 Razón más común: Tu IP no está en la whitelist');
        } else {
            console.log(`🐛 Error: ${error.message}`);
        }
        
        console.log('\n🔧 PARA SOLUCIONAR:');
        console.log('   1. Ve a: https://cloud.mongodb.com/');
        console.log('   2. Menú lateral → Network Access');
        console.log('   3. Click → ADD IP ADDRESS');
        console.log('   4. Selecciona → ALLOW ACCESS FROM ANYWHERE (0.0.0.0/0)');
        console.log('   5. Click → Confirm');
        console.log('   6. Espera 1-2 minutos y reinicia el servidor');
        
        console.log('\n💡 La aplicación continuará funcionando:');
        console.log('   ✅ Google OAuth funcionará normalmente');
        console.log('   ❌ Los usuarios NO se guardarán en la base de datos');
        console.log('⚠️ ============================================\n');
        
        // NO cerrar la aplicación, solo retornar null
        return null;
    }
};

/**
 * Cerrar conexión elegantemente
 */
const closeDB = async () => {
    try {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
            console.log('🔌 Conexión a MongoDB cerrada correctamente');
        }
    } catch (error) {
        console.error('❌ Error cerrando conexión:', error.message);
    }
};

// =============================================
// EVENTOS DE CONEXIÓN PARA MONITOREO
// =============================================

mongoose.connection.on('connected', () => {
    console.log('🔗 Mongoose conectado a MongoDB Atlas');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ Error de conexión Mongoose:', err.message);
});

mongoose.connection.on('disconnected', () => {
    console.log('🔌 Mongoose desconectado de MongoDB Atlas');
});

mongoose.connection.on('reconnected', () => {
    console.log('🔄 Mongoose reconectado a MongoDB Atlas');
});

// Cerrar conexión cuando la app termina
process.on('SIGINT', async () => {
    console.log('\n🛑 Cerrando aplicación...');
    await closeDB();
    process.exit(0);
});

module.exports = {
    connectDB,
    closeDB
};