export type EntityImageType = 'Article' | 'CollectionBankTransfer';

export interface EntityImage {
  id: number;
  entityType: EntityImageType;
  entityId: number;
  url: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: string;
}

// Debe reflejar exactamente lo que valida el backend, para dar feedback
// inmediato antes de subir (el backend igual vuelve a validar).
export const ALLOWED_IMAGE_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
