import type { User } from "@supabase/supabase-js";
import {
  type LocalProfile,
  loadLocalProfile,
  saveLocalProfile,
} from "@/lib/storage/profileStorage";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type ProfileRow = {
  id: string;
  username: string;
  city: string;
  preferred_theme: LocalProfile["preferredTheme"];
  preferred_language: LocalProfile["preferredLanguage"];
  is_pro: boolean;
};

export const getCurrentUser = async () => {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return null;
  }

  const { data } = await supabase.auth.getUser();
  return data.user;
};

export const upsertProfileForUser = async (
  user: User,
  profile: LocalProfile = loadLocalProfile(),
) => {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    saveLocalProfile(profile);
    return profile;
  }

  const nextProfile = {
    ...profile,
    email: user.email ?? profile.email,
  };
  saveLocalProfile(nextProfile);

  await supabase.from("profiles").upsert({
    id: user.id,
    username: nextProfile.username,
    city: nextProfile.city,
    preferred_theme: nextProfile.preferredTheme,
    preferred_language: nextProfile.preferredLanguage,
    is_pro: nextProfile.isPro,
  });

  return nextProfile;
};

export const loadRemoteProfile = async () => {
  const supabase = getSupabaseBrowserClient();
  const user = await getCurrentUser();

  if (!supabase || !user) {
    return loadLocalProfile();
  }

  const { data } = await supabase
    .from("profiles")
    .select("id, username, city, preferred_theme, preferred_language, is_pro")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  if (!data) {
    return upsertProfileForUser(user, loadLocalProfile());
  }

  const profile: LocalProfile = {
    username: data.username,
    city: data.city,
    preferredTheme: data.preferred_theme,
    preferredLanguage: data.preferred_language,
    isPro: data.is_pro,
    email: user.email ?? null,
  };
  saveLocalProfile(profile);
  return profile;
};

export const saveProfile = async (profile: LocalProfile) => {
  saveLocalProfile(profile);
  const user = await getCurrentUser();

  if (user) {
    await upsertProfileForUser(user, profile);
  }

  return profile;
};
