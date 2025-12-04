// backend/src/routes/connectionRoutes.js
const express = require('express');
const router = express.Router();
const FriendRequest = require('../models/FriendRequest');
const User = require('../models/User');
const Chat = require('../models/Chat');
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

// ==========================================
// ENVIAR SOLICITUD DE CONEXIÓN
// ==========================================
router.post('/request', authenticate, async (req, res) => {
  try {
    const { receiverId, message, petId } = req.body;
    const senderId = req.userId;

    console.log('📤 Nueva solicitud de conexión');
    console.log('   De:', senderId);
    console.log('   Para:', receiverId);

    // Validaciones
    if (!receiverId) {
      return res.status(400).json({ error: 'receiverId es requerido' });
    }

    if (senderId === receiverId) {
      return res.status(400).json({ error: 'No puedes enviarte solicitud a ti mismo' });
    }

    // Verificar que el receptor existe
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar si ya son amigos
    const sender = await User.findById(senderId);
    if (sender.connections?.includes(receiverId)) {
      return res.status(400).json({ error: 'Ya están conectados' });
    }

    // Verificar si ya hay una solicitud pendiente
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: senderId, receiver: receiverId, status: 'pending' },
        { sender: receiverId, receiver: senderId, status: 'pending' }
      ]
    });

    if (existingRequest) {
      return res.status(400).json({ 
        error: 'Ya existe una solicitud pendiente',
        requestId: existingRequest._id
      });
    }

    // Crear solicitud
    const friendRequest = new FriendRequest({
      sender: senderId,
      receiver: receiverId,
      message: message || '',
      petRelated: petId || null
    });

    await friendRequest.save();
    await friendRequest.populate('sender', 'nombre email avatar');
    await friendRequest.populate('receiver', 'nombre email avatar');

    console.log('✅ Solicitud creada:', friendRequest._id);

    res.status(201).json({
      success: true,
      message: 'Solicitud enviada',
      request: friendRequest
    });
  } catch (error) {
    console.error('❌ Error al enviar solicitud:', error);
    res.status(500).json({ error: 'Error al enviar solicitud' });
  }
});

// ==========================================
// OBTENER MIS SOLICITUDES RECIBIDAS
// ==========================================
router.get('/requests/received', authenticate, async (req, res) => {
  try {
    const userId = req.userId;

    const requests = await FriendRequest.find({
      receiver: userId,
      status: 'pending'
    })
    .populate('sender', 'nombre email avatar role')
    .populate('petRelated', 'nombre imagen')
    .sort({ createdAt: -1 });

    console.log(`📥 ${requests.length} solicitudes recibidas para usuario ${userId}`);

    res.json(requests);
  } catch (error) {
    console.error('❌ Error al obtener solicitudes:', error);
    res.status(500).json({ error: 'Error al obtener solicitudes' });
  }
});

// ==========================================
// OBTENER MIS SOLICITUDES ENVIADAS
// ==========================================
router.get('/requests/sent', authenticate, async (req, res) => {
  try {
    const userId = req.userId;

    const requests = await FriendRequest.find({
      sender: userId,
      status: 'pending'
    })
    .populate('receiver', 'nombre email avatar role')
    .populate('petRelated', 'nombre imagen')
    .sort({ createdAt: -1 });

    console.log(`📤 ${requests.length} solicitudes enviadas por usuario ${userId}`);

    res.json(requests);
  } catch (error) {
    console.error('❌ Error al obtener solicitudes:', error);
    res.status(500).json({ error: 'Error al obtener solicitudes' });
  }
});

// ==========================================
// ACEPTAR SOLICITUD
// ==========================================
router.post('/request/:requestId/accept', authenticate, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.userId;

    console.log('✅ Aceptando solicitud:', requestId);

    const request = await FriendRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    if (request.receiver.toString() !== userId) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Solicitud ya procesada' });
    }

    // Actualizar solicitud
    request.status = 'accepted';
    await request.save();

    // Agregar a conexiones mutuas
    await User.findByIdAndUpdate(request.sender, {
      $addToSet: { connections: request.receiver }
    });

    await User.findByIdAndUpdate(request.receiver, {
      $addToSet: { connections: request.sender }
    });

    // Crear chat automáticamente
    let chat = await Chat.findOne({
      participants: { $all: [request.sender, request.receiver] }
    });

    if (!chat) {
      chat = new Chat({
        participants: [request.sender, request.receiver],
        petRelated: request.petRelated,
        lastMessage: '¡Ahora están conectados! 🎉'
      });
      await chat.save();
      console.log('💬 Chat creado automáticamente:', chat._id);
    }

    await request.populate('sender', 'nombre email avatar');
    await request.populate('receiver', 'nombre email avatar');

    console.log('✅ Solicitud aceptada y chat creado');

    res.json({
      success: true,
      message: 'Solicitud aceptada',
      request,
      chatId: chat._id
    });
  } catch (error) {
    console.error('❌ Error al aceptar solicitud:', error);
    res.status(500).json({ error: 'Error al aceptar solicitud' });
  }
});

// ==========================================
// RECHAZAR SOLICITUD
// ==========================================
router.post('/request/:requestId/reject', authenticate, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.userId;

    console.log('❌ Rechazando solicitud:', requestId);

    const request = await FriendRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    if (request.receiver.toString() !== userId) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Solicitud ya procesada' });
    }

    request.status = 'rejected';
    await request.save();

    console.log('✅ Solicitud rechazada');

    res.json({
      success: true,
      message: 'Solicitud rechazada',
      request
    });
  } catch (error) {
    console.error('❌ Error al rechazar solicitud:', error);
    res.status(500).json({ error: 'Error al rechazar solicitud' });
  }
});

// ==========================================
// VERIFICAR ESTADO DE CONEXIÓN
// ==========================================
router.get('/status/:userId', authenticate, async (req, res) => {
  try {
    const { userId: targetUserId } = req.params;
    const currentUserId = req.userId;

    // Verificar si son amigos
    const currentUser = await User.findById(currentUserId);
    const isConnected = currentUser.connections?.includes(targetUserId);

    if (isConnected) {
      return res.json({ status: 'connected' });
    }

    // Verificar si hay solicitud pendiente
    const request = await FriendRequest.findOne({
      $or: [
        { sender: currentUserId, receiver: targetUserId, status: 'pending' },
        { sender: targetUserId, receiver: currentUserId, status: 'pending' }
      ]
    });

    if (request) {
      return res.json({ 
        status: 'pending',
        requestId: request._id,
        isSender: request.sender.toString() === currentUserId
      });
    }

    res.json({ status: 'none' });
  } catch (error) {
    console.error('❌ Error al verificar estado:', error);
    res.status(500).json({ error: 'Error al verificar estado' });
  }
});

// ==========================================
// OBTENER MIS CONEXIONES
// ==========================================
router.get('/my-connections', authenticate, async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId)
      .populate('connections', 'nombre email avatar role');

    console.log(`👥 ${user.connections?.length || 0} conexiones para usuario ${userId}`);

    res.json(user.connections || []);
  } catch (error) {
    console.error('❌ Error al obtener conexiones:', error);
    res.status(500).json({ error: 'Error al obtener conexiones' });
  }
});

console.log('✅ Rutas de conexión cargadas');
module.exports = router;