'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ImageOff, Star, Trash2, Upload, X } from 'lucide-react';

import { MaterialButton } from '@/components/MaterialButton';
import { CardsSkeleton } from '@/components/ui/loading-skeleton';
import { ALLOWED_IMAGE_CONTENT_TYPES, EntityImage, MAX_IMAGE_SIZE_BYTES } from '@/app/type/entity-image';

type UploadTaskStatus = 'uploading' | 'error';

type UploadTask = {
  key: string;
  fileName: string;
  status: UploadTaskStatus;
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
}: Props) {
  const [images, setImages] = useState<EntityImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([]);
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

  useEffect(() => {
    if (!isOpen) return;
    setUploadTasks([]);
    void refresh();
  }, [isOpen, refresh]);

  if (!isOpen) return null;

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    const tasks: UploadTask[] = files.map((file, index) => ({
      key: `${Date.now()}-${index}-${file.name}`,
      fileName: file.name,
      status: 'uploading',
    }));

    setUploadTasks((prev) => [...prev, ...tasks]);

    await Promise.all(
      files.map(async (file, index) => {
        const task = tasks[index];
        const validationError = validateFile(file);

        if (validationError) {
          setUploadTasks((prev) =>
            prev.map((t) => (t.key === task.key ? { ...t, status: 'error', message: validationError } : t)),
          );
          return;
        }

        try {
          await uploadImage(file);
          setUploadTasks((prev) => prev.filter((t) => t.key !== task.key));
        } catch (error) {
          setUploadTasks((prev) =>
            prev.map((t) =>
              t.key === task.key
                ? {
                    ...t,
                    status: 'error',
                    message: error instanceof Error ? error.message : 'No se pudo subir la imagen',
                  }
                : t,
            ),
          );
        }
      }),
    );

    await refresh();

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleDelete = async (image: EntityImage) => {
    if (!confirm(`¿Desea eliminar esta imagen? Esta acción es permanente.`)) return;

    try {
      setDeletingId(image.id);
      await deleteImage(image.id);
      setImages((prev) => prev.filter((item) => item.id !== image.id));
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
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No se pudo marcar la imagen como principal');
    } finally {
      setPrimaryUpdatingId(null);
    }
  };

  const dismissTask = (key: string) => {
    setUploadTasks((prev) => prev.filter((t) => t.key !== key));
  };

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
                Subir imágenes (JPEG, PNG, WEBP o GIF · máx. 5 MB c/u)
                <input
                  ref={inputRef}
                  type="file"
                  accept={ALLOWED_IMAGE_CONTENT_TYPES.join(',')}
                  multiple
                  className="hidden"
                  onChange={(e) => void handleFilesSelected(e.target.files)}
                />
              </label>
            </div>
          )}

          {uploadTasks.length > 0 && (
            <div className="mb-4 flex flex-col gap-2">
              {uploadTasks.map((task) => (
                <div
                  key={task.key}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm ${
                    task.status === 'error'
                      ? 'border-red-300 bg-red-50 text-red-700'
                      : 'border-border bg-background/60 text-muted-foreground'
                  }`}
                >
                  <span className="truncate">
                    {task.fileName}
                    {task.status === 'uploading' ? ' — subiendo...' : task.message ? ` — ${task.message}` : ''}
                  </span>
                  {task.status === 'error' && (
                    <button
                      type="button"
                      onClick={() => dismissTask(task.key)}
                      className="ml-2 text-red-600 hover:underline shrink-0"
                    >
                      Descartar
                    </button>
                  )}
                </div>
              ))}
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
