import { useEffect, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import type { FullProfile, UserLanguage, UserPreferences } from '@aura/shared';
import { useAuth } from '../auth/AuthContext';
import { ApiClientError } from '../lib/api';
import { profileApi } from '../lib/profileApi';
import {
  AI_PERSONALITIES,
  COMMUNICATION_STYLES,
  INTEREST_CATALOGUE,
  LANGUAGE_PROFICIENCIES,
  SUPPORTED_LANGUAGES,
} from '../lib/catalogues';

export function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [draft, setDraft] = useState<FullProfile | null>(profile);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  if (!draft) {
    return (
      <main className="app">
        <p className="muted">Loading profile…</p>
      </main>
    );
  }

  const details = draft.profile;

  function patchDetails(patch: Partial<FullProfile['profile']>) {
    setDraft((d) => (d ? { ...d, profile: { ...d.profile, ...patch } } : d));
  }

  function patchPreferences(patch: Partial<UserPreferences>) {
    setDraft((d) =>
      d ? { ...d, profile: { ...d.profile, preferences: { ...d.profile.preferences, ...patch } } } : d,
    );
  }

  async function saveProfile() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await profileApi.updateMe({
        displayName: details.displayName ?? undefined,
        bio: details.bio ?? undefined,
        primaryLanguage: details.primaryLanguage ?? undefined,
        communicationStyle: details.communicationStyle ?? undefined,
        aiPersonality: details.aiPersonality ?? undefined,
        preferences: details.preferences,
      });
      await refreshProfile();
      setMessage('Profile saved');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  function toggleInterest(interest: string) {
    setDraft((d) => {
      if (!d) return d;
      const has = d.interests.includes(interest);
      return {
        ...d,
        interests: has ? d.interests.filter((i) => i !== interest) : [...d.interests, interest],
      };
    });
  }

  async function saveInterests() {
    if (!draft) return;
    setBusy(true);
    setError(null);
    try {
      await profileApi.setInterests(draft.interests);
      await refreshProfile();
      setMessage('Interests saved');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  function setLanguageProficiency(code: string, proficiency: UserLanguage['proficiency'] | 'none') {
    setDraft((d) => {
      if (!d) return d;
      const others = d.languages.filter((l) => l.languageCode !== code);
      if (proficiency === 'none') return { ...d, languages: others };
      return {
        ...d,
        languages: [
          ...others,
          { languageCode: code as UserLanguage['languageCode'], proficiency },
        ],
      };
    });
  }

  async function saveLanguages() {
    if (!draft) return;
    setBusy(true);
    setError(null);
    try {
      await profileApi.setLanguages(draft.languages);
      await refreshProfile();
      setMessage('Languages saved');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  async function onAvatarSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const target = await profileApi.avatarUploadUrl(file.type, file.size);
      // Upload bytes to the (abstract) storage target, then commit the key.
      await fetch(target.uploadUrl, { method: 'PUT', body: file }).catch(() => undefined);
      await profileApi.commitAvatar(target.objectKey);
      await refreshProfile();
      setMessage('Avatar updated');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Avatar upload failed');
    } finally {
      setBusy(false);
    }
  }

  async function removeAvatar() {
    setBusy(true);
    setError(null);
    try {
      await profileApi.deleteAvatar();
      await refreshProfile();
      setMessage('Avatar removed');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Remove failed');
    } finally {
      setBusy(false);
    }
  }

  const proficiencyOf = (code: string) =>
    draft.languages.find((l) => l.languageCode === code)?.proficiency ?? 'none';

  return (
    <main className="app profile">
      <header className="profile-header">
        <h1 className="title">Your profile</h1>
        <Link to="/" className="ghost">
          ← Home
        </Link>
      </header>

      {message && <p className="ok">{message}</p>}
      {error && <p className="error">{error}</p>}

      <section className="card">
        <h2>Identity</h2>
        <label>
          Display name
          <input
            type="text"
            value={details.displayName ?? ''}
            onChange={(e) => patchDetails({ displayName: e.target.value })}
            maxLength={80}
          />
        </label>
        <label>
          Bio
          <textarea
            value={details.bio ?? ''}
            onChange={(e) => patchDetails({ bio: e.target.value })}
            maxLength={500}
            rows={3}
          />
        </label>
        <label>
          Primary language
          <select
            value={details.primaryLanguage ?? ''}
            onChange={(e) => patchDetails({ primaryLanguage: e.target.value as never })}
          >
            <option value="">—</option>
            {SUPPORTED_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Communication style
          <select
            value={details.communicationStyle ?? ''}
            onChange={(e) => patchDetails({ communicationStyle: (e.target.value || null) as never })}
          >
            <option value="">—</option>
            {COMMUNICATION_STYLES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          AI personality
          <select
            value={details.aiPersonality ?? ''}
            onChange={(e) => patchDetails({ aiPersonality: (e.target.value || null) as never })}
          >
            <option value="">—</option>
            {AI_PERSONALITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <button type="button" disabled={busy} onClick={saveProfile}>
          Save identity
        </button>
      </section>

      <section className="card">
        <h2>Preferences</h2>
        <label>
          Conversation style
          <select
            value={details.preferences.conversationStyle ?? ''}
            onChange={(e) =>
              patchPreferences({
                conversationStyle: (e.target.value || undefined) as never,
              })
            }
          >
            <option value="">—</option>
            <option value="casual">casual</option>
            <option value="balanced">balanced</option>
            <option value="deep">deep</option>
          </select>
        </label>
        <label>
          Response length
          <select
            value={details.preferences.responseLength ?? ''}
            onChange={(e) =>
              patchPreferences({ responseLength: (e.target.value || undefined) as never })
            }
          >
            <option value="">—</option>
            <option value="short">short</option>
            <option value="medium">medium</option>
            <option value="long">long</option>
          </select>
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={details.preferences.humor ?? false}
            onChange={(e) => patchPreferences({ humor: e.target.checked })}
          />
          Enjoy humor
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={details.preferences.deepConversations ?? false}
            onChange={(e) => patchPreferences({ deepConversations: e.target.checked })}
          />
          Enjoy deep conversations
        </label>
        <button type="button" disabled={busy} onClick={saveProfile}>
          Save preferences
        </button>
      </section>

      <section className="card">
        <h2>Languages</h2>
        <ul className="chip-list">
          {SUPPORTED_LANGUAGES.map((l) => (
            <li key={l.code}>
              <span>{l.label}</span>
              <select
                value={proficiencyOf(l.code)}
                onChange={(e) =>
                  setLanguageProficiency(
                    l.code,
                    e.target.value as UserLanguage['proficiency'] | 'none',
                  )
                }
              >
                <option value="none">—</option>
                {LANGUAGE_PROFICIENCIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
        <button type="button" disabled={busy} onClick={saveLanguages}>
          Save languages
        </button>
      </section>

      <section className="card">
        <h2>Interests</h2>
        <div className="chips">
          {INTEREST_CATALOGUE.map((interest) => (
            <button
              key={interest}
              type="button"
              className={draft.interests.includes(interest) ? 'chip active' : 'chip'}
              onClick={() => toggleInterest(interest)}
            >
              {interest}
            </button>
          ))}
        </div>
        <button type="button" disabled={busy} onClick={saveInterests}>
          Save interests
        </button>
      </section>

      <section className="card">
        <h2>Avatar</h2>
        {details.avatarUrl ? (
          <p className="muted">Current: {details.avatarUrl}</p>
        ) : (
          <p className="muted">No avatar set.</p>
        )}
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onAvatarSelected} />
        <button type="button" className="ghost" disabled={busy} onClick={removeAvatar}>
          Remove avatar
        </button>
      </section>
    </main>
  );
}
