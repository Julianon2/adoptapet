//esta pagina es de amigos
import { X, Send } from 'lucide-react';
import { useState } from 'react';

export default function MessageModal({ friend, onClose, onSendMessage }) {
  const [message, setMessage] = useState('');

  if (!friend) return null;

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(friend, message);
      setMessage('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-300 to-blue-500 flex items-center justify-center text-white text-lg font-bold">
              {friend.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-gray-800">{friend.name}</h3>
              <p className="text-sm text-gray-500">{friend.online ? 'En línea' : 'Desconectado'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-all"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Área de mensaje */}
        <div className="p-6">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Escribe un mensaje para ${friend.name}...`}
            className="w-full h-40 p-4 border-2 border-gray-200 rounded-xl resize-none focus:outline-none focus:border-purple-500 transition-all"
            autoFocus
          />
        </div>

        {/* Footer con botones */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-700 to-pink-800 hover:shadow-lg text-white px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-80 disabled:cursor-not-allowed"
          >
            <Send size={20} />
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}