// backend/routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const jwt = require('jsonwebtoken');

// Middleware de autenticación
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// GET /api/chat - Obtener todos los chats del usuario
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    console.log('📥 Obteniendo chats para usuario:', userId);
    
    const chats = await Chat.find({
      participants: userId
    })
    .populate('participants', 'nombre email avatar')
    .populate('petRelated', 'nombre imagen')
    .sort({ updatedAt: -1 });

    const formattedChats = chats.map(chat => {
      const otherUser = chat.participants.find(p => p._id.toString() !== userId);
      
      return {
        id: chat._id,
        name: otherUser?.nombre || 'Usuario',
        avatar: otherUser?.avatar || 'https://via.placeholder.com/48',
        lastMessage: chat.lastMessage || 'Sin mensajes',
        online: false,
        unread: 0,
        petRelated: chat.petRelated
      };
    });

    console.log(`✅ Enviando ${formattedChats.length} chats`);
    res.json(formattedChats);
  } catch (error) {
    console.error('❌ Error al obtener chats:', error);
    res.status(500).json({ error: 'Error al obtener chats' });
  }
});

// GET /api/chat/:chatId/messages - Obtener mensajes de un chat
router.get('/:chatId/messages', authenticate, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.userId;
    console.log('📥 Obteniendo mensajes del chat:', chatId);

    const messages = await Message.find({ chat: chatId })
      .populate('sender', 'nombre avatar')
      .sort({ createdAt: 1 });

    const formattedMessages = messages.map(msg => ({
      id: msg._id,
      text: msg.text,
      time: new Date(msg.createdAt).toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      sender: msg.sender._id.toString() === userId ? 'me' : 'other',
      senderId: msg.sender._id,
      senderName: msg.sender.nombre,
      senderAvatar: msg.sender.avatar
    }));

    console.log(`✅ Enviando ${formattedMessages.length} mensajes`);
    res.json(formattedMessages);
  } catch (error) {
    console.error('❌ Error al obtener mensajes:', error);
    res.status(500).json({ error: 'Error al obtener mensajes' });
  }
});

// POST /api/chat - Crear un nuevo chat
router.post('/', authenticate, async (req, res) => {
  try {
    const { otherUserId, petId } = req.body;
    const userId = req.userId;
    console.log('📝 Creando chat entre:', userId, 'y', otherUserId);

    // Verificar si ya existe un chat entre estos usuarios
    let chat = await Chat.findOne({
      participants: { $all: [userId, otherUserId] }
    });

    if (!chat) {
      chat = new Chat({
        participants: [userId, otherUserId],
        petRelated: petId || null
      });
      await chat.save();
      console.log('✅ Nuevo chat creado:', chat._id);
    } else {
      console.log('ℹ️  Chat ya existía:', chat._id);
    }

    await chat.populate('participants', 'nombre email avatar');

    const otherUser = chat.participants.find(p => p._id.toString() !== userId);

    res.status(201).json({
      id: chat._id,
      name: otherUser?.nombre || 'Usuario',
      avatar: otherUser?.avatar || 'https://via.placeholder.com/48',
      lastMessage: chat.lastMessage || '',
      online: false,
      unread: 0
    });
  } catch (error) {
    console.error('❌ Error al crear chat:', error);
    res.status(500).json({ error: 'Error al crear chat' });
  }
});

console.log('✅ Rutas de chat cargadas');
module.exports = router;