// backend/routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
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

// Helper: obtener el otro participante del chat
const getOtherUserIdFromChat = (chat, myUserId) => {
  if (!chat?.participants?.length) return null;
  const other = chat.participants.find(p => p.toString() !== myUserId.toString());
  return other ? other.toString() : null;
};

// Helper: construir URL del avatar (solo para backend)
const buildAvatarUrl = (avatar, userName) => {
  if (!avatar) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`;
  }
  if (!avatar.startsWith('http')) {
    return `${process.env.API_URL || 'http://localhost:5000'}${avatar}`;
  }
  return avatar;
};

// GET /api/chat/unread-count - contador global (badge)
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const userId = req.userId;

    const count = await Message.countDocuments({
      receiver: userId,
      readAt: null
    });

    return res.json({ ok: true, count });
  } catch (error) {
    console.error('❌ Error unread-count:', error);
    return res.status(500).json({ ok: false, count: 0, message: error.message });
  }
});

// GET /api/chat - Obtener todos los chats del usuario
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    console.log('📥 Obteniendo chats para usuario:', userId);

    const currentUser = await User.findById(userId);
    if (!currentUser) {
      console.log('❌ Usuario no encontrado:', userId);
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    console.log('✅ Usuario autenticado:', currentUser.name);

    const chats = await Chat.find({
      participants: userId
    })
      .populate({
        path: 'participants',
        select: 'name email avatar bio'
      })
      .sort({ updatedAt: -1 })
      .lean();

    console.log(`📦 Chats encontrados: ${chats.length}`);

    if (chats.length === 0) {
      console.log('ℹ️ No hay chats para este usuario');
      return res.json([]);
    }

    const unreadByChatAgg = await Message.aggregate([
      {
        $match: {
          receiver: new (require('mongoose')).Types.ObjectId(userId),
          readAt: null
        }
      },
      {
        $group: {
          _id: '$chat',
          count: { $sum: 1 }
        }
      }
    ]);

    const unreadMap = new Map(unreadByChatAgg.map(x => [x._id.toString(), x.count]));

    const formattedChats = chats.map((chat, index) => {
      console.log(`📋 Procesando chat ${index + 1}:`, chat._id);
      console.log('👥 Participantes:', chat.participants?.map(p => p?.name || 'Sin nombre'));

      const otherUser = chat.participants?.find(p => {
        if (!p || !p._id) {
          console.warn('⚠️ Participante sin datos:', p);
          return false;
        }
        return p._id.toString() !== userId.toString();
      });

      if (!otherUser) {
        console.warn('⚠️ No se encontró otro participante en el chat:', chat._id);
        return null;
      }

      console.log('👤 Otro usuario encontrado:', otherUser.name);

      const userName = otherUser.name || 'Usuario Desconocido';
      const avatarUrl = buildAvatarUrl(otherUser.avatar, userName); // ✅ corregido
      const unread = unreadMap.get(chat._id.toString()) || 0;

      return {
        id: chat._id.toString(),
        _id: chat._id.toString(),
        name: userName,
        avatar: avatarUrl,
        lastMessage: chat.lastMessage || 'Sin mensajes',
        online: false,
        unread,
        petRelated: chat.petRelated,
        updatedAt: chat.updatedAt
      };
    }).filter(Boolean);

    console.log(`✅ Enviando ${formattedChats.length} chats formateados`);
    res.json(formattedChats);
  } catch (error) {
    console.error('❌ Error completo al obtener chats:', error);
    res.status(500).json({
      error: 'Error al obtener chats',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET /api/chat/:chatId/messages - Obtener mensajes de un chat
router.get('/:chatId/messages', authenticate, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.userId;
    console.log('📥 Obteniendo mensajes del chat:', chatId);

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat no encontrado' });
    }

    const hasAccess = chat.participants.some(p => p.toString() === userId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'No tienes acceso a este chat' });
    }

    const now = new Date();
    await Message.updateMany(
      { chat: chatId, receiver: userId, readAt: null },
      { $set: { read: true, readAt: now, status: 'read' } }
    );

    const messages = await Message.find({ chat: chatId })
      .populate({
        path: 'sender',
        select: 'name avatar'
      })
      .sort({ createdAt: 1 })
      .lean();

    const formattedMessages = messages.map(msg => {
      const senderId = msg.sender?._id?.toString();

      return {
        id: msg._id.toString(),
        text: msg.text,
        time: new Date(msg.createdAt).toLocaleTimeString('es-CO', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        sender: senderId === userId ? 'me' : 'other',
        senderId: senderId,
        senderName: msg.sender?.name || 'Usuario',
        senderAvatar: msg.sender?.avatar,
        status: msg.status || 'sent',
        readAt: msg.readAt || null,
        deliveredAt: msg.deliveredAt || null,
        receiver: msg.receiver ? msg.receiver.toString() : null
      };
    });

    console.log(`✅ Enviando ${formattedMessages.length} mensajes`);
    res.json(formattedMessages);
  } catch (error) {
    console.error('❌ Error al obtener mensajes:', error);
    res.status(500).json({
      error: 'Error al obtener mensajes',
      message: error.message
    });
  }
});

// POST /api/chat/:chatId/messages - Enviar un mensaje
router.post('/:chatId/messages', authenticate, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { text } = req.body;
    const userId = req.userId;

    console.log('📤 Enviando mensaje en chat:', chatId);

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat no encontrado' });
    }

    const hasAccess = chat.participants.some(p => p.toString() === userId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'No tienes acceso a este chat' });
    }

    const otherUserId = getOtherUserIdFromChat(chat, userId);
    if (!otherUserId) {
      return res.status(400).json({ error: 'No se pudo determinar el receptor' });
    }

    const message = new Message({
      chat: chatId,
      sender: userId,
      receiver: otherUserId,
      text: text.trim(),
      status: 'sent'
    });

    await message.save();
    console.log('✅ Mensaje guardado:', message._id);

    chat.lastMessage = text.trim();
    chat.updatedAt = new Date();
    await chat.save();

    await message.populate({ path: 'sender', select: 'name avatar' });

    const formattedMessage = {
      id: message._id.toString(),
      text: message.text,
      time: new Date(message.createdAt).toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      sender: 'me',
      senderId: message.sender._id.toString(),
      senderName: message.sender?.name || 'Usuario',
      senderAvatar: message.sender.avatar,
      status: message.status,
      readAt: message.readAt || null,
      deliveredAt: message.deliveredAt || null,
      receiver: message.receiver ? message.receiver.toString() : null
    };

    console.log('✅ Mensaje enviado exitosamente');
    res.status(201).json(formattedMessage);
  } catch (error) {
    console.error('❌ Error al enviar mensaje:', error);
    res.status(500).json({
      error: 'Error al enviar mensaje',
      message: error.message
    });
  }
});

// POST /api/chat/:chatId/read - marcar leído
router.post('/:chatId/read', authenticate, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.userId;

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ error: 'Chat no encontrado' });

    const hasAccess = chat.participants.some(p => p.toString() === userId);
    if (!hasAccess) return res.status(403).json({ error: 'No tienes acceso a este chat' });

    const now = new Date();
    const result = await Message.updateMany(
      { chat: chatId, receiver: userId, readAt: null },
      { $set: { read: true, readAt: now, status: 'read' } }
    );

    return res.json({ ok: true, modified: result.modifiedCount || 0, readAt: now });
  } catch (error) {
    console.error('❌ Error marcando leído:', error);
    return res.status(500).json({ ok: false, message: error.message });
  }
});

// POST /api/chat - Crear un nuevo chat
router.post('/', authenticate, async (req, res) => {
  try {
    const { otherUserId, petId } = req.body;
    const userId = req.userId;
    console.log('📝 Creando chat entre:', userId, 'y', otherUserId);

    if (!otherUserId) {
      return res.status(400).json({ error: 'Se requiere el ID del otro usuario' });
    }

    const [currentUser, otherUser] = await Promise.all([
      User.findById(userId),
      User.findById(otherUserId)
    ]);

    if (!currentUser || !otherUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    console.log('✅ Usuarios verificados:', currentUser.name, 'y', otherUser.name);

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
      console.log('ℹ️ Chat ya existía:', chat._id);
    }

    await chat.populate({ path: 'participants', select: 'name email avatar' });

    const otherParticipant = chat.participants.find(p => p._id.toString() !== userId);
    const userName = otherParticipant?.name || 'Usuario';
    const avatarUrl = buildAvatarUrl(otherParticipant?.avatar, userName); // ✅ corregido

    res.status(201).json({
      id: chat._id.toString(),
      _id: chat._id.toString(),
      name: userName,
      avatar: avatarUrl,
      lastMessage: chat.lastMessage || '',
      online: false,
      unread: 0
    });
  } catch (error) {
    console.error('❌ Error al crear chat:', error);
    res.status(500).json({
      error: 'Error al crear chat',
      message: error.message
    });
  }
});

console.log('✅ Rutas de chat cargadas');
module.exports = router;