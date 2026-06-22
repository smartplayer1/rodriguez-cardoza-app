"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MaterialButton } from "../../../components/MaterialButton";
import { Package, Plus, Edit, Trash2, Sparkles, Import } from "lucide-react";
import { CrearArticulo } from "./modals/CrearArticulo";
import { ImportarArticuloModal } from "@/components/excel-upload-article";
import {
  ArticleRecord,
  ArticleExcel,
  ArticleResponse,
} from "@/app/type/article";
import { createArticle, getArticles, updateArticle, deleteArticle } from "@/app/services/article";

interface ErrorResponse {
  name: string;
  category: string;
  code: string;
  description: string;
  message: string;
}


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
  const [modalArticle, setModalArticle] = useState<ModalArticleState>({article: null, open: false});
  const [importModalOpen, setImportModalOpen] = useState<boolean>(false);
  const [importing, setImporting] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [processedRecords, setProcessedRecords] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [errorResponse, setErrorResponse] = useState<ErrorResponse[]>([]);
  const [articulos, setArticulos] = useState<ArticleRecord[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);

  const [filterName, setFilterName] = useState("");
  const [filterCode, setFilterCode] = useState("");
  const [filterDescription, setFilterDescription] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const loadArticles = useCallback(async () => {
    try {
      setLoadingArticles(true);

      const result: ArticleResponse = await getArticles({
        name: filterName || undefined,
        code: filterCode || undefined,
        description: filterDescription || undefined,
        category: filterCategory !== "all" ? filterCategory : undefined,
      });

      setArticulos(result.records ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingArticles(false);
    }
  }, [filterName, filterCode, filterDescription, filterCategory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadArticles();
      setCurrentPage(1);
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
      setArticulos(articulos.filter((a) => a.id !== id));
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


  const totalPages = Math.max(1, Math.ceil(articulos.length / pageSize));

  const paginatedArticles = articulos.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

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
        <div className="bg-surface rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
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
              placeholder="Código..."
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
              <option value="perfume">Perfume</option>
              <option value="maquillaje">Maquillaje</option>
              <option value="cuidado-piel">Cuidado piel</option>
              <option value="accesorios">Accesorios</option>
            </select>

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
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
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
        </div>
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
            <MaterialButton
              variant="contained"
              color="primary"
              startIcon={<Plus size={18} />}
              onClick={handleCreate}
            >
              Nuevo Artículo
            </MaterialButton>
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
        {loadingArticles ? (
          <div className="bg-surface rounded-xl py-20 text-center">
            Cargando artículos...
          </div>
        ) : articulos.length > 0 ? (
          <div className="bg-surface rounded elevation-2 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm text-foreground">
                      Código
                    </th>
                    <th className="px-6 py-4 text-left text-sm text-foreground">
                      Nombre
                    </th>
                    <th className="px-6 py-4 text-left text-sm text-foreground">
                      Categoría
                    </th>
                    <th className="px-6 py-4 text-left text-sm text-foreground">
                      Descripción
                    </th>
                    <th className="px-6 py-4 text-right text-sm text-foreground">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {paginatedArticles.map((articulo) => (
                    <tr
                      key={articulo.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Sparkles size={20} className="text-primary" />
                          </div>

                          <span className="font-mono text-sm">
                            {articulo.code}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">{articulo.name}</td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs ${getCategoryColor(
                            articulo.category,
                          )}`}
                        >
                          {articulo.category}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-muted-foreground text-sm">
                          {articulo.description}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex gap-2 justify-end">
                          <MaterialButton
                            variant="text"
                            color="primary"
                            startIcon={<Edit size={16} />}
                            onClick={() => handleEdit(articulo)}
                          >
                            Editar
                          </MaterialButton>

                          <MaterialButton
                            variant="text"
                            color="secondary"
                            startIcon={<Trash2 size={16} />}
                            onClick={() => handleDelete(articulo.id)}
                          >
                            Eliminar
                          </MaterialButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* PAGINACIÓN */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 border-t">
                <div className="text-sm text-muted-foreground">
                  {articulos.length} registros encontrados
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="
              px-4
              py-2
              border
              rounded-lg
              disabled:opacity-50
            "
                  >
                    Anterior
                  </button>

                  <span>
                    Página {currentPage} de {totalPages}
                  </span>

                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage >= totalPages}
                    className="
              px-4
              py-2
              border
              rounded-lg
              disabled:opacity-50
            "
                  >
                    Siguiente
                  </button>
                </div>
              </div>
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

            <MaterialButton
              variant="contained"
              color="primary"
              startIcon={<Plus size={18} />}
              onClick={handleCreate}
            >
              Crear Primer Artículo
            </MaterialButton>
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
    </div>
  );
}
