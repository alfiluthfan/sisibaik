"use client";

import Image from "next/image";

import { useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

import {
  PRODUCT_IMAGE_BUCKET,
  PRODUCT_IMAGE_MAX_SIZE,
  PRODUCT_IMAGE_TYPES,
} from "@/lib/storage/product-images";

import {
  removeProductImageAction,
  setProductImageAction,
} from "@/features/products/image-actions";

interface ProductImageUploaderProps {
  productId: string;

  ownerUserId: string;

  currentImageUrl: string | null;
}

function getExtension(mimeType: string) {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";

    case "image/png":
      return "png";

    case "image/webp":
      return "webp";

    default:
      return null;
  }
}

export function ProductImageUploader({
  productId,
  ownerUserId,
  currentImageUrl,
}: ProductImageUploaderProps) {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [success, setSuccess] = useState<string | null>(null);

  const [pending, startTransition] = useTransition();

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setSuccess(null);

    const selected = event.target.files?.[0];

    if (!selected) {
      return;
    }

    if (!PRODUCT_IMAGE_TYPES.includes(selected.type)) {
      setError("Format gambar harus JPG, PNG, atau WebP.");

      return;
    }

    if (selected.size > PRODUCT_IMAGE_MAX_SIZE) {
      setError("Ukuran gambar maksimal 5 MB.");

      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const nextPreview = URL.createObjectURL(selected);

    setFile(selected);

    setPreviewUrl(nextPreview);
  }

  function handleUpload() {
    if (!file) {
      setError("Pilih gambar terlebih dahulu.");

      return;
    }

    startTransition(async () => {
      setError(null);
      setSuccess(null);

      const extension = getExtension(file.type);

      if (!extension) {
        setError("Format gambar tidak valid.");

        return;
      }

      const supabase = createClient();

      const imagePath = `${ownerUserId}/${productId}/${crypto.randomUUID()}.${extension}`;

      // ==========================
      // UPLOAD STORAGE
      // ==========================

      const { error: uploadError } = await supabase.storage
        .from(PRODUCT_IMAGE_BUCKET)
        .upload(imagePath, file, {
          cacheControl: "3600",

          contentType: file.type,

          upsert: false,
        });

      if (uploadError) {
        setError(uploadError.message);

        return;
      }

      // ==========================
      // ATTACH TO PRODUCT
      // ==========================

      const result = await setProductImageAction(productId, imagePath);

      /*
       * Kalau DB update gagal,
       * bersihkan image baru.
       */

      if (result.error) {
        await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([imagePath]);

        setError(result.error);

        return;
      }

      setFile(null);

      setPreviewUrl(null);

      setSuccess(result.success ?? "Foto berhasil disimpan.");

      router.refresh();
    });
  }

  function handleRemove() {
    startTransition(async () => {
      setError(null);
      setSuccess(null);

      const result = await removeProductImageAction(productId);

      if (result.error) {
        setError(result.error);

        return;
      }

      setSuccess(result.success ?? "Foto berhasil dihapus.");

      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {/* IMAGE */}

      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-100">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Preview produk"
            className="h-full w-full object-cover"
          />
        ) : currentImageUrl ? (
          <Image
            src={currentImageUrl}
            alt="Foto produk"
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="text-5xl">🍱</div>

              <p className="mt-2 text-sm text-gray-400">Belum ada foto</p>
            </div>
          </div>
        )}
      </div>

      {/* INPUT */}

      <input
        type="file"
        accept="
          image/jpeg,
          image/png,
          image/webp
        "
        onChange={handleFileChange}
        disabled={pending}
        className="block w-full text-sm"
      />

      <p className="text-xs text-gray-500">
        JPG, PNG, atau WebP. Maksimal 5 MB.
      </p>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleUpload}
          disabled={pending || !file}
          className="flex-1 rounded-lg bg-black px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending
            ? "Mengunggah..."
            : currentImageUrl
              ? "Ganti Foto"
              : "Upload Foto"}
        </button>

        {currentImageUrl && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={pending}
            className="rounded-lg border px-4 py-3 text-sm font-medium text-red-600 disabled:opacity-50"
          >
            Hapus
          </button>
        )}
      </div>
    </div>
  );
}
