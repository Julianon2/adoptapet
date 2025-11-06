// @desc    Callback de Google OAuth - Redirigir con token
// @route   GET /auth/google/callback
// @access  Public (llamado por Google)
exports.googleCallback = async (req, res) => {
  try {
    console.log('🔄 Google callback recibido');
    
    const user = req.user;
    
    if (!user) {
      console.error('❌ No hay usuario en req.user');
      return res.redirect('http://127.0.0.1:5500/login.html?error=auth_failed');
    }

    console.log('✅ Usuario autenticado:', user.email);

    // Generar token
    const token = generateToken(user._id);
    console.log('🔑 Token JWT generado');

    // Preparar datos del usuario
    const userData = {
      id: user._id,
      nombre: user.name,
      email: user.email,
      telefono: user.phone || '',
      direccion: user.location?.address || '',
      rol: user.role,
      avatar: user.avatar,
      verificado: user.isFullyVerified
    };

    // Redirigir al frontend con token y usuario
    const redirectUrl = `http://127.0.0.1:5500/index.html?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`;
    
    console.log('🔄 Redirigiendo a frontend:', redirectUrl);
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('❌ Error en googleCallback:', error);
    res.redirect('http://127.0.0.1:5500/login.html?error=server_error');
  }
};