// backend/src/utils/seedChats.js
// Ejecuta este archivo UNA VEZ para crear datos de prueba: node src/utils/seedChats.js

require('dotenv').config();
const mongoose = require('mongoose');

// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ Error:', err));

const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');

async function seedChats() {
  try {
    console.log('🌱 Iniciando seed de chats de prueba...\n');

    // 1. Obtener tu usuario (el que está logueado)
    const miUsuario = await User.findOne({ 
      email: 'alejandro1marin7@gmail.com' // ← CAMBIA ESTO POR TU EMAIL
    });

    if (!miUsuario) {
      console.error('❌ No se encontró tu usuario. Cambia el email en el código.');
      process.exit(1);
    }

    console.log('👤 Tu usuario:', miUsuario.nombre, `(${miUsuario.email})`);

    // 2. Crear usuarios de prueba (refugios/fundaciones)
    console.log('\n👥 Creando usuarios de prueba...');
    
    const usuarios = [
      {
        nombre: 'Refugio San Luis',
        email: 'refugio.sanluis@test.com',
        password: 'test123',
        role: 'shelter',
        avatar: 'https://i.imgur.com/3G0z6YV.jpeg'
      },
      {
        nombre: 'Fundación Huellitas',
        email: 'fundacion.huellitas@test.com',
        password: 'test123',
        role: 'shelter',
        avatar: 'https://i.pravatar.cc/150?img=12'
      },
      {
        nombre: 'Adopta Cali',
        email: 'adoptacali@test.com',
        password: 'test123',
        role: 'shelter',
        avatar: 'https://i.pravatar.cc/150?img=25'
      }
    ];

    const usuariosCreados = [];
    
    for (const userData of usuarios) {
      // Verificar si ya existe
      let usuario = await User.findOne({ email: userData.email });
      
      if (!usuario) {
        usuario = new User(userData);
        await usuario.save();
        console.log(`  ✅ Creado: ${usuario.nombre}`);
      } else {
        console.log(`  ℹ️  Ya existe: ${usuario.nombre}`);
      }
      
      usuariosCreados.push(usuario);
    }

    // 3. Crear chats entre ti y los refugios
    console.log('\n💬 Creando chats...');
    
    for (const refugio of usuariosCreados) {
      // Verificar si ya existe un chat
      let chat = await Chat.findOne({
        participants: { $all: [miUsuario._id, refugio._id] }
      });

      if (!chat) {
        chat = new Chat({
          participants: [miUsuario._id, refugio._id],
          lastMessage: 'Hola, estoy interesado en adoptar'
        });
        await chat.save();
        console.log(`  ✅ Chat creado con: ${refugio.nombre}`);

        // 4. Crear algunos mensajes de ejemplo
        const mensajes = [
          {
            chat: chat._id,
            sender: miUsuario._id,
            text: 'Hola 👋 Estoy interesado en adoptar una mascota'
          },
          {
            chat: chat._id,
            sender: refugio._id,
            text: '¡Hola! Claro, con gusto te ayudamos. ¿Qué tipo de mascota buscas?'
          },
          {
            chat: chat._id,
            sender: miUsuario._id,
            text: 'Me gustaría adoptar un perro de tamaño mediano 🐕'
          },
          {
            chat: chat._id,
            sender: refugio._id,
            text: 'Perfecto, tenemos varios disponibles. ¿Cuándo puedes visitarnos?'
          }
        ];

        for (const msgData of mensajes) {
          const mensaje = new Message(msgData);
          await mensaje.save();
        }

        console.log(`    💬 Creados ${mensajes.length} mensajes`);
      } else {
        console.log(`  ℹ️  Ya existe chat con: ${refugio.nombre}`);
      }
    }

    console.log('\n✅ Seed completado exitosamente!\n');
    console.log('🔄 Recarga tu página de chat para ver los cambios.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
}

seedChats();