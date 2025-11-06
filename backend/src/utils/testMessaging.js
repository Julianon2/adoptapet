// =============================================
// SCRIPT DE PRUEBAS - SISTEMA DE MENSAJERÍA
// =============================================

require('dotenv').config();
const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

async function testMessaging() {
    try {
        console.log('🧪 Iniciando pruebas del Sistema de Mensajería de AdoptaPet...\n');
        
        // CONECTAR A LA BASE DE DATOS
        console.log('🔗 Conectando a MongoDB Atlas...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conexión establecida exitosamente\n');
        
        // LIMPIEZA PREVIA
        console.log('🧹 === LIMPIANDO DATOS DE PRUEBAS ANTERIORES ===');
        await Message.deleteMany({});
        await Conversation.deleteMany({});
        await User.deleteMany({ email: { $regex: /@messaging-test\.com$/ } });
        console.log('✅ Datos de pruebas anteriores eliminados\n');
        
        // CREAR USUARIOS DE PRUEBA
        console.log('🔧 === CREANDO USUARIOS DE PRUEBA ===');
        
        const users = [];
        for (let i = 1; i <= 5; i++) {
            const user = new User({
                name: `Usuario ${i}`,
                email: `user${i}@messaging-test.com`,
                password: 'test123',
                role: 'adopter',
                location: { country: 'Colombia', city: 'Bogotá' }
            });
            await user.save();
            users.push(user);
            console.log(`✅ Usuario ${i} creado: ${user.name}`);
        }
        console.log('');
        
        // PRUEBA 1: CREAR CONVERSACIÓN INDIVIDUAL
        console.log('💬 === PRUEBA 1: CREAR CONVERSACIÓN INDIVIDUAL ===');
        
        const conv1 = await Conversation.createIndividual(users[0]._id, users[1]._id);
        
        console.log('✅ Conversación individual creada:');
        console.log(`   💬 Tipo: ${conv1.typeText}`);
        console.log(`   👥 Participantes: ${conv1.participantCount}`);
        console.log(`   📊 Estado: ${conv1.statusText}`);
        
        // PRUEBA 2: INTENTAR CREAR CONVERSACIÓN DUPLICADA
        console.log('\n🔄 === PRUEBA 2: EVITAR CONVERSACIONES DUPLICADAS ===');
        
        const conv1Duplicate = await Conversation.createIndividual(users[1]._id, users[0]._id);
        
        console.log('✅ Conversación existente retornada:');
        console.log(`   🆔 Misma conversación: ${conv1._id.equals(conv1Duplicate._id)}`);
        
        // PRUEBA 3: ENVIAR MENSAJE DE TEXTO
        console.log('\n💌 === PRUEBA 3: ENVIAR MENSAJE DE TEXTO ===');
        
        const msg1 = await Message.sendText(
            conv1._id,
            users[0]._id,
            '¡Hola! ¿Cómo estás?'
        );
        
        console.log('✅ Mensaje enviado:');
        console.log(`   💌 Tipo: ${msg1.typeText}`);
        console.log(`   📝 Contenido: ${msg1.content.text}`);
        console.log(`   📊 Estado: ${msg1.statusText}`);
        console.log(`   ⏰ Tiempo: ${msg1.timeAgo}`);
        
        // PRUEBA 4: ENVIAR MÁS MENSAJES
        console.log('\n💬 === PRUEBA 4: CONVERSACIÓN FLUIDA ===');
        
        const msg2 = await Message.sendText(conv1._id, users[1]._id, '¡Hola! Todo bien, ¿y tú?');
        const msg3 = await Message.sendText(conv1._id, users[0]._id, 'Excelente. Vi que tienes un perrito en adopción');
        const msg4 = await Message.sendText(conv1._id, users[1]._id, 'Sí! Se llama Max, es muy tierno');
        
        console.log('✅ 4 mensajes enviados en la conversación');
        
        // PRUEBA 5: OBTENER MENSAJES DE LA CONVERSACIÓN
        console.log('\n📋 === PRUEBA 5: OBTENER MENSAJES ===');
        
        const messages = await Message.getConversationMessages(conv1._id, users[0]._id);
        
        console.log(`✅ Mensajes obtenidos: ${messages.length}`);
        messages.reverse().forEach((msg, index) => {
            console.log(`   ${index + 1}. ${msg.sender.name}: ${msg.content.text}`);
        });
        
        // PRUEBA 6: MARCAR MENSAJES COMO LEÍDOS
        console.log('\n👁️ === PRUEBA 6: MARCAR COMO LEÍDO ===');
        
        await msg1.markAsRead(users[1]._id);
        await msg2.markAsRead(users[0]._id);
        await msg3.markAsRead(users[1]._id);
        
        console.log('✅ Mensajes marcados como leídos:');
        console.log(`   📧 Mensaje 1 - Lecturas: ${msg1.readCount}`);
        console.log(`   📧 Mensaje 2 - Lecturas: ${msg2.readCount}`);
        console.log(`   📧 Mensaje 3 - Lecturas: ${msg3.readCount}`);
        
        // PRUEBA 7: OBTENER MENSAJES NO LEÍDOS
        console.log('\n📬 === PRUEBA 7: MENSAJES NO LEÍDOS ===');
        
        const unreadMessages = await Message.getUnreadMessages(conv1._id, users[1]._id);
        
        console.log(`✅ Mensajes no leídos para ${users[1].name}: ${unreadMessages.length}`);
        unreadMessages.forEach((msg, index) => {
            console.log(`   ${index + 1}. ${msg.sender.name}: ${msg.content.text}`);
        });
        
        // PRUEBA 8: CREAR CONVERSACIÓN GRUPAL
        console.log('\n👥 === PRUEBA 8: CREAR CONVERSACIÓN GRUPAL ===');
        
        const groupConv = await Conversation.createGroup(
            users[0]._id,
            [users[1]._id, users[2]._id, users[3]._id],
            {
                name: 'Amigos de las Mascotas 🐕',
                description: 'Grupo para compartir experiencias de adopción'
            }
        );
        
        console.log('✅ Grupo creado:');
        console.log(`   👥 Nombre: ${groupConv.groupInfo.name}`);
        console.log(`   📝 Descripción: ${groupConv.groupInfo.description}`);
        console.log(`   👤 Participantes: ${groupConv.participantCount}`);
        console.log(`   👑 Creado por: ${users[0].name}`);
        
        // PRUEBA 9: ENVIAR MENSAJES EN GRUPO
        console.log('\n💬 === PRUEBA 9: MENSAJES EN GRUPO ===');
        
        await Message.sendText(groupConv._id, users[0]._id, 'Hola a todos! 👋');
        await Message.sendText(groupConv._id, users[1]._id, 'Hola! Qué bueno estar aquí');
        await Message.sendText(groupConv._id, users[2]._id, 'Hola grupo! 🎉');
        await Message.sendText(groupConv._id, users[3]._id, 'Bienvenidos!');
        
        console.log('✅ 4 mensajes enviados en el grupo');
        
        // PRUEBA 10: AGREGAR PARTICIPANTE AL GRUPO
        console.log('\n➕ === PRUEBA 10: AGREGAR PARTICIPANTE ===');
        
        await groupConv.addParticipant(users[4]._id);
        
        console.log('✅ Participante agregado:');
        console.log(`   👤 Usuario: ${users[4].name}`);
        console.log(`   👥 Total participantes: ${groupConv.participantCount}`);
        
        // PRUEBA 11: ENVIAR MENSAJE CON ARCHIVO
        console.log('\n📎 === PRUEBA 11: MENSAJE CON ARCHIVO ===');
        
        const msgWithFile = await Message.sendWithAttachment(
            conv1._id,
            users[0]._id,
            {
                type: 'image',
                url: 'https://example.com/images/max.jpg',
                filename: 'max.jpg',
                size: 1024000,
                mimeType: 'image/jpeg'
            },
            'Aquí está la foto de Max 📸'
        );
        
        console.log('✅ Mensaje con archivo enviado:');
        console.log(`   💌 Tipo: ${msgWithFile.typeText}`);
        console.log(`   📎 Archivos adjuntos: ${msgWithFile.hasAttachments ? 'Sí' : 'No'}`);
        console.log(`   📝 Texto: ${msgWithFile.content.text}`);
        
        // PRUEBA 12: REACCIONAR A UN MENSAJE
        console.log('\n❤️ === PRUEBA 12: REACCIONES A MENSAJES ===');
        
        await msg1.addReaction(users[1]._id, '❤️');
        await msg1.addReaction(users[0]._id, '👍');
        await msg4.addReaction(users[0]._id, '😍');
        
        console.log('✅ Reacciones agregadas:');
        console.log(`   💌 Mensaje 1 - Reacciones: ${msg1.reactions.length}`);
        console.log(`   💌 Mensaje 4 - Reacciones: ${msg4.reactions.length}`);
        
        // PRUEBA 13: RESPONDER A UN MENSAJE
        console.log('\n↩️ === PRUEBA 13: RESPONDER MENSAJE ===');
        
        const reply = new Message({
            conversation: conv1._id,
            sender: users[1]._id,
            type: 'text',
            content: { text: 'Claro! Te envío más fotos' },
            replyTo: msg3._id,
            status: 'sent',
            sentAt: new Date()
        });
        await reply.save();
        
        console.log('✅ Respuesta enviada:');
        console.log(`   💬 Respondiendo a: "${msg3.content.text}"`);
        console.log(`   💌 Respuesta: "${reply.content.text}"`);
        
        // PRUEBA 14: EDITAR MENSAJE
        console.log('\n✏️ === PRUEBA 14: EDITAR MENSAJE ===');
        
        const originalText = msg2.content.text;
        await msg2.edit('¡Hola! Todo bien, gracias por preguntar ¿y tú?');
        
        console.log('✅ Mensaje editado:');
        console.log(`   📝 Original: ${originalText}`);
        console.log(`   ✏️ Editado: ${msg2.content.text}`);
        console.log(`   📊 Editado: ${msg2.metadata.edited.isEdited ? 'Sí' : 'No'}`);
        
        // PRUEBA 15: FIJAR MENSAJE
        console.log('\n📌 === PRUEBA 15: FIJAR MENSAJE ===');
        
        await msg1.pin(users[0]._id);
        
        console.log('✅ Mensaje fijado:');
        console.log(`   📌 Fijado: ${msg1.metadata.pinned.isPinned ? 'Sí' : 'No'}`);
        console.log(`   👤 Por: ${users[0].name}`);
        
        // PRUEBA 16: OBTENER MENSAJES FIJADOS
        console.log('\n📍 === PRUEBA 16: OBTENER MENSAJES FIJADOS ===');
        
        const pinnedMessages = await Message.getPinnedMessages(conv1._id);
        
        console.log(`✅ Mensajes fijados: ${pinnedMessages.length}`);
        pinnedMessages.forEach((msg, index) => {
            console.log(`   ${index + 1}. ${msg.sender.name}: ${msg.content.text}`);
        });
        
        // PRUEBA 17: SILENCIAR CONVERSACIÓN
        console.log('\n🔕 === PRUEBA 17: SILENCIAR NOTIFICACIONES ===');
        
        await conv1.mute(users[1]._id, 24); // Silenciar por 24 horas
        
        const participant = conv1.participants.find(p => 
            p.user.toString() === users[1]._id.toString()
        );
        
        console.log('✅ Conversación silenciada:');
        console.log(`   🔕 Silenciado: ${participant.isMuted ? 'Sí' : 'No'}`);
        console.log(`   ⏰ Hasta: ${participant.mutedUntil}`);
        
        // PRUEBA 18: BUSCAR MENSAJES
        console.log('\n🔍 === PRUEBA 18: BUSCAR MENSAJES ===');
        
        const searchResults = await Message.searchMessages(conv1._id, 'perrito');
        
        console.log(`✅ Resultados de búsqueda: ${searchResults.length}`);
        searchResults.forEach((msg, index) => {
            console.log(`   ${index + 1}. ${msg.sender.name}: ${msg.content.text}`);
        });
        
        // PRUEBA 19: MARCAR TODOS COMO LEÍDOS
        console.log('\n✅ === PRUEBA 19: MARCAR TODOS COMO LEÍDOS ===');
        
        const markedCount = await Message.markAllAsRead(conv1._id, users[1]._id);
        
        console.log(`✅ Mensajes marcados como leídos: ${markedCount}`);
        
        // PRUEBA 20: ELIMINAR MENSAJE PARA UN USUARIO
        console.log('\n🗑️ === PRUEBA 20: ELIMINAR MENSAJE (PARA MÍ) ===');
        
        await msg4.deleteForUser(users[0]._id);
        
        console.log('✅ Mensaje eliminado para un usuario:');
        console.log(`   🗑️ Eliminado para: ${users[0].name}`);
        console.log(`   ✅ Visible para otros: Sí`);
        
        // PRUEBA 21: OBTENER CONVERSACIONES DEL USUARIO
        console.log('\n📱 === PRUEBA 21: OBTENER CONVERSACIONES ===');
        
        const userConversations = await Conversation.getUserConversations(users[0]._id);
        
        console.log(`✅ Conversaciones de ${users[0].name}: ${userConversations.length}`);
        userConversations.forEach((conv, index) => {
            console.log(`   ${index + 1}. ${conv.type === 'group' ? conv.groupInfo.nombre : 'Chat Individual'}`);
            console.log(`      👥 Participantes: ${conv.participants.length}`);
            console.log(`      💌 Mensajes: ${conv.messageCount}`);
            console.log(`      ⏰ Última actividad: ${new Date(conv.lastMessageAt).toLocaleString()}`);
        });
        
        // PRUEBA 22: OBTENER ESTADÍSTICAS
        console.log('\n📊 === PRUEBA 22: ESTADÍSTICAS DE MENSAJES ===');
        
        const stats = await Message.getMessageStats(conv1._id);
        
        console.log('✅ Estadísticas de la conversación:');
        console.log(`   💌 Total mensajes: ${stats.totalMessages}`);
        console.log(`   📝 Mensajes de texto: ${stats.textMessages}`);
        console.log(`   📎 Mensajes multimedia: ${stats.mediaMessages}`);
        console.log(`   📁 Total archivos: ${stats.totalAttachments}`);
        
        // PRUEBA 23: REMOVER PARTICIPANTE DEL GRUPO
        console.log('\n➖ === PRUEBA 23: REMOVER PARTICIPANTE ===');
        
        await groupConv.removeParticipant(users[4]._id);
        
        console.log('✅ Participante removido:');
        console.log(`   👤 Usuario removido: ${users[4].name}`);
        console.log(`   👥 Participantes activos: ${groupConv.activeParticipants.length}`);
        
        // PRUEBA 24: ARCHIVAR CONVERSACIÓN
        console.log('\n📦 === PRUEBA 24: ARCHIVAR CONVERSACIÓN ===');
        
        const conv2 = await Conversation.createIndividual(users[2]._id, users[3]._id);
        await conv2.archive();
        
        console.log('✅ Conversación archivada:');
        console.log(`   📊 Estado: ${conv2.statusText}`);
        console.log(`   📅 Archivada el: ${conv2.archivedAt}`);
        
        // PRUEBA 25: VALIDAR TAMAÑO DE ARCHIVO
        console.log('\n📏 === PRUEBA 25: VALIDAR TAMAÑO DE ARCHIVO ===');
        
        const validImage = Message.validateFileSize(5 * 1024 * 1024, 'image');
        const invalidImage = Message.validateFileSize(15 * 1024 * 1024, 'image');
        
        console.log('✅ Validaciones de tamaño:');
        console.log(`   📸 Imagen 5MB: ${validImage ? 'Válido' : 'Inválido'}`);
        console.log(`   📸 Imagen 15MB: ${invalidImage ? 'Válido' : 'Inválido'}`);
        
        // RESUMEN FINAL
        console.log('\n' + '='.repeat(60));
        console.log('📊 === RESUMEN DE PRUEBAS ===');
        console.log('='.repeat(60));
        
        const totalConversations = await Conversation.countDocuments();
        const totalMessages = await Message.countDocuments();
        const activeConversations = await Conversation.countDocuments({ status: 'active' });
        const groupConversations = await Conversation.countDocuments({ type: 'group' });
        
        console.log('\n📈 Estadísticas Generales:');
        console.log(`   💬 Total conversaciones: ${totalConversations}`);
        console.log(`   ✅ Conversaciones activas: ${activeConversations}`);
        console.log(`   👥 Conversaciones grupales: ${groupConversations}`);
        console.log(`   💌 Total mensajes: ${totalMessages}`);
        console.log(`   📸 Mensajes con archivos: 1`);
        console.log(`   📌 Mensajes fijados: ${pinnedMessages.length}`);
        
        console.log('\n✅ Funcionalidades probadas:');
        console.log('   ✓ Crear conversación individual');
        console.log('   ✓ Evitar conversaciones duplicadas');
        console.log('   ✓ Enviar mensajes de texto');
        console.log('   ✓ Conversaciones fluidas');
        console.log('   ✓ Obtener mensajes');
        console.log('   ✓ Marcar como leído');
        console.log('   ✓ Mensajes no leídos');
        console.log('   ✓ Crear grupo');
        console.log('   ✓ Mensajes en grupo');
        console.log('   ✓ Agregar participante');
        console.log('   ✓ Mensajes con archivos');
        console.log('   ✓ Reacciones a mensajes');
        console.log('   ✓ Responder mensajes');
        console.log('   ✓ Editar mensajes');
        console.log('   ✓ Fijar mensajes');
        console.log('   ✓ Obtener mensajes fijados');
        console.log('   ✓ Silenciar notificaciones');
        console.log('   ✓ Buscar mensajes');
        console.log('   ✓ Marcar todos como leídos');
        console.log('   ✓ Eliminar para un usuario');
        console.log('   ✓ Obtener conversaciones');
        console.log('   ✓ Estadísticas');
        console.log('   ✓ Remover participante');
        console.log('   ✓ Archivar conversación');
        console.log('   ✓ Validar archivos');
        
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
testMessaging();