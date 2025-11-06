 // =============================================
// MODELO: CONVERSATION (Conversación)
// Descripción: Gestiona conversaciones individuales y grupales
// =============================================

const mongoose = require('mongoose');

console.log('💬 Iniciando creación del modelo Conversation...');

const conversationSchema = new mongoose.Schema({
    // TIPO DE CONVERSACIÓN
    type: {
        type: String,
        enum: {
            values: ['individual', 'group'],
            message: '{VALUE} no es un tipo válido de conversación'
        },
        default: 'individual',
        required: true
    },
    
    // PARTICIPANTES
    participants: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        role: {
            type: String,
            enum: ['admin', 'member'],
            default: 'member'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        },
        leftAt: {
            type: Date
        },
        isActive: {
            type: Boolean,
            default: true
        },
        // Último mensaje leído por este participante
        lastReadMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message'
        },
        lastReadAt: {
            type: Date
        },
        // Notificaciones silenciadas
        isMuted: {
            type: Boolean,
            default: false
        },
        mutedUntil: {
            type: Date
        }
    }],
    
    // INFORMACIÓN DEL GRUPO (solo para conversaciones grupales)
    groupInfo: {
        name: {
            type: String,
            trim: true,
            maxlength: [100, 'El nombre del grupo no puede exceder 100 caracteres']
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'La descripción no puede exceder 500 caracteres']
        },
        avatar: {
            type: String,
            trim: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    
    // ÚLTIMO MENSAJE (para ordenar conversaciones)
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    lastMessageAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    
    // ESTADÍSTICAS
    messageCount: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // ESTADO
    status: {
        type: String,
        enum: {
            values: ['active', 'archived', 'deleted'],
            message: '{VALUE} no es un estado válido'
        },
        default: 'active',
        index: true
    },
    
    // CONTEXTO (para mensajes relacionados con adopciones)
    context: {
        type: {
            type: String,
            enum: ['general', 'adoption', 'shelter', 'support']
        },
        referenceId: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'context.referenceModel'
        },
        referenceModel: {
            type: String,
            enum: ['Pet', 'Shelter', 'Post']
        }
    },
    
    // FECHAS
    archivedAt: {
        type: Date
    },
    deletedAt: {
        type: Date
    }
    
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// =============================================
// CAMPOS VIRTUALES
// =============================================

// Tipo de conversación en español
conversationSchema.virtual('typeText').get(function() {
    const typeMap = {
        'individual': 'Individual',
        'group': 'Grupo'
    };
    return typeMap[this.type] || this.type;
});

// Estado en español
conversationSchema.virtual('statusText').get(function() {
    const statusMap = {
        'active': 'Activa',
        'archived': 'Archivada',
        'deleted': 'Eliminada'
    };
    return statusMap[this.status] || this.status;
});

// Participantes activos
conversationSchema.virtual('activeParticipants').get(function() {
    return this.participants.filter(p => p.isActive && !p.leftAt);
});

// Número de participantes activos
conversationSchema.virtual('participantCount').get(function() {
    return this.activeParticipants.length;
});

// Tiempo desde último mensaje
conversationSchema.virtual('lastMessageTimeAgo').get(function() {
    if (!this.lastMessageAt) return 'Sin mensajes';
    
    const now = new Date();
    const diff = now - this.lastMessageAt;
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

// Índice para buscar conversaciones de un usuario
conversationSchema.index({ 'participants.user': 1, status: 1, lastMessageAt: -1 });

// Índice para conversaciones activas
conversationSchema.index({ status: 1, lastMessageAt: -1 });

// Índice para conversaciones individuales (evitar duplicados)
conversationSchema.index({ type: 1, 'participants.user': 1 }, { 
    unique: true, 
    partialFilterExpression: { type: 'individual' }
});

// Índice para búsqueda por contexto
conversationSchema.index({ 'context.type': 1, 'context.referenceId': 1 });

// =============================================
// MÉTODOS DE INSTANCIA
// =============================================

// Agregar participante
conversationSchema.methods.addParticipant = async function(userId, role = 'member') {
    // Verificar si ya es participante
    const existing = this.participants.find(p => 
        p.user.toString() === userId.toString()
    );
    
    if (existing) {
        if (!existing.isActive || existing.leftAt) {
            // Reactivar participante
            existing.isActive = true;
            existing.leftAt = null;
            existing.joinedAt = new Date();
        } else {
            throw new Error('El usuario ya es participante de esta conversación');
        }
    } else {
        this.participants.push({
            user: userId,
            role: role,
            joinedAt: new Date()
        });
    }
    
    await this.save();
    return this;
};

// Remover participante
conversationSchema.methods.removeParticipant = async function(userId) {
    const participant = this.participants.find(p => 
        p.user.toString() === userId.toString() && p.isActive
    );
    
    if (!participant) {
        throw new Error('Usuario no encontrado en la conversación');
    }
    
    participant.isActive = false;
    participant.leftAt = new Date();
    
    await this.save();
    return this;
};

// Marcar como leído para un usuario
conversationSchema.methods.markAsRead = async function(userId, messageId = null) {
    const participant = this.participants.find(p => 
        p.user.toString() === userId.toString()
    );
    
    if (!participant) {
        throw new Error('Usuario no encontrado en la conversación');
    }
    
    participant.lastReadMessage = messageId || this.lastMessage;
    participant.lastReadAt = new Date();
    
    await this.save();
    return this;
};

// Silenciar notificaciones
conversationSchema.methods.mute = async function(userId, duration = null) {
    const participant = this.participants.find(p => 
        p.user.toString() === userId.toString()
    );
    
    if (!participant) {
        throw new Error('Usuario no encontrado en la conversación');
    }
    
    participant.isMuted = true;
    
    if (duration) {
        const mutedUntil = new Date();
        mutedUntil.setHours(mutedUntil.getHours() + duration);
        participant.mutedUntil = mutedUntil;
    }
    
    await this.save();
    return this;
};

// Activar notificaciones
conversationSchema.methods.unmute = async function(userId) {
    const participant = this.participants.find(p => 
        p.user.toString() === userId.toString()
    );
    
    if (!participant) {
        throw new Error('Usuario no encontrado en la conversación');
    }
    
    participant.isMuted = false;
    participant.mutedUntil = null;
    
    await this.save();
    return this;
};

// Archivar conversación
conversationSchema.methods.archive = async function() {
    this.status = 'archived';
    this.archivedAt = new Date();
    await this.save();
    return this;
};

// Desarchivar conversación
conversationSchema.methods.unarchive = async function() {
    this.status = 'active';
    this.archivedAt = null;
    await this.save();
    return this;
};

// Eliminar conversación (soft delete)
conversationSchema.methods.softDelete = async function() {
    this.status = 'deleted';
    this.deletedAt = new Date();
    await this.save();
    return this;
};

// Actualizar información del grupo
conversationSchema.methods.updateGroupInfo = async function(updates) {
    if (this.type !== 'group') {
        throw new Error('Solo se puede actualizar información en conversaciones grupales');
    }
    
    const allowedUpdates = ['name', 'description', 'avatar'];
    Object.keys(updates).forEach(key => {
        if (allowedUpdates.includes(key)) {
            this.groupInfo[key] = updates[key];
        }
    });
    
    await this.save();
    return this;
};

// Obtener mensajes no leídos para un usuario
conversationSchema.methods.getUnreadCount = async function(userId) {
    const Message = mongoose.model('Message');
    
    const participant = this.participants.find(p => 
        p.user.toString() === userId.toString()
    );
    
    if (!participant) return 0;
    
    const query = {
        conversation: this._id,
        status: 'sent',
        'sender': { $ne: userId }
    };
    
    if (participant.lastReadMessage) {
        query.createdAt = { $gt: participant.lastReadAt || new Date(0) };
    }
    
    return Message.countDocuments(query);
};

// =============================================
// MÉTODOS ESTÁTICOS
// =============================================

// Crear conversación individual
conversationSchema.statics.createIndividual = async function(user1Id, user2Id, context = null) {
    // Verificar que no sea el mismo usuario
    if (user1Id.toString() === user2Id.toString()) {
        throw new Error('No puedes crear una conversación contigo mismo');
    }
    
    // Ordenar IDs para evitar duplicados
    const sortedIds = [user1Id, user2Id].sort();
    
    // Buscar conversación existente
    const existing = await this.findOne({
        type: 'individual',
        'participants.user': { $all: sortedIds },
        status: { $ne: 'deleted' }
    });
    
    if (existing) {
        // Reactivar si estaba archivada
        if (existing.status === 'archived') {
            await existing.unarchive();
        }
        return existing;
    }
    
    // Crear nueva conversación
    const conversation = new this({
        type: 'individual',
        participants: [
            { user: user1Id, role: 'member' },
            { user: user2Id, role: 'member' }
        ],
        context: context
    });
    
    await conversation.save();
    return conversation;
};

// Crear conversación grupal
conversationSchema.statics.createGroup = async function(creatorId, participantIds, groupInfo) {
    // Validar que haya al menos 2 participantes además del creador
    if (!participantIds || participantIds.length < 2) {
        throw new Error('Un grupo debe tener al menos 3 participantes');
    }
    
    // Agregar creador si no está en la lista
    if (!participantIds.includes(creatorId)) {
        participantIds.unshift(creatorId);
    }
    
    // Crear participantes
    const participants = participantIds.map(userId => ({
        user: userId,
        role: userId.toString() === creatorId.toString() ? 'admin' : 'member'
    }));
    
    // Crear conversación
    const conversation = new this({
        type: 'group',
        participants: participants,
        groupInfo: {
            ...groupInfo,
            createdBy: creatorId
        }
    });
    
    await conversation.save();
    return conversation;
};

// Obtener conversaciones de un usuario
conversationSchema.statics.getUserConversations = async function(userId, options = {}) {
    const {
        page = 1,
        limit = 20,
        status = 'active',
        includeArchived = false
    } = options;
    
    const skip = (page - 1) * limit;
    
    const query = {
        'participants.user': userId,
        'participants.isActive': true
    };
    
    if (includeArchived) {
        query.status = { $in: ['active', 'archived'] };
    } else {
        query.status = status;
    }
    
    return this.find(query)
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('participants.user', 'nombre avatar verified')
        .populate('lastMessage')
        .lean();
};

// Buscar conversación entre usuarios
conversationSchema.statics.findBetweenUsers = async function(user1Id, user2Id) {
    const sortedIds = [user1Id, user2Id].sort();
    
    return this.findOne({
        type: 'individual',
        'participants.user': { $all: sortedIds },
        status: { $ne: 'deleted' }
    })
    .populate('participants.user', 'nombre avatar verified')
    .populate('lastMessage');
};

// =============================================
// MIDDLEWARE
// =============================================

// PRE-SAVE: Validaciones
conversationSchema.pre('save', function(next) {
    console.log(`💬 Procesando conversación antes de guardar...`);
    
    // Validar que conversaciones individuales tengan exactamente 2 participantes activos
    if (this.type === 'individual') {
        const activeParticipants = this.participants.filter(p => p.isActive && !p.leftAt);
        if (activeParticipants.length !== 2) {
            return next(new Error('Una conversación individual debe tener exactamente 2 participantes'));
        }
    }
    
    // Validar que grupos tengan al menos 3 participantes activos
    if (this.type === 'group') {
        const activeParticipants = this.participants.filter(p => p.isActive && !p.leftAt);
        if (activeParticipants.length < 3) {
            return next(new Error('Un grupo debe tener al menos 3 participantes'));
        }
        
        // Validar que haya información del grupo
        if (!this.groupInfo || !this.groupInfo.name) {
            return next(new Error('Los grupos deben tener un nombre'));
        }
    }
    
    next();
});

// POST-SAVE: Logs
conversationSchema.post('save', function(doc) {
    console.log(`✅ Conversación guardada exitosamente:`);
    console.log(`   💬 Tipo: ${doc.typeText}`);
    console.log(`   👥 Participantes: ${doc.participantCount}`);
    console.log(`   📊 Estado: ${doc.statusText}`);
    console.log(`   💌 Mensajes: ${doc.messageCount}`);
});

// =============================================
// EXPORTAR MODELO
// =============================================

const Conversation = mongoose.model('Conversation', conversationSchema);

console.log('✅ Modelo Conversation creado exitosamente');
console.log('📋 Collection en MongoDB: conversations');
console.log('📦 Modelo Conversation exportado y listo para usar');

module.exports = Conversation;