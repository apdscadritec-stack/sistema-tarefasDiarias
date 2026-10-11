import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc
} from 'firebase/firestore';
import React, { useEffect, useMemo, useState } from 'react';
import { CalendarView } from '../components/CalendarView';
import { PeopleModal } from '../components/PeopleModal';
import { TaskModal } from '../components/TaskModal';
import { UserLinksModal } from '../components/UserLinksModal';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export interface Task {
  id: string;
  title: string;
  date: string;
  color: string;
  icon: string;
  linkId: string;
  linkName: string;
  status: 'Aguardando' | 'Concluida';
  createdAt?: any;
}

export const DashboardPage: React.FC = () => {
  const { 
    userData, 
    people,
    isPaid, 
    daysRemaining, 
    logout, 
    simulateTrialExpiry, 
    addPerson,
    updatePerson,
    deletePerson,
    updateLinkDetails 
  } = useAuth();
  
  const { colors, isDarkMode, toggleTheme } = useTheme();

  const now = new Date();
  const todayFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  const [selectedDate, setSelectedDate] = useState<string>(todayFormatted);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filterStatus, setFilterStatus] = useState<'todos' | 'Aguardando' | 'Concluida'>('todos');
  
  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isLinksModalOpen, setIsLinksModalOpen] = useState(false);
  const [isPeopleModalOpen, setIsPeopleModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isTestingAction, setIsTestingAction] = useState(false);

  // Subscribe to user's tasks in Firestore
  useEffect(() => {
    if (!userData?.uid) return;

    const tasksRef = collection(db, 'users', userData.uid, 'tasks');
    const q = query(tasksRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskList: Task[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const linkId = data.linkId || 'link_1';
        const linkCode = userData.userLinks.find((link) => link.id === linkId)?.code;
        if (linkCode && data.linkCode !== linkCode) {
          void updateDoc(doc(db, 'users', userData.uid, 'tasks', docSnap.id), { linkCode })
            .catch((error) => console.error('Erro ao atualizar o código do link da tarefa:', error));
        }

        return {
          id: docSnap.id,
          title: data.title || '',
          date: data.date || todayFormatted,
          color: data.color || '#3B82F6',
          icon: data.icon || '📝',
          linkId,
          linkName: data.linkName || 'Link 1',
          status: data.status || (data.completed ? 'Concluida' : 'Aguardando'),
          createdAt: data.createdAt,
        };
      });

      // Sort by createdAt descending locally
      taskList.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      setTasks(taskList);
    }, (error) => {
      console.error("Erro ao carregar tarefas:", error);
    });

    return () => unsubscribe();
  }, [userData?.uid, userData?.userLinks]);

  const taskDatesSet = useMemo(() => {
    return new Set(tasks.map((t) => t.date));
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesDate = t.date === selectedDate;
      const matchesStatus = filterStatus === 'todos' || t.status === filterStatus;
      return matchesDate && matchesStatus;
    });
  }, [tasks, selectedDate, filterStatus]);

  const handleSaveTask = async (taskData: {
    title: string;
    date: string;
    color: string;
    icon: string;
    linkId: string;
    linkName: string;
    repeatDays: number;
  }) => {
    if (!userData?.uid) {
      alert('Sessão do usuário não identificada. Tente fazer login novamente.');
      return;
    }

    const assignedLink = userData.userLinks.find((link) => link.id === taskData.linkId);
    if (!assignedLink) {
      alert('O link selecionado não existe. Atualize a página e tente novamente.');
      return;
    }

    const isoDate = new Date().toISOString();

    try {
      if (editingTask) {
        const taskRef = doc(db, 'users', userData.uid, 'tasks', editingTask.id);
        await updateDoc(taskRef, {
          title: taskData.title,
          date: taskData.date,
          color: taskData.color,
          icon: taskData.icon,
          linkId: taskData.linkId,
          linkCode: assignedLink.code,
          linkName: taskData.linkName,
          updatedAt: isoDate,
        });
      } else {
        const tasksRef = collection(db, 'users', userData.uid, 'tasks');
        const count = taskData.repeatDays || 1;

        // Base date calculation
        const baseParts = taskData.date.split('-');
        const year = parseInt(baseParts[0], 10);
        const month = parseInt(baseParts[1], 10) - 1;
        const day = parseInt(baseParts[2], 10);

        const startDate = new Date(year, month, day, 12, 0, 0);

        for (let i = 0; i < count; i++) {
          const nextDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
          const yyyy = nextDate.getFullYear();
          const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
          const dd = String(nextDate.getDate()).padStart(2, '0');
          const dateStr = `${yyyy}-${mm}-${dd}`;

          await addDoc(tasksRef, {
            title: taskData.title,
            date: dateStr,
            color: taskData.color,
            icon: taskData.icon,
            linkId: taskData.linkId,
            linkCode: assignedLink.code,
            linkName: taskData.linkName,
            status: 'Aguardando',
            completed: false,
            createdAt: isoDate,
          });
        }
      }
    } catch (err: any) {
      console.error('Erro ao salvar tarefa no Firestore:', err);
      alert('Não foi possível salvar a tarefa no banco de dados.');
      throw err;
    }
  };

  const handleToggleStatus = async (task: Task) => {
    if (!userData?.uid) return;
    const nextStatus = task.status === 'Concluida' ? 'Aguardando' : 'Concluida';
    try {
      const taskRef = doc(db, 'users', userData.uid, 'tasks', task.id);
      await updateDoc(taskRef, {
        status: nextStatus,
        completed: nextStatus === 'Concluida',
      });
    } catch (error) {
      console.error('Erro ao alternar status:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!userData?.uid) return;
    try {
      const taskRef = doc(db, 'users', userData.uid, 'tasks', taskId);
      await deleteDoc(taskRef);
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
    }
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleOpenNew = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleSimulateExpiry = async () => {
    setIsTestingAction(true);
    try {
      await simulateTrialExpiry();
    } catch (error) {
      console.error('Erro ao simular expiração:', error);
    } finally {
      setIsTestingAction(false);
    }
  };

  return (
    <div
      className="min-h-screen p-4 sm:p-6 transition-colors flex justify-center"
      style={{ backgroundColor: colors.bgPrimary }}
    >
      <div className="w-full max-w-md flex flex-col space-y-4">
        {/* Top User & Subscription Card */}
        <div 
          className="rounded-3xl p-4 border shadow-sm transition-colors"
          style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                Olá, {userData?.name || 'Usuário'} 👋
              </h1>
              <p className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>{userData?.email}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 p-2 rounded-xl text-base transition-colors"
                onClick={toggleTheme}
                title="Alternar tema"
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>

              <button
                type="button"
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors"
                onClick={logout}
              >
                Sair
              </button>
            </div>
          </div>

          {/* Subscription Status Badge */}
          <div className="mt-3">
            {isPaid ? (
              <div className="px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800">
                <span className="text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                  ✅ Assinatura Ativa (Acesso Total Liberado)
                </span>
              </div>
            ) : (
              <div className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800">
                <span className="text-blue-700 dark:text-blue-400 font-bold text-xs">
                  ⏳ Período: {daysRemaining} {daysRemaining === 1 ? 'dia restante' : 'dias restantes'}
                </span>
              </div>
            )}
          </div>

          {/* Management Buttons Row */}
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              className="flex-1 border rounded-xl py-2.5 px-3 font-bold text-xs transition-all hover:bg-slate-100 dark:hover:bg-slate-800"
              style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
              onClick={() => setIsPeopleModalOpen(true)}
            >
              👥 Pessoas ({people.length})
            </button>

            <button
              type="button"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition-all shadow-sm"
              onClick={() => setIsLinksModalOpen(true)}
            >
              🔗 Links
            </button>
          </div>
        </div>

        {/* Monthly Calendar */}
        <CalendarView
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          taskDates={taskDatesSet}
        />

        {/* Action Header & Date Filter */}
        <div className="flex justify-between items-center">
          <div className="flex items-baseline gap-1.5">
            <h2 className="text-base font-bold" style={{ color: colors.textPrimary }}>Tarefas de {selectedDate}</h2>
            <span className="text-xs" style={{ color: colors.textSecondary }}>({filteredTasks.length} tarefas)</span>
          </div>

          <button
            type="button"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-sm transition-all active:scale-95"
            onClick={handleOpenNew}
          >
            + Nova Tarefa
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex rounded-xl p-1 transition-colors" style={{ backgroundColor: colors.inputBg }}>
          <button
            type="button"
            className={`flex-1 py-1.5 text-center text-xs rounded-lg transition-all ${
              filterStatus === 'todos'
                ? 'bg-white dark:bg-slate-800 font-bold shadow-sm'
                : 'font-semibold'
            }`}
            style={{ color: filterStatus === 'todos' ? colors.textPrimary : colors.textSecondary }}
            onClick={() => setFilterStatus('todos')}
          >
            Todas
          </button>

          <button
            type="button"
            className={`flex-1 py-1.5 text-center text-xs rounded-lg transition-all ${
              filterStatus === 'Aguardando'
                ? 'bg-white dark:bg-slate-800 font-bold shadow-sm'
                : 'font-semibold'
            }`}
            style={{ color: filterStatus === 'Aguardando' ? colors.textPrimary : colors.textSecondary }}
            onClick={() => setFilterStatus('Aguardando')}
          >
            ⏳ Aguardando
          </button>

          <button
            type="button"
            className={`flex-1 py-1.5 text-center text-xs rounded-lg transition-all ${
              filterStatus === 'Concluida'
                ? 'bg-white dark:bg-slate-800 font-bold shadow-sm'
                : 'font-semibold'
            }`}
            style={{ color: filterStatus === 'Concluida' ? colors.textPrimary : colors.textSecondary }}
            onClick={() => setFilterStatus('Concluida')}
          >
            ✓ Concluídas
          </button>
        </div>

        {/* Task Cards List */}
        <div className="space-y-3 pb-4">
          {filteredTasks.map((item) => {
            const isDone = item.status === 'Concluida';
            const assignedLink = userData?.userLinks?.find((l) => l.id === item.linkId);

            return (
              <div 
                key={item.id}
                className="rounded-2xl p-4 border-l-[6px] border shadow-sm transition-all hover:shadow-md space-y-3"
                style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor, borderLeftColor: item.color || '#3B82F6' }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl shrink-0">{item.icon || '📝'}</span>
                  
                  <div className="flex-1 min-w-0">
                    <h3 
                      className={`text-base font-bold mb-1.5 ${isDone ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}
                      style={{ color: isDone ? undefined : colors.textPrimary }}
                    >
                      {item.title}
                    </h3>

                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="px-2 py-0.5 rounded-md" style={{ backgroundColor: colors.inputBg }}>
                        <span className="text-[11px] font-semibold" style={{ color: colors.textSecondary }}>
                          {assignedLink?.logo || '😊'} {item.linkName}
                          {assignedLink?.assignedPersonName ? ` (${assignedLink.assignedPersonName})` : ''}
                        </span>
                      </div>

                      <div className={`px-2 py-0.5 rounded-md ${isDone ? 'bg-emerald-100 dark:bg-emerald-950/50' : 'bg-amber-100 dark:bg-amber-950/50'}`}>
                        <span className={`text-[11px] font-bold ${isDone ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                          {isDone ? '✓ Concluída' : '⏳ Aguardando'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Control Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t" style={{ borderTopColor: colors.borderColor }}>
                  <button
                    type="button"
                    className={`px-3 py-1.5 rounded-xl text-white text-xs font-bold transition-all ${
                      isDone ? 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-400' : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                    onClick={() => handleToggleStatus(item)}
                  >
                    {isDone ? 'Marcar Aguardando' : '✓ Concluir'}
                  </button>

                  <button
                    type="button"
                    className="p-2 rounded-xl text-sm transition-colors hover:bg-slate-200 dark:hover:bg-slate-700"
                    style={{ backgroundColor: colors.inputBg }}
                    onClick={() => handleOpenEdit(item)}
                    title="Editar tarefa"
                  >
                    ✏️
                  </button>

                  <button
                    type="button"
                    className="p-2 rounded-xl text-sm transition-colors hover:bg-slate-200 dark:hover:bg-slate-700"
                    style={{ backgroundColor: colors.inputBg }}
                    onClick={() => handleDeleteTask(item.id)}
                    title="Excluir tarefa"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}

          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border transition-colors" style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
              <span className="text-4xl mb-2 block">📅</span>
              <p className="text-sm font-semibold" style={{ color: colors.textSecondary }}>Nenhuma tarefa cadastrada para este dia.</p>
              <p className="text-xs text-slate-400 mt-1">Clique em "+ Nova Tarefa" para adicionar.</p>
            </div>
          ) : null}
        </div>

        {/* Testing Controls Panel */}
        <div className="mt-2">
          <button
            type="button"
            className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl font-semibold text-xs transition-all shadow-sm active:scale-[0.98]"
            onClick={handleSimulateExpiry}
            disabled={isTestingAction}
          >
            ⚡ Expiração dos 30 Dias (Pagar logo)
          </button>
        </div>
      </div>

      {/* Modals */}
      <TaskModal
        visible={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        initialDate={selectedDate}
        userLinks={userData?.userLinks || []}
        editingTask={editingTask}
      />

      <UserLinksModal
        visible={isLinksModalOpen}
        onClose={() => setIsLinksModalOpen(false)}
        userLinks={userData?.userLinks || []}
        people={people}
        onUpdateLinkDetails={updateLinkDetails}
        onOpenPeopleModal={() => {
          setIsLinksModalOpen(false);
          setIsPeopleModalOpen(true);
        }}
      />

      <PeopleModal
        visible={isPeopleModalOpen}
        onClose={() => setIsPeopleModalOpen(false)}
        people={people}
        onAddPerson={addPerson}
        onUpdatePerson={updatePerson}
        onDeletePerson={deletePerson}
      />
    </div>
  );
};
