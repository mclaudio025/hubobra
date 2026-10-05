"use client";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/hooks/i18n/useT";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smiley } from "@/lib/ui/icons";

interface Props {
  disabled?: boolean;
  onPick: (emoji: string) => void;
}

export function EmojiButton({ disabled, onPick }: Props) {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-9 w-9 shrink-0"
          aria-label={t("Emoji")}
          disabled={disabled}
        >
          <Smiley size={18} weight="regular" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" side="top" className="w-auto border-none p-0 shadow-lg">
        {open && <EmojiPickerLazy onPick={(emoji) => { onPick(emoji); setOpen(false); }} />}
      </PopoverContent>
    </Popover>
  );
}

function EmojiPickerLazy({ onPick }: { onPick: (emoji: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let unmounted = false;

    Promise.all([
      import("emoji-mart"),
      import("@emoji-mart/data"),
    ]).then(([emojiMart, dataModule]) => {
      if (unmounted || !containerRef.current) return;
      const PickerClass = (emojiMart as any).Picker || (emojiMart as any).default?.Picker || (emojiMart as any).default;
      if (PickerClass) {
        new PickerClass({
          parent: containerRef.current,
          data: (dataModule as any).default || dataModule,
          locale: "pt",
          previewPosition: "none",
          onEmojiSelect: (e: { native: string }) => onPick(e.native),
        });
      }
    }).catch(console.error);

    return () => {
      unmounted = true;
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [onPick]);

  return <div ref={containerRef} className="min-h-[420px] min-w-[352px]" />;
}

