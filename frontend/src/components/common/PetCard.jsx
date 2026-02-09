import React, { useState } from 'react';
import { Heart, MapPin, Calendar } from 'lucide-react';

const PetCard = ({ pet, onClick }) => {
    const [imageError, setImageError] = useState(false);

    if (!pet) return null;

    // Obtener la primera foto con fallback mejorado
    const getPetImage = () => {
        // Si hay error de imagen, usar fallback
        if (imageError) {
            return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect width="300" height="300" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="20" fill="%239ca3af"%3ESin Foto%3C/text%3E%3C/svg%3E';
        }

        // Intentar con photos array
        if (pet.photos && Array.isArray(pet.photos) && pet.photos.length > 0) {
            return pet.photos[0];
        }

        // Intentar con mainPhoto
        if (pet.mainPhoto) {
            return pet.mainPhoto;
        }

        // Fallback SVG
        return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect width="300" height="300" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="20" fill="%239ca3af"%3ESin Foto%3C/text%3E%3C/svg%3E';
    };

    const petImage = getPetImage();

    // Calcular edad
    const getAge = () => {
        if (pet.ageFormatted) return pet.ageFormatted;
        if (!pet.age) return 'Edad desconocida';
        if (pet.age < 1) return `${Math.round(pet.age * 12)} meses`;
        return `${Math.round(pet.age)} años`;
    };

    // Color según género
    const getGenderColor = () => {
        const gender = (pet.gender || '').toLowerCase();
        if (gender === 'macho' || gender === 'male') return 'text-blue-600 bg-blue-100';
        if (gender === 'hembra' || gender === 'female') return 'text-pink-600 bg-pink-100';
        return 'text-gray-600 bg-gray-100';
    };

    // Color según estado
    const getStatusBadge = () => {
        const statuses = {
            available: { text: 'Disponible', color: 'bg-green-100 text-green-700' },
            disponible: { text: 'Disponible', color: 'bg-green-100 text-green-700' },
            pending: { text: 'En proceso', color: 'bg-yellow-100 text-yellow-700' },
            adopted: { text: 'Adoptado', color: 'bg-blue-100 text-blue-700' },
            adoptado: { text: 'Adoptado', color: 'bg-blue-100 text-blue-700' },
            unavailable: { text: 'No disponible', color: 'bg-gray-100 text-gray-700' }
        };
        return statuses[pet.status] || statuses.available;
    };

    const statusBadge = getStatusBadge();

    const getGenderDisplay = () => {
        const gender = (pet.gender || '').toLowerCase();
        if (gender === 'macho' || gender === 'male') return '♂ Macho';
        if (gender === 'hembra' || gender === 'female') return '♀ Hembra';
        return 'N/A';
    };

    return (
        <div 
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
            onClick={() => onClick && onClick(pet)}
        >
            {/* Imagen */}
            <div className="relative h-64 overflow-hidden bg-gray-100">
                <img
                    src={petImage}
                    alt={pet.name || 'Mascota'}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                        console.error('Error cargando imagen:', petImage);
                        setImageError(true);
                        e.target.onerror = null; // Prevenir loop infinito
                    }}
                    onLoad={() => setImageError(false)}
                />
                
                {/* Badge de estado */}
                <div className="absolute top-3 right-3">
                    <span className={`${statusBadge.color} px-3 py-1 rounded-full text-xs font-semibold shadow-md`}>
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
                    <h3 className="text-xl font-bold text-gray-900 truncate">
                        {pet.name || 'Sin nombre'}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getGenderColor()} whitespace-nowrap`}>
                        {getGenderDisplay()}
                    </span>
                </div>

                {/* Especie y raza */}
                <p className="text-gray-600 text-sm mb-3 truncate">
                    {pet.type || (pet.species ? pet.species.charAt(0).toUpperCase() + pet.species.slice(1) : 'Especie')}
                    {pet.breed && ` • ${pet.breed}`}
                </p>

                {/* Información adicional */}
                <div className="space-y-2">
                    {/* Edad */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>{getAge()}</span>
                    </div>

                    {/* Ubicación */}
                    {pet.location?.city && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{pet.location.city}</span>
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
                {pet.characteristics && pet.characteristics.length > 0 && (
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

                {/* Info de salud */}
                <div className="flex gap-2 mt-3">
                    {pet.vaccinated && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            ✓ Vacunado
                        </span>
                    )}
                    {pet.sterilized && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            ✓ Esterilizado
                        </span>
                    )}
                </div>

                {/* Botón de acción */}
                <button 
                    className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
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