// Configuración de la API
const API_URL = 'http://localhost:4000/api';

// Función para verificar conexión con el backend
async function testBackendConnection() {
  try {
    console.log('🔍 Probando conexión con backend...');
    const response = await fetch(`${API_URL}/test`);
    const data = await response.json();
    console.log('✅ Backend conectado:', data);
    return true;
  } catch (error) {
    console.error('❌ Backend NO conectado:', error);
    console.error('🔧 Verifica que el backend esté corriendo en http://localhost:4000');
    return false;
  }
}

// Función para mostrar mensajes
function showMessage(element, text, type) {
  element.textContent = text;
  if (type === 'success') {
    element.classList.remove('text-red-500');
    element.classList.add('text-green-600');
  } else {
    element.classList.remove('text-green-600');
    element.classList.add('text-red-500');
  }
}

// Verificar si el usuario ya está autenticado
function checkAuthentication() {
  if (localStorage.getItem('token')) {
    window.location.href = 'index.html';
  }
}

// Validación en tiempo real del nombre
function setupNameValidation() {
  const nombreInput = document.getElementById('nombre');
  const nombreError = document.getElementById('nombreError');
  
  if (!nombreInput || !nombreError) return;
  
  nombreInput.addEventListener('input', function(e) {
    const nombre = e.target.value;
    const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/;
    
    if (nombre && !nombreRegex.test(nombre)) {
      nombreError.textContent = 'El nombre solo puede contener letras y espacios';
      nombreError.classList.remove('hidden');
      e.target.classList.add('border-red-500');
    } else if (nombre && nombre.trim().length < 2) {
      nombreError.textContent = 'El nombre debe tener al menos 2 caracteres';
      nombreError.classList.remove('hidden');
      e.target.classList.add('border-red-500');
    } else {
      nombreError.classList.add('hidden');
      e.target.classList.remove('border-red-500');
    }
  });
}

// Validación en tiempo real de contraseñas
function setupPasswordValidation() {
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const passwordError = document.getElementById('passwordError');
  
  if (!passwordInput || !confirmPasswordInput) return;
  
  confirmPasswordInput.addEventListener('input', function(e) {
    const password = passwordInput.value;
    const confirmPassword = e.target.value;
    
    if (confirmPassword && password !== confirmPassword) {
      if (passwordError) {
        passwordError.classList.remove('hidden');
      }
      e.target.classList.add('border-red-500');
      e.target.classList.remove('border-gray-300');
    } else {
      if (passwordError) {
        passwordError.classList.add('hidden');
      }
      e.target.classList.remove('border-red-500');
      e.target.classList.add('border-gray-300');
    }
  });
  
  passwordInput.addEventListener('input', function() {
    const confirmPassword = confirmPasswordInput.value;
    if (confirmPassword) {
      confirmPasswordInput.dispatchEvent(new Event('input'));
    }
  });
}

// Función principal de registro
async function handleRegister(e) {
  e.preventDefault();
  
  const submitBtn = document.getElementById('submitBtn');
  const message = document.getElementById('message');
  const originalText = submitBtn.textContent;
  
  // Obtener valores del formulario
  const nombreInput = document.getElementById('nombre');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const telefonoInput = document.getElementById('telefono');

  // Verificar que todos los campos existan
  if (!nombreInput || !emailInput || !passwordInput || !confirmPasswordInput) {
    showMessage(message, '❌ Error: Faltan campos en el formulario', 'error');
    return;
  }

  const nombre = nombreInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;
  const telefono = telefonoInput ? telefonoInput.value.trim() : '';

  // Limpiar mensaje previo
  message.textContent = '';

  // Validación de campos vacíos
  if (!nombre || !email || !password) {
    showMessage(message, '❌ Por favor completa todos los campos obligatorios', 'error');
    return;
  }

  // Validar que el nombre no contenga números
  const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  if (!nombreRegex.test(nombre)) {
    showMessage(message, '❌ El nombre solo puede contener letras y espacios', 'error');
    return;
  }

  // Validar longitud del nombre
  if (nombre.length < 2) {
    showMessage(message, '❌ El nombre debe tener al menos 2 caracteres', 'error');
    return;
  }

  // Validar longitud de contraseña
  if (password.length < 6) {
    showMessage(message, '❌ La contraseña debe tener al menos 6 caracteres', 'error');
    return;
  }

  // Validar que las contraseñas coincidan
  if (password !== confirmPassword) {
    showMessage(message, '❌ Las contraseñas no coinciden', 'error');
    return;
  }

  // Preparar datos para enviar
  const dataToSend = {
    name: nombre,
    email: email,
    password: password,
    passwordConfirm: password,
    phone: telefono,
    role: 'adopter'
  };

  // Mostrar estado de carga
  submitBtn.textContent = 'Registrando...';
  submitBtn.disabled = true;

  try {
    console.log('🚀 Enviando datos al servidor:', dataToSend);
    
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dataToSend)
    });

    console.log('📡 Respuesta del servidor - Status:', response.status);
    
    const data = await response.json();
    console.log('📥 Datos recibidos del servidor:', data);

    if (data.success) {
      // Guardar token y usuario en localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
      } else if (data.data && data.data.token) {
        localStorage.setItem('token', data.data.token);
      }
      
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      } else if (data.data && data.data.user) {
        localStorage.setItem('user', JSON.stringify(data.data.user));
      }
      
      // Mostrar mensaje de éxito
      showMessage(message, `✅ ¡Registro exitoso! Bienvenido ${nombre}`, 'success');
      
      // Limpiar formulario
      document.getElementById('registerForm').reset();
      
      // Redirigir después de 1.5 segundos
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1500);
    } else {
      // Mostrar error del servidor
      showMessage(message, '❌ ' + (data.message || 'Error en el registro'), 'error');
      
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  } catch (error) {
    console.error('Error en registro:', error);
    showMessage(message, '❌ Error al conectar con el servidor. Verifica que el backend esté corriendo.', 'error');
    
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  // Probar conexión con backend
  testBackendConnection();
  
  // Verificar autenticación
  checkAuthentication();
  
  // Configurar validaciones
  setupNameValidation();
  setupPasswordValidation();
  
  // Agregar event listener al formulario
  const form = document.getElementById('registerForm');
  if (form) {
    form.addEventListener('submit', handleRegister);
  }
});
// =============================================
// VALIDACIÓN DE TELÉFONO EN TIEMPO REAL
// =============================================
document.getElementById('telefono').addEventListener('input', function(e) {
  // Remover cualquier carácter que no sea número
  this.value = this.value.replace(/[^0-9]/g, '');
  
  // Limitar a 10 dígitos
  if (this.value.length > 10) {
    this.value = this.value.slice(0, 10);
  }
  
  // Feedback visual
  if (this.value.length === 10) {
    this.classList.remove('is-invalid');
    this.classList.add('is-valid');
  } else if (this.value.length > 0) {
    this.classList.remove('is-valid');
    this.classList.add('is-invalid');
  } else {
    this.classList.remove('is-valid', 'is-invalid');
  }
});

// Prevenir pegar texto no numérico
document.getElementById('telefono').addEventListener('paste', function(e) {
  e.preventDefault();
  const pastedText = (e.clipboardData || window.clipboardData).getData('text');
  const numericText = pastedText.replace(/[^0-9]/g, '').slice(0, 10);
  this.value = numericText;
  this.dispatchEvent(new Event('input'));
});

// =============================================
// VALIDACIÓN Y ENVÍO DEL FORMULARIO
// =============================================
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const nombre = document.getElementById('nombre').value.trim();
  const email = document.getElementById('email').value.trim();
  const telefono = document.getElementById('telefono').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  
  // Limpiar errores previos
  document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
  
  // VALIDACIÓN DE TELÉFONO
  if (!/^[0-9]{10}$/.test(telefono)) {
    mostrarError('El teléfono debe tener exactamente 10 dígitos numéricos');
    document.getElementById('telefono').classList.add('is-invalid');
    document.getElementById('telefono').focus();
    return;
  }
  
  // Validar nombre
  if (nombre.length < 3) {
    mostrarError('El nombre debe tener al menos 3 caracteres');
    document.getElementById('nombre').classList.add('is-invalid');
    return;
  }
  
  // Validar email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    mostrarError('Ingresa un email válido');
    document.getElementById('email').classList.add('is-invalid');
    return;
  }
  
  // Validar contraseña
  if (password.length < 6) {
    mostrarError('La contraseña debe tener al menos 6 caracteres');
    document.getElementById('password').classList.add('is-invalid');
    return;
  }
  
  // Validar confirmación
  if (password !== confirmPassword) {
    mostrarError('Las contraseñas no coinciden');
    document.getElementById('confirmPassword').classList.add('is-invalid');
    return;
  }
  
  // Mostrar loading
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const btnText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Registrando...';
  
  try {
    console.log('📤 Enviando datos:', { nombre, email, telefono });
    
    const response = await fetch('http://localhost:5500/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nombre,
        email,
        telefono,
        password
      })
    });
    
    const data = await response.json();
    console.log('📥 Respuesta:', data);
    
    if (data.success) {
      mostrarExito('¡Registro exitoso! Redirigiendo al login...');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
    } else {
      mostrarError(data.message || 'Error al registrar usuario');
      submitBtn.disabled = false;
      submitBtn.innerHTML = btnText;
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    mostrarError('Error de conexión con el servidor');
    submitBtn.disabled = false;
    submitBtn.innerHTML = btnText;
  }
});

// =============================================
// FUNCIONES AUXILIARES
// =============================================
function mostrarError(mensaje) {
  const alertDiv = document.getElementById('alertMessage');
  alertDiv.className = 'alert alert-danger alert-dismissible fade show';
  alertDiv.innerHTML = `
    ${mensaje}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  alertDiv.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // Auto-ocultar después de 5 segundos
  setTimeout(() => {
    alertDiv.style.display = 'none';
  }, 5000);
}

function mostrarExito(mensaje) {
  const alertDiv = document.getElementById('alertMessage');
  alertDiv.className = 'alert alert-success alert-dismissible fade show';
  alertDiv.innerHTML = `
    <i class="bi bi-check-circle me-2"></i>${mensaje}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  alertDiv.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}