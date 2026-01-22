import { z } from 'zod'
import { defineResource } from './_resource.schema'

// ============================================================================
// ENUMS
// ============================================================================

export const orderStatusEnum = z.enum(['pending', 'fulfilled', 'cancelled'])
export const transactionTypeEnum = z.enum(['retail', 'pre_owned', 'exchange'])
export const subOrderTypeEnum = z.enum(['fleet', 'bank', 'employee', 'total_loss', 'out_right', 'exchange'])
export const pldTypeEnum = z.enum(['archive', 'alert'])
export const pldStatusEnum = z.enum(['pending', 'sent', 'cancelled'])
export const customerTypeEnum = z.enum(['individual', 'business']) // adjust variants as needed
export const uploadStatusEnum = z.enum(['pending', 'uploaded', 'rejected']) // adjust as needed
export const documentOwnerTypeEnum = z.enum(['customer', 'vehicle', 'order']) // adjust as needed

// ============================================================================
// EMBEDDED SCHEMAS
// ============================================================================

export const customerDetailSchema = z.object({
  id: z.string().optional(),
  salt: z.string().optional(),
  rfc: z.string().optional(),
  type: customerTypeEnum.optional(),
  name: z.string().optional(),
  organization: z.string().optional(),
})

export const vehicleDetailSchema = z.object({
  id: z.string().optional(),
  salt: z.string().optional(),
  model: z.string().optional(),
  model_line: z.string().optional(),
  vin: z.string().optional(),
  organization: z.string().optional(),
  year: z.string().optional(),
  brand: z.string().optional(),
  color: z.string().optional(),
  interior_color: z.string().optional(),
  inventory_number: z.string().optional(),
})

export const mxNameSchema = z.object({
  first_name: z.string().optional(),
  middle_name: z.string().optional(),
  paternal_surname: z.string().optional(),
  maternal_surname: z.string().optional(),
})

export const representativeDetailSchema = z.object({
  id: z.string().optional(),
  salt: z.string().optional(),
  rfc: z.string().optional(),
  name: mxNameSchema.optional(),
  birth_date: z.string().optional(), // ISO date string
  organization: z.string().optional(),
})

export const controllingBeneficiaryDetailSchema = z.object({
  id: z.string().optional(),
  salt: z.string().optional(),
  rfc: z.string().optional(),
  name: mxNameSchema.optional(),
  birth_date: z.string().optional(),
  organization: z.string().optional(),
})

export const documentExtraObjectSchema = z.object({
  key: z.string().optional(),
  value: z.unknown().optional(),
})

export const documentDetailSchema = z.object({
  id: z.string().optional(),
  owner_type: z.array(documentOwnerTypeEnum).optional(),
  optional_owner_type: z.array(documentOwnerTypeEnum).optional(),
  name: z.string().optional(),
  requirers: z.array(z.string()).optional(),
  submitter: z.string().optional(),
  rank: z.number().int().optional(),
  upload_status: uploadStatusEnum.optional(),
  optional: z.boolean().optional(),
  sub_types: z.array(z.string()).optional(),
  allows_attachments: z.boolean().optional(),
  extra_objects: z.array(documentExtraObjectSchema).optional(),
})

// ============================================================================
// ORDER RESOURCE
// ============================================================================

export const orderResource = defineResource(
  {
    name: 'order',
    icon: 'FileText',
    description: 'Vehicle sales orders',
    dataSource: 'parquet',

    search: {
      searchableFields: ['reference', 'invoice_no', 'rfc'],
      resultLabelField: 'reference',
      resultDescriptionField: 'status',
    },

    table: {
      columns: ['reference', 'status', 'transaction_type', 'total', 'transaction_date'],
      defaultSort: { field: 'created_at', order: 'desc' },
      searchableFields: ['reference', 'invoice_no', 'rfc'],
      filterableFields: ['status', 'transaction_type', 'pld_status'],
    },

    form: {
      sections: [
        {
          title: 'Basic Info',
          fields: ['reference', 'priority', 'alert_type', 'status'],
        },
        {
          title: 'Transaction',
          fields: ['transaction_type', 'sub_order_type', 'transaction_date'],
        },
        {
          title: 'Financials',
          fields: ['subtotal', 'iva', 'isan', 'total'],
        },
        {
          title: 'Invoice',
          fields: ['invoice_no', 'invoice_uuid', 'rfc', 'invoice_date'],
        },
        {
          title: 'PLD',
          fields: ['pld_type', 'pld_status'],
        },
        {
          title: 'Payments',
          fields: ['payments_total', 'external_payments_total', 'internal_payments_total', 'last_payment_pending'],
        },
        {
          title: 'Dates',
          fields: ['settlement_date', 'external_settlement_date', 'internal_settlement_date', 'cancellation_date'],
        },
        {
          title: 'Vendor',
          fields: ['vendor_rfc', 'dealership', 'organization', 'seller_id'],
        },
      ],
    },

    analytics: {
      enabled: true,
      kpis: [
        { name: 'totalRevenue', sql: 'SUM(total)', label: 'Total Revenue', format: 'currency', icon: 'DollarSign' },
        { name: 'orderCount', sql: 'COUNT(*)', label: 'Total Orders', format: 'number', icon: 'ShoppingCart' },
        { name: 'avgOrder', sql: 'AVG(total)', label: 'Avg Order Value', format: 'currency', icon: 'TrendingUp' },
        { name: 'pendingCount', sql: "COUNT(*) FILTER (WHERE status = 'pending')", label: 'Pending', format: 'number', icon: 'Clock' },
      ],
      groupedCharts: [
        {
          title: 'Orders by Status',
          description: 'Distribution of order statuses',
          groupBy: 'status',
          metric: 'count',
          metricSql: 'COUNT(*)',
          type: 'pie',
        },
        {
          title: 'Revenue by Type',
          description: 'Revenue breakdown by transaction type',
          groupBy: 'transaction_type',
          metric: 'revenue',
          metricSql: 'SUM(total)',
          type: 'horizontal-bar',
        },
        {
          title: 'Top Dealerships',
          description: 'Top 5 dealerships by revenue',
          groupBy: 'dealership',
          metric: 'revenue',
          metricSql: 'SUM(total)',
          type: 'bar',
          limit: 5,
        },
      ],
      timeSeriesCharts: [
        {
          title: 'Orders Over Time',
          description: 'Monthly order volume',
          dateField: 'transaction_date',
          metric: 'orders',
          metricSql: 'COUNT(*)',
          granularity: 'month',
          type: 'line',
        },
      ],
    },
  },
  {
    // IDs
    salt: z.string().optional().meta({ hidden: true }),

    // Aviso info
    reference: z.string().optional().meta({
      label: 'Reference',
      description: 'Order reference (ID + salt)',
    }),
    priority: z.string().optional().meta({
      label: 'Priority',
    }),
    alert_type: z.string().optional().meta({
      label: 'Alert Type',
      description: 'Relevant for 24hr alerts',
    }),

    // Customer info (embedded)
    customer: customerDetailSchema.optional().meta({
      label: 'Customer',
      hidden: true, // Complex object - handle separately
    }),

    // Transaction details
    transaction_type: transactionTypeEnum.optional().meta({
      label: 'Transaction Type',
      inputType: 'select',
    }),
    transaction_date: z.string().optional().meta({
      label: 'Transaction Date',
      inputType: 'date',
    }),

    // Vehicle details (embedded)
    vehicle: vehicleDetailSchema.optional().meta({
      label: 'Vehicle',
      hidden: true, // Complex object - handle separately
    }),

    // Financials
    isan: z.number().optional().meta({
      label: 'ISAN',
      inputType: 'currency',
    }),
    iva: z.number().optional().meta({
      label: 'IVA',
      inputType: 'currency',
    }),
    subtotal: z.number().optional().meta({
      label: 'Subtotal',
      inputType: 'currency',
    }),
    total: z.number().optional().meta({
      label: 'Total',
      inputType: 'currency',
    }),

    // Vendor data
    vendor_rfc: z.string().optional().meta({
      label: 'Vendor RFC',
    }),
    dealership: z.string().optional().meta({
      label: 'Dealership',
    }),

    // Status
    status: orderStatusEnum.optional().meta({
      label: 'Status',
      inputType: 'select',
    }),

    // Metadata
    metadata: z.record(z.unknown()).optional().meta({
      hidden: true,
    }),

    // Organization - if you have an organizations resource, add relation
    organization: z.string().optional().meta({
      label: 'Organization',
      // Uncomment if you create an organization resource:
      // relation: { resource: 'organization', labelField: 'name' },
    }),

    // Documents (embedded array)
    documents: z.array(documentDetailSchema).optional().meta({
      hidden: true, // Complex array - handle separately
    }),

    // Invoice fields
    invoice_no: z.string().optional().meta({
      label: 'Invoice No.',
    }),
    invoice_uuid: z.string().optional().meta({
      label: 'Invoice UUID',
    }),
    rfc: z.string().optional().meta({
      label: 'RFC',
    }),
    invoice_date: z.string().optional().meta({
      label: 'Invoice Date',
      inputType: 'datetime',
    }),

    // PLD
    pld_type: pldTypeEnum.optional().meta({
      label: 'PLD Type',
      inputType: 'select',
    }),
    pld_status: pldStatusEnum.optional().meta({
      label: 'PLD Status',
      inputType: 'select',
    }),

    // Seller - if you have a sellers/users resource, add relation
    seller_id: z.string().optional().meta({
      label: 'Seller',
      // Uncomment if you create a seller resource:
      // relation: { resource: 'seller', labelField: 'name' },
    }),

    // Settlement dates
    settlement_date: z.string().optional().meta({
      label: 'Settlement Date',
      inputType: 'date',
    }),
    external_settlement_date: z.string().optional().meta({
      label: 'External Settlement Date',
      inputType: 'date',
    }),
    internal_settlement_date: z.string().optional().meta({
      label: 'Internal Settlement Date',
      inputType: 'date',
    }),
    cancellation_date: z.string().optional().meta({
      label: 'Cancellation Date',
      inputType: 'date',
    }),

    // Payment totals
    last_payment_pending: z.number().optional().meta({
      label: 'Last Payment Pending',
      inputType: 'currency',
    }),
    payments_total: z.number().optional().meta({
      label: 'Payments Total',
      inputType: 'currency',
    }),
    external_payments_total: z.number().optional().meta({
      label: 'External Payments Total',
      inputType: 'currency',
    }),
    internal_payments_total: z.number().optional().meta({
      label: 'Internal Payments Total',
      inputType: 'currency',
    }),

    // Representatives (embedded)
    representative: representativeDetailSchema.optional().meta({
      label: 'Representative',
      hidden: true,
    }),
    controlling_beneficiary: controllingBeneficiaryDetailSchema.optional().meta({
      label: 'Controlling Beneficiary',
      hidden: true,
    }),

    // Sub order type
    sub_order_type: subOrderTypeEnum.optional().meta({
      label: 'Sub Order Type',
      inputType: 'select',
    }),

    // Counts
    cash_count: z.number().optional().meta({
      label: 'Cash Count',
      inputType: 'number',
    }),
    unbanked_count: z.number().optional().meta({
      label: 'Unbanked Count',
      inputType: 'number',
    }),
  }
)

// Export types
export type Order = typeof orderResource.type
export type CustomerDetail = z.infer<typeof customerDetailSchema>
export type VehicleDetail = z.infer<typeof vehicleDetailSchema>
export type RepresentativeDetail = z.infer<typeof representativeDetailSchema>
export type DocumentDetail = z.infer<typeof documentDetailSchema>
export type OrderStatus = z.infer<typeof orderStatusEnum>
export type TransactionType = z.infer<typeof transactionTypeEnum>
export type PldType = z.infer<typeof pldTypeEnum>
export type PldStatus = z.infer<typeof pldStatusEnum>
export type SubOrderType = z.infer<typeof subOrderTypeEnum>

