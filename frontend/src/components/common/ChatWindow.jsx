import { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft } from 'lucide-react';

export default function ChatWindow({ chat, messages, onSendMessage, onBack }) {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll al último mensaje
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col bg-white shadow-lg rounded-xl overflow-hidden h-full">
      
      {/* Header - Estilo WhatsApp */}
      <header className="bg-[#f0f2f5] px-4 py-3 flex items-center gap-3 border-b border-gray-200">
        {onBack && (
          <button 
            onClick={onBack}
            className="md:hidden text-gray-600 hover:text-gray-800 -ml-2"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
        
        <img 
          src={chat.avatar} 
          alt={chat.name}
          className="w-10 h-10 rounded-full object-cover"
        />
        
        <div className="flex-1">
          <p className="font-semibold text-gray-900 text-[15px]">{chat.name}</p>
          <p className="text-xs text-gray-500">
            {chat.online ? 'En línea' : 'Desconectado'}
          </p>
        </div>
      </header>

      {/* Área de mensajes - Estilo WhatsApp */}
      <div 
        className="flex-1 overflow-y-auto px-4 py-3"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h100v100H0z\' fill=\'%23efeae2\'/%3E%3C/svg%3E")',
          backgroundColor: '#efeae2'
        }}
      >
        <div className="space-y-2">
          {messages.map((message, index) => {
            const isMe = message.sender === 'me';
            const showTime = index === messages.length - 1 || 
                            messages[index + 1]?.sender !== message.sender;
            
            return (
              <div
                key={message.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`
                    relative max-w-[75%] sm:max-w-[65%] rounded-lg px-3 py-2 shadow-sm
                    ${isMe 
                      ? 'bg-[#d9fdd3] text-gray-900' 
                      : 'bg-white text-gray-900'
                    }
                  `}
                  style={{
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word'
                  }}
                >
                  {/* Mensaje */}
                  <p className="text-[14.2px] leading-[19px] whitespace-pre-wrap break-words">
                    {message.text}
                  </p>
                  
                  {/* Hora - Estilo WhatsApp */}
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-[11px] text-gray-500 leading-none">
                      {message.time}
                    </span>
                    {isMe && (
                      <svg 
                        className="w-4 h-4 text-gray-500" 
                        viewBox="0 0 16 15" 
                        fill="none"
                      >
                        <path 
                          d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.267a.32.32 0 0 0 .484-.034l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.032L1.892 7.77a.366.366 0 0 0-.516.005l-.423.433a.364.364 0 0 0 .006.514l3.255 3.185a.32.32 0 0 0 .484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" 
                          fill="currentColor"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input - Estilo WhatsApp */}
      <footer className="bg-[#f0f2f5] px-3 py-2 flex items-end gap-2">
        <div className="flex-1 bg-white rounded-full px-4 py-2 flex items-center">
          <input 
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe un mensaje"
            className="flex-1 outline-none text-[15px] bg-transparent placeholder-gray-500"
          />
        </div>
        
        <button 
          onClick={handleSend}
          disabled={!newMessage.trim()}
          className={`
            p-3 rounded-full transition-all duration-200
            ${newMessage.trim()
              ? 'bg-[#25d366] hover:bg-[#20bd5a] text-white shadow-md' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          <Send className="w-5 h-5" />
        </button>
      </footer>
    </div>
  );
}