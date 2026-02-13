import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Inicio', icon: '🏠' },
    { path: '/adoptar', label: 'Adoptar', icon: '🐶' },
    { path: '/publicar', label: 'Publicar', icon: '📝' },
    { path: '/adoptar/crear', label: 'Crear adopción', icon: '🐾' },
    
    // ❌ REMOVIDO - Esta línea la quitamos:
    // { path: '/ai-assistant', label: 'Asistente IA', icon: '🤖', gradient: true },
    
    { path: '/amigos', label: 'Amigos', icon: '👥' },
    { path: '/ajustes', label: 'Ajustes', icon: '⚙️' }
  ];

  return (
    <aside className="w-64 bg-white h-screen shadow-xl fixed left-0 top-16 p-6 flex flex-col">
      <nav className="flex flex-col space-y-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          // Ya no necesitamos el if (item.gradient) porque no hay items con gradient
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${
                isActive
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold shadow-md'
                  : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:text-white'
              }`}
            >
              {item.icon} {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;