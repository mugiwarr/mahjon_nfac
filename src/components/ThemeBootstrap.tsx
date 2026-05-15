"use client";

import { useEffect } from "react";
import { loadLocalProfile } from "@/lib/storage/profileStorage";

export function ThemeBootstrap() {
  useEffect(() => {
    loadLocalProfile();
  }, []);

  return null;
}
