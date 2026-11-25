/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Article, ArticleExcel } from '@/app/type/article';

export const DEFAULT_ARTICLE_DESCRIPTION = 'PRODUCTOS ZERMAT';

const ACTIVE_VALUES = ['activo', 'a', 'si', 'sí', '1', 'true'];
const INACTIVE_VALUES = ['inactivo', 'i', 'no', '0', 'false'];

/**
 * Columna "Estado" del Excel → isActive.
 * - vacío: null (no se envía; no cambia el estado del artículo existente)
 * - "Activo", "A", "Sí", "Si", "1", "true" → true
 * - "Inactivo", "I", "No", "0", "false" → false
 * - cualquier otro valor: 'invalid'
 */
export const parseArticleEstado = (value: unknown): boolean | null | 'invalid' => {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (!normalized) return null;
  if (ACTIVE_VALUES.includes(normalized)) return true;
  if (INACTIVE_VALUES.includes(normalized)) return false;
  return 'invalid';
};

/** Código del Excel a texto: 12345 (número) → "12345", "12345.0" → "12345". */
export const normalizeArticleCode = (value: unknown): string => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    // String(12345.0) ya es "12345": el número no conserva el ".0" del Excel.
    return String(value);
  }
  const text = String(value ?? '').trim();
  return /^\d+\.0+$/.test(text) ? text.replace(/\.0+$/, '') : text;
};

const normalizeHeader = (header: string) =>
  header
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();

/** Lee una celda por nombre de columna sin importar tildes ni mayúsculas ("Descripción" = "Descripcion"). */
export const readCell = (row: Record<string, any>, column: string) => {
  const target = normalizeHeader(column);
  const key = Object.keys(row).find((header) => normalizeHeader(header) === target);
  return key === undefined ? undefined : row[key];
};

/**
 * Payload de POST /v1/article a partir de una fila válida del Excel.
 * articleClass e isActive se omiten cuando la celda está vacía (no null ni "").
 */
export const buildArticlePayload = (item: ArticleExcel): Article => {
  const payload: Article = {
    code: item.Codigo.trim(),
    name: item.Nombre.trim(),
    category: item.Categoria.trim(),
    description: item.Descripcion?.trim() || DEFAULT_ARTICLE_DESCRIPTION,
  };

  const articleClass = item.Clase?.trim();
  if (articleClass) payload.articleClass = articleClass;

  const isActive = parseArticleEstado(item.Estado);
  if (typeof isActive === 'boolean') payload.isActive = isActive;

  return payload;
};
