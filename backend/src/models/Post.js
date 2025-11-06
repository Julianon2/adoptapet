//Publicaciones (red social)

// =============================================
// MODELO POST - ADOPTAPET RED SOCIAL
// =============================================

/**
 * INFORMACIÓN DEL ARCHIVO:
 * 
 * ¿Qué hace este archivo?
 * Define el modelo de datos para las publicaciones en el feed social
 * 
 * ¿Qué incluye?
 * - Esquema completo de post con validaciones
 * - Tipos de posts (actualización, historia de adopción, foto, video)
 * - Sistema de engagement (likes, comments, shares)
 * - Relaciones con User y Pet
 * - Control de privacidad
 * 
 * Proyecto: AdoptaPet - Red Social de Adopción
 */

const mongoose = require('mongoose');

console.log('📱 Iniciando creación del modelo Post...');

// =============================================
// ESQUEMA DEL POST
// =============================================

const postSchema = new mongoose.Schema({
    
    // =============================================
    // AUTOR Y TIPO DE PUBLICACIÓN
    // =============================================
    
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El autor del post es obligatorio'],
        index: true
    },
    
    type: {
        type: String,
        enum: {
            values: ['update', 'adoption-story', 'photo', 'video', 'announcement', 'help'],
            message: '{VALUE} no es un tipo de post válido'
        },
        default: 'update',
        index: true
    },
    
    // =============================================
    // CONTENIDO DEL POST
    // =============================================
    
    content: {
        type: String,
        required: [true, 'El contenido del post es obligatorio'],
        trim: true,
        minlength: [1, 'El contenido debe tener al menos 1 caracter'],
        maxlength: [5000, 'El contenido no puede tener más de 5000 caracteres']
    },
    
    title: {
        type: String,
        trim: true,
        maxlength: [200, 'El título no puede tener más de 200 caracteres']
    },
    
    // =============================================
    // MULTIMEDIA
    // =============================================
    
    media: {
        images: {
            type: [String],
            validate: {
                validator: function(images) {
                    return images.length <= 10;
                },
                message: 'No puede haber más de 10 imágenes'
            }
        },
        videos: {
            type: [String],
            validate: {
                validator: function(videos) {
                    return videos.length <= 3;
                },
                message: 'No puede haber más de 3 videos'
            }
        }
    },
    
    // =============================================
    // RELACIÓN CON MASCOTA
    // =============================================
    
    pet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pet',
        index: true
    },
    
    // Si es una historia de adopción exitosa
    adoptionInfo: {
        adopted: {
            type: Boolean,
            default: false
        },
        adoptionDate: {
            type: Date
        },
        adopter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        happyEnding: {
            type: Boolean,
            default: true
        }
    },
    
    // =============================================
    // ENGAGEMENT Y ESTADÍSTICAS
    // =============================================
    
    stats: {
        likes: {
            type: Number,
            default: 0,
            min: 0
        },
        comments: {
            type: Number,
            default: 0,
            min: 0
        },
        shares: {
            type: Number,
            default: 0,
            min: 0
        },
        views: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    
    // =============================================
    // ARRAYS DE REFERENCIAS
    // =============================================
    
    // Array de usuarios que dieron like (limitado para performance)
    likedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    
    // =============================================
    // ETIQUETAS Y MENCIONES
    // =============================================
    
    tags: {
        type: [String],
        validate: {
            validator: function(tags) {
                return tags.length <= 20;
            },
            message: 'No puede haber más de 20 etiquetas'
        },
        set: function(tags) {
            return [...new Set(tags.map(tag => tag.toLowerCase().trim()))];
        }
    },
    
    mentions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    
    // =============================================
    // UBICACIÓN (OPCIONAL)
    // =============================================
    
    location: {
        city: {
            type: String,
            trim: true
        },
        country: {
            type: String,
            trim: true
        },
        coordinates: {
            latitude: {
                type: Number,
                min: -90,
                max: 90
            },
            longitude: {
                type: Number,
                min: -180,
                max: 180
            }
        }
    },
    
    // =============================================
    // CONFIGURACIÓN Y PRIVACIDAD
    // =============================================
    
    settings: {
        visibility: {
            type: String,
            enum: {
                values: ['public', 'followers', 'private'],
                message: '{VALUE} no es una visibilidad válida'
            },
            default: 'public',
            index: true
        },
        allowComments: {
            type: Boolean,
            default: true
        },
        allowSharing: {
            type: Boolean,
            default: true
        }
    },
    
    // =============================================
    // ESTADO DEL POST
    // =============================================
    
    status: {
        type: String,
        enum: {
            values: ['active', 'hidden', 'reported', 'deleted'],
            message: '{VALUE} no es un estado válido'
        },
        default: 'active',
        index: true
    },
    
    // =============================================
    // DESTACADOS Y PROMOCIÓN
    // =============================================
    
    featured: {
        type: Boolean,
        default: false,
        index: true
    },
    
    pinned: {
        type: Boolean,
        default: false
    },
    
    // =============================================
    // REPORTES Y MODERACIÓN
    // =============================================
    
    reports: {
        count: {
            type: Number,
            default: 0,
            min: 0
        },
        reasons: [{
            type: String
        }]
    },
    
    // =============================================
    // EDICIÓN
    // =============================================
    
    edited: {
        type: Boolean,
        default: false
    },
    
    editHistory: [{
        content: String,
        editedAt: {
            type: Date,
            default: Date.now
        }
    }]
    
}, {
    // =============================================
    // OPCIONES DEL SCHEMA
    // =============================================
    
    timestamps: true,
    
    toJSON: { 
        virtuals: true,
        transform: function(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    },
    
    toObject: { 
        virtuals: true
    }
});

// =============================================
// CAMPOS VIRTUALES - PROPIEDADES CALCULADAS
// =============================================

// Campo virtual: tipo de post en español
postSchema.virtual('typeText').get(function() {
    const typeTexts = {
        'update': 'Actualización',
        'adoption-story': 'Historia de Adopción',
        'photo': 'Foto',
        'video': 'Video',
        'announcement': 'Anuncio',
        'help': 'Ayuda'
    };
    return typeTexts[this.type] || this.type;
});

// Campo virtual: total de interacciones
postSchema.virtual('totalEngagement').get(function() {
    return this.stats.likes + this.stats.comments + this.stats.shares;
});

// Campo virtual: tiempo desde publicación
postSchema.virtual('timeAgo').get(function() {
    const now = new Date();
    const posted = this.createdAt;
    const diffTime = Math.abs(now - posted);
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 60) return `Hace ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semana${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;
    return `Hace ${Math.floor(diffDays / 30)} mes${Math.floor(diffDays / 30) > 1 ? 'es' : ''}`;
});

// Campo virtual: tiene multimedia
postSchema.virtual('hasMedia').get(function() {
    return (this.media?.images?.length > 0) || (this.media?.videos?.length > 0);
});

// Campo virtual: es historia de adopción
postSchema.virtual('isAdoptionStory').get(function() {
    return this.type === 'adoption-story' && this.adoptionInfo?.adopted === true;
});

// Campo virtual: engagement rate (porcentaje)
postSchema.virtual('engagementRate').get(function() {
    if (this.stats.views === 0) return 0;
    return Math.round((this.totalEngagement / this.stats.views) * 100);
});

// =============================================
// MIDDLEWARE - FUNCIONES AUTOMÁTICAS
// =============================================

// MIDDLEWARE PRE-SAVE
postSchema.pre('save', function(next) {
    console.log(`📱 Procesando post antes de guardar...`);
    
    // 1. Si es historia de adopción, validar que tenga mascota
    if (this.type === 'adoption-story' && !this.pet) {
        console.log('⚠️ Historia de adopción sin mascota asociada');
    }
    
    // 2. Normalizar tags
    if (this.tags && this.tags.length > 0) {
        this.tags = [...new Set(this.tags.map(tag => tag.toLowerCase().trim()))];
        console.log(`🏷️ Tags normalizadas: ${this.tags.join(', ')}`);
    }
    
    // 3. Limitar array de likes para performance (máximo 1000)
    if (this.likedBy && this.likedBy.length > 1000) {
        console.log('⚠️ Array de likes demasiado grande, limpiando...');
        this.likedBy = this.likedBy.slice(-1000);
    }
    
    // 4. Si se está editando, marcar como editado
    if (this.isModified('content') && !this.isNew) {
        this.edited = true;
        console.log('✏️ Post marcado como editado');
    }
    
    next();
});

// MIDDLEWARE POST-SAVE
postSchema.post('save', function(doc) {
    console.log(`✅ Post guardado exitosamente:`);
    console.log(`   📱 Tipo: ${doc.typeText}`);
    console.log(`   👤 Autor: ${doc.author}`);
    console.log(`   📸 Tiene multimedia: ${doc.hasMedia ? 'Sí' : 'No'}`);
    console.log(`   ❤️ Engagement: ${doc.totalEngagement}`);
    console.log(`   🆔 ID: ${doc._id}`);
});

// =============================================
// MÉTODOS DE INSTANCIA
// =============================================

// Método: Dar like
postSchema.methods.addLike = function(userId) {
    // Verificar que no haya dado like antes
    if (!this.likedBy.includes(userId)) {
        this.likedBy.push(userId);
        this.stats.likes += 1;
        return this.save();
    }
    return Promise.resolve(this);
};

// Método: Quitar like
postSchema.methods.removeLike = function(userId) {
    const index = this.likedBy.indexOf(userId);
    if (index > -1) {
        this.likedBy.splice(index, 1);
        this.stats.likes = Math.max(0, this.stats.likes - 1);
        return this.save();
    }
    return Promise.resolve(this);
};

// Método: Verificar si un usuario dio like
postSchema.methods.hasLiked = function(userId) {
    return this.likedBy.some(id => id.toString() === userId.toString());
};

// Método: Incrementar vistas
postSchema.methods.incrementViews = function() {
    this.stats.views += 1;
    return this.save();
};

// Método: Incrementar comentarios
postSchema.methods.incrementComments = function() {
    this.stats.comments += 1;
    return this.save();
};

// Método: Decrementar comentarios
postSchema.methods.decrementComments = function() {
    this.stats.comments = Math.max(0, this.stats.comments - 1);
    return this.save();
};

// Método: Incrementar shares
postSchema.methods.incrementShares = function() {
    this.stats.shares += 1;
    return this.save();
};

// Método: Reportar post
postSchema.methods.report = function(reason) {
    this.reports.count += 1;
    if (reason) {
        this.reports.reasons.push(reason);
    }
    
    // Auto-moderar si hay muchos reportes
    if (this.reports.count >= 5) {
        this.status = 'reported';
        console.log('🚨 Post reportado múltiples veces, marcado para revisión');
    }
    
    return this.save();
};

// Método: Editar contenido
postSchema.methods.editContent = function(newContent) {
    // Guardar versión anterior en historial
    if (this.content) {
        this.editHistory.push({
            content: this.content,
            editedAt: new Date()
        });
    }
    
    this.content = newContent;
    this.edited = true;
    return this.save();
};

// Método: Verificar si es visible para un usuario
postSchema.methods.isVisibleTo = function(userId) {
    if (this.status !== 'active') return false;
    if (this.settings.visibility === 'public') return true;
    if (this.settings.visibility === 'private') {
        return this.author.toString() === userId.toString();
    }
    // Para 'followers', necesitaríamos verificar en el modelo User
    return true;
};

// =============================================
// MÉTODOS ESTÁTICOS
// =============================================

// Método estático: Buscar posts de un usuario
postSchema.statics.findByAuthor = function(authorId, options = {}) {
    const query = {
        author: authorId,
        status: 'active'
    };
    
    return this.find(query)
        .sort({ createdAt: -1 })
        .limit(options.limit || 50)
        .populate('author', 'nombre avatar role')
        .populate('pet', 'nombre species mainPhoto');
};

// Método estático: Buscar posts públicos del feed
postSchema.statics.getPublicFeed = function(options = {}) {
    const query = {
        'settings.visibility': 'public',
        status: 'active'
    };
    
    return this.find(query)
        .sort({ createdAt: -1 })
        .limit(options.limit || 20)
        .skip(options.skip || 0)
        .populate('author', 'nombre avatar role displayName')
        .populate('pet', 'nombre species mainPhoto status');
};

// Método estático: Buscar historias de adopción
postSchema.statics.getAdoptionStories = function(options = {}) {
    const query = {
        type: 'adoption-story',
        'adoptionInfo.adopted': true,
        status: 'active',
        'settings.visibility': 'public'
    };
    
    return this.find(query)
        .sort({ createdAt: -1 })
        .limit(options.limit || 20)
        .populate('author', 'nombre avatar role')
        .populate('pet', 'nombre species mainPhoto')
        .populate('adoptionInfo.adopter', 'nombre avatar');
};

// Método estático: Posts más populares
postSchema.statics.getTrendingPosts = function(days = 7) {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    
    return this.find({
        status: 'active',
        'settings.visibility': 'public',
        createdAt: { $gte: dateFrom }
    })
    .sort({ 'stats.likes': -1, 'stats.comments': -1 })
    .limit(10)
    .populate('author', 'nombre avatar role')
    .populate('pet', 'nombre species mainPhoto');
};

// Método estático: Estadísticas de posts
postSchema.statics.getPostStats = async function() {
    const stats = await this.aggregate([
        {
            $group: {
                _id: '$type',
                count: { $sum: 1 },
                totalLikes: { $sum: '$stats.likes' },
                totalComments: { $sum: '$stats.comments' },
                totalShares: { $sum: '$stats.shares' }
            }
        }
    ]);
    
    return stats;
};

// =============================================
// ÍNDICES COMPUESTOS PARA BÚSQUEDAS OPTIMIZADAS
// =============================================

postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ type: 1, status: 1, createdAt: -1 });
postSchema.index({ 'settings.visibility': 1, status: 1, createdAt: -1 });
postSchema.index({ pet: 1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ featured: 1, createdAt: -1 });

// =============================================
// CREAR EL MODELO DESDE EL ESQUEMA
// =============================================

const Post = mongoose.model('Post', postSchema);

console.log('✅ Modelo Post creado exitosamente');
console.log('📋 Collection en MongoDB: posts');

// =============================================
// EXPORTAR EL MODELO
// =============================================

module.exports = Post;

console.log('📦 Modelo Post exportado y listo para usar');