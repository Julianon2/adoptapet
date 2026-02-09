import { useState, useEffect } from 'react';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import BottomNav from '../components/layout/BottomNav';
import PetCard from '../components/common/PetCard';
import PetModal from '../components/common/PetModal';
import FilterSection from '../components/adoptar/FilterSection';
import { PawPrint } from 'lucide-react';

export default function Adoptar() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    size: '',
    age: '',
    location: '',
    featured: false,
    vaccinated: false,
    sterilized: false
  });

  const [selectedPet, setSelectedPet] = useState(null);

  // Cargar mascotas desde el backend
  useEffect(() => {
    loadPets();
  }, []);

  const loadPets = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📥 Cargando mascotas desde: http://localhost:5000/api/pets/adopcion');
      
      const response = await fetch('http://localhost:5000/api/pets/adopcion');
      
      if (!response.ok) {
        throw new Error('Error al cargar mascotas');
      }

      const result = await response.json();
      console.log('📦 Respuesta del servidor:', result);
      
      // Extraer el array de mascotas
      let data;
      if (result.success && result.data) {
        data = result.data;
      } else if (Array.isArray(result)) {
        data = result;
      } else if (result.pets) {
        data = result.pets;
      } else {
        console.error('❌ Formato de respuesta desconocido:', result);
        throw new Error('Formato de respuesta inválido');
      }
      
      if (!Array.isArray(data)) {
        console.error('❌ La respuesta no es un array:', data);
        throw new Error('El servidor no devolvió un array de mascotas');
      }
      
      console.log('✅ Mascotas recibidas:', data.length);

      // Transformar datos del backend al formato del componente
      const formattedPets = data.map(pet => {
        // Procesar fotos con URL completa
        let photos = [];
        if (pet.photos && Array.isArray(pet.photos) && pet.photos.length > 0) {
          photos = pet.photos.map(photo => `http://localhost:5000${photo}`);
        } else if (pet.mainPhoto) {
          photos = [`http://localhost:5000${pet.mainPhoto}`];
        }

        return {
          _id: pet._id,
          id: pet._id,
          name: pet.name || 'Sin nombre',
          species: pet.species || 'desconocido',
          type: pet.species ? (pet.species.charAt(0).toUpperCase() + pet.species.slice(1)) : 'Desconocido',
          breed: pet.breed || 'Mestizo',
          age: pet.age?.value || 0,
          ageFormatted: pet.age ? `${pet.age.value} ${pet.age.unit}` : 'Desconocida',
          size: pet.size || 'mediano',
          sizeFormatted: pet.size ? (pet.size.charAt(0).toUpperCase() + pet.size.slice(1)) : 'Mediano',
          gender: pet.gender || 'desconocido',
          genderFormatted: pet.gender ? (pet.gender.charAt(0).toUpperCase() + pet.gender.slice(1)) : 'Desconocido',
          location: pet.location || { city: 'No especificada' },
          description: pet.description || 'Sin descripción',
          photos: photos,
          mainPhoto: pet.mainPhoto ? `http://localhost:5000${pet.mainPhoto}` : null,
          vaccinated: pet.healthInfo?.vaccinated || false,
          sterilized: pet.healthInfo?.sterilized || false,
          featured: pet.featured || false,
          status: pet.status || 'available',
          adoptionFee: pet.adoptionFee || '$0',
          healthInfo: pet.healthInfo || {},
          contact: {
            organization: pet.shelter?.name || pet.owner?.nombre || pet.owner?.name || 'Contacto no disponible',
            phone: pet.contactInfo?.phone || 'No disponible'
          },
          owner: pet.owner,
          createdAt: pet.createdAt
        };
      });

      setPets(formattedPets);
      console.log('✅ Mascotas formateadas:', formattedPets.length);
      console.log('📸 Primera mascota fotos:', formattedPets[0]?.photos);

    } catch (err) {
      console.error('❌ Error completo al cargar mascotas:', err);
      setError(err.message || 'Error al cargar las mascotas');
      setPets([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para filtrar mascotas
  const filterPets = () => {
    return pets.filter(pet => {
      // Filtro de búsqueda por nombre
      if (filters.search && !pet.name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Filtro por tipo
      if (filters.type && filters.type !== 'all' && pet.species !== filters.type.toLowerCase()) {
        return false;
      }

      // Filtro por tamaño
      if (filters.size && filters.size !== 'all' && pet.size !== filters.size.toLowerCase()) {
        return false;
      }

      // Filtro por edad
      if (filters.age && filters.age !== 'all') {
        const ageNum = parseInt(pet.age);
        if (filters.age === 'puppy' && ageNum > 1) return false;
        if (filters.age === 'young' && (ageNum < 1 || ageNum > 3)) return false;
        if (filters.age === 'adult' && (ageNum < 3 || ageNum > 7)) return false;
        if (filters.age === 'senior' && ageNum < 7) return false;
      }

      // Filtro por ubicación
      if (filters.location && pet.location?.city !== filters.location) {
        return false;
      }

      // Filtros de checkboxes
      if (filters.featured && !pet.featured) return false;
      if (filters.vaccinated && !pet.vaccinated) return false;
      if (filters.sterilized && !pet.sterilized) return false;

      return true;
    });
  };

  const filteredPets = filterPets();

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      type: 'all',
      size: 'all',
      age: 'all',
      location: '',
      featured: false,
      vaccinated: false,
      sterilized: false
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Cargando mascotas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20 md:pb-8">
      <Header />
      
      <div className="max-w-7xl mx-auto px-3 md:px-4 pt-4 md:pt-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          
          {/* SIDEBAR IZQUIERDO */}
          <div className="hidden md:block md:col-span-3">
            <Sidebar />
          </div>

          {/* CONTENIDO PRINCIPAL */}
          <main className="col-span-1 md:col-span-9">
            
            {/* Header de la página */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-2xl shadow-lg">
                  <PawPrint className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
                  Encuentra tu Compañero
                </h1>
              </div>
              <p className="text-gray-600 ml-16">
                {filteredPets.length} mascota{filteredPets.length !== 1 ? 's' : ''} esperando un hogar
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                <p className="font-semibold">Error al cargar mascotas</p>
                <p className="text-sm">{error}</p>
                <button 
                  onClick={loadPets}
                  className="mt-2 text-sm underline hover:no-underline"
                >
                  Intentar de nuevo
                </button>
              </div>
            )}

            {/* Filtros */}
            <FilterSection 
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
            />

            {/* Grid de mascotas - ✅ CORREGIDO con key={pet._id} */}
            {filteredPets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPets.map(pet => (
                  <PetCard 
                    key={pet._id}
                    pet={pet}
                    onClick={() => setSelectedPet(pet)}
                  />
                ))}
              </div>
            ) : (
              // Estado vacío
              <div className="text-center py-20">
                <div className="bg-white rounded-3xl p-12 max-w-md mx-auto shadow-md">
                  {pets.length === 0 ? (
                    <>
                      <div className="text-6xl mb-4">🐾</div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">
                        Aún no hay mascotas
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Sé el primero en publicar una mascota en adopción
                      </p>
                      <a 
                        href="/crear-adopcion"
                        className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                      >
                        Publicar mascota
                      </a>
                    </>
                  ) : (
                    <>
                      <div className="text-6xl mb-4">🔍</div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">
                        No hay mascotas
                      </h3>
                      <p className="text-gray-600 mb-6">
                        No encontramos mascotas que coincidan con tus filtros
                      </p>
                      <button 
                        onClick={handleClearFilters}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                      >
                        Limpiar Filtros
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

          </main>
          
        </div>
      </div>

      <BottomNav />

      {/* Modal de detalles */}
      {selectedPet && (
        <PetModal 
          pet={selectedPet}
          onClose={() => setSelectedPet(null)}
        />
      )}
    </div>
  );
}