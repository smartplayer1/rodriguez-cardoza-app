import React, { useState } from 'react';
import { Menu, ChevronLeft, ChevronRight, Users, LogOut, Settings, User, ChevronDown, DollarSign, Building2, Wallet, Building, MapPin, FileText, Briefcase, UserCircle, Package, Award, Receipt, Tag, TrendingUp, CreditCard, BarChart3, Gift, Layers, Ticket } from 'lucide-react';
import { MaterialButton } from './MaterialButton';
import CurrencySettings from './CurrencySettings';
import RolesScreen from './RolesScreen';
import UserManagement from './UserManagement';
import Bancos from './Bancos';
import CuentasBanco from './CuentasBanco';
import Sucursal from './Sucursal';
import ConceptosContables from './ConceptosContables';
import Posiciones from './Posiciones';
import Empleados from './Empleados';
import Articulos from './Articulos';
import Marcas from './Marcas';
import Clasificaciones from './Clasificaciones';
import Premios from './Premios';
import GestionCaja from './GestionCaja';
import Facturacion from './Facturacion';
import CategoriasArticulo from './CategoriasArticulo';
import IngresosEgresos from './IngresosEgresos';
import Cobros from './Cobros';
import Credito from './Credito';
import NotasCredito from './NotasCredito';
import ReporteGestionCaja from './ReporteGestionCaja';

export default function MainMenu() {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [activeModule, setActiveModule] = useState('configurations');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSecondaryBar, setShowSecondaryBar] = useState(true);
  const [expandedSubmenu, setExpandedSubmenu] = useState<string | null>(null);
  const [activeSubmodule, setActiveSubmodule] = useState<string | null>(null);
  const [expandedMainMenu, setExpandedMainMenu] = useState<string | null>(null);

  // Mock user data
  const currentUser = {
    name: 'Juan Pérez',
    email: 'juan.perez@rodriguezcardoza.com',
    role: 'Administrador',
    avatar: 'JP'
  };

  const menuItems = [
    { id: 'configurations', label: 'Configuraciones', icon: Settings },
    { id: 'bonificacion', label: 'Premios', icon: Award },
    { id: 'gestion-caja', label: 'Gestión de Caja', icon: Wallet },
    { id: 'credito', label: 'Crédito', icon: CreditCard },
    { id: 'reportes', label: 'Reportes', icon: BarChart3 },
    { id: 'empleados', label: 'Empleados', icon: UserCircle },
    { id: 'articulos', label: 'Artículos', icon: Package }
  ];

  const configurationSubmodules = [
    {
      id: 'user-management',
      label: 'Gestión de Usuarios',
      icon: Users,
      children: [
        { id: 'users-sub', label: 'Usuarios', icon: User },
        { id: 'roles', label: 'Roles', icon: Settings }
      ]
    },
    {
      id: 'currency-settings',
      label: 'Configuración de Moneda',
      icon: DollarSign,
      children: []
    },
    {
      id: 'bancos',
      label: 'Bancos',
      icon: Building2,
      children: []
    },
    {
      id: 'empresa',
      label: 'Empresa',
      icon: Building,
      children: [
        { id: 'cuentas-banco', label: 'Cuentas de Banco', icon: Wallet },
        { id: 'sucursal', label: 'Sucursal', icon: MapPin },
        { id: 'conceptos-contables', label: 'Conceptos Contables', icon: FileText },
        { id: 'posiciones', label: 'Posiciones', icon: Briefcase }
      ]
    }
  ];

  const bonificacionSubmodules = [
    {
      id: 'bonificaciones',
      label: 'Seguimiento',
      icon: Award,
      children: []
    },
    {
      id: 'cupones',
      label: 'Cupones',
      icon: Ticket,
      children: []
    },
    {
      id: 'incentivos-retencion',
      label: 'Incentivo por Acumulación de Producto',
      icon: Gift,
      children: []
    },
    {
      id: 'incentivos-retencion-nuevos-ingresos',
      label: 'Incentivo Por Retención de Nuevo Ingreso',
      icon: Gift,
      children: []
    }
  ];

  const gestionCajaSubmodules = [
    {
      id: 'gestion-lista',
      label: 'Gestiones',
      icon: Wallet,
      children: []
    },
    {
      id: 'facturacion',
      label: 'Facturación',
      icon: Receipt,
      children: []
    },
    {
      id: 'ingresos-egresos',
      label: 'Ingresos y Egresos',
      icon: TrendingUp,
      children: []
    },
    {
      id: 'cobros',
      label: 'Cobros',
      icon: CreditCard,
      children: []
    },
    {
      id: 'notas-credito',
      label: 'Notas de Crédito',
      icon: FileText,
      children: []
    }
  ];

  const articulosSubmodules = [
    {
      id: 'articulos-lista',
      label: 'Artículos',
      icon: Package,
      children: []
    },
    {
      id: 'categorias-articulo',
      label: 'Categorías',
      icon: Tag,
      children: []
    },
    {
      id: 'marcas',
      label: 'Marcas',
      icon: Tag,
      children: []
    },
    {
      id: 'clasificaciones',
      label: 'Clasificaciones',
      icon: Layers,
      children: []
    }
  ];

  const handleModuleClick = (moduleId: string) => {
    if (moduleId === 'bonificacion') {
      // Toggle expansion for bonificacion in main menu
      setExpandedMainMenu(expandedMainMenu === 'bonificacion' ? null : 'bonificacion');
      setShowSecondaryBar(false);
      setActiveSubmodule(null);
    } else if (moduleId === 'gestion-caja') {
      // Toggle expansion for gestion-caja in main menu
      setExpandedMainMenu(expandedMainMenu === 'gestion-caja' ? null : 'gestion-caja');
      setShowSecondaryBar(false);
      setActiveSubmodule(null);
    } else if (moduleId === 'articulos') {
      // Toggle expansion for articulos in main menu
      setExpandedMainMenu(expandedMainMenu === 'articulos' ? null : 'articulos');
      setShowSecondaryBar(false);
      setActiveSubmodule(null);
    } else if (moduleId === 'configurations') {
      setActiveModule(moduleId);
      setShowSecondaryBar(true);
      setActiveSubmodule(null);
      setExpandedMainMenu(null);
    } else {
      setActiveModule(moduleId);
      setShowSecondaryBar(false);
      setActiveSubmodule(null);
      setExpandedSubmenu(null);
      setExpandedMainMenu(null);
    }
  };

  const handleBonificacionSubmoduleClick = (submoduleId: string) => {
    setActiveModule('bonificacion');
    setActiveSubmodule(submoduleId);
    setShowSecondaryBar(false);
  };

  const handleGestionCajaSubmoduleClick = (submoduleId: string) => {
    setActiveModule('gestion-caja');
    setActiveSubmodule(submoduleId);
    setShowSecondaryBar(false);
  };

  const handleArticulosSubmoduleClick = (submoduleId: string) => {
    setActiveModule('articulos');
    setActiveSubmodule(submoduleId);
    setShowSecondaryBar(false);
  };

  const toggleSubmenu = (submenuId: string) => {
    // Get current submodules based on active module
    const currentSubmodules = activeModule === 'bonificacion' ? bonificacionSubmodules : configurationSubmodules;
    
    // For items without children, directly set as active submodule
    const submenuItem = currentSubmodules.find(s => s.id === submenuId);
    if (submenuItem && submenuItem.children.length === 0) {
      setActiveSubmodule(submenuId);
      setExpandedSubmenu(null);
    } else {
      setExpandedSubmenu(expandedSubmenu === submenuId ? null : submenuId);
    }
  };

  const handleSubmoduleClick = (submoduleId: string) => {
    setActiveSubmodule(submoduleId);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header */}
      <header className="bg-primary text-primary-foreground elevation-3 sticky top-0 z-50">
        <div className="flex items-center justify-between h-16 px-6">
          {/* Left side - Brand and menu toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              className="p-2 rounded hover:bg-white/10 transition-colors"
              aria-label="Toggle menu"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl tracking-wide">RODRIGUEZ CARDOZA</h1>
          </div>

          {/* Right side - User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 px-3 py-2 rounded hover:bg-white/10 transition-colors"
            >
              <div className="hidden sm:block text-right">
                <div className="text-sm">{currentUser.name}</div>
                <div className="text-xs opacity-80">{currentUser.role}</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-sm">{currentUser.avatar}</span>
              </div>
            </button>

            {/* User dropdown menu */}
            {showUserMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-surface rounded elevation-4 overflow-hidden z-50">
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <span>{currentUser.avatar}</span>
                      </div>
                      <div>
                        <div className="text-foreground">{currentUser.name}</div>
                        <div className="text-sm text-muted-foreground">{currentUser.email}</div>
                      </div>
                    </div>
                  </div>
                  <div className="py-2">
                    <button className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-3 text-foreground">
                      <User size={18} />
                      <span>Mi Perfil</span>
                    </button>
                    <button className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-3 text-foreground">
                      <Settings size={18} />
                      <span>Configuración</span>
                    </button>
                  </div>
                  <div className="border-t border-border py-2">
                    <button className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-3 text-destructive">
                      <LogOut size={18} />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main content area with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`
            bg-primary text-primary-foreground elevation-3
            transition-all duration-300 ease-in-out
            ${sidebarExpanded ? 'w-64' : 'w-20'}
            flex flex-col
          `}
        >
          {/* Sidebar header */}
          <div className="p-4 border-b border-white/20 flex items-center justify-between">
            {sidebarExpanded && (
              <span className="text-primary-foreground">Menú Principal</span>
            )}
            <button
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              className="p-2 rounded hover:bg-white/10 transition-colors ml-auto text-primary-foreground"
              aria-label={sidebarExpanded ? 'Contraer menú' : 'Expandir menú'}
            >
              {sidebarExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>
          </div>

          {/* Menu items */}
          <nav className="flex-1 p-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;
              const isBonificacion = item.id === 'bonificacion';
              const isGestionCaja = item.id === 'gestion-caja';
              const isArticulos = item.id === 'articulos';
              const isExpandedBonificacion = expandedMainMenu === 'bonificacion';
              const isExpandedGestionCaja = expandedMainMenu === 'gestion-caja';
              const isExpandedArticulos = expandedMainMenu === 'articulos';

              return (
                <div key={item.id}>
                  <button
                    onClick={() => handleModuleClick(item.id)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded mb-1
                      transition-all duration-200
                      ${isActive 
                        ? 'bg-white text-primary elevation-2' 
                        : 'text-primary-foreground hover:bg-white/10'
                      }
                      ${!sidebarExpanded ? 'justify-center' : ''}
                    `}
                    title={!sidebarExpanded ? item.label : undefined}
                  >
                    <Icon size={20} />
                    {sidebarExpanded && (
                      <>
                        <span className="text-sm flex-1 text-left">{item.label}</span>
                        {(isBonificacion || isGestionCaja || isArticulos) && (
                          <ChevronDown 
                            size={16} 
                            className={`transition-transform ${isBonificacion ? isExpandedBonificacion : isExpandedGestionCaja ? isExpandedGestionCaja : isExpandedArticulos ? isExpandedArticulos : ''}`}
                          />
                        )}
                      </>
                    )}
                  </button>

                  {/* Bonificación Submenu in Main Sidebar */}
                  {isBonificacion && isExpandedBonificacion && sidebarExpanded && (
                    <div className="pl-4 mb-2">
                      {bonificacionSubmodules.map(subitem => {
                        const SubIcon = subitem.icon;
                        const isSubActive = activeSubmodule === subitem.id;

                        return (
                          <button
                            key={subitem.id}
                            onClick={() => handleBonificacionSubmoduleClick(subitem.id)}
                            className={`
                              w-full flex items-center gap-3 px-4 py-2 rounded mb-1
                              transition-all duration-200
                              ${isSubActive 
                                ? 'bg-white text-primary elevation-2' 
                                : 'text-primary-foreground hover:bg-white/10'
                              }
                            `}
                          >
                            <SubIcon size={18} />
                            <span className="text-xs">{subitem.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Gestión de Caja Submenu in Main Sidebar */}
                  {isGestionCaja && isExpandedGestionCaja && sidebarExpanded && (
                    <div className="pl-4 mb-2">
                      {gestionCajaSubmodules.map(subitem => {
                        const SubIcon = subitem.icon;
                        const isSubActive = activeSubmodule === subitem.id;

                        return (
                          <button
                            key={subitem.id}
                            onClick={() => handleGestionCajaSubmoduleClick(subitem.id)}
                            className={`
                              w-full flex items-center gap-3 px-4 py-2 rounded mb-1
                              transition-all duration-200
                              ${isSubActive 
                                ? 'bg-white text-primary elevation-2' 
                                : 'text-primary-foreground hover:bg-white/10'
                              }
                            `}
                          >
                            <SubIcon size={18} />
                            <span className="text-xs">{subitem.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Artículos Submenu in Main Sidebar */}
                  {isArticulos && isExpandedArticulos && sidebarExpanded && (
                    <div className="pl-4 mb-2">
                      {articulosSubmodules.map(subitem => {
                        const SubIcon = subitem.icon;
                        const isSubActive = activeSubmodule === subitem.id;

                        return (
                          <button
                            key={subitem.id}
                            onClick={() => handleArticulosSubmoduleClick(subitem.id)}
                            className={`
                              w-full flex items-center gap-3 px-4 py-2 rounded mb-1
                              transition-all duration-200
                              ${isSubActive 
                                ? 'bg-white text-primary elevation-2' 
                                : 'text-primary-foreground hover:bg-white/10'
                              }
                            `}
                          >
                            <SubIcon size={18} />
                            <span className="text-xs">{subitem.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Sidebar footer */}
          <div className="p-4 border-t border-white/20">
            {sidebarExpanded ? (
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

        {/* Secondary sidebar for configurations */}
        {showSecondaryBar && (
          <aside
            className={`
              bg-primary text-primary-foreground 
              transition-all duration-300 ease-in-out
              ${sidebarExpanded ? 'w-64' : 'w-20'}
              flex flex-col
              shadow-inner
              brightness-95
              border-r border-black/10
            `}
            style={{
              boxShadow: 'inset 4px 0 8px rgba(0, 0, 0, 0.15)'
            }}
          >
            {/* Sidebar header */}
            <div className="p-4 border-b border-white/20 flex items-center justify-between">
              {sidebarExpanded && (
                <span className="text-primary-foreground">
                  {activeModule === 'bonificacion' ? 'Premios' : 'Configuraciones'}
                </span>
              )}
              <button
                onClick={() => setShowSecondaryBar(false)}
                className="p-2 rounded hover:bg-white/10 transition-colors ml-auto text-primary-foreground"
                aria-label={sidebarExpanded ? 'Contraer menú' : 'Expandir menú'}
              >
                {sidebarExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
              </button>
            </div>

            {/* Menu items */}
            <nav className="flex-1 p-2">
              {activeModule === 'configurations' && configurationSubmodules.map((item) => {
                const Icon = item.icon;
                const isDirectlyActive = activeSubmodule === item.id;
                const isActive = isDirectlyActive || (activeSubmodule && item.children.some(child => child.id === activeSubmodule));

                return (
                  <div key={item.id}>
                    <button
                      onClick={() => toggleSubmenu(item.id)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded mb-1
                        transition-all duration-200
                        ${isActive 
                          ? 'bg-white text-primary elevation-2' 
                          : 'text-primary-foreground hover:bg-white/10'}
                        ${!sidebarExpanded ? 'justify-center' : ''}
                      `}
                      title={!sidebarExpanded ? item.label : undefined}
                    >
                      <Icon size={20} />
                      {sidebarExpanded && (
                        <span className="text-sm">{item.label}</span>
                      )}
                    </button>

                    {/* Submenu */}
                    {expandedSubmenu === item.id && (
                      <div className="pl-4">
                        {item.children.map(child => {
                          const ChildIcon = child.icon;
                          const isChildActive = activeSubmodule === child.id;

                          return (
                            <button
                              key={child.id}
                              onClick={() => handleSubmoduleClick(child.id)}
                              className={`
                                w-full flex items-center gap-3 px-4 py-3 rounded mb-1
                                transition-all duration-200
                                ${isChildActive 
                                  ? 'bg-white text-primary elevation-2' 
                                  : 'text-primary-foreground hover:bg-white/10'}
                                ${!sidebarExpanded ? 'justify-center' : ''}
                              `}
                              title={!sidebarExpanded ? child.label : undefined}
                            >
                              <ChildIcon size={20} />
                              {sidebarExpanded && (
                                <span className="text-sm">{child.label}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Bonificación submodules */}
              {activeModule === 'bonificacion' && bonificacionSubmodules.map((item) => {
                const Icon = item.icon;
                const isDirectlyActive = activeSubmodule === item.id;
                const isActive = isDirectlyActive || (activeSubmodule && item.children.some(child => child.id === activeSubmodule));

                return (
                  <div key={item.id}>
                    <button
                      onClick={() => toggleSubmenu(item.id)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded mb-1
                        transition-all duration-200
                        ${isActive 
                          ? 'bg-white text-primary elevation-2' 
                          : 'text-primary-foreground hover:bg-white/10'}
                        ${!sidebarExpanded ? 'justify-center' : ''}
                      `}
                      title={!sidebarExpanded ? item.label : undefined}
                    >
                      <Icon size={20} />
                      {sidebarExpanded && (
                        <span className="text-sm">{item.label}</span>
                      )}
                    </button>

                    {/* Submenu */}
                    {expandedSubmenu === item.id && (
                      <div className="pl-4">
                        {item.children.map(child => {
                          const ChildIcon = child.icon;
                          const isChildActive = activeSubmodule === child.id;

                          return (
                            <button
                              key={child.id}
                              onClick={() => handleBonificacionSubmoduleClick(child.id)}
                              className={`
                                w-full flex items-center gap-3 px-4 py-3 rounded mb-1
                                transition-all duration-200
                                ${isChildActive 
                                  ? 'bg-white text-primary elevation-2' 
                                  : 'text-primary-foreground hover:bg-white/10'}
                                ${!sidebarExpanded ? 'justify-center' : ''}
                              `}
                              title={!sidebarExpanded ? child.label : undefined}
                            >
                              <ChildIcon size={20} />
                              {sidebarExpanded && (
                                <span className="text-sm">{child.label}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Gestión de Caja submodules */}
              {activeModule === 'gestion-caja' && gestionCajaSubmodules.map((item) => {
                const Icon = item.icon;
                const isDirectlyActive = activeSubmodule === item.id;
                const isActive = isDirectlyActive || (activeSubmodule && item.children.some(child => child.id === activeSubmodule));

                return (
                  <div key={item.id}>
                    <button
                      onClick={() => toggleSubmenu(item.id)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded mb-1
                        transition-all duration-200
                        ${isActive 
                          ? 'bg-white text-primary elevation-2' 
                          : 'text-primary-foreground hover:bg-white/10'}
                        ${!sidebarExpanded ? 'justify-center' : ''}
                      `}
                      title={!sidebarExpanded ? item.label : undefined}
                    >
                      <Icon size={20} />
                      {sidebarExpanded && (
                        <span className="text-sm">{item.label}</span>
                      )}
                    </button>

                    {/* Submenu */}
                    {expandedSubmenu === item.id && (
                      <div className="pl-4">
                        {item.children.map(child => {
                          const ChildIcon = child.icon;
                          const isChildActive = activeSubmodule === child.id;

                          return (
                            <button
                              key={child.id}
                              onClick={() => handleGestionCajaSubmoduleClick(child.id)}
                              className={`
                                w-full flex items-center gap-3 px-4 py-3 rounded mb-1
                                transition-all duration-200
                                ${isChildActive 
                                  ? 'bg-white text-primary elevation-2' 
                                  : 'text-primary-foreground hover:bg-white/10'}
                                ${!sidebarExpanded ? 'justify-center' : ''}
                              `}
                              title={!sidebarExpanded ? child.label : undefined}
                            >
                              <ChildIcon size={20} />
                              {sidebarExpanded && (
                                <span className="text-sm">{child.label}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Artículos submodules */}
              {activeModule === 'articulos' && articulosSubmodules.map((item) => {
                const Icon = item.icon;
                const isDirectlyActive = activeSubmodule === item.id;
                const isActive = isDirectlyActive || (activeSubmodule && item.children.some(child => child.id === activeSubmodule));

                return (
                  <div key={item.id}>
                    <button
                      onClick={() => toggleSubmenu(item.id)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded mb-1
                        transition-all duration-200
                        ${isActive 
                          ? 'bg-white text-primary elevation-2' 
                          : 'text-primary-foreground hover:bg-white/10'}
                        ${!sidebarExpanded ? 'justify-center' : ''}
                      `}
                      title={!sidebarExpanded ? item.label : undefined}
                    >
                      <Icon size={20} />
                      {sidebarExpanded && (
                        <span className="text-sm">{item.label}</span>
                      )}
                    </button>

                    {/* Submenu */}
                    {expandedSubmenu === item.id && (
                      <div className="pl-4">
                        {item.children.map(child => {
                          const ChildIcon = child.icon;
                          const isChildActive = activeSubmodule === child.id;

                          return (
                            <button
                              key={child.id}
                              onClick={() => handleArticulosSubmoduleClick(child.id)}
                              className={`
                                w-full flex items-center gap-3 px-4 py-3 rounded mb-1
                                transition-all duration-200
                                ${isChildActive 
                                  ? 'bg-white text-primary elevation-2' 
                                  : 'text-primary-foreground hover:bg-white/10'}
                                ${!sidebarExpanded ? 'justify-center' : ''}
                              `}
                              title={!sidebarExpanded ? child.label : undefined}
                            >
                              <ChildIcon size={20} />
                              {sidebarExpanded && (
                                <span className="text-sm">{child.label}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Sidebar footer */}
            <div className="p-4 border-t border-white/20">
              {sidebarExpanded ? (
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
        )}

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {/* Render appropriate screen based on active module or submodule */}
          {activeModule === 'empleados' && <Empleados />}
          {activeModule === 'credito' && <Credito />}
          {activeModule === 'reportes' && <ReporteGestionCaja />}
          {activeModule === 'articulos' && activeSubmodule === 'categorias-articulo' && <CategoriasArticulo />}
          {activeModule === 'articulos' && activeSubmodule === 'marcas' && <Marcas />}
          {activeModule === 'articulos' && activeSubmodule === 'clasificaciones' && <Clasificaciones />}
          {activeModule === 'articulos' && !['categorias-articulo', 'marcas', 'clasificaciones'].includes(activeSubmodule || '') && <Articulos />}
          {activeModule === 'bonificacion' && <Premios activeSubmodule={activeSubmodule} />}
          {activeModule === 'gestion-caja' && activeSubmodule === 'facturacion' && <Facturacion />}
          {activeModule === 'gestion-caja' && activeSubmodule === 'ingresos-egresos' && <IngresosEgresos />}
          {activeModule === 'gestion-caja' && activeSubmodule === 'cobros' && <Cobros />}
          {activeModule === 'gestion-caja' && activeSubmodule === 'notas-credito' && <NotasCredito />}
          {activeModule === 'gestion-caja' && !['facturacion', 'ingresos-egresos', 'cobros', 'notas-credito'].includes(activeSubmodule || '') && <GestionCaja activeSubmodule={activeSubmodule} />}
          {activeSubmodule === 'currency-settings' && <CurrencySettings />}
          {activeSubmodule === 'roles' && <RolesScreen />}
          {activeSubmodule === 'users-sub' && <UserManagement />}
          {activeSubmodule === 'bancos' && <Bancos />}
          {activeSubmodule === 'cuentas-banco' && <CuentasBanco />}
          {activeSubmodule === 'sucursal' && <Sucursal />}
          {activeSubmodule === 'conceptos-contables' && <ConceptosContables />}
          {activeSubmodule === 'posiciones' && <Posiciones />}
          {activeModule === 'configurations' && !activeSubmodule && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-foreground mb-2">Configuraciones</h2>
                <p className="text-muted-foreground">
                  Seleccione una opción del menú lateral para comenzar
                </p>
              </div>

              <div className="bg-surface rounded elevation-2 p-6 text-center py-12">
                <Settings size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Utilice el menú de configuraciones para acceder a las diferentes opciones
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}