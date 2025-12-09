import React from 'react';
import { Heart, MapPin, Calendar } from 'lucide-react';

const PetCard = ({ pet, onClick }) => {
    if (!pet) return null;

    // Obtener la primera foto o usar placeholder
    const petImage = pet.photos?.[0]?.url || pet.photos?.[0] || 'https://via.placeholder.com/300x300?text=Sin+Foto';

    // Calcular edad
    const getAge = () => {
        if (!pet.age) return 'Edad desconocida';
        if (pet.age < 1) return `${Math.round(pet.age * 12)} meses`;
        return `${Math.round(pet.age)} años`;
    };

    // Color según género
    const getGenderColor = () => {
        if (pet.gender === 'macho') return 'text-blue-600 bg-blue-100';
        if (pet.gender === 'hembra') return 'text-pink-600 bg-pink-100';
        return 'text-gray-600 bg-gray-100';
    };

    // Color según estado
    const getStatusBadge = () => {
        const statuses = {
            available: { text: 'Disponible', color: 'bg-green-100 text-green-700' },
            pending: { text: 'En proceso', color: 'bg-yellow-100 text-yellow-700' },
            adopted: { text: 'Adoptado', color: 'bg-blue-100 text-blue-700' },
            unavailable: { text: 'No disponible', color: 'bg-gray-100 text-gray-700' }
        };
        return statuses[pet.status] || statuses.available;
    };

    const statusBadge = getStatusBadge();


    const toggleFavorite = async () => {
  const endpoint = isFavorite ? "/favorites/remove" : "/favorites/add";

  await fetch(`http://localhost:4000${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, petId: pet._id }),
  });

  setIsFavorite(!isFavorite);
};



    return (
        <div 
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
            onClick={() => onClick && onClick(pet)}
        >
            {/* Imagen */}
            <div className="relative h-64 overflow-hidden">
                <img
                    src={petImage}
                    alt={pet.name || 'Mascota'}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x300?text=Sin+Foto';
                    }}
                />
                
                {/* Badge de estado */}
                <div className="absolute top-3 right-3">
                    <span className={`${statusBadge.color} px-3 py-1 rounded-full text-xs font-semibold`}>
                        {statusBadge.text}
                    </span>
                </div>

                {/* Botón de favorito */}
                <button 
                    className="absolute top-3 left-3 bg-white p-2 rounded-full shadow-md hover:bg-red-50 transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                        // Lógica de favoritos
                    }}
                >
                    <Heart className="w-5 h-5 text-gray-600 hover:text-red-500" />
                </button>
            </div>

            {/* Contenido */}
            <div className="p-4">
                {/* Nombre y género */}
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-900">
                        {pet.name || 'Sin nombre'}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getGenderColor()}`}>
                        {pet.gender === 'macho' ? '♂ Macho' : pet.gender === 'hembra' ? '♀ Hembra' : 'N/A'}
                    </span>
                </div>

                {/* Especie y raza */}
                <p className="text-gray-600 text-sm mb-3">
                    {pet.species ? pet.species.charAt(0).toUpperCase() + pet.species.slice(1) : 'Especie'} 
                    {pet.breed && ` • ${pet.breed}`}
                </p>

                {/* Información adicional */}
                <div className="space-y-2">
                    {/* Edad */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{getAge()}</span>
                    </div>

                    {/* Ubicación */}
                    {pet.location?.city && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>{pet.location.city}</span>
                        </div>
                    )}
                </div>

                {/* Descripción corta */}
                {pet.description && (
                    <p className="text-gray-600 text-sm mt-3 line-clamp-2">
                        {pet.description}
                    </p>
                )}

                {/* Características destacadas */}
                {pet.characteristics && (
                    <div className="flex flex-wrap gap-2 mt-3">
                        {pet.characteristics.slice(0, 3).map((char, index) => (
                            <span 
                                key={index}
                                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                            >
                                {char}
                            </span>
                        ))}
                    </div>
                )}

                {/* Botón de acción */}
                <button 
                    className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                        onClick && onClick(pet);
                    }}
                >
                    Ver detalles
                </button>
            </div>
        </div>
    );
};

export default PetCard;