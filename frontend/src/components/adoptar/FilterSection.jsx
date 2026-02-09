import React from 'react';

const FilterSection = ({ filters, onFilterChange, onClearFilters }) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800">🔍 Filtrar búsqueda</h2>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-gray-600 hover:text-purple-600 underline transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Tipo de mascota
          </label>
          <select
            value={filters.type || 'all'}
            onChange={(e) => onFilterChange('type', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
          >
            <option value="all">Todas</option>
            <option value="perro">Perros 🐕</option>
            <option value="gato">Gatos 🐱</option>
            <option value="otro">Otros 🐰</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Tamaño</label>
          <select
            value={filters.size || 'all'}
            onChange={(e) => onFilterChange('size', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
          >
            <option value="all">Todos</option>
            <option value="pequeño">Pequeño</option>
            <option value="mediano">Mediano</option>
            <option value="grande">Grande</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Edad</label>
          <select
            value={filters.age || 'all'}
            onChange={(e) => onFilterChange('age', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
          >
            <option value="all">Todas</option>
            <option value="puppy">Cachorro</option>
            <option value="young">Joven</option>
            <option value="adult">Adulto</option>
            <option value="senior">Senior</option>
          </select>
        </div>
      </div>

      {/* Checkboxes opcionales */}
      <div className="flex flex-wrap gap-4 mt-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.vaccinated || false}
            onChange={(e) => onFilterChange('vaccinated', e.target.checked)}
            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
          />
          <span className="text-sm text-gray-700">Solo vacunados</span>
        </label>
        
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.sterilized || false}
            onChange={(e) => onFilterChange('sterilized', e.target.checked)}
            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
          />
          <span className="text-sm text-gray-700">Solo esterilizados</span>
        </label>
      </div>
    </div>
  );
};

export default FilterSection;