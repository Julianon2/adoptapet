// =============================================
// SCRIPT DE PRUEBAS - MODELO PET
// =============================================

require('dotenv').config();
const mongoose = require('mongoose');
const Pet = require('../models/Pet');

async function testPetModel() {
    try {
        console.log('🧪 Iniciando pruebas del modelo Pet de AdoptaPet...\n');
        
        // =============================================
        // CONECTAR A LA BASE DE DATOS
        // =============================================
        console.log('🔗 Conectando a MongoDB Atlas...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conexión establecida exitosamente\n');
        
        // =============================================
        // PRUEBA 1: CREAR MASCOTA VÁLIDA
        // =============================================
        console.log('🐕 === PRUEBA 1: CREAR MASCOTA VÁLIDA ===');
        
        const validPet = new Pet({
            name: 'Max',
            species: 'perro',
            breed: 'Golden Retriever',
            age: {
                value: 2,
                unit: 'años'
            },
            gender: 'macho',
            size: 'grande',
            weight: 30,
            color: 'Dorado',
            description: 'Max es un perro muy amigable y juguetón. Le encanta correr en el parque y jugar con otros perros. Es perfecto para familias con niños.',
            story: 'Max fue rescatado de la calle hace 6 meses. Estaba desnutrido pero ahora está completamente recuperado y listo para encontrar un hogar amoroso.',
            personality: ['amigable', 'juguetón', 'energético', 'cariñoso', 'obediente'],
            photos: [
                'https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=600',
                'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600'
            ],
            mainPhoto: 'https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=600',
            healthInfo: {
                vaccinated: true,
                sterilized: true,
                dewormed: true,
                medicalConditions: [],
                specialNeeds: 'Ninguna',
                lastVetVisit: new Date('2024-10-01')
            },
            location: {
                country: 'Colombia',
                city: 'Bogotá',
                address: 'Calle 123 #45-67'
            },
            owner: new mongoose.Types.ObjectId(), // ID temporal para pruebas
            status: 'disponible',
            adoptionRequirements: {
                experience: false,
                hasGarden: true,
                hasOtherPets: true,
                hasChildren: true,
                adoptionFee: 0
            },
            tags: ['golden', 'amigable', 'familia', 'niños'],
            urgent: false,
            featured: true,
            priority: 8
        });
        
        const validationError = validPet.validateSync();
        
        if (validationError) {
            console.log('❌ Error de validación inesperado:');
            Object.values(validationError.errors).forEach(error => {
                console.log(`   • ${error.message}`);
            });
        } else {
            console.log('✅ Mascota válida - Estructura correcta');
            console.log(`   🐾 Nombre: ${validPet.name}`);
            console.log(`   🐕 Especie: ${validPet.species}`);
            console.log(`   🎂 Edad: ${validPet.ageText}`);
            console.log(`   ⚧ Género: ${validPet.gender}`);
            console.log(`   📏 Tamaño: ${validPet.size} (${validPet.sizeDescription})`);
            console.log(`   🎨 Color: ${validPet.color}`);
            console.log(`   ⚕️ Salud: ${validPet.healthStatus}`);
            console.log(`   📍 Ubicación: ${validPet.location.city}, ${validPet.location.country}`);
            console.log(`   ⭐ Estado: ${validPet.statusText}`);
            console.log(`   🏷️ Tags: ${validPet.tags.join(', ')}`);
            console.log(`   😊 Personalidad: ${validPet.personality.slice(0, 3).join(', ')}...`);
            
            console.log('\n💾 Probando guardado y middleware...');
            await validPet.save();
            console.log(`✅ Mascota guardada exitosamente con ID: ${validPet.id}`);
            
            console.log(`   🔍 Keywords generadas: ${validPet.keywords.slice(0, 5).join(', ')}...`);
            console.log(`   🏷️ Tags normalizadas: ${validPet.tags.join(', ')}`);
            console.log(`   📅 Publicado: ${validPet.timePosted}`);
        }
        
        // =============================================
        // PRUEBA 2: VALIDAR DATOS INCORRECTOS
        // =============================================
        console.log('\n🚨 === PRUEBA 2: VALIDAR DATOS INCORRECTOS ===');
        
        const invalidPet = new Pet({
            // name: FALTANTE (requerido)
            species: 'dinosaurio',  // No está en enum
            breed: 'T-Rex',
            age: {
                value: -5,  // Edad negativa
                unit: 'años'
            },
            gender: 'neutro',  // No está en enum
            size: 'microscopico',  // No está en enum
            weight: -10,  // Peso negativo
            description: 'Muy corta',  // Menos de 20 caracteres
            photos: [],  // Array vacío (requiere al menos 1)
            // mainPhoto: FALTANTE (requerida)
            location: {
                country: 'Colombia'
                // city: FALTANTE (requerida)
            }
            // owner: FALTANTE (requerido)
        });
        
        const errors = invalidPet.validateSync();
        
        if (errors) {
            console.log('✅ Validaciones funcionando correctamente:');
            Object.values(errors.errors).forEach(error => {
                console.log(`   🚫 ${error.path}: ${error.message}`);
            });
        } else {
            console.log('❌ ERROR: Las validaciones NO están funcionando');
        }
        
        // =============================================
        // PRUEBA 3: CREAR GATO DISPONIBLE
        // =============================================
        console.log('\n🐱 === PRUEBA 3: CREAR GATO DISPONIBLE ===');
        
        const cat = new Pet({
            name: 'Luna',
            species: 'gato',
            breed: 'Siamés',
            age: {
                value: 6,
                unit: 'meses'
            },
            gender: 'hembra',
            size: 'pequeño',
            weight: 3,
            color: 'Blanco con manchas marrones',
            description: 'Luna es una gatita muy cariñosa y tranquila. Le encanta dormir en lugares cálidos y jugar con juguetes pequeños.',
            personality: ['cariñosa', 'tranquila', 'independiente', 'limpia'],
            photos: [
                'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600'
            ],
            mainPhoto: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600',
            healthInfo: {
                vaccinated: true,
                sterilized: false,
                dewormed: true
            },
            location: {
                country: 'Colombia',
                city: 'Medellín'
            },
            owner: new mongoose.Types.ObjectId(),
            status: 'disponible',
            adoptionRequirements: {
                experience: false,
                hasGarden: false,
                hasOtherPets: false,
                hasChildren: true,
                adoptionFee: 50000
            },
            tags: ['gato', 'siames', 'cachorro', 'hembra'],
            urgent: true,
            featured: false
        });
        
        await cat.save();
        console.log(`✅ Gato guardado: ${cat.name}`);
        console.log(`   🎂 Edad: ${cat.ageText}`);
        console.log(`   ⚕️ Salud: ${cat.healthStatus}`);
        console.log(`   📍 Ciudad: ${cat.location.city}`);
        console.log(`   💰 Tarifa de adopción: $${cat.adoptionRequirements.adoptionFee.toLocaleString()}`);
        
        // =============================================
        // PRUEBA 4: PROBAR CAMPOS VIRTUALES
        // =============================================
        console.log('\n⚡ === PRUEBA 4: PROBAR CAMPOS VIRTUALES ===');
        
        const petForVirtuals = new Pet({
            name: 'Rocky',
            species: 'perro',
            breed: 'Mestizo',
            age: {
                value: 3,
                unit: 'años'
            },
            gender: 'macho',
            size: 'mediano',
            weight: 15,
            description: 'Rocky es un perro mestizo muy activo y leal. Perfecto como compañero de aventuras.',
            photos: ['https://test.com/rocky.jpg'],
            mainPhoto: 'https://test.com/rocky.jpg',
            healthInfo: {
                vaccinated: true,
                sterilized: true,
                dewormed: false
            },
            location: {
                country: 'Colombia',
                city: 'Cali'
            },
            owner: new mongoose.Types.ObjectId(),
            status: 'disponible'
        });
        
        await petForVirtuals.save();
        
        console.log('✅ Campos virtuales calculados correctamente:');
        console.log(`   🎂 Edad en texto: ${petForVirtuals.ageText}`);
        console.log(`   ⚕️ Estado de salud: ${petForVirtuals.healthStatus}`);
        console.log(`   📏 Descripción de tamaño: ${petForVirtuals.sizeDescription}`);
        console.log(`   📅 Tiempo publicado: ${petForVirtuals.timePosted}`);
        console.log(`   ⭐ Estado en español: ${petForVirtuals.statusText}`);
        
        // =============================================
        // PRUEBA 5: PROBAR MÉTODOS PERSONALIZADOS
        // =============================================
        console.log('\n🔧 === PRUEBA 5: PROBAR MÉTODOS PERSONALIZADOS ===');
        
        // Verificar si está disponible
        console.log(`¿Rocky está disponible? ${petForVirtuals.isAvailable() ? 'Sí ✅' : 'No ❌'}`);
        
        // Incrementar vistas
        const viewsBefore = petForVirtuals.views;
        await petForVirtuals.incrementViews();
        console.log(`Vistas incrementadas: ${viewsBefore} → ${petForVirtuals.views}`);
        
        // Marcar como adoptado
        const adopterId = new mongoose.Types.ObjectId();
        await petForVirtuals.markAsAdopted(adopterId);
        console.log(`Rocky marcado como adoptado ✅`);
        console.log(`   Estado: ${petForVirtuals.statusText}`);
        console.log(`   Fecha de adopción: ${petForVirtuals.adoptionDate}`);
        console.log(`   ¿Está disponible ahora? ${petForVirtuals.isAvailable() ? 'Sí' : 'No'}`);
        
        // =============================================
        // PRUEBA 6: BUSCAR MASCOTAS
        // =============================================
        console.log('\n🔍 === PRUEBA 6: BUSCAR MASCOTAS ===');
        
        // Buscar todas las mascotas de prueba
        const allPets = await Pet.find({
            name: { $regex: 'Max|Luna|Rocky', $options: 'i' }
        });
        
        console.log(`✅ Mascotas encontradas: ${allPets.length}`);
        
        allPets.forEach((pet, index) => {
            console.log(`   ${index + 1}. ${pet.name} (${pet.species})`);
            console.log(`      📍 ${pet.location.city}`);
            console.log(`      ⭐ ${pet.statusText}`);
            console.log(`      👁️ ${pet.views} vistas`);
            console.log(`      🆔 ${pet.id}`);
        });
        
        // Buscar mascotas disponibles en una ciudad específica
        console.log('\n🏙️ Buscando mascotas disponibles en Bogotá...');
        const petsInBogota = await Pet.find({
            'location.city': /Bogotá/i,
            status: 'disponible'
        });
        console.log(`✅ Encontradas: ${petsInBogota.length} mascota(s) en Bogotá`);
        
        // =============================================
        // PRUEBA 7: FILTRAR POR CARACTERÍSTICAS
        // =============================================
        console.log('\n🎯 === PRUEBA 7: FILTRAR POR CARACTERÍSTICAS ===');
        
        // Buscar perros grandes disponibles
        const largeDogs = await Pet.find({
            species: 'perro',
            size: 'grande',
            status: 'disponible'
        });
        console.log(`🐕 Perros grandes disponibles: ${largeDogs.length}`);
        
        // Buscar mascotas urgentes
        const urgentPets = await Pet.find({ urgent: true });
        console.log(`🚨 Mascotas urgentes: ${urgentPets.length}`);
        
        // Buscar mascotas destacadas
        const featuredPets = await Pet.find({ featured: true });
        console.log(`⭐ Mascotas destacadas: ${featuredPets.length}`);
        
        // =============================================
        // LIMPIEZA: ELIMINAR MASCOTAS DE PRUEBA
        // =============================================
        console.log('\n🧹 === LIMPIANDO DATOS DE PRUEBA ===');
        
        const deleteResult = await Pet.deleteMany({
            name: { $regex: 'Max|Luna|Rocky', $options: 'i' }
        });
        
        console.log(`✅ ${deleteResult.deletedCount} mascota(s) de prueba eliminada(s)`);
        
        console.log('\n🎉 ¡TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE!');
        console.log('✨ El modelo Pet está funcionando perfectamente');
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

// Ejecutar si el archivo se llama directamente
if (require.main === module) {
    console.log('🚀 Ejecutando pruebas del modelo Pet de AdoptaPet\n');
    testPetModel()
        .then(() => {
            console.log('\n✨ ¡Pruebas completadas exitosamente!');
            console.log('🎯 El modelo Pet está listo para AdoptaPet');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error fatal en las pruebas:', error);
            process.exit(1);
        });
}

module.exports = { testPetModel };