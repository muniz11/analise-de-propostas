import React from 'react';
import { Property, Unit } from '../types';

interface PropertySelectorProps {
  properties: Property[];
  selectedPropertyId: string;
  onSelectProperty: (id: string) => void;
  selectedUnitId: string;
  onSelectUnit: (id: string) => void;
  units: Unit[];
}

const PropertySelector: React.FC<PropertySelectorProps> = ({
  properties,
  selectedPropertyId,
  onSelectProperty,
  selectedUnitId,
  onSelectUnit,
  units,
}) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="property-select" className="block text-sm font-medium text-gray-700 mb-1">
            Empreendimento
          </label>
          <select
            id="property-select"
            value={selectedPropertyId}
            onChange={(e) => onSelectProperty(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-700 text-white border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            {properties.map((prop) => (
              <option key={prop.id} value={prop.id} className="text-black bg-white">
                {prop.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="unit-select" className="block text-sm font-medium text-gray-700 mb-1">
            Unidade
          </label>
          <select
            id="unit-select"
            value={selectedUnitId}
            onChange={(e) => onSelectUnit(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-700 text-white border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            {units.map((unit) => (
              <option key={unit.id} value={unit.id} className="text-black bg-white">
                {unit.id}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default PropertySelector;