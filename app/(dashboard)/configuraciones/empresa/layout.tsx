import React, { ReactNode } from "react";

interface EmpresasLayoutProps {
    children: ReactNode;
}

export default function EmpresasLayout({ children }: EmpresasLayoutProps) {
    return (
        <div>
            {children}
        </div>
    );
}