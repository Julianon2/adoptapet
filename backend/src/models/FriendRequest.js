// backend/src/models/FriendRequest.js
const mongoose = require('mongoose');

const friendRequestSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  message: {
    type: String,
    trim: true,
    maxlength: 200
  },
  petRelated: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet'
  }
}, {
  timestamps: true
});

// Índices para búsquedas rápidas
friendRequestSchema.index({ sender: 1, receiver: 1 });
friendRequestSchema.index({ receiver: 1, status: 1 });
friendRequestSchema.index({ sender: 1, status: 1 });

// Evitar solicitudes duplicadas
friendRequestSchema.index(
  { sender: 1, receiver: 1, status: 1 },
  { unique: true }
);

console.log('🤝 Iniciando creación del modelo FriendRequest...');
const FriendRequest = mongoose.model('FriendRequest', friendRequestSchema);
console.log('✅ Modelo FriendRequest creado exitosamente');
console.log('📋 Collection en MongoDB: friendrequests');

module.exports = FriendRequest;