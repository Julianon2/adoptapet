//Mensajería directa

// =============================================
// MODELO: MESSAGE (Mensaje)
// Descripción: Mensajes dentro de conversaciones
// =============================================

const mongoose = require('mongoose');

console.log('💌 Iniciando creación del modelo Message...');

const messageSchema = new mongoose.Schema({
    // CONVERSACIÓN
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: [true, 'La conversación es obligatoria'],
        index: true
    },
    
    // REMITENTE
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El remitente es obligatorio'],
        index: true
    },
    
    // TIPO DE MENSAJE
    type: {
        type: String,
        enum: {
            values: ['text', 'image', 'file', 'location', 'audio', 'video', 'system'],
            message: '{VALUE} no es un tipo de mensaje válido'
        },
        default: 'text',
        required: true
    },
    
    // CONTENIDO DEL MENSAJE
    content: {
        text: {
            type: String,
            trim: true,
            maxlength: [5000, 'El mensaje no puede exceder 5000 caracteres']
        },
        // Para imágenes, archivos, audio, video
        attachments: [{
            type: {
                type: String,
                enum: ['image', 'file', 'audio', 'video']
            },
            url: {
                type: String,
                required: true
            },
            filename: String,
            size: Number, // en bytes
            mimeType: String,
            duration: Number, // para audio/video en segundos
            thumbnail: String // para videos
        }],
        // Para ubicaciones
        location: {
            latitude: Number,
            longitude: Number,
            address: String
        }
    },
    
    // MENSAJE CITADO/RESPONDIDO
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    
    // MENSAJES REENVIADOS
    forwarded: {
        isForwarded: {
            type: Boolean,
            default: false
        },
        originalMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message'
        },
        forwardedFrom: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    
    // ESTADO DE LECTURA
    readBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // REACCIONES
    reactions: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        emoji: {
            type: String,
            required: true
        },
        reactedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // METADATA
    metadata: {
        edited: {
            isEdited: {
                type: Boolean,
                default: false
            },
            editedAt: Date,
            editHistory: [{
                content: String,
                editedAt: Date
            }]
        },
        pinned: {
            isPinned: {
                type: Boolean,
                default: false
            },
            pinnedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            pinnedAt: Date
        }
    },
    
    // ESTADO
    status: {
        type: String,
        enum: {
            values: ['sending', 'sent', 'delivered', 'failed', 'deleted'],
            message: '{VALUE} no es un estado válido'
        },
        default: 'sending',
        index: true
    },
    
    // FECHAS
    sentAt: {
        type: Date,
        index: true
    },
    deliveredAt: {
        type: Date
    },
    deletedAt: {
        type: Date
    },
    deletedFor: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
    
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// =============================================
// CAMPOS VIRTUALES
// =============================================

// Tipo de mensaje en español
messageSchema.virtual('typeText').get(function() {
    const typeMap = {
        'text': 'Texto',
        'image': 'Imagen',
        'file': 'Archivo',
        'location': 'Ubicación',
        'audio': 'Audio',
        'video': 'Video',
        'system': 'Sistema'
    };
    return typeMap[this.type] || this.type;
});

// Estado en español
messageSchema.virtual('statusText').get(function() {
    const statusMap = {
        'sending': 'Enviando',
        'sent': 'Enviado',
        'delivered': 'Entregado',
        'failed': 'Fallido',
        'deleted': 'Eliminado'
    };
    return statusMap[this.status] || this.status;
});

// Verificar si fue leído
messageSchema.virtual('isRead').get(function() {
    return this.readBy && this.readBy.length > 0;
});

// Número de lecturas
messageSchema.virtual('readCount').get(function() {
    return this.readBy ? this.readBy.length : 0;
});

// Tiene archivos adjuntos
messageSchema.virtual('hasAttachments').get(function() {
    return this.content.attachments && this.content.attachments.length > 0;
});

// Tiempo desde envío
messageSchema.virtual('timeAgo').get(function() {
    const date = this.sentAt || this.createdAt;
    if (!date) return 'enviando...';
    
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `hace ${days} ${days === 1 ? 'día' : 'días'}`;
    if (hours > 0) return `hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    if (minutes > 0) return `hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
    return 'justo ahora';
});

// =============================================
// ÍNDICES
// =============================================

// Índice para mensajes de una conversación
messageSchema.index({ conversation: 1, sentAt: -1, status: 1 });

// Índice para mensajes de un usuario
messageSchema.index({ sender: 1, sentAt: -1 });

// Índice para mensajes no leídos
messageSchema.index({ conversation: 1, status: 1, 'readBy.user': 1 });

// Índice para búsqueda de texto
messageSchema.index({ 'content.text': 'text' });

// =============================================
// MÉTODOS DE INSTANCIA
// =============================================

// Marcar como leído por un usuario
messageSchema.methods.markAsRead = async function(userId) {
    // Verificar si ya fue leído por este usuario
    const alreadyRead = this.readBy.some(r => 
        r.user.toString() === userId.toString()
    );
    
    if (alreadyRead) {
        return this;
    }
    
    // No marcar como leído si el usuario es el remitente
    if (this.sender.toString() === userId.toString()) {
        return this;
    }
    
    this.readBy.push({
        user: userId,
        readAt: new Date()
    });
    
    if (this.status === 'sent') {
        this.status = 'delivered';
        this.deliveredAt = new Date();
    }
    
    await this.save();
    return this;
};

// Agregar reacción
messageSchema.methods.addReaction = async function(userId, emoji) {
    // Verificar si ya reaccionó
    const existingReaction = this.reactions.find(r => 
        r.user.toString() === userId.toString()
    );
    
    if (existingReaction) {
        // Actualizar emoji
        existingReaction.emoji = emoji;
        existingReaction.reactedAt = new Date();
    } else {
        // Agregar nueva reacción
        this.reactions.push({
            user: userId,
            emoji: emoji,
            reactedAt: new Date()
        });
    }
    
    await this.save();
    return this;
};

// Remover reacción
messageSchema.methods.removeReaction = async function(userId) {
    this.reactions = this.reactions.filter(r => 
        r.user.toString() !== userId.toString()
    );
    
    await this.save();
    return this;
};

// Editar mensaje
messageSchema.methods.edit = async function(newContent) {
    if (this.type !== 'text') {
        throw new Error('Solo se pueden editar mensajes de texto');
    }
    
    // Guardar en historial
    if (!this.metadata.edited.editHistory) {
        this.metadata.edited.editHistory = [];
    }
    
    this.metadata.edited.editHistory.push({
        content: this.content.text,
        editedAt: new Date()
    });
    
    // Actualizar contenido
    this.content.text = newContent;
    this.metadata.edited.isEdited = true;
    this.metadata.edited.editedAt = new Date();
    
    await this.save();
    return this;
};

// Fijar mensaje
messageSchema.methods.pin = async function(userId) {
    this.metadata.pinned.isPinned = true;
    this.metadata.pinned.pinnedBy = userId;
    this.metadata.pinned.pinnedAt = new Date();
    
    await this.save();
    return this;
};

// Desfijar mensaje
messageSchema.methods.unpin = async function() {
    this.metadata.pinned.isPinned = false;
    this.metadata.pinned.pinnedBy = null;
    this.metadata.pinned.pinnedAt = null;
    
    await this.save();
    return this;
};

// Eliminar mensaje para un usuario específico
messageSchema.methods.deleteForUser = async function(userId) {
    if (!this.deletedFor.includes(userId)) {
        this.deletedFor.push(userId);
    }
    
    await this.save();
    return this;
};

// Eliminar mensaje para todos (soft delete)
messageSchema.methods.softDelete = async function() {
    this.status = 'deleted';
    this.deletedAt = new Date();
    await this.save();
    return this;
};

// =============================================
// MÉTODOS ESTÁTICOS
// =============================================

// Enviar mensaje de texto
messageSchema.statics.sendText = async function(conversationId, senderId, text) {
    const message = new this({
        conversation: conversationId,
        sender: senderId,
        type: 'text',
        content: { text: text },
        status: 'sent',
        sentAt: new Date()
    });
    
    await message.save();
    
    // Actualizar última actividad de la conversación
    const Conversation = mongoose.model('Conversation');
    await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: message._id,
        lastMessageAt: message.sentAt,
        $inc: { messageCount: 1 }
    });
    
    return message;
};

// Enviar mensaje con archivo
messageSchema.statics.sendWithAttachment = async function(conversationId, senderId, attachmentData, text = null) {
    const message = new this({
        conversation: conversationId,
        sender: senderId,
        type: attachmentData.type,
        content: {
            text: text,
            attachments: [attachmentData]
        },
        status: 'sent',
        sentAt: new Date()
    });
    
    await message.save();
    
    // Actualizar conversación
    const Conversation = mongoose.model('Conversation');
    await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: message._id,
        lastMessageAt: message.sentAt,
        $inc: { messageCount: 1 }
    });
    
    return message;
};

// Obtener mensajes de una conversación
messageSchema.statics.getConversationMessages = async function(conversationId, userId, options = {}) {
    const {
        page = 1,
        limit = 50,
        before = null, // Cargar mensajes antes de esta fecha
        after = null,  // Cargar mensajes después de esta fecha
        includeDeleted = false
    } = options;
    
    const skip = (page - 1) * limit;
    
    const query = {
        conversation: conversationId,
        deletedFor: { $ne: userId }
    };
    
    if (!includeDeleted) {
        query.status = { $ne: 'deleted' };
    }
    
    if (before) {
        query.sentAt = { $lt: new Date(before) };
    }
    
    if (after) {
        query.sentAt = { $gt: new Date(after) };
    }
    
    return this.find(query)
        .sort({ sentAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sender', 'nombre avatar verified')
        .populate('replyTo', 'content.text sender')
        .populate('reactions.user', 'nombre avatar')
        .lean();
};

// Obtener mensajes no leídos de una conversación
messageSchema.statics.getUnreadMessages = async function(conversationId, userId) {
    return this.find({
        conversation: conversationId,
        sender: { $ne: userId },
        status: { $in: ['sent', 'delivered'] },
        'readBy.user': { $ne: userId },
        deletedFor: { $ne: userId }
    })
    .sort({ sentAt: 1 })
    .populate('sender', 'nombre avatar verified')
    .lean();
};

// Buscar mensajes por texto
messageSchema.statics.searchMessages = async function(conversationId, searchText, options = {}) {
    const { limit = 20 } = options;
    
    return this.find({
        conversation: conversationId,
        'content.text': { $regex: searchText, $options: 'i' },
        status: { $ne: 'deleted' }
    })
    .sort({ sentAt: -1 })
    .limit(limit)
    .populate('sender', 'nombre avatar')
    .lean();
};

// Obtener mensajes fijados
messageSchema.statics.getPinnedMessages = async function(conversationId) {
    return this.find({
        conversation: conversationId,
        'metadata.pinned.isPinned': true,
        status: { $ne: 'deleted' }
    })
    .sort({ 'metadata.pinned.pinnedAt': -1 })
    .populate('sender', 'nombre avatar')
    .lean();
};

// Obtener archivos multimedia de una conversación
messageSchema.statics.getMediaFiles = async function(conversationId, mediaType = null, options = {}) {
    const { limit = 50, page = 1 } = options;
    const skip = (page - 1) * limit;
    
    const query = {
        conversation: conversationId,
        type: { $in: ['image', 'video', 'audio', 'file'] },
        status: { $ne: 'deleted' }
    };
    
    if (mediaType) {
        query.type = mediaType;
    }
    
    return this.find(query)
        .sort({ sentAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sender', 'nombre avatar')
        .select('type content.attachments sender sentAt')
        .lean();
};

// Contar mensajes no leídos por conversación para un usuario
messageSchema.statics.getUnreadCountByConversation = async function(userId) {
    return this.aggregate([
        {
            $match: {
                sender: { $ne: new mongoose.Types.ObjectId(userId) },
                status: { $in: ['sent', 'delivered'] },
                'readBy.user': { $ne: new mongoose.Types.ObjectId(userId) },
                deletedFor: { $ne: new mongoose.Types.ObjectId(userId) }
            }
        },
        {
            $group: {
                _id: '$conversation',
                unreadCount: { $sum: 1 }
            }
        }
    ]);
};

// Marcar todos los mensajes de una conversación como leídos
messageSchema.statics.markAllAsRead = async function(conversationId, userId) {
    const messages = await this.find({
        conversation: conversationId,
        sender: { $ne: userId },
        'readBy.user': { $ne: userId },
        status: { $ne: 'deleted' },
        deletedFor: { $ne: userId }
    });
    
    const bulkOps = messages.map(message => ({
        updateOne: {
            filter: { _id: message._id },
            update: {
                $push: { readBy: { user: userId, readAt: new Date() } },
                $set: { status: 'delivered', deliveredAt: new Date() }
            }
        }
    }));
    
    if (bulkOps.length > 0) {
        await this.bulkWrite(bulkOps);
    }
    
    return bulkOps.length;
};

// Eliminar mensajes antiguos (limpieza)
messageSchema.statics.deleteOldMessages = async function(daysOld = 365) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const result = await this.deleteMany({
        status: 'deleted',
        deletedAt: { $lt: cutoffDate }
    });
    
    return result.deletedCount;
};

// =============================================
// MIDDLEWARE
// =============================================

// PRE-SAVE: Validaciones
messageSchema.pre('save', function(next) {
    console.log(`💌 Procesando mensaje antes de guardar...`);
    
    // Validar contenido según tipo
    if (this.type === 'text' && !this.content.text) {
        return next(new Error('Los mensajes de texto deben tener contenido'));
    }
    
    if (['image', 'file', 'audio', 'video'].includes(this.type)) {
        if (!this.content.attachments || this.content.attachments.length === 0) {
            return next(new Error('Los mensajes multimedia deben tener archivos adjuntos'));
        }
    }
    
    if (this.type === 'location' && !this.content.location) {
        return next(new Error('Los mensajes de ubicación deben tener coordenadas'));
    }
    
    // Establecer fecha de envío si aún no existe
    if (this.isNew && !this.sentAt && this.status === 'sent') {
        this.sentAt = new Date();
    }
    
    next();
});

// POST-SAVE: Actualizar conversación y notificar
messageSchema.post('save', async function(doc) {
    console.log(`✅ Mensaje guardado exitosamente:`);
    console.log(`   💌 Tipo: ${doc.typeText}`);
    console.log(`   👤 Remitente: ${doc.sender}`);
    console.log(`   💬 Conversación: ${doc.conversation}`);
    console.log(`   📊 Estado: ${doc.statusText}`);
    
    // Aquí podrías emitir eventos para notificaciones en tiempo real
    // Ejemplo: eventEmitter.emit('message:new', doc);
});

// POST-DELETE: Limpiar referencias
messageSchema.post('deleteOne', { document: true, query: false }, async function(doc) {
    console.log(`🗑️ Mensaje eliminado: ${doc._id}`);
    
    // Actualizar contador en conversación
    const Conversation = mongoose.model('Conversation');
    await Conversation.findByIdAndUpdate(doc.conversation, {
        $inc: { messageCount: -1 }
    });
});

// =============================================
// MÉTODOS DE AYUDA
// =============================================

// Validar tamaño de archivo
messageSchema.statics.validateFileSize = function(size, type) {
    const limits = {
        image: 10 * 1024 * 1024,  // 10MB
        video: 100 * 1024 * 1024, // 100MB
        audio: 20 * 1024 * 1024,  // 20MB
        file: 50 * 1024 * 1024    // 50MB
    };
    
    return size <= (limits[type] || limits.file);
};

// Obtener estadísticas de mensajes
messageSchema.statics.getMessageStats = async function(conversationId) {
    const stats = await this.aggregate([
        {
            $match: {
                conversation: new mongoose.Types.ObjectId(conversationId),
                status: { $ne: 'deleted' }
            }
        },
        {
            $group: {
                _id: null,
                totalMessages: { $sum: 1 },
                textMessages: {
                    $sum: { $cond: [{ $eq: ['$type', 'text'] }, 1, 0] }
                },
                mediaMessages: {
                    $sum: { $cond: [{ $in: ['$type', ['image', 'video', 'audio', 'file']] }, 1, 0] }
                },
                totalAttachments: {
                    $sum: { $size: { $ifNull: ['$content.attachments', []] } }
                }
            }
        }
    ]);
    
    return stats[0] || {
        totalMessages: 0,
        textMessages: 0,
        mediaMessages: 0,
        totalAttachments: 0
    };
};

// =============================================
// TRANSFORMACIÓN JSON
// =============================================

messageSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret, options) {
        // Remover campos internos
        delete ret.__v;
        
        // Ocultar mensaje si fue eliminado para el usuario que lo solicita
        if (options.userId && ret.deletedFor && ret.deletedFor.includes(options.userId)) {
            ret.content = { text: 'Este mensaje fue eliminado' };
            ret.type = 'deleted';
        }
        
        return ret;
    }
});

// =============================================
// EXPORTAR MODELO
// =============================================

const Message = mongoose.model('Message', messageSchema);

console.log('✅ Modelo Message creado exitosamente');
console.log('📋 Collection en MongoDB: messages');
console.log('📦 Modelo Message exportado y listo para usar');

module.exports = Message;