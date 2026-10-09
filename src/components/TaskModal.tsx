import React, { useState } from 'react';
import { TASK_COLORS, TASK_ICONS } from '../constants/taskOptions';
import { UserLink } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface TaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (taskData: {
    title: string;
    date: string;
    color: string;
    icon: string;
    linkId: string;
    linkName: string;
    repeatDays: number;
  }) => Promise<void>;
  initialDate: string;
  userLinks: UserLink[];
  editingTask?: {
    id: string;
    title: string;
    date: string;
    color: string;
    icon: string;
    linkId: string;
    linkName: string;
  } | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  visible,
  onClose,
  onSave,
  initialDate,
  userLinks,
  editingTask,
}) => (
  <TaskModalForm
    key={`${visible}:${initialDate}:${JSON.stringify(editingTask)}:${JSON.stringify(userLinks)}`}
    visible={visible}
    onClose={onClose}
    onSave={onSave}
    initialDate={initialDate}
    userLinks={userLinks}
    editingTask={editingTask}
  />
);

const TaskModalForm: React.FC<TaskModalProps> = ({
  visible,
  onClose,
  onSave,
  initialDate,
  userLinks,
  editingTask,
}) => {
  const [title, setTitle] = useState(editingTask?.title || '');
  const date = editingTask?.date || initialDate;
  const [selectedColor, setSelectedColor] = useState(editingTask?.color || TASK_COLORS[0].hex);
  const [selectedIcon, setSelectedIcon] = useState(editingTask?.icon || TASK_ICONS[0].symbol);
  const [selectedLinkId, setSelectedLinkId] = useState(editingTask?.linkId || userLinks[0]?.id || 'link_1');
  const [repeatDays, setRepeatDays] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { colors } = useTheme();

  if (!visible) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Por favor, informe o título da tarefa.');
      return;
    }

    const assignedLink = (userLinks && userLinks.length > 0)
      ? (userLinks.find((l) => l.id === selectedLinkId) || userLinks[0])
      : { id: 'link_1', name: 'Link 1 (Principal)', code: 'link_1' };

    setIsSubmitting(true);
    setError('');

    try {
      await onSave({
        title: title.trim(),
        date,
        color: selectedColor,
        icon: selectedIcon,
        linkId: assignedLink.id,
        linkName: assignedLink.name,
        repeatDays: editingTask ? 1 : repeatDays,
      });
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar tarefa:', err);
      setError('Falha ao salvar tarefa. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col transition-all"
        style={{ backgroundColor: colors.cardBg }}
      >
        <div
          className="flex justify-between items-center mb-4 pb-3 border-b"
          style={{ borderBottomColor: colors.borderColor }}
        >
          <h3 className="text-lg font-bold" style={{ color: colors.textPrimary }}>
            {editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="text-lg font-bold" style={{ color: colors.textSecondary }}>✕</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 space-y-4">
          {error ? (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 p-2.5 rounded-xl text-red-600 dark:text-red-400 text-xs text-center font-medium">
              {error}
            </div>
          ) : null}

          {/* Title Input */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
              Título da Tarefa
            </label>
            <input
              type="text"
              className="w-full rounded-xl px-3.5 py-3 text-base border outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              style={{ backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.borderColor }}
              placeholder="Ex: Reunião de alinhamento"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          {/* Date Indicator */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
              Data Inicial
            </label>
            <div className="inline-flex items-center bg-blue-50 dark:bg-blue-950/50 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800">
              <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">📅 {date}</span>
            </div>
          </div>

          {/* Task Recurrence Options (Only for new tasks) */}
          {!editingTask ? (
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                🔄 Repetir Atividade (evita cadastrar manualmente dia a dia)
              </label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { days: 1, label: 'Não repetir' },
                  { days: 7, label: '7 dias' },
                  { days: 14, label: '14 dias' },
                  { days: 30, label: '30 dias' },
                ].map((opt) => {
                  const isSelected = repeatDays === opt.days;
                  return (
                    <button
                      key={opt.days}
                      type="button"
                      className={`px-3 py-2 rounded-xl border transition-all text-xs ${
                        isSelected ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-sm' : 'font-semibold'
                      }`}
                      style={!isSelected ? { backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textSecondary } : undefined}
                      onClick={() => setRepeatDays(opt.days)}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
              Escolha a Cor
            </label>
            <div className="flex flex-wrap gap-2">
              {TASK_COLORS.map((col) => {
                const isSelected = selectedColor === col.hex;
                return (
                  <button
                    key={col.id}
                    type="button"
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${
                      isSelected ? 'ring-2 ring-offset-2 ring-blue-600' : ''
                    }`}
                    style={{ backgroundColor: col.hex }}
                    onClick={() => setSelectedColor(col.hex)}
                  >
                    {isSelected ? <span className="text-white font-bold text-base">✓</span> : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
              Escolha o Ícone
            </label>
            <div className="flex flex-wrap gap-2">
              {TASK_ICONS.map((ico) => {
                const isSelected = selectedIcon === ico.symbol;
                return (
                  <button
                    key={ico.id}
                    type="button"
                    className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all text-xl ${
                      isSelected ? 'bg-blue-100 dark:bg-blue-950 border-2 border-blue-600 shadow-sm' : ''
                    }`}
                    style={!isSelected ? { backgroundColor: colors.inputBg, borderColor: colors.borderColor } : undefined}
                    onClick={() => setSelectedIcon(ico.symbol)}
                  >
                    <span>{ico.symbol}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* User Links Selector */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
              Link Executor
            </label>
            <div className="space-y-2">
              {userLinks.map((link) => {
                const isSelected = selectedLinkId === link.id;
                return (
                  <button
                    key={link.id}
                    type="button"
                    className={`w-full flex items-center rounded-xl p-3 border transition-all text-left ${
                      isSelected ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-600' : ''
                    }`}
                    style={!isSelected ? { backgroundColor: colors.inputBg, borderColor: colors.borderColor } : undefined}
                    onClick={() => setSelectedLinkId(link.id)}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 mr-2.5 flex items-center justify-center ${
                        isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-400'
                      }`}
                    >
                      {isSelected ? <div className="w-1.5 h-1.5 rounded-full bg-white" /> : null}
                    </div>
                    <span
                      className={`text-sm ${isSelected ? 'text-blue-700 dark:text-blue-300 font-bold' : 'font-medium'}`}
                      style={!isSelected ? { color: colors.textPrimary } : undefined}
                    >
                      {link.logo || '😊'} {link.name} ({link.code})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              className="flex-1 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              onClick={onClose}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-[2] py-3.5 rounded-xl text-white font-bold text-sm shadow-md transition-all ${
                isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'
              }`}
            >
              {isSubmitting ? (
                <span className="inline-block animate-spin">⏳</span>
              ) : repeatDays > 1 ? (
                `Criar em ${repeatDays} Dias`
              ) : (
                'Salvar Tarefa'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
