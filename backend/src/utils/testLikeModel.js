// =============================================
// SCRIPT DE PRUEBAS - MODELO LIKE
// =============================================

require('dotenv').config();
const mongoose = require('mongoose');
const Like = require('../models/Like');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

async function testLikeModel() {
    try {
        console.log('🧪 Iniciando pruebas del modelo Like de AdoptaPet...\n');
        
        // CONECTAR A LA BASE DE DATOS
        console.log('🔗 Conectando a MongoDB Atlas...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conexión establecida exitosamente\n');
        
        // LIMPIEZA PREVIA
        console.log('🧹 === LIMPIANDO DATOS DE PRUEBAS ANTERIORES ===');
        await Like.deleteMany({});
        await Comment.deleteMany({ content: { $regex: /like test/i } });
        await Post.deleteMany({ content: { $regex: /Like Test/i } });
        await User.deleteMany({ email: { $regex: /@like-test\.com$/ } });
        console.log('✅ Datos de pruebas anteriores eliminados\n');
        
        // CREAR DATOS DE PRUEBA
        console.log('🔧 === CREANDO DATOS DE PRUEBA ===');
        
        // Crear 3 usuarios
        const users = [];
        for (let i = 1; i <= 3; i++) {
            const user = new User({
                name: `Usuario ${i}`,
                email: `user${i}@like-test.com`,
                password: 'test123',
                role: 'adopter',
                location: { country: 'Colombia', city: 'Bogotá' }
            });
            await user.save();
            users.push(user);
            console.log(`✅ Usuario ${i} creado: ${user.name}`);
        }
        
        // Crear posts
        const post1 = new Post({
            author: users[0]._id,
            content: 'Like Test: ¡Adopté a un perrito hermoso! 🐕',
            type: 'adoption-story'
        });
        await post1.save();
        console.log(`✅ Post 1 creado`);
        
        const post2 = new Post({
            author: users[1]._id,
            content: 'Like Test: Consejos para entrenar cachorros',
            type: 'update'
        });
        await post2.save();
        console.log(`✅ Post 2 creado`);
        
        // Crear comentario
        const comment1 = new Comment({
            post: post1._id,
            author: users[1]._id,
            content: 'like test: Qué hermoso! Felicidades por tu nueva mascota'
        });
        await comment1.save();
        console.log(`✅ Comentario creado\n`);
        
        // PRUEBA 1: DAR LIKE A UN POST
        console.log('❤️ === PRUEBA 1: DAR LIKE A UN POST ===');
        
        const like1 = await Like.addLike(
            users[1]._id,
            'Post',
            post1._id,
            'like',
            users[0]._id
        );
        
        console.log('✅ Like agregado al post:');
        console.log(`   👤 Usuario: ${users[1].name}`);
        console.log(`   ${like1.reactionEmoji} Reacción: ${like1.reactionText}`);
        console.log(`   📝 Contenido: ${like1.targetTypeText}`);
        console.log(`   📊 Estado: ${like1.statusText}`);
        console.log(`   ⏰ Tiempo: ${like1.timeAgo}`);
        
        // PRUEBA 2: VALIDAR DATOS INCORRECTOS
        console.log('\n🚨 === PRUEBA 2: VALIDAR DATOS INCORRECTOS ===');
        
        const invalidLike = new Like({
            targetType: 'TipoInvalido',
            reactionType: 'reaccion-invalida',
            status: 'estado-invalido'
        });
        
        const errors = invalidLike.validateSync();
        if (errors) {
            console.log('✅ Validaciones funcionando correctamente:');
            Object.values(errors.errors).forEach(error => {
                console.log(`   🚫 ${error.path}: ${error.message}`);
            });
        } else {
            console.log('❌ ERROR: Las validaciones NO están funcionando');
        }
        
        // PRUEBA 3: INTENTAR DAR LIKE DOS VECES
        console.log('\n🚫 === PRUEBA 3: INTENTAR DAR LIKE DOS VECES ===');
        
        try {
            await Like.addLike(users[1]._id, 'Post', post1._id);
            console.log('❌ ERROR: Se permitió dar like dos veces');
        } catch (error) {
            console.log('✅ Validación correcta:');
            console.log(`   🚫 ${error.message}`);
        }
        
        // PRUEBA 4: DAR DIFERENTES TIPOS DE REACCIONES
        console.log('\n❤️💙💛 === PRUEBA 4: DIFERENTES TIPOS DE REACCIONES ===');
        
        const reactions = [
            { user: users[2]._id, type: 'love', name: users[2].nombre },
            { user: users[0]._id, type: 'wow', name: users[0].nombre }
        ];
        
        for (const reaction of reactions) {
            const like = await Like.addLike(
                reaction.user,
                'Post',
                post1._id,
                reaction.type,
                users[0]._id
            );
            console.log(`✅ ${reaction.name} reaccionó: ${like.reactionEmoji} ${like.reactionText}`);
        }
        
        // PRUEBA 5: CAMBIAR TIPO DE REACCIÓN
        console.log('\n🔄 === PRUEBA 5: CAMBIAR TIPO DE REACCIÓN ===');
        
        const originalReaction = like1.reactionType;
        await like1.changeReaction('love');
        
        console.log('✅ Reacción cambiada:');
        console.log(`   Antes: ${originalReaction}`);
        console.log(`   ${like1.reactionEmoji} Ahora: ${like1.reactionText}`);
        
        // PRUEBA 6: DAR LIKE A UN COMENTARIO
        console.log('\n💬❤️ === PRUEBA 6: DAR LIKE A UN COMENTARIO ===');
        
        const commentLike = await Like.addLike(
            users[0]._id,
            'Comment',
            comment1._id,
            'like',
            users[1]._id
        );
        
        console.log('✅ Like agregado al comentario:');
        console.log(`   👤 Usuario: ${users[0].name}`);
        console.log(`   ${commentLike.reactionEmoji} Reacción: ${commentLike.reactionText}`);
        console.log(`   📝 Tipo: ${commentLike.targetTypeText}`);
        
        // PRUEBA 7: VERIFICAR SI UN USUARIO DIO LIKE
        console.log('\n🔍 === PRUEBA 7: VERIFICAR SI UN USUARIO DIO LIKE ===');
        
        const hasLiked1 = await Like.hasLiked(users[1]._id, 'Post', post1._id);
        const hasLiked2 = await Like.hasLiked(users[1]._id, 'Post', post2._id);
        
        console.log('✅ Verificaciones realizadas:');
        console.log(`   ${users[1].name} dio like al post 1: ${hasLiked1 ? 'Sí' : 'No'}`);
        console.log(`   ${users[1].name} dio like al post 2: ${hasLiked2 ? 'Sí' : 'No'}`);
        
        // PRUEBA 8: OBTENER TIPO DE REACCIÓN DE UN USUARIO
        console.log('\n🎯 === PRUEBA 8: OBTENER TIPO DE REACCIÓN ===');
        
        const userReaction = await Like.getUserReaction(users[1]._id, 'Post', post1._id);
        
        console.log('✅ Tipo de reacción obtenido:');
        console.log(`   ${users[1].name} reaccionó con: ${userReaction}`);
        
        // PRUEBA 9: CAMPOS VIRTUALES
        console.log('\n⚡ === PRUEBA 9: PROBAR CAMPOS VIRTUALES ===');
        
        console.log('✅ Campos virtuales calculados correctamente:');
        console.log(`   ${like1.reactionEmoji} Reacción: ${like1.reactionText}`);
        console.log(`   📊 Estado: ${like1.statusText}`);
        console.log(`   📝 Tipo contenido: ${like1.targetTypeText}`);
        console.log(`   ⏰ Tiempo: ${like1.timeAgo}`);
        
        // PRUEBA 10: OBTENER LIKES DE UN CONTENIDO
        console.log('\n📋 === PRUEBA 10: OBTENER LIKES DE UN CONTENIDO ===');
        
        const postLikes = await Like.getLikesByContent('Post', post1._id);
        
        console.log(`✅ Likes del post 1: ${postLikes.length}`);
        postLikes.forEach((like, index) => {
            const reactionMap = {
                'like': '👍',
                'love': '❤️',
                'wow': '😮'
            };
            console.log(`   ${index + 1}. ${like.user.name} ${reactionMap[like.reactionType]} ${like.reactionType}`);
        });
        
        // PRUEBA 11: OBTENER LIKES DE UN USUARIO
        console.log('\n👤 === PRUEBA 11: OBTENER LIKES DE UN USUARIO ===');
        
        const userLikes = await Like.getLikesByUser(users[0]._id);
        
        console.log(`✅ Contenido que le gustó a ${users[0].name}: ${userLikes.length}`);
        userLikes.forEach((like, index) => {
            console.log(`   ${index + 1}. ${like.targetType} - ${like.reactionType}`);
        });
        
        // PRUEBA 12: CONTAR LIKES DE UN CONTENIDO
        console.log('\n🔢 === PRUEBA 12: CONTAR LIKES DE UN CONTENIDO ===');
        
        const totalLikes = await Like.countLikes('Post', post1._id);
        const loveLikes = await Like.countLikes('Post', post1._id, 'love');
        
        console.log(`✅ Estadísticas del post 1:`);
        console.log(`   ❤️ Total de likes: ${totalLikes}`);
        console.log(`   💙 Solo "love": ${loveLikes}`);
        
        // PRUEBA 13: OBTENER ESTADÍSTICAS DE REACCIONES
        console.log('\n📊 === PRUEBA 13: ESTADÍSTICAS DE REACCIONES ===');
        
        const stats = await Like.getReactionStats('Post', post1._id);
        
        console.log(`✅ Estadísticas de reacciones del post 1:`);
        console.log(`   📊 Total: ${stats.total}`);
        console.log(`   📈 Desglose:`);
        Object.entries(stats.breakdown).forEach(([type, count]) => {
            const emojiMap = {
                'like': '👍',
                'love': '❤️',
                'wow': '😮',
                'care': '🤗',
                'sad': '😢',
                'angry': '😠'
            };
            console.log(`      ${emojiMap[type]} ${type}: ${count}`);
        });
        
        // PRUEBA 14: REMOVER LIKE
        console.log('\n🗑️ === PRUEBA 14: REMOVER LIKE ===');
        
        const beforeCount = await Like.countLikes('Post', post1._id);
        
        await Like.removeLike(users[2]._id, 'Post', post1._id);
        
        const afterCount = await Like.countLikes('Post', post1._id);
        
        console.log('✅ Like removido:');
        console.log(`   Antes: ${beforeCount} likes`);
        console.log(`   Después: ${afterCount} likes`);
        
        // PRUEBA 15: REACTIVAR LIKE REMOVIDO
        console.log('\n♻️ === PRUEBA 15: REACTIVAR LIKE REMOVIDO ===');
        
        const removedLike = await Like.findOne({
            user: users[2]._id,
            targetType: 'Post',
            targetId: post1._id,
            status: 'removed'
        });
        
        if (removedLike) {
            await removedLike.reactivate();
            console.log('✅ Like reactivado:');
            console.log(`   📊 Estado: ${removedLike.statusText}`);
            console.log(`   ⏰ Nuevo timestamp: ${removedLike.likedAt}`);
        }
        
        // PRUEBA 16: AGREGAR MÁS LIKES AL POST 2
        console.log('\n📈 === PRUEBA 16: AGREGAR LIKES AL POST 2 ===');
        
        await Like.addLike(users[0]._id, 'Post', post2._id, 'like', users[1]._id);
        await Like.addLike(users[2]._id, 'Post', post2._id, 'care', users[1]._id);
        
        console.log('✅ Likes agregados al post 2');
        
        // PRUEBA 17: OBTENER CONTENIDO MÁS LIKEADO
        console.log('\n🏆 === PRUEBA 17: OBTENER CONTENIDO MÁS LIKEADO ===');
        
        const mostLikedPosts = await Like.aggregate([
            { $match: { targetType: 'Post', status: 'active' } },
            { $group: { _id: '$targetId', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);
        
        console.log('✅ Posts más likeados:');
        for (const item of mostLikedPosts) {
            const post = await Post.findById(item._id).populate('author', 'name');
            console.log(`   🏅 ${post.content.substring(0, 50)}... - ${item.count} likes`);
        }
        
        // PRUEBA 18: OBTENER USUARIOS MÁS ACTIVOS (MÁS LIKES DADOS)
        console.log('\n🌟 === PRUEBA 18: USUARIOS MÁS ACTIVOS ===');
        
        const mostActiveLikers = await Like.aggregate([
            { $match: { status: 'active' } },
            { $group: { _id: '$user', totalLikes: { $sum: 1 } } },
            { $sort: { totalLikes: -1 } },
            { $limit: 5 }
        ]);
        
        console.log('✅ Usuarios que más likes han dado:');
        for (const item of mostActiveLikers) {
            const user = await User.findById(item._id);
            console.log(`   👤 ${user.name}: ${item.totalLikes} likes dados`);
        }
        
        // PRUEBA 19: OBTENER LIKES RECIENTES DE UN USUARIO
        console.log('\n⏰ === PRUEBA 19: LIKES RECIENTES DE UN USUARIO ===');
        
        const recentLikes = await Like.find({ user: users[0]._id, status: 'active' })
            .sort({ likedAt: -1 })
            .limit(5)
            .populate('targetId');
        
        console.log(`✅ Últimos likes de ${users[0].name}:`);
        recentLikes.forEach((like, index) => {
            console.log(`   ${index + 1}. ${like.reactionEmoji} ${like.targetType} - ${like.timeAgo}`);
        });
        
        // PRUEBA 20: VERIFICAR ÍNDICES
        console.log('\n🔍 === PRUEBA 20: VERIFICAR ÍNDICES ===');
        
        const indexes = await Like.collection.getindexes();
        
        console.log('✅ Índices creados en la colección Like:');
        Object.keys(indexes).forEach((indexName) => {
            console.log(`   📌 ${indexName}`);
        });
        
        // PRUEBA 21: RENDIMIENTO - MÚLTIPLES LIKES
        console.log('\n⚡ === PRUEBA 21: PRUEBA DE RENDIMIENTO ===');
        
        const startTime = Date.now();
        
        // Simular 10 likes rápidos
        const promises = [];
        for (let i = 0; i < 10; i++) {
            promises.push(
                Like.hasLiked(users[0]._id, 'Post', post1._id)
            );
        }
        
        await Promise.all(promises);
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log('✅ Prueba de rendimiento completada:');
        console.log(`   ⏱️ 10 consultas ejecutadas en: ${duration}ms`);
        console.log(`   🚀 Promedio por consulta: ${(duration / 10).toFixed(2)}ms`);
        
        // PRUEBA 22: LIMPIEZA DE LIKES ANTIGUOS
        console.log('\n🧹 === PRUEBA 22: LIMPIEZA DE LIKES ANTIGUOS ===');
        
        // Crear un like antiguo (simulado con fecha pasada)
        const oldLike = new Like({
            user: users[1]._id,
            targetType: 'Post',
            targetId: post2._id,
            reactionType: 'like',
            status: 'removed'
        });
        oldLike.removedAt = new Date('2023-01-01');
        await oldLike.save({ validateBeforeSave: false });
        
        // Contar likes removidos hace más de 30 días
        const oldDate = new Date();
        oldDate.setDate(oldDate.getDate() - 30);
        
        const oldLikesCount = await Like.countDocuments({
            status: 'removed',
            removedAt: { $lt: oldDate }
        });
        
        console.log('✅ Limpieza de datos antiguos:');
        console.log(`   🗑️ Likes removidos hace más de 30 días: ${oldLikesCount}`);
        
        // RESUMEN FINAL
        console.log('\n' + '='.repeat(60));
        console.log('📊 === RESUMEN DE PRUEBAS ===');
        console.log('='.repeat(60));
        
        const totalLikesInDb = await Like.countDocuments();
        const activeLikes = await Like.countDocuments({ status: 'active' });
        const removedLikes = await Like.countDocuments({ status: 'removed' });
        const totalPostLikes = await Like.countDocuments({ targetType: 'Post' });
        const totalCommentLikes = await Like.countDocuments({ targetType: 'Comment' });
        
        console.log('\n📈 Estadísticas Generales:');
        console.log(`   💾 Total de likes en BD: ${totalLikesInDb}`);
        console.log(`   ✅ Likes activos: ${activeLikes}`);
        console.log(`   🗑️ Likes removidos: ${removedLikes}`);
        console.log(`   📝 Likes en posts: ${totalPostLikes}`);
        console.log(`   💬 Likes en comentarios: ${totalCommentLikes}`);
        
        console.log('\n✅ Funcionalidades probadas:');
        console.log('   ✓ Crear likes');
        console.log('   ✓ Validaciones de datos');
        console.log('   ✓ Prevenir likes duplicados');
        console.log('   ✓ Diferentes tipos de reacciones');
        console.log('   ✓ Cambiar tipo de reacción');
        console.log('   ✓ Likes en posts y comentarios');
        console.log('   ✓ Verificar si usuario dio like');
        console.log('   ✓ Obtener tipo de reacción');
        console.log('   ✓ Campos virtuales');
        console.log('   ✓ Obtener likes por contenido');
        console.log('   ✓ Obtener likes por usuario');
        console.log('   ✓ Contar likes');
        console.log('   ✓ Estadísticas de reacciones');
        console.log('   ✓ Remover likes');
        console.log('   ✓ Reactivar likes');
        console.log('   ✓ Contenido más likeado');
        console.log('   ✓ Usuarios más activos');
        console.log('   ✓ Likes recientes');
        console.log('   ✓ Verificar índices');
        console.log('   ✓ Pruebas de rendimiento');
        console.log('   ✓ Limpieza de datos antiguos');
        
        console.log('\n🎉 ¡TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE!');
        console.log('='.repeat(60) + '\n');
        
    } catch (error) {
        console.error('\n❌ Error durante las pruebas:', error);
        console.error('Stack trace:', error.stack);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Desconectado de MongoDB Atlas');
    }
}

// EJECUTAR LAS PRUEBAS
testLikeModel();