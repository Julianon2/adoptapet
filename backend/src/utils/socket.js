// backend/utils/socket.js
const { Server } = require('socket.io');
const Message = require('../models/Message');
const Chat = require('../models/Chat');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:5173'],
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  console.log('🔌 Inicializando Socket.io...');

  io.on('connection', (socket) => {
    console.log('✅ Usuario conectado:', socket.id);

    // Unirse a un chat específico
    socket.on('join_chat', async (chatId) => {
      socket.join(`chat_${chatId}`);
      console.log(`👤 Usuario ${socket.id} se unió al chat ${chatId}`);
    });

    // Enviar mensaje
    socket.on('send_message', async (data) => {
      try {
        const { chatId, senderId, text } = data;

        // Guardar mensaje en la base de datos
        const newMessage = new Message({
          chat: chatId,
          sender: senderId,
          text
        });

        await newMessage.save();
        await newMessage.populate('sender', 'nombre avatar');

        // Actualizar el último mensaje del chat
        await Chat.findByIdAndUpdate(chatId, {
          lastMessage: text
        });

        // Emitir el mensaje a todos en ese chat
        const messageData = {
          id: newMessage._id,
          text: newMessage.text,
          time: new Date(newMessage.createdAt).toLocaleTimeString('es-CO', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          senderId: newMessage.sender._id,
          senderName: newMessage.sender.nombre,
          senderAvatar: newMessage.sender.avatar
        };

        io.to(`chat_${chatId}`).emit('receive_message', messageData);
        console.log('📨 Mensaje enviado al chat:', chatId);
      } catch (error) {
        console.error('❌ Error al enviar mensaje:', error);
        socket.emit('error', { message: 'Error al enviar mensaje' });
      }
    });

    // Usuario está escribiendo
    socket.on('typing', (data) => {
      socket.to(`chat_${data.chatId}`).emit('user_typing', {
        userId: data.userId,
        isTyping: data.isTyping
      });
    });

    // Desconexión
    socket.on('disconnect', () => {
      console.log('❌ Usuario desconectado:', socket.id);
    });
  });

  console.log('✅ Socket.io inicializado correctamente');
  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io no ha sido inicializado');
  }
  return io;
};

module.exports = { initializeSocket, getIO };