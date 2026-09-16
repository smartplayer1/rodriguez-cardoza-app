'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronDown, Package, Search, X } from 'lucide-react';

import { MaterialButton } from '@/components/MaterialButton';
import { MaterialInput } from '@/components/MaterialInput';
import { ArticleRecord } from '@/app/type/article';

type MultiProductPickerProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  articles: ArticleRecord[];
  excludeCodes: string[];
  showQuantity?: boolean;
  onConfirm: (selected: ArticleRecord[], quantity: number) => void;
};

export function MultiProductPicker({
  isOpen,
  onClose,
  title = 'Seleccionar productos',
  articles,
  excludeCodes,
  showQuantity = false,
  onConfirm,
}: MultiProductPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [quantity, setQuantity] = useState(1);

  const excludeSet = useMemo(() => new Set(excludeCodes), [excludeCodes]);

  const categories = useMemo(() => {
    const unique = new Set(articles.map((a) => a.category).filter(Boolean));
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [articles]);

  const availableArticles = useMemo(
    () => articles.filter((a) => !excludeSet.has(a.code)),
    [articles, excludeSet],
  );

  const filteredArticles = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return availableArticles.filter((a) => {
      if (categoryFilter && a.category !== categoryFilter) return false;
      if (!term) return true;
      return (
        a.name.toLowerCase().includes(term) || a.code.toLowerCase().includes(term)
      );
    });
  }, [availableArticles, categoryFilter, searchTerm]);

  if (!isOpen) return null;

  const allVisibleSelected =
    filteredArticles.length > 0 && filteredArticles.every((a) => selectedCodes.has(a.code));

  const toggleArticle = (code: string) => {
    setSelectedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    setSelectedCodes((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        filteredArticles.forEach((a) => next.delete(a.code));
      } else {
        filteredArticles.forEach((a) => next.add(a.code));
      }
      return next;
    });
  };

  const handleClose = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setSelectedCodes(new Set());
    setQuantity(1);
    onClose();
  };

  const handleConfirm = () => {
    const selected = articles.filter((a) => selectedCodes.has(a.code));
    if (selected.length === 0) return;
    onConfirm(selected, quantity);
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-surface elevation-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
          <h3 className="text-foreground">{title}</h3>
          <button
            type="button"
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 pb-3 shrink-0 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Buscar por nombre o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-input-background border-b-2 border-border
                           focus:border-primary rounded-t transition-colors outline-none"
              />
            </div>

            <div className="relative sm:w-56">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full pl-4 pr-10 py-2 bg-input-background border-b-2 border-border
                           focus:border-primary rounded-t transition-colors outline-none appearance-none"
              >
                <option value="">Todas las categorías</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={18}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={toggleSelectAllVisible}
              disabled={filteredArticles.length === 0}
              className="text-primary hover:underline disabled:opacity-50 disabled:no-underline"
            >
              {allVisibleSelected ? 'Quitar selección visible' : 'Seleccionar todos los visibles'}
            </button>
            <span className="text-muted-foreground">
              {selectedCodes.size} producto{selectedCodes.size === 1 ? '' : 's'} seleccionado
              {selectedCodes.size === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        <div className="px-5 overflow-y-auto flex-1">
          {filteredArticles.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
              <Package size={32} />
              <p className="text-sm">No se encontraron productos</p>
            </div>
          ) : (
            <div className="space-y-1 pb-2">
              {filteredArticles.map((article) => {
                const checked = selectedCodes.has(article.code);
                return (
                  <label
                    key={article.code}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer transition-colors ${
                      checked ? 'bg-primary/10' : 'hover:bg-muted/50'
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                        checked ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                      }`}
                    >
                      {checked && <Check size={14} />}
                    </span>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleArticle(article.code)}
                      className="hidden"
                    />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm text-foreground truncate">{article.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {article.code}
                        {article.category ? ` · ${article.category}` : ''}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-4 shrink-0">
          {showQuantity ? (
            <div className="w-40">
              <MaterialInput
                label="Cantidad c/u *"
                type="number"
                fullWidth
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                min={1}
              />
            </div>
          ) : (
            <span />
          )}
          <div className="flex gap-3">
            <MaterialButton variant="outlined" color="secondary" onClick={handleClose}>
              Cancelar
            </MaterialButton>
            <MaterialButton
              variant="contained"
              color="primary"
              onClick={handleConfirm}
              disabled={selectedCodes.size === 0}
            >
              Agregar {selectedCodes.size > 0 ? `(${selectedCodes.size})` : ''}
            </MaterialButton>
          </div>
        </div>
      </div>
    </div>
  );
}
