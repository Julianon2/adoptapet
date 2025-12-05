//esta pagina es de amigos
import { X, MessageCircle, UserMinus, MapPin, Calendar, Users } from 'lucide-react';

export default function ProfileModal({ friend, onClose, onSendMessage, onRemoveFriend }) {
  if (!friend) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        
        {/* Header con imagen de portada */}
        <div className="relative h-40 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-t-3xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white bg-opacity-20 backdrop-blur-sm p-2 rounded-full hover:bg-opacity-30 transition-all"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Avatar y nombre */}
        <div className="px-6 pb-6">
          <div className="flex flex-col items-center -mt-16 mb-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-300   to-blue-500 flex items-center justify-center text-white text-5xl font-bold border-4 border-white shadow-xl">
                {friend.name.charAt(0)}
              </div>
              {friend.online && (
                <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-white"></div>
              )}
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mt-4">{friend.name}</h2>
            <p className="text-gray-500">{friend.online ? 'En línea' : `Última vez ${friend.lastSeen}`}</p>
          </div>

          {/* Información del perfil */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3 text-gray-600">
              <MapPin className="w-5 h-5 text-purple-800" />
              <span>{friend.location}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Calendar className="w-5 h-5 text-purple-800" />
              <span>Amigos desde {friend.friendsSince}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Users className="w-5 h-5 text-purple-800" />
              <span>{friend.mutualFriends} amigos en común</span>
            </div>
          </div>

          {/* Bio */}
          {friend.bio && (
            <div className="mb-6">
              <h3 className="font-bold text-gray-800 mb-2">Acerca de</h3>
              <p className="text-gray-600 bg-gray-50 p-4 rounded-xl">{friend.bio}</p>
            </div>
          )}

          {/* Intereses */}
          {friend.interests && friend.interests.length > 0 && (
            <div className="mb-6">
              <h3 className="font-bold text-gray-800 mb-2">Intereses</h3>
              <div className="flex flex-wrap gap-2">
                {friend.interests.map((interest, index) => (
                  <span key={index} className="bg-gradient-to-r from-blue-100 to-pink-100 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                onSendMessage(friend);
                onClose();
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-500 hover:shadow-lg text-white px-6 py-3 rounded-xl font-semibold transition-all"
            >
              <MessageCircle size={20} />
              Enviar Mensaje
            </button>
            <button
              onClick={() => onRemoveFriend(friend)}
              className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-all"
            >
              <UserMinus size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}