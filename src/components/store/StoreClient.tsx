"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProUpgradeModal } from "@/components/ProUpgradeModal";
import {
  type LocalProfile,
  getDefaultProfile,
  loadLocalProfile,
  saveLocalProfile,
  themeOptions,
} from "@/lib/storage/profileStorage";
import { loadRemoteProfile, saveProfile } from "@/lib/supabase/profile";

const themes = [
  { id: "calm", name: "Calm", type: "Free", description: "Soft focus palette for daily play." },
  { id: "light", name: "Light", type: "Free", description: "Clean bright interface." },
  { id: "dark", name: "Dark", type: "Free", description: "Low-glare evening mode." },
  { id: "kazakh", name: "Kazakh Ornaments", type: "Pro", description: "Cultural accents and warm tile details." },
  { id: "minimal", name: "Minimal Focus", type: "Pro", description: "Distraction-free high-contrast tiles." },
  { id: "nomad", name: "Nomad Light", type: "Pro", description: "Premium light skin with nomad-inspired accents." },
];

export function StoreClient() {
  const [showPricing, setShowPricing] = useState(false);
  const [profile, setProfile] = useState<LocalProfile>(() => getDefaultProfile());
  const [requestedThemeId, setRequestedThemeId] = useState<LocalProfile["preferredTheme"] | null>(
    null,
  );
  const [requestedThemeLabel, setRequestedThemeLabel] = useState<string | undefined>();

  useEffect(() => {
    setProfile(loadLocalProfile());
    loadRemoteProfile().then(setProfile);
  }, []);

  const activatePro = async () => {
    const nextProfile = {
      ...profile,
      isPro: true,
      preferredTheme: requestedThemeId ?? profile.preferredTheme,
    };
    setProfile(nextProfile);
    saveLocalProfile(nextProfile);
    await saveProfile(nextProfile);
    setRequestedThemeId(null);
    setShowPricing(false);
  };

  const selectTheme = async (themeId: string, isProTheme: boolean) => {
    if (isProTheme && !profile.isPro) {
      const theme = themes.find((item) => item.id === themeId);
      setRequestedThemeId(themeId as LocalProfile["preferredTheme"]);
      setRequestedThemeLabel(theme?.name);
      setShowPricing(true);
      return;
    }

    const nextProfile = {
      ...profile,
      preferredTheme: themeOptions.some((theme) => theme.id === themeId)
        ? (themeId as LocalProfile["preferredTheme"])
        : profile.preferredTheme,
    };
    setProfile(nextProfile);
    saveLocalProfile(nextProfile);
    await saveProfile(nextProfile);
  };

  return (
    <main className="min-h-screen bg-linen text-ink">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-lg border border-white/60 bg-white/65 p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">
              Store
            </p>
            <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
              Themes and Pro
            </h1>
            <p className="mt-2 text-sm leading-6 text-ink/70">
              Pro activates instantly for the prototype and is saved locally plus Supabase when signed in.
            </p>
          </div>
          <button
            type="button"
            onClick={() => (profile.isPro ? undefined : setShowPricing(true))}
            className="inline-flex h-10 items-center justify-center rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-ink/85"
          >
            {profile.isPro ? "Pro Active" : "Upgrade to Pro"}
          </button>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {themes.map((theme) => {
            const isProTheme = theme.type === "Pro";
            const isSelected = profile.preferredTheme === theme.id;

            return (
              <button
                key={theme.name}
                type="button"
                onClick={() => selectTheme(theme.id, isProTheme)}
                className={`rounded-lg border p-4 text-left shadow-sm transition hover:border-clay ${
                  isSelected
                    ? "border-clay bg-sage/65"
                    : "border-white/60 bg-white/65"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-semibold">{theme.name}</h2>
                  <span className="rounded-md bg-sage/80 px-2 py-1 text-xs font-semibold">
                    {theme.type}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-ink/70">{theme.description}</p>
                {isSelected && (
                  <p className="mt-3 text-sm font-semibold text-clay">Selected</p>
                )}
              </button>
            );
          })}
        </section>

        <Link href="/game" className="text-sm font-semibold text-clay hover:text-clay/80">
          Back to game
        </Link>
      </div>

      <ProUpgradeModal
        isOpen={showPricing}
        onClose={() => setShowPricing(false)}
        onActivate={activatePro}
        requestedThemeLabel={requestedThemeLabel}
      />
    </main>
  );
}
