const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback',
      proxy: true // Importante para producción con HTTPS
    },
    
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('🔐 Iniciando autenticación con Google');
        console.log('   Usuario:', profile.displayName);
        console.log('   Email:', profile.emails?.[0]?.value);
        
        // Verificar que tengamos email
        if (!profile.emails || !profile.emails[0] || !profile.emails[0].value) {
          console.error('❌ No se recibió email de Google');
          return done(new Error('No se pudo obtener el email de Google'), null);
        }

        const email = profile.emails[0].value;
        const nombre = profile.displayName;
        const picture = profile.photos?.[0]?.value;

        // Buscar si el usuario ya existe
        let user = await User.findOne({ email: email.toLowerCase() });

        if (user) {
          console.log('✅ Usuario existente encontrado:', user.email);
          console.log('   ID:', user._id);
          return done(null, user);
        }

        // Crear nuevo usuario
        console.log('✨ Creando nuevo usuario con email:', email);
        
        // Generar contraseña aleatoria segura
        const randomPassword = Math.random().toString(36).slice(-12) + 
                             Math.random().toString(36).slice(-12) + 
                             'Aa1!@#';

        // Crear usuario - AJUSTA LOS CAMPOS SEGÚN TU MODELO
        user = await User.create({
          name: nombre,           // Si tu modelo usa 'name'
          // nombre: nombre,      // Si tu modelo usa 'nombre' (descomenta esta línea)
          email: email.toLowerCase(),
          password: randomPassword,
          avatar: picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=random`,
          role: 'adopter',        // Si tu modelo usa 'role'
          // rol: 'adopter',      // Si tu modelo usa 'rol' (descomenta esta línea)
          verified: {
            email: true
          },
          googleId: profile.id    // Guardar el ID de Google (útil para futuras autenticaciones)
        });

        console.log('✅ Usuario creado exitosamente');
        console.log('   ID:', user._id);
        console.log('   Email:', user.email);
        console.log('   Nombre:', user.name);
        
        return done(null, user);

      } catch (error) {
        console.error('❌ Error en Google Strategy:', error.message);
        console.error('   Stack:', error.stack);
        
        // Si es un error de validación de Mongoose, dar más detalles
        if (error.name === 'ValidationError') {
          console.error('   Errores de validación:');
          Object.keys(error.errors).forEach(key => {
            console.error(`   - ${key}: ${error.errors[key].message}`);
          });
        }
        
        return done(error, null);
      }
    }
  )
);

// Serialización (para sesiones)
passport.serializeUser((user, done) => {
  console.log('📦 Serializando usuario con ID:', user._id);
  done(null, user._id);
});

// Deserialización
passport.deserializeUser(async (id, done) => {
  try {
    console.log('📥 Deserializando usuario con ID:', id);
    const user = await User.findById(id);
    
    if (!user) {
      console.warn('⚠️ Usuario no encontrado en deserialización');
      return done(null, false);
    }
    
    console.log('✅ Usuario deserializado:', user.email);
    done(null, user);
  } catch (error) {
    console.error('❌ Error al deserializar usuario:', error.message);
    done(error, null);
  }
});

module.exports = passport;