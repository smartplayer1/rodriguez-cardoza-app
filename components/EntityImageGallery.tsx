'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ImageOff, Star, Trash2, Upload, UploadCloud, X } from 'lucide-react';

import { MaterialButton } from '@/components/MaterialButton';
import { CardsSkeleton } from '@/components/ui/loading-skeleton';
import { ALLOWED_IMAGE_CONTENT_TYPES, EntityImage, MAX_IMAGE_SIZE_BYTES } from '@/app/type/entity-image';

type PendingFileStatus = 'staged' | 'uploading' | 'error';

type PendingFile = {
  key: string;
  file: File;
  previewUrl: string;
  status: PendingFileStatus;
  message?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  canUpload: boolean;
  canDelete: boolean;
  canSetPrimary?: boolean;
  loadImages: () => Promise<EntityImage[]>;
  uploadImage: (file: File) => Promise<EntityImage>;
  deleteImage: (imageId: number) => Promise<void>;
  setPrimaryImage?: (imageId: number) => Promise<void>;
  // Se llama después de subir, borrar o marcar una principal, para que la
  // pantalla que abrió la galería refresque su propia copia de los datos.
  onChanged?: () => void;
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const validateFile = (file: File): string | null => {
  if (!ALLOWED_IMAGE_CONTENT_TYPES.includes(file.type)) {
    return 'Formato no permitido. Use JPEG, PNG, WEBP o GIF.';
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return `El archivo supera el tamaño máximo de ${formatSize(MAX_IMAGE_SIZE_BYTES)}.`;
  }
  return null;
};

export default function EntityImageGallery({
  isOpen,
  onClose,
  title,
  canUpload,
  canDelete,
  canSetPrimary = false,
  loadImages,
  uploadImage,
  deleteImage,
  setPrimaryImage,
  onChanged,
}: Props) {
  const [images, setImages] = useState<EntityImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [primaryUpdatingId, setPrimaryUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setListError(null);
      const result = await loadImages();
      setImages(result);
    } catch (error) {
      setListError(error instanceof Error ? error.message : 'No se pudieron cargar las imágenes');
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, [loadImages]);

  const clearPendingFiles = useCallback(() => {
    setPendingFiles((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      return [];
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    clearPendingFiles();
    void refresh();
  }, [isOpen, refresh, clearPendingFiles]);

  useEffect(() => {
    return () => {
      setPendingFiles((prev) => {
        prev.forEach((p) => URL.revokeObjectURL(p.previewUrl));
        return prev;
      });
    };
  }, []);

  if (!isOpen) return null;

  const handleFilesSelected = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    const newEntries: PendingFile[] = files.map((file, index) => {
      const validationError = validateFile(file);
      return {
        key: `${Date.now()}-${index}-${file.name}`,
        file,
        previewUrl: URL.createObjectURL(file),
        status: validationError ? 'error' : 'staged',
        message: validationError ?? undefined,
      };
    });

    setPendingFiles((prev) => [...prev, ...newEntries]);

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const discardPending = (key: string) => {
    setPendingFiles((prev) => {
      const target = prev.find((p) => p.key === key);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.key !== key);
    });
  };

  const handleUploadPending = async () => {
    const toUpload = pendingFiles.filter((p) => p.status === 'staged');
    if (toUpload.length === 0) return;

    setIsUploading(true);
    setPendingFiles((prev) =>
      prev.map((p) => (p.status === 'staged' ? { ...p, status: 'uploading' } : p)),
    );

    await Promise.all(
      toUpload.map(async (pending) => {
        try {
          await uploadImage(pending.file);
          setPendingFiles((prev) => {
            const target = prev.find((p) => p.key === pending.key);
            if (target) URL.revokeObjectURL(target.previewUrl);
            return prev.filter((p) => p.key !== pending.key);
          });
        } catch (error) {
          setPendingFiles((prev) =>
            prev.map((p) =>
              p.key === pending.key
                ? {
                    ...p,
                    status: 'error',
                    message: error instanceof Error ? error.message : 'No se pudo subir la imagen',
                  }
                : p,
            ),
          );
        }
      }),
    );

    setIsUploading(false);
    await refresh();
    onChanged?.();
  };

  const handleDelete = async (image: EntityImage) => {
    if (!confirm(`¿Desea eliminar esta imagen? Esta acción es permanente.`)) return;

    try {
      setDeletingId(image.id);
      await deleteImage(image.id);
      setImages((prev) => prev.filter((item) => item.id !== image.id));
      onChanged?.();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No se pudo eliminar la imagen');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetPrimary = async (image: EntityImage) => {
    if (!setPrimaryImage || image.isPrimary) return;

    try {
      setPrimaryUpdatingId(image.id);
      await setPrimaryImage(image.id);
      await refresh();
      onChanged?.();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No se pudo marcar la imagen como principal');
    } finally {
      setPrimaryUpdatingId(null);
    }
  };

  const stagedCount = pendingFiles.filter((p) => p.status === 'staged').length;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-surface elevation-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
          <h3 className="text-foreground">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {canUpload && (
            <div className="mb-4">
              <label className="inline-flex items-center gap-2 cursor-pointer rounded-2xl border-2 border-dashed border-border px-4 py-3 text-sm text-muted-foreground hover:border-primary hover:text-foreground transition-colors">
                <Upload size={18} />
                Seleccionar imágenes (JPEG, PNG, WEBP o GIF · máx. 5 MB c/u)
                <input
                  ref={inputRef}
                  type="file"
                  accept={ALLOWED_IMAGE_CONTENT_TYPES.join(',')}
                  multiple
                  className="hidden"
                  onChange={(e) => handleFilesSelected(e.target.files)}
                />
              </label>
            </div>
          )}

          {pendingFiles.length > 0 && (
            <div className="mb-5 rounded-2xl border border-border/60 bg-background/40 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {pendingFiles.length} imagen{pendingFiles.length === 1 ? '' : 'es'} lista
                  {pendingFiles.length === 1 ? '' : 's'} para subir
                </span>
                <MaterialButton
                  variant="contained"
                  color="primary"
                  startIcon={<UploadCloud size={16} />}
                  onClick={handleUploadPending}
                  disabled={stagedCount === 0 || isUploading}
                >
                  {isUploading ? 'Subiendo...' : `Subir ${stagedCount || ''}`}
                </MaterialButton>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {pendingFiles.map((pending) => (
                  <div
                    key={pending.key}
                    className="group relative aspect-square overflow-hidden rounded-2xl border border-border/60 bg-background/60"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pending.previewUrl}
                      alt={pending.file.name}
                      className="h-full w-full object-cover"
                    />

                    {pending.status !== 'staged' && (
                      <div
                        className={`absolute inset-0 flex items-center justify-center p-2 text-center text-xs text-white ${
                          pending.status === 'error' ? 'bg-red-900/70' : 'bg-black/60'
                        }`}
                      >
                        {pending.status === 'uploading' ? 'Subiendo...' : pending.message}
                      </div>
                    )}

                    {pending.status !== 'uploading' && (
                      <button
                        type="button"
                        onClick={() => discardPending(pending.key)}
                        title="Quitar"
                        className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {listError ? (
            <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              {listError}
            </div>
          ) : loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              <CardsSkeleton count={4} />
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
              <ImageOff size={32} />
              <p className="text-sm">No hay imágenes cargadas todavía</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="group relative aspect-square overflow-hidden rounded-2xl border border-border/60 bg-background/60"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={image.fileName}
                    className="h-full w-full object-cover"
                  />

                  {image.isPrimary && (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[11px] text-primary-foreground">
                      <Star size={12} className="fill-current" />
                      Principal
                    </span>
                  )}

                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1 bg-black/50 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                    {canSetPrimary && !image.isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(image)}
                        disabled={primaryUpdatingId === image.id}
                        title="Marcar como principal"
                        className="rounded-lg p-1.5 text-white hover:bg-white/20 disabled:opacity-50"
                      >
                        <Star size={16} />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDelete(image)}
                        disabled={deletingId === image.id}
                        title="Eliminar imagen"
                        className="rounded-lg p-1.5 text-white hover:bg-white/20 disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-border px-5 py-4 shrink-0">
          <MaterialButton variant="outlined" color="secondary" onClick={onClose}>
            Cerrar
          </MaterialButton>
        </div>
      </div>
    </div>
  );
}
