import { useQuery } from "@tanstack/react-query";
import { Invoice, InvoiceItem } from "@shared/schema";

export function useInvoices(patientId: string) {
  const { data: invoices, isLoading, error } = useQuery<Invoice[]>({
    queryKey: [`/api/patients/${patientId}/invoices`],
  });

  // Get items for each invoice
  const { data: invoiceItems, isLoading: isItemsLoading } = useQuery<InvoiceItem[]>({
    queryKey: ['/api/invoice-items'],
    enabled: !!invoices && invoices.length > 0,
  });

  // Combine invoices with their items
  const invoicesWithItems = invoices?.map(invoice => {
    const items = invoiceItems?.filter(item => item.invoiceId === invoice.id) || [];
    return {
      ...invoice,
      items
    };
  });

  return {
    invoices: invoicesWithItems || [],
    isLoading: isLoading || isItemsLoading,
    error
  };
}

export function useInvoice(invoiceId: number) {
  const { data: invoice, isLoading: isInvoiceLoading, error } = useQuery<Invoice>({
    queryKey: [`/api/invoices/${invoiceId}`],
    enabled: !!invoiceId,
  });

  const { data: items, isLoading: isItemsLoading } = useQuery<InvoiceItem[]>({
    queryKey: [`/api/invoices/${invoiceId}/items`],
    enabled: !!invoiceId,
  });

  return {
    invoice: invoice ? {
      ...invoice,
      items: items || []
    } : undefined,
    isLoading: isInvoiceLoading || isItemsLoading,
    error
  };
}