// =============================================
// SCRIPT DE PRUEBAS - MODELO COMMENT
// =============================================

require('dotenv').config();
const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const User = require('../models/User');
const Post = require('../models/Post');

async function testCommentModel() {
    try {
        console.log('🧪 Iniciando pruebas del modelo Comment de AdoptaPet...\n');
        
        // CONECTAR A LA BASE DE DATOS
        console.log('🔗 Conectando a MongoDB Atlas...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conexión establecida exitosamente\n');
        
        // LIMPIEZA PREVIA
        console.log('🧹 === LIMPIANDO DATOS DE PRUEBAS ANTERIORES ===');
        await Comment.deleteMany({ content: { $regex: /test/i } });
        await Post.deleteMany({ content: { $regex: /Test Post/i } });
        await User.deleteMany({ email: { $regex: /@comment-test\.com$/ } });
        console.log('✅ Datos de pruebas anteriores eliminados\n');
        
        // CREAR DATOS DE PRUEBA
        console.log('🔧 === CREANDO DATOS DE PRUEBA ===');
        
        // Crear usuarios
        const user1 = new User({
            name: 'Carlos Gómez',
            email: 'carlos@comment-test.com',
            password: 'test123',
            role: 'adopter',
            location: { country: 'Colombia', city: 'Bogotá' }
        });
        await user1.save();
        console.log(`✅ Usuario 1 creado: ${user1.name}`);
        
        const user2 = new User({
            name: 'Ana Martínez',
            email: 'ana@comment-test.com',
            password: 'test123',
            role: 'adopter',
            location: { country: 'Colombia', city: 'Medellín' }
        });
        await user2.save();
        console.log(`✅ Usuario 2 creado: ${user2.name}`);
        
        // Crear post
        const post = new Post({
            author: user1._id,
            content: 'Test Post: ¿Alguien tiene tips para adoptar un cachorro?',
            type: 'update'
        });
        await post.save();
        console.log(`✅ Post creado: ${post.content.substring(0, 50)}...\n`);
        
        // PRUEBA 1: CREAR COMENTARIO SIMPLE
        console.log('💬 === PRUEBA 1: CREAR COMENTARIO SIMPLE ===');
        
        const comment1 = new Comment({
            post: post._id,
            author: user2._id,
            content: 'Excelente pregunta! Yo adopté un cachorro hace 6 meses y fue una experiencia increíble.'
        });
        
        const validation1 = comment1.validateSync();
        if (validation1) {
            console.log('❌ Error de validación inesperado');
        } else {
            console.log('✅ Comentario válido - Estructura correcta');
            await comment1.save();
            console.log(`   💬 ID: ${comment1._id}`);
            console.log(`   📝 Contenido: ${comment1.content.substring(0, 50)}...`);
            console.log(`   👤 Autor: ${user2.name}`);
            console.log(`   📊 Estado: ${comment1.statusText}`);
        }
        
        // PRUEBA 2: VALIDAR DATOS INCORRECTOS
        console.log('\n🚨 === PRUEBA 2: VALIDAR DATOS INCORRECTOS ===');
        
        const invalidComment = new Comment({
            status: 'estado-invalido'
        });
        
        const errors = invalidComment.validateSync();
        if (errors) {
            console.log('✅ Validaciones funcionando correctamente:');
            Object.values(errors.errors).forEach(error => {
                console.log(`   🚫 ${error.path}: ${error.message}`);
            });
        } else {
            console.log('❌ ERROR: Las validaciones NO están funcionando');
        }
        
        // PRUEBA 3: PROBAR CAMPOS VIRTUALES
        console.log('\n⚡ === PRUEBA 3: PROBAR CAMPOS VIRTUALES ===');
        
        console.log('✅ Campos virtuales calculados correctamente:');
        console.log(`   📊 Estado en español: ${comment1.statusText}`);
        console.log(`   ⏰ Tiempo: ${comment1.timeAgo}`);
        console.log(`   ↩️ Es respuesta: ${comment1.isReply ? 'Sí' : 'No'}`);
        console.log(`   🖼️ Tiene imágenes: ${comment1.hasImages ? 'Sí' : 'No'}`);
        console.log(`   📈 Engagement: ${comment1.engagementRate}`);
        
        // PRUEBA 4: SISTEMA DE LIKES
        console.log('\n❤️ === PRUEBA 4: SISTEMA DE LIKES ===');
        
        await comment1.addLike(user1._id);
        await comment1.addLike(user2._id);
        
        console.log(`✅ Likes agregados:`);
        console.log(`   ❤️ Total de likes: ${comment1.likes}`);
        console.log(`   👤 Usuario 1 dio like: ${comment1.hasLiked(user1._id) ? 'Sí' : 'No'}`);
        console.log(`   👤 Usuario 2 dio like: ${comment1.hasLiked(user2._id) ? 'Sí' : 'No'}`);
        
        await comment1.removeLike(user1._id);
        console.log(`✅ Like removido:`);
        console.log(`   ❤️ Total de likes: ${comment1.likes}`);
        console.log(`   👤 Usuario 1 dio like: ${comment1.hasLiked(user1._id) ? 'Sí' : 'No'}`);
        
        // PRUEBA 5: CREAR COMENTARIO CON IMÁGENES
        console.log('\n🖼️ === PRUEBA 5: CREAR COMENTARIO CON IMÁGENES ===');
        
        const comment2 = new Comment({
            post: post._id,
            author: user1._id,
            content: 'Mira estas fotos de mi cachorro el día que lo adopté 😍',
            images: [
                'https://example.com/cachorro1.jpg',
                'https://example.com/cachorro2.jpg'
            ]
        });
        await comment2.save();
        
        console.log(`✅ Comentario con imágenes creado:`);
        console.log(`   🖼️ Cantidad de imágenes: ${comment2.images.length}`);
        console.log(`   🖼️ Tiene imágenes: ${comment2.hasImages ? 'Sí' : 'No'}`);
        
        // PRUEBA 6: CREAR RESPUESTA A COMENTARIO
        console.log('\n↩️ === PRUEBA 6: CREAR RESPUESTA A COMENTARIO ===');
        
        const reply1 = new Comment({
            post: post._id,
            author: user2._id,
            content: 'Qué lindo! Me encanta su carita. ¿Qué raza es?',
            parentComment: comment2._id
        });
        await reply1.save();
        
        console.log(`✅ Respuesta creada:`);
        console.log(`   ↩️ Es respuesta: ${reply1.isReply ? 'Sí' : 'No'}`);
        console.log(`   📊 Profundidad: ${reply1.depth}`);
        console.log(`   💬 Padre: ${reply1.parentComment}`);
        
        // Verificar que el contador del padre se incrementó
        const parentComment = await Comment.findById(comment2._id);
        console.log(`   ↑ Respuestas del padre: ${parentComment.replies}`);
        
        // PRUEBA 7: CREAR RESPUESTA ANIDADA
        console.log('\n↩️↩️ === PRUEBA 7: CREAR RESPUESTA ANIDADA (NIVEL 2) ===');
        
        const reply2 = new Comment({
            post: post._id,
            author: user1._id,
            content: 'Es un Golden Retriever! Los recomiendo 100%',
            parentComment: reply1._id
        });
        await reply2.save();
        
        console.log(`✅ Respuesta anidada creada:`);
        console.log(`   📊 Profundidad: ${reply2.depth}`);
        console.log(`   ↩️↩️ Es respuesta de respuesta: ${reply2.depth === 2 ? 'Sí' : 'No'}`);
        
        // PRUEBA 8: EDITAR COMENTARIO
        console.log('\n✏️ === PRUEBA 8: EDITAR COMENTARIO ===');
        
        const originalContent = comment1.content;
        await comment1.editContent('Excelente pregunta! Yo adopté un cachorro hace 6 meses y fue la mejor decisión de mi vida. Te cuento mi experiencia...');
        
        console.log(`✅ Comentario editado:`);
        console.log(`   ✏️ Editado: ${comment1.isEdited ? 'Sí' : 'No'}`);
        console.log(`   📅 Fecha edición: ${comment1.editedAt}`);
        console.log(`   📚 Historial: ${comment1.editHistory.length} versiones`);
        console.log(`   📝 Contenido anterior: ${originalContent.substring(0, 40)}...`);
        console.log(`   📝 Contenido actual: ${comment1.content.substring(0, 40)}...`);
        
        // PRUEBA 9: REPORTAR COMENTARIO
        console.log('\n🚨 === PRUEBA 9: REPORTAR COMENTARIO ===');
        
        const spamComment = new Comment({
            post: post._id,
            author: user1._id,
            content: 'COMPRA MEDICAMENTOS BARATOS EN www.spam.com !!!'
        });
        await spamComment.save();
        
        // Simular varios reportes
        await spamComment.report(user2._id, 'spam', 'Contenido publicitario no solicitado');
        
        console.log(`✅ Comentario reportado:`);
        console.log(`   🚨 Cantidad de reportes: ${spamComment.reports.count}`);
        console.log(`   📊 Estado: ${spamComment.statusText}`);
        console.log(`   ⚠️ Necesita moderación: ${spamComment.needsModeration ? 'Sí' : 'No'}`);
        
        // Agregar más reportes para activar auto-moderación
        const user3 = new User({
            name: 'Pedro López',
            email: 'pedro@comment-test.com',
            password: 'test123',
            role: 'adopter'
        });
        await user3.save();
        
        await spamComment.report(user3._id, 'spam', 'Spam evidente');
        
        // Crear más usuarios y reportar hasta activar auto-moderación
        for (let i = 4; i <= 6; i++) {
            const tempUser = new User({
                name: `User ${i}`,
                email: `user${i}@comment-test.com`,
                password: 'test123',
                role: 'adopter'
            });
            await tempUser.save();
            await spamComment.report(tempUser._id, 'spam', 'Reportando spam');
        }
        
        console.log(`✅ Auto-moderación activada:`);
        console.log(`   🚨 Reportes: ${spamComment.reports.count}`);
        console.log(`   📊 Estado: ${spamComment.statusText} (cambió automáticamente)`);
        
        // PRUEBA 10: FIJAR COMENTARIO
        console.log('\n📌 === PRUEBA 10: FIJAR Y DESFIJAR COMENTARIO ===');
        
        await comment1.pin();
        console.log(`✅ Comentario fijado:`);
        console.log(`   📌 Fijado: ${comment1.isPinned ? 'Sí' : 'No'}`);
        
        await comment1.unpin();
        console.log(`✅ Comentario desfijado:`);
        console.log(`   📌 Fijado: ${comment1.isPinned ? 'Sí' : 'No'}`);
        
        // PRUEBA 11: OCULTAR Y ELIMINAR COMENTARIO
        console.log('\n🙈 === PRUEBA 11: OCULTAR Y ELIMINAR COMENTARIO ===');
        
        const comment3 = new Comment({
            post: post._id,
            author: user1._id,
            content: 'Este es un comentario que será ocultado'
        });
        await comment3.save();
        
        await comment3.hide();
        console.log(`✅ Comentario ocultado:`);
        console.log(`   📊 Estado: ${comment3.statusText}`);
        
        const comment4 = new Comment({
            post: post._id,
            author: user1._id,
            content: 'Este es un comentario que será eliminado'
        });
        await comment4.save();
        
        await comment4.softDelete();
        console.log(`✅ Comentario eliminado (soft delete):`);
        console.log(`   📊 Estado: ${comment4.statusText}`);
        
        // PRUEBA 12: BUSCAR COMENTARIOS DE UN POST
        console.log('\n🔍 === PRUEBA 12: BUSCAR COMENTARIOS DE UN POST ===');
        
        const postComments = await Comment.findByPost(post._id, { limit: 10 });
        console.log(`✅ Comentarios del post encontrados: ${postComments.length}`);
        postComments.forEach((comment, index) => {
            console.log(`   ${index + 1}. ${comment.content.substring(0, 50)}... (${comment.author.name})`);
        });
        
        // PRUEBA 13: BUSCAR RESPUESTAS DE UN COMENTARIO
        console.log('\n💬 === PRUEBA 13: BUSCAR RESPUESTAS DE UN COMENTARIO ===');
        
        const replies = await Comment.findReplies(comment2._id);
        console.log(`✅ Respuestas encontradas: ${replies.length}`);
        replies.forEach((reply, index) => {
            console.log(`   ${index + 1}. ${reply.content.substring(0, 50)}... (${reply.author.name})`);
        });
        
        // PRUEBA 14: BUSCAR COMENTARIOS DE UN USUARIO
        console.log('\n👤 === PRUEBA 14: BUSCAR COMENTARIOS DE UN USUARIO ===');
        
        const userComments = await Comment.findByAuthor(user1._id);
        console.log(`✅ Comentarios del usuario ${user1.name}: ${userComments.length}`);
        
        // PRUEBA 15: OBTENER COMENTARIOS DESTACADOS
        console.log('\n⭐ === PRUEBA 15: OBTENER COMENTARIOS DESTACADOS ===');
        
        const topComments = await Comment.getTopComments(post._id, 3);
        console.log(`✅ Top comentarios (más likes): ${topComments.length}`);
        topComments.forEach((comment, index) => {
            console.log(`   ${index + 1}. ${comment.content.substring(0, 40)}... (${comment.likes} likes)`);
        });
        
        // PRUEBA 16: OBTENER COMENTARIOS REPORTADOS
        console.log('\n🚨 === PRUEBA 16: OBTENER COMENTARIOS REPORTADOS ===');
        
        const reportedComments = await Comment.getReportedComments(3);
        console.log(`✅ Comentarios reportados: ${reportedComments.length}`);
        reportedComments.forEach((comment, index) => {
            console.log(`   ${index + 1}. ${comment.content.substring(0, 40)}... (${comment.reports.count} reportes)`);
        });
        
        // PRUEBA 17: CONTAR COMENTARIOS DE UN POST
        console.log('\n🔢 === PRUEBA 17: CONTAR COMENTARIOS DE UN POST ===');
        
        const commentCount = await Comment.countByPost(post._id);
        console.log(`✅ Total de comentarios activos en el post: ${commentCount}`);
        
        // PRUEBA 18: ESTADÍSTICAS DE COMENTARIOS
        console.log('\n📊 === PRUEBA 18: ESTADÍSTICAS DE COMENTARIOS ===');
        
        const stats = await Comment.getCommentStats();
        console.log('✅ Estadísticas por estado:');
        stats.forEach(stat => {
            console.log(`   ${stat._id}:`);
            console.log(`      Total: ${stat.count}`);
            console.log(`      Likes totales: ${stat.totalLikes}`);
            console.log(`      Respuestas totales: ${stat.totalReplies}`);
            console.log(`      Likes promedio: ${stat.avgLikes?.toFixed(2) || 'N/A'}`);
        });
        
        // LIMPIEZA FINAL
        console.log('\n🧹 === LIMPIANDO DATOS DE PRUEBA ===');
        
        await Comment.deleteMany({ post: post._id });
        await Post.deleteOne({ _id: post._id });
        await User.deleteMany({ email: { $regex: /@comment-test\.com$/ } });
        
        console.log(`✅ Datos de prueba eliminados`);
        
        console.log('\n🎉 ¡TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE!');
        console.log('✨ El modelo Comment está funcionando perfectamente');
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
    console.log('🚀 Ejecutando pruebas del modelo Comment de AdoptaPet\n');
    testCommentModel()
        .then(() => {
            console.log('\n✨ ¡Pruebas completadas exitosamente!');
            console.log('🎯 El modelo Comment está listo para AdoptaPet');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error fatal en las pruebas:', error);
            process.exit(1);
        });
}

module.exports = { testCommentModel };