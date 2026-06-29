"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gift, Award } from "lucide-react";
import { ReactNode } from "react";

type IncentivosRetencionLayoutProps = {
  children: ReactNode;
};

export default function IncentivosRetencionLayout({
  children,
}: IncentivosRetencionLayoutProps) {
  const pathname = usePathname();

  const isCreatedTabActive =
    pathname === "/premios/incentivos-retencion" ||
    pathname === "/premios/incentivos-retencion/";
  const isGeneratedTabActive = pathname.includes("/incentivos-generados");

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Gift size={32} className="text-primary" />
            <h2 className="text-foreground">Incentivos de Retencion</h2>
          </div>
          <p className="text-muted-foreground">
            Administre reglas de incentivos y consulte su progreso generado
          </p>
        </div>

        <div className="bg-surface rounded elevation-2 mb-6">
          <div className="flex border-b border-border">
            <Link
              href="/premios/incentivos-retencion"
              className={`flex items-center gap-2 px-6 py-4 transition-colors relative ${
                isCreatedTabActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Gift size={20} />
              <span>Incentivos Creados</span>
              {isCreatedTabActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </Link>
            <Link
              href="/premios/incentivos-retencion/incentivos-generados"
              className={`flex items-center gap-2 px-6 py-4 transition-colors relative ${
                isGeneratedTabActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Award size={20} />
              <span>Incentivos Generados</span>
              {isGeneratedTabActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </Link>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
