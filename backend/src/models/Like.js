//Likes/reacciones

// =============================================
// MODELO: LIKE (Me gusta)
// Descripción: Sistema de likes para posts y comentarios
// =============================================

const mongoose = require('mongoose');

console.log('❤️ Iniciando creación del modelo Like...');

const likeSchema = new mongoose.Schema({
    // RELACIONES
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El usuario es obligatorio'],
        index: true
    },
    
    // TIPO DE CONTENIDO (POST O COMENTARIO)
    targetType: {
        type: String,
        enum: {
            values: ['Post', 'Comment'],
            message: '{VALUE} no es un tipo válido'
        },
        required: [true, 'El tipo de contenido es obligatorio']
    },
    
    // REFERENCIA AL CONTENIDO
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'El ID del contenido es obligatorio'],
        refPath: 'targetType',
        index: true
    },
    
    // TIPO DE REACCIÓN
    reactionType: {
        type: String,
        enum: {
            values: ['like', 'love', 'care', 'wow', 'sad', 'angry'],
            message: '{VALUE} no es un tipo de reacción válido'
        },
        default: 'like'
    },
    
    // METADATA
    isAnonymous: {
        type: Boolean,
        default: false
    },
    
    // INFORMACIÓN DEL AUTOR DEL CONTENIDO (para notificaciones)
    contentAuthor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    
    // ESTADO
    status: {
        type: String,
        enum: {
            values: ['active', 'removed'],
            message: '{VALUE} no es un estado válido'
        },
        default: 'active',
        index: true
    },
    
    // FECHAS
    likedAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    removedAt: {
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

// Tipo de reacción en español
likeSchema.virtual('reactionText').get(function() {
    const reactionMap = {
        'like': 'Me gusta',
        'love': 'Me encanta',
        'care': 'Me importa',
        'wow': 'Me asombra',
        'sad': 'Me entristece',
        'angry': 'Me enoja'
    };
    return reactionMap[this.reactionType] || this.reactionType;
});

// Emoji de la reacción
likeSchema.virtual('reactionEmoji').get(function() {
    const emojiMap = {
        'like': '👍',
        'love': '❤️',
        'care': '🤗',
        'wow': '😮',
        'sad': '😢',
        'angry': '😠'
    };
    return emojiMap[this.reactionType] || '👍';
});

// Estado en español
likeSchema.virtual('statusText').get(function() {
    const statusMap = {
        'active': 'Activo',
        'removed': 'Removido'
    };
    return statusMap[this.status] || this.status;
});

// Tipo de contenido en español
likeSchema.virtual('targetTypeText').get(function() {
    const typeMap = {
        'Post': 'Publicación',
        'Comment': 'Comentario'
    };
    return typeMap[this.targetType] || this.targetType;
});

// Tiempo desde que dio like
likeSchema.virtual('timeAgo').get(function() {
    const now = new Date();
    const diff = now - this.likedAt;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    
    if (months > 0) return `hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
    if (weeks > 0) return `hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
    if (days > 0) return `hace ${days} ${days === 1 ? 'día' : 'días'}`;
    if (hours > 0) return `hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    if (minutes > 0) return `hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
    return 'justo ahora';
});

// =============================================
// ÍNDICES
// =============================================

// Índice único compuesto (un usuario no puede dar like dos veces al mismo contenido)
likeSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });

// Índice para buscar likes de un contenido
likeSchema.index({ targetType: 1, targetId: 1, status: 1, likedAt: -1 });

// Índice para buscar likes de un usuario
likeSchema.index({ user: 1, status: 1, likedAt: -1 });

// Índice para notificaciones (likes recibidos)
likeSchema.index({ contentAuthor: 1, status: 1, likedAt: -1 });

// Índice para estadísticas por tipo de reacción
likeSchema.index({ targetType: 1, targetId: 1, reactionType: 1 });

// =============================================
// MÉTODOS DE INSTANCIA
// =============================================

// Remover like
likeSchema.methods.remove = async function() {
    this.status = 'removed';
    this.removedAt = new Date();
    await this.save();
    return this;
};

// Cambiar tipo de reacción
likeSchema.methods.changeReaction = async function(newReactionType) {
    const validReactions = ['like', 'love', 'care', 'wow', 'sad', 'angry'];
    
    if (!validReactions.includes(newReactionType)) {
        throw new Error('Tipo de reacción no válido');
    }
    
    this.reactionType = newReactionType;
    await this.save();
    return this;
};

// Reactivar like removido
likeSchema.methods.reactivate = async function() {
    this.status = 'active';
    this.removedAt = null;
    this.likedAt = new Date();
    await this.save();
    return this;
};

// =============================================
// MÉTODOS ESTÁTICOS
// =============================================

// Dar like a un contenido
likeSchema.statics.addLike = async function(userId, targetType, targetId, reactionType = 'like', contentAuthorId = null) {
    // Verificar si ya existe el like
    const existing = await this.findOne({
        user: userId,
        targetType: targetType,
        targetId: targetId
    });
    
    if (existing) {
        // Si existe pero está removido, reactivarlo
        if (existing.status === 'removed') {
            existing.reactionType = reactionType;
            await existing.reactivate();
            return existing;
        }
        
        // Si ya existe activo, cambiar el tipo de reacción
        if (existing.reactionType !== reactionType) {
            await existing.changeReaction(reactionType);
            return existing;
        }
        
        throw new Error('Ya diste like a este contenido');
    }
    
    // Crear nuevo like
    const like = new this({
        user: userId,
        targetType: targetType,
        targetId: targetId,
        reactionType: reactionType,
        contentAuthor: contentAuthorId
    });
    
    await like.save();
    return like;
};

// Remover like de un contenido
likeSchema.statics.removeLike = async function(userId, targetType, targetId) {
    const like = await this.findOne({
        user: userId,
        targetType: targetType,
        targetId: targetId,
        status: 'active'
    });
    
    if (!like) {
        throw new Error('No has dado like a este contenido');
    }
    
    await like.remove();
    return like;
};

// Verificar si un usuario dio like
likeSchema.statics.hasLiked = async function(userId, targetType, targetId) {
    const like = await this.findOne({
        user: userId,
        targetType: targetType,
        targetId: targetId,
        status: 'active'
    });
    
    return !!like;
};

// Obtener tipo de reacción de un usuario
likeSchema.statics.getUserReaction = async function(userId, targetType, targetId) {
    const like = await this.findOne({
        user: userId,
        targetType: targetType,
        targetId: targetId,
        status: 'active'
    });
    
    return like ? like.reactionType : null;
};

// Obtener likes de un contenido
likeSchema.statics.getLikesByContent = async function(targetType, targetId, options = {}) {
    const {
        page = 1,
        limit = 20,
        reactionType = null,
        includeRemoved = false
    } = options;
    
    const skip = (page - 1) * limit;
    
    const query = {
        targetType: targetType,
        targetId: targetId
    };
    
    if (!includeRemoved) {
        query.status = 'active';
    }
    
    if (reactionType) {
        query.reactionType = reactionType;
    }
    
    return this.find(query)
        .sort({ likedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'nombre avatar role verified')
        .lean();
};

// Obtener likes de un usuario
likeSchema.statics.getLikesByUser = async function(userId, options = {}) {
    const {
        page = 1,
        limit = 20,
        targetType = null,
        status = 'active'
    } = options;
    
    const skip = (page - 1) * limit;
    
    const query = {
        user: userId,
        status: status
    };
    
    if (targetType) {
        query.targetType = targetType;
    }
    
    return this.find(query)
        .sort({ likedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('targetId')
        .lean();
};

// Contar likes de un contenido
likeSchema.statics.countLikes = async function(targetType, targetId, reactionType = null) {
    const query = {
        targetType: targetType,
        targetId: targetId,
        status: 'active'
    };
    
    if (reactionType) {
        query.reactionType = reactionType;
    }
    
    return this.countDocuments(query);
};

// Obtener estadísticas de reacciones de un contenido
// ✅ CORREGIDO: Agregado 'new' antes de mongoose.Types.ObjectId
likeSchema.statics.getReactionStats = async function(targetType, targetId) {
    // Convertir targetId a ObjectId si es necesario
    const objectId = targetId instanceof mongoose.Types.ObjectId 
        ? targetId 
        : new mongoose.Types.ObjectId(targetId);
    
    const stats = await this.aggregate([
        {
            $match: {
                targetType: targetType,
                targetId: objectId,  // ✅ CORREGIDO
                status: 'active'
            }
        },
        {
            $group: {
                _id: '$reactionType',
                count: { $sum: 1 }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]);
    
    const total = stats.reduce((sum, stat) => sum + stat.count, 0);
    
    return {
        total: total,
        reactions: stats,
        breakdown: stats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
        }, {})
    };
};

// Obtener contenido más likeado
likeSchema.statics.getMostLikedContent = async function(targetType, options = {}) {
    const {
        limit = 10,
        days = 30
    } = options;
    
    const since = new Date();
    since.setDate(since.getDate() - days);
    
    return this.aggregate([
        {
            $match: {
                targetType: targetType,
                status: 'active',
                likedAt: { $gte: since }
            }
        },
        {
            $group: {
                _id: '$targetId',
                totalLikes: { $sum: 1 },
                reactions: {
                    $push: '$reactionType'
                }
            }
        },
        {
            $sort: { totalLikes: -1 }
        },
        {
            $limit: limit
        }
    ]);
};

// Obtener likes recibidos por un usuario (notificaciones)
likeSchema.statics.getReceivedLikes = async function(userId, options = {}) {
    const {
        page = 1,
        limit = 20,
        unreadOnly = false
    } = options;
    
    const skip = (page - 1) * limit;
    
    return this.find({
        contentAuthor: userId,
        status: 'active'
    })
        .sort({ likedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'nombre avatar verified')
        .populate('targetId')
        .lean();
};

// =============================================
// MIDDLEWARE
// =============================================

// PRE-SAVE: Validaciones
likeSchema.pre('save', function(next) {
    console.log(`❤️ Procesando like antes de guardar...`);
    
    // Validar que el usuario no se de like a sí mismo (opcional, según reglas de negocio)
    // Esta validación requeriría cargar el contenido para verificar el autor
    
    next();
});

// POST-SAVE: Logs
likeSchema.post('save', function(doc) {
    console.log(`✅ Like guardado exitosamente:`);
    console.log(`   👤 Usuario: ${doc.user}`);
    console.log(`   ${doc.reactionEmoji} Reacción: ${doc.reactionText}`);
    console.log(`   📝 Contenido: ${doc.targetTypeText} (${doc.targetId})`);
    console.log(`   📊 Estado: ${doc.statusText}`);
});

// POST-REMOVE: Cleanup
likeSchema.post('deleteOne', { document: true, query: false }, function(doc) {
    console.log(`🗑️ Like eliminado: ${doc._id}`);
});

// =============================================
// TRANSFORMACIÓN JSON
// =============================================

likeSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        // Remover campos internos
        delete ret.__v;
        
        return ret;
    }
});

// =============================================
// EXPORTAR MODELO
// =============================================

const Like = mongoose.model('Like', likeSchema);

console.log('✅ Modelo Like creado exitosamente');
console.log('📋 Collection en MongoDB: likes');
console.log('📦 Modelo Like exportado y listo para usar');

module.exports = Like;