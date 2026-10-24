import { useMemo, useRef, useState } from 'react'
import {
  ApartmentOutlined,
  AppstoreOutlined,
  BarcodeOutlined,
  CheckCircleOutlined,
  DatabaseOutlined,
  DoubleLeftOutlined,
  DoubleRightOutlined,
  DownOutlined,
  DeleteOutlined,
  EditOutlined,
  FolderAddOutlined,
  FolderOpenOutlined,
  FolderOutlined,
  IdcardOutlined,
  PlusOutlined,
  RightOutlined,
  RollbackOutlined,
  SaveOutlined,
  SearchOutlined,
  SettingOutlined,
  StopOutlined,
  SyncOutlined,
  TagOutlined,
  TableOutlined,
  ToolOutlined,
} from '@ant-design/icons'
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Dropdown,
  Empty,
  Flex,
  Form,
  Input,
  message,
  Pagination,
  Popconfirm,
  Radio,
  Row,
  Select,
  Segmented,
  Space,
  Table,
  Tag,
  Tree,
  Tooltip,
  Typography,
  Upload,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { UploadProps } from 'antd'
import { CustomDataTable } from './components/CustomDataTable'

const { Text, Title } = Typography

type ItemKind = 'stock' | 'non-stock' | 'service' | 'wip' | 'finished'
type TrackingRule = 'not-allowed' | 'allowed' | 'required'
type CostingMethod = 'fifo' | 'avco'
type YesNoRule = 'no' | 'yes'

interface NomenclatureFolder {
  id: string
  name: string
  parentId?: string
  status: 'active' | 'archived'
  code?: string
  defaultItemKind?: ItemKind
  defaultBaseUom?: string
  defaultCostingMethod?: CostingMethod
  defaultExpenseItem?: string
  defaultIncomeItem?: string
  defaultPurchaseTax?: string
  defaultSalesTax?: string
  defaultHasBom?: YesNoRule
  defaultBatchTracking?: TrackingRule
  defaultExpiryTracking?: YesNoRule
  defaultSerialTracking?: TrackingRule
}

type FolderFormValues = Omit<NomenclatureFolder, 'id'>

interface NomenclatureItem {
  id: string
  name: string
  folderId: string
  baseUom?: string
  status: 'active' | 'archived'
  itemKind?: ItemKind
  costingMethod?: CostingMethod
  expenseItem?: string
  incomeItem?: string
  purchaseTax?: string
  salesTax?: string
  hasBom?: YesNoRule
  batchTracking?: TrackingRule
  expiryTracking?: YesNoRule
  serialTracking?: TrackingRule
  sku?: string
  barcodes?: string[]
}

type ItemFormValues = Omit<NomenclatureItem, 'id'>

const initialFolders: NomenclatureFolder[] = [
  { id: '1', name: 'Məhsullar', code: 'PRD', status: 'active', defaultItemKind: 'stock', defaultBaseUom: 'pcs', defaultCostingMethod: 'fifo', defaultBatchTracking: 'allowed' },
  { id: '2', name: 'Hazır məhsullar', parentId: '1', code: 'FIN', status: 'active', defaultItemKind: 'finished', defaultHasBom: 'yes', defaultBatchTracking: 'required', defaultExpiryTracking: 'yes' },
  { id: '3', name: 'Xammal və materiallar', parentId: '1', code: 'RAW', status: 'active', defaultItemKind: 'stock', defaultBaseUom: 'kg', defaultCostingMethod: 'avco', defaultBatchTracking: 'allowed' },
  { id: '4', name: 'Xidmətlər', code: 'SRV', status: 'active', defaultItemKind: 'service', defaultSerialTracking: 'not-allowed' },
  { id: '5', name: 'İş prosesində', code: 'WIP', status: 'active', defaultItemKind: 'wip', defaultHasBom: 'yes' },
  { id: '6', name: 'Arxiv məhsulları', code: 'ARC', status: 'archived', defaultItemKind: 'non-stock' },
]

const initialItems: NomenclatureItem[] = [
  { id: '1', name: 'Günəbaxan yağı 1L', folderId: '2', status: 'active', sku: 'FIN-001', barcodes: ['4820000001'] },
  { id: '2', name: 'Buğda unu (kisə)', folderId: '3', status: 'active', batchTracking: 'required', sku: 'RAW-014' },
  { id: '3', name: 'Nəqliyyat xidməti', folderId: '4', baseUom: 'hour', status: 'active', hasBom: 'no', sku: 'SRV-002' },
  { id: '4', name: 'Yarımfabrikat qarışıq', folderId: '5', baseUom: 'kg', status: 'active', itemKind: 'wip' },
]

const itemKindLabels: Record<ItemKind, string> = {
  stock: 'Məhsul (anbar)',
  'non-stock': 'Məhsul (anbarsız)',
  service: 'Xidmət',
  wip: 'İstehsalda olan (WIP)',
  finished: 'Hazır məhsul',
}

const itemKindIcons: Record<ItemKind, React.ReactNode> = {
  stock: <DatabaseOutlined />,
  'non-stock': <AppstoreOutlined />,
  service: <ToolOutlined />,
  wip: <SyncOutlined />,
  finished: <CheckCircleOutlined />,
}

const trackingLabels: Record<TrackingRule, string> = {
  'not-allowed': 'İcazə verilmir',
  allowed: 'İcazəlidir',
  required: 'Məcburidir',
}

const baseUomLabels: Record<string, string> = {
  pcs: 'Ədəd',
  kg: 'Kiloqram',
  pkg: 'Qablaşdırma',
  box: 'Qutu',
  hour: 'Saat',
}

const itemKindOptions = Object.entries(itemKindLabels).map(([value, label]) => ({ value, label }))
const trackingOptions = Object.entries(trackingLabels).map(([value, label]) => ({ value, label }))
const baseUomOptions = Object.entries(baseUomLabels).map(([value, label]) => ({ value, label }))
const costingMethodOptions = [{ value: 'fifo', label: 'FIFO' }, { value: 'avco', label: 'AVCO (orta çəkili)' }]
const yesNoOptions = [{ value: 'no', label: 'Xeyr' }, { value: 'yes', label: 'Bəli' }]
const expenseOptions = [{ value: '701', label: '701 — Satışın maya dəyəri' }, { value: '711', label: '711 — Kommersiya xərcləri' }]
const incomeOptions = [{ value: '601', label: '601 — Satış gəlirləri' }, { value: '611', label: '611 — Digər əməliyyat gəlirləri' }]
const taxOptions = [{ value: 'vat-18', label: 'ƏDV 18%' }, { value: 'vat-0', label: 'ƏDV 0%' }, { value: 'exempt', label: 'ƏDV-dən azad' }]
const systemDefaults = {
  itemKind: 'stock' as ItemKind,
  baseUom: 'pcs',
  costingMethod: 'fifo' as CostingMethod,
  salesTax: 'vat-18',
  purchaseTax: 'vat-18',
  batchTracking: 'allowed' as TrackingRule,
  expiryTracking: 'no' as YesNoRule,
  serialTracking: 'not-allowed' as TrackingRule,
}

// Item kinds that participate in warehouse inventory tracking (Goods / WIP / Finished).
const inventoryTrackedKinds: ItemKind[] = ['stock', 'wip', 'finished']

interface SectionTitleProps {
  icon: React.ReactNode
  children: React.ReactNode
}

function SectionTitle({ icon, children }: SectionTitleProps) {
  return <Space size={8}><span className="form-section-title-icon">{icon}</span><span>{children}</span></Space>
}

function buildTreeData(folders: NomenclatureFolder[], parentId?: string): Array<{ key: string; title: string; icon: React.ReactNode; children?: ReturnType<typeof buildTreeData> }> {
  return folders
    .filter((folder) => folder.parentId === parentId)
    .map((folder) => {
      const children = buildTreeData(folders, folder.id)
      return {
        key: folder.id,
        title: folder.name,
        icon: children.length ? <FolderOpenOutlined /> : <FolderOutlined />,
        children: children.length ? children : undefined,
      }
    })
}

function collectDescendantIds(folders: NomenclatureFolder[], id: string): string[] {
  const children = folders.filter((folder) => folder.parentId === id)
  return [id, ...children.flatMap((folder) => collectDescendantIds(folders, folder.id))]
}

function nextCategoryCode(folders: NomenclatureFolder[]): string {
  const year = new Date().getFullYear()
  const sequence = folders.reduce((maximum, folder) => {
    const match = folder.code?.match(new RegExp(`^CAT-${year}-(\\d+)$`))
    return match ? Math.max(maximum, Number(match[1])) : maximum
  }, 0) + 1
  return `CAT-${year}-${String(sequence).padStart(4, '0')}`
}

function folderChain(folders: NomenclatureFolder[], folderId?: string): NomenclatureFolder[] {
  const chain: NomenclatureFolder[] = []
  let current = folders.find((folder) => folder.id === folderId)
  while (current) {
    chain.push(current)
    current = folders.find((folder) => folder.id === current!.parentId)
  }
  return chain
}

// Resolves boş (blank) item-level fields through the folder hierarchy (boş → irsiyyət → system default).
function resolveInherited<T>(itemValue: T | undefined, folders: NomenclatureFolder[], folderId: string, getter: (folder: NomenclatureFolder) => T | undefined, systemDefault?: T): T | undefined {
  if (itemValue !== undefined) return itemValue
  for (const folder of folderChain(folders, folderId)) {
    const value = getter(folder)
    if (value !== undefined) return value
  }
  return systemDefault
}

interface ResolvedInheritance<T> {
  value: T | undefined
  state: 'overridden' | 'folder' | 'system' | 'unconfigured'
  sourceLabel: string
}

function resolveInheritedDetail<T>(itemValue: T | undefined, folders: NomenclatureFolder[], folderId: string, getter: (folder: NomenclatureFolder) => T | undefined, systemDefault?: T): ResolvedInheritance<T> {
  if (itemValue !== undefined) return { value: itemValue, state: 'overridden', sourceLabel: 'Fərdi dəyər' }
  for (const folder of folderChain(folders, folderId)) {
    const value = getter(folder)
    if (value !== undefined) return { value, state: 'folder', sourceLabel: `${folder.name} qovluğundan` }
  }
  if (systemDefault !== undefined) return { value: systemDefault, state: 'system', sourceLabel: 'Sistem standartından' }
  return { value: undefined, state: 'unconfigured', sourceLabel: 'Təyin edilməyib' }
}

function downloadExcel(headers: string[], rows: string[][], filenamePrefix: string) {
  const escapeCell = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  const table = [headers, ...rows].map((row) => `<tr>${row.map((cell) => `<td>${escapeCell(cell)}</td>`).join('')}</tr>`).join('')
  const blob = new Blob([`\ufeff<html><head><meta charset="utf-8"></head><body><table>${table}</table></body></html>`], { type: 'application/vnd.ms-excel;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.xls`
  anchor.click()
  URL.revokeObjectURL(url)
}

function parseImportedRows(content: string): string[][] {
  if (/<table/i.test(content)) {
    const documentNode = new DOMParser().parseFromString(content, 'text/html')
    return Array.from(documentNode.querySelectorAll('tr')).map((row) =>
      Array.from(row.querySelectorAll('th, td')).map((cell) => cell.textContent?.trim() ?? ''),
    )
  }

  const delimiter = content.split('\n')[0]?.includes(';') ? ';' : content.split('\n')[0]?.includes('\t') ? '\t' : ','
  return content.split(/\r?\n/).filter(Boolean).map((row) => row.split(delimiter).map((cell) => cell.trim().replace(/^"|"$/g, '')))
}

export function NomenclaturePage() {
  const [folderForm] = Form.useForm<FolderFormValues>()
  const [itemForm] = Form.useForm<ItemFormValues>()
  const uploadButtonRef = useRef<HTMLButtonElement>(null)
  const [folders, setFolders] = useState(initialFolders)
  const [items, setItems] = useState(initialItems)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'cards' | 'table'>('table')
  const [cardPage, setCardPage] = useState(1)
  const [tableSettingsOpen, setTableSettingsOpen] = useState(false)
  const [filterExportTooltipOpen, setFilterExportTooltipOpen] = useState(false)
  const [nomenclatureSection, setNomenclatureSection] = useState('items')
  const [selectedFolder, setSelectedFolder] = useState('all')
  const [treeCollapsed, setTreeCollapsed] = useState(false)
  const [folderDrawerOpen, setFolderDrawerOpen] = useState(false)
  const [itemDrawerOpen, setItemDrawerOpen] = useState(false)
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()

  const treeData = useMemo(() => [{ key: 'all', title: 'Bütün qovluqlar', icon: <FolderOpenOutlined />, children: buildTreeData(folders) }], [folders])
  const allowedFolderIds = useMemo(() => selectedFolder === 'all' ? null : new Set(collectDescendantIds(folders, selectedFolder)), [folders, selectedFolder])

  const visibleItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('az')
    return items.filter((item) => (!allowedFolderIds || allowedFolderIds.has(item.folderId)) && (!query || `${item.name} ${item.sku ?? ''}`.toLocaleLowerCase('az').includes(query)))
  }, [items, search, allowedFolderIds])

  const currentCardPage = Math.min(cardPage, Math.max(1, Math.ceil(visibleItems.length / 6)))

  const parentOptions = folders
    .filter((folder) => folder.status === 'active' && (!editingFolderId || !collectDescendantIds(folders, editingFolderId).includes(folder.id)))
    .map((folder) => ({ value: folder.id, label: folder.name }))

  const activeFolderOptions = folders.filter((folder) => folder.status === 'active').map((folder) => ({ value: folder.id, label: folder.name }))

  const selectedFolderRecord = folders.find((folder) => folder.id === selectedFolder) ?? folders.find((folder) => !folder.parentId)
  const policyRows = useMemo(() => {
    if (!selectedFolderRecord) return []
    const policies = [
      ['Nomenklatura növü', (folder: NomenclatureFolder) => folder.defaultItemKind, systemDefaults.itemKind, (value: string) => itemKindLabels[value as ItemKind] ?? value],
      ['Əsas ölçü vahidi', (folder: NomenclatureFolder) => folder.defaultBaseUom, systemDefaults.baseUom, (value: string) => baseUomLabels[value] ?? value],
      ['Maya dəyəri metodu', (folder: NomenclatureFolder) => folder.defaultCostingMethod, systemDefaults.costingMethod, (value: string) => value.toUpperCase()],
      ['Alış vergisi', (folder: NomenclatureFolder) => folder.defaultPurchaseTax, systemDefaults.purchaseTax, (value: string) => taxOptions.find((option) => option.value === value)?.label ?? value],
      ['Satış vergisi', (folder: NomenclatureFolder) => folder.defaultSalesTax, systemDefaults.salesTax, (value: string) => taxOptions.find((option) => option.value === value)?.label ?? value],
      ['Partiya izləmə', (folder: NomenclatureFolder) => folder.defaultBatchTracking, systemDefaults.batchTracking, (value: string) => trackingLabels[value as TrackingRule] ?? value],
      ['Son istifadə tarixinin izlənməsi', (folder: NomenclatureFolder) => folder.defaultExpiryTracking, systemDefaults.expiryTracking, (value: string) => value === 'yes' ? 'Bəli' : 'Xeyr'],
      ['Seriya nömrəsi izləmə', (folder: NomenclatureFolder) => folder.defaultSerialTracking, systemDefaults.serialTracking, (value: string) => trackingLabels[value as TrackingRule] ?? value],
    ] as const

    return policies.map(([policy, getter, systemDefault, format]) => {
      const detail = resolveInheritedDetail(undefined, folders, selectedFolderRecord.id, getter, systemDefault)
      return { key: policy, policy, value: format(String(detail.value)), detail }
    })
  }, [folders, selectedFolderRecord])

  const resolvedKindFor = (folderId?: string, itemKind?: ItemKind) =>
    resolveInherited(itemKind, folders, folderId ?? 'all', (folder) => folder.defaultItemKind, 'stock') ?? 'stock'

  const itemKindLive: ItemKind | undefined = Form.useWatch('itemKind', itemForm)
  const folderIdLive: string | undefined = Form.useWatch('folderId', itemForm)
  const itemFormValues = Form.useWatch([], itemForm) as ItemFormValues | undefined
  const resolvedDrawerKind = resolvedKindFor(folderIdLive, itemKindLive)
  const showsInventorySection = inventoryTrackedKinds.includes(resolvedDrawerKind)

  const resolveItemDetail = <T,>(itemValue: T | undefined, folderId: string, getter: (folder: NomenclatureFolder) => T | undefined, systemDefault?: T) =>
    resolveInheritedDetail(itemValue, folders, folderId, getter, systemDefault)

  const inheritanceExtra = (field: keyof ItemFormValues, label: string, detail: ResolvedInheritance<unknown>) => detail.state === 'overridden'
    ? <Button type="link" size="small" icon={<RollbackOutlined />} onClick={() => { itemForm.setFieldValue(field, undefined); messageApi.success(`${label} valideyn dəyərinə qaytarıldı`) }}>Valideynə qaytar</Button>
    : <Flex align="center" gap={6} className="inheritance-hint"><span className="inheritance-hint-icon"><ApartmentOutlined /></span><Text type="secondary" ellipsis>{detail.sourceLabel}</Text><Tag variant="filled" className="inherited-tag">{detail.state === 'system' ? 'Sistem standartı' : detail.state === 'unconfigured' ? 'Təyin edilməyib' : 'İrsiyyət'}</Tag></Flex>

  const inheritanceBadge = (detail: ResolvedInheritance<unknown>) => detail.state === 'overridden'
    ? <Tooltip title="Fərdi dəyər"><EditOutlined className="inheritance-icon inheritance-icon-custom" aria-label="Fərdi dəyər" /></Tooltip>
    : <Tooltip title={detail.state === 'system' ? 'Sistem standartından' : detail.state === 'unconfigured' ? 'Təyin edilməyib' : detail.sourceLabel}><ApartmentOutlined className="inheritance-icon" aria-label={detail.sourceLabel} /></Tooltip>

  const openCreateFolderDrawer = () => {
    setEditingFolderId(null)
    folderForm.resetFields()
    folderForm.setFieldsValue({ status: 'active', parentId: selectedFolder === 'all' ? undefined : selectedFolder })
    setFolderDrawerOpen(true)
  }

  const openEditFolderDrawer = (folder: NomenclatureFolder) => {
    setEditingFolderId(folder.id)
    folderForm.setFieldsValue(folder)
    setFolderDrawerOpen(true)
  }

  const saveFolder = async () => {
    const values = await folderForm.validateFields().catch(() => undefined)
    if (!values) return
    const categoryScope = editingFolderId ? collectDescendantIds(folders, editingFolderId) : []
    if (values.status === 'archived' && (folders.some((folder) => folder.id !== editingFolderId && categoryScope.includes(folder.id) && folder.status === 'active') || items.some((item) => categoryScope.includes(item.folderId) && item.status === 'active'))) {
      messageApi.error('Aktiv alt qovluqları və ya elementləri olan qovluq arxivləşdirilə bilməz')
      return
    }
    setSaving(true)
    if (editingFolderId) {
      setFolders((current) => current.map((folder) => folder.id === editingFolderId ? { ...folder, ...values } : folder))
      messageApi.success('Qovluq məlumatları yeniləndi')
    } else {
      setFolders((current) => [...current, { id: crypto.randomUUID(), ...values, code: nextCategoryCode(current) }])
      messageApi.success('Yeni nomenklatura qovluğu yaradıldı')
    }
    setSaving(false)
    setFolderDrawerOpen(false)
  }

  const openCreateItemDrawer = () => {
    setEditingItemId(null)
    itemForm.resetFields()
    const defaultFolderId = selectedFolder === 'all' ? activeFolderOptions[0]?.value : selectedFolder
    itemForm.setFieldsValue({ status: 'active', folderId: defaultFolderId })
    setItemDrawerOpen(true)
  }

  const openEditItemDrawer = (item: NomenclatureItem) => {
    setEditingItemId(item.id)
    itemForm.setFieldsValue(item)
    setItemDrawerOpen(true)
  }

  const deleteFolder = (folder: NomenclatureFolder) => {
    const hasChildren = folders.some((item) => item.parentId === folder.id)
    const hasItems = items.some((item) => item.folderId === folder.id)
    if (hasChildren || hasItems) {
      messageApi.error('Alt qovluqları və ya elementləri olan qovluq silinə bilməz')
      return
    }
    setFolders((current) => current.filter((item) => item.id !== folder.id))
    if (selectedFolder === folder.id) setSelectedFolder('all')
    messageApi.success(`${folder.name} qovluğu silindi`)
  }

  const deleteItem = (item: NomenclatureItem) => {
    setItems((current) => current.filter((currentItem) => currentItem.id !== item.id))
    messageApi.success(`${item.name} elementi silindi`)
  }

  const saveItem = async () => {
    const values = await itemForm.validateFields().catch(() => undefined)
    if (!values) return
    setSaving(true)
    if (editingItemId) {
      setItems((current) => current.map((item) => item.id === editingItemId ? { ...item, ...values } : item))
      messageApi.success('Nomenklatura elementi yeniləndi')
    } else {
      setItems((current) => [...current, { id: crypto.randomUUID(), ...values }])
      messageApi.success('Yeni nomenklatura elementi yaradıldı')
    }
    setSaving(false)
    setItemDrawerOpen(false)
  }

  const exportCurrentEntity = () => {
    downloadExcel(
      ['Ad', 'Qovluq ID', 'Əsas ölçü vahidi', 'Status', 'Növ', 'Maya dəyəri metodu', 'SKU', 'Ştrixkodlar', 'Xərc maddəsi', 'Gəlir maddəsi', 'Alış vergisi', 'Satış vergisi', 'BOM'],
      visibleItems.map((item) => [
        item.name, item.folderId, item.baseUom ?? '', item.status, item.itemKind ?? '', item.costingMethod ?? '', item.sku ?? '', (item.barcodes ?? []).join(';'),
        item.expenseItem ?? '', item.incomeItem ?? '', item.purchaseTax ?? '', item.salesTax ?? '', item.hasBom ?? '',
      ]),
      'nomenklatura-elementleri',
    )
    messageApi.success(`${visibleItems.length} element Excel-ə ixrac edildi`)
  }

  const downloadItemImportTemplate = () => {
    downloadExcel(
      ['Ad', 'Qovluq ID', 'Əsas ölçü vahidi', 'Status', 'Növ'],
      [['Nümunə məhsul', activeFolderOptions[0]?.value ?? '', 'pcs', 'active', 'stock']],
      'nomenklatura-idxal-sablonu',
    )
    messageApi.success('İdxal şablonu yükləndi')
  }

  const handleImport: UploadProps['beforeUpload'] = async (file) => {
    try {
      const rows = parseImportedRows(await file.text())
      const dataRows = rows.slice(1).filter((row) => row[0])
      if (!dataRows.length) throw new Error('empty')

      const imported = dataRows.map<NomenclatureItem>((row) => ({
        id: crypto.randomUUID(),
        name: row[0],
        folderId: row[1],
        baseUom: baseUomLabels[row[2]] ? row[2] : 'pcs',
        status: row[3] === 'archived' ? 'archived' : 'active',
        itemKind: itemKindLabels[row[4] as ItemKind] ? row[4] as ItemKind : undefined,
        costingMethod: row[5] === 'fifo' || row[5] === 'avco' ? row[5] : undefined,
        sku: row[6] || undefined,
        barcodes: row[7] ? row[7].split(';').filter(Boolean) : undefined,
        expenseItem: row[8] || undefined,
        incomeItem: row[9] || undefined,
        purchaseTax: row[10] || undefined,
        salesTax: row[11] || undefined,
        hasBom: row[12] === 'yes' || row[12] === 'no' ? row[12] : undefined,
      }))
      setItems((current) => [...current, ...imported])
      messageApi.success(`${imported.length} element Excel-dən idxal edildi`)
    } catch {
      messageApi.error('Fayl oxunmadı. Sistem ixracından alınmış XLS və ya CSV faylı seçin.')
    }
    return Upload.LIST_IGNORE
  }

  const itemText = {
    name: (record: NomenclatureItem) => `${record.name} ${folders.find((folder) => folder.id === record.folderId)?.name ?? ''}`,
    sku: (record: NomenclatureItem) => record.sku ?? '',
    kind: (record: NomenclatureItem) => itemKindLabels[resolveItemDetail(record.itemKind, record.folderId, (folder) => folder.defaultItemKind, systemDefaults.itemKind).value ?? systemDefaults.itemKind],
    salesTax: (record: NomenclatureItem) => taxOptions.find((option) => option.value === resolveItemDetail(record.salesTax, record.folderId, (folder) => folder.defaultSalesTax, systemDefaults.salesTax).value)?.label ?? '',
    tracking: (record: NomenclatureItem) => {
      const resolvedKind = resolvedKindFor(record.folderId, record.itemKind)
      if (!inventoryTrackedKinds.includes(resolvedKind)) return 'Tətbiq edilmir'
      return `Partiya: ${trackingLabels[resolveItemDetail(record.batchTracking, record.folderId, (folder) => folder.defaultBatchTracking, systemDefaults.batchTracking).value ?? systemDefaults.batchTracking]}`
    },
    uom: (record: NomenclatureItem) => baseUomLabels[resolveItemDetail(record.baseUom, record.folderId, (folder) => folder.defaultBaseUom, systemDefaults.baseUom).value ?? systemDefaults.baseUom] ?? '',
    status: (record: NomenclatureItem) => record.status === 'active' ? 'Aktiv' : 'Arxivdə',
  }

  const columnSearch = (getText: (record: NomenclatureItem) => string): Partial<ColumnsType<NomenclatureItem>[number]> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div className="table-filter-dropdown" onKeyDown={(event) => event.stopPropagation()}>
        <Input
          autoFocus
          allowClear
          placeholder="Axtar"
          value={selectedKeys[0] as string}
          onChange={(event) => setSelectedKeys(event.target.value ? [event.target.value] : [])}
          onPressEnter={() => confirm()}
        />
        <Flex className="table-filter-actions" align="center" justify="space-between" gap={8}>
          <Button type="text" size="small" onClick={() => { clearFilters?.(); confirm() }}>Təmizlə</Button>
          <Button type="primary" size="small" icon={<SearchOutlined />} onClick={() => confirm()}>Axtar</Button>
        </Flex>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <Tooltip title="Sütunda axtar">
        <SearchOutlined className={`table-column-search-icon${filtered ? ' is-active' : ''}`} />
      </Tooltip>
    ),
    onFilter: (value, record) => getText(record).toLocaleLowerCase('az').includes(String(value).toLocaleLowerCase('az')),
  })

  const itemColumns: ColumnsType<NomenclatureItem> = [
    {
      title: 'Element',
      key: 'name',
      dataIndex: 'name',
      width: 240,
      fixed: 'left',
      ...columnSearch(itemText.name),
      render: (name: string, record) => (
        <Flex align="center" gap={10}>
          <span className="folder-table-icon item-table-icon"><TagOutlined /></span>
          <div>
            <Text strong>{name}</Text>
            <Text type="secondary" className="folder-path">{folders.find((folder) => folder.id === record.folderId)?.name ?? 'Qovluq tapılmadı'}</Text>
          </div>
        </Flex>
      ),
    },
    { title: 'SKU', key: 'sku', dataIndex: 'sku', width: 110, ...columnSearch(itemText.sku), render: (value?: string) => value || <Text type="secondary">—</Text> },
    {
      title: 'Növ',
      key: 'kind',
      width: 190,
      ...columnSearch(itemText.kind),
      render: (_, record) => {
        const resolved = resolveItemDetail(record.itemKind, record.folderId, (folder) => folder.defaultItemKind, systemDefaults.itemKind)
        const kind = resolved.value ?? systemDefaults.itemKind
        return <Space size={6}><span className="row-kind-icon">{itemKindIcons[kind]}</span>{itemKindLabels[kind]}{inheritanceBadge(resolved)}</Space>
      },
    },
    {
      title: 'Satış vergisi',
      key: 'salesTax',
      width: 145,
      ...columnSearch(itemText.salesTax),
      render: (_, record) => {
        const resolved = resolveItemDetail(record.salesTax, record.folderId, (folder) => folder.defaultSalesTax, systemDefaults.salesTax)
        const label = taxOptions.find((option) => option.value === resolved.value)?.label ?? '—'
        return <Space size={6}><span>{label}</span>{inheritanceBadge(resolved)}</Space>
      },
    },
    {
      title: 'İzləmə',
      key: 'tracking',
      width: 145,
      ...columnSearch(itemText.tracking),
      render: (_, record) => {
        const resolvedKind = resolvedKindFor(record.folderId, record.itemKind)
        if (!inventoryTrackedKinds.includes(resolvedKind)) return <Text type="secondary">Tətbiq edilmir</Text>
        const resolved = resolveItemDetail(record.batchTracking, record.folderId, (folder) => folder.defaultBatchTracking, systemDefaults.batchTracking)
        return <Space size={6}><span>Partiya: {trackingLabels[resolved.value ?? systemDefaults.batchTracking]}</span>{inheritanceBadge(resolved)}</Space>
      },
    },
    { title: 'Əsas UoM', key: 'uom', width: 120, ...columnSearch(itemText.uom), render: (_, record) => {
      const resolved = resolveItemDetail(record.baseUom, record.folderId, (folder) => folder.defaultBaseUom, systemDefaults.baseUom)
      return <Space size={6}><span>{baseUomLabels[resolved.value ?? systemDefaults.baseUom] ?? '—'}</span>{resolved.state !== 'overridden' && inheritanceBadge(resolved)}</Space>
    } },
    { title: 'Status', key: 'status', dataIndex: 'status', width: 110, fixed: 'right', ...columnSearch(itemText.status), render: (value: NomenclatureItem['status']) => <Tag icon={value === 'active' ? <CheckCircleOutlined /> : <StopOutlined />} color={value === 'active' ? 'success' : 'default'}>{value === 'active' ? 'Aktiv' : 'Arxivdə'}</Tag> },
    {
      title: 'Əməliyyatlar',
      key: 'actions',
      width: 120,
      align: 'center',
      fixed: 'right',
      render: (_, record) => <Space size={2}><Tooltip title="Redaktə et"><Button type="text" className="table-edit-button" icon={<EditOutlined />} aria-label={`${record.name} elementini redaktə et`} onClick={() => openEditItemDrawer(record)} /></Tooltip><Popconfirm title="Element silinsin?" description="Bu əməliyyat geri qaytarıla bilməz." okText="Sil" cancelText="Ləğv et" okButtonProps={{ danger: true }} onConfirm={() => deleteItem(record)}><Tooltip title="Sil"><Button type="text" danger icon={<DeleteOutlined />} aria-label={`${record.name} elementini sil`} /></Tooltip></Popconfirm></Space>,
    },
  ]

  return (
    <>
      {contextHolder}
      <Flex vertical gap={16}>
        <Segmented aria-label="Nomenklatura görünüşü" value={nomenclatureSection} onChange={setNomenclatureSection} options={[{ value: 'items', label: 'Elementlər', icon: <TagOutlined /> }, { value: 'categories', label: 'Kateqoriya qaydaları', icon: <ApartmentOutlined /> }]} />
        {nomenclatureSection === 'items' && <>
        <Flex align="stretch" gap={16} className="nomenclature-layout">
          <div className={`nomenclature-tree-panel${treeCollapsed ? ' collapsed' : ''}`}>
            <Card
              className="folder-tree-card"
              title={
                treeCollapsed ? null : (
                  <Flex align="center" gap={10} className="folder-tree-card-heading">
                    <span className="folder-tree-card-heading-icon"><ApartmentOutlined /></span>
                    <span className="folder-tree-card-title">Qovluqlar</span>
                  </Flex>
                )
              }
              extra={
                <Tooltip title={treeCollapsed ? 'Paneli aç' : 'Paneli bağla'}>
                  <Button className="folder-panel-toggle" type="text" size="small" icon={treeCollapsed ? <DoubleRightOutlined /> : <DoubleLeftOutlined />} aria-label={treeCollapsed ? 'Qovluq panelini aç' : 'Qovluq panelini bağla'} onClick={() => setTreeCollapsed((current) => !current)} />
                </Tooltip>
              }
            >
              <Tooltip title={treeCollapsed ? 'Yeni qovluq' : ''} placement="right">
                <Button type="text" block className="folder-add-block" icon={<FolderAddOutlined />} onClick={openCreateFolderDrawer}>
                  <span className="folder-add-label">Yeni qovluq</span>
                </Button>
              </Tooltip>
              <Tree
                blockNode
                showIcon
                showLine={{ showLeafIcon: false }}
                defaultExpandAll
                selectedKeys={[selectedFolder]}
                treeData={treeData}
                switcherIcon={({ expanded }) => expanded ? <DownOutlined /> : <RightOutlined />}
                onSelect={(keys) => { setSelectedFolder(String(keys[0] ?? 'all')); setCardPage(1) }}
                titleRender={(node) => {
                  const folder = folders.find((item) => item.id === node.key)
                  return (
                    <Tooltip title={node.title as string} placement={treeCollapsed ? 'right' : 'top'}>
                      <Flex justify="space-between" align="center" gap={8} className="folder-tree-node">
                        <span className="folder-tree-node-title">{node.title as string}</span>
                        {folder && (
                          <Space size={0} className="folder-tree-node-actions" onClick={(event) => event.stopPropagation()}>
                            <Tooltip title="Redaktə et"><Button type="text" size="small" icon={<EditOutlined />} aria-label={`${folder.name} qovluğunu redaktə et`} onClick={() => openEditFolderDrawer(folder)} /></Tooltip>
                            <Popconfirm title="Qovluq silinsin?" description="Bu əməliyyat geri qaytarıla bilməz." okText="Sil" cancelText="Ləğv et" okButtonProps={{ danger: true }} onConfirm={() => deleteFolder(folder)}>
                              <Tooltip title="Sil"><Button type="text" size="small" danger icon={<DeleteOutlined />} aria-label={`${folder.name} qovluğunu sil`} /></Tooltip>
                            </Popconfirm>
                          </Space>
                        )}
                      </Flex>
                    </Tooltip>
                  )
                }}
              />
            </Card>
          </div>
          <div className="nomenclature-content-panel">
            <Card className="nomenclature-table-card" title={<Flex justify="space-between" align="center"><span>{selectedFolder === 'all' ? 'Bütün nomenklatura elementləri' : folders.find((folder) => folder.id === selectedFolder)?.name ?? 'Nomenklatura elementləri'}</span><Text type="secondary">{visibleItems.length} element</Text></Flex>}>
              <Flex className="page-toolbar nomenclature-toolbar" justify="space-between" align="center" wrap gap={12}>
                <Input allowClear prefix={<SearchOutlined />} placeholder="Element adı və ya SKU üzrə axtarış..." value={search} onChange={(event) => { setSearch(event.target.value); setCardPage(1) }} className="counterparty-search" />
                <Space wrap>
                  <Segmented value={view} onChange={(value) => setView(value as 'cards' | 'table')} options={[{ value: 'cards', label: 'Kartlar', icon: <AppstoreOutlined /> }, { value: 'table', label: 'Cədvəl', icon: <TableOutlined /> }]} />
                  <Dropdown
                    trigger={['click']}
                    menu={{
                      className: 'excel-actions-menu',
                      onClick: ({ key }) => {
                        if (key === 'template') downloadItemImportTemplate()
                        if (key === 'filtered' && search.trim()) exportCurrentEntity()
                        if (key === 'import') uploadButtonRef.current?.click()
                      },
                      items: [
                        { key: 'template', icon: <img className="excel-menu-logo" src="/logo/Microsoft_Excel-Logo.wine.png" alt="" />, label: <div className="excel-menu-content"><strong>Excel şablonu yüklə</strong><span>İdxal üçün nümunə fayl</span></div> },
                        { key: 'filtered', className: !search.trim() ? 'excel-menu-item-disabled' : undefined, icon: <img className="excel-menu-logo" src="/logo/Microsoft_Excel-Logo.wine.png" alt="" />, label: <Tooltip title="Filter tətbiq etdikdə, filterli excel export edə bilərsiniz. Klikləyərək filter tətbiq edin." open={!search.trim() && filterExportTooltipOpen}><span className="excel-menu-tooltip-target" aria-disabled={!search.trim()} onMouseEnter={() => setFilterExportTooltipOpen(true)} onMouseLeave={() => setFilterExportTooltipOpen(false)}><span className="excel-menu-content"><strong>Filterli yüklə</strong><span>{search.trim() ? 'Tətbiq edilmiş filterlər üzrə' : 'Filter tətbiq olunur'}</span></span></span></Tooltip> },
                        { key: 'import', icon: <img className="excel-menu-logo" src="/logo/Microsoft_Excel-Logo.wine.png" alt="" />, label: <div className="excel-menu-content"><strong>Excel-dən idxal et</strong><span>Fayldan yeni məlumatları əlavə et</span></div> },
                      ],
                    }}
                  >
                    <Button className="excel-export-button" icon={<img className="excel-logo" src="/logo/Microsoft_Excel-Logo.wine.png" alt="" />}>Excel <DownOutlined /></Button>
                  </Dropdown>
                  <Tooltip title="Cədvəl sütunları"><Button icon={<SettingOutlined />} aria-label="Cədvəl sütunları" onClick={() => setTableSettingsOpen(true)} /></Tooltip>
                  <Upload accept=".xls,.csv,.tsv" showUploadList={false} beforeUpload={handleImport}>
                    <button ref={uploadButtonRef} type="button" className="hidden-upload-trigger" tabIndex={-1} aria-hidden="true" />
                  </Upload>
                  <Button type="primary" icon={<PlusOutlined />} onClick={openCreateItemDrawer}>Yeni element</Button>
                </Space>
              </Flex>
              {view === 'table' ? (
                <CustomDataTable
                  rowKey="id"
                  columns={itemColumns}
                  dataSource={visibleItems}
                  pagination={{
                    defaultPageSize: 5,
                    pageSizeOptions: [5, 10, 20],
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => `${range[0]}–${range[1]} / ${total} element`,
                  }}
                  scroll={{ x: 1250 }}
                  locale={{ emptyText: <Empty description="Element tapılmadı" /> }}
                  columnLabels={{ name: 'Element', sku: 'SKU', kind: 'Növ', salesTax: 'Satış vergisi', tracking: 'İzləmə', uom: 'Əsas UoM', status: 'Status', actions: 'Əməliyyatlar' }}
                  defaultVisibleColumnKeys={['name', 'sku', 'kind', 'salesTax', 'tracking', 'uom', 'status', 'actions']}
                  defaultColumnOrder={['name', 'sku', 'kind', 'salesTax', 'tracking', 'uom', 'status', 'actions']}
                  defaultFixedColumns={{ name: 'left', status: 'right', actions: 'right' }}
                  settingsOpen={tableSettingsOpen}
                  onSettingsOpenChange={setTableSettingsOpen}
                />
              ) : visibleItems.length === 0 ? (
                <Empty description="Element tapılmadı" />
              ) : (
                <>
                <Row gutter={[16, 16]}>
                  {visibleItems.slice((currentCardPage - 1) * 6, currentCardPage * 6).map((item) => {
                    const resolvedKind = resolvedKindFor(item.folderId, item.itemKind)
                    return (
                      <Col xs={24} md={12} xl={8} key={item.id}>
                        <Card hoverable className="counterparty-card">
                          <Flex justify="space-between" align="flex-start" gap={12}>
                            <Flex gap={10} align="flex-start">
                              <span className="folder-table-icon item-table-icon"><TagOutlined /></span>
                              <Flex vertical gap={4} className="counterparty-details">
                                <Text strong className="company-name">{item.name}</Text>
                                <Text type="secondary">{folders.find((folder) => folder.id === item.folderId)?.name ?? 'Qovluq tapılmadı'}</Text>
                              </Flex>
                            </Flex>
                            <Tooltip title="Redaktə et"><Button type="text" icon={<EditOutlined />} aria-label={`${item.name} elementini redaktə et`} onClick={() => openEditItemDrawer(item)} /></Tooltip>
                          </Flex>
                          <Space wrap size={[6, 6]} className="counterparty-tags">
                            <Tag color="blue">{itemKindLabels[resolvedKind]}</Tag>
                            <Tag color={item.status === 'active' ? 'success' : 'default'}>{item.status === 'active' ? 'Aktiv' : 'Arxivdə'}</Tag>
                            {item.sku && <Tag>{item.sku}</Tag>}
                          </Space>
                        </Card>
                      </Col>
                    )
                  })}
                </Row>
                <Pagination className="pagination-panel" current={currentCardPage} total={visibleItems.length} pageSize={6} showSizeChanger={false} showTotal={(total, range) => `${range[0]}–${range[1]} / ${total} element`} onChange={setCardPage} />
                </>
              )}
            </Card>
          </div>
        </Flex>
        </>}

        {nomenclatureSection === 'categories' && (
          <Flex align="stretch" gap={16} className="nomenclature-layout category-policy-layout">
            <div className={`nomenclature-tree-panel${treeCollapsed ? ' collapsed' : ''}`}>
              <Card className="folder-tree-card" title={treeCollapsed ? null : <Flex align="center" gap={10} className="folder-tree-card-heading"><span className="folder-tree-card-heading-icon"><FolderOpenOutlined /></span><span className="folder-tree-card-title">Kateqoriya ağacı</span></Flex>} extra={<Tooltip title={treeCollapsed ? 'Paneli aç' : 'Paneli bağla'}><Button className="folder-panel-toggle" type="text" size="small" icon={treeCollapsed ? <DoubleRightOutlined /> : <DoubleLeftOutlined />} aria-label={treeCollapsed ? 'Qovluq panelini aç' : 'Qovluq panelini bağla'} onClick={() => setTreeCollapsed((current) => !current)} /></Tooltip>}>
                <Button type="primary" block icon={<FolderAddOutlined />} onClick={openCreateFolderDrawer}>Yeni qovluq</Button>
                <Tree blockNode showIcon showLine={{ showLeafIcon: false }} defaultExpandAll selectedKeys={[selectedFolder]} treeData={treeData} switcherIcon={({ expanded }) => expanded ? <DownOutlined /> : <RightOutlined />} onSelect={(keys) => setSelectedFolder(String(keys[0] ?? 'all'))} />
              </Card>
            </div>
            <div className="nomenclature-content-panel">
              <Card className="category-policy-card" title={<Flex justify="space-between" align="center" wrap gap={8}><Space><span className="folder-tree-card-heading-icon"><SettingOutlined /></span><span>Effektiv qaydalar</span></Space><Tag color={selectedFolderRecord?.status === 'active' ? 'success' : 'default'}>{selectedFolderRecord?.status === 'active' ? 'Aktiv' : 'Arxivdə'}</Tag></Flex>}>
                <Descriptions className="category-policy-summary" size="small" column={{ xs: 1, sm: 2 }} items={[{ key: 'name', label: 'Seçilmiş qovluq', children: selectedFolderRecord?.name ?? '—' }, { key: 'code', label: 'Kod', children: selectedFolderRecord?.code ?? 'Sistem tərəfindən yaradılacaq' }]} />
                <Alert className="inheritance-alert" showIcon type="info" title="Bu cədvəl qovluğun cari effektiv qaydalarını göstərir." description="Boş parametr ana qovluqdan, heç bir dəyər olmadıqda isə sistem standartından götürülür." />
                <Table rowKey="key" size="middle" className="category-policy-table" dataSource={policyRows} pagination={false} scroll={{ x: 640 }} columns={[{ title: 'Qayda', dataIndex: 'policy', key: 'policy', width: '38%' }, { title: 'Effektiv dəyər', dataIndex: 'value', key: 'value', render: (value: string) => <Text strong>{value}</Text> }, { title: 'Mənbə', key: 'source', render: (_, row: { detail: ResolvedInheritance<unknown> }) => <Tag color={row.detail.state === 'folder' ? 'blue' : row.detail.state === 'system' ? 'default' : 'green'}>{row.detail.sourceLabel}</Tag> }]} />
              </Card>
            </div>
          </Flex>
        )}
      </Flex>

      {/* A) Nomenklatura qovluğu — default parametrlər + irsiyyət */}
      <Drawer
        className="nomenclature-drawer"
        title={<Flex gap={12} align="center"><span className="drawer-title-icon"><FolderOutlined /></span><div><Title level={4}>{editingFolderId ? 'Qovluğu redaktə et' : 'Yeni nomenklatura qovluğu'}</Title><Text type="secondary">Struktur və irsiyyət qaydalarını təyin edin</Text></div></Flex>}
        placement="right"
        size="min(94vw, 1200px)"
        open={folderDrawerOpen}
        onClose={() => setFolderDrawerOpen(false)}
        closable={{ placement: 'end' }}
        footer={<Flex justify="flex-end" gap={8}><Button onClick={() => setFolderDrawerOpen(false)}>Ləğv et</Button><Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={saveFolder}>{editingFolderId ? 'Yadda saxla' : 'Qovluq yarat'}</Button></Flex>}
      >
        <Alert className="inheritance-alert" showIcon type="info" title="Boş sahələr ana qovluqdan, sonra sistem standartından götürülür." />
        <Form name="nomenclature-folder" form={folderForm} layout="vertical" requiredMark="optional" className="folder-form">
          <Card size="small" title={<SectionTitle icon={<ApartmentOutlined />}>Qovluğun strukturu</SectionTitle>} className="form-section-card">
            <Row gutter={16}>
              <Col xs={24} md={16}><Form.Item name="name" label="Ad" rules={[{ required: true, message: 'Qovluğun adını daxil edin' }]}><Input placeholder="Məsələn, Hazır məhsullar" /></Form.Item></Col>
              <Col xs={24} md={8}><Form.Item name="code" label="Kod"><Input readOnly placeholder="Sistem tərəfindən yaradılacaq" /></Form.Item></Col>
              <Col xs={24} md={16}><Form.Item name="parentId" label="Ana qovluq"><Select allowClear showSearch optionFilterProp="label" placeholder="Əsas səviyyə" options={parentOptions} /></Form.Item></Col>
              <Col xs={24} md={8}><Form.Item name="status" label="Status" rules={[{ required: true }]}><Radio.Group optionType="button" buttonStyle="solid" options={[{ value: 'active', label: 'Aktiv' }, { value: 'archived', label: 'Arxivdə' }]} /></Form.Item></Col>
            </Row>
          </Card>

          <Card size="small" title={<SectionTitle icon={<SettingOutlined />}>Standart qaydalar</SectionTitle>} className="form-section-card">
            <Row gutter={16}>
              <Col span={24}><Form.Item name="defaultItemKind" label="Standart nomenklatura növü" extra="Boş saxlanıldıqda ana qovluğun qaydası tətbiq olunur."><Select allowClear placeholder="İrsiyyət / Sistem standartı" options={itemKindOptions} /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="defaultBaseUom" label="Standart əsas ölçü vahidi"><Select allowClear placeholder="İrsiyyət / Sistem standartı" options={baseUomOptions} /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="defaultCostingMethod" label="Maya dəyəri metodu"><Select allowClear placeholder="İrsiyyət / Sistem standartı" options={costingMethodOptions} /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="defaultExpenseItem" label="Standart xərc maddəsi"><Select allowClear placeholder="İrsiyyət" options={expenseOptions} /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="defaultIncomeItem" label="Standart gəlir maddəsi"><Select allowClear placeholder="İrsiyyət" options={incomeOptions} /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="defaultPurchaseTax" label="Standart alış vergisi"><Select allowClear placeholder="İrsiyyət" options={taxOptions} /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="defaultSalesTax" label="Standart satış vergisi"><Select allowClear placeholder="İrsiyyət" options={taxOptions} /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="defaultHasBom" label="Standart BOM / resept"><Select allowClear placeholder="İrsiyyət" options={yesNoOptions} /></Form.Item></Col>
            </Row>
          </Card>

          <Card size="small" title={<SectionTitle icon={<DatabaseOutlined />}>Anbar icazələri — standartlar</SectionTitle>} className="form-section-card">
            <Row gutter={16}>
              <Col xs={24} md={12}><Form.Item name="defaultBatchTracking" label="Partiya izləmə"><Select allowClear placeholder="İrsiyyət" options={trackingOptions} /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="defaultExpiryTracking" label="Son istifadə tarixinin izlənməsi"><Select allowClear placeholder="İrsiyyət" options={yesNoOptions} /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="defaultSerialTracking" label="Seriya nömrəsi izləmə"><Select allowClear placeholder="İrsiyyət" options={trackingOptions} /></Form.Item></Col>
            </Row>
          </Card>
        </Form>
      </Drawer>

      {/* B) Nomenklatura elementi — konkret məlumat + override */}
      <Drawer
        className="nomenclature-drawer"
        title={<Flex gap={12} align="center"><span className="drawer-title-icon"><TagOutlined /></span><div><Title level={4}>{editingItemId ? 'Elementi redaktə et' : 'Yeni nomenklatura elementi'}</Title></div></Flex>}
        placement="right"
        size="min(94vw, 1200px)"
        open={itemDrawerOpen}
        onClose={() => setItemDrawerOpen(false)}
        closable={{ placement: 'end' }}
        footer={<Flex justify="flex-end" gap={8}><Button onClick={() => setItemDrawerOpen(false)}>Ləğv et</Button><Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={saveItem}>{editingItemId ? 'Yadda saxla' : 'Element yarat'}</Button></Flex>}
      >
        <Alert className="inheritance-alert" showIcon type="info" title="Boş buraxılan sahələr qovluqdan irsən keçəcək." />
        <Form name="nomenclature-item" form={itemForm} layout="vertical" requiredMark="optional" className="folder-form">
          <Card size="small" title={<SectionTitle icon={<IdcardOutlined />}>Məcburi sahələr</SectionTitle>} className="form-section-card">
            <Row gutter={16}>
              <Col xs={24} md={16}><Form.Item name="name" label="Ad" rules={[{ required: true, message: 'Elementin adını daxil edin' }]}><Input placeholder="Məsələn, Buğda unu (kisə)" /></Form.Item></Col>
              <Col xs={24} md={8}><Form.Item name="status" label="Status" rules={[{ required: true }]}><Radio.Group optionType="button" buttonStyle="solid" options={[{ value: 'active', label: 'Aktiv' }, { value: 'archived', label: 'Arxivdə' }]} /></Form.Item></Col>
              <Col xs={24} md={8}><Form.Item name="folderId" label="Qovluq (category)" rules={[{ required: true, message: 'Elementin qovluğunu seçin' }]}><Select showSearch optionFilterProp="label" placeholder="Qovluq seçin" options={activeFolderOptions} /></Form.Item></Col>
              <Col xs={24} md={8}><Form.Item name="baseUom" label="Əsas ölçü vahidi (Base UoM)" extra={inheritanceExtra('baseUom', 'Əsas ölçü vahidi', resolveItemDetail(itemFormValues?.baseUom, folderIdLive ?? 'all', (folder) => folder.defaultBaseUom, systemDefaults.baseUom))}><Select allowClear placeholder="İrsiyyət / Sistem standartı" options={baseUomOptions} /></Form.Item></Col>
              <Col xs={24} md={8}>
                <Form.Item name="itemKind" label="Yekun növ (Item kind)" extra={inheritanceExtra('itemKind', 'Yekun növ', resolveItemDetail(itemFormValues?.itemKind, folderIdLive ?? 'all', (folder) => folder.defaultItemKind, systemDefaults.itemKind))}>
                  <Select allowClear placeholder="İrsiyyət (qovluqdan)" options={itemKindOptions} />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card size="small" title={<SectionTitle icon={<SettingOutlined />}>İrsən keçən və override edilə bilən sahələr</SectionTitle>} className="form-section-card">
            <Row gutter={16}>
              <Col xs={24} md={12}><Form.Item name="expenseItem" label="Xərc maddəsi (Expense item)" extra={inheritanceExtra('expenseItem', 'Xərc maddəsi', resolveItemDetail(itemFormValues?.expenseItem, folderIdLive ?? 'all', (folder) => folder.defaultExpenseItem))}><Select allowClear placeholder="İrsiyyət" options={expenseOptions} /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="incomeItem" label="Gəlir maddəsi (Income item)" extra={inheritanceExtra('incomeItem', 'Gəlir maddəsi', resolveItemDetail(itemFormValues?.incomeItem, folderIdLive ?? 'all', (folder) => folder.defaultIncomeItem))}><Select allowClear placeholder="İrsiyyət" options={incomeOptions} /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="purchaseTax" label="Alış vergisi (Purchase tax)" extra={inheritanceExtra('purchaseTax', 'Alış vergisi', resolveItemDetail(itemFormValues?.purchaseTax, folderIdLive ?? 'all', (folder) => folder.defaultPurchaseTax, systemDefaults.purchaseTax))}><Select allowClear placeholder="İrsiyyət" options={taxOptions} /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="salesTax" label="Satış vergisi (Sales tax)" extra={inheritanceExtra('salesTax', 'Satış vergisi', resolveItemDetail(itemFormValues?.salesTax, folderIdLive ?? 'all', (folder) => folder.defaultSalesTax, systemDefaults.salesTax))}><Select allowClear placeholder="İrsiyyət" options={taxOptions} /></Form.Item></Col>
              <Col span={24}><Form.Item name="hasBom" label="BOM / Resept (Has BOM/Recipe)" extra={inheritanceExtra('hasBom', 'BOM / Resept', resolveItemDetail(itemFormValues?.hasBom, folderIdLive ?? 'all', (folder) => folder.defaultHasBom))}><Select allowClear placeholder="İrsiyyət" options={yesNoOptions} /></Form.Item></Col>
            </Row>
          </Card>

          {showsInventorySection && (
            <Card size="small" title={<SectionTitle icon={<DatabaseOutlined />}>Anbar icazələri (Goods / WIP / Finished üçün)</SectionTitle>} className="form-section-card">
              <Row gutter={16}>
                <Col xs={24} md={12}><Form.Item name="batchTracking" label="Partiya izləmə (Batch tracking)" extra={inheritanceExtra('batchTracking', 'Partiya izləmə', resolveItemDetail(itemFormValues?.batchTracking, folderIdLive ?? 'all', (folder) => folder.defaultBatchTracking, systemDefaults.batchTracking))}><Select allowClear placeholder="İrsiyyət" options={trackingOptions} /></Form.Item></Col>
                <Col xs={24} md={12}><Form.Item name="expiryTracking" label="Son istifadə tarixi (Expiry tracking)" extra={inheritanceExtra('expiryTracking', 'Son istifadə tarixi', resolveItemDetail(itemFormValues?.expiryTracking, folderIdLive ?? 'all', (folder) => folder.defaultExpiryTracking, systemDefaults.expiryTracking))}><Select allowClear placeholder="İrsiyyət" options={yesNoOptions} /></Form.Item></Col>
                <Col xs={24} md={12}><Form.Item name="serialTracking" label="Seriya izləmə (Serial tracking)" extra={inheritanceExtra('serialTracking', 'Seriya izləmə', resolveItemDetail(itemFormValues?.serialTracking, folderIdLive ?? 'all', (folder) => folder.defaultSerialTracking, systemDefaults.serialTracking))}><Select allowClear placeholder="İrsiyyət" options={trackingOptions} /></Form.Item></Col>
                <Col xs={24} md={12}><Form.Item name="costingMethod" label="Maya dəyəri metodu" extra={inheritanceExtra('costingMethod', 'Maya dəyəri metodu', resolveItemDetail(itemFormValues?.costingMethod, folderIdLive ?? 'all', (folder) => folder.defaultCostingMethod, systemDefaults.costingMethod))}><Select allowClear placeholder="İrsiyyət / Sistem standartı" options={costingMethodOptions} /></Form.Item></Col>
              </Row>
            </Card>
          )}

          <Card size="small" title={<SectionTitle icon={<BarcodeOutlined />}>İdentifikatorlar (istəyə bağlı)</SectionTitle>} className="form-section-card">
            <Row gutter={16}>
              <Col xs={24} md={12}><Form.Item name="sku" label="SKU / Məhsul kodu"><Input placeholder="Məsələn, FIN-001" /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="barcodes" label="Barkod(lar)"><Select mode="tags" placeholder="Barkod daxil edib Enter basın" tokenSeparators={[',', ' ']} /></Form.Item></Col>
            </Row>
          </Card>
        </Form>
      </Drawer>
    </>
  )
}
