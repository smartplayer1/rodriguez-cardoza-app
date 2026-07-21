"use client"

import React from 'react';
import Link from 'next/link';
import {useUserStore} from '@/app/store/useUserStore';
import { usePathname } from 'next/navigation';
import { 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  Award, 
  Wallet, 
  CreditCard, 
  BarChart3, 
  UserCircle, 
  Package,
  Receipt,
  TrendingUp,
  FileText,
  ChevronDown,
  Ticket,
  Gift,
  GiftIcon,
  RefreshCcw,
  ArrowUpFromLine,
  UserX,
  Banknote,
  ClipboardCheck

} from 'lucide-react';
import { PERMISSIONS } from '@/app/domain/auth/permissions';

interface AppSidebarProps {
  expanded: boolean;
  onToggle: () => void;
}

type MenuItemType = {
  id: string;
  label: string;
  icon: React.ElementType;
  href?: string;
  permission: string | string[];
  options?: MenuItemType[] | null;
};

const menuItems: MenuItemType[] = [
  { id: 'configurations', label: 'Configuraciones', icon: Settings, href: '/configuraciones', permission: [PERMISSIONS.USER_VIEW, PERMISSIONS.ROLE_VIEW, PERMISSIONS.BANK_VIEW, PERMISSIONS.EXCHANGE_RATE_VIEW, PERMISSIONS.ACCOUNT_BANK_VIEW, PERMISSIONS.BRANCH_VIEW, PERMISSIONS.ACCOUNTING_CONCEPT_VIEW, PERMISSIONS.JOB_ROLE_VIEW], options:[
    { id: 'usuarios', label: 'Gestion de Usuarios', href: '/configuraciones/gestion-usuario', icon: UserCircle , permission: [PERMISSIONS.USER_VIEW, PERMISSIONS.ROLE_VIEW], options: [
      { id: 'usuarios', label: 'Usuarios', href: '/configuraciones/gestion-usuario/usuarios', icon: UserCircle, permission: PERMISSIONS.USER_VIEW },
      { id: 'roles', label: 'Roles', href: '/configuraciones/gestion-usuario/roles', icon: UserCircle , permission: PERMISSIONS.ROLE_VIEW},
    ]},
    { id: 'moneda', label: 'Configuración de Moneda', href: '/configuraciones/moneda', icon: Settings, permission: PERMISSIONS.EXCHANGE_RATE_VIEW },
    { id: 'bancos', label: 'Bancos', href: '/configuraciones/bancos', icon: Settings, permission: PERMISSIONS.BANK_VIEW },
    { id: 'empresa', label: 'Empresa', href: '/configuraciones/empresa', icon: Settings, permission: [PERMISSIONS.ACCOUNT_BANK_VIEW, PERMISSIONS.BRANCH_VIEW, PERMISSIONS.ACCOUNTING_CONCEPT_VIEW, PERMISSIONS.JOB_ROLE_VIEW], options: [
      { id: 'cuenta-de-banco', label: 'Cuenta de Banco', href: '/configuraciones/empresa/cuenta-de-banco', icon: Settings, permission: PERMISSIONS.ACCOUNT_BANK_VIEW },
      { id: 'sucursales', label: 'Sucursales', href: '/configuraciones/empresa/sucursales', icon: Settings, permission: PERMISSIONS.BRANCH_VIEW },
      { id: 'concepto-contable', label: 'Concepto Contable', href: '/configuraciones/empresa/concepto-contable', icon: Settings, permission: PERMISSIONS.ACCOUNTING_CONCEPT_VIEW },
      { id: 'cargos', label: 'Cargos', href: '/configuraciones/empresa/cargos', icon: Settings, permission: PERMISSIONS.JOB_ROLE_VIEW },
    ]},

  ] },
  { id: 'premios', label: 'Premios', icon: Award, href: '/premios', permission: [PERMISSIONS.COUPON_VIEW, PERMISSIONS.INCENTIVE_RULE_VIEW, PERMISSIONS.LEDGER_VIEW], options:[
  //  { id: 'seguimiento', label: 'Seguimiento', href: '/premios/seguimiento', icon: Award , permission: PERMISSIONS.LEDGER_VIEW },
    { id: 'cupones', label: 'Cupones', href: '/premios/cupones', icon: Ticket , permission: PERMISSIONS.COUPON_VIEW},
    { id: 'incentivos-retencion', label: 'Incentivos Retención', href: '/premios/incentivos-retencion', icon: GiftIcon, permission: PERMISSIONS.INCENTIVE_RULE_VIEW},
    { id: 'incentivos-retencion-nuevos-ingresos', label: 'Incentivos Retención Nuevos Ingresos', href: '/premios/incentivos-retencion-nuevos-ingresos', icon: Gift, permission: PERMISSIONS.INCENTIVE_RULE_VIEW}
  ] },
  { id: 'gestion-caja', label: 'Gestion de Caja', icon: Wallet, permission: [PERMISSIONS.CASH_MANAGEMENT_VIEW, PERMISSIONS.CURRENCY_CONVERSION_VIEW, PERMISSIONS.CASH_OUTFLOW_VIEW, PERMISSIONS.CASH_REGISTER_VIEW, PERMISSIONS.INVOICE_VIEW, PERMISSIONS.COLLECTION_VIEW, PERMISSIONS.CREDIT_NOTE_VIEW], options: [
    {id: 'gestiones', label: 'Gestiones', href: '/gestion-de-caja/gestiones', icon: Wallet , permission: PERMISSIONS.CASH_MANAGEMENT_VIEW},
    {id: 'conversiones', label: 'Conversiones', href: '/gestion-de-caja/conversiones', icon: RefreshCcw , permission: PERMISSIONS.CURRENCY_CONVERSION_VIEW},
    {id: 'salidas', label: 'Salidas', href: '/gestion-de-caja/salidas', icon: ArrowUpFromLine , permission: PERMISSIONS.CASH_OUTFLOW_VIEW},
    {id: 'cajas-registradoras', label: 'Cajas Registradoras', href: '/gestion-de-caja/cajas-registradoras', icon: CreditCard , permission: PERMISSIONS.CASH_REGISTER_VIEW},
    {id: 'facturacion', label: 'Facturación', href: '/gestion-de-caja/facturacion', icon: Receipt, permission: PERMISSIONS.INVOICE_VIEW},
    {id: 'ingreso-egreso', label: 'Ingresos y Egresos', href: '/gestion-de-caja/ingreso-egreso', icon: TrendingUp, permission: [PERMISSIONS.CASH_OUTFLOW_VIEW, PERMISSIONS.COLLECTION_VIEW]},
    {id: 'cobros', label: 'Cobros', href: '/gestion-de-caja/cobros', icon: CreditCard, permission: PERMISSIONS.COLLECTION_VIEW},
    {id:'notas-credito', label: 'Notas de Credito', href: '/gestion-de-caja/notas-credito', icon: FileText, permission: PERMISSIONS.CREDIT_NOTE_VIEW}
  ]},
  { id: 'credito', label: 'Credito', icon: CreditCard, href: '/credito', permission: PERMISSIONS.INVOICE_VIEW, options:null },
  { id: 'reportes', label: 'Reportes', icon: BarChart3, href: '/reportes', permission: PERMISSIONS.REPORT_VIEW, options: [
    { id: 'agentes-cerca-de-meta', label: 'Agentes Cerca de Meta', href: '/reportes/agentes-cerca-de-meta', icon: BarChart3, permission: PERMISSIONS.REPORT_VIEW },
    { id: 'clientes-sin-compras', label: 'Clientes Sin Compras', href: '/reportes/clientes-sin-compras', icon: UserX, permission: PERMISSIONS.REPORT_VIEW },
    { id: 'cuentas-por-cobrar', label: 'Cuentas por Cobrar', href: '/reportes/cuentas-por-cobrar', icon: Banknote, permission: PERMISSIONS.REPORT_VIEW },
    { id: 'reporte-gestion-de-caja', label: 'Gestión de Caja', href: '/reportes/gestion-de-caja', icon: Wallet, permission: PERMISSIONS.REPORT_VIEW },
    { id: 'reporte-arqueo-de-caja', label: 'Arqueo de Caja', href: '/reportes/arqueo-de-caja', icon: ClipboardCheck, permission: PERMISSIONS.REPORT_VIEW },
    { id: 'reporte-cobros', label: 'Cobros', href: '/reportes/cobros', icon: Receipt, permission: PERMISSIONS.REPORT_VIEW },
    { id: 'reporte-facturas', label: 'Facturas de Venta', href: '/reportes/facturas', icon: FileText, permission: PERMISSIONS.REPORT_VIEW },
  ] },
  {id: 'clientes', label: 'Clientes', icon: UserCircle, href: '/clientes', permission: PERMISSIONS.CLIENT_VIEW, options:null },
  { id: 'empleados', label: 'Empleados', icon: UserCircle, href: '/empleados', permission: PERMISSIONS.EMPLOYEE_VIEW, options:null },
  { id: 'articulos', label: 'Articulos', icon: Package, permission: PERMISSIONS.ARTICLE_VIEW, options: [
    {id: 'articulos', label: 'Lista de Articulos', href: '/articulos', icon: Package , permission: PERMISSIONS.ARTICLE_VIEW}
    /*{id: 'categorias', label: 'Categorias', href: '/articulos/categorias', icon: Package, permission: PERMISSIONS.ARTICLE_VIEW},
    {id: 'marcas', label: 'Marcas', href: '/articulos/marcas', icon: Package, permission: PERMISSIONS.ARTICLE_VIEW},
    {id: 'clasificaciones', label: 'Clasificaciones', href: '/articulos/clasificaciones', icon: Package, permission: PERMISSIONS.ARTICLE_VIEW}*/
  ]}
];


export default function AppSidebar({ expanded, onToggle }: AppSidebarProps) {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = React.useState<Record<string, boolean>>({});
  const { can } = useUserStore();
  const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
      setIsMounted(true);
    }, []);

    if (!isMounted) return null;



const filterMenu = (items: MenuItemType[]): MenuItemType[] => {
  return items
    .map(item => {
      // Filtrar hijos primero
      let filteredOptions: MenuItemType[] | undefined;

      if (item.options) {
        filteredOptions = filterMenu(item.options);
      }

      const hasPermission = canAccess(item.permission);
      const hasVisibleChildren = filteredOptions && filteredOptions.length > 0;

      // Si no tiene permiso NI hijos visibles → eliminar
      if (!hasPermission && !hasVisibleChildren) {
        return null;
      }

      return {
        ...item,
        options: filteredOptions
      };
    })
    .filter(Boolean) as MenuItemType[];
};

const canAccess = (permission: string | string[]) => {
  if (Array.isArray(permission)) {
    return permission.some(p => can(p));
  }
  return can(permission);
};
const filteredMenu = menuItems; //filterMenu(menuItems);

  const toggleMenu = (id: string) => {
    setOpenMenus(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const MenuItem = ({
  item,
  level = 0
}: {
  item: MenuItemType;
  level?: number;
}) => {
  const Icon = item.icon;
  const hasOptions = item.options && item.options.length > 0;
  const isOpen = openMenus[item.id];

  const isActive =
    item.href &&
    (pathname === item.href || pathname.startsWith(item.href + '/'));

const paddingLeft = expanded ? `${16 + level * 12}px` : '0px';

  return (
    <div>
      {/* ITEM */}
      {hasOptions ? (
        <button
          onClick={() => toggleMenu(item.id)}
          className={`
            w-full flex items-center gap-3 py-3 rounded mb-1
            transition-all duration-200
            text-primary-foreground hover:bg-white/10
            ${!expanded ? 'justify-center' : ''}
          `}
          style={{ paddingLeft }}
        >
          <Icon size={level === 0 ? 20 : 16} />

          {expanded && (
            <>
              <span className="text-sm flex-1 text-left">
                {item.label}
              </span>

              <ChevronDown
                size={16}
                className={`transition-transform ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </>
          )}
        </button>
      ) : (
        <Link
          href={item.href!}
          className={`
            w-full flex items-center gap-3 py-2 rounded mb-1 text-sm
            transition-all duration-200
            ${isActive
              ? 'bg-white text-primary elevation-2'
              : 'text-primary-foreground hover:bg-white/10'}
            ${!expanded ? 'justify-center' : ''}
          `}
          style={{ paddingLeft }}
        >
          <Icon size={16} />
          {expanded && <span>{item.label}</span>}
        </Link>
      )}

      {/* HIJOS (RECURSIVO) */}
      {hasOptions && isOpen && expanded && (
        <div>
          {item.options?.map((child: MenuItemType) => (
            <MenuItem
              key={child.id}
              item={child}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
  return (
    <aside
      className={`
        bg-primary text-primary-foreground elevation-3
        transition-all duration-300 ease-in-out
        ${expanded ? 'w-64' : 'w-20'}
        flex flex-col
      `}
    >
      <div className="p-4 border-b border-white/20 flex items-center justify-between">
        {expanded && (
          <span className="text-primary-foreground">Menu Principal</span>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded hover:bg-white/10 transition-colors ml-auto text-primary-foreground"
          aria-label={expanded ? 'Contraer menu' : 'Expandir menu'}
        >
          {expanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      <nav className="flex-1 p-2">
      {filteredMenu.map((item) => (
      <MenuItem key={item.id} item={item} />
    ))}
      </nav>

      <div className="p-4 border-t border-white/20">
        {expanded ? (
          <div className="text-xs text-primary-foreground/70 text-center">
            <p>Rodriguez Cardoza Nicaragua</p>
            <p>v1.0.0</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-2 h-2 rounded-full bg-white"></div>
          </div>
        )}
      </div>
    </aside>
  );
}
