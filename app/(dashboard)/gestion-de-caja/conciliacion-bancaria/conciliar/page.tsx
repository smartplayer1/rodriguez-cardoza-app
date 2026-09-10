import ConciliarClient from './ConciliarClient';
import { BankTransferImportStatus } from '@/app/type/bank-transfer';

type SearchParams = {
  status?: string | string[];
};

const VALID_STATUSES: BankTransferImportStatus[] = ['Pending', 'Reconciled', 'NoMatch', 'Ambiguous'];

export default async function ConciliarPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const rawStatus = Array.isArray(resolvedSearchParams.status)
    ? resolvedSearchParams.status[0]
    : resolvedSearchParams.status;
  const initialStatus = VALID_STATUSES.includes(rawStatus as BankTransferImportStatus)
    ? (rawStatus as BankTransferImportStatus)
    : 'Pending';

  return <ConciliarClient initialStatus={initialStatus} />;
}
