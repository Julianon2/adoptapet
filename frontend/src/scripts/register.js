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