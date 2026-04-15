import React, { ReactNode } from "react";

interface ConfiguracionesLayout {
    children: ReactNode;
}

export default function ConfiguracionesLayout({ children }: ConfiguracionesLayout) {
    return (
        <div>
            {children}
        </div>
    );
}