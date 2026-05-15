"use client";

import { Crown, Sparkles, X } from "lucide-react";

type ProUpgradeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onActivate: () => void | Promise<void>;
  requestedThemeLabel?: string;
};

export function ProUpgradeModal({
  isOpen,
  onClose,
  onActivate,
  requestedThemeLabel,
}: ProUpgradeModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[1200] grid place-items-center bg-ink/65 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-white/70 bg-white p-5 text-ink shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-clay">
              <Crown className="h-4 w-4" />
              Mahjong Focus Pro
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              Unlock premium themes
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-sage bg-white text-ink transition hover:border-clay"
            aria-label="Close Pro upgrade"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {requestedThemeLabel && (
          <p className="mt-3 rounded-md border border-clay/25 bg-clay/10 px-3 py-2 text-sm font-semibold text-clay">
            {requestedThemeLabel} is a Pro theme.
          </p>
        )}

        <div className="mt-4 rounded-lg bg-linen p-4">
          <p className="text-3xl font-semibold">$4.99</p>
          <p className="mt-1 text-sm text-ink/65">Prototype checkout. Activates instantly.</p>
        </div>

        <ul className="mt-4 space-y-2 text-sm leading-6 text-ink/75">
          <li className="flex gap-2">
            <Sparkles className="mt-1 h-4 w-4 flex-none text-clay" />
            Premium skins: Kazakh Ornaments, Minimal Focus, Nomad Light
          </li>
          <li className="flex gap-2">
            <Sparkles className="mt-1 h-4 w-4 flex-none text-clay" />
            Advanced AI Coach presentation and profile badge
          </li>
          <li className="flex gap-2">
            <Sparkles className="mt-1 h-4 w-4 flex-none text-clay" />
            Saved on your account when signed in
          </li>
        </ul>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-md border border-sage bg-white text-sm font-semibold transition hover:border-clay"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onActivate}
            className="h-10 rounded-md bg-clay text-sm font-semibold text-white transition hover:bg-[#a96945]"
          >
            Activate Pro
          </button>
        </div>
      </div>
    </div>
  );
}
