"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import type { JourneyRegion } from "@/lib/types";
import { REGION_NAMES } from "@/lib/story";

interface JourneyContextValue {
  loading: boolean;
  isLoggedIn: boolean;
  regions: JourneyRegion[];
  isUnlocked: (index: number) => boolean;
  setCompleted: (index: number, info: { topic: string; questId?: string | null }) => void;
  refresh: () => Promise<void>;
}

const emptyRegions: JourneyRegion[] = REGION_NAMES.map((name, i) => ({
  index: i + 1,
  name,
  completed: false,
  topic: null,
  questId: null,
}));

const JourneyContext = createContext<JourneyContextValue | null>(null);

export function JourneyProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [regions, setRegions] = useState<JourneyRegion[]>(emptyRegions);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/journey", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setIsLoggedIn(!!data.isLoggedIn);
        setRegions(data.regions ?? emptyRegions);
      }
    } catch {
      // 실패 시 빈 여정 유지 (게스트로 취급)
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isUnlocked = useCallback(
    (index: number) => {
      if (index <= 1) return true;
      const prev = regions.find((r) => r.index === index - 1);
      return !!prev?.completed;
    },
    [regions],
  );

  const setCompleted = useCallback(
    (index: number, info: { topic: string; questId?: string | null }) => {
      setRegions((prev) =>
        prev.map((r) =>
          r.index === index
            ? {
                ...r,
                completed: true,
                topic: info.topic,
                questId: info.questId ?? r.questId,
              }
            : r,
        ),
      );
    },
    [],
  );

  return (
    <JourneyContext.Provider
      value={{ loading, isLoggedIn, regions, isUnlocked, setCompleted, refresh }}
    >
      {children}
    </JourneyContext.Provider>
  );
}

export function useJourney() {
  const ctx = useContext(JourneyContext);
  if (!ctx) throw new Error("useJourney must be used within JourneyProvider");
  return ctx;
}
