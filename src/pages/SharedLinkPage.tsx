import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { LinkAccessData, useAuth, UserLink } from '../context/AuthContext';

interface Task {
  id: string;
  title: string;
  date: string;
  color?: string;
  icon?: string;
  linkId?: string;
  linkName?: string;
  status: 'Aguardando' | 'Concluida';
}

export const SharedLinkPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { getTaskOwnerByLinkCode, toggleDeviceBlock } = useAuth();

  const [loading, setLoading] = useState(true);
  const [ownerData, setOwnerData] = useState<LinkAccessData | null>(null);
  const [targetLink, setTargetLink] = useState<UserLink | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [isBlockingAction, setIsBlockingAction] = useState(false);

  useEffect(() => {
    if (!code) return;

    let unsubscribeTasks: (() => void) | null = null;
    let unsubscribeLinkAccess: (() => void) | null = null;

    const fetchOwnerAndTasks = async () => {
      setLoading(true);
      setErrorMsg('');

      try {
        const result = await getTaskOwnerByLinkCode(code);
        if (!result) {
          setErrorMsg('Link não encontrado ou expirado.');
          setLoading(false);
          return;
        }

        setOwnerData(result);
        setTargetLink(result.targetLink);

        const linkAccessRef = doc(db, 'linkAccess', code);
        unsubscribeLinkAccess = onSnapshot(linkAccessRef, (linkSnap) => {
          if (!linkSnap.exists()) {
            setErrorMsg('Link não encontrado ou expirado.');
            setLoading(false);
            return;
          }
          const data = linkSnap.data();
          if (data.uid !== result.uid || data.linkId !== result.targetLink.id) {
            setErrorMsg('Os dados deste link são inválidos.');
            setLoading(false);
            return;
          }
          const updatedLink: UserLink = {
            id: data.linkId,
            code: code,
            name: typeof data.linkName === 'string' ? data.linkName : 'Link',
            assignedPersonName: typeof data.assignedPersonName === 'string' ? data.assignedPersonName : '',
            logo: typeof data.logo === 'string' ? data.logo : '🏢',
            isDeviceBlocked: data.isDeviceBlocked === true,
          };
          setOwnerData({
            uid: data.uid,
            ownerName: typeof data.ownerName === 'string' ? data.ownerName : 'Usuário',
            targetLink: updatedLink,
          });
          setTargetLink(updatedLink);
        }, (error) => {
          console.error('Erro ao acompanhar o link compartilhado:', error);
          setErrorMsg('Sem permissão para acessar este link. Verifique as regras do Firestore.');
          setLoading(false);
        });

        // Listen for tasks assigned to this linkId
        const tasksRef = collection(db, 'users', result.uid, 'tasks');
        const q = query(
          tasksRef,
          where('linkCode', '==', code),
          where('linkId', '==', result.targetLink.id)
        );

        unsubscribeTasks = onSnapshot(q, (snapshot) => {
          const loadedTasks: Task[] = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            title: docSnap.data().title,
            date: docSnap.data().date,
            color: docSnap.data().color,
            icon: docSnap.data().icon,
            linkId: docSnap.data().linkId,
            linkName: docSnap.data().linkName,
            status: docSnap.data().status || (docSnap.data().completed ? 'Concluida' : 'Aguardando'),
          }));
          setTasks(loadedTasks);
          setLoading(false);
        }, (error) => {
          console.error('Erro ao acompanhar tarefas do link:', error);
          setErrorMsg('Sem permissão para acessar as tarefas deste link. Verifique as regras do Firestore.');
          setLoading(false);
        });
      } catch (err) {
        console.error('Erro ao carregar link:', err);
        setErrorMsg(
          err instanceof Error && 'code' in err && err.code === 'permission-denied'
            ? 'Sem permissão para acessar este link. Publique as regras do Firestore incluídas no projeto.'
            : 'Erro ao conectar ao servidor.'
        );
        setLoading(false);
      }
    };

    fetchOwnerAndTasks();

    return () => {
      if (unsubscribeTasks) unsubscribeTasks();
      if (unsubscribeLinkAccess) unsubscribeLinkAccess();
    };
  }, [code]);

  // Task Completion Calculations
  const totalTasks = tasks.length;
  const completedCount = tasks.filter((t) => t.status === 'Concluida').length;
  const pendingTasks = tasks.filter((t) => t.status === 'Aguardando');
  const pendingCount = pendingTasks.length;
  const completionRate = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

  const handleToggleTaskStatus = async (task: Task) => {
    if (!ownerData?.uid) return;
    const newStatus = task.status === 'Concluida' ? 'Aguardando' : 'Concluida';

    try {
      const taskRef = doc(db, 'users', ownerData.uid, 'tasks', task.id);
      await updateDoc(taskRef, {
        status: newStatus,
        completed: newStatus === 'Concluida',
      });
    } catch (err) {
      console.error('Erro ao atualizar status da tarefa:', err);
      alert('Não foi possível atualizar o status da tarefa.');
    }
  };

  const handleLockDevice = async () => {
    if (!ownerData || !targetLink) return;

    // Rule Check: If 75% or more of tasks are completed, blocking is NOT allowed!
    if (completionRate >= 75) {
      alert(
        `Bloqueio Não Permitido 🚫\nNão é possível realizar o bloqueio do celular pois ${completionRate.toFixed(0)}% das tarefas já estão concluídas (máximo permitido para bloqueio: < 75%).`
      );
      return;
    }

    if (pendingCount === 0) {
      alert('Bloqueio Não Permitido ℹ️\nO bloqueio requer que haja tarefas com o status "Aguardando".');
      return;
    }

    setIsBlockingAction(true);
    try {
      await toggleDeviceBlock(targetLink.code, true);
      alert('Dispositivo Bloqueado 🔒\nO celular foi bloqueado com sucesso.');
    } catch (err) {
      console.error('Erro ao bloquear dispositivo:', err);
      alert('Não foi possível efetuar o bloqueio do celular.');
    } finally {
      setIsBlockingAction(false);
    }
  };

  const handleLoginAsOwner = () => {
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-900 p-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-sm text-slate-500 dark:text-slate-400">Carregando link de tarefas...</span>
      </div>
    );
  }

  if (errorMsg || !ownerData || !targetLink) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 items-center text-center shadow-xl border border-slate-200 dark:border-slate-700 max-w-md w-full">
          <span className="text-5xl mb-4 block">⚠️</span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Link Inválido</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{errorMsg || 'Não foi possível carregar as tarefas.'}</p>
          <button
            type="button"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
            onClick={handleLoginAsOwner}
          >
            Ir para Login
          </button>
        </div>
      </div>
    );
  }

  // Device Blocked Overlay
  if (targetLink.isDeviceBlocked) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-3xl p-8 text-center border border-slate-700 max-w-md w-full shadow-2xl">
          <span className="text-6xl mb-4 block">🔒</span>
          <h2 className="text-2xl font-bold text-slate-50 mb-3">Celular Bloqueado</h2>
          <p className="text-sm text-slate-400 leading-relaxed mb-6">
            Este celular foi bloqueado através do sistema por possuir tarefas pendentes.
          </p>
          <div className="bg-slate-900 rounded-2xl p-4 text-center border border-slate-700 space-y-2">
            <p className="text-blue-400 text-xs font-bold">
              📊 Progresso Atual das Tarefas: {completionRate.toFixed(0)}% concluídas ({completedCount}/{totalTasks})
            </p>
            <p className="text-slate-500 text-xs">
              O bloqueio só pode ser removido pelo aplicativo principal.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-4 sm:p-6 flex flex-col justify-center items-center">
      <div className="w-full max-w-md space-y-3">
        {/* Header with Logo, Assigned Person & Lock Button */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3 flex-1 overflow-hidden">
            <span className="text-3xl shrink-0">{targetLink.logo || '🏢'}</span>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">{targetLink.name}</h2>
              {targetLink.assignedPersonName ? (
                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold truncate mt-0.5">
                  👤 Atribuído a: {targetLink.assignedPersonName}
                </p>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">Cadastro: {ownerData.ownerName}</p>
              )}
            </div>
          </div>

          <button
            type="button"
            className={`px-3 py-2 rounded-xl text-white font-bold text-xs shrink-0 transition-all ${
              completionRate >= 75
                ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 active:scale-95'
            }`}
            onClick={handleLockDevice}
            disabled={isBlockingAction}
          >
            🔒 Bloquear Celular
          </button>
        </div>

        {/* Progress & Validation Stats Bar */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-400">Progresso de Conclusão:</span>
            <span className="font-bold">{completionRate.toFixed(0)}% ({completedCount}/{totalTasks})</span>
          </div>

          <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                completionRate >= 75 ? 'bg-green-600' : 'bg-blue-600'
              }`}
              style={{ width: `${Math.min(100, completionRate)}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {completionRate >= 75
              ? '🚫 Bloqueio desativado (75% ou mais das tarefas concluídas).'
              : `✅ Bloqueio permitido (${pendingCount} ${pendingCount === 1 ? 'tarefa aguardando' : 'tarefas aguardando'}).`}
          </p>
        </div>

        <section
          aria-labelledby="task-notifications-heading"
          className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-4 border border-amber-200 dark:border-amber-900 shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 id="task-notifications-heading" className="text-sm font-bold text-amber-900 dark:text-amber-200">
              🔔 Notificações de tarefas
            </h3>
            <span className="rounded-full bg-amber-200 dark:bg-amber-900 px-2.5 py-1 text-xs font-bold text-amber-900 dark:text-amber-200">
              {pendingCount}
            </span>
          </div>

          {pendingTasks.length > 0 ? (
            <div className="space-y-2">
              {pendingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 rounded-xl bg-white dark:bg-slate-800 p-3 border border-amber-100 dark:border-slate-700"
                >
                  <span className="text-2xl shrink-0">{task.icon || '📝'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 break-words">{task.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">📅 Data: {task.date}</p>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 rounded-lg bg-green-600 hover:bg-green-700 px-3 py-2 text-xs font-bold text-white transition-colors"
                    onClick={() => handleToggleTaskStatus(task)}
                    aria-label={`Concluir tarefa: ${task.title}`}
                  >
                    ✓ Concluir
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-amber-800 dark:text-amber-300">
              Você não tem tarefas pendentes. As novas tarefas atribuídas a este link aparecerão aqui.
            </p>
          )}
        </section>

        <div className="pt-1">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Tarefas Atribuídas ({tasks.length})
          </h3>
        </div>

        {/* Task List */}
        <div className="space-y-3 pb-6">
          {tasks.map((item) => {
            const cardBg = item.color || '#3B82F6';
            const isCompleted = item.status === 'Concluida';

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-800 rounded-2xl p-4 border-l-[6px] border border-slate-200 dark:border-slate-700 shadow-sm space-y-3"
                style={{ borderLeftColor: cardBg }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{item.icon || '📝'}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-base font-bold ${isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}>
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">📅 Data: {item.date}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-700">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                    isCompleted
                      ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                      : 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400'
                  }`}>
                    {isCompleted ? '✓ Concluída' : '⏳ Aguardando'}
                  </span>

                  <button
                    type="button"
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      isCompleted
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                        : 'bg-green-600 hover:bg-green-700 text-white shadow-sm'
                    }`}
                    onClick={() => handleToggleTaskStatus(item)}
                  >
                    {isCompleted ? 'Marcar como Aguardando' : '✓ Marcar Concluída'}
                  </button>
                </div>
              </div>
            );
          })}

          {tasks.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-700">
              <span className="text-4xl mb-2 block">📭</span>
              <p className="text-sm text-slate-400">Nenhuma tarefa atribuída a este link.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
