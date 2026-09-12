"use client";

import { useSyncExternalStore } from "react";
import { COUNTRY_KEY } from "./countries";
import { SEGMENT_KEY, type Segment } from "./segments";

export type Prefs = { country: string | null; segment: Segment | null };

const SERVER: Prefs = { country: null, segment: null };
const listeners = new Set<() => void>();
let cache: Prefs | null = null;

function read(): Prefs {
  try {
    const seg = localStorage.getItem(SEGMENT_KEY);
    return {
      country: localStorage.getItem(COUNTRY_KEY),
      segment: seg === "student" || seg === "professional" ? seg : null,
    };
  } catch {
    return SERVER;
  }
}

function get(): Prefs {
  if (!cache) cache = read();
  return cache;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === COUNTRY_KEY || e.key === SEGMENT_KEY) {
      cache = null;
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function setPref<K extends keyof Prefs>(key: K, value: Prefs[K]) {
  try {
    const k = key === "country" ? COUNTRY_KEY : SEGMENT_KEY;
    if (value) localStorage.setItem(k, value);
    else localStorage.removeItem(k);
  } catch {}
  cache = { ...get(), [key]: value };
  listeners.forEach((l) => l());
}

export function usePrefs(): Prefs {
  return useSyncExternalStore(subscribe, get, () => SERVER);
}
