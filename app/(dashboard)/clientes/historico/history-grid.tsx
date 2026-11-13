'use client';

import { Fragment, ReactNode, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Filter } from 'lucide-react';

import { TableSkeleton } from '@/components/ui/loading-skeleton';

export type GridColumn<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  /** Texto contra el que se compara el filtro de la columna. Sin él, la columna no se filtra. */
  filterText?: (row: T) => string;
  align?: 'right' | 'left';
  /** Si se define, la columna muestra subtotal por grupo y total general. */
  sum?: (row: T) => number;
  formatSum?: (value: number) => string;
  cellClassName?: (row: T) => string;
  headerTitle?: string;
};

type Props<T> = {
  rows: T[];
  columns: GridColumn<T>[];
  rowKey: (row: T) => string | number;
  loading?: boolean;
  emptyText?: string;
  groupBy?: (row: T) => { key: string; label: string };
  selectedKey?: string | number | null;
  onSelect?: (row: T) => void;
  rowClassName?: (row: T) => string;
  renderExpanded?: (row: T) => ReactNode;
  showTotals?: boolean;
  maxHeightClass?: string;
};

const cellBase = 'border-r border-border/60 px-2 py-1.5 text-xs whitespace-nowrap';

// Tabla densa al estilo del histórico de escritorio: fila de filtros por
// columna, agrupación opcional (con subtotales) y total general al pie.
export default function HistoryGrid<T>({
  rows,
  columns,
  rowKey,
  loading = false,
  emptyText = 'Sin registros en el período',
  groupBy,
  selectedKey = null,
  onSelect,
  rowClassName,
  renderExpanded,
  showTotals = false,
  maxHeightClass = 'max-h-[420px]',
}: Props<T>) {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const hasFilters = columns.some((column) => column.filterText);
  const hasSums = columns.some((column) => column.sum);
  const expandable = Boolean(renderExpanded);
  const totalColumns = columns.length + (expandable ? 1 : 0);

  const filteredRows = useMemo(() => {
    const active = columns.filter((column) => column.filterText && filters[column.key]?.trim());
    if (active.length === 0) return rows;
    return rows.filter((row) =>
      active.every((column) =>
        (column.filterText?.(row) ?? '').toLowerCase().includes(filters[column.key].trim().toLowerCase()),
      ),
    );
  }, [rows, columns, filters]);

  const groups = useMemo(() => {
    if (!groupBy) return [{ key: '__all__', label: '', rows: filteredRows }];
    const map = new Map<string, { key: string; label: string; rows: T[] }>();
    filteredRows.forEach((row) => {
      const group = groupBy(row);
      if (!map.has(group.key)) map.set(group.key, { ...group, rows: [] });
      map.get(group.key)!.rows.push(row);
    });
    return Array.from(map.values());
  }, [filteredRows, groupBy]);

  const sumRow = (list: T[], column: GridColumn<T>) =>
    list.reduce((total, row) => total + (Number(column.sum?.(row)) || 0), 0);

  const renderSums = (list: T[], strong = false) => (
    <tr className={strong ? 'bg-muted/60' : 'bg-surface'}>
      {expandable && <td className={cellBase} />}
      {columns.map((column, index) => (
        <td
          key={column.key}
          className={`${cellBase} ${column.align === 'right' ? 'text-right tabular-nums' : ''} ${
            strong ? 'font-semibold' : ''
          }`}
        >
          {column.sum ? (
            <span className="inline-block min-w-full rounded border border-border bg-background px-1.5 py-0.5">
              {(column.formatSum ?? String)(sumRow(list, column))}
            </span>
          ) : index === 0 ? (
            <span className="text-muted-foreground">
              {list.length} registro{list.length === 1 ? '' : 's'}
            </span>
          ) : null}
        </td>
      ))}
    </tr>
  );

  return (
    <div className={`overflow-auto rounded border border-border bg-background ${maxHeightClass}`}>
      <table className="w-full border-collapse">
        <thead className="sticky top-0 z-10">
          <tr className="bg-muted">
            {expandable && <th className={`${cellBase} w-6`} />}
            {columns.map((column) => (
              <th
                key={column.key}
                title={column.headerTitle}
                className={`${cellBase} border-b font-medium text-muted-foreground ${
                  column.align === 'right' ? 'text-right' : 'text-left'
                }`}
              >
                {column.header}
              </th>
            ))}
          </tr>
          {hasFilters && (
            <tr className="bg-background">
              {expandable && (
                <th className={`${cellBase} border-b`}>
                  <Filter size={12} className="text-muted-foreground" />
                </th>
              )}
              {columns.map((column, index) => (
                <th key={column.key} className="border-b border-r border-border/60 p-0.5">
                  {column.filterText ? (
                    <div className="flex items-center gap-1">
                      {index === 0 && !expandable && <Filter size={12} className="ml-1 shrink-0 text-muted-foreground" />}
                      <input
                        value={filters[column.key] ?? ''}
                        onChange={(e) => setFilters((prev) => ({ ...prev, [column.key]: e.target.value }))}
                        className="w-full min-w-[3rem] bg-transparent px-1 py-0.5 text-xs font-normal outline-none focus:bg-accent/40"
                        placeholder="Filtrar"
                      />
                    </div>
                  ) : null}
                </th>
              ))}
            </tr>
          )}
        </thead>

        <tbody>
          {loading ? (
            <TableSkeleton columns={totalColumns} rows={6} />
          ) : filteredRows.length === 0 ? (
            <tr>
              <td colSpan={totalColumns} className="py-10 text-center text-sm text-muted-foreground">
                {emptyText}
              </td>
            </tr>
          ) : (
            groups.map((group) => {
              const collapsed = !!collapsedGroups[group.key];
              return (
                <Fragment key={group.key}>
                  {groupBy && (
                    <tr
                      className="cursor-pointer bg-muted/40 hover:bg-muted/70"
                      onClick={() => setCollapsedGroups((prev) => ({ ...prev, [group.key]: !prev[group.key] }))}
                    >
                      <td colSpan={totalColumns} className="px-2 py-1.5 text-xs font-semibold">
                        <span className="inline-flex items-center gap-1">
                          {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                          {group.label}
                        </span>
                      </td>
                    </tr>
                  )}

                  {!collapsed &&
                    group.rows.map((row) => {
                      const key = rowKey(row);
                      const selected = selectedKey !== null && selectedKey === key;
                      const expanded = !!expandedRows[String(key)];
                      return (
                        <Fragment key={key}>
                          <tr
                            onClick={() => {
                              onSelect?.(row);
                              if (expandable) {
                                setExpandedRows((prev) => ({ ...prev, [String(key)]: !prev[String(key)] }));
                              }
                            }}
                            className={`border-b border-border/50 ${
                              onSelect || expandable ? 'cursor-pointer' : ''
                            } ${selected ? 'bg-primary/15' : 'hover:bg-accent/40'} ${rowClassName?.(row) ?? ''}`}
                          >
                            {expandable && (
                              <td className={cellBase}>
                                {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </td>
                            )}
                            {columns.map((column) => (
                              <td
                                key={column.key}
                                className={`${cellBase} ${column.align === 'right' ? 'text-right tabular-nums' : ''} ${
                                  column.cellClassName?.(row) ?? ''
                                }`}
                              >
                                {column.cell(row)}
                              </td>
                            ))}
                          </tr>
                          {expandable && expanded && (
                            <tr className="bg-muted/20">
                              <td />
                              <td colSpan={columns.length} className="px-3 py-2">
                                {renderExpanded?.(row)}
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}

                  {groupBy && hasSums && !collapsed && renderSums(group.rows)}
                </Fragment>
              );
            })
          )}
        </tbody>

        {showTotals && hasSums && !loading && filteredRows.length > 0 && (
          <tfoot className="sticky bottom-0">{renderSums(filteredRows, true)}</tfoot>
        )}
      </table>
    </div>
  );
}
