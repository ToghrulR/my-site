import { useEffect, useMemo, useRef, useState } from 'react'
import countries from 'i18n-iso-countries'
import azCountries from 'i18n-iso-countries/langs/az.json'
import {
  AppstoreOutlined,
  ArrowRightOutlined,
  BankOutlined,
  CheckCircleFilled,
  DeleteOutlined,
  DownOutlined,
  ShopOutlined,
    CloseOutlined,
    SettingOutlined,
  GlobalOutlined,
  EditOutlined,
  IdcardOutlined,
  PlusOutlined,
  SaveOutlined,
  SearchOutlined,
  SwapOutlined,
  TableOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  Badge,
  Button,
  Card,
  Col,
  Collapse,
  Drawer,
  Dropdown,
  Empty,
  Flex,
  Form,
  Input,
  message,
  Pagination,
  Radio,
  Row,
  Segmented,
  Select,
  Space,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  Upload,
  Switch,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { UploadProps } from 'antd'
import { CustomDataTable } from './components/CustomDataTable'

const { Text, Title } = Typography

interface Counterparty {
  id: string
  name: string
  contact: string
  createdAt: string
  updatedAt: string
  role: 'Customer' | 'Supplier' | 'Both'
  legalStatus: 'Legal entity' | 'Individual entrepreneur' | 'Individual'
  color: 'cyan' | 'blue' | 'green'
  formValues?: CounterpartyFormValues
}

interface CounterpartyFormValues {
  name: string
  shortName?: string
  role: Counterparty['role']
  legalStatus: Counterparty['legalStatus']
  taxId?: string
  status?: 'active' | 'inactive'
  contact?: string
  position?: string
  notes?: string
  bankAccounts?: BankAccountFormValues[]
  taxRegime?: string
  vatPayer?: boolean
  vatNumber?: string
  country?: string
  city?: string
  address?: string
  phoneCountryCode?: string
  phone?: string
  email?: string
  website?: string
}

interface BankAccountFormValues {
  bankId?: number
  bankCode?: string
  bankTaxId?: string
  correspondentAccount?: string
  bankCountry?: string
  iban?: string
  swift?: string
  currency: string
  isActive?: boolean
  isPrimary?: boolean
}

interface CurrencyOption {
  value: string
  countryCode?: string
  countryName: string
  currencyName: string
  symbol: string
  searchText: string
}

interface BankRecord {
  id: number
  name: string
  code: string
  taxId: string
  correspondentAccount: string
  swift: string
  countryCode: string
}

countries.registerLocale(azCountries)

const banks: BankRecord[] = [
  { id: 1, name: 'Access Bank QSC', code: '505000', taxId: '1400057421', correspondentAccount: 'AZ54NABZ01350100000003056944', swift: 'ACABAZ22', countryCode: 'AZ' },
  { id: 2, name: 'AFB Bank ASC', code: '503217', taxId: '1301703781', correspondentAccount: 'AZ28NABZ01350100000003091944', swift: 'AZFIAZ22', countryCode: 'AZ' },
  { id: 3, name: 'Azərbaycan Beynəlxalq Bankı ASC', code: '805250', taxId: '9900001881', correspondentAccount: 'AZ47NABZ01350100000003002944', swift: 'IBAZAZ2X', countryCode: 'AZ' },
  { id: 4, name: 'Azərbaycan Sənaye Bankı ASC', code: '509664', taxId: '9900007981', correspondentAccount: 'AZ56NABZ01350100000003016944', swift: 'CAPNAZ22', countryCode: 'AZ' },
  { id: 5, name: 'Azər-Türk Bank ASC', code: '507699', taxId: '9900006111', correspondentAccount: 'AZ46NABZ01350100000003022944', swift: 'AZRTAZ22', countryCode: 'AZ' },
  { id: 6, name: 'Bank Avrasiya ASC', code: '505129', taxId: '1700792251', correspondentAccount: 'AZ92NABZ01350100000003072944', swift: 'AVRAAZ22', countryCode: 'AZ' },
  { id: 7, name: 'Bank of Baku ASC', code: '506924', taxId: '1700038881', correspondentAccount: 'AZ71NABZ01350100000003007944', swift: 'JBBKAZ22', countryCode: 'AZ' },
  { id: 8, name: 'Bank Respublika ASC', code: '505668', taxId: '9900001901', correspondentAccount: 'AZ27NABZ01350100000003014944', swift: 'BRESAZ22', countryCode: 'AZ' },
  { id: 9, name: 'Bank VTB (Azerbaijan) ASC', code: '506623', taxId: '1400117231', correspondentAccount: 'AZ59NABZ01350100000003053944', swift: 'VTBAZ22', countryCode: 'AZ' },
  { id: 10, name: 'Bank BTB ASC', code: '501145', taxId: '1302164881', correspondentAccount: 'AZ57NABZ01350100000003093944', swift: 'BBTBAZ22', countryCode: 'AZ' },
  { id: 11, name: 'Expressbank ASC', code: '505099', taxId: '1500031691', correspondentAccount: 'AZ55NABZ01350100000003036944', swift: 'AZENAZ22', countryCode: 'AZ' },
  { id: 12, name: 'Xalq Bank ASC', code: '505055', taxId: '2000296061', correspondentAccount: 'AZ68NABZ01350100000003067944', swift: 'HAJCAZ22', countryCode: 'AZ' },
  { id: 13, name: 'Kapital Bank ASC', code: '200004', taxId: '9900003611', correspondentAccount: 'AZ81NABZ01350100000003001944', swift: 'AIIBAZ2X', countryCode: 'AZ' },
  { id: 14, name: 'Melli İran Bankı Bakı filialı', code: '509761', taxId: '1300036291', correspondentAccount: 'AZ21NABZ01350100000003037944', swift: 'MELIAZ22', countryCode: 'AZ' },
  { id: 15, name: 'PAŞA Bank ASC', code: '505141', taxId: '1700767721', correspondentAccount: 'AZ29NABZ01350100000003071944', swift: 'PAHAAZ22', countryCode: 'AZ' },
  { id: 16, name: 'Premium Bank ASC', code: '507473', taxId: '9900006241', correspondentAccount: 'AZ17NABZ01350100000003020944', swift: 'AZALAZ22', countryCode: 'AZ' },
  { id: 17, name: 'Rabitabank ASC', code: '506399', taxId: '9900001061', correspondentAccount: 'AZ08NABZ01350100000003006944', swift: 'RBTAZ22', countryCode: 'AZ' },
  { id: 18, name: 'TuranBank ASC', code: '507462', taxId: '1300016391', correspondentAccount: 'AZ70NABZ01350100000003027944', swift: 'TURAAZ22', countryCode: 'AZ' },
  { id: 19, name: 'Unibank KB ASC', code: '505754', taxId: '1300017201', correspondentAccount: 'AZ90NABZ01350100000003015944', swift: 'UBAZAZ22', countryCode: 'AZ' },
  { id: 20, name: 'Yapı Kredi Bank Azərbaycan QSC', code: '509987', taxId: '9900009021', correspondentAccount: 'AZ95NABZ01350100000003012944', swift: 'KABAAZ22', countryCode: 'AZ' },
  { id: 21, name: 'Yelo Bank ASC', code: '507064', taxId: '9900014901', correspondentAccount: 'AZ45NABZ01350100000003042944', swift: 'NICBAZ22', countryCode: 'AZ' },
  { id: 22, name: 'Ziraat Bank Azərbaycan ASC', code: '512372', taxId: '1303953611', correspondentAccount: 'AZ42NABZ01350100000000095944', swift: 'TCZBAZ22', countryCode: 'AZ' },
]

const countryFlag = (code: string) =>
  code.toUpperCase().replace(/[A-Z]/g, (letter) => String.fromCodePoint(127397 + letter.charCodeAt(0)))

const countryOptions = Object.entries(countries.getNames('az', { select: 'official' }))
  .map(([code, name]) => ({ value: code, label: `${countryFlag(code)}  ${name}`, searchText: name }))
  .sort((a, b) => a.searchText.localeCompare(b.searchText))

const phoneCountryOptions = [
  { country: 'AZ', code: '+994' }, { country: 'TR', code: '+90' }, { country: 'GE', code: '+995' },
  { country: 'RU', code: '+7' }, { country: 'UA', code: '+380' }, { country: 'KZ', code: '+7' },
  { country: 'US', code: '+1' }, { country: 'GB', code: '+44' }, { country: 'DE', code: '+49' },
  { country: 'FR', code: '+33' }, { country: 'IT', code: '+39' }, { country: 'ES', code: '+34' },
  { country: 'NL', code: '+31' }, { country: 'CH', code: '+41' }, { country: 'AE', code: '+971' },
  { country: 'SA', code: '+966' }, { country: 'IL', code: '+972' }, { country: 'IR', code: '+98' },
  { country: 'IN', code: '+91' }, { country: 'CN', code: '+86' }, { country: 'JP', code: '+81' },
].map(({ country, code }) => ({
  value: `${country}:${code}`,
  label: `${countryFlag(country)} ${code}`,
  searchText: `${countries.getName(country, 'az') ?? country} ${code}`,
}))

const currencyCountryCodes: Record<string, string> = {
  AED: 'AE', AUD: 'AU', AZN: 'AZ', BGN: 'BG', BRL: 'BR', CAD: 'CA', CHF: 'CH', CNY: 'CN',
  CZK: 'CZ', DKK: 'DK', EGP: 'EG', EUR: 'DE', GBP: 'GB', GEL: 'GE', HKD: 'HK', HUF: 'HU',
  IDR: 'ID', ILS: 'IL', INR: 'IN', JPY: 'JP', KGS: 'KG', KRW: 'KR', KZT: 'KZ', MDL: 'MD',
  MXN: 'MX', MYR: 'MY', NOK: 'NO', NZD: 'NZ', PLN: 'PL', QAR: 'QA', RON: 'RO', RUB: 'RU',
  SAR: 'SA', SEK: 'SE', SGD: 'SG', THB: 'TH', TRY: 'TR', TWD: 'TW', UAH: 'UA', USD: 'US',
  UZS: 'UZ', VND: 'VN', ZAR: 'ZA',
}

const currencyOptions: CurrencyOption[] = Intl.supportedValuesOf('currency').map((currency) => {
  const countryCode = currencyCountryCodes[currency]
  const countryName = countryCode ? countries.getName(countryCode, 'az') ?? countryCode : 'Beynəlxalq'
  const currencyName = new Intl.DisplayNames(['az'], { type: 'currency' }).of(currency) ?? currency
  const symbol = new Intl.NumberFormat('az-AZ', { style: 'currency', currency, currencyDisplay: 'narrowSymbol' })
    .formatToParts(0)
    .find((part) => part.type === 'currency')?.value ?? currency

  return { value: currency, countryCode, countryName, currencyName, symbol, searchText: `${countryName} ${currencyName} ${currency}` }
}).sort((a, b) => a.searchText.localeCompare(b.searchText, 'az'))

const currencyVisuals: Record<string, { color: string }> = {
  AZN: { color: 'cyan' },
  EUR: { color: 'blue' },
  GBP: { color: 'purple' },
  USD: { color: 'green' },
  default: { color: 'geekblue' },
}

const getCurrencyVisual = (currency?: string) => currencyVisuals[currency ?? ''] ?? currencyVisuals.default

const initialCounterparties: Counterparty[] = ([
  { id: '1', name: 'Azersun Holding', contact: 'Anar Məmmədov', createdAt: '2026-08-01', updatedAt: '2026-08-22', role: 'Customer', legalStatus: 'Legal entity', color: 'cyan' },
  { id: '2', name: 'Pasha Holding', contact: 'Leyla Əliyeva', createdAt: '2026-08-02', updatedAt: '2026-08-22', role: 'Supplier', legalStatus: 'Legal entity', color: 'green' },
  { id: '3', name: 'SOCAR Trading', contact: 'Rəşad İbrahimov', createdAt: '2026-08-03', updatedAt: '2026-08-23', role: 'Both', legalStatus: 'Legal entity', color: 'cyan' },
  ...['Azerbaijan Railways', 'Baku Steel Company', 'Azerbaijan Airlines', 'Sumgayit Technologies Park', 'AGBank', 'Gilan Holding', 'Norm Cement', 'Azersun Dairy', 'Turan Bank', 'Silk Way Group', 'Veysəloğlu Group', 'AtaHolding', 'Akkord Industry', 'Baku Electronics', 'Improtex Group', 'Avrora Group', 'Gilan Textile Park', 'Caspian European Club', 'Araz Supermarket', 'Kontakt Home', 'Optimal Electronics'].map((name, index) => ({ id: String(index + 4), name, contact: ['Gül Həsənova', 'Elvin Quliyev', 'Nigar Əhmədova'][index % 3], createdAt: '2026-08-10', updatedAt: '2026-08-25', role: (index % 3 === 0 ? 'Customer' : index % 3 === 1 ? 'Supplier' : 'Both') as Counterparty['role'], legalStatus: 'Legal entity' as const, color: (['cyan', 'blue', 'green'] as const)[index % 3] })),
 ] as Counterparty[]).map((item, index): Counterparty => ({
  ...item,
  formValues: {
    name: item.name,
    shortName: item.name.split(' ')[0],
    role: item.role,
    legalStatus: item.legalStatus,
    taxId: `14${String(10000000 + index * 137).slice(-8)}`,
    contact: item.contact,
    position: ['Baş mühasib', 'Satınalma meneceri', 'Maliyyə direktoru'][index % 3],
    status: index % 9 === 0 ? 'inactive' : 'active',
    taxRegime: index % 4 === 0 ? 'Not a VAT payer' : 'VAT payer',
    country: index % 5 === 0 ? 'TR' : 'AZ',
    city: index % 5 === 0 ? 'İstanbul' : ['Bakı', 'Sumqayıt', 'Gəncə'][index % 3],
    address: `${['Nizami', 'Xətai', 'Heydər Əliyev'][index % 3]} küçəsi, ${index + 12}`,
    phoneCountryCode: index % 5 === 0 ? 'TR:+90' : 'AZ:+994',
    phone: `50 ${String(2000000 + index * 731).slice(-7, -4)} ${String(2000000 + index * 731).slice(-4, -2)} ${String(2000000 + index * 731).slice(-2)}`,
    email: `elaqe${index + 1}@${item.name.toLowerCase().replaceAll(/[^a-z0-9]/g, '')}.az`,
    website: `https://www.${item.name.toLowerCase().replaceAll(/[^a-z0-9]/g, '')}.az`,
    notes: index % 3 === 0 ? 'Müqavilə şərtləri hər rüb yenilənir.' : 'Standart ödəniş şərtləri tətbiq olunur.',
    bankAccounts: [{ bankId: (index % banks.length) + 1, iban: `AZ${String(10 + index).padStart(2, '0')}NABZ0135010000000${String(3056944 + index).padStart(7, '0')}`, currency: index % 4 === 0 ? 'USD' : 'AZN', isActive: true, isPrimary: true }],
  },
}))

const roleColors: Record<Counterparty['role'], string> = {
  Customer: 'blue',
  Supplier: 'green',
  Both: 'purple',
}

const legalColors: Record<Counterparty['legalStatus'], string> = {
  'Legal entity': 'default',
  'Individual entrepreneur': 'geekblue',
  Individual: 'orange',
}

const roleLabels: Record<Counterparty['role'], string> = {
  Customer: 'Müştəri',
  Supplier: 'Təchizatçı',
  Both: 'Hər ikisi',
}

const legalLabels: Record<Counterparty['legalStatus'], string> = {
  'Legal entity': 'Hüquqi şəxs',
  'Individual entrepreneur': 'Fərdi sahibkar',
  Individual: 'Fiziki şəxs',
}

function FormSection({ icon, title, description, children }: { icon: React.ReactNode; title: string; description: string; children: React.ReactNode }) {
  return (
    <Card className="form-section" variant="borderless">
      <Flex gap={12} align="flex-start">
        <span className="section-icon">{icon}</span>
        <div>
          <Text strong>{title}</Text>
          <Text type="secondary" className="section-description">{description}</Text>
        </div>
      </Flex>
      <div className="section-fields">{children}</div>
    </Card>
  )
}

export function CounterpartiesPage() {
  const [form] = Form.useForm<CounterpartyFormValues>()
  const paginationPanelRef = useRef<HTMLDivElement>(null)
  const counterpartyUploadRef = useRef<HTMLButtonElement>(null)
  const [counterparties, setCounterparties] = useState(initialCounterparties)
  const [search, setSearch] = useState('')
  const [filterExportTooltipOpen, setFilterExportTooltipOpen] = useState(false)
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})
  const [view, setView] = useState<'cards' | 'table'>('table')
  const [tableSettingsOpen, setTableSettingsOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [messageApi, contextHolder] = message.useMessage()
  const bankAccounts = Form.useWatch('bankAccounts', form) ?? []
  const hasActiveFilters = Boolean(search.trim() || Object.values(columnFilters).some(Boolean))

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return counterparties.filter((item) => {
      const bankNames = (item.formValues?.bankAccounts ?? []).map((account) => banks.find((bank) => bank.id === account.bankId)?.name ?? '').join(' ')
      const matchesGlobal = !query || `${item.name} ${item.contact} ${item.createdAt} ${item.updatedAt} ${bankNames} ${Object.values(item.formValues ?? {}).flatMap((value) => Array.isArray(value) ? value.map((account) => Object.values(account).join(' ')) : String(value)).join(' ')}`.toLowerCase().includes(query)
      const values: Record<string, string> = {
        name: item.name, taxId: item.formValues?.taxId ?? '', role: roleLabels[item.role], contact: item.contact,
        phone: `${item.formValues?.phoneCountryCode ?? ''} ${item.formValues?.phone ?? ''}`, email: item.formValues?.email ?? '', status: item.formValues?.status === 'inactive' ? 'Passiv' : 'Aktiv',
        taxRegime: item.formValues?.taxRegime ?? '', shortName: item.formValues?.shortName ?? '', city: item.formValues?.city ?? '', country: item.formValues?.country ?? '', legalStatus: legalLabels[item.legalStatus],
        position: item.formValues?.position ?? '', address: item.formValues?.address ?? '', bankName: bankNames, iban: item.formValues?.bankAccounts?.[0]?.iban ?? '', notes: item.formValues?.notes ?? '', createdAt: item.createdAt, updatedAt: item.updatedAt,
      }
      const matchesColumns = Object.entries(columnFilters).every(([key, value]) => !value || values[key]?.toLowerCase().includes(value.toLowerCase()))
      return matchesGlobal && matchesColumns
    })
  }, [counterparties, search, columnFilters])

  useEffect(() => {
    const quickJumperInput = paginationPanelRef.current?.querySelector<HTMLInputElement>(
      '.ant-pagination-options-quick-jumper input',
    )

    if (quickJumperInput) {
      quickJumperInput.placeholder = '№'
      quickJumperInput.setAttribute('aria-label', 'Səhifə nömrəsi')
    }
  }, [view, filtered.length])

  const openCreateDrawer = () => {
    form.resetFields()
    form.setFieldsValue({ role: 'Customer', legalStatus: 'Legal entity', status: 'active', bankAccounts: [{ currency: 'AZN', isActive: true, isPrimary: true }], country: 'AZ', phoneCountryCode: 'AZ:+994' })
    setEditingId(null)
    setActiveTab('general')
    setDrawerOpen(true)
  }

  const openEditDrawer = (item: Counterparty) => {
    form.resetFields()
    form.setFieldsValue({
      role: item.role,
      legalStatus: item.legalStatus,
      bankAccounts: [{ currency: 'AZN', isActive: true, isPrimary: true }],
      country: 'AZ',
      phoneCountryCode: 'AZ:+994',
      ...item.formValues,
      name: item.name,
      contact: item.contact,
    })
    setEditingId(item.id)
    setActiveTab('general')
    setDrawerOpen(true)
  }

  const exportToExcel = () => {
    const escapeCell = (value: string) => value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')

    const rows = filtered.map((item) => `
      <tr>
        <td>${escapeCell(item.name)}</td>
        <td>${escapeCell(item.contact)}</td>
        <td>${escapeCell(roleLabels[item.role])}</td>
        <td>${escapeCell(legalLabels[item.legalStatus])}</td>
      </tr>`).join('')
    const workbook = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><table><thead><tr><th>Kontragent</th><th>Əlaqədar şəxs</th><th>Əlaqə növü</th><th>Hüquqi status</th></tr></thead><tbody>${rows}</tbody></table></body></html>`
    const url = URL.createObjectURL(new Blob(['\ufeff', workbook], { type: 'application/vnd.ms-excel;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `kontragentler-${new Date().toISOString().slice(0, 10)}.xls`
    link.click()
    URL.revokeObjectURL(url)
    messageApi.success(`${filtered.length} kontragent Excel faylına ixrac edildi`)
  }

  const downloadImportTemplate = () => {
    const workbook = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><table><thead><tr><th>Kontragent</th><th>Əlaqədar şəxs</th><th>Əlaqə növü</th><th>Hüquqi status</th></tr></thead><tbody><tr><td>Nümunə şirkət</td><td>Ad Soyad</td><td>Müştəri</td><td>Hüquqi şəxs</td></tr></tbody></table></body></html>`
    const url = URL.createObjectURL(new Blob(['\ufeff', workbook], { type: 'application/vnd.ms-excel;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'kontragent-idxal-sablonu.xls'
    link.click()
    URL.revokeObjectURL(url)
    messageApi.success('İdxal şablonu yükləndi')
  }

  const importFromExcel: UploadProps['beforeUpload'] = async (file) => {
    try {
      const content = await file.text()
      const rows = /<table/i.test(content)
        ? Array.from(new DOMParser().parseFromString(content, 'text/html').querySelectorAll('tbody tr')).map((row) =>
            Array.from(row.querySelectorAll('td')).map((cell) => cell.textContent?.trim() ?? ''),
          )
        : content.split(/\r?\n/).slice(1).filter(Boolean).map((row) => row.split(row.includes(';') ? ';' : ',').map((cell) => cell.trim().replace(/^"|"$/g, '')))

      const imported = rows.filter((row) => row[0]).map<Counterparty>((row, index) => ({
        id: crypto.randomUUID(),
        name: row[0],
        contact: row[1] || '—',
        createdAt: new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString().slice(0, 10),
        role: (Object.entries(roleLabels).find(([, label]) => label === row[2])?.[0] as Counterparty['role']) ?? 'Customer',
        legalStatus: (Object.entries(legalLabels).find(([, label]) => label === row[3])?.[0] as Counterparty['legalStatus']) ?? 'Legal entity',
        color: (['cyan', 'blue', 'green'] as const)[index % 3],
      }))

      if (!imported.length) throw new Error('empty')
      setCounterparties((current) => [...current, ...imported])
      messageApi.success(`${imported.length} kontragent Excel-dən idxal edildi`)
    } catch {
      messageApi.error('Fayl oxunmadı. Sistem ixracından alınmış XLS və ya CSV faylı seçin.')
    }
    return Upload.LIST_IGNORE
  }

  const columnLabels: Record<string, string> = { name: 'Tam / hüquqi adı', taxId: 'VÖEN', role: 'Əlaqə növü', contact: 'Əlaqədar şəxs', phone: 'Telefon', email: 'E-poçt', status: 'Status', taxRegime: 'ƏDV statusu', shortName: 'Qısa ad', city: 'Şəhər', country: 'Ölkə', legalStatus: 'Hüquqi status', position: 'Əlaqədar şəxsin vəzifəsi', address: 'Ünvan', bankName: 'Bank adı', iban: 'IBAN / Hesab nömrəsi', notes: 'Qeyd', createdAt: 'Yaradılma tarixi', updatedAt: 'Son dəyişiklik tarixi' }
  const columnDefinitions: Record<string, ColumnsType<Counterparty>[number]> = {
    name: {
      title: <Flex vertical gap={8}><Space size={6}><ShopOutlined /><span>Tam / hüquqi adı</span></Space><Input size="small" allowClear placeholder="Ad üzrə axtar" value={columnFilters.name} onClick={(event) => event.stopPropagation()} onChange={(event) => setColumnFilters((current) => ({ ...current, name: event.target.value }))} /></Flex>,
      dataIndex: 'name',
      key: 'name',
      width: 280,
      fixed: 'left',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name: string, item) => (
        <Flex align="center" gap={10}>
          <span className={`table-company-icon company-avatar-${item.color}`}><ShopOutlined /></span>
          <Text strong>{name}</Text>
        </Flex>
      ),
    },
    contact: { title: <Flex vertical gap={8}><Space size={6}><UserOutlined /><span>Əlaqədar şəxs</span></Space><Input size="small" allowClear placeholder="Ad üzrə axtar" value={columnFilters.contact} onClick={(event) => event.stopPropagation()} onChange={(event) => setColumnFilters((current) => ({ ...current, contact: event.target.value }))} /></Flex>, dataIndex: 'contact', key: 'contact', width: 190, render: (contact: string) => <Space size={6}><UserOutlined /><span>{contact}</span></Space> },
    role: { title: <Flex vertical gap={8}><span>Əlaqə növü</span><Select size="small" allowClear placeholder="Hamısı" value={columnFilters.role} onClick={(event) => event.stopPropagation()} onChange={(value) => setColumnFilters((current) => ({ ...current, role: value }))} options={Object.entries(roleLabels).map(([value, label]) => ({ value, label }))} /></Flex>, dataIndex: 'role', key: 'role', width: 165, render: (value: Counterparty['role']) => <Tag color={roleColors[value]} icon={<SwapOutlined />}>{roleLabels[value]}</Tag> },
    legalStatus: { title: <Flex vertical gap={8}><span>Hüquqi status</span><Select size="small" allowClear placeholder="Hamısı" value={columnFilters.legalStatus} onClick={(event) => event.stopPropagation()} onChange={(value) => setColumnFilters((current) => ({ ...current, legalStatus: value }))} options={Object.entries(legalLabels).map(([value, label]) => ({ value, label }))} /></Flex>, dataIndex: 'legalStatus', key: 'legalStatus', width: 180, render: (value: Counterparty['legalStatus']) => <Tag color={legalColors[value]} icon={<ShopOutlined />}>{legalLabels[value]}</Tag> },
    taxId: { title: <Flex vertical gap={8}><Space size={6}><IdcardOutlined /><span>VÖEN</span></Space><Input size="small" allowClear placeholder="VÖEN üzrə axtar" value={columnFilters.taxId} onClick={(event) => event.stopPropagation()} onChange={(event) => setColumnFilters((current) => ({ ...current, taxId: event.target.value }))} /></Flex>, key: 'taxId', width: 150, fixed: 'left', render: (_, item) => item.formValues?.taxId || <Text type="secondary">—</Text> },
    country: { title: <Flex vertical gap={8}><span>Ölkə</span><Input size="small" allowClear placeholder="Ölkə üzrə axtar" value={columnFilters.country} onClick={(event) => event.stopPropagation()} onChange={(event) => setColumnFilters((current) => ({ ...current, country: event.target.value }))} /></Flex>, key: 'country', width: 150, render: (_, item) => item.formValues?.country ? `${countryFlag(item.formValues.country)} ${countries.getName(item.formValues.country, 'az') ?? item.formValues.country}` : <Text type="secondary">—</Text> },
    phone: { title: <Space size={6}><UserOutlined /><span>Telefon</span></Space>, key: 'phone', width: 140, render: (_, item) => item.formValues?.phone ? `${item.formValues.phoneCountryCode?.split(':')[1] ?? ''} ${item.formValues.phone}` : <Text type="secondary">—</Text> },
    email: { title: 'E-poçt', key: 'email', width: 190, render: (_, item) => item.formValues?.email || <Text type="secondary">—</Text> },
    status: { title: 'Status', key: 'status', width: 110, fixed: 'right', render: (_, item) => <Tag color={item.formValues?.status === 'inactive' ? 'default' : 'success'}>{item.formValues?.status === 'inactive' ? 'Passiv' : 'Aktiv'}</Tag> },
    taxRegime: { title: 'ƏDV statusu', key: 'taxRegime', width: 145, render: (_, item) => item.formValues?.taxRegime === 'VAT payer' ? 'ƏDV ödəyicisi' : item.formValues?.taxRegime === 'Not a VAT payer' ? 'ƏDV ödəyicisi deyil' : <Text type="secondary">—</Text> },
    shortName: { title: 'Qısa ad', key: 'shortName', width: 150, render: (_, item) => item.formValues?.shortName || <Text type="secondary">—</Text> },
    city: { title: 'Şəhər', key: 'city', width: 140, render: (_, item) => item.formValues?.city || <Text type="secondary">—</Text> },
    position: { title: 'Əlaqədar şəxsin vəzifəsi', key: 'position', width: 200, render: (_, item) => item.formValues?.position || <Text type="secondary">—</Text> },
    address: { title: 'Ünvan', key: 'address', width: 220, ellipsis: true, render: (_, item) => item.formValues?.address || <Text type="secondary">—</Text> },
    bankName: { title: <Space size={6}><BankOutlined /><span>Bank adı</span></Space>, key: 'bankName', width: 190, fixed: 'right', render: (_, item) => banks.find((bank) => bank.id === item.formValues?.bankAccounts?.[0]?.bankId)?.name ?? <Text type="secondary">—</Text> },
    iban: { title: 'IBAN / Hesab nömrəsi', key: 'iban', width: 190, render: (_, item) => item.formValues?.bankAccounts?.[0]?.iban || <Text type="secondary">—</Text> },
    notes: { title: 'Qeyd', key: 'notes', width: 200, ellipsis: true, render: (_, item) => item.formValues?.notes || <Text type="secondary">—</Text> },
    createdAt: { title: 'Yaradılma tarixi', dataIndex: 'createdAt', key: 'createdAt', width: 145 },
    updatedAt: { title: 'Son dəyişiklik tarixi', dataIndex: 'updatedAt', key: 'updatedAt', width: 165 },
    actions: { title: 'Əməliyyatlar', key: 'actions', width: 80, fixed: 'right', render: (_, item) => <Tooltip title="Redaktə et"><Button type="text" icon={<EditOutlined />} aria-label={`${item.name} məlumatlarını redaktə et`} onClick={() => openEditDrawer(item)} /></Tooltip> },
  }

  const columns = Object.entries(columnDefinitions).map(([key, definition]) => ({
    ...definition,
    key,
    title: key === 'actions' ? 'Əməliyyatlar' : <Flex vertical gap={8}><span>{columnLabels[key]}</span><Input size="small" allowClear aria-label={`${columnLabels[key]} üzrə axtarış`} placeholder="Axtar" value={columnFilters[key] ?? ''} onClick={(event) => event.stopPropagation()} onChange={(event) => setColumnFilters((current) => ({ ...current, [key]: event.target.value }))} /></Flex>,
  }))

  const handleBankChange = (index: number, bankId?: number) => {
    const bank = banks.find((item) => item.id === bankId)
    if (!bank) {
      form.setFieldValue(['bankAccounts', index], {
        ...bankAccounts[index],
        bankId: undefined,
        bankCode: undefined,
        bankTaxId: undefined,
        correspondentAccount: undefined,
        swift: undefined,
        bankCountry: undefined,
      })
      return
    }

    form.setFieldValue(['bankAccounts', index], {
      ...bankAccounts[index],
      bankId: bank.id,
      bankCode: bank.code,
      bankTaxId: bank.taxId,
      correspondentAccount: bank.correspondentAccount,
      swift: bank.swift,
      bankCountry: `${countryFlag(bank.countryCode)}  ${countries.getName(bank.countryCode, 'az') ?? bank.countryCode}`,
    })
  }

  const setPrimaryBankAccount = (index: number, isPrimary: boolean, moveAccount?: (from: number, to: number) => void) => {
    const currentAccounts: BankAccountFormValues[] = form.getFieldValue('bankAccounts') ?? []
    const account = currentAccounts[index]
    const currency = account?.currency
    if (!account || !currency) return

    const updatedAccounts = currentAccounts.map((item: BankAccountFormValues, accountIndex: number) => ({
      ...item,
      isPrimary: isPrimary && accountIndex === index
        ? true
        : !isPrimary && accountIndex === index
          ? false
        : isPrimary && item.currency === currency
          ? false
          : item.isPrimary,
    }))

    form.setFieldsValue({ bankAccounts: updatedAccounts })

    if (isPrimary && index > 0) moveAccount?.(index, 0)

    if (isPrimary) messageApi.success(`${currency} valyutası üçün əsas hesab seçildi`)
  }

  const setBankAccountActive = (index: number, isActive: boolean) => {
    const currentAccounts = form.getFieldValue('bankAccounts') ?? []
    const account = currentAccounts[index]
    if (!account) return

    form.setFieldsValue({ bankAccounts: currentAccounts.map((item: BankAccountFormValues, accountIndex: number) => (
      accountIndex === index ? { ...item, isActive } : item
    )) })
  }

  const handleBankCurrencyChange = (index: number, currency: BankAccountFormValues['currency']) => {
    const currentAccount = bankAccounts[index]
    if (!currentAccount || currentAccount.currency === currency) return

    const fallbackPrimaryIndex = currentAccount.isPrimary
      ? bankAccounts.findIndex((account, accountIndex) => accountIndex !== index && account.currency === currentAccount.currency)
      : -1

    form.setFieldsValue({ bankAccounts: bankAccounts.map((account, accountIndex) => ({
      ...account,
      currency: accountIndex === index ? currency : account.currency,
      isPrimary: accountIndex === index
        ? currentAccount.isPrimary
        : accountIndex === fallbackPrimaryIndex
          ? true
          : currentAccount.isPrimary && account.currency === currency
            ? false
            : account.isPrimary,
              })) })
  }

  const removeBankAccount = (index: number, remove: (index: number) => void) => {
    const account = bankAccounts[index]
    const fallbackPrimaryIndex = account?.isPrimary
      ? bankAccounts.findIndex((item, itemIndex) => itemIndex !== index && item.currency === account.currency)
      : -1

    if (fallbackPrimaryIndex >= 0) {
      form.setFieldsValue({ bankAccounts: bankAccounts.map((item, itemIndex) => ({
        ...item,
        isPrimary: itemIndex === fallbackPrimaryIndex ? true : item.isPrimary,
      })) })
    }
    remove(index)
  }

  const handleCreate = async () => {
    try {
      const values = await form.validateFields()
      const accountsByCurrency = (values.bankAccounts ?? []).reduce<Record<string, BankAccountFormValues[]>>((groups, account) => {
        groups[account.currency] = [...(groups[account.currency] ?? []), account]
        return groups
      }, {})
      const invalidCurrency = Object.entries(accountsByCurrency).find(([, accounts]) => accounts.filter((account) => account.isPrimary).length > 1)?.[0]
      if (invalidCurrency) {
        setActiveTab('bank')
        messageApi.error(`${invalidCurrency} valyutası üzrə yalnız bir əsas hesab seçilə bilər`)
        return
      }
      setSaving(true)
      await new Promise((resolve) => window.setTimeout(resolve, 450))
      const item: Counterparty = {
        id: editingId ?? crypto.randomUUID(),
        name: values.name,
        contact: values.contact || 'Əlaqədar şəxs göstərilməyib',
        role: values.role,
        legalStatus: values.legalStatus,
        color: 'blue',
        createdAt: editingId ? counterparties.find((existing) => existing.id === editingId)?.createdAt ?? new Date().toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString().slice(0, 10),
        formValues: values,
      }
      setCounterparties((current) => editingId
        ? current.map((existing) => existing.id === editingId ? { ...existing, ...item } : existing)
        : [item, ...current])
      setDrawerOpen(false)
      messageApi.success(`${values.name} uğurla ${editingId ? 'yeniləndi' : 'yaradıldı'}`)
    } catch (error) {
      const errorFields = error && typeof error === 'object' && 'errorFields' in error
        ? (error as { errorFields?: Array<{ name?: Array<string | number> }> }).errorFields ?? []
        : []
      const detailsFields = new Set(['contact', 'position', 'country', 'city', 'address', 'phoneCountryCode', 'phone', 'email', 'website', 'notes'])
      const hasDetailsError = errorFields.some((field) => field.name?.some((name) => detailsFields.has(String(name))))

      setActiveTab(hasDetailsError ? 'details' : 'general')
      messageApi.error('Yaratmazdan əvvəl məcburi sahələri doldurun')
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    {
      key: 'general',
      label: 'Ümumi',
      children: (
        <Flex vertical gap={16}>
          <FormSection icon={<IdcardOutlined />} title="Ümumi məlumat" description="Kontragentin əsas məlumatları">
            <Row gutter={16}>
              <Col span={24}><Form.Item name="name" label="Tam / hüquqi adı" rules={[{ required: true, message: 'Hüquqi adı daxil edin' }]}><Input placeholder="Kontragentin tam hüquqi adını daxil edin" /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="role" label="Əlaqə növü" rules={[{ required: true }]}><Select options={[{ value: 'Customer', label: 'Müştəri' }, { value: 'Supplier', label: 'Təchizatçı' }, { value: 'Both', label: 'Hər ikisi' }]} /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="shortName" label="Qısa ad"><Input placeholder="Qısa görünən adı daxil edin" /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="legalStatus" label="Hüquqi status" rules={[{ required: true }]}><Select options={[{ value: 'Legal entity', label: 'Hüquqi şəxs' }, { value: 'Individual entrepreneur', label: 'Fərdi sahibkar' }, { value: 'Individual', label: 'Fiziki şəxs' }]} /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="taxId" label="VÖEN"><Input placeholder="Vergi ödəyicisinin eyniləşdirmə nömrəsini daxil edin" /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="taxRegime" label="ƏDV statusu"><Radio.Group optionType="button" buttonStyle="solid" options={[{ value: 'VAT payer', label: 'ƏDV ödəyicisi' }, { value: 'Not a VAT payer', label: 'ƏDV ödəyicisi deyil' }]} /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="status" label="Status"><Radio.Group optionType="button" buttonStyle="solid" options={[{ value: 'active', label: 'Aktiv' }, { value: 'inactive', label: 'Passiv' }]} /></Form.Item></Col>
            </Row>
          </FormSection>
        </Flex>
      ),
    },
    {
      key: 'bank',
      label: 'Bank',
      children: (
        <Flex vertical gap={16}>
          <Form.List name="bankAccounts">
            {(fields, { add, remove, move }) => (
              <>
                {(() => {
                  const accountFields = (field: typeof fields[number], index: number) => (
                    <>
                    <Form.Item name={[field.name, 'isActive']} hidden><Input /></Form.Item>
                    <Form.Item name={[field.name, 'isPrimary']} hidden><Input /></Form.Item>
                    <Row gutter={16}>
                      <Col xs={24} md={12}><Form.Item name={[field.name, 'bankId']} label="Bank adı"><Select showSearch allowClear placeholder="Bank seçin və ya axtarın" optionFilterProp="label" options={banks.map((bank) => ({ value: bank.id, label: bank.name }))} onChange={(value) => handleBankChange(index, value)} /></Form.Item></Col>
                      <Col xs={24} md={12}><Form.Item name={[field.name, 'iban']} label="Hesab nömrəsi / IBAN"><Input placeholder="Bank hesab nömrəsini daxil edin" /></Form.Item></Col>
                      <Col xs={24} md={8}><Form.Item name={[field.name, 'bankCode']} label="Bank kodu"><Input readOnly placeholder="Bank seçildikdə doldurulur" /></Form.Item></Col>
                      <Col xs={24} md={8}><Form.Item name={[field.name, 'bankTaxId']} label="Bankın VÖEN-i"><Input readOnly placeholder="Bank seçildikdə doldurulur" /></Form.Item></Col>
                      <Col xs={24} md={8}><Form.Item name={[field.name, 'bankCountry']} label="Bankın ölkəsi"><Input readOnly placeholder="Bank seçildikdə doldurulur" /></Form.Item></Col>
                      <Col span={24}><Form.Item name={[field.name, 'correspondentAccount']} label="Müxbir hesab"><Input readOnly placeholder="Bank seçildikdə doldurulur" /></Form.Item></Col>
                      <Col xs={24} md={12}><Form.Item name={[field.name, 'currency']} label="Valyuta"><Select showSearch optionFilterProp="searchText" placeholder="Ölkə və ya valyuta üzrə axtarın" options={currencyOptions.map((option) => ({ value: option.value, searchText: option.searchText, label: <Space size={8}>{option.countryCode ? <span>{countryFlag(option.countryCode)}</span> : <GlobalOutlined />}<span>{option.countryName}</span><Text type="secondary">{option.value}</Text><Tag>{option.symbol}</Tag></Space> }))} onChange={(value) => handleBankCurrencyChange(index, value as BankAccountFormValues['currency'])} /></Form.Item></Col>
                      <Col xs={24} md={12}><Form.Item name={[field.name, 'swift']} label="SWIFT / BIC kodu"><Input readOnly placeholder="Bank seçildikdə doldurulur" /></Form.Item></Col>
                    </Row>
                    </>
                  )
                  const accountExtra = (field: typeof fields[number], index: number, moveAccount?: (from: number, to: number) => void) => <Space className="bank-account-switches" size={12} onClick={(event) => event.stopPropagation()}>
                    <Tooltip title="Hesabın istifadə üçün aktivliyi">
                      <Space size={6}><Text type="secondary">{bankAccounts[index]?.isActive === false ? 'Passiv' : 'Aktiv'}</Text><Switch size="small" checked={bankAccounts[index]?.isActive !== false} onChange={(checked) => setBankAccountActive(index, checked)} aria-label={`Bank hesabı ${index + 1} aktivlik vəziyyəti`} /></Space>
                    </Tooltip>
                    <Tooltip title="Bu valyuta üzrə əsas hesabı seçin">
                      <Space size={6}><Text type="secondary">Əsas hesab</Text><Switch size="small" checked={Boolean(bankAccounts[index]?.isPrimary)} onChange={(checked) => setPrimaryBankAccount(index, checked, moveAccount)} aria-label={`${bankAccounts[index]?.currency ?? ''} valyutası üçün Bank hesabı ${index + 1} əsas hesab seçimi`} /></Space>
                    </Tooltip>
                    {fields.length > 1 && <Tooltip title="Hesabı sil"><Button type="text" danger icon={<DeleteOutlined />} aria-label={`Bank hesabı ${index + 1} sil`} onClick={() => removeBankAccount(field.name, remove)} /></Tooltip>}
                  </Space>

                  return fields.length > 1 ? (
                    <Collapse size="large" className="bank-account-collapse" defaultActiveKey={fields.map((field) => String(field.key))} items={fields.map((field) => {
                      const accountIndex = field.name
                      const visual = getCurrencyVisual(bankAccounts[accountIndex]?.currency)
                      return {
                        key: String(field.key),
                        label: <Space wrap size={10}><span className="bank-account-panel-icon"><BankOutlined /></span><span>Bank hesabı {accountIndex + 1}</span><Tag className={`bank-currency-tag bank-currency-tag-${visual.color}`}>{bankAccounts[accountIndex]?.currency}</Tag>{bankAccounts[accountIndex]?.isPrimary && <Tag color="success" icon={<CheckCircleFilled />}>Əsas hesab</Tag>}</Space>,
                        extra: accountExtra(field, accountIndex, move),
                        children: accountFields(field, accountIndex),
                      }
                    })} />
                  ) : (
                    fields.map((field, index) => <Card className="bank-account-card" key={field.key} title={<Space><BankOutlined /><span>Bank hesabı {index + 1}</span></Space>} extra={accountExtra(field, index)}>{accountFields(field, index)}</Card>)
                  )
                })()}
                <Button className="bank-account-add-button" type="dashed" size="large" block icon={<PlusOutlined />} onClick={() => add({ currency: 'AZN', isActive: true, isPrimary: !bankAccounts.some((account) => account.currency === 'AZN' && account.isPrimary) })}>Yeni bank hesabı əlavə et</Button>
              </>
            )}
          </Form.List>
        </Flex>
      ),
    },
    {
      key: 'details',
      label: 'Əlaqə məlumatları',
      children: (
        <Flex vertical gap={16}>
          <FormSection icon={<UserOutlined />} title="Əlaqə və ünvan məlumatları" description="Əlaqədar şəxs, ünvan və kommunikasiya kanalları">
            <Row gutter={16}>
              <Col xs={24} md={12}><Form.Item name="contact" label="Əlaqədar şəxs" rules={[{ required: true, message: 'Əlaqədar şəxsi daxil edin' }]}><Input placeholder="Əlaqədar şəxsin adını daxil edin" /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="position" label="Vəzifə"><Input placeholder="Məsələn, baş mühasib" /></Form.Item></Col>
              <Col xs={24} md={12}>
                <Form.Item name="country" label="Ölkə">
                  <Select
                    showSearch
                    optionFilterProp="label"
                    placeholder="Ölkə seçin və ya axtarın"
                    options={countryOptions}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}><Form.Item name="city" label="Şəhər / Rayon"><Input placeholder="Şəhər və ya rayon daxil edin" /></Form.Item></Col>
              <Col span={24}><Form.Item name="address" label="Ünvan"><Input.TextArea rows={3} placeholder="Küçə, bina, mənzil və digər ünvan məlumatlarını daxil edin" /></Form.Item></Col>
              <Col xs={24} md={12}>
                <Form.Item label="Telefon">
                  <Space.Compact block>
                    <Form.Item name="phoneCountryCode" noStyle>
                      <Select
                        showSearch
                        aria-label="Telefon ölkə kodu"
                        className="phone-country-select"
                        optionFilterProp="searchText"
                        options={phoneCountryOptions}
                      />
                    </Form.Item>
                    <Form.Item name="phone" noStyle>
                      <Input type="tel" inputMode="tel" placeholder="12 555 12 34" aria-label="Telefon nömrəsi" />
                    </Form.Item>
                  </Space.Compact>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}><Form.Item name="email" label="E-poçt" rules={[{ type: 'email', message: 'Düzgün e-poçt ünvanı daxil edin' }]}><Input type="email" placeholder="ad@şirkət.az" /></Form.Item></Col>
              <Col span={24}><Form.Item name="website" label="Veb sayt" rules={[{ type: 'url', message: 'Düzgün veb sayt ünvanı daxil edin' }]}><Input type="url" placeholder="https://example.com" /></Form.Item></Col>
              <Col span={24}><Form.Item name="notes" label="Qeydlər"><Input.TextArea rows={3} placeholder="Kontragent haqqında faydalı qeydlər əlavə edin" /></Form.Item></Col>
            </Row>
          </FormSection>
        </Flex>
      ),
    },
  ]

  return (
    <>
      {contextHolder}
      <Flex vertical gap={20}>
        <Flex className="page-toolbar" justify="space-between" align="center" wrap gap={12}>
          <Input allowClear prefix={<SearchOutlined />} placeholder="Şirkət adı, VÖEN və ya əlaqədar şəxs üzrə axtarış..." value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1) }} className="counterparty-search" />
          <Space wrap>
            <Segmented value={view} onChange={(value) => setView(value as 'cards' | 'table')} options={[{ value: 'cards', label: 'Kartlar', icon: <AppstoreOutlined /> }, { value: 'table', label: 'Cədvəl', icon: <TableOutlined /> }]} />
            <Dropdown
              trigger={['click']}
              menu={{
                className: 'excel-actions-menu',
                onClick: ({ key }) => {
                  if (key === 'template') downloadImportTemplate()
                  if (key === 'filtered' && hasActiveFilters) exportToExcel()
                  if (key === 'import') counterpartyUploadRef.current?.click()
                },
                items: [
                  { key: 'template', icon: <img className="excel-menu-logo" src="/logo/Microsoft_Excel-Logo.wine.png" alt="" />, label: <div className="excel-menu-content"><strong>Excel şablonu yüklə</strong><span>İdxal üçün nümunə fayl</span></div> },
                  { key: 'filtered', className: !hasActiveFilters ? 'excel-menu-item-disabled' : undefined, icon: <img className="excel-menu-logo" src="/logo/Microsoft_Excel-Logo.wine.png" alt="" />, label: <Tooltip title="Filter tətbiq etdikdə, filterli excel export edə bilərsiniz. Klikləyərək filter tətbiq edin." open={!hasActiveFilters && filterExportTooltipOpen}><span className="excel-menu-tooltip-target" aria-disabled={!hasActiveFilters} onMouseEnter={() => setFilterExportTooltipOpen(true)} onMouseLeave={() => setFilterExportTooltipOpen(false)}><span className="excel-menu-content"><strong>Filterli yüklə</strong><span>{hasActiveFilters ? 'Tətbiq edilmiş filterlər üzrə' : 'Filter tətbiq olunur'}</span></span></span></Tooltip> },
                  { key: 'import', icon: <img className="excel-menu-logo" src="/logo/Microsoft_Excel-Logo.wine.png" alt="" />, label: <div className="excel-menu-content"><strong>Excel-dən idxal et</strong><span>Fayldan yeni məlumatları əlavə et</span></div> },
                ],
              }}
            >
              <Button className="excel-export-button" icon={<img className="excel-logo" src="/logo/Microsoft_Excel-Logo.wine.png" alt="" />}>Excel <DownOutlined /></Button>
            </Dropdown>
            <Tooltip title="Cədvəl sütunları"><Button icon={<SettingOutlined />} aria-label="Cədvəl sütunları" onClick={() => setTableSettingsOpen(true)} /></Tooltip>
            <Upload accept=".xls,.csv,.tsv" showUploadList={false} beforeUpload={importFromExcel}>
              <button ref={counterpartyUploadRef} type="button" className="hidden-upload-trigger" tabIndex={-1} aria-hidden="true" />
            </Upload>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateDrawer}>Yeni Counterparties</Button>
          </Space>
        </Flex>

        {filtered.length === 0 && view === 'cards' ? (
          <Card><Empty description="Axtarışınıza uyğun kontragent tapılmadı" /></Card>
        ) : view === 'cards' ? (
          <Row gutter={[16, 16]}>
            {filtered.slice((currentPage - 1) * 6, currentPage * 6).map((item) => (
              <Col xs={24} md={12} xl={8} key={item.id}>
                <Card hoverable className="counterparty-card">
                  <Tooltip title="Redaktə et">
                    <Button
                      className="counterparty-edit-button"
                      type="text"
                      shape="circle"
                      icon={<EditOutlined />}
                      aria-label={`${item.name} məlumatlarını redaktə et`}
                      onClick={() => openEditDrawer(item)}
                    />
                  </Tooltip>
                  <Flex gap={14} align="flex-start">
                    <Badge dot color="#52c41a" offset={[-2, 38]}>
                      <span className={`company-avatar company-avatar-${item.color}`}><ShopOutlined /></span>
                    </Badge>
                    <Flex vertical gap={5} className="counterparty-details">
                      <Text strong className="company-name">{item.name}</Text>
                      <Text type="secondary"><UserOutlined /> {item.contact}</Text>
                    </Flex>
                  </Flex>
                  <Space wrap size={[6, 6]} className="counterparty-tags">
                    <Tag color={roleColors[item.role]} icon={<SwapOutlined />}>{roleLabels[item.role]}</Tag>
                    <Tag color={legalColors[item.legalStatus]} icon={<ShopOutlined />}>{legalLabels[item.legalStatus]}</Tag>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <CustomDataTable
            className="counterparty-data-table"
            rowKey="id"
            columns={columns}
            dataSource={filtered}
            locale={{ emptyText: <Empty description="Axtarışınıza uyğun kontragent tapılmadı" /> }}
            tableLayout="fixed"
            onRow={(item) => ({ onDoubleClick: () => openEditDrawer(item) })}
            pagination={{ defaultPageSize: 10, showSizeChanger: true, showQuickJumper: true, showTotal: (total, range) => `${range[0]}–${range[1]} / ${total} kontragent` }}
            scroll={{ x: 3550 }}
            columnLabels={columnLabels}
            defaultVisibleColumnKeys={['name', 'taxId', 'role', 'contact', 'phone', 'email', 'status', 'taxRegime', 'shortName', 'city', 'country', 'legalStatus', 'position', 'address', 'bankName', 'iban', 'notes', 'createdAt', 'updatedAt', 'actions']}
            defaultColumnOrder={['name', 'taxId', 'role', 'contact', 'phone', 'email', 'status', 'taxRegime', 'shortName', 'city', 'country', 'legalStatus', 'position', 'address', 'bankName', 'iban', 'notes', 'createdAt', 'updatedAt', 'actions']}
            defaultFixedColumns={{ name: 'left', taxId: 'left', status: 'right', bankName: 'right' }}
            settingsOpen={tableSettingsOpen}
            onSettingsOpenChange={setTableSettingsOpen}
          />
        )}

        {view === 'cards' && filtered.length > 0 && (
          <Flex ref={paginationPanelRef} className="pagination-panel" justify="space-between" align="center" wrap gap={12}>
            <Text type="secondary">
              {filtered.length} nəticədən {(currentPage - 1) * 6 + 1}–{Math.min(currentPage * 6, filtered.length)} arası
            </Text>
            <Pagination
              current={currentPage}
              total={filtered.length}
              pageSize={6}
              showSizeChanger={false}
              showQuickJumper={{ goButton: <Button type="primary" icon={<ArrowRightOutlined />} aria-label="Səhifəyə keç" /> }}
              onChange={setCurrentPage}
            />
          </Flex>
        )}
      </Flex>

      <Drawer
        className="counterparty-drawer"
        title={
          <Flex gap={12} align="center">
            <span className="drawer-title-icon"><ShopOutlined /></span>
            <div><Title level={4}>{editingId ? 'Kontragenti redaktə et' : 'Yeni Counterparties'}</Title><Text type="secondary">{editingId ? 'Biznes tərəfdaşının məlumatlarını yeniləyin' : 'Yeni biznes tərəfdaşı əlavə edin'}</Text></div>
          </Flex>
        }
        placement="right"
        size="min(94vw, 820px)"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        closable={{ placement: 'end', closeIcon: <CloseOutlined /> }}
        footer={
          <Flex justify="flex-end" gap={8}>
            <Button icon={<CloseOutlined />} onClick={() => setDrawerOpen(false)}>Ləğv et</Button>
            <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleCreate}>{editingId ? 'Yadda saxla' : 'Yarat'}</Button>
          </Flex>
        }
      >
        <Form form={form} layout="vertical" requiredMark="optional">
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabs} animated />
        </Form>
      </Drawer>

    </>
  )
}
