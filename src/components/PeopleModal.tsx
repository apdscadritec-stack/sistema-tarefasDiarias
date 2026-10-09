import React, { useState } from 'react';
import { Person } from '../context/AuthContext';

interface PeopleModalProps {
  visible: boolean;
  onClose: () => void;
  people: Person[];
  onAddPerson: (fullName: string, birthDate: string, gender: 'Masculino' | 'Feminino') => Promise<void>;
  onUpdatePerson: (personId: string, fullName: string, birthDate: string, gender: 'Masculino' | 'Feminino') => Promise<void>;
  onDeletePerson: (personId: string) => Promise<void>;
}

export const PeopleModal: React.FC<PeopleModalProps> = ({
  visible,
  onClose,
  people,
  onAddPerson,
  onUpdatePerson,
  onDeletePerson,
}) => {
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'Masculino' | 'Feminino'>('Masculino');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!visible) return null;

  const handleStartEdit = (person: Person) => {
    setEditingPerson(person);
    setFullName(person.fullName);
    setBirthDate(person.birthDate);
    setGender(person.gender);
    setError('');
  };

  const handleResetForm = () => {
    setEditingPerson(null);
    setFullName('');
    setBirthDate('');
    setGender('Masculino');
    setError('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !birthDate.trim()) {
      setError('Preencha o Nome Completo e a Data de Nascimento.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (editingPerson) {
        await onUpdatePerson(editingPerson.id, fullName.trim(), birthDate.trim(), gender);
      } else {
        await onAddPerson(fullName.trim(), birthDate.trim(), gender);
      }
      handleResetForm();
    } catch (err) {
      console.error('Erro ao salvar pessoa:', err);
      setError('Falha ao salvar pessoa. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto flex flex-col">
        <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">👥 Cadastro de Pessoas</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="text-lg text-slate-500 font-bold">✕</span>
          </button>
        </div>

        <div className="space-y-4">
          {/* Form Section */}
          <form onSubmit={handleSave} className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {editingPerson ? 'Editar Pessoa' : 'Cadastrar Nova Pessoa'}
            </h4>

            {error ? (
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 p-2 rounded-xl text-red-600 dark:text-red-400 text-xs text-center font-medium">
                {error}
              </div>
            ) : null}

            {/* Nome Completo */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nome Completo
              </label>
              <input
                type="text"
                className="w-full bg-white dark:bg-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Maria das Dores Silva"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            {/* Data de Nascimento */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data de Nascimento
              </label>
              <input
                type="text"
                className="w-full bg-white dark:bg-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 15/08/1995"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </div>

            {/* Sexo */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Sexo
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`flex-1 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                    gender === 'Masculino'
                      ? 'bg-blue-50 dark:bg-blue-950/50 border-2 border-blue-600 text-blue-700 dark:text-blue-300 font-bold'
                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400'
                  }`}
                  onClick={() => setGender('Masculino')}
                >
                  👨 Masculino
                </button>

                <button
                  type="button"
                  className={`flex-1 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                    gender === 'Feminino'
                      ? 'bg-blue-50 dark:bg-blue-950/50 border-2 border-blue-600 text-blue-700 dark:text-blue-300 font-bold'
                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400'
                  }`}
                  onClick={() => setGender('Feminino')}
                >
                  👩 Feminino
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              {editingPerson ? (
                <button
                  type="button"
                  className="flex-1 bg-slate-200 dark:bg-slate-700 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-300 transition-colors"
                  onClick={handleResetForm}
                >
                  Cancelar
                </button>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-[2] py-2.5 rounded-xl text-white font-bold text-xs shadow-sm transition-all ${
                  isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'
                }`}
              >
                {isSubmitting ? 'Salvando...' : editingPerson ? 'Salvar Alterações' : '+ Cadastrar'}
              </button>
            </div>
          </form>

          {/* Registered People */}
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
              Pessoas Cadastradas ({people.length})
            </h4>

            <div className="space-y-2">
              {people.map((person) => (
                <div
                  key={person.id}
                  className="bg-white dark:bg-slate-800 rounded-xl p-3 flex justify-between items-center border border-slate-200 dark:border-slate-700 shadow-sm"
                >
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {person.gender === 'Feminino' ? '👩' : '👨'} {person.fullName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Nascimento: {person.birthDate} | Sexo: {person.gender}
                    </p>
                  </div>

                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(person)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm transition-colors"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeletePerson(person.id)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm transition-colors"
                      title="Excluir"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}

              {people.length === 0 ? (
                <p className="text-center text-slate-400 text-xs py-3">
                  Nenhuma pessoa cadastrada ainda.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <button
          type="button"
          className="mt-4 w-full bg-slate-100 dark:bg-slate-700 py-3 rounded-xl text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          onClick={onClose}
        >
          Fechar
        </button>
      </div>
    </div>
  );
};
