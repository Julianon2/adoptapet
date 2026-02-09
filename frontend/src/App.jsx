import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Adoptar from './pages/Adoptar';
import Perfil from './pages/perfil';
import Notificaciones from './pages/Notificaciones';
import Registro from './pages/registro';
import Publicar from './pages/publicar';
import Chat from './pages/Chat';
import Ajustes from './pages/Ajustes';
import Amigos from './pages/amigos';

// ✅ NUEVO: importa la página de crear adopción
import CrearAdopcion from './pages/CrearAdopcion';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/" element={<Home />} />
        {/* ✅ Ruta para callback de Google OAuth */}
        <Route path="/Home" element={<Home />} />
        <Route path="/adoptar" element={<Adoptar />} />

        {/* ✅ NUEVA RUTA */}
        <Route path="/adoptar/crear" element={<CrearAdopcion />} />

        <Route path="/perfil" element={<Perfil />} />
        <Route path="/notificaciones" element={<Notificaciones />} />
        <Route path="/publicar" element={<Publicar />} />
        <Route path="/mensajes" element={<Chat />} />
        <Route path="/ajustes" element={<Ajustes />} />
        <Route path="/amigos" element={<Amigos />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
