import { useEffect, useRef, useState } from 'react'
import type { DragEvent as ReactDragEvent } from 'react'
import type { ReactNode } from 'react'
import {
  AuditOutlined,
  AppstoreOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  ArrowRightOutlined,
  BankOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  MessageOutlined as CommentOutlined,
  CreditCardOutlined,
  DeleteOutlined,
  DownOutlined,
  DollarOutlined,
  EyeOutlined,
  FlagOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  GlobalOutlined,
  HolderOutlined,
  IdcardOutlined,
  FileSearchOutlined as InfoCircleOutlined,
  ProjectOutlined,
  ProfileOutlined,
  PlusOutlined,
  SaveOutlined,
  SearchOutlined,
  SettingOutlined,
  SwapOutlined,
  TableOutlined,
  WalletOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  Avatar,
  AutoComplete,
  Badge,
  Button,
  Card,
  Checkbox,
  DatePicker,
  Descriptions,
  Divider,
  Dropdown,
  Drawer,
  Empty,
  Flex,
  Form,
  Grid,
  Input,
  InputNumber,
  Pagination,
  Row,
  Col,
  Select,
  Segmented,
  Space,
  Tag,
  Table,
  Tooltip,
  Typography,
  Upload,
  Switch,
  Alert,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { UploadProps } from 'antd'
import type { FormInstance } from 'antd'

const { Text, Title } = Typography

export type BankWorkspace = 'inbound' | 'outbound' | 'internal' | 'loans' | 'deposit' | 'conversion'
type InboundType = 'counterparty' | 'supplierRefund' | 'counterpartyAdvance' | 'accountableReturn' | 'loanReceipt' | 'depositReceipt' | 'other'
type FixedColumnPosition = 'left' | 'right'

interface PaymentFormValues {
  sequenceNumber?: string
  date?: string
  paymentType?: string
  payer?: string
  cashFlowItem?: string
  bankReference?: string
  payerTin?: string
  employee?: string
  recipientBank?: string
  recipientAccount?: string
  currency?: string
  rate?: number
  vatRate?: number
  vatAmount?: number
  amountInCurrency?: number
  amount?: number
  contract?: string
  annex?: string
  acceptanceDocument?: string
  debitNote?: string
  creditNote?: string
  invoice?: string
  creditAccount?: string
  principalAmountInCurrency?: number
  principalAmount?: number
  interestAmountInCurrency?: number
  interestAmount?: number
  purpose?: string
  note?: string
  distributionRows?: DistributionRowForm[]
}

interface DistributionRowForm {
  contract?: string
  annex?: string
  invoice?: string
  date?: string
  debt?: number
  payment?: number
  selected?: boolean
}

interface InboundRecord {
  id: number
  type: InboundType
  date: string
  payer: string
  amount: number
  currency: string
  documentNumber: string
  status: 'draft' | 'posted'
  createdAt: string
  createdBy: string
  approvalStatus: 'approved' | 'pending'
  approvedAt: string
  costCenter: string
  project: string
  debitAccount: string
  reconciliationStatus: 'reconciled' | 'unreconciled'
  values: PaymentFormValues
}

interface FormField {
  name: keyof PaymentFormValues
  label: string
  required?: boolean
  kind?: 'date' | 'amount' | 'select' | 'textarea'
}

interface PaymentTemplate {
  title: string
  description: string
  fields: FormField[]
}

const paymentTypeOptions = [
  { value: 'bank-transfer', label: 'Bank köçürməsi' },
  { value: 'cash', label: 'Nağd ödəniş' },
  { value: 'card', label: 'Kartla ödəniş' },
]

const refundTypeOptions = [
  { value: 'advance-return', label: 'Avansın geri qaytarılması' },
  { value: 'goods-service-return', label: 'Malın/xidmətin geri qaytarılması üzrə ödəniş' },
]

const otherReceiptTypeOptions = [
  { value: 'bank-interest', label: 'Bank faiz gəlirləri' },
  { value: 'dividend', label: 'Dividend gəlirləri' },
  { value: 'insurance', label: 'Sığorta ödənişi' },
  { value: 'compensation', label: 'Cərimə və kompensasiyalar' },
  { value: 'founder-funds', label: 'Təsisçi vəsaitinin daxil olması' },
  { value: 'other-receipt', label: 'Digər' },
]

const otherCashFlowOptions = [
  { value: 'interest-income', label: 'Faiz gəlirləri' },
  { value: 'dividend-income', label: 'Dividend gəlirləri' },
  { value: 'insurance-receipt', label: 'Sığorta ödənişləri' },
  { value: 'compensation-income', label: 'Cərimə və kompensasiyalar' },
  { value: 'founder-receipt', label: 'Təsisçi vəsaitləri' },
  { value: 'other-income', label: 'Digər daxilolmalar' },
]

const vatFields: FormField[] = [
  { name: 'vatRate', label: 'ƏDV dərəcəsi', kind: 'amount' },
  { name: 'vatAmount', label: 'ƏDV məbləği', kind: 'amount' },
]

const templates: Record<InboundType, PaymentTemplate> = {
  counterparty: {
    title: 'Kontragentdən ödəniş',
    description: 'Müştəri və ya digər kontragentdən daxil olan ödəniş.',
    fields: [
      { name: 'sequenceNumber', label: 'Ardıcıllıq nömrəsi' }, { name: 'date', label: 'Tarix', kind: 'date', required: true },
      { name: 'paymentType', label: 'Ödəniş növü', kind: 'select', required: true }, { name: 'payer', label: 'Ödəyici', required: true },
      { name: 'payerTin', label: 'Ödəyicinin VÖEN-i' }, { name: 'recipientBank', label: 'Alıcının bankı', required: true },
      { name: 'recipientAccount', label: 'Alıcının hesabı', required: true }, { name: 'currency', label: 'Valyuta', kind: 'select', required: true },
      { name: 'rate', label: 'Məzənnə', kind: 'amount' }, { name: 'amountInCurrency', label: 'Valyutada məbləğ', kind: 'amount', required: true },
      { name: 'amount', label: 'Məbləğ', kind: 'amount', required: true }, { name: 'contract', label: 'Müqavilə' },
      { name: 'annex', label: 'Müqaviləyə əlavə' }, { name: 'acceptanceDocument', label: 'Qəbul sənədi' },
      { name: 'invoice', label: 'Hesab-faktura' }, { name: 'purpose', label: 'Ödənişin təyinatı', required: true }, { name: 'note', label: 'Qeyd', kind: 'textarea' },
    ],
  },
  supplierRefund: {
    title: 'Təchizatçıdan geri ödəniş',
    description: 'Təchizatçıdan geri ödənilən məbləğ.',
    fields: [
      { name: 'sequenceNumber', label: 'Ardıcıllıq nömrəsi' }, { name: 'date', label: 'Tarix', kind: 'date', required: true }, { name: 'paymentType', label: 'Ödəniş növü', kind: 'select', required: true }, { name: 'payer', label: 'Ödəyici', required: true }, { name: 'payerTin', label: 'Ödəyicinin VÖEN-i' }, { name: 'recipientBank', label: 'Alıcının bankı', required: true }, { name: 'recipientAccount', label: 'Alıcının hesabı', required: true }, { name: 'currency', label: 'Valyuta', kind: 'select', required: true }, { name: 'rate', label: 'Məzənnə', kind: 'amount' }, { name: 'amountInCurrency', label: 'Valyutada məbləğ', kind: 'amount', required: true }, { name: 'amount', label: 'Məbləğ', kind: 'amount', required: true }, { name: 'contract', label: 'Müqavilə' }, { name: 'annex', label: 'Müqaviləyə əlavə' }, { name: 'acceptanceDocument', label: 'Qəbul sənədi' }, { name: 'debitNote', label: 'Debet notu' }, { name: 'creditNote', label: 'Kredit notu' }, { name: 'invoice', label: 'Hesab-faktura' }, { name: 'purpose', label: 'Ödənişin təyinatı', required: true }, { name: 'note', label: 'Qeyd', kind: 'textarea' },
    ],
  },
  counterpartyAdvance: {
    title: 'Kontragentdən avans',
    description: 'Kontragentdən əvvəlcədən alınan ödəniş.',
    fields: [],
  },
  accountableReturn: {
    title: 'Təhtəlhesab şəxsdən qaytarılma',
    description: 'Təhtəlhesab şəxs tərəfindən geri qaytarılan məbləğ.',
    fields: [],
  },
  loanReceipt: {
    title: 'Kredit vəsaitinin daxil olması',
    description: 'Kredit müqaviləsi üzrə banka daxil olan vəsait.',
    fields: [],
  },
  depositReceipt: {
    title: 'Depozit və faiz gəliri',
    description: 'Depozit üzrə əsas məbləğ və ya faiz gəliri.',
    fields: [],
  },
  other: {
    title: 'Digər daxilolma',
    description: 'Digər mənbədən daxil olan ödəniş.',
    fields: [],
  },
}

const baseFields: FormField[] = [
  { name: 'sequenceNumber', label: 'Ardıcıllıq nömrəsi' }, { name: 'date', label: 'Tarix', kind: 'date', required: true },
  { name: 'paymentType', label: 'Ödəniş növü', kind: 'select', required: true }, { name: 'payer', label: 'Ödəyici', required: true },
  { name: 'payerTin', label: 'Ödəyicinin VÖEN-i' }, { name: 'cashFlowItem', label: 'Pul vəsaitinin hərəkəti maddəsi', kind: 'select', required: true }, { name: 'bankReference', label: 'Bank referansı / əməliyyat №' }, { name: 'recipientBank', label: 'Alıcının bankı', required: true },
  { name: 'recipientAccount', label: 'Alıcının hesabı', required: true }, { name: 'currency', label: 'Valyuta', kind: 'select', required: true },
  { name: 'rate', label: 'Məzənnə', kind: 'amount' }, { name: 'amountInCurrency', label: 'Valyutada məbləğ', kind: 'amount', required: true },
  { name: 'amount', label: 'Məbləğ', kind: 'amount', required: true }, { name: 'contract', label: 'Müqavilə' },
  { name: 'purpose', label: 'Ödənişin təyinatı', required: true }, { name: 'note', label: 'Qeyd', kind: 'textarea' },
]

templates.counterpartyAdvance.fields = [...baseFields.slice(0, 12), { name: 'annex', label: 'Müqaviləyə əlavə' }, { name: 'acceptanceDocument', label: 'Qəbul sənədi' }, { name: 'invoice', label: 'Hesab-faktura' }, ...baseFields.slice(-2)]
templates.accountableReturn.fields = [baseFields[0], baseFields[1], baseFields[2], { name: 'employee', label: 'İşçi', required: true }, ...baseFields.slice(5, 11), ...baseFields.slice(-2)]
templates.loanReceipt.fields = [baseFields[0], baseFields[1], baseFields[2], baseFields[5], baseFields[6], ...baseFields.slice(3, 5), ...baseFields.slice(7, 12), ...baseFields.slice(-2)]
templates.depositReceipt.fields = [baseFields[0], baseFields[1], baseFields[2], baseFields[5], baseFields[6], ...baseFields.slice(3, 5), baseFields[7], baseFields[8], { name: 'principalAmountInCurrency', label: 'Əsas məbləğ (valyutada)', kind: 'amount', required: true }, { name: 'principalAmount', label: 'Əsas məbləğ', kind: 'amount', required: true }, { name: 'interestAmountInCurrency', label: 'Faiz məbləği (valyutada)', kind: 'amount' }, { name: 'interestAmount', label: 'Faiz məbləği', kind: 'amount' }, baseFields[11], ...baseFields.slice(-2)]
templates.counterparty.fields.push(...vatFields)
templates.supplierRefund.fields.push(...vatFields)
templates.other.fields = [
  { name: 'sequenceNumber', label: 'Sənəd nömrəsi' },
  { name: 'date', label: 'Tarix', kind: 'date', required: true },
  { name: 'paymentType', label: 'Daxilolmanın növü', kind: 'select', required: true },
  { name: 'payer', label: 'Ödəyici / Mənbə', required: true },
  { name: 'recipientAccount', label: 'Alıcının hesabı', required: true },
  { name: 'recipientBank', label: 'Alıcının bankı' },
  { name: 'amountInCurrency', label: 'Məbləğ', kind: 'amount', required: true },
  { name: 'currency', label: 'Valyuta', kind: 'select', required: true },
  { name: 'rate', label: 'Məzənnə', kind: 'amount' },
  { name: 'amount', label: 'Məbləğ AZN', kind: 'amount' },
  ...vatFields,
  { name: 'cashFlowItem', label: 'Pul vəsaitinin hərəkəti maddəsi', kind: 'select', required: true },
  { name: 'bankReference', label: 'Bank referansı / əməliyyat №' },
  { name: 'purpose', label: 'Ödənişin təyinatı' },
  { name: 'note', label: 'Qeyd', kind: 'textarea' },
]

const inboundTypes = Object.entries(templates).map(([key, template]) => ({ key: key as InboundType, label: template.title }))
const inboundChooserTypes: Array<{ key: InboundType; label: string; description: string }> = [
  { key: 'counterparty', label: 'Müştəridən ödəniş', description: 'Müştəridən daxil olan ödəniş (avans daxil).' },
  { key: 'supplierRefund', label: 'Təchizatçıdan geri ödəniş', description: 'Təchizatçıdan geri ödənilən məbləğ.' },
  { key: 'other', label: 'Digər daxilolma', description: 'Faiz, icarə, dividend, rüsum, sığorta və s.' },
]
const inboundFields = Array.from(new Map(inboundTypes.flatMap(({ key }) => templates[key].fields).map((field) => [field.name, field])).values())

const initialRecords: InboundRecord[] = inboundTypes.flatMap(({ key }, typeIndex) =>
  Array.from({ length: 10 }, (_, index) => {
    const amount = 1800 + typeIndex * 250 + index * 475
    const payer = ['AzərMarket MMC', 'Bakı Trade MMC', 'Caspian Logistics MMC', 'Araz Retail MMC', 'Nova Distribution MMC'][index % 5]
    const date = `${String(28 - index).padStart(2, '0')}.08.2026`
    const currency = index % 4 === 0 ? 'USD' : 'AZN'
    return {
      id: typeIndex * 10 + index + 1,
      type: key,
      date,
      payer,
      amount,
      currency,
      documentNumber: `BD-${String(typeIndex + 1).padStart(2, '0')}-${String(index + 1).padStart(4, '0')}`,
      status: index % 4 === 0 ? 'draft' : 'posted',
      createdAt: `${date} 10:${String(10 + index).padStart(2, '0')}`,
      createdBy: index % 2 === 0 ? 'Aysel Məmmədova' : 'Elvin Hüseynov',
      approvalStatus: index % 3 === 0 ? 'pending' : 'approved',
      approvedAt: index % 3 === 0 ? '—' : `${date} 11:30`,
      costCenter: index % 2 === 0 ? 'Satış şöbəsi' : 'Maliyyə şöbəsi',
      project: index % 3 === 0 ? 'ERP tətbiqi' : 'Cari əməliyyatlar',
      debitAccount: index % 2 === 0 ? '223.01' : '221.01',
      reconciliationStatus: index % 4 === 0 ? 'unreconciled' : 'reconciled',
      values: { sequenceNumber: `BP-${String(184 - typeIndex * 10 - index).padStart(6, '0')}`, date, paymentType: 'bank-transfer', payer, payerTin: `14035678${index}`, recipientBank: index % 2 === 0 ? 'Kapital Bank ASC' : 'PAŞA Bank ASC', recipientAccount: `AZ21NABZ0000000000000012345${index}`, currency, rate: currency === 'AZN' ? 1 : 1.7, amountInCurrency: amount, amount: currency === 'AZN' ? amount : amount * 1.7, contract: `M-2026/0${42 + index}`, annex: `ƏL-${String(index + 1).padStart(3, '0')}`, acceptanceDocument: `QS-${String(index + 10).padStart(4, '0')}`, invoice: `HF-0098${14 + index}`, debitNote: `DN-${String(index + 10).padStart(4, '0')}`, creditNote: `KN-${String(index + 10).padStart(4, '0')}`, employee: 'Rəşad Əliyev', principalAmountInCurrency: amount, principalAmount: amount, interestAmountInCurrency: 80 + index * 5, interestAmount: 80 + index * 5, creditAccount: '223.01', purpose: 'Bank əməliyyatı üzrə ödəniş', note: 'Nümunə əməliyyat qeydi' },
    }
  }),
)

const workspaceTitles: Record<BankWorkspace, string> = {
  inbound: 'Inbound payment',
  outbound: 'Outbound payment',
  internal: 'Internal Transfers',
  loans: 'Loans',
  deposit: 'Deposit',
  conversion: 'Currency Conversion',
}

function PaymentField({ field }: { field: FormField }) {
  const placeholder = field.name === 'sequenceNumber' ? 'Avtomatik yaradılacaq' : `${field.label} seçin və ya daxil edin`
  return <Col xs={24} md={field.kind === 'textarea' ? 24 : 12}><Form.Item name={field.name} label={field.label} rules={field.required ? [{ required: true, message: `${field.label} daxil edilməlidir` }] : undefined}>
          {field.kind === 'date' ? <DatePicker className="full-width" format="DD.MM.YYYY" placeholder="Tarixi seçin" /> : field.kind === 'amount' ? <InputNumber className="full-width" min={0} precision={2} placeholder="0.00" /> : field.kind === 'select' ? <Select placeholder={placeholder} options={field.name === 'currency' ? [{ value: 'AZN', label: 'AZN — Azərbaycan manatı' }, { value: 'USD', label: 'USD — ABŞ dolları' }, { value: 'EUR', label: 'EUR — Avro' }] : paymentTypeOptions} /> : field.kind === 'textarea' ? <Input.TextArea rows={3} placeholder="Əlavə qeyd daxil edin" /> : field.required ? <Input placeholder={placeholder} /> : <AutoComplete className="full-width" placeholder={placeholder} options={[]} />}
  </Form.Item></Col>
}

function ReadOnlyData({ label, value, icon }: { label: string; value?: string | number; icon: ReactNode }) {
  return <Form.Item label={label} className="bank-read-only-form-item">
    <div className="bank-read-only-data" aria-label={`${label}: ${value || 'Avtomatik doldurulacaq'}`}>
      <span className="bank-read-only-data-icon">{icon}</span>
      <Text className={value ? 'bank-read-only-data-value' : 'bank-read-only-data-value bank-read-only-data-placeholder'}>{value || 'Avtomatik doldurulacaq'}</Text>
    </div>
  </Form.Item>
}

function DistributionValue({ value, icon, tone = 'default' }: { value: number; icon: ReactNode; tone?: 'default' | 'success' }) {
  return <div className={`bank-distribution-value bank-distribution-value-${tone}`} aria-label={`${value.toLocaleString('az-AZ', { minimumFractionDigits: 2 })} AZN`}><span className="bank-distribution-value-icon">{icon}</span><Text strong>{value.toLocaleString('az-AZ', { minimumFractionDigits: 2 })}</Text><Text type="secondary">AZN</Text></div>
}

function DistributionSummaryItem({ label, value, icon, tone = 'default' }: { label: string; value: number; icon: ReactNode; tone?: 'default' | 'success' | 'warning' }) {
  return <div className={`bank-distribution-summary-item bank-distribution-summary-item-${tone}`}><span className="bank-distribution-summary-icon">{icon}</span><Flex vertical gap={2}><Text type="secondary">{label}</Text><Text strong>{value.toLocaleString('az-AZ', { minimumFractionDigits: 2 })} AZN</Text></Flex></div>
}

const inboundPayers = [
  { value: 'AzərMarket MMC', label: 'AzərMarket MMC', tin: '1403567801' },
  { value: 'Bakı Trade MMC', label: 'Bakı Trade MMC', tin: '1403567802' },
  { value: 'Caspian Logistics MMC', label: 'Caspian Logistics MMC', tin: '1403567803' },
]

const supplierRefundPayers = [
  { value: 'Bakı Tikinti MMC', label: 'Bakı Tikinti MMC', tin: '123456789' },
  { value: 'Azərİnşaat MMC', label: 'Azərİnşaat MMC', tin: '1403567802' },
  { value: 'Caspian Təchizat MMC', label: 'Caspian Təchizat MMC', tin: '1403567803' },
]

const supplierRefundOpenPayments = [
  { value: 'OP-2026-000125', label: 'OP-2026-000125', date: '10.08.2026', debt: 3000 },
  { value: 'OP-2026-000142', label: 'OP-2026-000142', date: '25.08.2026', debt: 4000 },
  { value: 'OP-2026-000150', label: 'OP-2026-000150', date: '05.09.2026', debt: 6000 },
]

const supplierRefundReturnDocuments = [
  { value: 'GQ-2026-000018', label: 'GQ-2026-000018', date: '12.09.2026', debt: 2500 },
  { value: 'GQ-2026-000024', label: 'GQ-2026-000024', date: '18.09.2026', debt: 3500 },
]

const initialDistributionRows = (type: InboundType, refundType?: string): DistributionRowForm[] => type === 'supplierRefund'
  ? (refundType === 'goods-service-return' ? supplierRefundReturnDocuments : supplierRefundOpenPayments).map((payment) => ({ invoice: payment.value, date: payment.date, debt: payment.debt, payment: 0, selected: true }))
  : [{}]

const inboundAccounts = [
  { value: 'AZ21NABZ00000000000000123450', label: 'AZ21NABZ00000000000000123450 · Kapital Bank ASC · AZN', bank: 'Kapital Bank ASC', currency: 'AZN' },
  { value: 'AZ21PAHA00000000000000123451', label: 'AZ21PAHA00000000000000123451 · PAŞA Bank ASC · AZN', bank: 'PAŞA Bank ASC', currency: 'AZN' },
  { value: 'AZ21NABZ00000000000000123452', label: 'AZ21NABZ00000000000000123452 · Kapital Bank ASC · USD', bank: 'Kapital Bank ASC', currency: 'USD' },
  { value: 'AZ21PAHA00000000000000123453', label: 'AZ21PAHA00000000000000123453 · PAŞA Bank ASC · EUR', bank: 'PAŞA Bank ASC', currency: 'EUR' },
]

const exchangeRatesByCurrency: Record<string, number> = {
  AZN: 1,
  USD: 1.7,
  EUR: 1.85,
}

const inboundContracts = [
  { value: 'contract-001', label: 'M-2026/042', payer: 'AzərMarket MMC' },
  { value: 'contract-002', label: 'M-2026/043', payer: 'Bakı Trade MMC' },
  { value: 'contract-003', label: 'M-2026/044', payer: 'Caspian Logistics MMC' },
]

const inboundInvoices = [
  { value: 'invoice-001', label: 'HF-009814 · 10 000,00 AZN', contract: 'contract-001', debt: 10000 },
  { value: 'invoice-002', label: 'HF-009815 · 8 000,00 AZN', contract: 'contract-001', debt: 8000 },
  { value: 'invoice-003', label: 'HF-009816 · 6 500,00 AZN', contract: 'contract-002', debt: 6500 },
  { value: 'invoice-004', label: 'HF-009817 · 4 200,00 AZN', contract: 'contract-003', debt: 4200 },
]

function InboundPaymentForm({ form, type }: { form: FormInstance<PaymentFormValues>; type: 'counterparty' | 'supplierRefund' | 'other' }) {
  const isSupplierRefund = type === 'supplierRefund'
  const isOther = type === 'other'
  const partyLabel = isSupplierRefund ? 'Təchizatçı' : isOther ? 'Ödəyici / Mənbə' : 'Ödəyici'
  const partyOptions = isSupplierRefund ? supplierRefundPayers : isOther ? [...inboundPayers, { value: 'Kapital Bank ASC', label: 'Kapital Bank ASC', tin: '9900003611' }, { value: 'PAŞA Bank ASC', label: 'PAŞA Bank ASC', tin: '1500394551' }] : inboundPayers
  const [selectedDistributionRows, setSelectedDistributionRows] = useState<boolean[]>(() => initialDistributionRows(type).map((row) => row.selected !== false))
  const sequenceNumber = Form.useWatch('sequenceNumber', form) ?? 'IP-2026-000001'
  const payer = Form.useWatch('payer', form)
  const refundType = Form.useWatch('paymentType', form)
  const recipientAccount = Form.useWatch('recipientAccount', form)
  const watchedRecipientBank = Form.useWatch('recipientBank', form)
  const watchedCurrency = Form.useWatch('currency', form)
  const selectedAccount = inboundAccounts.find((item) => item.value === recipientAccount)
  const recipientBank = selectedAccount?.bank ?? watchedRecipientBank
  const currency = selectedAccount?.currency ?? watchedCurrency
  const amount = Number(Form.useWatch('amountInCurrency', form) ?? 0)
  const exchangeRate = Number(Form.useWatch('rate', form) ?? 1)
  const vatRate = Number(Form.useWatch('vatRate', form) ?? 0)
  const rows = Form.useWatch('distributionRows', { form, preserve: true }) ?? []
  const isForeignCurrency = Boolean(currency && currency !== 'AZN')
  const baseAmount = isForeignCurrency ? amount * exchangeRate : amount
  const vatAmount = Math.round(amount * vatRate / (100 + vatRate) * 100) / 100
  const distributedAmount = rows.reduce((sum, row) => sum + Number(row?.payment ?? 0), 0)
  const advancePayment = Math.max(amount - distributedAmount, 0)

  useEffect(() => {
    const current = form.getFieldsValue()
    if (!current.sequenceNumber || !current.date) {
      form.setFieldsValue({
        sequenceNumber: current.sequenceNumber ?? 'IP-2026-000001',
        date: current.date ?? new Date().toISOString().slice(0, 10),
      })
    }
  }, [form])

  useEffect(() => {
    if (recipientAccount) {
      const account = inboundAccounts.find((item) => item.value === recipientAccount)
      if (account) {
        form.setFieldsValue({ recipientBank: account.bank, currency: account.currency, rate: exchangeRatesByCurrency[account.currency] ?? 1 })
      }
    }
  }, [form, recipientAccount])

  useEffect(() => {
    form.setFieldValue('amount', baseAmount)
  }, [baseAmount, form])

  useEffect(() => {
    form.setFieldValue('vatAmount', vatAmount)
  }, [form, vatAmount])

  const contractOptions = inboundContracts.filter((contract) => !payer || contract.payer === payer)
  const fieldLayout = { xs: 24, sm: 12, lg: 8 }
  const automaticallyDistribute = () => {
    let remaining = amount
    form.setFieldValue('distributionRows', rows.map((row, index) => {
      if (selectedDistributionRows[index] === false) return { ...row, payment: 0 }
      const payment = Math.min(Number(row.debt ?? 0), remaining)
      remaining -= payment
      return { ...row, payment }
    }))
  }

  return <Flex vertical gap={16}>
    {(['sequenceNumber', 'recipientBank', 'currency', 'rate', 'amount', 'vatAmount'] as const).map((name) => <Form.Item key={name} name={name} hidden><Input /></Form.Item>)}
    <Card className="bank-form-section" title={<Flex align="center" gap={10}><span className="bank-form-section-icon bank-form-section-icon-payment"><CreditCardOutlined /></span><div><Text strong>{isOther ? 'Əsas məlumatlar' : 'Ödəniş və bank məlumatları'}</Text><Text type="secondary" className="bank-form-section-description">{isSupplierRefund ? 'Ödənişin əsas məlumatlarını daxil edin.' : 'Ödəyici, hesab və məbləğ məlumatlarını daxil edin.'}</Text></div></Flex>}>
      <Row gutter={16}>
        <Col {...fieldLayout} lg={isOther ? 6 : 8}><ReadOnlyData label="Sənəd nömrəsi" value={sequenceNumber} icon={<ProfileOutlined />} /></Col>
        <Col {...fieldLayout} lg={isOther ? 6 : 8}><Form.Item name="date" label="Tarix" rules={[{ required: true, message: 'Tarix daxil edilməlidir' }]}><Input type="date" className="full-width" /></Form.Item></Col>
        {isOther && <Col xs={24} lg={12}><Form.Item name="paymentType" label="Daxilolmanın növü" rules={[{ required: true, message: 'Daxilolmanın növü seçilməlidir' }]}><Select placeholder="Növü seçin" options={otherReceiptTypeOptions} /></Form.Item></Col>}
        <Col {...fieldLayout}><Form.Item name="payer" label={partyLabel} rules={[{ required: true, message: `${partyLabel} seçilməlidir` }]}><Select allowClear={isOther} showSearch optionFilterProp="label" placeholder={`${partyLabel} seçin`} options={partyOptions} onChange={(value) => { const nextRows = initialDistributionRows(type, refundType); setSelectedDistributionRows(nextRows.map((row) => row.selected !== false)); form.setFieldsValue({ payerTin: partyOptions.find((item) => item.value === value)?.tin, distributionRows: nextRows }) }} /></Form.Item></Col>
        {!isOther && <Col {...fieldLayout}><Form.Item name="payerTin" label={`${partyLabel}ın VÖEN-i`}><AutoComplete className="full-width" options={partyOptions.map((item) => ({ value: item.tin, label: `${item.tin} · ${item.label}` }))} placeholder="VÖEN seçin və ya daxil edin" onSelect={(value) => { const selected = partyOptions.find((item) => item.tin === value); if (selected) form.setFieldsValue({ payer: selected.value }) }} /></Form.Item></Col>}
        {isSupplierRefund && <Col {...fieldLayout}><Form.Item name="paymentType" label="Geri ödənişin növü" rules={[{ required: true, message: 'Geri ödənişin növü seçilməlidir' }]}><Select placeholder="Növü seçin" options={refundTypeOptions} classNames={{ popup: { root: 'bank-refund-type-popup' } }} onChange={(value) => { const nextRows = initialDistributionRows(type, value); setSelectedDistributionRows(nextRows.map((row) => row.selected !== false)); form.setFieldValue('distributionRows', nextRows) }} /></Form.Item></Col>}
        <Col {...fieldLayout} lg={isOther ? 10 : 8}><Form.Item name="recipientAccount" label="Alıcının hesabı" rules={[{ required: true, message: 'Alıcının hesabı seçilməlidir' }]}><Select showSearch optionFilterProp="label" placeholder="Hesab seçin" options={inboundAccounts} onChange={(value) => { const account = inboundAccounts.find((item) => item.value === value); if (account) form.setFieldsValue({ recipientBank: account.bank, currency: account.currency, rate: exchangeRatesByCurrency[account.currency] ?? 1 }) }} /></Form.Item></Col>
        <Col {...fieldLayout} lg={isOther ? 6 : 8}><ReadOnlyData label="Alıcının bankı" value={recipientBank} icon={<BankOutlined />} /></Col>
        <Col {...fieldLayout} lg={isOther ? 6 : 8}><Form.Item name="amountInCurrency" label="Məbləğ" rules={[{ required: true, message: 'Məbləğ daxil edilməlidir' }, { type: 'number', min: 0.01, message: 'Məbləğ sıfırdan böyük olmalıdır' }]}><InputNumber className="full-width" min={0} precision={2} placeholder="0.00" /></Form.Item></Col>
        <Col {...fieldLayout} lg={isOther ? 6 : 8}><ReadOnlyData label="Valyuta" value={currency} icon={<GlobalOutlined />} /></Col>
        {isForeignCurrency && <Col {...fieldLayout} lg={isOther ? 6 : 8}><ReadOnlyData label="Məzənnə" value={exchangeRate.toFixed(4)} icon={<SwapOutlined />} /></Col>}
        {(isOther || isSupplierRefund || isForeignCurrency) && <Col {...fieldLayout} lg={isOther ? 6 : 8}><ReadOnlyData label="Məbləğ AZN" value={`${baseAmount.toLocaleString('az-AZ', { minimumFractionDigits: 2 })} AZN`} icon={<DollarOutlined />} /></Col>}
      </Row>
      <Row gutter={16}>
        <Col xs={24} sm={12} lg={6}><Form.Item name="vatRate" label="ƏDV dərəcəsi"><Select allowClear placeholder="ƏDV seçin" options={[{ value: 18, label: '18%' }, { value: 0, label: '0%' }]} /></Form.Item></Col>
        <Col xs={24} sm={12} lg={6}><ReadOnlyData label="ƏDV məbləği" value={`${vatAmount.toLocaleString('az-AZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${currency ? ` ${currency}` : ''}`} icon={<DollarOutlined />} /></Col>
      </Row>
    </Card>

    {!isOther && <Card className="bank-form-section" title={<Flex align="center" gap={10}><span className="bank-form-section-icon bank-form-section-icon-documents"><FolderOpenOutlined /></span><div><Text strong>{isSupplierRefund ? 'Geri ödəniş bölgüsü' : 'Ödəniş bölgüsü'}</Text><Text type="secondary" className="bank-form-section-description">{isSupplierRefund ? 'Seçilən təchizatçı üzrə açıq ödənişlərdən geri ödənişi bölüşdürün.' : 'Ödənişi bir və ya bir neçə hesab-fakturaya bölüşdürün.'}</Text></div></Flex>} extra={isSupplierRefund ? <Flex className="bank-distribution-actions" align="center" gap={12}><Alert className="bank-distribution-info" type="info" showIcon title="Yalnız açıq qalığı olan ödənişlər göstərilir." /><Button className="bank-auto-distribution-button" icon={<SwapOutlined />} onClick={automaticallyDistribute}>Avtomatik bölüşdür</Button></Flex> : undefined}>
      {!isSupplierRefund && <Alert className="bank-distribution-alert" type={distributedAmount > amount ? 'error' : 'info'} showIcon title={distributedAmount > amount ? 'Bölüşdürülən məbləğ ümumi ödənişdən çox ola bilməz.' : 'Bölüşdürülməyən məbləğ avtomatik olaraq avans ödənişi kimi saxlanılır.'} />}
      <Form.List name="distributionRows" rules={[{ validator: async (_, value: DistributionRowForm[] | undefined) => { if (!value?.length) return Promise.reject(new Error('Ən azı bir müqavilə və ödəniş sətri əlavə edilməlidir')) } }]}> 
        {(fields, { add, remove }, { errors }) => <>
          <Table size="small" bordered className="bank-distribution-table" rowKey="key" pagination={false} tableLayout="fixed" scroll={{ x: isSupplierRefund ? 860 : 1020 }} dataSource={fields} columns={isSupplierRefund ? [
            { title: <Checkbox checked={fields.length > 0 && fields.every((field) => selectedDistributionRows[field.name] !== false)} indeterminate={fields.some((field) => selectedDistributionRows[field.name] !== false) && !fields.every((field) => selectedDistributionRows[field.name] !== false)} aria-label="Bütün açıq ödənişləri seç" onChange={(event) => { const selected = event.target.checked; const currentRows = form.getFieldValue('distributionRows') ?? []; setSelectedDistributionRows(fields.map(() => selected)); form.setFieldsValue({ distributionRows: currentRows.map((row: DistributionRowForm) => ({ ...row, selected })) }) }} />, width: 48, align: 'center' as const, render: (_, field) => { const selected = selectedDistributionRows[field.name] !== false; return <Checkbox checked={selected} aria-label="Açıq ödənişi seç" onChange={(event) => { const checked = event.target.checked; setSelectedDistributionRows((current) => current.map((value, index) => index === field.name ? checked : value)); form.setFieldValue(['distributionRows', field.name, 'selected'], checked) }} /> } },
            { title: refundType === 'goods-service-return' ? 'Geri qaytarılma sənədi' : 'İlkin ödəniş', width: 180, render: (_, field) => <Text strong className="bank-open-payment-number">{rows[field.name]?.invoice ?? '—'}</Text> },
            { title: 'Tarix', width: 120, render: (_, field) => <Text>{rows[field.name]?.date ?? '—'}</Text> },
            { title: 'Açıq məbləğ', width: 155, render: (_, field) => <DistributionValue value={Number(rows[field.name]?.debt ?? 0)} icon={<DollarOutlined />} /> },
            { title: 'Geri ödəniş', width: 155, render: (_, field) => <Form.Item name={[field.name, 'payment']} rules={[{ required: true, message: 'Məbləği daxil edin' }, { type: 'number', min: 0, message: 'Məbləğ mənfi ola bilməz' }, { validator: () => distributedAmount <= amount ? Promise.resolve() : Promise.reject(new Error('Ümumi məbləği keçə bilməz')) }]}><InputNumber size="large" className="full-width" min={0} precision={2} placeholder="0.00" /></Form.Item> },
            { title: 'Qalıq', width: 150, render: (_, field) => <DistributionValue value={Math.max(Number(rows[field.name]?.debt ?? 0) - Number(rows[field.name]?.payment ?? 0), 0)} icon={<WalletOutlined />} tone="success" /> },
          ] : [
            { title: 'Müqavilə', width: 180, render: (_, field) => <Form.Item name={[field.name, 'contract']} rules={[{ required: true, message: 'Seçin' }]}><Select size="large" showSearch optionFilterProp="label" placeholder="Müqavilə" options={contractOptions} onChange={() => form.setFieldValue(['distributionRows', field.name, 'invoice'], undefined)} /></Form.Item> },
            { title: 'Əlavə', width: 150, render: (_, field) => <Form.Item name={[field.name, 'annex']}><Select size="large" allowClear placeholder="Əlavə" options={[{ value: 'annex-001', label: 'ƏL-001' }, { value: 'annex-002', label: 'ƏL-002' }]} /></Form.Item> },
            { title: 'Hesab-faktura', width: 190, render: (_, field) => <Form.Item name={[field.name, 'invoice']} rules={[{ required: true, message: 'Seçin' }]}><Select size="large" showSearch optionFilterProp="label" placeholder="Hesab-faktura" options={inboundInvoices.filter((invoice) => !payer || contractOptions.some((contract) => contract.value === invoice.contract))} onChange={(value) => form.setFieldValue(['distributionRows', field.name, 'debt'], inboundInvoices.find((invoice) => invoice.value === value)?.debt ?? 0)} /></Form.Item> },
            { title: 'Borc', width: 150, render: (_, field) => <DistributionValue value={Number(rows[field.name]?.debt ?? 0)} icon={<DollarOutlined />} /> },
            { title: 'Ödəniş', width: 145, render: (_, field) => <Form.Item name={[field.name, 'payment']} rules={[{ required: true, message: 'Ödəniş daxil edilməlidir' }, { type: 'number', min: 0.01, message: 'Ödəniş sıfırdan böyük olmalıdır' }, { validator: () => distributedAmount <= amount ? Promise.resolve() : Promise.reject(new Error('Ümumi ödənişi keçə bilməz')) }]}><InputNumber size="large" className="full-width" min={0} precision={2} placeholder="0.00" /></Form.Item> },
            { title: 'Qalıq borc', width: 150, render: (_, field) => { const row = rows[field.name]; return <DistributionValue value={Math.max(Number(row?.debt ?? 0) - Number(row?.payment ?? 0), 0)} icon={<WalletOutlined />} tone="success" /> } },
            { title: '', width: 52, render: (_, field) => <Tooltip title="Sətri sil"><Button size="large" type="text" danger icon={<DeleteOutlined />} aria-label="Bölgü sətrini sil" onClick={() => remove(field.name)} /></Tooltip> },
          ]} />
          <Form.ErrorList errors={errors} />
          {!isSupplierRefund && <Button className="bank-distribution-add" icon={<PlusOutlined />} onClick={() => add({})}>Bölgü sətri əlavə et</Button>}
        </>}
      </Form.List>
      <Row gutter={[12, 12]} className="bank-distribution-summary">
        <Col xs={24} sm={8}><DistributionSummaryItem label={isSupplierRefund ? 'Ümumi geri ödəniş' : 'Ümumi ödəniş'} value={amount} icon={<DollarOutlined />} /></Col>
        <Col xs={24} sm={8}><DistributionSummaryItem label="Bölüşdürülən" value={distributedAmount} icon={<SwapOutlined />} tone="success" /></Col>
        <Col xs={24} sm={8}><DistributionSummaryItem label={isSupplierRefund ? 'Bölüşdürülməyən' : 'Avans ödənişi'} value={advancePayment} icon={<WalletOutlined />} tone="warning" /></Col>
      </Row>
    </Card>}

    {isOther && <Card className="bank-form-section" title={<Flex align="center" gap={10}><span className="bank-form-section-icon bank-form-section-icon-documents"><AuditOutlined /></span><Text strong>Mühasibat və təsnifat</Text></Flex>}>
      <Row gutter={16}>
        <Col xs={24} md={12}><Form.Item name="cashFlowItem" label="Pul vəsaitinin hərəkəti maddəsi" rules={[{ required: true, message: 'Pul vəsaitinin hərəkəti maddəsi seçilməlidir' }]}><Select placeholder="Maddə seçin" options={otherCashFlowOptions} /></Form.Item></Col>
        <Col xs={24} md={12}><Form.Item name="bankReference" label="Bank referansı / əməliyyat №"><Input placeholder="Əməliyyat nömrəsini daxil edin" /></Form.Item></Col>
      </Row>
    </Card>}

    <Card className="bank-form-section" title={<Flex align="center" gap={10}><span className="bank-form-section-icon bank-form-section-icon-notes"><CommentOutlined /></span><div><Text strong>Əlavə məlumatlar</Text><Text type="secondary" className="bank-form-section-description">Ödəniş rekvizitlərini və izahı qeyd edin.</Text></div></Flex>}>
      <Row gutter={16}>
        {!isOther && <Col xs={24} md={8}><Form.Item name="cashFlowItem" label="Pul vəsaitinin hərəkəti maddəsi" rules={[{ required: true, message: 'Pul vəsaitinin hərəkəti maddəsi seçilməlidir' }]}><Select placeholder="Maddə seçin" options={isSupplierRefund ? [{ value: 'supplier-refund', label: 'Təchizatçılardan daxilolmalar (geri ödəniş)' }] : [{ value: 'customer-receivables', label: 'Müştəri debitor borcları' }, { value: 'advance-payment', label: 'Avans ödənişləri' }]} /></Form.Item></Col>}
        {!isOther && <Col xs={24} md={8}><Form.Item name="bankReference" label="Bank referansı / əməliyyat №"><Input placeholder="Əməliyyat nömrəsini daxil edin" /></Form.Item></Col>}
        <Col xs={24} md={isOther ? 24 : 8}><Form.Item name="purpose" label="Ödənişin təyinatı" rules={isOther ? undefined : [{ required: true, message: 'Ödənişin təyinatı daxil edilməlidir' }]}><Input placeholder="Ödənişin təyinatını daxil edin" /></Form.Item></Col>
        <Col span={24}><Form.Item name="note" label="Qeyd"><Input.TextArea rows={3} maxLength={500} showCount placeholder="Əlavə qeyd daxil edin" /></Form.Item></Col>
      </Row>
    </Card>
  </Flex>
}

export function BankAccountsPage({ workspace }: { workspace: BankWorkspace }) {
  const screens = Grid.useBreakpoint()
  const [messageApi, contextHolder] = message.useMessage()
  const inboundUploadRef = useRef<HTMLButtonElement>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [paymentType, setPaymentType] = useState<InboundType>('counterparty')
  const [selectedCreateType, setSelectedCreateType] = useState<InboundType | null>(null)
  const [records, setRecords] = useState<InboundRecord[]>(initialRecords)
  const [viewRecord, setViewRecord] = useState<InboundRecord | null>(null)
  const [listView, setListView] = useState<'table' | 'cards'>('table')
  const [search, setSearch] = useState('')
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})
  const [hasColumnVisibilityChanges, setHasColumnVisibilityChanges] = useState(false)
  const [filterExportTooltipOpen, setFilterExportTooltipOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [columnSettingsOpen, setColumnSettingsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const defaultColumnKeys = ['type', 'documentNumber', 'status', 'createdAt', 'createdBy', 'approvalStatus', 'approvedAt', 'costCenter', 'project', 'debitAccount', 'reconciliationStatus', ...inboundFields.map((field) => field.name), 'view']
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(defaultColumnKeys)
  const [columnOrder, setColumnOrder] = useState<string[]>(defaultColumnKeys)
  const [fixedColumns, setFixedColumns] = useState<Record<string, FixedColumnPosition>>({ type: 'left', view: 'right' })
  const [draggedColumnKey, setDraggedColumnKey] = useState<string | null>(null)
  const [form] = Form.useForm<PaymentFormValues>()
  /*
  */
  const template = templates[paymentType]
  const openCreate = (type: InboundType = paymentType) => {
    setViewRecord(null)
    setPaymentType(type)
    setSelectedCreateType(null)
    setDrawerOpen(true)
  }
  const openView = (record: InboundRecord) => {
    setPaymentType(record.type)
    setViewRecord(record)
    setSelectedCreateType(record.type)
    setDrawerOpen(true)
  }

  const savePayment = async () => {
    const valid = await form.validateFields().then(() => true, () => false)
    if (!valid) return
    setIsSaving(true)
    try {
      const values: PaymentFormValues = form.getFieldsValue(true)
      setRecords((current) => [{ id: Date.now(), type: paymentType, date: values.date ?? 'Bu gün', payer: values.payer ?? values.employee ?? 'Daxil olan ödəniş', amount: values.amount ?? values.principalAmount ?? 0, currency: values.currency ?? 'AZN', documentNumber: `BD-${Date.now()}`, status: 'draft', createdAt: 'Bu gün', createdBy: 'Cari istifadəçi', approvalStatus: 'pending', approvedAt: '—', costCenter: '—', project: '—', debitAccount: '—', reconciliationStatus: 'unreconciled', values }, ...current])
      setDrawerOpen(false)
      messageApi.success(paymentType === 'supplierRefund' ? 'Təchizatçıdan geri ödəniş yaradıldı' : 'Daxil olan ödəniş yaradıldı')
    } finally {
      setIsSaving(false)
    }
  }

  const hasActiveFilters = Boolean(search.trim() || Object.values(columnFilters).some(Boolean) || hasColumnVisibilityChanges)

  const recordsForType = (type: InboundType) => records.filter((record) => {
    if (record.type !== type) return false
    const query = search.trim().toLocaleLowerCase('az-AZ')
    const searchableValues: Record<string, string> = {
      type: templates[record.type].title,
      documentNumber: record.documentNumber,
      status: record.status === 'posted' ? 'Keçirilib' : 'Qaralama',
      createdAt: record.createdAt,
      createdBy: record.createdBy,
      approvalStatus: record.approvalStatus === 'approved' ? 'Təsdiqlənib' : 'Gözləyir',
      approvedAt: record.approvedAt,
      costCenter: record.costCenter,
      project: record.project,
      debitAccount: record.debitAccount,
      reconciliationStatus: record.reconciliationStatus === 'reconciled' ? 'Üzləşdirilib' : 'Üzləşdirilməyib',
      ...Object.fromEntries(inboundFields.map((field) => [field.name, String(record.values[field.name] ?? '')])),
    }
    const matchesGlobal = !query || Object.values(searchableValues).join(' ').toLocaleLowerCase('az-AZ').includes(query)
    const matchesColumns = Object.entries(columnFilters).every(([columnKey, value]) => !value || searchableValues[columnKey]?.toLocaleLowerCase('az-AZ').includes(value.toLocaleLowerCase('az-AZ')))
    return matchesGlobal && matchesColumns
  })

  const inboundSummary = [
    { key: 'counterparty', label: 'Müştəridən ödənişlər', icon: <WalletOutlined />, className: 'bank-summary-counterparty' },
    { key: 'supplierRefund', label: 'Təchizatçılardan geri ödənişlər', icon: <SwapOutlined />, className: 'bank-summary-supplier' },
    { key: 'other', label: 'Digər daxilolmalar', icon: <DollarOutlined />, className: 'bank-summary-other' },
    { key: 'total', label: 'Ümumi daxilolmalar', icon: <BankOutlined />, className: 'bank-summary-total' },
  ].map((item) => ({
    ...item,
    amount: item.key === 'total' ? records.reduce((sum, record) => sum + record.amount, 0) : records.filter((record) => record.type === item.key).reduce((sum, record) => sum + record.amount, 0),
  }))

  const exportInboundRecords = (type: InboundType) => {
    const rows = recordsForType(type).map((record) => `<tr><td>${record.documentNumber}</td><td>${record.date}</td><td>${record.payer}</td><td>${record.amount}</td><td>${record.currency}</td><td>${record.status === 'posted' ? 'Keçirilib' : 'Qaralama'}</td></tr>`).join('')
    const workbook = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><table><thead><tr><th>Sənəd nömrəsi</th><th>Tarix</th><th>Ödəyici</th><th>Məbləğ</th><th>Valyuta</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></body></html>`
    const url = URL.createObjectURL(new Blob(['\ufeff', workbook], { type: 'application/vnd.ms-excel;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `daxilolmalar-${type}-${new Date().toISOString().slice(0, 10)}.xls`
    link.click()
    URL.revokeObjectURL(url)
    messageApi.success(`${recordsForType(type).length} əməliyyat Excel-ə ixrac edildi`)
  }

  const downloadInboundTemplate = () => {
    const workbook = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><table><thead><tr><th>Sənəd nömrəsi</th><th>Tarix</th><th>Ödəyici</th><th>Məbləğ</th><th>Valyuta</th><th>Status</th></tr></thead><tbody><tr><td>BD-01-0001</td><td>01.09.2026</td><td>Nümunə şirkət</td><td>2500</td><td>AZN</td><td>Qaralama</td></tr></tbody></table></body></html>`
    const url = URL.createObjectURL(new Blob(['\ufeff', workbook], { type: 'application/vnd.ms-excel;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'daxilolma-idxal-sablonu.xls'
    link.click()
    URL.revokeObjectURL(url)
    messageApi.success('İdxal şablonu yükləndi')
  }

  const importInboundRecords: UploadProps['beforeUpload'] = async (file) => {
    try {
      const content = await file.text()
      const rows = /<table/i.test(content)
        ? Array.from(new DOMParser().parseFromString(content, 'text/html').querySelectorAll('tbody tr')).map((row) => Array.from(row.querySelectorAll('td')).map((cell) => cell.textContent?.trim() ?? ''))
        : content.split(/\r?\n/).slice(1).filter(Boolean).map((row) => row.split(row.includes('\t') ? '\t' : row.includes(';') ? ';' : ',').map((cell) => cell.trim().replace(/^"|"$/g, '')))
      const today = new Date().toLocaleDateString('az-AZ')
      const imported = rows.filter((row) => row[0]).map<InboundRecord>((row, index) => ({
        id: Date.now() + index,
        type: paymentType,
        documentNumber: row[0],
        date: row[1] || today,
        payer: row[2] || '—',
        amount: Number(row[3]?.replace(',', '.')) || 0,
        currency: row[4] || 'AZN',
        status: row[5]?.toLocaleLowerCase('az-AZ').includes('keçir') ? 'posted' : 'draft',
        createdAt: today,
        createdBy: 'Cari istifadəçi',
        approvalStatus: 'pending', approvedAt: '—', costCenter: '—', project: '—', debitAccount: '—', reconciliationStatus: 'unreconciled',
        values: { sequenceNumber: row[0], date: row[1] || today, payer: row[2] || '—', amount: Number(row[3]?.replace(',', '.')) || 0, amountInCurrency: Number(row[3]?.replace(',', '.')) || 0, currency: row[4] || 'AZN' },
      }))
      if (!imported.length) throw new Error('empty')
      setRecords((current) => [...imported, ...current])
      messageApi.success(`${imported.length} əməliyyat Excel-dən idxal edildi`)
    } catch {
      messageApi.error('Fayl oxunmadı. Sistem ixracından alınmış XLS, CSV və ya TSV faylı seçin.')
    }
    return Upload.LIST_IGNORE
  }

  const tableColumns: ColumnsType<InboundRecord> = [
    { title: 'Əməliyyat növü', dataIndex: 'type', key: 'type', fixed: 'left' as const, width: 330, render: (type: InboundType) => <Space className="bank-operation-cell"><span className="bank-table-icon"><DollarOutlined /></span><Text strong ellipsis={{ tooltip: templates[type].title }}>{templates[type].title}</Text></Space> },
    { title: 'Sənəd nömrəsi', dataIndex: 'documentNumber', key: 'documentNumber', width: 150 },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 130, render: (status: InboundRecord['status']) => <Tag color={status === 'posted' ? 'success' : 'default'}>{status === 'posted' ? 'Keçirilib' : 'Qaralama'}</Tag> },
    { title: 'Yaradılma tarixi', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
    { title: 'Yaradan', dataIndex: 'createdBy', key: 'createdBy', width: 170 },
    { title: 'Təsdiq statusu', dataIndex: 'approvalStatus', key: 'approvalStatus', width: 150, render: (status: InboundRecord['approvalStatus']) => <Tag color={status === 'approved' ? 'success' : 'warning'}>{status === 'approved' ? 'Təsdiqlənib' : 'Gözləyir'}</Tag> },
    { title: 'Təsdiq tarixi', dataIndex: 'approvedAt', key: 'approvedAt', width: 170 },
    { title: 'Xərc mərkəzi', dataIndex: 'costCenter', key: 'costCenter', width: 170 },
    { title: 'Layihə', dataIndex: 'project', key: 'project', width: 180 },
    { title: 'Debet hesabı', dataIndex: 'debitAccount', key: 'debitAccount', width: 140 },
    { title: 'Üzləşdirmə', dataIndex: 'reconciliationStatus', key: 'reconciliationStatus', width: 150, render: (status: InboundRecord['reconciliationStatus']) => <Tag color={status === 'reconciled' ? 'success' : 'processing'}>{status === 'reconciled' ? 'Üzləşdirilib' : 'Üzləşdirilməyib'}</Tag> },
    ...inboundFields.map((field) => ({ title: field.label, key: field.name, dataIndex: ['values', field.name], width: 180, render: (value: string | number | undefined, record: InboundRecord) => field.name === 'amount' || field.name === 'amountInCurrency' || field.name.includes('Amount') ? <Text strong>{value === undefined ? '—' : `${Number(value).toLocaleString('az-AZ')} ${record.currency}`}</Text> : value || '—' })),
    { title: 'Baxış', key: 'view', fixed: 'right' as const, width: 92, align: 'center' as const, render: (_: unknown, record: InboundRecord) => <Tooltip title="Əməliyyata bax"><Button type="text" icon={<EyeOutlined />} aria-label={`${templates[record.type].title} əməliyyatına bax`} onClick={() => openView(record)} /></Tooltip> },
  ]
  const columnLabels = Object.fromEntries(tableColumns.map((column) => [String(column.key), template.fields.find((field) => field.name === column.key)?.label ?? (typeof column.title === 'string' ? column.title : String(column.key))]))
  const activeTableColumnKeys = new Set(['type', 'documentNumber', 'status', 'createdAt', 'createdBy', 'approvalStatus', 'approvedAt', 'costCenter', 'project', 'debitAccount', 'reconciliationStatus', ...template.fields.map((field) => field.name), 'view'])
  const visibleTableColumns = columnOrder.filter((key) => visibleColumnKeys.includes(key) && activeTableColumnKeys.has(key)).map((key) => {
    const column = tableColumns.find((item) => String(item.key) === key)
    if (!column) return null
    return {
      ...column,
      title: key === 'view' ? columnLabels[key] : <Flex vertical gap={8}><span>{columnLabels[key]}</span><Input size="small" allowClear aria-label={`${columnLabels[key]} üzrə axtarış`} placeholder="Axtar" value={columnFilters[key] ?? ''} onClick={(event) => event.stopPropagation()} onChange={(event) => { setColumnFilters((current) => ({ ...current, [key]: event.target.value })); setCurrentPage(1) }} /></Flex>,
      fixed: screens.xl ? fixedColumns[key] : undefined,
      sorter: key === 'view' ? undefined : (a: InboundRecord, b: InboundRecord) => {
        const value = (record: InboundRecord) => key in record ? String(record[key as keyof InboundRecord] ?? '') : String(record.values[key as keyof PaymentFormValues] ?? '')
        return value(a).localeCompare(value(b), 'az-AZ', { numeric: true })
      },
      onHeaderCell: () => ({
        draggable: true,
        onDragStart: () => setDraggedColumnKey(key),
        onDragOver: (event: ReactDragEvent<HTMLTableCellElement>) => event.preventDefault(),
        onDrop: () => moveColumn(key),
        onDragEnd: () => setDraggedColumnKey(null),
        className: draggedColumnKey === key ? 'counterparty-table-header-dragging' : 'counterparty-table-header-draggable',
      }),
    }
  }).filter(Boolean) as ColumnsType<InboundRecord>

  const moveColumn = (targetKey: string) => {
    if (!draggedColumnKey || draggedColumnKey === targetKey) return
    setColumnOrder((current) => {
      const next = current.filter((key) => key !== draggedColumnKey)
      next.splice(next.indexOf(targetKey), 0, draggedColumnKey)
      return next
    })
    setDraggedColumnKey(null)
  }

  const reorderColumn = (key: string, offset: number) => {
    setColumnOrder((current) => {
      const index = current.indexOf(key)
      const nextIndex = index + offset
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current
      const next = [...current]
      next.splice(index, 1)
      next.splice(nextIndex, 0, key)
      return next
    })
    setHasColumnVisibilityChanges(true)
  }

  const detailValue = (field: FormField, record: InboundRecord) => {
    const value = record.values[field.name]
    if (value === undefined || value === '') return '—'
    if (field.kind === 'amount') {
      if (field.name === 'vatRate') return `${Number(value)}%`
      if (field.name === 'rate') return Number(value).toFixed(4)
      const amount = `${Number(value).toLocaleString('az-AZ')} ${field.name === 'amount' ? 'AZN' : record.currency}`
      return record.currency === 'USD' ? <Tag className="bank-usd-amount-badge" color="blue">{amount}</Tag> : amount
    }
    if (field.name === 'paymentType') {
      const options = record.type === 'supplierRefund' ? refundTypeOptions : record.type === 'other' ? otherReceiptTypeOptions : paymentTypeOptions
      const payment = options.find((option) => option.value === value)
      return <Badge className="bank-payment-badge" color="var(--ant-color-primary)" text={payment?.label ?? String(value)} />
    }
    if (field.name === 'cashFlowItem' && record.type === 'other') return otherCashFlowOptions.find((option) => option.value === value)?.label ?? String(value)
    if (field.name === 'payer') {
      const companyName = String(value)
      return <Flex align="center" gap={8}><Avatar className="bank-company-avatar" size={24}>{companyName.charAt(0)}</Avatar><Text strong>{companyName}</Text></Flex>
    }
    return String(value)
  }
  const detailLabel = (field: FormField) => {
    const isDocument = field.name === 'contract' || field.name === 'annex' || field.name === 'invoice' || field.name === 'acceptanceDocument' || field.name === 'debitNote' || field.name === 'creditNote'
    const icon = field.name === 'date' ? <CalendarOutlined /> : field.name === 'paymentType' ? <CreditCardOutlined /> : field.name === 'payer' || field.name === 'employee' ? <UserOutlined /> : field.name === 'payerTin' ? <IdcardOutlined /> : field.name === 'recipientBank' ? <BankOutlined /> : field.name === 'recipientAccount' ? <WalletOutlined /> : field.name === 'currency' ? <GlobalOutlined /> : field.name === 'rate' ? <SwapOutlined /> : field.name === 'sequenceNumber' ? <ProfileOutlined /> : field.name === 'purpose' ? <FlagOutlined /> : field.name === 'note' ? <CommentOutlined /> : field.kind === 'amount' ? <DollarOutlined /> : isDocument ? <FileTextOutlined /> : <AuditOutlined />
    const tone = field.kind === 'amount' ? 'finance' : field.name === 'date' ? 'date' : field.name === 'payer' || field.name === 'employee' ? 'person' : field.name === 'recipientBank' || field.name === 'recipientAccount' ? 'bank' : isDocument ? 'document' : 'default'
    return <span className="bank-detail-label"><span className={`bank-detail-label-icon bank-detail-label-icon-${tone}`}>{icon}</span>{field.label}</span>
  }
  const viewedTemplate = viewRecord ? templates[viewRecord.type] : template
  const inboundTypeIcons: Record<InboundType, ReactNode> = {
    counterparty: <BankOutlined />,
    supplierRefund: <SwapOutlined />,
    counterpartyAdvance: <WalletOutlined />,
    accountableReturn: <UserOutlined />,
    loanReceipt: <CreditCardOutlined />,
    depositReceipt: <DollarOutlined />,
    other: <FileTextOutlined />,
  }
  const createFormGroups = [
    { key: 'payment', title: 'Ödəniş və bank məlumatları', description: 'Ödəyici, hesab və məbləğ məlumatlarını daxil edin.', icon: <CreditCardOutlined />, fields: template.fields.filter((field) => ['date', 'paymentType', 'payer', 'payerTin', 'employee', 'cashFlowItem', 'bankReference', 'recipientBank', 'recipientAccount', 'currency', 'rate', 'amountInCurrency', 'amount', 'principalAmountInCurrency', 'principalAmount', 'interestAmountInCurrency', 'interestAmount', 'creditAccount'].includes(field.name)) },
    { key: 'documents', title: 'Əlaqəli sənədlər', description: 'Müqavilə və digər sənəd rekvizitlərini əlavə edin.', icon: <FolderOpenOutlined />, fields: template.fields.filter((field) => ['sequenceNumber', 'contract', 'annex', 'acceptanceDocument', 'debitNote', 'creditNote', 'invoice'].includes(field.name)) },
    { key: 'notes', title: 'Əlavə məlumatlar', description: 'Ödəniş təyinatını və qeydləri qeyd edin.', icon: <CommentOutlined />, fields: template.fields.filter((field) => ['purpose', 'note'].includes(field.name)) },
  ]
  const detailGroups = viewRecord ? [
    { key: 'payment', title: 'Ödəniş və bank məlumatları', icon: <CreditCardOutlined />, fields: viewedTemplate.fields.filter((field) => ['date', 'paymentType', 'payer', 'payerTin', 'employee', 'cashFlowItem', 'bankReference', 'recipientBank', 'recipientAccount', 'currency', 'rate', 'vatRate', 'vatAmount', 'amountInCurrency', 'amount', 'principalAmountInCurrency', 'principalAmount', 'interestAmountInCurrency', 'interestAmount', 'creditAccount'].includes(field.name) && (field.name !== 'rate' || viewRecord.currency === 'USD' || viewRecord.currency === 'EUR')) },
    { key: 'documents', title: 'Əlaqəli sənədlər', icon: <FolderOpenOutlined />, fields: viewedTemplate.fields.filter((field) => ['sequenceNumber', 'contract', 'annex', 'acceptanceDocument', 'debitNote', 'creditNote', 'invoice'].includes(field.name)) },
    { key: 'notes', title: 'Əlavə məlumatlar', icon: <CommentOutlined />, fields: viewedTemplate.fields.filter((field) => ['purpose', 'note'].includes(field.name)) },
  ].filter((group) => group.fields.length > 0) : []

  return <section className="bank-accounts-page" aria-label={workspaceTitles[workspace]}>
    {contextHolder}
    {workspace === 'inbound' ? <>
      <Flex vertical gap={16}>
        <Card className="bank-toolbar-card">
          <Flex vertical gap={16}>
          <Flex className="page-toolbar bank-list-toolbar" justify="space-between" align="center" wrap gap={12}>
            <Input allowClear prefix={<SearchOutlined />} placeholder="Sənəd, ödəyici və ya məbləğ üzrə axtarış..." value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1) }} className="counterparty-search" />
            <Space wrap>
                <Segmented value={listView} onChange={(value) => setListView(value as 'table' | 'cards')} options={[{ value: 'cards', label: 'Kartlar', icon: <AppstoreOutlined /> }, { value: 'table', label: 'Cədvəl', icon: <TableOutlined /> }]} />
                <Dropdown trigger={['click']} menu={{
                  className: 'excel-actions-menu',
                  onClick: ({ key: action }) => {
                    if (action === 'template') downloadInboundTemplate()
                    if (action === 'filtered' && hasActiveFilters) exportInboundRecords(paymentType)
                    if (action === 'import') inboundUploadRef.current?.click()
                  },
                  items: [
                    { key: 'template', icon: <img className="excel-menu-logo" src="/logo/Microsoft_Excel-Logo.wine.png" alt="" />, label: <div className="excel-menu-content"><strong>Excel şablonu yüklə</strong><span>İdxal üçün nümunə fayl</span></div> },
                    { key: 'filtered', className: !hasActiveFilters ? 'excel-menu-item-disabled' : undefined, icon: <img className="excel-menu-logo" src="/logo/Microsoft_Excel-Logo.wine.png" alt="" />, label: <Tooltip title="Filter tətbiq etdikdə, filterli excel export edə bilərsiniz. Klikləyərək filter tətbiq edin." open={!hasActiveFilters && filterExportTooltipOpen}><span className="excel-menu-tooltip-target" aria-disabled={!hasActiveFilters} onMouseEnter={() => setFilterExportTooltipOpen(true)} onMouseLeave={() => setFilterExportTooltipOpen(false)}><span className="excel-menu-content"><strong>Filterli yüklə</strong><span>{hasActiveFilters ? 'Tətbiq edilmiş filterlər üzrə' : 'Filter tətbiq olunur'}</span></span></span></Tooltip> },
                    { key: 'import', icon: <img className="excel-menu-logo" src="/logo/Microsoft_Excel-Logo.wine.png" alt="" />, label: <div className="excel-menu-content"><strong>Excel-dən idxal et</strong><span>Fayldan yeni məlumatları əlavə et</span></div> },
                  ],
                }}><Button className="excel-export-button" icon={<img className="excel-logo" src="/logo/Microsoft_Excel-Logo.wine.png" alt="" />}>Excel <DownOutlined /></Button></Dropdown>
                <Tooltip title="Sütunları tənzimlə"><Button icon={<SettingOutlined />} aria-label="Cədvəl sütunlarını tənzimlə" onClick={() => setColumnSettingsOpen(true)} /></Tooltip>
                <Upload accept=".xls,.csv,.tsv" showUploadList={false} beforeUpload={importInboundRecords}><button ref={inboundUploadRef} type="button" className="hidden-upload-trigger" tabIndex={-1} aria-hidden="true" /></Upload>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openCreate(paymentType)}>Yeni daxilolma</Button>
            </Space>
          </Flex>
          </Flex>
        </Card>
        <Card className="bank-records-card">
          <Flex vertical gap={16}>
          {listView === 'table' ? <Table<InboundRecord> className="counterparty-data-table bank-data-table" rowKey="id" size="middle" columns={visibleTableColumns} dataSource={recordsForType(paymentType)} scroll={{ x: 4500 }} title={() => <Text type="secondary">{template.title} əməliyyatları</Text>} locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={`${template.title} üzrə əməliyyat yoxdur`} /> }} pagination={{ defaultPageSize: 5, showSizeChanger: true, showQuickJumper: true, showTotal: (total, range) => `${range[0]}–${range[1]} / ${total} əməliyyat` }} /> : <Flex vertical gap={16}>{recordsForType(paymentType).length === 0 ? <Empty description={`${template.title} üzrə əməliyyat yoxdur`} /> : <Row gutter={[16, 16]}>{recordsForType(paymentType).slice((currentPage - 1) * 6, currentPage * 6).map((record) => <Col key={record.id} xs={24} sm={12} xl={8}><Card size="small" className="bank-record-card" title={record.documentNumber} extra={<Tag color={record.status === 'posted' ? 'success' : 'default'}>{record.status === 'posted' ? 'Keçirilib' : 'Qaralama'}</Tag>} actions={[<Button key="view" type="link" icon={<EyeOutlined />} onClick={() => openView(record)}>Baxış</Button>]}><Text strong>{record.payer}</Text><Text type="secondary" className="bank-record-card-detail">{record.date} · {record.amount.toLocaleString('az-AZ')} {record.currency}</Text></Card></Col>)}</Row>}<Pagination current={currentPage} total={recordsForType(paymentType).length} pageSize={6} showSizeChanger={false} showQuickJumper={{ goButton: <Button type="primary" icon={<ArrowRightOutlined />} aria-label="Səhifəyə keç" /> }} onChange={setCurrentPage} /></Flex>}
          <Row className="bank-summary-grid" gutter={[0, 0]}>{inboundSummary.map((summary) => <Col key={summary.key} xs={24} sm={12} lg={6}><Card className={`bank-summary-box ${summary.className}`} variant="borderless"><Flex align="center" gap={16}><span className="bank-summary-icon">{summary.icon}</span><Flex vertical gap={2}><Text className="bank-summary-label">{summary.label} (AZN)</Text><Text strong className="bank-summary-amount">{summary.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text><Text type="secondary" className="bank-summary-period">Bu ay</Text></Flex></Flex></Card></Col>)}</Row>
        </Flex>
      </Card>
      </Flex>
    </> : <Card className="bank-empty-workspace"><Table<InboundRecord> rowKey="id" size="middle" columns={tableColumns} dataSource={[]} scroll={{ x: 720 }} locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={`${workspaceTitles[workspace]} üzrə əməliyyat yoxdur`} /> }} pagination={{ pageSize: 5, showSizeChanger: true, showTotal: (total) => `Cəmi ${total} əməliyyat` }} /></Card>}

    <Drawer className="bank-payment-drawer" title={<Flex className="bank-drawer-heading" align="center" gap={12}><span className="drawer-title-icon"><DollarOutlined /></span><div><Title level={4}>{viewRecord ? viewedTemplate.title : selectedCreateType ? template.title : 'Yeni daxilolma'}</Title><Text type="secondary">{viewRecord ? 'Əməliyyat məlumatlarına baxış' : selectedCreateType ? 'Məlumatları bölmələr üzrə tamamlayın' : 'Əvvəl daxilolma əməliyyatının növünü seçin'}</Text></div></Flex>} placement="right" closable={{ placement: 'end' }} size="min(98vw, 1400px)" open={drawerOpen} onClose={() => setDrawerOpen(false)} footer={viewRecord ? <Flex justify="flex-end"><Button onClick={() => setDrawerOpen(false)}>Bağla</Button></Flex> : selectedCreateType ? <Flex justify="flex-end" gap={8} wrap><Button onClick={() => setDrawerOpen(false)}>Ləğv et</Button><Button onClick={() => { setSelectedCreateType(null); form.resetFields() }}>Geri</Button><Button type="primary" icon={<SaveOutlined />} loading={isSaving} onClick={savePayment}>Yadda saxla</Button></Flex> : null}>
      {!viewRecord && !selectedCreateType && <Flex className="bank-operation-chooser" vertical gap={16}><Text strong>Daxilolma növünü seçin</Text><Row gutter={[16, 16]}>{inboundChooserTypes.map(({ key, label, description }) => <Col key={key} xs={24} sm={12} lg={8}><Card hoverable role="button" tabIndex={0} aria-label={label} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.currentTarget.click() } }} className={`bank-operation-option bank-operation-option-${key}`} onClick={() => { setPaymentType(key); setSelectedCreateType(key); form.resetFields(); form.setFieldsValue({ sequenceNumber: `IP-${new Date().getFullYear()}-${String(records.length + 1).padStart(6, '0')}`, date: new Date().toISOString().slice(0, 10), distributionRows: initialDistributionRows(key) }) }}><Flex gap={12} align="center"><span className="bank-operation-option-icon">{inboundTypeIcons[key]}</span><Flex vertical gap={2}><Text strong>{label}</Text><Text type="secondary">{description}</Text></Flex></Flex></Card></Col>)}</Row></Flex>}
      {!viewRecord && selectedCreateType && <Form className="bank-sectioned-form" form={form} layout="vertical" size="large" requiredMark="optional">{selectedCreateType === 'counterparty' || selectedCreateType === 'supplierRefund' || selectedCreateType === 'other' ? <InboundPaymentForm form={form} type={selectedCreateType} /> : <Flex vertical gap={16}>{createFormGroups.map((group) => <Card key={group.key} className="bank-form-section" title={<Flex align="center" gap={10}><span className={`bank-form-section-icon bank-form-section-icon-${group.key}`}>{group.icon}</span><div><Text strong>{group.title}</Text><Text type="secondary" className="bank-form-section-description">{group.description}</Text></div></Flex>}><Row gutter={16}>{group.fields.map((field) => <PaymentField key={field.name} field={field} />)}</Row></Card>)}</Flex>}</Form>}
      {viewRecord ? <Flex className="bank-record-details" vertical gap={16}><Card size="small" title={<span className="bank-detail-group-title bank-detail-group-title-info"><InfoCircleOutlined />Əməliyyat məlumatları</span>}><Descriptions column={1} size="small" items={[{ key: 'documentNumber', label: <span className="bank-detail-label"><span className="bank-detail-label-icon bank-detail-label-icon-document"><FileTextOutlined /></span>Sənəd nömrəsi</span>, children: viewRecord.documentNumber }, { key: 'status', label: <span className="bank-detail-label"><span className="bank-detail-label-icon bank-detail-label-icon-default"><AuditOutlined /></span>Status</span>, children: <Tag color={viewRecord.status === 'posted' ? 'success' : 'default'}>{viewRecord.status === 'posted' ? 'Keçirilib' : 'Qaralama'}</Tag> }, { key: 'createdAt', label: <span className="bank-detail-label"><span className="bank-detail-label-icon bank-detail-label-icon-date"><CalendarOutlined /></span>Yaradılma tarixi</span>, children: viewRecord.createdAt }, { key: 'createdBy', label: <span className="bank-detail-label"><span className="bank-detail-label-icon bank-detail-label-icon-person"><UserOutlined /></span>Yaradan</span>, children: viewRecord.createdBy }, { key: 'approval', label: <span className="bank-detail-label"><span className="bank-detail-label-icon bank-detail-label-icon-default"><CheckCircleOutlined /></span>Təsdiq statusu</span>, children: <Tag color={viewRecord.approvalStatus === 'approved' ? 'success' : 'warning'}>{viewRecord.approvalStatus === 'approved' ? 'Təsdiqlənib' : 'Gözləyir'}</Tag> }, { key: 'costCenter', label: <span className="bank-detail-label"><span className="bank-detail-label-icon bank-detail-label-icon-default"><AuditOutlined /></span>Xərc mərkəzi</span>, children: viewRecord.costCenter }, { key: 'project', label: <span className="bank-detail-label"><span className="bank-detail-label-icon bank-detail-label-icon-document"><ProjectOutlined /></span>Layihə</span>, children: viewRecord.project }]} /></Card>{detailGroups.map((group) => <Card key={group.key} size="small" title={<span className={`bank-detail-group-title bank-detail-group-title-${group.key}`}>{group.icon}{group.title}</span>}><Descriptions column={1} size="small" items={group.fields.map((field) => ({ key: field.name, label: detailLabel(field), children: detailValue(field, viewRecord) }))} /></Card>)}</Flex> : null}
    </Drawer>
    <Drawer title={<Space><SettingOutlined /><span>Cədvəl sütunları</span></Space>} placement="right" size="min(94vw, 390px)" open={columnSettingsOpen} onClose={() => setColumnSettingsOpen(false)} closable={{ placement: 'end' }} footer={<Flex justify="space-between"><Button onClick={() => { setVisibleColumnKeys(defaultColumnKeys); setColumnOrder(defaultColumnKeys); setFixedColumns({ type: 'left', view: 'right' }); setHasColumnVisibilityChanges(false) }}>Standarta qaytar</Button><Button type="primary" onClick={() => setColumnSettingsOpen(false)}>Hazırdır</Button></Flex>}>
      <Text type="secondary">Sütunları göstərin, sıralayın və sabitləyin. Sabit sütunlar üfüqi sürüşdürmə zamanı görünən qalır.</Text>
      <Divider />
      <Flex vertical gap={20} className="column-settings-sections">
        <section aria-labelledby="inbound-column-order-title"><Text strong id="inbound-column-order-title">Sütunların sırası</Text><Text type="secondary" className="column-settings-section-description">Sütunları sürükləyərək cədvəldəki yerlərini dəyişin.</Text><Flex vertical gap={8} className="column-settings-list">{columnOrder.map((key, index) => <div key={key} className={`column-settings-row${draggedColumnKey === key ? ' column-settings-row-dragging' : ''}`} draggable onDragStart={() => setDraggedColumnKey(key)} onDragOver={(event) => event.preventDefault()} onDrop={() => moveColumn(key)} onDragEnd={() => setDraggedColumnKey(null)}><HolderOutlined className="column-drag-handle" /><Checkbox checked={visibleColumnKeys.includes(key)} disabled={key === 'type' || key === 'view'} onChange={(event) => { setHasColumnVisibilityChanges(true); setVisibleColumnKeys((current) => event.target.checked ? [...current, key] : current.filter((columnKey) => columnKey !== key)) }}>{columnLabels[key]}</Checkbox><Flex className="column-order-actions" gap={4}><Tooltip title="Yuxarı köçür"><Button type="text" icon={<ArrowUpOutlined />} disabled={index === 0} aria-label={`${columnLabels[key]} sütununu yuxarı köçür`} onClick={() => reorderColumn(key, -1)} /></Tooltip><Tooltip title="Aşağı köçür"><Button type="text" icon={<ArrowDownOutlined />} disabled={index === columnOrder.length - 1} aria-label={`${columnLabels[key]} sütununu aşağı köçür`} onClick={() => reorderColumn(key, 1)} /></Tooltip></Flex></div>)}</Flex></section>
        <section aria-labelledby="inbound-column-fixed-title"><Text strong id="inbound-column-fixed-title">Sabit sütunlar</Text><Text type="secondary" className="column-settings-section-description">Sürüşdürmə zamanı görünən qalacaq sütunları seçin.</Text><Flex vertical gap={8} className="column-settings-list">{columnOrder.map((key) => <div key={key} className="column-fixed-row"><Text>{columnLabels[key]}</Text><Space className="column-fixed-controls" size={6}><Text type="secondary">{fixedColumns[key] ? 'Aktiv' : 'Passiv'}</Text><Switch size="small" checked={Boolean(fixedColumns[key])} disabled={key === 'type' || key === 'view'} aria-label={`${columnLabels[key]} sütununu sabitləmək`} onChange={(checked) => setFixedColumns((current) => { if (!checked) { const next = { ...current }; delete next[key]; return next } return { ...current, [key]: key === 'view' ? 'right' : 'left' } })} />{fixedColumns[key] && <Select size="small" value={fixedColumns[key]} aria-label={`${columnLabels[key]} sabitləmə tərəfi`} style={{ width: 76 }} options={[{ value: 'left', label: 'Sol' }, { value: 'right', label: 'Sağ' }]} disabled={key === 'type' || key === 'view'} onChange={(value: FixedColumnPosition) => setFixedColumns((current) => ({ ...current, [key]: value }))} />}</Space></div>)}</Flex></section>
      </Flex>
    </Drawer>
  </section>
}
