import React, { ReactNode } from "react";

interface PremiosLayoutProps {
    children: ReactNode;
}

export default function PremiosLayout({ children }: PremiosLayoutProps) {
    return (
        <div>
            {children}
        </div>
    );
}