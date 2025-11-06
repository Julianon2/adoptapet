//Seguir usuarios/refugios

// =============================================
// MODELO: FOLLOW (Seguidor)
// Descripción: Sistema de seguidores entre usuarios tipo red social
// =============================================

const mongoose = require('mongoose');

console.log('👥 Iniciando creación del modelo Follow...');

const followSchema = new mongoose.Schema({
    // RELACIONES
    follower: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El seguidor es obligatorio'],
        index: true
    },
    following: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El usuario a seguir es obligatorio'],
        index: true
    },
    
    // TIPO DE SEGUIMIENTO
    type: {
        type: String,
        enum: {
            values: ['user', 'shelter'],
            message: '{VALUE} no es un tipo válido'
        },
        default: 'user'
    },
    
    // CONFIGURACIÓN
    notifications: {
        newPosts: {
            type: Boolean,
            default: true
        },
        adoptionUpdates: {
            type: Boolean,
            default: true
        },
        stories: {
            type: Boolean,
            default: true
        }
    },
    
    // ESTADO
    status: {
        type: String,
        enum: {
            values: ['active', 'blocked', 'muted'],
            message: '{VALUE} no es un estado válido'
        },
        default: 'active',
        index: true
    },
    
    // INTERACCIÓN
    mutedUntil: {
        type: Date,
        default: null
    },
    
    // METADATA
    isCloseFriend: {
        type: Boolean,
        default: false
    },
    notes: {
        type: String,
        maxlength: [500, 'Las notas no pueden exceder 500 caracteres']
    },
    
    // ESTADÍSTICAS DE INTERACCIÓN
    interactions: {
        likesGiven: {
            type: Number,
            default: 0,
            min: 0
        },
        commentsGiven: {
            type: Number,
            default: 0,
            min: 0
        },
        sharesGiven: {
            type: Number,
            default: 0,
            min: 0
        },
        lastInteraction: {
            type: Date
        }
    },
    
    // FECHAS
    followedAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    unfollowedAt: {
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

// Estado en español
followSchema.virtual('statusText').get(function() {
    const statusMap = {
        'active': 'Activo',
        'blocked': 'Bloqueado',
        'muted': 'Silenciado'
    };
    return statusMap[this.status] || this.status;
});

// Tipo en español
followSchema.virtual('typeText').get(function() {
    const typeMap = {
        'user': 'Usuario',
        'shelter': 'Refugio'
    };
    return typeMap[this.type] || this.type;
});

// Días siguiendo
followSchema.virtual('daysSinceFollow').get(function() {
    const now = new Date();
    const diff = now - this.followedAt;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
});

// Está silenciado temporalmente
followSchema.virtual('isMuted').get(function() {
    if (this.status === 'muted' && this.mutedUntil) {
        return new Date() < this.mutedUntil;
    }
    return this.status === 'muted';
});

// Total de interacciones
followSchema.virtual('totalInteractions').get(function() {
    return this.interactions.likesGiven + 
           this.interactions.commentsGiven + 
           this.interactions.sharesGiven;
});

// Nivel de interacción
followSchema.virtual('interactionLevel').get(function() {
    const total = this.totalInteractions;
    if (total === 0) return 'ninguna';
    if (total < 5) return 'baja';
    if (total < 20) return 'media';
    if (total < 50) return 'alta';
    return 'muy-alta';
});

// Tiempo desde última interacción
followSchema.virtual('timeSinceLastInteraction').get(function() {
    if (!this.interactions.lastInteraction) return 'nunca';
    
    const now = new Date();
    const diff = now - this.interactions.lastInteraction;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'hoy';
    if (days === 1) return 'ayer';
    if (days < 7) return `hace ${days} días`;
    if (days < 30) return `hace ${Math.floor(days / 7)} semanas`;
    return `hace ${Math.floor(days / 30)} meses`;
});

// =============================================
// ÍNDICES
// =============================================

// Índice único compuesto (un usuario no puede seguir al mismo usuario dos veces)
followSchema.index({ follower: 1, following: 1 }, { unique: true });

// Índice para buscar seguidores de un usuario
followSchema.index({ following: 1, status: 1, followedAt: -1 });

// Índice para buscar a quién sigue un usuario
followSchema.index({ follower: 1, status: 1, followedAt: -1 });

// Índice para amigos cercanos
followSchema.index({ follower: 1, isCloseFriend: 1 });

// Índice para relaciones silenciadas temporalmente
followSchema.index({ status: 1, mutedUntil: 1 });

// =============================================
// MÉTODOS DE INSTANCIA
// =============================================

// Silenciar notificaciones
followSchema.methods.mute = async function(duration = null) {
    this.status = 'muted';
    
    if (duration) {
        const muteUntil = new Date();
        muteUntil.setHours(muteUntil.getHours() + duration);
        this.mutedUntil = muteUntil;
    } else {
        this.mutedUntil = null;
    }
    
    await this.save();
    return this;
};

// Reactivar notificaciones
followSchema.methods.unmute = async function() {
    this.status = 'active';
    this.mutedUntil = null;
    await this.save();
    return this;
};

// Bloquear seguimiento
followSchema.methods.block = async function() {
    this.status = 'blocked';
    await this.save();
    return this;
};

// Desbloquear seguimiento
followSchema.methods.unblock = async function() {
    this.status = 'active';
    await this.save();
    return this;
};

// Marcar como amigo cercano
followSchema.methods.markAsCloseFriend = async function() {
    this.isCloseFriend = true;
    await this.save();
    return this;
};

// Desmarcar como amigo cercano
followSchema.methods.unmarkAsCloseFriend = async function() {
    this.isCloseFriend = false;
    await this.save();
    return this;
};

// Registrar interacción
followSchema.methods.recordInteraction = async function(interactionType) {
    const validTypes = ['like', 'comment', 'share'];
    
    if (!validTypes.includes(interactionType)) {
        throw new Error('Tipo de interacción no válido');
    }
    
    if (interactionType === 'like') {
        this.interactions.likesGiven += 1;
    } else if (interactionType === 'comment') {
        this.interactions.commentsGiven += 1;
    } else if (interactionType === 'share') {
        this.interactions.sharesGiven += 1;
    }
    
    this.interactions.lastInteraction = new Date();
    await this.save();
    return this;
};

// Configurar notificaciones
followSchema.methods.updateNotifications = async function(settings) {
    if (settings.newPosts !== undefined) {
        this.notifications.newPosts = settings.newPosts;
    }
    if (settings.adoptionUpdates !== undefined) {
        this.notifications.adoptionUpdates = settings.adoptionUpdates;
    }
    if (settings.stories !== undefined) {
        this.notifications.stories = settings.stories;
    }
    
    await this.save();
    return this;
};

// Dejar de seguir
followSchema.methods.unfollow = async function() {
    this.unfollowedAt = new Date();
    await this.deleteOne();
    return this;
};

// =============================================
// MÉTODOS ESTÁTICOS
// =============================================

// Verificar si un usuario sigue a otro
followSchema.statics.isFollowing = async function(followerId, followingId) {
    const follow = await this.findOne({
        follower: followerId,
        following: followingId,
        status: 'active'
    });
    return !!follow;
};

// Seguir a un usuario
followSchema.statics.followUser = async function(followerId, followingId, type = 'user') {
    // Verificar que no se esté siguiendo a sí mismo
    if (followerId.toString() === followingId.toString()) {
        throw new Error('No puedes seguirte a ti mismo');
    }
    
    // Verificar si ya existe la relación
    const existing = await this.findOne({
        follower: followerId,
        following: followingId
    });
    
    if (existing) {
        // Si existe pero está bloqueada, reactivarla
        if (existing.status === 'blocked') {
            existing.status = 'active';
            existing.followedAt = new Date();
            await existing.save();
            return existing;
        }
        throw new Error('Ya sigues a este usuario');
    }
    
    // Crear nueva relación
    const follow = new this({
        follower: followerId,
        following: followingId,
        type: type
    });
    
    await follow.save();
    return follow;
};

// Dejar de seguir a un usuario
followSchema.statics.unfollowUser = async function(followerId, followingId) {
    const follow = await this.findOne({
        follower: followerId,
        following: followingId
    });
    
    if (!follow) {
        throw new Error('No sigues a este usuario');
    }
    
    await follow.unfollow();
    return true;
};

// Obtener seguidores de un usuario
followSchema.statics.getFollowers = async function(userId, options = {}) {
    const {
        page = 1,
        limit = 20,
        status = 'active',
        includeStats = false
    } = options;
    
    const skip = (page - 1) * limit;
    
    const query = this.find({
        following: userId,
        status: status
    })
        .sort({ followedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('follower', 'nombre avatar bio role verified location');
    
    if (includeStats) {
        query.select('+interactions');
    }
    
    return query.lean();
};

// Obtener a quién sigue un usuario
followSchema.statics.getFollowing = async function(userId, options = {}) {
    const {
        page = 1,
        limit = 20,
        status = 'active',
        closeFriendsOnly = false
    } = options;
    
    const skip = (page - 1) * limit;
    
    const query = {
        follower: userId,
        status: status
    };
    
    if (closeFriendsOnly) {
        query.isCloseFriend = true;
    }
    
    return this.find(query)
        .sort({ followedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('following', 'nombre avatar bio role verified location')
        .lean();
};

// Obtener amigos mutuos
followSchema.statics.getMutualFollows = async function(userId1, userId2) {
    // Encontrar a quién sigue userId1
    const user1Following = await this.find({
        follower: userId1,
        status: 'active'
    }).distinct('following');
    
    // Encontrar a quién sigue userId2
    const user2Following = await this.find({
        follower: userId2,
        status: 'active'
    }).distinct('following');
    
    // Encontrar la intersección
    const mutualIds = user1Following.filter(id => 
        user2Following.some(id2 => id.toString() === id2.toString())
    );
    
    return mutualIds;
};

// Contar seguidores
followSchema.statics.countFollowers = async function(userId) {
    return this.countDocuments({
        following: userId,
        status: 'active'
    });
};

// Contar siguiendo
followSchema.statics.countFollowing = async function(userId) {
    return this.countDocuments({
        follower: userId,
        status: 'active'
    });
};

// Obtener amigos cercanos
followSchema.statics.getCloseFriends = async function(userId) {
    return this.find({
        follower: userId,
        isCloseFriend: true,
        status: 'active'
    })
        .populate('following', 'nombre avatar')
        .lean();
};

// Sugerencias de usuarios para seguir
followSchema.statics.getSuggestedFollows = async function(userId, limit = 10) {
    // Obtener a quién sigue el usuario
    const following = await this.find({
        follower: userId,
        status: 'active'
    }).distinct('following');
    
    // Encontrar usuarios que los seguidos del usuario siguen
    const suggestions = await this.aggregate([
        {
            $match: {
                follower: { $in: following },
                following: { $ne: userId },
                status: 'active'
            }
        },
        {
            $group: {
                _id: '$following',
                mutualFollows: { $sum: 1 }
            }
        },
        {
            $match: {
                _id: { $nin: [...following, userId] }
            }
        },
        {
            $sort: { mutualFollows: -1 }
        },
        {
            $limit: limit
        }
    ]);
    
    return suggestions;
};

// Estadísticas de seguimiento
followSchema.statics.getFollowStats = async function(userId) {
    const followers = await this.countFollowers(userId);
    const following = await this.countFollowing(userId);
    const closeFriends = await this.countDocuments({
        follower: userId,
        isCloseFriend: true,
        status: 'active'
    });
    
    return {
        followers,
        following,
        closeFriends,
        ratio: following > 0 ? (followers / following).toFixed(2) : 0
    };
};

// =============================================
// MIDDLEWARE
// =============================================

// PRE-SAVE: Validaciones
followSchema.pre('save', function(next) {
    console.log(`👥 Procesando seguimiento antes de guardar...`);
    
    // Validar que no se siga a sí mismo
    if (this.follower.toString() === this.following.toString()) {
        return next(new Error('No puedes seguirte a ti mismo'));
    }
    
    // Limpiar mutedUntil si no está silenciado
    if (this.status !== 'muted') {
        this.mutedUntil = null;
    }
    
    // Verificar silencio temporal expirado
    if (this.status === 'muted' && this.mutedUntil && new Date() > this.mutedUntil) {
        this.status = 'active';
        this.mutedUntil = null;
        console.log('   ⏰ Silencio temporal expirado, reactivando');
    }
    
    next();
});

// POST-SAVE: Logs y actualizaciones
followSchema.post('save', function(doc) {
    console.log(`✅ Seguimiento guardado exitosamente:`);
    console.log(`   👤 Seguidor: ${doc.follower}`);
    console.log(`   👥 Siguiendo a: ${doc.following}`);
    console.log(`   📊 Estado: ${doc.statusText}`);
    console.log(`   🎯 Tipo: ${doc.typeText}`);
    console.log(`   ⭐ Amigo cercano: ${doc.isCloseFriend ? 'Sí' : 'No'}`);
});

// =============================================
// TRANSFORMACIÓN JSON
// =============================================

followSchema.set('toJSON', {
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

const Follow = mongoose.model('Follow', followSchema);

console.log('✅ Modelo Follow creado exitosamente');
console.log('📋 Collection en MongoDB: follows');
console.log('📦 Modelo Follow exportado y listo para usar');

module.exports = Follow;