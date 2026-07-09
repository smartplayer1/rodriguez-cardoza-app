"use client";

import { useState } from "react";

import ClientSelector, { type ClientSearchItem } from "./client-selector";

type ClientFilterFieldProps = {
  clients: ClientSearchItem[];
  defaultClientCode: string;
};

export default function ClientFilterField({
  clients,
  defaultClientCode,
}: ClientFilterFieldProps) {
  const [selectedClientCode, setSelectedClientCode] =
    useState(defaultClientCode);

  return (
    <div className="md:col-span-2 xl:col-span-1">
      <input type="hidden" name="clientCode" value={selectedClientCode} />
      <ClientSelector
        clients={clients}
        loading={false}
        error={null}
        selectedClientCode={selectedClientCode}
        onSelectClient={setSelectedClientCode}
      />
    </div>
  );
}
