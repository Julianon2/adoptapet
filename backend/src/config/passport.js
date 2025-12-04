const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/auth/google/callback',
      proxy: true
    },
    
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('🔐 Iniciando autenticación con Google');
        console.log('   Usuario:', profile.displayName);
        console.log('   Email:', profile.emails?.[0]?.value);
        
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

        // ✅ CREAR USUARIO - phone es opcional ahora
        user = await User.create({
          name: nombre,
          email: email.toLowerCase(),
          password: randomPassword,
          avatar: picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=random`,
          googleAvatar: picture, // Guardar avatar de Google
          role: 'adopter', // ✅ Ahora debe funcionar
          authProvider: 'google',
          googleId: profile.id,
          // ⚠️ NO incluir phone - es opcional
          verified: {
            email: true, // Google ya verificó el email
            phone: false,
            shelter: false
          }
        });

        console.log('✅ Usuario creado exitosamente');
        console.log('   ID:', user._id);
        console.log('   Email:', user.email);
        console.log('   Nombre:', user.name);
        console.log('   Rol:', user.role);
        console.log('   ⚠️ Teléfono: No proporcionado (opcional)');
        
        return done(null, user);

      } catch (error) {
        console.error('❌ Error en Google Strategy:', error.message);
        console.error('   Stack:', error.stack);
        
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

// Serialización
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