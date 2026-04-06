import React from 'react';
import { Zap, Droplets, Trash2, LayoutDashboard, FileBarChart, PlusCircle, Users } from 'lucide-react';
import { ResourceType, UserRole } from './types';

// Removed: POWERPLANT_OPERATOR, RECYCLING_COORDINATOR, WATER_TREATMENT_MEMBER

export const ROLE_TO_DOMAIN = {
  ENERGY_TECHNICIAN:   ResourceType.ELECTRICITY,
  NMC_MEMBER:          ResourceType.ELECTRICITY,
  PLUMBING_SPECIALIST: ResourceType.WATER,
  IRRIGATION_MANAGER:  ResourceType.WATER,
  WASTE_MANAGER:       ResourceType.WASTE,
  SANITATION_OFFICER:  ResourceType.WASTE,
};

export const ROLE_LAYERS = {
  [UserRole.OFFICER]:             'STRATEGIC',
  [UserRole.NMC_MEMBER]:          'STRATEGIC',
  [UserRole.IRRIGATION_MANAGER]:  'STRATEGIC',
  [UserRole.WASTE_MANAGER]:       'STRATEGIC',
  [UserRole.ENERGY_TECHNICIAN]:   'FIELD',
  [UserRole.PLUMBING_SPECIALIST]: 'FIELD',
  [UserRole.SANITATION_OFFICER]:  'FIELD',
};

export const FIELD_ROLES = [
  UserRole.ENERGY_TECHNICIAN,
  UserRole.PLUMBING_SPECIALIST,
  UserRole.SANITATION_OFFICER,
];

export const RESOURCE_CONFIG = {
  [ResourceType.ELECTRICITY]: {
    label: 'Electricity', unit: 'kWh', color: '#EAB308',
    bgClass: 'bg-yellow-50', textClass: 'text-yellow-600',
    icon: React.createElement(Zap, { size: 20, className: 'text-yellow-500' }),
    roles: [UserRole.ENERGY_TECHNICIAN, UserRole.NMC_MEMBER],
  },
  [ResourceType.WATER]: {
    label: 'Water', unit: 'Liters', color: '#3B82F6',
    bgClass: 'bg-blue-50', textClass: 'text-blue-600',
    icon: React.createElement(Droplets, { size: 20, className: 'text-blue-500' }),
    roles: [UserRole.PLUMBING_SPECIALIST, UserRole.IRRIGATION_MANAGER],
  },
  [ResourceType.WASTE]: {
    label: 'Waste', unit: 'Kg', color: '#10B981',
    bgClass: 'bg-emerald-50', textClass: 'text-emerald-600',
    icon: React.createElement(Trash2, { size: 20, className: 'text-emerald-500' }),
    roles: [UserRole.WASTE_MANAGER, UserRole.SANITATION_OFFICER],
  },
};

export const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard',  icon: React.createElement(LayoutDashboard, { size: 20 }), roles: Object.values(UserRole) },
  { id: 'data-entry', label: 'Data Entry', icon: React.createElement(PlusCircle,      { size: 20 }), roles: [UserRole.OFFICER] },
  { id: 'reports',    label: 'Reports',    icon: React.createElement(FileBarChart,    { size: 20 }), roles: Object.values(UserRole) },
  { id: 'management', label: 'Management', icon: React.createElement(Users,           { size: 20 }), roles: [UserRole.OFFICER] },
];

export const ROLE_GROUPS = {
  ENERGY: { label: 'Energy Operations', roles: [UserRole.ENERGY_TECHNICIAN, UserRole.NMC_MEMBER] },
  WATER:  { label: 'Water Utilities',   roles: [UserRole.PLUMBING_SPECIALIST, UserRole.IRRIGATION_MANAGER] },
  WASTE:  { label: 'Waste & Sanitation',roles: [UserRole.WASTE_MANAGER, UserRole.SANITATION_OFFICER] },
};
