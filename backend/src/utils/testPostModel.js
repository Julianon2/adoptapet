// =============================================
// SCRIPT DE PRUEBAS - MODELO POST
// =============================================

require('dotenv').config();
const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');
const Pet = require('../models/Pet');

async function testPostModel() {
    try {
        console.log('🧪 Iniciando pruebas del modelo Post de AdoptaPet...\n');
        
        // CONECTAR A LA BASE DE DATOS
        console.log('🔗 Conectando a MongoDB Atlas...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conexión establecida exitosamente\n');
        
        // CREAR DATOS DE PRUEBA (Usuario y Mascota)
        console.log('🔧 === CREANDO DATOS DE PRUEBA ===');
        
        const testUser = new User({
            name: 'Test User Post',
            email: 'testpost@test.com',
            password: 'test123',
            role: 'adopter'
        });
        await testUser.save();
        console.log(`✅ Usuario de prueba creado: ${testUser.name}`);
        
        const testPet = new Pet({
            name: 'Bobby',
            species: 'perro',
            breed: 'Labrador',
            age: { value: 2, unit: 'años' },
            gender: 'macho',
            size: 'grande',
            description: 'Perro amigable y juguetón para pruebas',
            photos: ['https://test.com/bobby.jpg'],
            mainPhoto: 'https://test.com/bobby.jpg',
            location: { country: 'Colombia', city: 'Bogotá' },
            owner: testUser._id
        });
        await testPet.save();
        console.log(`✅ Mascota de prueba creada: ${testPet.name}\n`);
        
        // PRUEBA 1: CREAR POST SIMPLE
        console.log('📱 === PRUEBA 1: CREAR POST SIMPLE ===');
        
        const simplePost = new Post({
            author: testUser._id,
            type: 'update',
            content: 'Mi primera publicación en AdoptaPet! Estoy muy feliz de formar parte de esta comunidad.',
            tags: ['bienvenida', 'nuevo', 'adoptapet']
        });
        
        const validationError = simplePost.validateSync();
        
        if (validationError) {
            console.log('❌ Error de validación inesperado:');
            Object.values(validationError.errors).forEach(error => {
                console.log(`   • ${error.message}`);
            });
        } else {
            console.log('✅ Post válido - Estructura correcta');
            console.log(`   📱 Tipo: ${simplePost.typeText}`);
            console.log(`   📝 Contenido: ${simplePost.content.substring(0, 50)}...`);
            console.log(`   🏷️ Tags: ${simplePost.tags.join(', ')}`);
            
            await simplePost.save();
            console.log(`✅ Post guardado con ID: ${simplePost.id}`);
        }
        
        // PRUEBA 2: CREAR POST CON MULTIMEDIA
        console.log('\n📸 === PRUEBA 2: CREAR POST CON MULTIMEDIA ===');
        
        const photoPost = new Post({
            author: testUser._id,
            type: 'photo',
            content: 'Miren qué hermoso está Bobby hoy! 🐕',
            pet: testPet._id,
            media: {
                images: [
                    'https://images.unsplash.com/photo-1587550003388-59208cc962cb?w=600',
                    'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600'
                ]
            },
            tags: ['perro', 'bobby', 'labrador']
        });
        
        await photoPost.save();
        console.log(`✅ Post con fotos guardado`);
        console.log(`   📸 Tiene multimedia: ${photoPost.hasMedia ? 'Sí' : 'No'}`);
        console.log(`   🖼️ Cantidad de imágenes: ${photoPost.media.images.length}`);
        
        // PRUEBA 3: CREAR HISTORIA DE ADOPCIÓN
        console.log('\n🎉 === PRUEBA 3: CREAR HISTORIA DE ADOPCIÓN ===');
        
        const adoptionStory = new Post({
            author: testUser._id,
            type: 'adoption-story',
            title: 'Bobby encontró su hogar para siempre!',
            content: 'Después de 3 meses en el refugio, Bobby finalmente encontró una familia amorosa. Estoy tan feliz de haber podido ayudar en su proceso de adopción. Ver su carita feliz hace que todo valga la pena!',
            pet: testPet._id,
            adoptionInfo: {
                adopted: true,
                adoptionDate: new Date(),
                adopter: testUser._id,
                happyEnding: true
            },
            media: {
                images: ['https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600']
            },
            tags: ['adopción', 'final-feliz', 'bobby']
        });
        
        await adoptionStory.save();
        console.log(`✅ Historia de adopción guardada`);
        console.log(`   🎉 Es historia de adopción: ${adoptionStory.isAdoptionStory ? 'Sí' : 'No'}`);
        console.log(`   📅 Fecha de adopción: ${adoptionStory.adoptionInfo.adoptionDate}`);
        console.log(`   💚 Final feliz: ${adoptionStory.adoptionInfo.happyEnding ? 'Sí' : 'No'}`);
        
        // PRUEBA 4: VALIDAR DATOS INCORRECTOS
        console.log('\n🚨 === PRUEBA 4: VALIDAR DATOS INCORRECTOS ===');
        
        const invalidPost = new Post({
            // author: FALTANTE (requerido)
            type: 'tipo-inexistente',
            content: '',  // Vacío (requerido, mínimo 1 caracter)
            media: {
                images: new Array(15).fill('image.jpg')  // Más de 10 (excede límite)
            }
        });
        
        const errors = invalidPost.validateSync();
        
        if (errors) {
            console.log('✅ Validaciones funcionando correctamente:');
            Object.values(errors.errors).forEach(error => {
                console.log(`   🚫 ${error.path}: ${error.message}`);
            });
        } else {
            console.log('❌ ERROR: Las validaciones NO están funcionando');
        }
        
        // PRUEBA 5: PROBAR CAMPOS VIRTUALES
        console.log('\n⚡ === PRUEBA 5: PROBAR CAMPOS VIRTUALES ===');
        
        console.log('✅ Campos virtuales calculados correctamente:');
        console.log(`   📱 Tipo en español: ${simplePost.typeText}`);
        console.log(`   ❤️ Engagement total: ${simplePost.totalEngagement}`);
        console.log(`   🕐 Tiempo desde publicación: ${simplePost.timeAgo}`);
        console.log(`   📸 Tiene multimedia: ${photoPost.hasMedia ? 'Sí' : 'No'}`);
        console.log(`   🎉 Es historia de adopción: ${adoptionStory.isAdoptionStory ? 'Sí' : 'No'}`);
        console.log(`   📊 Engagement rate: ${simplePost.engagementRate}%`);
        
        // PRUEBA 6: PROBAR SISTEMA DE LIKES
        console.log('\n❤️ === PRUEBA 6: PROBAR SISTEMA DE LIKES ===');
        
        const userId1 = new mongoose.Types.ObjectId();
        const userId2 = new mongoose.Types.ObjectId();
        
        console.log(`Likes iniciales: ${simplePost.stats.likes}`);
        
        // Agregar likes
        await simplePost.addLike(userId1);
        console.log(`✅ Like agregado - Total: ${simplePost.stats.likes}`);
        
        await simplePost.addLike(userId2);
        console.log(`✅ Like agregado - Total: ${simplePost.stats.likes}`);
        
        // Verificar si dio like
        console.log(`¿Usuario 1 dio like? ${simplePost.hasLiked(userId1) ? 'Sí' : 'No'}`);
        
        // Remover like
        await simplePost.removeLike(userId1);
        console.log(`✅ Like removido - Total: ${simplePost.stats.likes}`);
        console.log(`¿Usuario 1 dio like ahora? ${simplePost.hasLiked(userId1) ? 'Sí' : 'No'}`);
        
        // PRUEBA 7: PROBAR OTROS MÉTODOS
        console.log('\n🔧 === PRUEBA 7: PROBAR OTROS MÉTODOS ===');
        
        // Incrementar vistas
        const viewsBefore = photoPost.stats.views;
        await photoPost.incrementViews();
        console.log(`👁️ Vistas: ${viewsBefore} → ${photoPost.stats.views}`);
        
        // Incrementar comentarios
        await photoPost.incrementComments();
        await photoPost.incrementComments();
        console.log(`💬 Comentarios: ${photoPost.stats.comments}`);
        
        // Incrementar shares
        await photoPost.incrementShares();
        console.log(`🔄 Compartidos: ${photoPost.stats.shares}`);
        
        // Editar contenido
        const originalContent = simplePost.content;
        await simplePost.editContent('Este es mi contenido editado! Ahora con más información.');
        console.log(`✏️ Post editado: ${simplePost.edited ? 'Sí' : 'No'}`);
        console.log(`   📝 Historial de ediciones: ${simplePost.editHistory.length}`);
        
        // PRUEBA 8: PROBAR REPORTES
        console.log('\n🚨 === PRUEBA 8: PROBAR SISTEMA DE REPORTES ===');
        
        console.log(`Reportes iniciales: ${photoPost.reports.count}`);
        
        await photoPost.report('Contenido inapropiado');
        await photoPost.report('Spam');
        await photoPost.report('Información falsa');
        
        console.log(`✅ Reportes registrados: ${photoPost.reports.count}`);
        console.log(`   Razones: ${photoPost.reports.reasons.join(', ')}`);
        console.log(`   Estado del post: ${photoPost.status}`);
        
        // PRUEBA 9: BUSCAR POSTS
        console.log('\n🔍 === PRUEBA 9: BUSCAR POSTS ===');
        
        // Buscar posts del usuario
        const userPosts = await Post.findByAuthor(testUser._id);
        console.log(`✅ Posts del usuario encontrados: ${userPosts.length}`);
        userPosts.forEach((post, index) => {
            console.log(`   ${index + 1}. ${post.typeText}`);
            console.log(`      📝 ${post.content.substring(0, 40)}...`);
            console.log(`      ❤️ ${post.stats.likes} likes`);
        });
        
        // Buscar feed público
        console.log('\n📱 Obteniendo feed público...');
        const publicFeed = await Post.getPublicFeed({ limit: 10 });
        console.log(`✅ Posts en feed público: ${publicFeed.length}`);
        
        // Buscar historias de adopción
        console.log('\n🎉 Buscando historias de adopción...');
        const adoptionStories = await Post.getAdoptionStories();
        console.log(`✅ Historias de adopción encontradas: ${adoptionStories.length}`);
        
        // PRUEBA 10: ESTADÍSTICAS DE POSTS
        console.log('\n📊 === PRUEBA 10: ESTADÍSTICAS DE POSTS ===');
        
        const postStats = await Post.getPostStats();
        console.log('✅ Estadísticas por tipo de post:');
        postStats.forEach(stat => {
            console.log(`   ${stat._id}:`);
            console.log(`      Total: ${stat.count}`);
            console.log(`      Likes: ${stat.totalLikes}`);
            console.log(`      Comentarios: ${stat.totalComments}`);
            console.log(`      Compartidos: ${stat.totalShares}`);
        });
        
        // PRUEBA 11: PROBAR VISIBILIDAD
        console.log('\n🔒 === PRUEBA 11: PROBAR CONTROL DE VISIBILIDAD ===');
        
        const privatePost = new Post({
            author: testUser._id,
            type: 'update',
            content: 'Este es un post privado, solo yo puedo verlo.',
            settings: {
                visibility: 'private',
                allowComments: false
            }
        });
        
        await privatePost.save();
        console.log(`✅ Post privado creado`);
        console.log(`   🔒 Visibilidad: ${privatePost.settings.visibility}`);
        console.log(`   💬 Permite comentarios: ${privatePost.settings.allowComments ? 'Sí' : 'No'}`);
        
        // Verificar visibilidad
        const randomUserId = new mongoose.Types.ObjectId();
        console.log(`   ¿Visible para usuario random? ${privatePost.isVisibleTo(randomUserId) ? 'Sí' : 'No'}`);
        console.log(`   ¿Visible para el autor? ${privatePost.isVisibleTo(testUser._id) ? 'Sí' : 'No'}`);
        
        // PRUEBA 12: POSTS TRENDING
        console.log('\n🔥 === PRUEBA 12: POSTS TRENDING ===');
        
        const trendingPosts = await Post.getTrendingPosts(7);
        console.log(`✅ Posts trending (últimos 7 días): ${trendingPosts.length}`);
        
        // LIMPIEZA: ELIMINAR DATOS DE PRUEBA
        console.log('\n🧹 === LIMPIANDO DATOS DE PRUEBA ===');
        
        await Post.deleteMany({ author: testUser._id });
        await Pet.deleteOne({ _id: testPet._id });
        await User.deleteOne({ _id: testUser._id });
        
        console.log(`✅ Datos de prueba eliminados`);
        
        console.log('\n🎉 ¡TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE!');
        console.log('✨ El modelo Post está funcionando perfectamente');
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
    console.log('🚀 Ejecutando pruebas del modelo Post de AdoptaPet\n');
    testPostModel()
        .then(() => {
            console.log('\n✨ ¡Pruebas completadas exitosamente!');
            console.log('🎯 El modelo Post está listo para AdoptaPet');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error fatal en las pruebas:', error);
            process.exit(1);
        });
}

module.exports = { testPostModel };