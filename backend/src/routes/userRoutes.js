const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Middleware de autenticación
const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'adoptapet_secreto_super_seguro_2025');
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
};

// Importar modelo User
const User = require('../models/User');

// OBTENER PERFIL DEL USUARIO ACTUAL
router.get('/profile', auth, async (req, res) => {
  try {
    console.log('👤 Obteniendo perfil de usuario:', req.userId);

    const user = await User.findById(req.userId).select('-password -googleId');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        nombre: user.nombre,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el perfil'
    });
  }
});

// OBTENER PERFIL DE OTRO USUARIO POR ID
router.get('/profile/:userId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password -googleId');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        nombre: user.nombre,
        email: user.email,
        avatar: user.avatar,
        role: user.role
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el perfil'
    });
  }
});

// ACTUALIZAR PERFIL
router.put('/profile', auth, async (req, res) => {
  try {
    const { nombre, avatar } = req.body;

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    if (nombre) user.nombre = nombre;
    if (avatar) user.avatar = avatar;

    await user.save();

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: {
        id: user._id,
        nombre: user.nombre,
        email: user.email,
        avatar: user.avatar
      }
    });

  } catch (error) {
    console.error('❌ Error actualizando perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el perfil'
    });
  }
});

console.log('✅ Rutas de usuarios configuradas');

module.exports = router;