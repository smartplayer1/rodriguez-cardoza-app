/**
 * Espejo del catálogo real de permisos que expone el backend en
 * GET /v1/identity/modules (consumido en /api/roles/modules).
 * Los valores deben coincidir EXACTAMENTE con `permissionName` tal cual
 * viene en ese endpoint, porque son los mismos strings que llegan en el
 * claim `PermissionClaim` del JWT y contra los que compara `useUserStore.can`.
 * No llevan el nombre del módulo como prefijo (ej. es "User.View", no
 * "Identity.User.View").
 */
export const PERMISSIONS = {
  // Módulo: Identity
  USER_VIEW: 'User.View',
  USER_CREATE: 'User.Create',
  USER_EDIT: 'User.Edit',
  USER_DELETE: 'User.Delete',

  ROLE_VIEW: 'Role.View',
  ROLE_CREATE: 'Role.Create',
  ROLE_EDIT: 'Role.Edit',
  ROLE_DELETE: 'Role.Delete',

  // Módulo: Bank
  BANK_VIEW: 'Bank.Bank.View',
  BANK_CREATE: 'Bank.Bank.Create',
  BANK_EDIT: 'Bank.Bank.Edit',
  BANK_DELETE: 'Bank.Bank.Delete',

  // Módulo: Company
  ACCOUNTING_CONCEPT_VIEW: 'Company.AccountingConcept.View',
  ACCOUNTING_CONCEPT_CREATE: 'Company.AccountingConcept.Create',
  ACCOUNTING_CONCEPT_EDIT: 'Company.AccountingConcept.Edit',
  ACCOUNTING_CONCEPT_DELETE: 'Company.AccountingConcept.Delete',

  BRANCH_VIEW: 'Company.Branch.View',
  BRANCH_CREATE: 'Company.Branch.Create',
  BRANCH_EDIT: 'Company.Branch.Edit',
  BRANCH_DELETE: 'Company.Branch.Delete',

  JOB_ROLE_VIEW: 'Company.JobRole.View',
  JOB_ROLE_CREATE: 'Company.JobRole.Create',
  JOB_ROLE_EDIT: 'Company.JobRole.Edit',
  JOB_ROLE_DELETE: 'Company.JobRole.Delete',

  ACCOUNT_BANK_VIEW: 'Company.AccountBank.View',
  ACCOUNT_BANK_CREATE: 'Company.AccountBank.Create',
  ACCOUNT_BANK_EDIT: 'Company.AccountBank.Edit',
  ACCOUNT_BANK_DELETE: 'Company.AccountBank.Delete',

  // Módulo: Employee
  EMPLOYEE_VIEW: 'Employee.Employee.View',
  EMPLOYEE_CREATE: 'Employee.Employee.Create',
  EMPLOYEE_EDIT: 'Employee.Employee.Edit',
  EMPLOYEE_DELETE: 'Employee.Employee.Delete',

  // Módulo: Client
  CLIENT_VIEW: 'Client.Client.View',
  CLIENT_CREATE: 'Client.Client.Create',
  CLIENT_EDIT: 'Client.Client.Edit',
  CLIENT_DELETE: 'Client.Client.Delete',

  // Módulo: Article
  ARTICLE_VIEW: 'Article.Article.View',
  ARTICLE_CREATE: 'Article.Article.Create',
  ARTICLE_EDIT: 'Article.Article.Edit',
  ARTICLE_DELETE: 'Article.Article.Delete',

  // Módulo: Invoice
  INVOICE_VIEW: 'Invoice.Invoice.View',
  INVOICE_CREATE: 'Invoice.Invoice.Create',
  INVOICE_EDIT: 'Invoice.Invoice.Edit',
  INVOICE_VOID: 'Invoice.Invoice.Void',
  INVOICE_IMPORT_HISTORICAL: 'Invoice.Invoice.ImportHistorical',

  // Módulo: Reward
  COUPON_VIEW: 'Reward.Coupon.View',
  COUPON_CREATE: 'Reward.Coupon.Create',
  COUPON_EDIT: 'Reward.Coupon.Edit',
  COUPON_DELETE: 'Reward.Coupon.Delete',

  INCENTIVE_RULE_VIEW: 'Reward.IncentiveRule.View',
  INCENTIVE_RULE_CREATE: 'Reward.IncentiveRule.Create',
  INCENTIVE_RULE_EDIT: 'Reward.IncentiveRule.Edit',
  INCENTIVE_RULE_DELETE: 'Reward.IncentiveRule.Delete',

  LEDGER_VIEW: 'Ledger.View',

  // Módulo: Billing
  CASH_REGISTER_VIEW: 'Billing.CashRegister.View',
  CASH_REGISTER_CREATE: 'Billing.CashRegister.Create',
  CASH_REGISTER_EDIT: 'Billing.CashRegister.Edit',
  CASH_REGISTER_DELETE: 'Billing.CashRegister.Delete',

  CASH_OUTFLOW_VIEW: 'Billing.CashOutflow.View',
  CASH_OUTFLOW_CREATE: 'Billing.CashOutflow.Create',
  CASH_OUTFLOW_VOID: 'Billing.CashOutflow.Void',

  COLLECTION_VIEW: 'Billing.Collection.View',
  COLLECTION_CREATE: 'Billing.Collection.Create',
  COLLECTION_VOID: 'Billing.Collection.Void',

  EXCHANGE_RATE_VIEW: 'Billing.ExchangeRate.View',
  EXCHANGE_RATE_CREATE: 'Billing.ExchangeRate.Create',

  CREDIT_NOTE_VIEW: 'Billing.CreditNote.View',
  CREDIT_NOTE_CREATE: 'Billing.CreditNote.Create',
  CREDIT_NOTE_EDIT: 'Billing.CreditNote.Edit',
  CREDIT_NOTE_ISSUE: 'Billing.CreditNote.Issue',
  CREDIT_NOTE_VOID: 'Billing.CreditNote.Void',

  CASH_MANAGEMENT_VIEW: 'Billing.CashManagement.View',
  CASH_MANAGEMENT_OPEN: 'Billing.CashManagement.Open',
  CASH_MANAGEMENT_CLOSE: 'Billing.CashManagement.Close',

  CURRENCY_CONVERSION_VIEW: 'Billing.CurrencyConversion.View',
  CURRENCY_CONVERSION_CREATE: 'Billing.CurrencyConversion.Create',
  CURRENCY_CONVERSION_VOID: 'Billing.CurrencyConversion.Void',

  // Módulo: Report (permiso único que cubre todos los reportes operativos)
  REPORT_VIEW: 'Report.Report.View',
} as const;
