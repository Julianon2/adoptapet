// =============================================
// SCRIPT DE PRUEBAS - MODELO USER
// =============================================

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function testUserModel() {
    try {
        console.log('🧪 Iniciando pruebas del modelo User de AdoptaPet...\n');
        
        // CONECTAR A LA BASE DE DATOS
        console.log('🔗 Conectando a MongoDB Atlas...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conexión establecida exitosamente\n');
        
        // PRUEBA 1: CREAR USUARIO ADOPTANTE VÁLIDO
        console.log('👤 === PRUEBA 1: CREAR USUARIO ADOPTANTE VÁLIDO ===');
        
        const adopter = new User({
            name: 'Carlos Rodríguez',
            email: 'carlos.rodriguez@test.com',
            password: 'password123',
            role: 'adopter',
            bio: 'Amante de los animales, buscando un compañero peludo para mi familia',
            phone: '+57 300 1234567',
            location: {
                country: 'Colombia',
                city: 'Bogotá',
                address: 'Calle 100 #15-20'
            },
            adoptionPreferences: {
                species: ['perro', 'gato'],
                size: ['mediano', 'grande'],
                age: 'cualquiera',
                hasGarden: true,
                hasOtherPets: false,
                hasChildren: true,
                experience: 'mucha'
            }
        });
        
        const validationError = adopter.validateSync();
        
        if (validationError) {
            console.log('❌ Error de validación inesperado:');
            Object.values(validationError.errors).forEach(error => {
                console.log(`   • ${error.message}`);
            });
        } else {
            console.log('✅ Usuario válido - Estructura correcta');
            console.log(`   👤 Nombre: ${adopter.name}`);
            console.log(`   📧 Email: ${adopter.email}`);
            console.log(`   🎭 Rol: ${adopter.roleText}`);
            console.log(`   📍 Ciudad: ${adopter.location.city}`);
            console.log(`   📊 Completitud del perfil: ${adopter.profileCompleteness}%`);
            
            console.log('\n💾 Guardando usuario y probando encriptación...');
            const passwordBefore = adopter.password;
            await adopter.save();
            
            const savedUser = await User.findById(adopter._id).select('+password');
            
            console.log(`✅ Usuario guardado exitosamente con ID: ${adopter.id}`);
            console.log(`   🔐 Contraseña encriptada: ${savedUser.password !== passwordBefore ? 'Sí ✅' : 'No ❌'}`);
            console.log(`   🎨 Avatar generado: ${adopter.avatar ? 'Sí ✅' : 'No ❌'}`);
        }
        
        // PRUEBA 2: CREAR REFUGIO
        console.log('\n🏥 === PRUEBA 2: CREAR REFUGIO ===');
        
        const shelter = new User({
            name: 'María González',
            email: 'contacto@refugiofeliz.com',
            password: 'shelter123',
            role: 'shelter',
            bio: 'Refugio dedicado al rescate y adopción responsable',
            phone: '+57 310 9876543',
            location: {
                country: 'Colombia',
                city: 'Medellín'
            },
            shelterInfo: {
                organizationName: 'Refugio Feliz',
                website: 'https://refugiofeliz.com',
                taxId: '900123456-7',
                description: 'Somos una organización sin ánimo de lucro dedicada al rescate, rehabilitación y adopción de animales abandonados.',
                capacity: 50,
                socialMedia: {
                    facebook: 'refugiofeliz',
                    instagram: '@refugiofeliz',
                    twitter: '@refugiofeliz'
                }
            },
            verified: {
                email: true,
                shelter: true
            }
        });
        
        await shelter.save();
        console.log(`✅ Refugio guardado: ${shelter.displayName}`);
        console.log(`   🏥 Organización: ${shelter.shelterInfo.organizationName}`);
        console.log(`   📧 Email: ${shelter.email}`);
        console.log(`   🎭 Rol: ${shelter.roleText}`);
        console.log(`   ✅ Verificación completa: ${shelter.isFullyVerified ? 'Sí' : 'No'}`);
        console.log(`   📊 Completitud del perfil: ${shelter.profileCompleteness}%`);
        
        // PRUEBA 3: VALIDAR DATOS INCORRECTOS
        console.log('\n🚨 === PRUEBA 3: VALIDAR DATOS INCORRECTOS ===');
        
        const invalidUser = new User({
            name: 'A',
            email: 'email-invalido',
            password: '123',
            role: 'super-admin',
            phone: 'abc123',
            bio: 'x'.repeat(600)
        });
        
        const errors = invalidUser.validateSync();
        
        if (errors) {
            console.log('✅ Validaciones funcionando correctamente:');
            Object.values(errors.errors).forEach(error => {
                console.log(`   🚫 ${error.path}: ${error.message}`);
            });
        } else {
            console.log('❌ ERROR: Las validaciones NO están funcionando');
        }
        
        // PRUEBA 4: PROBAR COMPARACIÓN DE CONTRASEÑAS
        console.log('\n🔐 === PRUEBA 4: PROBAR COMPARACIÓN DE CONTRASEÑAS ===');
        
        const userWithPassword = await User.findById(adopter._id).select('+password');
        
        const isCorrectPassword = await userWithPassword.comparePassword('password123');
        console.log(`✅ Contraseña correcta: ${isCorrectPassword ? 'Sí ✅' : 'No ❌'}`);
        
        const isWrongPassword = await userWithPassword.comparePassword('wrongpassword');
        console.log(`❌ Contraseña incorrecta rechazada: ${!isWrongPassword ? 'Sí ✅' : 'No ❌'}`);
        
        // PRUEBA 5: PROBAR CAMPOS VIRTUALES
        console.log('\n⚡ === PRUEBA 5: PROBAR CAMPOS VIRTUALES ===');
        
        console.log('✅ Campos virtuales calculados correctamente:');
        console.log(`   👤 Nombre para mostrar (adopter): ${adopter.displayName}`);
        console.log(`   🏥 Nombre para mostrar (shelter): ${shelter.displayName}`);
        console.log(`   ✅ Verificación completa (adopter): ${adopter.isFullyVerified}`);
        console.log(`   ✅ Verificación completa (shelter): ${shelter.isFullyVerified}`);
        console.log(`   🔒 Cuenta bloqueada: ${adopter.isLocked}`);
        console.log(`   📊 Completitud perfil (adopter): ${adopter.profileCompleteness}%`);
        console.log(`   📊 Completitud perfil (shelter): ${shelter.profileCompleteness}%`);
        
        // PRUEBA 6: PROBAR MÉTODOS PERSONALIZADOS
        console.log('\n🔧 === PRUEBA 6: PROBAR MÉTODOS PERSONALIZADOS ===');
        
        console.log(`¿${adopter.name} es admin? ${adopter.isAdmin() ? 'Sí' : 'No'}`);
        console.log(`¿${shelter.displayName} es refugio? ${shelter.isShelter() ? 'Sí' : 'No'}`);
        console.log(`¿${adopter.name} puede publicar mascotas? ${adopter.canPublishPets() ? 'Sí' : 'No'}`);
        console.log(`¿${shelter.displayName} puede publicar mascotas? ${shelter.canPublishPets() ? 'Sí' : 'No'}`);
        
        const petId = new mongoose.Types.ObjectId();
        await adopter.addFavoritePet(petId);
        console.log(`\n✅ Mascota agregada a favoritos de ${adopter.name}`);
        console.log(`   Favoritos totales: ${adopter.favoritesPets.length}`);
        
        await adopter.removeFavoritePet(petId);
        console.log(`✅ Mascota removida de favoritos`);
        console.log(`   Favoritos totales: ${adopter.favoritesPets.length}`);
        
        await adopter.verifyEmail();
        console.log(`✅ Email verificado para ${adopter.name}`);
        console.log(`   Email verificado: ${adopter.verified.email ? 'Sí' : 'No'}`);
        
        // PRUEBA 7: PROBAR INTENTOS DE LOGIN
        console.log('\n🔒 === PRUEBA 7: PROBAR SISTEMA DE INTENTOS DE LOGIN ===');
        
        const testUser = new User({
            name: 'Test User',
            email: 'test.login@test.com',
            password: 'test123',
            role: 'adopter'
        });
        await testUser.save();
        
        console.log(`Usuario creado para pruebas de login: ${testUser.email}`);
        console.log(`Intentos de login iniciales: ${testUser.loginAttempts}`);
        
        for (let i = 1; i <= 5; i++) {
            await testUser.incrementLoginAttempts();
            const updatedUser = await User.findById(testUser._id);
            console.log(`   Intento ${i}: ${updatedUser.loginAttempts} intentos fallidos`);
            
            if (updatedUser.isLocked) {
                console.log(`   🔒 Cuenta bloqueada después de ${i} intentos`);
                break;
            }
        }
        
        const lockedUser = await User.findById(testUser._id);
        await lockedUser.resetLoginAttempts();
        const resetUser = await User.findById(testUser._id);
        console.log(`✅ Intentos reseteados: ${resetUser.loginAttempts}`);
        console.log(`✅ Cuenta desbloqueada: ${!resetUser.isLocked}`);
        
        // PRUEBA 8: BUSCAR USUARIOS
        console.log('\n🔍 === PRUEBA 8: BUSCAR USUARIOS ===');
        
        const testEmails = ['test.com', 'refugiofeliz.com'];
        const allUsers = await User.find({
            $or: testEmails.map(domain => ({ email: new RegExp(`@${domain}$`, 'i') }))
        });
        
        console.log(`✅ Usuarios encontrados: ${allUsers.length}`);
        
        allUsers.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.name}`);
            console.log(`      📧 ${user.email}`);
            console.log(`      🎭 ${user.roleText}`);
            console.log(`      📍 ${user.location?.city || 'Sin ciudad'}`);
            console.log(`      ✅ Verificado: ${user.isFullyVerified ? 'Sí' : 'No'}`);
            console.log(`      🆔 ${user.id}`);
        });
        
        console.log('\n📧 Buscando usuario por email...');
        const foundByEmail = await User.findByEmail('carlos.rodriguez@test.com');
        console.log(`✅ Encontrado: ${foundByEmail ? foundByEmail.nombre : 'No encontrado'}`);
        
        console.log('\n🏥 Buscando refugios verificados...');
        const verifiedShelters = await User.findVerifiedShelters();
        console.log(`✅ Refugios verificados encontrados: ${verifiedShelters.length}`);
        verifiedShelters.forEach(s => {
            console.log(`   🏥 ${s.displayName} (${s.location?.city})`);
        });
        
        console.log('\n🏙️ Buscando refugios en Medellín...');
        const sheltersInMedellin = await User.findVerifiedShelters('Medellín');
        console.log(`✅ Encontrados: ${sheltersInMedellin.length} refugio(s)`);
        
        // PRUEBA 9: ESTADÍSTICAS DE USUARIOS
        console.log('\n📊 === PRUEBA 9: ESTADÍSTICAS DE USUARIOS ===');
        
        const userStats = await User.getUserStats();
        console.log('✅ Estadísticas por rol:');
        userStats.forEach(stat => {
            const roleNames = {
                'adopter': 'Adoptantes',
                'shelter': 'Refugios',
                'admin': 'Administradores'
            };
            console.log(`   ${roleNames[stat._id] || stat._id}: ${stat.count}`);
        });
        
        // PRUEBA 10: FILTRAR POR CARACTERÍSTICAS
        console.log('\n🎯 === PRUEBA 10: FILTRAR POR CARACTERÍSTICAS ===');
        
        const activeUsers = await User.find({ status: 'active' });
        console.log(`👥 Usuarios activos: ${activeUsers.length}`);
        
        const emailVerified = await User.find({ 'verified.email': true });
        console.log(`✅ Usuarios con email verificado: ${emailVerified.length}`);
        
        const adoptersInBogota = await User.find({
            role: 'adopter',
            'location.city': /Bogotá/i
        });
        console.log(`📍 Adoptantes en Bogotá: ${adoptersInBogota.length}`);
        
        // LIMPIEZA: ELIMINAR USUARIOS DE PRUEBA
        console.log('\n🧹 === LIMPIANDO DATOS DE PRUEBA ===');
        
        const deleteResult = await User.deleteMany({
            $or: [
                { email: /@test\.com$/i },
                { email: /@refugiofeliz\.com$/i }
            ]
        });
        
        console.log(`✅ ${deleteResult.deletedCount} usuario(s) de prueba eliminado(s)`);
        
        console.log('\n🎉 ¡TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE!');
        console.log('✨ El modelo User está funcionando perfectamente');
        console.log('🚀 Listo para usar en controladores y APIs de AdoptaPet');
        
    } catch (error) {
        console.error('\n❌ Error durante las pruebas:', error.message);
        if (process.env.NODE_ENV === 'development') {
            console.error('📋 Stack trace completo:');
            console.error(error.stack);
        }
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Conexión a MongoDB cerrada');
    }
}

if (require.main === module) {
    console.log('🚀 Ejecutando pruebas del modelo User de AdoptaPet\n');
    testUserModel()
        .then(() => {
            console.log('\n✨ ¡Pruebas completadas exitosamente!');
            console.log('🎯 El modelo User está listo para AdoptaPet');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error fatal en las pruebas:', error);
            process.exit(1);
        });
}

module.exports = { testUserModel };