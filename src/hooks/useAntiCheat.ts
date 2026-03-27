"use client";

import { useEffect, useState } from "react";

export function useAntiCheat(options?: { onCheatDetected?: (msg: string) => void }) {
  const [warnings, setWarnings] = useState<number>(0);
  const [isExamActive, setIsExamActive] = useState(false);

  useEffect(() => {
    if (!isExamActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setWarnings((prev) => prev + 1);
        reportCheat("TAB_SWITCH_OR_MINIMIZE");
        if (options?.onCheatDetected) options.onCheatDetected("WARNING: You have switched away from the exam tab. This action has been logged.");
      }
    };

    const handleWindowBlur = () => {
      setWarnings((prev) => prev + 1);
      reportCheat("WINDOW_LOST_FOCUS");
      if (options?.onCheatDetected) options.onCheatDetected("WARNING: The exam window lost focus. This action has been logged.");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [isExamActive]);

  const reportCheat = async (eventType: string) => {
    // In actual implementation, send a POST request to /api/exams/log
    console.warn("Cheat Logged to Server:", eventType);
  };

  const startExam = () => {
    setIsExamActive(true);
    // Request full screen
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error("Failed to request full screen:", err);
      });
    }
  };

  const suspendExam = () => setIsExamActive(false);

  return { warnings, isExamActive, startExam, suspendExam };
}
