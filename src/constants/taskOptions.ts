export interface ColorOption {
  id: string;
  name: string;
  hex: string;
  bgLight: string;
}

export interface IconOption {
  id: string;
  symbol: string;
  label: string;
}

export const TASK_COLORS: ColorOption[] = [
  { id: 'red', name: 'Vermelho', hex: '#EF4444', bgLight: '#FEF2F2' },
  { id: 'blue', name: 'Azul', hex: '#3B82F6', bgLight: '#EFF6FF' },
  { id: 'green', name: 'Verde', hex: '#10B981', bgLight: '#ECFDF5' },
  { id: 'yellow', name: 'Amarelo', hex: '#F59E0B', bgLight: '#FFFBEB' },
  { id: 'purple', name: 'Roxo', hex: '#8B5CF6', bgLight: '#F5F3FF' },
  { id: 'pink', name: 'Rosa', hex: '#EC4899', bgLight: '#FDF2F8' },
  { id: 'indigo', name: 'Índigo', hex: '#6366F1', bgLight: '#EEF2FF' },
  { id: 'teal', name: 'Verde Água', hex: '#14B8A6', bgLight: '#F0FDFA' },
  { id: 'orange', name: 'Laranja', hex: '#F97316', bgLight: '#FFF7ED' },
  { id: 'slate', name: 'Cinza', hex: '#64748B', bgLight: '#F8FAFC' },
];

export const TASK_ICONS: IconOption[] = [
  { id: 'doc', symbol: '📝', label: 'Nota' },
  { id: 'idea', symbol: '💡', label: 'Ideia' },
  { id: 'sweep', symbol: '🧹', label: 'Varrer' },
  { id: 'bed', symbol: '🛏️', label: 'Arrumar' },
  { id: 'shirt', symbol: '👔', label: 'Roupa' },
  { id: 'book', symbol: '📚', label: 'Estudar' },
  { id: 'dish', symbol: '🍽️', label: 'Lavar' },
  { id: 'plant', symbol: '🪴', label: 'Molhar' },
  { id: 'hungry', symbol: '🐱', label: 'Comida' },
  { id: 'walk', symbol: '🐕‍🦺', label: 'Passear' },
];
