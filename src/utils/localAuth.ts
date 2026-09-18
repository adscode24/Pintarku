import { DifficultyLevel, UserAccountSummary, UserProfile } from '../types';

const USERS_INDEX_KEY = 'bintang_users_list_v3';
const ACTIVE_USER_ID_KEY = 'bintang_active_user_id_v3';
const PROFILE_KEY_PREFIX = 'bintang_profile_';

export const AVATAR_OPTIONS = [
  '🦁', '🐯', '🐰', '🐼', '🦊', '🐱', '🐶', '🦄', '🦖', '🐻', '🐵', '🐨'
];

export const INITIAL_DEFAULT_PROFILE: UserProfile = {
  id: 'user_default_budi',
  name: 'Budi Pintar',
  avatar: '🦁',
  age: 7,
  grade: 'Kelas 1 - 2 SD',
  difficulty: 'mudah',
  totalStars: 15,
  totalCoins: 50,
  highestLevelUnlocked: 1,
  levelScores: {},
  unlockedBadges: [],
  stats: {
    writingPracticed: 0,
    wordsRead: 0,
    mathSolved: 0,
    quizCompleted: 0,
    perfectQuizzes: 0,
    correctAnswersCount: 0,
  },
};

/**
 * Retrieve all registered child accounts from localStorage on the phone
 */
export function getAllLocalUsers(): UserAccountSummary[] {
  try {
    const raw = localStorage.getItem(USERS_INDEX_KEY);
    if (!raw) {
      // Seed default child profile
      saveLocalProfile(INITIAL_DEFAULT_PROFILE);
      const initialSummary: UserAccountSummary = {
        id: INITIAL_DEFAULT_PROFILE.id,
        name: INITIAL_DEFAULT_PROFILE.name,
        avatar: INITIAL_DEFAULT_PROFILE.avatar,
        age: INITIAL_DEFAULT_PROFILE.age,
        grade: INITIAL_DEFAULT_PROFILE.grade,
        difficulty: INITIAL_DEFAULT_PROFILE.difficulty,
        totalStars: INITIAL_DEFAULT_PROFILE.totalStars,
        hasPin: false,
      };
      localStorage.setItem(USERS_INDEX_KEY, JSON.stringify([initialSummary]));
      return [initialSummary];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading local users', err);
    return [];
  }
}

/**
 * Get active user ID from phone storage
 */
export function getActiveUserId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_USER_ID_KEY);
  } catch {
    return null;
  }
}

/**
 * Set active user ID in phone storage
 */
export function setActiveUserId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(ACTIVE_USER_ID_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_USER_ID_KEY);
    }
  } catch (err) {
    console.error('Error setting active user id', err);
  }
}

/**
 * Retrieve a specific child's full profile from phone storage
 */
export function getLocalProfile(id: string): UserProfile | null {
  try {
    const raw = localStorage.getItem(`${PROFILE_KEY_PREFIX}${id}`);
    if (raw) {
      return JSON.parse(raw);
    }
    // Fallback: Check old storage key if migratable
    if (id === 'user_default_budi') {
      const legacy = localStorage.getItem('bintang_pintar_profile_v2');
      if (legacy) {
        const parsed = JSON.parse(legacy);
        parsed.id = 'user_default_budi';
        parsed.difficulty = parsed.difficulty || 'mudah';
        saveLocalProfile(parsed);
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error fetching profile', err);
  }
  return null;
}

/**
 * Save user profile to phone storage and sync user summary list
 */
export function saveLocalProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(`${PROFILE_KEY_PREFIX}${profile.id}`, JSON.stringify(profile));

    // Update users index list
    const usersRaw = localStorage.getItem(USERS_INDEX_KEY);
    let usersList: UserAccountSummary[] = usersRaw ? JSON.parse(usersRaw) : [];

    const existingIdx = usersList.findIndex((u) => u.id === profile.id);
    const summary: UserAccountSummary = {
      id: profile.id,
      name: profile.name,
      avatar: profile.avatar,
      age: profile.age,
      grade: profile.grade,
      difficulty: profile.difficulty || 'mudah',
      totalStars: profile.totalStars,
      hasPin: Boolean(profile.pin && profile.pin.length >= 4),
    };

    if (existingIdx >= 0) {
      usersList[existingIdx] = summary;
    } else {
      usersList.push(summary);
    }

    localStorage.setItem(USERS_INDEX_KEY, JSON.stringify(usersList));
  } catch (err) {
    console.error('Error saving local profile', err);
  }
}

/**
 * Create a new child profile stored locally on the phone
 */
export function createLocalUser(params: {
  name: string;
  avatar: string;
  age: number;
  grade: string;
  difficulty: DifficultyLevel;
  pin?: string;
}): UserProfile {
  const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newProfile: UserProfile = {
    id,
    name: params.name.trim() || 'Anak Cerdas',
    avatar: params.avatar || '🦁',
    age: params.age || 7,
    grade: params.grade || 'Kelas 1 SD',
    difficulty: params.difficulty || 'mudah',
    pin: params.pin ? params.pin.trim() : undefined,
    totalStars: 10,
    totalCoins: 20,
    highestLevelUnlocked: 1,
    levelScores: {},
    unlockedBadges: [],
    stats: {
      writingPracticed: 0,
      wordsRead: 0,
      mathSolved: 0,
      quizCompleted: 0,
      perfectQuizzes: 0,
      correctAnswersCount: 0,
    },
  };

  saveLocalProfile(newProfile);
  setActiveUserId(newProfile.id);
  return newProfile;
}

/**
 * Delete a user profile from phone storage
 */
export function deleteLocalUser(id: string): void {
  try {
    localStorage.removeItem(`${PROFILE_KEY_PREFIX}${id}`);
    const usersRaw = localStorage.getItem(USERS_INDEX_KEY);
    if (usersRaw) {
      const list: UserAccountSummary[] = JSON.parse(usersRaw);
      const filtered = list.filter((u) => u.id !== id);
      localStorage.setItem(USERS_INDEX_KEY, JSON.stringify(filtered));
    }
    if (getActiveUserId() === id) {
      setActiveUserId(null);
    }
  } catch (err) {
    console.error('Error deleting local user', err);
  }
}

/**
 * Export all local data to a JSON backup file
 */
export function exportAllLocalData(): string {
  const users = getAllLocalUsers();
  const profiles: Record<string, UserProfile> = {};
  users.forEach((u) => {
    const p = getLocalProfile(u.id);
    if (p) profiles[u.id] = p;
  });

  return JSON.stringify(
    {
      app: 'BintangPintar',
      version: '3.0',
      exportedAt: new Date().toISOString(),
      users,
      profiles,
    },
    null,
    2
  );
}

/**
 * Import local data from a JSON backup file
 */
export function importLocalData(jsonStr: string): boolean {
  try {
    const data = JSON.parse(jsonStr);
    if (!data.users || !data.profiles) return false;

    localStorage.setItem(USERS_INDEX_KEY, JSON.stringify(data.users));
    Object.keys(data.profiles).forEach((id) => {
      localStorage.setItem(`${PROFILE_KEY_PREFIX}${id}`, JSON.stringify(data.profiles[id]));
    });

    if (data.users.length > 0) {
      setActiveUserId(data.users[0].id);
    }
    return true;
  } catch {
    return false;
  }
}
