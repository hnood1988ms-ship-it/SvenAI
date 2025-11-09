import { useEffect, useState } from "react";
import { Streamdown } from "streamdown";

interface TypingTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
}

export function TypingText({ text, speed = 20, onComplete }: TypingTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(text.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else if (onComplete && currentIndex === text.length) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  // إعادة تعيين عند تغيير النص
  useEffect(() => {
    setDisplayedText("");
    setCurrentIndex(0);
  }, [text]);

  return (
    <div className="markdown-content">
      <Streamdown>{displayedText}</Streamdown>
      {currentIndex < text.length && (
        <span className="inline-block w-1 h-4 bg-current animate-pulse ml-1" />
      )}
    </div>
  );
}
