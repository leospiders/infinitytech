import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { useUpdateMyProfile } from '../../hooks/useApiQueries';
import { MaterialIcon } from '../../components/ui/MaterialIcon';

export function ProfileView({ showToast }: { showToast: (type: 'success' | 'error', message: string) => void }) {
  const { user, setUser } = useAuthStore();
  const updateMutation = useUpdateMyProfile();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const { t } = useTranslation();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('error', t('profile.nameRequired'));
      return;
    }
    try {
      const updated = await updateMutation.mutateAsync({
        name: name.trim(),
        phone: phone.trim(),
      });
      setUser(updated);
      showToast('success', t('profile.updated'));
    } catch {
      showToast('error', t('profile.updateFailed'));
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="border-b border-outline-variant/10 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-on-surface">{t('profile.title')}</h1>
        <p className="text-xs text-on-surface-variant mt-1">
          {t('profile.subtitle')}
        </p>
      </div>

      {/* Profile Card */}
      <form onSubmit={handleSave} className="bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-8 flex flex-col gap-6">
        {/* Avatar + Role */}
        <div className="flex items-center gap-4 pb-6 border-b border-outline-variant/10">
          <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-brand to-brand-secondary flex items-center justify-center text-white font-bold text-lg shadow-md shadow-brand/20">
            {(user?.name || '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm">{user?.email}</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider mt-1 w-fit bg-cyan-accent/10 text-cyan-accent border border-cyan-accent/20">
              {user?.role}
            </span>
          </div>
        </div>

        {/* Editable Fields */}
        <div className="flex flex-col gap-5">
          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <MaterialIcon icon="person" size={14} wght={300} /> {t('profile.displayName')}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="neo-input w-full font-semibold text-sm"
              placeholder={t('profile.namePlaceholder')}
            />
            <p className="text-[10px] text-on-surface-variant mt-1">{t('profile.nameHint')}</p>
          </div>

          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <MaterialIcon icon="mail" size={14} wght={300} /> {t('profile.email')}
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="neo-input w-full font-semibold text-sm bg-[#f1f3f9] dark:bg-black/20 opacity-70 cursor-not-allowed"
            />
            <p className="text-[10px] text-on-surface-variant mt-1">{t('profile.emailHint')}</p>
          </div>

          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <MaterialIcon icon="call" size={14} wght={300} /> {t('profile.phoneNumber')}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="neo-input w-full font-semibold text-sm"
              placeholder={t('profile.phonePlaceholder')}
            />
            <p className="text-[10px] text-on-surface-variant mt-1">{t('profile.phoneHint')}</p>
          </div>
        </div>

        <div className="border-t border-outline-variant/10 pt-5 flex justify-end">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="neo-btn py-3 px-6 text-sm font-bold bg-cyan-accent text-white border-cyan-accent/20 shadow-md shadow-brand/10 hover:shadow-lg hover:shadow-brand/25 disabled:opacity-60 flex items-center gap-2"
          >
            {updateMutation.isPending ? (
              <MaterialIcon icon="sync" size={16} wght={300} className="animate-spin" />
            ) : (
              <MaterialIcon icon="save" size={16} />
            )}
            {t('profile.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
