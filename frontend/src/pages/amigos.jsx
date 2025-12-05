//esta pagina es de amigos

import { useState } from 'react';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import BottomNav from '../components/layout/BottomNav';
import FriendCard from '../components/common/FriendCard';
import ProfileModal from '../components/common/ProfileModal';
import MessageModal from '../components/common/MessageModal';
import SearchBar from '../components/common/SearchBar';
import { Users } from 'lucide-react';

// Datos dummy de amigos
const DUMMY_FRIENDS = [
  {
    id: 1,
    name: "María García",
    online: true,
    lastSeen: "Ahora",
    mutualFriends: 12,
    location: "Bogotá, Colombia",
    friendsSince: "Enero 2023",
    bio: "Amante de los animales 🐶🐱 Voluntaria en refugios los fines de semana. Me encanta ayudar a encontrar hogares para perritos y gatitos.",
    interests: ["Mascotas", "Voluntariado", "Fotografía", "Naturaleza"]
  },
  {
    id: 2,
    name: "Carlos Rodríguez",
    online: false,
    lastSeen: "hace 2 horas",
    mutualFriends: 8,
    location: "Medellín, Colombia",
    friendsSince: "Marzo 2023",
    bio: "Veterinario de profesión y amante de los golden retrievers. Siempre dispuesto a dar consejos sobre el cuidado de mascotas.",
    interests: ["Veterinaria", "Perros", "Senderismo", "Café"]
  },
  {
    id: 3,
    name: "Ana Martínez",
    online: true,
    lastSeen: "Ahora",
    mutualFriends: 15,
    location: "Cali, Colombia",
    friendsSince: "Febrero 2023",
    bio: "Rescatista de gatos callejeros. Mi misión es darles una segunda oportunidad a todos los michis que lo necesiten 💕",
    interests: ["Gatos", "Rescate Animal", "Yoga", "Lectura"]
  },
  {
    id: 4,
    name: "Luis Fernández",
    online: false,
    lastSeen: "hace 1 día",
    mutualFriends: 5,
    location: "Barranquilla, Colombia",
    friendsSince: "Abril 2023",
    bio: "Entrenador canino profesional. Me especializo en comportamiento y obediencia. ¡Tu perro también puede ser un buen chico!",
    interests: ["Entrenamiento", "Deportes", "Música", "Viajes"]
  },
  {
    id: 5,
    name: "Laura Sánchez",
    online: true,
    lastSeen: "Ahora",
    mutualFriends: 20,
    location: "Bogotá, Colombia",
    friendsSince: "Diciembre 2022",
    bio: "Administradora de refugio de animales. Cada día es una nueva aventura salvando vidas peludas 🐾",
    interests: ["Refugios", "Gestión", "Cocina", "Arte"]
  },
  {
    id: 6,
    name: "Pedro Gómez",
    online: false,
    lastSeen: "hace 3 horas",
    mutualFriends: 10,
    location: "Cartagena, Colombia",
    friendsSince: "Mayo 2023",
    bio: "Fotógrafo de mascotas. Capturo los mejores momentos de tu mejor amigo. También hago sesiones para adopciones.",
    interests: ["Fotografía", "Diseño", "Playa", "Tecnología"]
  },
  {
    id: 7,
    name: "Sofía López",
    online: true,
    lastSeen: "Ahora",
    mutualFriends: 18,
    location: "Bucaramanga, Colombia",
    friendsSince: "Junio 2023",
    bio: "Estudiante de veterinaria y foster mom temporal. Siempre tengo espacio en mi corazón para un peludo más.",
    interests: ["Estudiante", "Foster", "Baile", "Cine"]
  },
  {
    id: 8,
    name: "Diego Torres",
    online: false,
    lastSeen: "hace 5 horas",
    mutualFriends: 7,
    location: "Pereira, Colombia",
    friendsSince: "Julio 2023",
    bio: "Organizador de eventos de adopción. Si quieres ser parte del cambio, únete a nuestras jornadas mensuales.",
    interests: ["Eventos", "Activismo", "Fitness", "Gaming"]
  }
];

export default function Amigos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messageModalFriend, setMessageModalFriend] = useState(null);

  // Filtrar amigos por búsqueda
  const filteredFriends = DUMMY_FRIENDS.filter(friend =>
    friend.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handlers
  const handleViewProfile = (friend) => {
    setSelectedFriend(friend);
  };

  const handleOpenMessage = (friend) => {
    setMessageModalFriend(friend);
  };

  const handleSendMessage = (friend, message) => {
    console.log(`Mensaje para ${friend.name}: ${message}`);
    // Aquí irá la lógica para enviar el mensaje
    alert(`Mensaje enviado a ${friend.name}: "${message}"`);
  };

  const handleRemoveFriend = (friend) => {
    if (window.confirm(`¿Estás seguro de eliminar a ${friend.name} de tus amigos?`)) {
      console.log(`Eliminando amigo: ${friend.name}`);
      // Aquí irá la lógica para eliminar el amigo
      alert(`${friend.name} ha sido eliminado de tu lista de amigos`);
      setSelectedFriend(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20 md:pb-8">
      <Header />
      
      <div className="max-w-7xl mx-auto px-3 md:px-4 pt-4 md:pt-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          
          {/* SIDEBAR IZQUIERDO - 3 columnas */}
          <div className="hidden md:block md:col-span-3">
            <Sidebar />
          </div>

          {/* CONTENIDO PRINCIPAL - 9 columnas */}
          <main className="col-span-1 md:col-span-9">
            
            {/* Header de la página */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-2xl shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
                  Mis Amigos
                </h1>
              </div>
              <p className="text-gray-600 ml-16">
                {filteredFriends.length} amigo{filteredFriends.length !== 1 ? 's' : ''} en tu lista
              </p>
            </div>

            {/* Barra de búsqueda */}
            <div className="mb-6">
              <SearchBar 
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
              />
            </div>

            {/* Grid de amigos */}
            {filteredFriends.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFriends.map(friend => (
                  <FriendCard 
                    key={friend.id}
                    friend={friend}
                    onViewProfile={handleViewProfile}
                    onSendMessage={handleOpenMessage}
                  />
                ))}
              </div>
            ) : (
              // Estado vacío
              <div className="text-center py-20">
                <div className="bg-white rounded-3xl p-12 max-w-md mx-auto shadow-md">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    No hay amigos
                  </h3>
                  <p className="text-gray-600 mb-6">
                    No encontramos amigos con ese nombre
                  </p>
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    Limpiar Búsqueda
                  </button>
                </div>
              </div>
            )}

          </main>
          
        </div>
      </div>

      <BottomNav />

      {/* Modal de perfil */}
      {selectedFriend && (
        <ProfileModal 
          friend={selectedFriend}
          onClose={() => setSelectedFriend(null)}
          onSendMessage={handleOpenMessage}
          onRemoveFriend={handleRemoveFriend}
        />
      )}

      {/* Modal de mensaje */}
      {messageModalFriend && (
        <MessageModal 
          friend={messageModalFriend}
          onClose={() => setMessageModalFriend(null)}
          onSendMessage={handleSendMessage}
        />
      )}
    </div>
  );
}