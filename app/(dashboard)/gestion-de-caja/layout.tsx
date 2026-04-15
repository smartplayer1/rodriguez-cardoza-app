import React, { ReactNode } from "react";

interface GestionCajaLayoutProps {
    children: ReactNode;
}

export default function GestionCajaLayout({ children }: GestionCajaLayoutProps) {
    return (
        <div>
            {children}
        </div>
    );
}