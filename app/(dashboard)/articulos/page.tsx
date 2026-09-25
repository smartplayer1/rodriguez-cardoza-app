"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MaterialButton } from "../../../components/MaterialButton";
import { ChevronDown, Image as ImageIcon, Package, Plus, Edit, Trash2, Import, DollarSign } from "lucide-react";
import { CrearArticulo } from "./modals/CrearArticulo";
import { ImportarArticuloModal } from "@/components/excel-upload-article";
import ImportarPrecios from "./modals/ImportarPrecios";
import {
  ArticleRecord,
  ArticleExcel,
  ArticlePaging,
} from "@/app/type/article";
import Link from "next/link";
import { getPriceCategories } from "@/app/services/pricing";
import { PriceCategory } from "@/app/type/pricing";
import { formatMoney, formatPercent, formatPeriod } from "@/app/utils/money";
import {
  createArticle,
  deleteArticle,
  deleteArticleImage,
  getArticleImages,
  getArticles,
  setArticleImagePrimary,
  updateArticle,
  uploadArticleImage,
} from "@/app/services/article";
import { TableSkeleton } from "@/components/ui/loading-skeleton";
import { useUserStore } from "@/app/store/useUserStore";
import { PERMISSIONS } from "@/app/domain/auth/permissions";
import EntityImageGallery from "@/components/EntityImageGallery";

interface ErrorResponse {
  name: string;
  category: string;
  code: string;
  description: string;
  message: string;
}


const currentPeriodValue = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

// <input type="month"> entrega "YYYY-MM"; vacío = el backend usa el mes actual.
const parsePeriodValue = (value: string): { year: number; month: number } | null => {
  const match = value.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]) };
};

const getPageWindow = (current: number, total: number): (number | "ellipsis")[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const sorted = Array.from(new Set([1, total, current, current - 1, current + 1]))
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const result: (number | "ellipsis")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push("ellipsis");
    result.push(p);
  });
  return result;
};

const getCategoryColor = (value: string) => {
  const colors: Record<string, string> = {
    perfume: "bg-purple-100 text-purple-700",
    maquillaje: "bg-pink-100 text-pink-700",
    "cuidado-piel": "bg-blue-100 text-blue-700",
    accesorios: "bg-green-100 text-green-700",
  };
  return colors[value] || "bg-gray-100 text-gray-700";
};
interface ModalArticleState {
  article: ArticleRecord | null;
  open: boolean;
}


export default function Articulos() {
  const { can } = useUserStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const [modalArticle, setModalArticle] = useState<ModalArticleState>({article: null, open: false});
  const [imagesArticle, setImagesArticle] = useState<ArticleRecord | null>(null);
  const [importModalOpen, setImportModalOpen] = useState<boolean>(false);
  const [importPricesOpen, setImportPricesOpen] = useState<boolean>(false);
  const [importing, setImporting] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [processedRecords, setProcessedRecords] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [errorResponse, setErrorResponse] = useState<ErrorResponse[]>([]);
  const [articulos, setArticulos] = useState<ArticleRecord[]>([]);
  const [paging, setPaging] = useState<ArticlePaging>({
    perPage: 10,
    currentPage: 1,
    totalRecords: 0,
    totalPages: 1,
  });
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [priceCategories, setPriceCategories] = useState<PriceCategory[]>([]);

  const [filterName, setFilterName] = useState("");
  const [filterCode, setFilterCode] = useState("");
  const [filterDescription, setFilterDescription] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterHasPrice, setFilterHasPrice] = useState<"all" | "true" | "false">("all");
  const [filterPeriod, setFilterPeriod] = useState(currentPeriodValue);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    getPriceCategories()
      .then((response) => setPriceCategories(response.records ?? []))
      .catch(() => setPriceCategories([]));
  }, []);

  const loadArticles = useCallback(async () => {
    try {
      setLoadingArticles(true);
      setLoadError(null);

      const period = parsePeriodValue(filterPeriod);

      const result = await getArticles({
        name: filterName || undefined,
        code: filterCode || undefined,
        description: filterDescription || undefined,
        category: filterCategory !== "all" ? filterCategory : undefined,
        year: period?.year,
        month: period?.month,
        hasPrice: filterHasPrice === "all" ? undefined : filterHasPrice === "true",
        page: currentPage,
        perPage: pageSize,
      });

      setArticulos(result.records ?? []);
      setPaging(
        result.paging ?? {
          perPage: pageSize,
          currentPage,
          totalRecords: result.records?.length ?? 0,
          totalPages: 1,
        },
      );
    } catch (error) {
      console.error(error);
      setArticulos([]);
      setLoadError("No pudimos cargar los artículos.");
    } finally {
      setLoadingArticles(false);
    }
  }, [
    filterName,
    filterCode,
    filterDescription,
    filterCategory,
    filterHasPrice,
    filterPeriod,
    currentPage,
    pageSize,
  ]);

  // La paginación es del servidor: cada cambio de filtro/página/tamaño
  // vuelve a consultar (con debounce por el tipeo). Los handlers de los
  // filtros ya reinician currentPage a 1.
  useEffect(() => {
    const timer = setTimeout(() => {
      void loadArticles();
    }, 350);

    return () => clearTimeout(timer);
  }, [loadArticles]);
  const handleCreate = () => {
    setModalArticle({article: null, open: true});
  };

  const handleEdit = (articulo: ArticleRecord) => {
      setModalArticle({article: articulo, open: true});
  };

  const handleDelete = async (id: number) => {
    try{
    if (confirm("¿Está seguro que desea eliminar este artículo?")) {
      await deleteArticle(id)
      await loadArticles();
    }
  }catch{
    alert('Error al eliminar')
  }
  };
  const importarArticulos = async (data: ArticleExcel[]): Promise<void> => {
    setImporting(true);
    setTotalRecords(data.length);
    setProcessedRecords(0);
    
    setSuccessCount(0);
    setErrorResponse([]);

    const errors: ErrorResponse[] = [];
    let success = 0;

    try {
      for (let i = 0; i < data.length; i++) {
        const item = data[i];

        const articulo = {
          name: item.Nombre,
          category: item.Categoria,
          code: item.Codigo,
          description: "PRODUCTOS ZERMAT",
        };

        try {
          const response = await createArticle(articulo);

          if (!response.ok) {
            const result = await response.json();

            errors.push({
              ...articulo,
              message: result.message ?? "Error desconocido",
            });
          } else {
            success++;
            setSuccessCount(success);
          }
        } catch (error) {
          errors.push({
            ...articulo,
            message:
              error instanceof Error ? error.message : "Error desconocido",
          });
        }

        setProcessedRecords(i + 1);
      }

      setErrorResponse(errors);
      await loadArticles();
      alert(
        `Importación finalizada\n\n` +
          `Exitosos: ${success}\n` +
          `Errores: ${errors.length}`,
      );
    } finally {
      setImporting(false);
    }
  };


  const totalPages = Math.max(1, paging.totalPages);
  const rangeFrom = paging.totalRecords === 0 ? 0 : (paging.currentPage - 1) * paging.perPage + 1;
  const rangeTo = Math.min(paging.currentPage * paging.perPage, paging.totalRecords);
  const shownPeriod = (() => {
    const period = parsePeriodValue(filterPeriod);
    return period ? formatPeriod(period.year, period.month) : "el mes actual";
  })();

const handleChange = async (article: ArticleRecord) => {
  if(modalArticle.article){
      await updateArticle({id: article.id, 
        code: modalArticle.article.code == article.code ? null: article.code,
        description: modalArticle.article.description == article.description ? null: article.description,
        category: modalArticle.article.category == article.category ? null: article.category,
        name: modalArticle.article.name == article.name ? null: article.name })
  } else{
    await createArticle({
      name: article.name, 
      description: article.description, 
      category: article.category, 
      code: article.code
    })
  }
   await loadArticles();
}

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto p-6">
        {/* Header */}
        <details className="group bg-surface rounded-lg p-4 mb-6" open>
          <summary className="flex cursor-pointer list-none items-center justify-between text-foreground [&::-webkit-details-marker]:hidden">
            <span>Filtros de búsqueda</span>
            <ChevronDown className="size-5 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-4">
            <input
              type="text"
              placeholder="Nombre..."
              value={filterName}
              onChange={(e) => {
                setFilterName(e.target.value);
                setCurrentPage(1);
              }}
              className="
                flex-1
                px-4
                py-2
                border
                rounded-lg
              "
            />
            <input
              type="text"
              placeholder="Código exacto..."
              value={filterCode}
              onChange={(e) => {
                setFilterCode(e.target.value);
                setCurrentPage(1);
              }}
              className="
                flex-1
                px-4
                py-2
                border
                rounded-lg
              "
            />
            <input
              type="text"
              placeholder="Descripción..."
              value={filterDescription}
              onChange={(e) => {
                setFilterDescription(e.target.value);
                setCurrentPage(1);
              }}
              className="
                flex-1
                px-4
                py-2
                border
                rounded-lg
              "
            />
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="
                px-4
                py-2
                border
                rounded-lg
              "
            >
              <option value="all">Todas las categorías</option>
              {priceCategories.map((category) => (
                <option key={category.id} value={category.category}>
                  {category.category}
                </option>
              ))}
            </select>

            <select
              value={filterHasPrice}
              onChange={(e) => {
                setFilterHasPrice(e.target.value as "all" | "true" | "false");
                setCurrentPage(1);
              }}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">Con y sin precio</option>
              <option value="true">Solo con precio</option>
              <option value="false">Solo sin precio</option>
            </select>

            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              Precios de
              <input
                type="month"
                value={filterPeriod}
                onChange={(e) => {
                  setFilterPeriod(e.target.value);
                  setCurrentPage(1);
                }}
                className="flex-1 px-4 py-2 border rounded-lg text-foreground"
              />
            </label>

            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="
                px-4
                py-2
                border
                rounded-lg
              "
            >
              <option value={10}>10 por página</option>
              <option value={25}>25 por página</option>
              <option value={50}>50 por página</option>
            </select>

          </div>
          <div className="flex justify-end mt-4">
            <MaterialButton
              variant="contained"
              color="primary"
              onClick={loadArticles}
            >
              Refrescar
            </MaterialButton>
          </div>
        </details>
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Package size={32} className="text-primary" />
              <h2 className="text-foreground">Artículos</h2>
            </div>
            <p className="text-muted-foreground">
              Administre el catálogo de artículos de la empresa
            </p>
          </div>
          <div className="flex flex-row gap-2">
            {mounted && can(PERMISSIONS.ARTICLE_CREATE) && (
              <MaterialButton
                variant="contained"
                color="primary"
                startIcon={<Import size={18} />}
                onClick={() => setImportModalOpen(true)}
                disabled={importing}
              >
                {importing
                  ? `Importando ${processedRecords}/${totalRecords}`
                  : "Importar Artículo"}
              </MaterialButton>
            )}
            {mounted && can(PERMISSIONS.ARTICLE_EDIT) && (
              <MaterialButton
                variant="outlined"
                color="primary"
                startIcon={<DollarSign size={18} />}
                onClick={() => setImportPricesOpen(true)}
              >
                Importar Precios
              </MaterialButton>
            )}
            {mounted && can(PERMISSIONS.ARTICLE_CREATE) && (
              <MaterialButton
                variant="contained"
                color="primary"
                startIcon={<Plus size={18} />}
                onClick={handleCreate}
              >
                Nuevo Artículo
              </MaterialButton>
            )}
          </div>
          {importing && (
            <div className="mt-4 w-full">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Importando artículos...</span>

                  <span>
                    {processedRecords} / {totalRecords}
                  </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        totalRecords > 0
                          ? (processedRecords / totalRecords) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                  <div>
                    <strong>Procesados</strong>
                    <div>{processedRecords}</div>
                  </div>

                  <div>
                    <strong>Exitosos</strong>
                    <div>{successCount}</div>
                  </div>

                  <div>
                    <strong>Pendientes</strong>
                    <div>{totalRecords - processedRecords}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Artículos Table */}
        <p className="mb-3 text-sm text-muted-foreground">
          Precios del período: <strong className="text-foreground">{shownPeriod}</strong>
          {!loadingArticles && !loadError && (
            <>
              {" "}
              · {paging.totalRecords === 0
                ? "0 artículos"
                : `Mostrando ${rangeFrom}–${rangeTo} de ${paging.totalRecords} artículos`}
            </>
          )}
        </p>

        {loadError ? (
          <div className="bg-surface rounded elevation-2 py-16 text-center">
            <p className="text-foreground mb-3">{loadError}</p>
            <MaterialButton variant="contained" color="primary" onClick={loadArticles}>
              Reintentar
            </MaterialButton>
          </div>
        ) : loadingArticles ? (
          <div className="bg-surface rounded elevation-2 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <tbody className="divide-y divide-border">
                  <TableSkeleton columns={8} />
                </tbody>
              </table>
            </div>
          </div>
        ) : articulos.length > 0 ? (
          <div className="bg-surface rounded elevation-2 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-foreground">Foto</th>
                    <th className="px-4 py-3 text-left text-foreground">Código</th>
                    <th className="px-4 py-3 text-left text-foreground">Nombre</th>
                    <th className="px-4 py-3 text-left text-foreground">Categoría</th>
                    <th className="px-4 py-3 text-right text-foreground">Neto</th>
                    <th className="px-4 py-3 text-right text-foreground">Catálogo</th>
                    <th className="px-4 py-3 text-right text-foreground">Asesor</th>
                    <th className="px-4 py-3 text-right text-foreground">Distribuidor</th>
                    <th className="px-4 py-3 text-right text-foreground">Público</th>
                    <th className="px-4 py-3 text-right text-foreground">Acciones</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {articulos.map((articulo) => {
                    const hasPrice = articulo.netPrice !== null && articulo.netPrice !== undefined;

                    return (
                      <tr key={articulo.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="h-12 w-12 overflow-hidden rounded-lg border border-border bg-muted flex items-center justify-center">
                            {articulo.primaryImageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={articulo.primaryImageUrl}
                                alt={articulo.name}
                                loading="lazy"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <ImageIcon size={18} className="text-muted-foreground" />
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3 font-mono">{articulo.code}</td>

                        <td className="px-4 py-3">{articulo.name}</td>

                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs ${getCategoryColor(
                              articulo.category,
                            )}`}
                          >
                            {articulo.category}
                          </span>
                        </td>

                        {hasPrice ? (
                          <>
                            <td className="px-4 py-3 text-right font-mono">
                              <div>{formatMoney(articulo.netPrice)}</div>
                              <div className="text-xs text-muted-foreground">
                                Base {formatMoney(articulo.basePrice)}
                                {articulo.discountPercent ? ` · -${formatPercent(articulo.discountPercent)}` : ""}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-mono">{formatMoney(articulo.catalogPrice)}</td>
                            <td className="px-4 py-3 text-right font-mono">{formatMoney(articulo.advisorPrice)}</td>
                            <td className="px-4 py-3 text-right font-mono">{formatMoney(articulo.distributorPrice)}</td>
                            <td className="px-4 py-3 text-right font-mono">{formatMoney(articulo.publicPrice)}</td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 text-right text-muted-foreground">Sin precio</td>
                            <td className="px-4 py-3 text-right text-muted-foreground">—</td>
                            <td className="px-4 py-3 text-right text-muted-foreground">—</td>
                            <td className="px-4 py-3 text-right text-muted-foreground">—</td>
                            <td className="px-4 py-3 text-right text-muted-foreground">—</td>
                          </>
                        )}

                        <td className="px-4 py-3">
                          <div className="flex gap-1 justify-end">
                            {mounted && can(PERMISSIONS.ARTICLE_VIEW) && (
                              <Link
                                href={`/articulos/${encodeURIComponent(articulo.code)}`}
                                className="inline-flex items-center rounded px-3 py-2 text-primary hover:bg-primary/10"
                              >
                                Detalle
                              </Link>
                            )}

                            {mounted && can(PERMISSIONS.ARTICLE_VIEW) && (
                              <MaterialButton
                                variant="text"
                                color="secondary"
                                startIcon={<ImageIcon size={16} />}
                                onClick={() => setImagesArticle(articulo)}
                              >
                                Imágenes
                              </MaterialButton>
                            )}

                            {mounted && can(PERMISSIONS.ARTICLE_EDIT) && (
                              <MaterialButton
                                variant="text"
                                color="primary"
                                startIcon={<Edit size={16} />}
                                onClick={() => handleEdit(articulo)}
                              >
                                Editar
                              </MaterialButton>
                            )}

                            {mounted && can(PERMISSIONS.ARTICLE_DELETE) && (
                              <MaterialButton
                                variant="text"
                                color="secondary"
                                startIcon={<Trash2 size={16} />}
                                onClick={() => handleDelete(articulo.id)}
                              >
                                Eliminar
                              </MaterialButton>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* PAGINACIÓN (del servidor: usa paging.totalRecords/totalPages) */}
              {totalPages > 1 && (
                <nav
                  aria-label="Paginación artículos"
                  className="flex flex-wrap items-center justify-center gap-1 p-4 border-t"
                >
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={paging.currentPage <= 1}
                    className="px-3 py-2 border rounded-lg text-sm disabled:opacity-40"
                  >
                    ‹ Anterior
                  </button>

                  {getPageWindow(paging.currentPage, totalPages).map((entry, index) =>
                    entry === "ellipsis" ? (
                      <span key={`e-${index}`} className="px-2 text-muted-foreground">
                        …
                      </span>
                    ) : (
                      <button
                        key={entry}
                        onClick={() => setCurrentPage(entry)}
                        aria-current={entry === paging.currentPage ? "page" : undefined}
                        className={`h-9 min-w-9 rounded-lg px-3 text-sm ${
                          entry === paging.currentPage
                            ? "bg-primary text-primary-foreground"
                            : "border hover:bg-accent"
                        }`}
                      >
                        {entry}
                      </button>
                    ),
                  )}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={paging.currentPage >= totalPages}
                    className="px-3 py-2 border rounded-lg text-sm disabled:opacity-40"
                  >
                    Siguiente ›
                  </button>
                </nav>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-surface rounded elevation-2 py-16 text-center">
            <Package size={64} className="text-muted-foreground mx-auto mb-4" />

            <h3 className="text-foreground mb-2">
              No hay artículos registrados
            </h3>

            <p className="text-muted-foreground mb-6">
              Comience agregando un nuevo artículo al catálogo
            </p>

            {mounted && can(PERMISSIONS.ARTICLE_CREATE) && (
              <MaterialButton
                variant="contained"
                color="primary"
                startIcon={<Plus size={18} />}
                onClick={handleCreate}
              >
                Crear Primer Artículo
              </MaterialButton>
            )}
          </div>
        )}
      </div>
      <CrearArticulo 
        isOpen={modalArticle.open} 
        onClose={() => setModalArticle({article: null, open:false})} 
        article={modalArticle.article}
        onSave={handleChange}
        />
      <ImportarArticuloModal
        isOpen={importModalOpen}
        onClose={() => {
          if (!importing) {
            setImportModalOpen(false);
          }
        }}
        onImport={importarArticulos}
        loadingImport={importing}
        processed={processedRecords}
        total={totalRecords}
        successCount={successCount}
        errorsImport={errorResponse}
      />
      <ImportarPrecios
        isOpen={importPricesOpen}
        onClose={() => setImportPricesOpen(false)}
      />
      {imagesArticle && (
        <EntityImageGallery
          isOpen={!!imagesArticle}
          onClose={() => setImagesArticle(null)}
          title={`Imágenes · ${imagesArticle.name}`}
          canUpload={mounted && can(PERMISSIONS.ARTICLE_EDIT)}
          canDelete={mounted && can(PERMISSIONS.ARTICLE_EDIT)}
          canSetPrimary={mounted && can(PERMISSIONS.ARTICLE_EDIT)}
          loadImages={() => getArticleImages(imagesArticle.id)}
          uploadImage={(file) => uploadArticleImage(imagesArticle.id, file)}
          deleteImage={(imageId) => deleteArticleImage(imageId)}
          setPrimaryImage={(imageId) => setArticleImagePrimary(imageId)}
          onChanged={() => void loadArticles()}
        />
      )}
    </div>
  );
}
