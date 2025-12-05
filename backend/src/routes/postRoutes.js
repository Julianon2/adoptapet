const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crear carpeta uploads si no existe
const uploadsDir = path.join(__dirname, '../../uploads/posts');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Carpeta uploads/posts creada');
}

// Configuración de multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'post-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Solo se permiten imágenes'));
  }
});

// Middleware de autenticación
const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado - Token no proporcionado'
      });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'adoptapet_secreto_super_seguro_2025');
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado'
    });
  }
};

// Importar modelo
const Post = require('../models/Post');

// ============================================
// RUTAS DE POSTS
// ============================================

// ⭐ RUTA ESPECIAL: MIS PUBLICACIONES (DEBE IR PRIMERO)
router.get('/user/my-posts', auth, async (req, res) => {
  try {
    console.log('📝 Obteniendo MIS publicaciones...');
    console.log('👤 UserId:', req.userId);
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ 
      author: req.userId,
      status: 'active'
    })
      .populate('author', 'name avatar role verified email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPosts = await Post.countDocuments({ 
      author: req.userId,
      status: 'active'
    });

    console.log(`✅ Posts encontrados: ${posts.length}`);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          total: totalPosts,
          pages: Math.ceil(totalPosts / limit)
        }
      }
    });
  } catch (error) {
    console.error('❌ Error obteniendo mis posts:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tus publicaciones',
      error: error.message
    });
  }
});

// 1. CREAR PUBLICACIÓN
router.post('/', auth, upload.single('imagen'), async (req, res) => {
  try {
    console.log('📝 Creando nueva publicación...');
    console.log('📦 Body:', req.body);
    console.log('📸 Archivo:', req.file);
    console.log('👤 UserId:', req.userId);

    const { contenido, tipo } = req.body;

    // Validación básica
    if (!contenido && !req.file) {
      return res.status(400).json({
        success: false,
        message: 'Debes proporcionar contenido o una imagen'
      });
    }

    // Crear objeto de publicación
    const postData = {
      author: req.userId,
      content: contenido || '',
      type: tipo || 'update',
      status: 'active'
    };

    // Si hay imagen, agregarla al array de images
    if (req.file) {
      postData.images = [{
        url: `/uploads/posts/${req.file.filename}`,
        publicId: req.file.filename
      }];
    }

    // Crear el post
    const newPost = new Post(postData);
    await newPost.save();

    // Poblar información del autor
    await newPost.populate('author', 'name email avatar role verified');

    console.log('✅ Post creado exitosamente:', newPost._id);

    res.status(201).json({
      success: true,
      message: 'Publicación creada exitosamente',
      data: { post: newPost }
    });

  } catch (error) {
    console.error('❌ Error creando post:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la publicación',
      error: error.message
    });
  }
});

// 2. OBTENER FEED DE PUBLICACIONES
router.get('/feed', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ status: 'active' })
      .populate('author', 'name email avatar role verified')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPosts = await Post.countDocuments({ status: 'active' });

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          total: totalPosts,
          pages: Math.ceil(totalPosts / limit)
        }
      }
    });
  } catch (error) {
    console.error('❌ Error obteniendo feed:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener publicaciones'
    });
  }
});

// 3. OBTENER POSTS DE UN USUARIO (DEBE IR DESPUÉS DE /user/my-posts)
router.get('/user/:userId', auth, async (req, res) => {
  try {
    console.log('📋 Obteniendo posts del usuario:', req.params.userId);
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ 
      author: req.params.userId,
      status: 'active'
    })
      .populate('author', 'name email avatar role verified')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPosts = await Post.countDocuments({ 
      author: req.params.userId,
      status: 'active'
    });

    console.log(`✅ Posts encontrados: ${posts.length}`);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          total: totalPosts,
          pages: Math.ceil(totalPosts / limit)
        }
      }
    });
  } catch (error) {
    console.error('❌ Error obteniendo posts del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener publicaciones del usuario',
      error: error.message
    });
  }
});

// 4. OBTENER PUBLICACIÓN POR ID
router.get('/:postId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate('author', 'name email avatar role verified')
      .populate('comments.user', 'name avatar role verified')
      .lean();

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Publicación no encontrada'
      });
    }

    res.json({
      success: true,
      data: { post }
    });
  } catch (error) {
    console.error('❌ Error obteniendo post:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la publicación'
    });
  }
});

// 5. DAR/QUITAR LIKE
router.post('/:postId/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Publicación no encontrada'
      });
    }

    // Verificar si ya dio like
    const likeIndex = post.likes?.findIndex(
      like => {
        const likeUserId = like?.user || like;
        return likeUserId.toString() === req.userId.toString();
      }
    ) ?? -1;
    
    let liked = false;
    
    if (likeIndex > -1) {
      // Remover like
      post.likes.splice(likeIndex, 1);
      liked = false;
    } else {
      // Agregar like
      if (!post.likes) post.likes = [];
      post.likes.push({ user: req.userId });
      liked = true;
    }

    // Actualizar stats
    post.stats.likesCount = post.likes.length;
    await post.save();

    res.json({
      success: true,
      message: liked ? 'Like agregado' : 'Like removido',
      data: { 
        liked,
        likesCount: post.likes.length
      }
    });
  } catch (error) {
    console.error('❌ Error con like:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar like'
    });
  }
});

// 5b. QUITAR LIKE (DELETE)
router.delete('/:postId/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Publicación no encontrada'
      });
    }

    // Remover like
    post.likes = post.likes.filter(like => {
      const likeUserId = like?.user || like;
      return likeUserId.toString() !== req.userId.toString();
    });

    // Actualizar stats
    post.stats.likesCount = post.likes.length;
    await post.save();

    res.json({
      success: true,
      message: 'Like removido',
      data: { 
        unliked: true,
        likesCount: post.likes.length
      }
    });
  } catch (error) {
    console.error('❌ Error quitando like:', error);
    res.status(500).json({
      success: false,
      message: 'Error al quitar like'
    });
  }
});

// 6. AGREGAR COMENTARIO
router.post('/:postId/comments', auth, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El comentario no puede estar vacío'
      });
    }

    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Publicación no encontrada'
      });
    }

    // Agregar comentario
    const newComment = {
      user: req.userId,
      content: content.trim(),
      createdAt: new Date()
    };

    post.comments.push(newComment);
    post.stats.commentsCount = post.comments.length;
    await post.save();

    // Popular el usuario del nuevo comentario
    await post.populate('comments.user', 'name avatar role verified');

    res.status(201).json({
      success: true,
      message: 'Comentario agregado exitosamente',
      data: {
        comment: post.comments[post.comments.length - 1],
        commentsCount: post.comments.length
      }
    });
  } catch (error) {
    console.error('❌ Error agregando comentario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar comentario'
    });
  }
});

// 7. ELIMINAR PUBLICACIÓN
router.delete('/:postId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Publicación no encontrada'
      });
    }

    // Verificar que el usuario sea el autor
    if (post.author.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar esta publicación'
      });
    }

    // Cambiar estado a deleted
    post.status = 'deleted';
    await post.save();

    res.json({
      success: true,
      message: 'Publicación eliminada exitosamente'
    });
  } catch (error) {
    console.error('❌ Error eliminando post:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la publicación'
    });
  }
});

// 8. EDITAR POST
router.put('/:postId', auth, async (req, res) => {
  try {
    const { contenido, content } = req.body;
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Publicación no encontrada'
      });
    }

    // Verificar que el usuario sea el autor
    if (post.author.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para editar esta publicación'
      });
    }

    const newContent = contenido || content;

    if (!newContent || !newContent.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El contenido no puede estar vacío'
      });
    }

    post.content = newContent;
    post.isEdited = true;
    post.editedAt = new Date();
    await post.save();

    await post.populate('author', 'name email avatar role verified');

    res.json({
      success: true,
      message: 'Publicación editada exitosamente',
      data: { post }
    });
  } catch (error) {
    console.error('❌ Error editando post:', error);
    res.status(500).json({
      success: false,
      message: 'Error al editar la publicación'
    });
  }
});

console.log('✅ Rutas de posts configuradas correctamente');
console.log('   📝 POST   /api/posts - Crear publicación');
console.log('   📰 GET    /api/posts/feed - Feed de publicaciones');
console.log('   👤 GET    /api/posts/user/my-posts - Mis publicaciones');
console.log('   👥 GET    /api/posts/user/:userId - Posts de usuario');
console.log('   📄 GET    /api/posts/:postId - Ver publicación');
console.log('   ❤️  POST   /api/posts/:postId/like - Dar like');
console.log('   💔 DELETE /api/posts/:postId/like - Quitar like');
console.log('   💬 POST   /api/posts/:postId/comments - Comentar');
console.log('   🗑️  DELETE /api/posts/:postId - Eliminar');
console.log('   ✏️  PUT    /api/posts/:postId - Editar');

module.exports = router;