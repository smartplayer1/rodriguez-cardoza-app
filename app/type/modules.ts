export const moduleTranslations: Record<string, string> = {
  Identity: "Seguridad",
  Bank: "Bancos",
  Company: "Empresa",
  Employee: "Empleados",
  Client: "Clientes",
  Article: "Artículos",
  Invoice: "Facturación",
  Reward: "Recompensas",
  Billing: "Caja y Cobros",
};

export const resourceTranslations: Record<string, string> = {
  User: "Usuarios",
  Role: "Roles",
  Bank: "Bancos",
  AccountBank: "Cuentas Bancarias",
  JobRole: "Cargos",
  Branch: "Sucursales",
  AccountingConcept: "Conceptos Contables",
  Employee: "Empleados",
  Client: "Clientes",
  Article: "Artículos",
  Invoice: "Facturas",
  Coupon: "Cupones",
  IncentiveRule: "Reglas de Incentivos",
  CashManagement: "Gestión de Caja",
  CurrencyConversion: "Conversión de Monedas",
  CashOutflow: "Egresos de Caja",
  CashRegister: "Cajas",
  CreditNote: "Notas de Crédito",
  Collection: "Cobros",
};

export const actionTranslations: Record<string, string> = {
  Create: "Crear",
  Edit: "Editar",
  Delete: "Eliminar",
  View: "Consultar",
  Void: "Anular",
  Open: "Abrir",
  Close: "Cerrar",
  Issue: "Emitir",
  ImportHistorical: "Importar Históricos",
};

export function getPermissionLabel(permissionName: string) {
  const [resource, action] = permissionName.split(".");

  const resourceName = resourceTranslations[resource] ?? resource;
  const actionName = actionTranslations[action] ?? action;

  return `${actionName} ${resourceName}`;
}