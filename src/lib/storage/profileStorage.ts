export type ThemeId = "calm" | "light" | "dark" | "kazakh" | "minimal" | "nomad";
export type LanguageCode = "en" | "ru" | "kz";
export type ThemeOption = {
  id: ThemeId;
  label: string;
  isPro: boolean;
};

export type LocalProfile = {
  username: string;
  city: string;
  preferredTheme: ThemeId;
  preferredLanguage: LanguageCode;
  isPro: boolean;
  email: string | null;
};

const PROFILE_KEY = "mahjong-focus.profile";

export const themeOptions: ThemeOption[] = [
  { id: "calm", label: "Calm", isPro: false },
  { id: "light", label: "Light", isPro: false },
  { id: "dark", label: "Dark", isPro: false },
  { id: "kazakh", label: "Kazakh Ornaments", isPro: true },
  { id: "minimal", label: "Minimal Focus", isPro: true },
  { id: "nomad", label: "Nomad Light", isPro: true },
];

export const isProThemeId = (themeId: string) =>
  themeOptions.some((theme) => theme.id === themeId && theme.isPro);

export const languageOptions: Array<{ id: LanguageCode; label: string }> = [
  { id: "en", label: "EN" },
  { id: "ru", label: "RU" },
  { id: "kz", label: "KZ" },
];

const defaultProfile: LocalProfile = {
  username: "Guest Player",
  city: "Almaty",
  preferredTheme: "calm",
  preferredLanguage: "en",
  isPro: false,
  email: null,
};

export const getDefaultProfile = () => defaultProfile;

const normalizeProfile = (profile: Partial<LocalProfile>): LocalProfile => {
  const mergedProfile = {
    ...defaultProfile,
    ...profile,
  };
  const preferredTheme = themeOptions.some((theme) => theme.id === mergedProfile.preferredTheme)
    ? mergedProfile.preferredTheme
    : defaultProfile.preferredTheme;

  return {
    ...mergedProfile,
    preferredTheme:
      !mergedProfile.isPro && isProThemeId(preferredTheme)
        ? defaultProfile.preferredTheme
        : preferredTheme,
    preferredLanguage: languageOptions.some(
      (language) => language.id === mergedProfile.preferredLanguage,
    )
      ? mergedProfile.preferredLanguage
      : defaultProfile.preferredLanguage,
  };
};

export const applyTheme = (theme: ThemeId) => {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.theme = theme === "calm" ? "" : theme;
};

export const loadLocalProfile = (): LocalProfile => {
  if (typeof window === "undefined") {
    return defaultProfile;
  }

  const rawValue = window.localStorage.getItem(PROFILE_KEY);
  if (!rawValue) {
    applyTheme(defaultProfile.preferredTheme);
    return defaultProfile;
  }

  try {
    const profile = normalizeProfile(JSON.parse(rawValue) as Partial<LocalProfile>);
    applyTheme(profile.preferredTheme);
    return profile;
  } catch {
    window.localStorage.removeItem(PROFILE_KEY);
    applyTheme(defaultProfile.preferredTheme);
    return defaultProfile;
  }
};

export const saveLocalProfile = (profile: LocalProfile) => {
  if (typeof window === "undefined") {
    return;
  }

  const normalized = normalizeProfile(profile);
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(normalized));
  applyTheme(normalized.preferredTheme);
};
