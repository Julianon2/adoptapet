// ============================================
// CONFIGURACIÓN
// ============================================
const API_URL = 'http://localhost:4000/api';

// ============================================
// FUNCIÓN: REGISTRO DE USUARIO
// ============================================
async function handleRegister(event) {
  event.preventDefault();
  
  // Obtener valores del formulario
  const nombre = document.getElementById('nombre').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword')?.value;
  const telefono = document.getElementById('telefono')?.value.trim() || '';
  const direccion = document.getElementById('direccion')?.value.trim() || '';

  // Validación básica
  if (!nombre || !email || !password) {
    showMessage('Por favor completa todos los campos obligatorios', 'error');
    return;
  }

  // Validar que las contraseñas coincidan (si existe campo de confirmación)
  if (confirmPassword && password !== confirmPassword) {
    showMessage('Las contraseñas no coinciden', 'error');
    return;
  }

  // Validar longitud de contraseña
  if (password.length < 6) {
    showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
    return;
  }

  // Mostrar indicador de carga
  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Registrando...';
  submitBtn.disabled = true;

  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nombre,
        email,
        password,
        telefono,
        direccion
      })
    });

    const data = await response.json();

    if (data.success) {
      // Guardar token y usuario en localStorage
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      
      showMessage('¡Registro exitoso! Redirigiendo...', 'success');
      
      // Redirigir después de 1 segundo
      setTimeout(() => {
        window.location.href = 'index.html'; // Cambia a tu página principal
      }, 1000);
    } else {
      showMessage(data.message || 'Error al registrarse', 'error');
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  } catch (error) {
    console.error('Error en registro:', error);
    showMessage('Error al conectar con el servidor', 'error');
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}

// ============================================
// FUNCIÓN: LOGIN DE USUARIO
// ============================================
async function handleLogin(event) {
  event.preventDefault();
  
  // Obtener valores del formulario
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  // Validación básica
  if (!email || !password) {
    showMessage('Por favor ingresa email y contraseña', 'error');
    return;
  }

  // Mostrar indicador de carga
  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Iniciando sesión...';
  submitBtn.disabled = true;

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    const data = await response.json();

    if (data.success) {
      // Guardar token y usuario en localStorage
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      
      showMessage('¡Login exitoso! Redirigiendo...', 'success');
      
      // Redirigir después de 1 segundo
      setTimeout(() => {
        window.location.href = 'index.html'; // Cambia a tu página principal
      }, 1000);
    } else {
      showMessage(data.message || 'Credenciales incorrectas', 'error');
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  } catch (error) {
    console.error('Error en login:', error);
    showMessage('Error al conectar con el servidor', 'error');
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}

// ============================================
// FUNCIÓN: CERRAR SESIÓN
// ============================================
function handleLogout() {
  // Limpiar localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  showMessage('Sesión cerrada exitosamente', 'success');
  
  // Redirigir al login
  setTimeout(() => {
    window.location.href = 'login.html';
  }, 1000);
}

// ============================================
// FUNCIÓN: VERIFICAR AUTENTICACIÓN
// ============================================
function isAuthenticated() {
  return localStorage.getItem('token') !== null;
}

// ============================================
// FUNCIÓN: OBTENER USUARIO ACTUAL
// ============================================
function getCurrentUser() {
  const userString = localStorage.getItem('user');
  return userString ? JSON.parse(userString) : null;
}

// ============================================
// FUNCIÓN: PROTEGER PÁGINAS
// ============================================
function protectPage() {
  if (!isAuthenticated()) {
    window.location.href = 'login.html';
  }
}

// ============================================
// FUNCIÓN: REDIRIGIR SI YA ESTÁ AUTENTICADO
// ============================================
function redirectIfAuthenticated() {
  if (isAuthenticated()) {
    window.location.href = 'index.html';
  }
}

// ============================================
// FUNCIÓN: MOSTRAR INFO DEL USUARIO
// ============================================
function displayUserInfo() {
  const user = getCurrentUser();
  if (user) {
    // Actualizar nombre de usuario en navbar
    const userNameElements = document.querySelectorAll('.user-name');
    userNameElements.forEach(el => {
      el.textContent = user.nombre;
    });

    // Actualizar email
    const userEmailElements = document.querySelectorAll('.user-email');
    userEmailElements.forEach(el => {
      el.textContent = user.email;
    });
  }
}

// ============================================
// FUNCIÓN: HACER PETICIONES AUTENTICADAS
// ============================================
async function fetchWithAuth(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    });

    // Si el token expiró, cerrar sesión
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      showMessage('Sesión expirada. Por favor inicia sesión nuevamente', 'error');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error en petición:', error);
    showMessage('Error al conectar con el servidor', 'error');
    return null;
  }
}

// ============================================
// FUNCIÓN: MOSTRAR MENSAJES
// ============================================
function showMessage(message, type = 'info') {
  // Buscar contenedor de mensajes existente
  let messageContainer = document.getElementById('message-container');
  
  // Si no existe, crearlo
  if (!messageContainer) {
    messageContainer = document.createElement('div');
    messageContainer.id = 'message-container';
    messageContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      max-width: 400px;
    `;
    document.body.appendChild(messageContainer);
  }

  // Crear elemento de mensaje
  const messageDiv = document.createElement('div');
  messageDiv.classnombre = `alert alert-${type}`;
  
  // Colores según el tipo
  const colors = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6'
  };

  messageDiv.style.cssText = `
    background-color: ${colors[type] || colors.info};
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    margin-bottom: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    animation: slideIn 0.3s ease-out;
  `;

  messageDiv.textContent = message;

  // Agregar animación
  if (!document.getElementById('message-animation-style')) {
    const style = document.createElement('style');
    style.id = 'message-animation-style';
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  messageContainer.appendChild(messageDiv);

  // Eliminar después de 5 segundos
  setTimeout(() => {
    messageDiv.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => {
      messageDiv.remove();
    }, 300);
  }, 5000);
}

// ============================================
// EXPORTAR FUNCIONES (si usas módulos ES6)
// ============================================
// export { 
//   handleRegister, 
//   handleLogin, 
//   handleLogout, 
//   isAuthenticated, 
//   getCurrentUser,
//   protectPage,
//   redirectIfAuthenticated,
//   displayUserInfo,
//   fetchWithAuth,
//   showMessage
// };