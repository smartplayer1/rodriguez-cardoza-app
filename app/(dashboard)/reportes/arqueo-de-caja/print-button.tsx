"use client";

import { FileText } from "lucide-react";
import { MaterialButton } from "@/components/MaterialButton";
import type { ArqueoCajaData } from "./arqueo-caja-data";
import { exportArqueoCajaConsolidadoToPdf } from "./arqueo-caja-export";

export default function PrintButton({ data }: { data: ArqueoCajaData }) {
  return (
    <MaterialButton
      variant="outlined"
      color="primary"
      startIcon={<FileText size={18} />}
      onClick={() => exportArqueoCajaConsolidadoToPdf(data)}
    >
      Exportar PDF
    </MaterialButton>
  );
}
