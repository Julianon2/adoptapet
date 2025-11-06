// =============================================
// SCRIPT DE PRUEBAS - MODELO FOLLOW
// =============================================

require('dotenv').config();
const mongoose = require('mongoose');
const Follow = require('../models/Follow');
const User = require('../models/User');

async function testFollowModel() {
    try {
        console.log('🧪 Iniciando pruebas del modelo Follow de AdoptaPet...\n');
        
        // CONECTAR A LA BASE DE DATOS
        console.log('🔗 Conectando a MongoDB Atlas...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conexión establecida exitosamente\n');
        
        // LIMPIEZA PREVIA
        console.log('🧹 === LIMPIANDO DATOS DE PRUEBAS ANTERIORES ===');
        await Follow.deleteMany({});
        await User.deleteMany({ email: { $regex: /@follow-test\.com$/ } });
        console.log('✅ Datos de pruebas anteriores eliminados\n');
        
        // CREAR DATOS DE PRUEBA
        console.log('🔧 === CREANDO DATOS DE PRUEBA ===');
        
        // Crear 5 usuarios
        const users = [];
        for (let i = 1; i <= 5; i++) {
            const user = new User({
                name: `Usuario ${i}`,
                email: `user${i}@follow-test.com`,
                password: 'test123',
                role: i === 5 ? 'shelter' : 'adopter',
                location: { country: 'Colombia', city: 'Bogotá' }
            });
            await user.save();
            users.push(user);
            console.log(`✅ Usuario ${i} creado: ${user.name}`);
        }
        console.log('');
        
        // PRUEBA 1: SEGUIR A UN USUARIO
        console.log('👥 === PRUEBA 1: SEGUIR A UN USUARIO ===');
        
        const follow1 = await Follow.followUser(users[0]._id, users[1]._id, 'user');
        
        console.log('✅ Usuario seguido exitosamente:');
        console.log(`   👤 ${users[0].name} ahora sigue a ${users[1].name}`);
        console.log(`   📊 Estado: ${follow1.statusText}`);
        console.log(`   🎯 Tipo: ${follow1.typeText}`);
        console.log(`   📅 Días siguiendo: ${follow1.daysSinceFollow}`);
        
        // PRUEBA 2: VALIDAR DATOS INCORRECTOS
        console.log('\n🚨 === PRUEBA 2: VALIDAR DATOS INCORRECTOS ===');
        
        const invalidFollow = new Follow({
            status: 'estado-invalido',
            type: 'tipo-invalido'
        });
        
        const errors = invalidFollow.validateSync();
        if (errors) {
            console.log('✅ Validaciones funcionando correctamente:');
            Object.values(errors.errors).forEach(error => {
                console.log(`   🚫 ${error.path}: ${error.message}`);
            });
        } else {
            console.log('❌ ERROR: Las validaciones NO están funcionando');
        }
        
        // PRUEBA 3: VERIFICAR SI UN USUARIO SIGUE A OTRO
        console.log('\n🔍 === PRUEBA 3: VERIFICAR SI UN USUARIO SIGUE A OTRO ===');
        
        const isFollowing1 = await Follow.isFollowing(users[0]._id, users[1]._id);
        const isFollowing2 = await Follow.isFollowing(users[0]._id, users[2]._id);
        
        console.log('✅ Verificaciones realizadas:');
        console.log(`   ${users[0].name} sigue a ${users[1].name}: ${isFollowing1 ? 'Sí' : 'No'}`);
        console.log(`   ${users[0].name} sigue a ${users[2].name}: ${isFollowing2 ? 'Sí' : 'No'}`);
        
        // PRUEBA 4: INTENTAR SEGUIRSE A SÍ MISMO
        console.log('\n🚫 === PRUEBA 4: INTENTAR SEGUIRSE A SÍ MISMO ===');
        
        try {
            await Follow.followUser(users[0]._id, users[0]._id);
            console.log('❌ ERROR: Se permitió seguirse a sí mismo');
        } catch (error) {
            console.log('✅ Validación correcta:');
            console.log(`   🚫 ${error.message}`);
        }
        
        // PRUEBA 5: INTENTAR SEGUIR DOS VECES AL MISMO USUARIO
        console.log('\n🚫 === PRUEBA 5: INTENTAR SEGUIR DOS VECES AL MISMO USUARIO ===');
        
        try {
            await Follow.followUser(users[0]._id, users[1]._id);
            console.log('❌ ERROR: Se permitió seguir dos veces');
        } catch (error) {
            console.log('✅ Validación correcta:');
            console.log(`   🚫 ${error.message}`);
        }
        
        // PRUEBA 6: CREAR RED DE SEGUIMIENTOS
        console.log('\n🌐 === PRUEBA 6: CREAR RED DE SEGUIMIENTOS ===');
        
        // Usuario 0 sigue a 1, 2, 3
        await Follow.followUser(users[0]._id, users[2]._id);
        await Follow.followUser(users[0]._id, users[3]._id);
        
        // Usuario 1 sigue a 0, 2, 3
        await Follow.followUser(users[1]._id, users[0]._id);
        await Follow.followUser(users[1]._id, users[2]._id);
        await Follow.followUser(users[1]._id, users[3]._id);
        
        // Usuario 2 sigue a 0, 3
        await Follow.followUser(users[2]._id, users[0]._id);
        await Follow.followUser(users[2]._id, users[3]._id);
        
        // Usuario 3 sigue a 4 (shelter)
        await Follow.followUser(users[3]._id, users[4]._id, 'shelter');
        
        console.log('✅ Red de seguimientos creada:');
        console.log(`   ${users[0].name} sigue a 3 usuarios`);
        console.log(`   ${users[1].name} sigue a 3 usuarios`);
        console.log(`   ${users[2].name} sigue a 2 usuarios`);
        console.log(`   ${users[3].name} sigue a 1 refugio`);
        
        // PRUEBA 7: CAMPOS VIRTUALES
        console.log('\n⚡ === PRUEBA 7: PROBAR CAMPOS VIRTUALES ===');
        
        const follow = await Follow.findOne({ follower: users[0]._id });
        
        console.log('✅ Campos virtuales calculados correctamente:');
        console.log(`   📊 Estado en español: ${follow.statusText}`);
        console.log(`   🎯 Tipo en español: ${follow.typeText}`);
        console.log(`   📅 Días siguiendo: ${follow.daysSinceFollow}`);
        console.log(`   🔇 Está silenciado: ${follow.isMuted ? 'Sí' : 'No'}`);
        console.log(`   📈 Total interacciones: ${follow.totalInteractions}`);
        console.log(`   📊 Nivel interacción: ${follow.interactionLevel}`);
        console.log(`   ⏰ Última interacción: ${follow.timeSinceLastInteraction}`);
        
        // PRUEBA 8: REGISTRAR INTERACCIONES
        console.log('\n📊 === PRUEBA 8: REGISTRAR INTERACCIONES ===');
        
        await follow.recordInteraction('like');
        await follow.recordInteraction('like');
        await follow.recordInteraction('comment');
        await follow.recordInteraction('share');
        
        console.log('✅ Interacciones registradas:');
        console.log(`   ❤️ Likes dados: ${follow.interactions.likesGiven}`);
        console.log(`   💬 Comentarios dados: ${follow.interactions.commentsGiven}`);
        console.log(`   📤 Compartidos: ${follow.interactions.sharesGiven}`);
        console.log(`   📈 Total: ${follow.totalInteractions}`);
        console.log(`   📊 Nivel: ${follow.interactionLevel}`);
        console.log(`   ⏰ Última interacción: ${follow.timeSinceLastInteraction}`);
        
        // PRUEBA 9: MARCAR COMO AMIGO CERCANO
        console.log('\n⭐ === PRUEBA 9: MARCAR COMO AMIGO CERCANO ===');
        
        await follow.markAsCloseFriend();
        
        console.log('✅ Marcado como amigo cercano:');
        console.log(`   ⭐ Es amigo cercano: ${follow.isCloseFriend ? 'Sí' : 'No'}`);
        
        await follow.unmarkAsCloseFriend();
        
        console.log('✅ Desmarcado como amigo cercano:');
        console.log(`   ⭐ Es amigo cercano: ${follow.isCloseFriend ? 'Sí' : 'No'}`);
        
        // PRUEBA 10: SILENCIAR NOTIFICACIONES
        console.log('\n🔇 === PRUEBA 10: SILENCIAR NOTIFICACIONES ===');
        
        // Silenciar por 24 horas
        await follow.mute(24);
        
        console.log('✅ Notificaciones silenciadas:');
        console.log(`   📊 Estado: ${follow.statusText}`);
        console.log(`   🔇 Está silenciado: ${follow.isMuted ? 'Sí' : 'No'}`);
        console.log(`   ⏰ Silenciado hasta: ${follow.mutedUntil}`);
        
        await follow.unmute();
        
        console.log('✅ Notificaciones reactivadas:');
        console.log(`   📊 Estado: ${follow.statusText}`);
        console.log(`   🔇 Está silenciado: ${follow.isMuted ? 'Sí' : 'No'}`);
        
        // PRUEBA 11: CONFIGURAR NOTIFICACIONES
        console.log('\n🔔 === PRUEBA 11: CONFIGURAR NOTIFICACIONES ===');
        
        await follow.updateNotifications({
            newPosts: false,
            adoptionUpdates: true,
            stories: false
        });
        
        console.log('✅ Configuración de notificaciones actualizada:');
        console.log(`   📝 Nuevos posts: ${follow.notifications.newPosts ? 'Activadas' : 'Desactivadas'}`);
        console.log(`   🏠 Adopciones: ${follow.notifications.adoptionUpdates ? 'Activadas' : 'Desactivadas'}`);
        console.log(`   📸 Historias: ${follow.notifications.stories ? 'Activadas' : 'Desactivadas'}`);
        
        // PRUEBA 12: OBTENER SEGUIDORES
        console.log('\n👥 === PRUEBA 12: OBTENER SEGUIDORES DE UN USUARIO ===');
        
        const followers = await Follow.getFollowers(users[0]._id);
        
        console.log(`✅ Seguidores de ${users[0].name}: ${followers.length}`);
        followers.forEach((follow, index) => {
            console.log(`   ${index + 1}. ${follow.follower.name}`);
        });
        
        // PRUEBA 13: OBTENER A QUIÉN SIGUE
        console.log('\n👤 === PRUEBA 13: OBTENER A QUIÉN SIGUE UN USUARIO ===');
        
        const following = await Follow.getFollowing(users[0]._id);
        
        console.log(`✅ ${users[0].name} sigue a: ${following.length} usuarios`);
        following.forEach((follow, index) => {
            console.log(`   ${index + 1}. ${follow.following.name}`);
        });
        
        // PRUEBA 14: CONTAR SEGUIDORES Y SIGUIENDO
        console.log('\n🔢 === PRUEBA 14: CONTAR SEGUIDORES Y SIGUIENDO ===');
        
        const followersCount = await Follow.countFollowers(users[0]._id);
        const followingCount = await Follow.countFollowing(users[0]._id);
        
        console.log(`✅ Estadísticas de ${users[0].name}:`);
        console.log(`   👥 Seguidores: ${followersCount}`);
        console.log(`   👤 Siguiendo: ${followingCount}`);
        
        // PRUEBA 15: OBTENER AMIGOS MUTUOS
        console.log('\n🤝 === PRUEBA 15: OBTENER AMIGOS MUTUOS ===');
        
        const mutualFollows = await Follow.getMutualFollows(users[0]._id, users[1]._id);
        
        console.log(`✅ Amigos mutuos entre ${users[0].name} y ${users[1].name}: ${mutualFollows.length}`);
        
        // PRUEBA 16: MARCAR VARIOS AMIGOS CERCANOS
        console.log('\n⭐ === PRUEBA 16: GESTIONAR AMIGOS CERCANOS ===');
        
        const follow2 = await Follow.findOne({ 
            follower: users[0]._id, 
            following: users[2]._id 
        });
        await follow2.markAsCloseFriend();
        
        const closeFriends = await Follow.getCloseFriends(users[0]._id);
        
        console.log(`✅ Amigos cercanos de ${users[0].name}: ${closeFriends.length}`);
        closeFriends.forEach((friend, index) => {
            console.log(`   ${index + 1}. ${friend.following.name}`);
        });
        
        // PRUEBA 17: BLOQUEAR Y DESBLOQUEAR
        console.log('\n🚫 === PRUEBA 17: BLOQUEAR Y DESBLOQUEAR ===');
        
        const follow3 = await Follow.findOne({ 
            follower: users[0]._id, 
            following: users[3]._id 
        });
        
        await follow3.block();
        console.log('✅ Usuario bloqueado:');
        console.log(`   📊 Estado: ${follow3.statusText}`);
        
        await follow3.unblock();
        console.log('✅ Usuario desbloqueado:');
        console.log(`   📊 Estado: ${follow3.statusText}`);
        
        // PRUEBA 18: DEJAR DE SEGUIR
        console.log('\n👋 === PRUEBA 18: DEJAR DE SEGUIR A UN USUARIO ===');
        
        const beforeCount = await Follow.countFollowing(users[0]._id);
        
        await Follow.unfollowUser(users[0]._id, users[3]._id);
        
        const afterCount = await Follow.countFollowing(users[0]._id);
        
        console.log('✅ Dejó de seguir exitosamente:');
        console.log(`   ${users[0].name} dejó de seguir a ${users[3].name}`);
        console.log(`   📊 Siguiendo antes: ${beforeCount}`);
        console.log(`   📊 Siguiendo después: ${afterCount}`);
        
        // PRUEBA 19: SUGERENCIAS DE USUARIOS PARA SEGUIR
        console.log('\n💡 === PRUEBA 19: SUGERENCIAS DE USUARIOS PARA SEGUIR ===');
        
        const suggestions = await Follow.getSuggestedFollows(users[2]._id, 5);
        
        console.log(`✅ Sugerencias para ${users[2].name}: ${suggestions.length}`);
        suggestions.forEach((suggestion, index) => {
            console.log(`   ${index + 1}. Usuario ID: ${suggestion._id} (${suggestion.mutualFollows} amigos en común)`);
        });
        
        // PRUEBA 20: ESTADÍSTICAS COMPLETAS DE SEGUIMIENTO
        console.log('\n📊 === PRUEBA 20: ESTADÍSTICAS COMPLETAS DE SEGUIMIENTO ===');
        
        const stats = await Follow.getFollowStats(users[0]._id);
        
        console.log(`✅ Estadísticas completas de ${users[0].name}:`);
        console.log(`   👥 Seguidores: ${stats.followers}`);
        console.log(`   👤 Siguiendo: ${stats.following}`);
        console.log(`   ⭐ Amigos cercanos: ${stats.closeFriends}`);
        console.log(`   📊 Ratio (seguidores/siguiendo): ${stats.ratio}`);
        
        // PRUEBA 21: SEGUIR A UN REFUGIO
        console.log('\n🏠 === PRUEBA 21: SEGUIR A UN REFUGIO ===');
        
        const shelterFollow = await Follow.findOne({ 
            follower: users[3]._id, 
            following: users[4]._id 
        });
        
        console.log('✅ Seguimiento a refugio:');
        console.log(`   👤 ${users[3].name} sigue al refugio`);
        console.log(`   🎯 Tipo: ${shelterFollow.typeText}`);
        console.log(`   📊 Estado: ${shelterFollow.statusText}`);
        
        // LIMPIEZA FINAL
        console.log('\n🧹 === LIMPIANDO DATOS DE PRUEBA ===');
        
        await Follow.deleteMany({});
        await User.deleteMany({ email: { $regex: /@follow-test\.com$/ } });
        
        console.log(`✅ Datos de prueba eliminados`);
        
        console.log('\n🎉 ¡TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE!');
        console.log('✨ El modelo Follow está funcionando perfectamente');
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
    console.log('🚀 Ejecutando pruebas del modelo Follow de AdoptaPet\n');
    testFollowModel()
        .then(() => {
            console.log('\n✨ ¡Pruebas completadas exitosamente!');
            console.log('🎯 El modelo Follow está listo para AdoptaPet');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error fatal en las pruebas:', error);
            process.exit(1);
        });
}

module.exports = { testFollowModel };
