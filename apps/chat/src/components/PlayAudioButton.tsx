import { Button } from "@/components/ui/button";
import { getCantoneseAudio } from "@/server/functions/getCantoneseAudio";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

type PlayAudioButtonProps = {
  jyutping: string;
};
export const PlayAudioButton = ({ jyutping }: PlayAudioButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [audioDataUri, setAudioDataUri] = useState<string | null>(null);
  const getCantoneseAudioFn = useServerFn(getCantoneseAudio);

  const handlePlay = async () => {
    try {
      setIsLoading(true);
      console.log(!!audioDataUri)
      const nextAudioDataUri =
        audioDataUri ?? (await getCantoneseAudioFn({ data: jyutping }));

      if (!audioDataUri) {
        setAudioDataUri(nextAudioDataUri);
      }

      const audio = new Audio(nextAudioDataUri);
      audio.playbackRate = 0.9;

      await audio.play();
    } catch (err) {
      console.error("Audio playback failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="ghost"
      className="mt-1 gap-1.5 rounded-xl text-muted-foreground"
      onClick={handlePlay}
      disabled={isLoading}
    >
      <span className="text-base">▶</span>
      {isLoading ? "Loading..." : "Play"}
    </Button>
  );
};