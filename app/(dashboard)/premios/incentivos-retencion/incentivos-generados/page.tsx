"use client";

import IncentivosGeneradosView from "./incentivos-generados-view";

// Incentivos generados de las reglas de retención por monto comprado.
export default function IncentivosGeneradosPage() {
  return <IncentivosGeneradosView defaultRuleType="AmountPurchased" />;
}
