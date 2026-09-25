"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ImageOff, Star, Trash2, Upload } from "lucide-react";

import { MaterialButton } from "@/components/MaterialButton";
import EntityImageGallery from "@/components/EntityImageGallery";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/ui/loading-skeleton";
import { useUserStore } from "@/app/store/useUserStore";
import { PERMISSIONS } from "@/app/domain/auth/permissions";
import {
  deleteArticleImage,
  getArticleByCode,
  getArticleImages,
  getArticlePriceHistory,
  setArticleImagePrimary,
  uploadArticleImage,
} from "@/app/services/article";
import { ArticlePaging, ArticlePriceHistoryRecord, ArticleRecord } from "@/app/type/article";
import { MONTH_LABELS, formatMoney, formatPercent, formatPeriod } from "@/app/utils/money";

const currentPeriodValue = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const parsePeriodValue = (value: string): { year: number; month: number } | null => {
  const match = value.match(/^(\d{4})-(\d{2})$/);
  return match ? { year: Number(match[1]), month: Number(match[2]) } : null;
};

const safeDecode = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

type Tab = "general" | "historial";

export default function ArticuloDetallePage() {
  const params = useParams<{ code: string }>();
  const code = safeDecode(params.code);

  const { can } = useUserStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const canEdit = mounted && can(PERMISSIONS.ARTICLE_EDIT);

  const [tab, setTab] = useState<Tab>("general");
  const [periodValue, setPeriodValue] = useState(currentPeriodValue);
  const [article, setArticle] = useState<ArticleRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [featuredId, setFeaturedId] = useState<number | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [busyImageId, setBusyImageId] = useState<number | null>(null);

  const loadArticle = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const period = parsePeriodValue(periodValue);
      const result = await getArticleByCode(code, { year: period?.year, month: period?.month });
      setArticle(result);
    } catch (err) {
      setArticle(null);
      setError(err instanceof Error ? err.message : "No se pudo cargar el artículo");
    } finally {
      setLoading(false);
    }
  }, [code, periodValue]);

  useEffect(() => {
    void loadArticle();
  }, [loadArticle]);

  const images = useMemo(() => article?.images ?? [], [article]);
  const featured = images.find((image) => image.id === featuredId) ?? images[0] ?? null;

  const handleSetPrimary = async (imageId: number) => {
    try {
      setBusyImageId(imageId);
      await setArticleImagePrimary(imageId);
      setFeaturedId(imageId);
      await loadArticle();
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo marcar la imagen como principal");
    } finally {
      setBusyImageId(null);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm("¿Desea eliminar esta imagen? Esta acción es permanente.")) return;
    try {
      setBusyImageId(imageId);
      await deleteArticleImage(imageId);
      setFeaturedId(null);
      await loadArticle();
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo eliminar la imagen");
    } finally {
      setBusyImageId(null);
    }
  };

  const hasPrice = article?.netPrice !== null && article?.netPrice !== undefined;
  const period = parsePeriodValue(periodValue);

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto max-w-6xl space-y-5 p-6">
        <Link href="/articulos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} /> Volver a artículos
        </Link>

        {loading && !article ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        ) : error || !article ? (
          <div className="rounded-2xl border border-border/60 bg-surface py-16 text-center">
            <p className="text-foreground">{error ?? "Artículo no encontrado"}</p>
            <div className="mt-4">
              <MaterialButton variant="outlined" color="secondary" onClick={() => void loadArticle()}>
                Reintentar
              </MaterialButton>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-semibold text-foreground">{article.name}</h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  <span className="font-mono">{article.code}</span> · {article.category}
                  {article.description ? ` · ${article.description}` : ""}
                </p>
              </div>

              <label className="space-y-1 text-xs font-medium text-muted-foreground">
                Período de precios
                <input
                  type="month"
                  value={periodValue}
                  onChange={(e) => setPeriodValue(e.target.value)}
                  className="block rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal text-foreground"
                />
              </label>
            </div>

            <div className="flex gap-1 border-b border-border">
              {(["general", "historial"] as Tab[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTab(value)}
                  className={`-mb-px border-b-2 px-4 py-2 text-sm ${
                    tab === value
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {value === "general" ? "General" : "Historial de precios"}
                </button>
              ))}
            </div>

            {tab === "general" ? (
              <div className="grid gap-5 lg:grid-cols-2">
                {/* Galería */}
                <section className="rounded-2xl border border-border/60 bg-surface p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-foreground">Imágenes</h2>
                    {canEdit && (
                      <MaterialButton
                        variant="outlined"
                        color="primary"
                        startIcon={<Upload size={16} />}
                        onClick={() => setGalleryOpen(true)}
                      >
                        Subir imágenes
                      </MaterialButton>
                    )}
                  </div>

                  {featured ? (
                    <>
                      <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-border bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={featured.url} alt={featured.fileName} className="h-full w-full object-contain" />
                        {featured.isPrimary && (
                          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                            <Star size={12} className="fill-current" /> Principal
                          </span>
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
                        {images.map((image) => (
                          <div
                            key={image.id}
                            className={`group relative aspect-square overflow-hidden rounded-lg border ${
                              image.id === featured.id ? "border-primary ring-2 ring-primary/40" : "border-border"
                            }`}
                          >
                            <button type="button" onClick={() => setFeaturedId(image.id)} className="h-full w-full">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={image.url} alt={image.fileName} className="h-full w-full object-cover" />
                            </button>
                            {image.isPrimary && (
                              <Star size={14} className="absolute left-1 top-1 fill-primary text-primary" />
                            )}
                            {canEdit && (
                              <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-black/50 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                                {!image.isPrimary && (
                                  <button
                                    type="button"
                                    title="Marcar como principal"
                                    disabled={busyImageId === image.id}
                                    onClick={() => void handleSetPrimary(image.id)}
                                    className="rounded p-1 text-white hover:bg-white/20 disabled:opacity-50"
                                  >
                                    <Star size={14} />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  title="Eliminar imagen"
                                  disabled={busyImageId === image.id}
                                  onClick={() => void handleDeleteImage(image.id)}
                                  className="rounded p-1 text-white hover:bg-white/20 disabled:opacity-50"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-muted-foreground">
                      <ImageOff size={32} />
                      <p className="text-sm">Sin imágenes</p>
                    </div>
                  )}
                </section>

                {/* Precios del período */}
                <section className="rounded-2xl border border-border/60 bg-surface p-4">
                  <h2 className="mb-1 text-foreground">Precios</h2>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {hasPrice && article.priceYear && article.priceMonth
                      ? `Período: ${formatPeriod(article.priceYear, article.priceMonth)}`
                      : period
                        ? `Período: ${formatPeriod(period.year, period.month)}`
                        : "Mes actual"}
                  </p>

                  {hasPrice ? (
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                      <PriceRow label="Precio base" value={formatMoney(article.basePrice)} />
                      <PriceRow label="Descuento" value={formatPercent(article.discountPercent)} />
                      <PriceRow label="Neto" value={formatMoney(article.netPrice)} strong />
                      <PriceRow label="Catálogo" value={formatMoney(article.catalogPrice)} />
                      <PriceRow label="Asesor" value={formatMoney(article.advisorPrice)} />
                      <PriceRow label="Distribuidor" value={formatMoney(article.distributorPrice)} />
                      <PriceRow label="Público" value={formatMoney(article.publicPrice)} />
                    </dl>
                  ) : (
                    <p className="rounded-lg bg-muted px-4 py-6 text-center text-muted-foreground">
                      Sin precio en este período
                    </p>
                  )}
                </section>
              </div>
            ) : (
              <PriceHistory code={article.code} />
            )}

            {galleryOpen && (
              <EntityImageGallery
                isOpen={galleryOpen}
                onClose={() => setGalleryOpen(false)}
                title={`Imágenes · ${article.name}`}
                canUpload={canEdit}
                canDelete={canEdit}
                canSetPrimary={canEdit}
                loadImages={() => getArticleImages(article.id)}
                uploadImage={(file) => uploadArticleImage(article.id, file)}
                deleteImage={(imageId) => deleteArticleImage(imageId)}
                setPrimaryImage={(imageId) => setArticleImagePrimary(imageId)}
                onChanged={() => void loadArticle()}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function PriceRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={`font-mono ${strong ? "text-base font-semibold text-primary" : "text-foreground"}`}>{value}</dd>
    </div>
  );
}

function PriceHistory({ code }: { code: string }) {
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [page, setPage] = useState(1);
  const [records, setRecords] = useState<ArticlePriceHistoryRecord[]>([]);
  const [paging, setPaging] = useState<ArticlePaging | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const yearNumber = Number.parseInt(year, 10);
      const monthNumber = Number.parseInt(month, 10);
      const response = await getArticlePriceHistory(code, {
        year: Number.isFinite(yearNumber) ? yearNumber : undefined,
        month: Number.isFinite(monthNumber) ? monthNumber : undefined,
        page,
        perPage: 10,
      });
      setRecords(response.records ?? []);
      setPaging(response.paging ?? null);
    } catch (err) {
      setRecords([]);
      setError(err instanceof Error ? err.message : "No se pudo cargar el historial de precios");
    } finally {
      setLoading(false);
    }
  }, [code, year, month, page]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 250);
    return () => clearTimeout(timer);
  }, [load]);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          Año
          <input
            type="number"
            min={2000}
            max={2100}
            value={year}
            placeholder="Todos"
            onChange={(e) => {
              setYear(e.target.value);
              setPage(1);
            }}
            className="block w-28 rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal text-foreground"
          />
        </label>
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          Mes
          <select
            value={month}
            onChange={(e) => {
              setMonth(e.target.value);
              setPage(1);
            }}
            className="block rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal text-foreground"
          >
            <option value="">Todos</option>
            {MONTH_LABELS.map((label, index) => (
              <option key={label} value={index + 1}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {(year || month) && (
          <button
            type="button"
            onClick={() => {
              setYear("");
              setMonth("");
              setPage(1);
            }}
            className="px-2 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Limpiar
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-surface">
        {error ? (
          <div className="py-12 text-center">
            <p className="text-foreground">{error}</p>
            <div className="mt-3">
              <MaterialButton variant="outlined" color="secondary" onClick={() => void load()}>
                Reintentar
              </MaterialButton>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 text-left">Período</th>
                  <th className="px-4 py-2.5 text-right">Base</th>
                  <th className="px-4 py-2.5 text-right">Desc.</th>
                  <th className="px-4 py-2.5 text-right">Neto</th>
                  <th className="px-4 py-2.5 text-right">Catálogo</th>
                  <th className="px-4 py-2.5 text-right">Asesor</th>
                  <th className="px-4 py-2.5 text-right">Distribuidor</th>
                  <th className="px-4 py-2.5 text-right">Público</th>
                  <th className="px-4 py-2.5 text-left">Calculado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {loading ? (
                  <TableSkeleton columns={9} rows={5} />
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                      Sin historial de precios para este filtro.
                    </td>
                  </tr>
                ) : (
                  records.map((record) => (
                    <tr key={record.id} className="align-top hover:bg-muted/15">
                      <td className="px-4 py-3 capitalize">{formatPeriod(record.year, record.month)}</td>
                      <td className="px-4 py-3 text-right font-mono">{formatMoney(record.basePrice)}</td>
                      <td className="px-4 py-3 text-right font-mono">{formatPercent(record.discountPercent)}</td>
                      <td className="px-4 py-3 text-right font-mono">{formatMoney(record.netPrice)}</td>
                      <PriceWithMarkup price={record.catalogPrice} markup={record.catalogMarkupPercent} />
                      <PriceWithMarkup price={record.advisorPrice} markup={record.advisorMarkupPercent} />
                      <PriceWithMarkup price={record.distributorPrice} markup={record.distributorMarkupPercent} />
                      <PriceWithMarkup price={record.publicPrice} markup={record.publicPriceMarkupPercent} />
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(record.calculatedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {paging && paging.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Página {paging.currentPage} de {paging.totalPages} · {paging.totalRecords} registros
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={paging.currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border px-3 py-1.5 disabled:opacity-40"
            >
              ‹ Anterior
            </button>
            <button
              type="button"
              disabled={paging.currentPage >= paging.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border px-3 py-1.5 disabled:opacity-40"
            >
              Siguiente ›
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function PriceWithMarkup({ price, markup }: { price: number; markup: number }) {
  return (
    <td className="px-4 py-3 text-right font-mono">
      <div>{formatMoney(price)}</div>
      <div className="text-xs text-muted-foreground">margen {formatPercent(markup)}</div>
    </td>
  );
}
