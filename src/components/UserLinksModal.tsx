import React, { useState } from 'react';
import { Person, useAuth, UserLink } from '../context/AuthContext';

interface UserLinksModalProps {
  visible: boolean;
  onClose: () => void;
  userLinks: UserLink[];
  people: Person[];
  onUpdateLinkDetails: (
    linkId: string,
    name: string,
    assignedPersonId: string,
    assignedPersonName: string,
    logo: string
  ) => Promise<void>;
  onOpenPeopleModal: () => void;
}

const PRESET_LOGOS = ['🧒', '👤', '👨‍💼', '👩‍💼', '👨‍🦰', '👩‍🦰', '👩', '🙆‍♀️', '💁‍♀️', '🤦', '🤦‍♀️', '🏆'];

export const UserLinksModal: React.FC<UserLinksModalProps> = ({
  visible,
  onClose,
  userLinks,
  people,
  onUpdateLinkDetails,
  onOpenPeopleModal,
}) => {
  const { userData, toggleDeviceBlock } = useAuth();
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  const [tempPersonId, setTempPersonId] = useState('');
  const [tempLogo, setTempLogo] = useState('🙂');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!visible) return null;

  const handleStartEdit = (link: UserLink) => {
    setEditingLinkId(link.id);
    setTempName(link.name);
    setTempPersonId(link.assignedPersonId || '');
    setTempLogo(link.logo || '🙂');
  };

  const handleSaveEdit = async (linkId: string) => {
    if (!tempName.trim()) return;

    const selectedPerson = people.find((p) => p.id === tempPersonId);
    const personName = selectedPerson ? selectedPerson.fullName : '';

    await onUpdateLinkDetails(linkId, tempName.trim(), tempPersonId, personName, tempLogo);
    setEditingLinkId(null);
  };

  const handleToggleBlock = async (link: UserLink) => {
    if (!userData?.uid) return;
    const nextState = !link.isDeviceBlocked;
    try {
      await toggleDeviceBlock(link.code, nextState);
    } catch (err) {
      console.error('Erro ao alternar status do bloqueio:', err);
      alert('Não foi possível alterar o status do bloqueio.');
    }
  };

  const handleCopyLink = (linkCode: string) => {
    const fullUrl = `${window.location.origin}/link/${linkCode}`;
    navigator.clipboard.writeText(fullUrl).catch(() => {
      // Fallback
      navigator.clipboard.writeText(linkCode);
    });
    setCopiedCode(linkCode);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="flex justify-between items-center mb-1.5 pb-2 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">🔗 Links de Acesso</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="text-lg text-slate-500 font-bold">✕</span>
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3.5 leading-relaxed">
          Atribua cada link a um nome cadastrado, escolha uma logo e controle o bloqueio de celular.
        </p>

        <div className="space-y-3">
          {userLinks.map((link, index) => {
            const fullUrl = `${window.location.origin}/link/${link.code}`;
            const isCopied = copiedCode === link.code;
            const isEditing = editingLinkId === link.id;
            const isBlocked = link.isDeviceBlocked ?? false;

            return (
              <div
                key={link.id}
                className={`rounded-2xl p-3.5 border transition-all ${
                  isBlocked
                    ? 'border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-900'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-2xl">{link.logo || '🙂'}</span>
                    <span className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-xs font-bold px-2 py-0.5 rounded-md">
                      Link #{index + 1}
                    </span>
                    {isBlocked ? (
                      <span className="bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 text-xs font-bold px-2 py-0.5 rounded-md">
                        🔒 Bloqueado
                      </span>
                    ) : null}
                  </div>

                  {isEditing ? (
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(link.id)}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-2.5 py-1 rounded-lg transition-colors"
                    >
                      Salvar Alterações
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleStartEdit(link)}
                      className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                    >
                      ✏️ Configurar
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-300 dark:border-slate-600 mb-2 space-y-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Nome do Link
                      </label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 dark:bg-slate-900 rounded-lg px-2.5 py-1.5 text-sm border border-blue-600 text-slate-900 dark:text-slate-100 outline-none"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        placeholder="Ex: Link Dispositivo João"
                      />
                    </div>

                    <div className="flex justify-between items-center pt-1">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Atribuir a um NOME (Pessoa):
                      </span>
                      <button
                        type="button"
                        onClick={onOpenPeopleModal}
                        className="text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline"
                      >
                        + Cadastrar Nova Pessoa
                      </button>
                    </div>

                    <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full">
                      <button
                        type="button"
                        className={`px-2.5 py-1 rounded-full text-xs whitespace-nowrap border transition-all ${
                          tempPersonId === ''
                            ? 'bg-blue-50 dark:bg-blue-950 border-blue-600 text-blue-700 dark:text-blue-300 font-bold'
                            : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500'
                        }`}
                        onClick={() => setTempPersonId('')}
                      >
                        Sem Pessoa Atribuída
                      </button>

                      {people.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className={`px-2.5 py-1 rounded-full text-xs whitespace-nowrap border transition-all ${
                            tempPersonId === p.id
                              ? 'bg-blue-50 dark:bg-blue-950 border-blue-600 text-blue-700 dark:text-blue-300 font-bold'
                              : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500'
                          }`}
                          onClick={() => setTempPersonId(p.id)}
                        >
                          {p.gender === 'Feminino' ? '👩' : '👨'} {p.fullName}
                        </button>
                      ))}
                    </div>

                    <div>
                      <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Escolha a Logo do Link:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_LOGOS.map((lg) => (
                          <button
                            key={lg}
                            type="button"
                            className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all text-base ${
                              tempLogo === lg
                                ? 'bg-blue-100 dark:bg-blue-950 border-2 border-blue-600 shadow-sm'
                                : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600'
                            }`}
                            onClick={() => setTempLogo(lg)}
                          >
                            <span>{lg}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-2">
                    <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">{link.name}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      👤 Atribuído a:{' '}
                      <span className="font-bold text-slate-900 dark:text-slate-200">
                        {link.assignedPersonName || 'Nenhuma pessoa associada'}
                      </span>
                    </p>
                  </div>
                )}

                <div className="bg-white dark:bg-slate-800 rounded-xl p-2.5 border border-slate-200 dark:border-slate-700 mb-2.5 font-mono text-xs">
                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                    Código: {link.code}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] truncate mt-0.5">
                    {fullUrl}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    className={`flex-[2] rounded-xl py-2.5 text-white font-semibold text-xs transition-all shadow-sm ${
                      isCopied ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    onClick={() => handleCopyLink(link.code)}
                  >
                    {isCopied ? '✓ Código / Link Copiado!' : '📋 Copiar Link'}
                  </button>

                  <button
                    type="button"
                    className={`flex-1 py-2.5 rounded-xl text-white font-bold text-xs transition-all shadow-sm ${
                      isBlocked ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                    }`}
                    onClick={() => handleToggleBlock(link)}
                  >
                    {isBlocked ? '🔓 Desbloquear' : '🔒 Travar'}
                  </button>
                </div>
              </div>
            );
          })}
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
