import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ArrowDownOutlined, ArrowUpOutlined, HolderOutlined, SettingOutlined } from '@ant-design/icons'
import { Button, Checkbox, Divider, Drawer, Flex, Table, Tooltip, Typography } from 'antd'
import type { TableColumnsType, TableProps } from 'antd'

const { Text } = Typography

type FixedColumnPosition = 'left' | 'right'

type CustomDataTableProps<T extends object> = TableProps<T> & {
  columnLabels?: Record<string, string>
  defaultVisibleColumnKeys?: string[]
  defaultColumnOrder?: string[]
  defaultFixedColumns?: Record<string, FixedColumnPosition>
  settingsTitle?: string
  settingsDescription?: string
  settingsOpen?: boolean
  onSettingsOpenChange?: (open: boolean) => void
}

function columnKey<T extends object>(column: TableColumnsType<T>[number], index: number): string {
  if ('key' in column && column.key !== undefined) return String(column.key)
  if ('dataIndex' in column && column.dataIndex !== undefined) {
    return Array.isArray(column.dataIndex) ? column.dataIndex.join('.') : String(column.dataIndex)
  }
  return `column-${index}`
}

export function CustomDataTable<T extends object>({
  columns = [],
  columnLabels,
  defaultVisibleColumnKeys,
  defaultColumnOrder,
  defaultFixedColumns = {},
  settingsTitle = 'Cədvəl sütunları',
  settingsDescription = 'Sütunları göstərin, sıralayın və sabitləyin. Sabit sütunlar üfüqi sürüşdürmə zamanı görünən qalır.',
  settingsOpen,
  onSettingsOpenChange,
  ...tableProps
}: CustomDataTableProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const settingsId = useId()
  const definitions = useMemo(() => columns.map((column, index) => ({ column, key: columnKey(column, index) })), [columns])
  const initialOrder = defaultColumnOrder ?? definitions.map(({ key }) => key)
  const initialVisible = defaultVisibleColumnKeys ?? initialOrder
  const initialFixedColumns = { ...defaultFixedColumns }
  definitions.forEach(({ column, key }) => {
    if (column.fixed && !Object.hasOwn(initialFixedColumns, key)) {
      initialFixedColumns[key] = column.fixed === 'right' || column.fixed === 'end' ? 'right' : 'left'
    }
  })
  const [columnOrder, setColumnOrder] = useState(initialOrder)
  const [visibleColumnKeys, setVisibleColumnKeys] = useState(initialVisible)
  const [fixedColumns, setFixedColumns] = useState<Record<string, FixedColumnPosition>>(initialFixedColumns)
  const [draggedColumnKey, setDraggedColumnKey] = useState<string | null>(null)
  const [internalSettingsOpen, setInternalSettingsOpen] = useState(false)
  const setSettingsOpen = (open: boolean) => onSettingsOpenChange?.(open) ?? setInternalSettingsOpen(open)
  const isSettingsOpen = settingsOpen ?? internalSettingsOpen

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width))
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

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
  }

  const pinnedWidth = definitions.filter(({ key }) => visibleColumnKeys.includes(key) && fixedColumns[key])
    .reduce((width, { column }) => width + (typeof column.width === 'number' ? column.width : 160), 0)
  const canPinColumns = containerWidth >= pinnedWidth + 240

  const moveColumn = (targetKey: string) => {
    if (!draggedColumnKey || draggedColumnKey === targetKey) return
    setColumnOrder((current) => {
      const next = current.filter((key) => key !== draggedColumnKey)
      const targetIndex = next.indexOf(targetKey)
      next.splice(targetIndex < 0 ? next.length : targetIndex, 0, draggedColumnKey)
      return next
    })
    setDraggedColumnKey(null)
  }

  const orderedColumns = columnOrder
    .map((key) => definitions.find((definition) => definition.key === key))
    .filter((definition): definition is { column: TableColumnsType<T>[number]; key: string } => Boolean(definition))
    .filter(({ key }) => visibleColumnKeys.includes(key))
    .map(({ column, key }) => ({
      ...column,
      key,
      fixed: canPinColumns ? fixedColumns[key] : undefined,
      onHeaderCell: () => ({
        draggable: true,
        onDragStart: () => setDraggedColumnKey(key),
        onDragOver: (event: React.DragEvent<HTMLTableCellElement>) => event.preventDefault(),
        onDrop: () => moveColumn(key),
        onDragEnd: () => setDraggedColumnKey(null),
        className: draggedColumnKey === key ? 'counterparty-table-header-dragging' : 'counterparty-table-header-draggable',
      }),
    }))

  const resetSettings = () => {
    setColumnOrder(initialOrder)
    setVisibleColumnKeys(initialVisible)
    setFixedColumns(initialFixedColumns)
  }

  return (
    <>
      {!onSettingsOpenChange && <Flex justify="flex-end" className="custom-data-table-settings-toolbar"><Tooltip title={settingsTitle}><Button icon={<SettingOutlined />} aria-label={settingsTitle} onClick={() => setSettingsOpen(true)} /></Tooltip></Flex>}
      <div ref={containerRef} className="responsive-data-table">
        <Table<T> {...tableProps} columns={orderedColumns} scroll={tableProps.scroll ?? { x: 'max-content' }} />
      </div>
      <Drawer
        title={<Flex align="center" gap={8}><SettingOutlined /><span>{settingsTitle}</span></Flex>}
        placement="right"
        size="min(94vw, 390px)"
        open={isSettingsOpen}
        onClose={() => setSettingsOpen(false)}
        footer={<Flex justify="space-between" wrap gap={8}><Button onClick={resetSettings}>Standarta qaytar</Button><Button type="primary" onClick={() => setSettingsOpen(false)}>Hazırdır</Button></Flex>}
      >
        <Text type="secondary">{settingsDescription}</Text>
        <Divider />
        <Flex vertical gap={20} className="column-settings-sections">
          <section aria-labelledby={`${settingsId}-order-title`}>
            <Text strong id={`${settingsId}-order-title`}>Sütunların sırası</Text>
            <Text type="secondary" className="column-settings-section-description">Sütunları sürükləyərək cədvəldəki yerlərini dəyişin.</Text>
            <Flex vertical gap={8} className="column-settings-list">
              {columnOrder.map((key, index) => (
                <div
                  key={key}
                  className={`column-settings-row${draggedColumnKey === key ? ' column-settings-row-dragging' : ''}`}
                  draggable
                  onDragStart={() => setDraggedColumnKey(key)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => moveColumn(key)}
                  onDragEnd={() => setDraggedColumnKey(null)}
                >
                  <HolderOutlined className="column-drag-handle" />
                  <Checkbox checked={visibleColumnKeys.includes(key)} disabled={key === initialOrder[0] || key === 'actions'} onChange={(event) => setVisibleColumnKeys((current) => event.target.checked ? [...current, key] : current.filter((columnKey) => columnKey !== key))}>
                    {columnLabels?.[key] ?? key}
                  </Checkbox>
                  <Flex className="column-order-actions" gap={4}>
                    <Tooltip title="Yuxarı köçür"><Button type="text" icon={<ArrowUpOutlined />} disabled={index === 0} aria-label={`${columnLabels?.[key] ?? key} sütununu yuxarı köçür`} onClick={() => reorderColumn(key, -1)} /></Tooltip>
                    <Tooltip title="Aşağı köçür"><Button type="text" icon={<ArrowDownOutlined />} disabled={index === columnOrder.length - 1} aria-label={`${columnLabels?.[key] ?? key} sütununu aşağı köçür`} onClick={() => reorderColumn(key, 1)} /></Tooltip>
                  </Flex>
                </div>
              ))}
            </Flex>
          </section>
          <section aria-labelledby={`${settingsId}-fixed-title`}>
            <Text strong id={`${settingsId}-fixed-title`}>Sabit sütunlar</Text>
            <Text type="secondary" className="column-settings-section-description">Sürüşdürmə zamanı görünən qalacaq sütunları seçin.</Text>
            <Flex vertical gap={8} className="column-settings-list">
              {columnOrder.map((key) => (
                <Flex key={key} className="column-fixed-row" justify="space-between" align="center">
                  <Text>{columnLabels?.[key] ?? key}</Text>
                  <Checkbox
                    checked={Boolean(fixedColumns[key])}
                    onChange={(event) => setFixedColumns((current) => {
                      if (!event.target.checked) {
                        const next = { ...current }
                        delete next[key]
                        return next
                      }
                      return { ...current, [key]: key === columnOrder[0] ? 'left' : 'right' }
                    })}
                  >
                    Sabit
                  </Checkbox>
                </Flex>
              ))}
            </Flex>
          </section>
        </Flex>
      </Drawer>
    </>
  )
}
