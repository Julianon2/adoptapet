// backend/models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

messageSchema.index({ chat: 1, createdAt: -1 });

console.log('💬 Iniciando creación del modelo Message...');
const Message = mongoose.model('Message', messageSchema);
console.log('✅ Modelo Message creado exitosamente');
console.log('📋 Collection en MongoDB: messages');

module.exports = Message;