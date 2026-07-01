import { NextRequest, NextResponse } from 'next/server';

import { CashManagementRecord } from '@/app/type/cash-management';

const SAMPLE_RECORDS: CashManagementRecord[] = [
  {
    id: 1,
    cashRegisterId: 1,
    cashRegisterCode: 'CJ-001',
    cashRegisterName: 'Caja Principal Managua',
    responsibleEmployeeId: 1,
    responsibleEmployeeName: 'María López',
    openedByUserId: 'usr-admin',
    openedByUserName: 'Administrador',
    openedAt: '2026-06-30T01:23:54.025Z',
    closedByUserId: null,
    closedByUserName: null,
    closedAt: null,
    exchangeRateNioPerUsd: 36.65,
    status: 'Abierta',
    openingObservation: 'Apertura sin novedades.',
    closingObservation: '',
    balance: {
      cashManagementId: 1,
      nio: 18500,
      usd: 420,
    },
    expectedNioAtClose: 19000,
    expectedUsdAtClose: 430,
    actualNioAtClose: 0,
    actualUsdAtClose: 0,
    differenceNioAtClose: 0,
    differenceUsdAtClose: 0,
    openingDenominations: [
      { currency: 'NIO', denomination: 1000, quantity: 5, total: 5000 },
      { currency: 'NIO', denomination: 500, quantity: 10, total: 5000 },
      { currency: 'USD', denomination: 20, quantity: 10, total: 200 },
    ],
    closingDenominations: [],
  },
  {
    id: 2,
    cashRegisterId: 2,
    cashRegisterCode: 'CJ-002',
    cashRegisterName: 'Caja Express Leon',
    responsibleEmployeeId: 2,
    responsibleEmployeeName: 'Carlos Pérez',
    openedByUserId: 'usr-supervisor',
    openedByUserName: 'Supervisor León',
    openedAt: '2026-06-29T13:00:00.000Z',
    closedByUserId: 'usr-supervisor',
    closedByUserName: 'Supervisor León',
    closedAt: '2026-06-29T23:45:00.000Z',
    exchangeRateNioPerUsd: 36.7,
    status: 'Cerrada',
    openingObservation: 'Apertura de turno vespertino.',
    closingObservation: 'Cierre con sobrante en córdobas.',
    balance: {
      cashManagementId: 2,
      nio: 12480,
      usd: 180,
    },
    expectedNioAtClose: 12600,
    expectedUsdAtClose: 180,
    actualNioAtClose: 12720,
    actualUsdAtClose: 180,
    differenceNioAtClose: 120,
    differenceUsdAtClose: 0,
    openingDenominations: [
      { currency: 'NIO', denomination: 500, quantity: 8, total: 4000 },
      { currency: 'NIO', denomination: 100, quantity: 20, total: 2000 },
      { currency: 'USD', denomination: 20, quantity: 5, total: 100 },
    ],
    closingDenominations: [
      { currency: 'NIO', denomination: 500, quantity: 9, total: 4500 },
      { currency: 'NIO', denomination: 100, quantity: 22, total: 2200 },
      { currency: 'USD', denomination: 20, quantity: 5, total: 100 },
    ],
  },
  {
    id: 3,
    cashRegisterId: 3,
    cashRegisterCode: 'CJ-003',
    cashRegisterName: 'Caja Sucursal Granada',
    responsibleEmployeeId: 3,
    responsibleEmployeeName: 'Ana Torres',
    openedByUserId: 'usr-manager',
    openedByUserName: 'Gerencia Granada',
    openedAt: '2026-06-28T12:30:00.000Z',
    closedByUserId: 'usr-manager',
    closedByUserName: 'Gerencia Granada',
    closedAt: '2026-06-28T22:15:00.000Z',
    exchangeRateNioPerUsd: 36.6,
    status: 'Cerrada',
    openingObservation: 'Caja abierta con fondo inicial completo.',
    closingObservation: 'Faltante en USD por ajuste pendiente.',
    balance: {
      cashManagementId: 3,
      nio: 9800,
      usd: 260,
    },
    expectedNioAtClose: 10000,
    expectedUsdAtClose: 280,
    actualNioAtClose: 10000,
    actualUsdAtClose: 275,
    differenceNioAtClose: 0,
    differenceUsdAtClose: -5,
    openingDenominations: [
      { currency: 'NIO', denomination: 200, quantity: 15, total: 3000 },
      { currency: 'NIO', denomination: 100, quantity: 25, total: 2500 },
      { currency: 'USD', denomination: 50, quantity: 4, total: 200 },
    ],
    closingDenominations: [
      { currency: 'NIO', denomination: 200, quantity: 16, total: 3200 },
      { currency: 'NIO', denomination: 100, quantity: 24, total: 2400 },
      { currency: 'USD', denomination: 50, quantity: 3, total: 150 },
    ],
  },
];

const toPositiveInt = (value: string | null, fallback: number) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = toPositiveInt(searchParams.get('page'), 1);
  const perPage = toPositiveInt(searchParams.get('perPage'), 10);

  const totalRecords = SAMPLE_RECORDS.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / perPage));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * perPage;
  const records = SAMPLE_RECORDS.slice(startIndex, startIndex + perPage);

  return NextResponse.json({
    records,
    paging: {
      perPage,
      currentPage,
      totalRecords,
      totalPages,
    },
  });
}