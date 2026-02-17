import React, { useState, useEffect, useCallback, useRef } from "react";

export interface StoryItem {
  id: string;
  title: string;
  videoUrl: string;
  youtubeUrl?: string;
}

interface StoriesViewerProps {
  stories: StoryItem[];
  initialIndex: number;
  onClose: () => void;
}

const SWIPE_THRESHOLD_PX = 100;
const STORY_DURATION_MS = 10000;
const PROGRESS_INTERVAL_MS = 100;

export function StoriesViewer({ stories, initialIndex, onClose }: StoriesViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(() =>
    Math.min(Math.max(0, initialIndex), Math.max(0, stories.length - 1))
  );
  const [progress, setProgress] = useState(0);
  const touchStartY = useRef<number | null>(null);

  const step = 100 / (STORY_DURATION_MS / PROGRESS_INTERVAL_MS);

  const nextStory = useCallback(() => {
    if (currentIndex >= stories.length - 1) {
      onClose();
      return;
    }
    setCurrentIndex((i) => i + 1);
    setProgress(0);
  }, [currentIndex, stories.length, onClose]);

  const prevStory = useCallback(() => {
    if (currentIndex <= 0) return;
    setCurrentIndex((i) => i - 1);
    setProgress(0);
  }, [currentIndex]);

  useEffect(() => {
    setProgress(0);
  }, [currentIndex]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (stories.length === 0) return;
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          nextStory();
          return 0;
        }
        return prev + step;
      });
    }, PROGRESS_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [currentIndex, nextStory]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current == null) return;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    touchStartY.current = null;
    if (deltaY > SWIPE_THRESHOLD_PX) {
      onClose();
    }
  };

  if (stories.length === 0) return null;

  const current = stories[currentIndex];
  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black text-white flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Progress bars */}
      <div className="flex gap-1 p-2 shrink-0">
        {stories.map((_, i) => (
          <div key={i} className="flex-1 h-1 bg-white/30 rounded overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-100 ease-linear"
              style={{
                width:
                  i < currentIndex ? "100%" : i === currentIndex ? `${progress}%` : "0%",
              }}
            />
          </div>
        ))}
      </div>

      {/* Close button */}
      <button
        type="button"
        className="absolute top-4 right-4 z-10 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
        onClick={onClose}
        aria-label="Закрыть"
      >
        ✕
      </button>

      {/* Story content */}
      <div className="flex-1 relative flex items-center justify-center min-h-0">
        <video
          key={current.id}
          src={current.videoUrl}
          className="w-full h-full object-cover"
          autoPlay
          muted
          playsInline
          loop
        />
      </div>

      {/* Tap navigation: left = prev, right = next */}
      <div className="absolute inset-0 flex pt-12">
        <div
          className="w-1/2 cursor-pointer"
          onClick={prevStory}
          onKeyDown={(e) => e.key === "Enter" && prevStory()}
          role="button"
          tabIndex={0}
          aria-label="Предыдущая история"
        />
        <div
          className="w-1/2 cursor-pointer"
          onClick={nextStory}
          onKeyDown={(e) => e.key === "Enter" && nextStory()}
          role="button"
          tabIndex={0}
          aria-label="Следующая история"
        />
      </div>

      {/* Bottom CTA */}
      {current.youtubeUrl && (
        <div className="p-4 shrink-0">
          <button
            type="button"
            className="w-full bg-white text-black rounded-xl py-3 font-semibold transition-opacity hover:opacity-90"
            onClick={() => window.open(current.youtubeUrl, "_blank")}
          >
            Смотреть полностью
          </button>
        </div>
      )}
    </div>
  );
}

export default StoriesViewer;
