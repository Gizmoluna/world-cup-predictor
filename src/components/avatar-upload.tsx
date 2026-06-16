"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { updateProfile } from "@/app/actions";

// Square-crop + downscale an image file to a small JPEG data URL entirely in the
// browser, so we can store it straight on the user row (no storage bucket / infra
// to set up). 256px @ ~0.82 quality lands around 15–30KB.
function fileToAvatarDataUrl(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read that image."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That file isn't a usable image."));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas unavailable."));
        // cover-crop: scale so the shorter side fills, centre the rest
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function AvatarUpload({
  currentUrl,
  flag,
  themeGradient,
}: {
  currentUrl?: string | null;
  flag: string;
  themeGradient: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      setPreview(dataUrl);
      start(async () => {
        const res = await updateProfile({ avatarUrl: dataUrl });
        if (!res.ok) setError(res.error ?? "Couldn't save your photo.");
        else router.refresh();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    }
  }

  function remove() {
    setPreview(null);
    start(async () => {
      await updateProfile({ avatarUrl: null });
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-3xl shadow-lg active:scale-95"
        style={preview ? undefined : { background: themeGradient }}
        aria-label="Change profile photo"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-4xl">{flag}</span>
        )}
        <span className="absolute bottom-0 right-0 m-1 rounded-full bg-black/70 p-1">
          <Camera size={14} className="text-white" />
        </span>
      </button>

      <div className="min-w-0">
        <p className="text-sm font-bold">{pending ? "Saving…" : "Profile photo"}</p>
        <p className="text-xs text-muted">Tap the photo to pick from your phone or take a new one.</p>
        {preview && (
          <button onClick={remove} disabled={pending} className="mt-1 text-xs font-bold text-danger">
            Remove photo
          </button>
        )}
        {error && <p className="mt-1 text-xs font-bold text-danger">{error}</p>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={onPick}
        className="hidden"
      />
    </div>
  );
}
