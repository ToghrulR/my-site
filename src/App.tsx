import { useEffect, useMemo, useState } from 'react'
import {
  AccountBookOutlined,
  ApartmentOutlined,
  AppstoreOutlined,
  BranchesOutlined,
  CloseOutlined,
  ColumnHeightOutlined,
  DownOutlined,
  FileTextOutlined,
  GlobalOutlined,
  InboxOutlined,
  LockOutlined,
  MenuOutlined,
  NodeIndexOutlined,
  PartitionOutlined,
  SwapOutlined,
  UserSwitchOutlined,
  BgColorsOutlined,
  MoonOutlined,
  SunOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  Avatar,
  Button,
  ConfigProvider,
  Drawer,
  Dropdown,
  Empty,
  Flex,
  Grid,
  Layout,
  Menu,
  Space,
  theme,
  Tooltip,
  Typography,
} from 'antd'
import type { MenuProps } from 'antd'
import azAZ from 'antd/locale/az_AZ'
import { CounterpartiesPage } from './CounterpartiesPage'
import { BankAccountsPage } from './BankAccountsPage'
import { NomenclaturePage } from './NomenclaturePage'
import { BRAND, LOGO_PARTS } from '../finsoft-intro/logoParts'
import { DockDropZones, DockGrip, DockPin, useNavigationDock } from './components/NavigationDock'

const { Header, Content, Sider } = Layout
const { Title, Text } = Typography

const lockedLabel = (label: string) => (
  <span className="sidebar-locked-label">
    <span>{label}</span>
    <LockOutlined aria-hidden="true" />
  </span>
)

type SidebarStyle = 'light' | 'dark' | 'indigo'

const menuItems: MenuProps['items'] = [
  {
    type: 'group',
    label: 'BUSINESS & ORGANIZATION',
    children: [
      { key: 'counterparties', icon: <UserSwitchOutlined />, label: 'Counterparties' },
      { key: 'contracts', icon: <FileTextOutlined />, label: lockedLabel('Contracts'), disabled: true },
      { key: 'departments', icon: <ApartmentOutlined />, label: lockedLabel('Departments'), disabled: true },
      { key: 'branches', icon: <BranchesOutlined />, label: lockedLabel('Branches'), disabled: true },
    ],
  },
  { type: 'divider' },
  {
    type: 'group',
    label: 'BANK ACCOUNT',
    children: [
      {
        key: 'bank-accounts',
        icon: <AccountBookOutlined />,
        label: 'Bank Account',
        children: [
          { key: 'bank-inbound', label: 'Inbound payment' },
          { key: 'bank-outbound', label: lockedLabel('Outbound payment'), disabled: true },
          { key: 'bank-internal', label: lockedLabel('Internal Transfers'), disabled: true },
          { key: 'bank-loans', label: lockedLabel('Loans'), disabled: true },
          { key: 'bank-deposit', label: lockedLabel('Deposit'), disabled: true },
          { key: 'bank-conversion', label: lockedLabel('Currency Conversion'), disabled: true },
        ],
      },
    ],
  },
  { type: 'divider' },
  {
    type: 'group',
    label: 'PRODUCTS & INVENTORY',
    children: [
      { key: 'nomenclature', icon: <AppstoreOutlined />, label: 'Nomenclature' },
      {
        key: 'product-variants',
        icon: <NodeIndexOutlined />,
        label: lockedLabel('Product Variants'),
        disabled: true,
      },
      { key: 'units', icon: <ColumnHeightOutlined />, label: lockedLabel('Units of Measure'), disabled: true },
      { key: 'warehouses', icon: <InboxOutlined />, label: lockedLabel('Warehouses'), disabled: true },
      {
        key: 'bom',
        icon: <PartitionOutlined />,
        label: lockedLabel('BOM / Recipes'),
        disabled: true,
      },
    ],
  },
]

const horizontalItems: MenuProps['items'] = (menuItems ?? []).flatMap((item) => {
  if (item && 'type' in item && item.type === 'group') return item.children ?? []
  if (item && 'type' in item && item.type === 'divider') return []
  return [item]
})

const pageTitles: Record<string, string> = {
  counterparties: 'Kontragentlər',
  contracts: 'Müqavilələr',
  departments: 'Şöbələr',
  branches: 'Filiallar',
  'bank-inbound': 'Inbound payment',
  'bank-outbound': 'Outbound payment',
  'bank-internal': 'Internal Transfers',
  'bank-loans': 'Loans',
  'bank-deposit': 'Deposit',
  'bank-conversion': 'Currency Conversion',
  nomenclature: 'Nomenklatura',
  'product-variants': 'Məhsul variantları və atributları',
  units: 'Ölçü vahidləri',
  warehouses: 'Anbarlar',
  bom: 'Material siyahıları (BOM / Reseptlər)',
}

const pageIcons: Record<string, React.ReactNode> = {
  counterparties: <UserSwitchOutlined />,
  contracts: <FileTextOutlined />,
  departments: <ApartmentOutlined />,
  branches: <BranchesOutlined />,
  'bank-inbound': <AccountBookOutlined />,
  'bank-outbound': <AccountBookOutlined />,
  'bank-internal': <SwapOutlined />,
  'bank-loans': <AccountBookOutlined />,
  'bank-deposit': <AccountBookOutlined />,
  'bank-conversion': <AccountBookOutlined />,
  nomenclature: <AppstoreOutlined />,
  'product-variants': <NodeIndexOutlined />,
  units: <ColumnHeightOutlined />,
  warehouses: <InboxOutlined />,
  bom: <PartitionOutlined />,
}

interface NavigationMenuProps {
  selectedKey: string
  onSelect: (key: string) => void
  collapsed?: boolean
  horizontal?: boolean
}

function Brand() {
  return (
    <Flex className="brand" align="center" gap={12} role="img" aria-label="FinSoft">
      <svg className="brand-mark" viewBox="264 260 345 356" aria-hidden="true" focusable="false">
        <path fill="currentColor" d={LOGO_PARTS.navySymbol} />
        <path fill={BRAND.mint} d={LOGO_PARTS.mintSymbol} />
      </svg>
      <svg className="brand-name" viewBox="640 260 889 356" aria-hidden="true" focusable="false">
        <path fill="currentColor" fillRule="evenodd" d={LOGO_PARTS.wordmark} />
      </svg>
    </Flex>
  )
}

function NavigationMenu({ selectedKey, onSelect, collapsed = false, horizontal = false }: NavigationMenuProps) {
  return (
    <Menu
      className="navigation-menu"
      theme="dark"
      mode={horizontal ? 'horizontal' : 'inline'}
      inlineCollapsed={horizontal ? undefined : collapsed}
      defaultOpenKeys={horizontal ? undefined : ['bank-accounts']}
      items={horizontal ? horizontalItems : menuItems}
      selectedKeys={[selectedKey]}
      onClick={({ key }) => onSelect(key)}
    />
  )
}

export function App() {
  const screens = Grid.useBreakpoint()
  const isDesktop = screens.lg ?? false
  const [drawerOpen, setDrawerOpen] = useState(false)
  const navDock = useNavigationDock()
  const { dock, pinned, expanded } = navDock
  const verticalDock = dock === 'left' || dock === 'right'
  const [selectedKey, setSelectedKey] = useState('counterparties')
  const [sidebarStyle, setSidebarStyle] = useState<SidebarStyle>('light')
  const [language, setLanguage] = useState('AZ')
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  console.log(isDesktop)
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 992px)')
    const closeMobileNavigation = () => {
      if (desktop.matches) setDrawerOpen(false)
    }
    desktop.addEventListener('change', closeMobileNavigation)
    return () => desktop.removeEventListener('change', closeMobileNavigation)
  }, [])

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotion = () => setReducedMotion(preference.matches)
    preference.addEventListener('change', updateMotion)
    return () => preference.removeEventListener('change', updateMotion)
  }, [])

  const pageTitle = useMemo(() => pageTitles[selectedKey], [selectedKey])

  const handleSelect = (key: string) => {
    setSelectedKey(key)
    setDrawerOpen(false)
  }

  const dockNavigation = verticalDock ? (
    <div className={`dock-slot dock-slot--${dock}${pinned ? ' is-pinned' : ''}`} {...navDock.hoverProps}>
      <Sider collapsed={!expanded} collapsedWidth={76} trigger={null} width={292} className="app-sider" theme="dark">
        <Flex className="dock-grip-row" justify="center"><DockGrip gripProps={navDock.gripProps} /></Flex>
        <Flex className="dock-brand-row" align="center" justify="space-between">
          <Brand />
          <DockPin pinned={pinned} togglePinned={navDock.togglePinned} />
        </Flex>
        <NavigationMenu selectedKey={selectedKey} onSelect={handleSelect} collapsed={!expanded} />
      </Sider>
    </div>
  ) : (
    <div className={`app-dockbar dock-bar--${dock}${expanded ? '' : ' is-compact'}`} {...navDock.hoverProps}>
      <DockGrip gripProps={navDock.gripProps} />
      <Brand />
      <NavigationMenu selectedKey={selectedKey} onSelect={handleSelect} horizontal />
      <DockPin pinned={pinned} togglePinned={navDock.togglePinned} />
    </div>
  )

  return (
    <ConfigProvider
      locale={azAZ}
      theme={{
        algorithm: sidebarStyle === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          motion: !reducedMotion,
          colorPrimary: '#4f46e5',
          colorInfo: '#0ea5e9',
          colorSuccess: '#10b981',
          colorWarning: '#f59e0b',
          colorError: '#f43f5e',
          borderRadius: 10,
          fontFamily: "Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        },
        components: {
          Layout: {
            siderBg: sidebarStyle === 'dark' ? '#111827' : sidebarStyle === 'indigo' ? '#3f46eb' : '#ffffff',
            headerBg: sidebarStyle === 'dark' ? '#161f2f' : '#ffffff',
            bodyBg: sidebarStyle === 'dark' ? '#0b1220' : '#f5f7fb',
          },
          Menu: {
            itemBorderRadius: 8,
            itemHeight: 42,
            itemMarginInline: 12,
            darkItemBg: 'transparent',
            darkSubMenuItemBg: 'transparent',
            darkPopupBg: sidebarStyle === 'indigo' ? '#0e2dff' : sidebarStyle === 'dark' ? '#111827' : '#00071d',
            darkItemColor: 'rgb(255 255 255 / 88%)',
            darkGroupTitleColor: 'rgb(255 255 255 / 62%)',
          },
        },
      }}
    >
      <Layout className={`app-shell shell-${sidebarStyle}`} hasSider={isDesktop && verticalDock}>
        {isDesktop && (dock === 'left' || dock === 'top') && dockNavigation}

        <Layout>
          <Header className="app-header">
            <Flex align="center" justify="space-between" gap={16}>
              <Flex className="header-leading" align="center" gap={12}>
                {!isDesktop && (
                  <Tooltip title="Naviqasiya menyusunu aç">
                    <Button
                      type="text"
                      icon={<MenuOutlined />}
                      aria-label="Naviqasiya menyusunu aç"
                      aria-expanded={drawerOpen}
                      aria-controls="mobile-navigation"
                      onClick={() => setDrawerOpen(true)}
                    />
                  </Tooltip>
                )}
                <span className="header-title-icon">{pageIcons[selectedKey]}</span>
                <Title level={4} className="header-title">{pageTitle}</Title>
              </Flex>
              <Space className="header-actions" size={8}>
                <Dropdown
                  trigger={['click']}
                  menu={{
                    selectedKeys: [language],
                    onClick: ({ key }) => setLanguage(key),
                    items: [
                      { key: 'AZ', label: '🇦🇿 Azərbaycan dili' },
                      { key: 'EN', label: '🇬🇧 English' },
                      { key: 'RU', label: '🇷🇺 Русский' },
                    ],
                  }}
                >
                  <Button icon={<GlobalOutlined />}>{language}<DownOutlined /></Button>
                </Dropdown>
                <Dropdown
                  trigger={['click']}
                  menu={{
                    selectedKeys: [sidebarStyle],
                    onClick: ({ key }) => setSidebarStyle(key as SidebarStyle),
                    items: [
                      { key: 'light', icon: <SunOutlined />, label: 'İşıqlı' },
                      { key: 'dark', icon: <MoonOutlined />, label: 'Tünd' },
                      { key: 'indigo', icon: <BgColorsOutlined />, label: 'İndiqo' },
                    ],
                  }}
                >
                  <Tooltip title="Görünüşü dəyiş">
                    <Button
                      aria-label="Görünüşü dəyiş"
                      icon={sidebarStyle === 'light' ? <SunOutlined /> : sidebarStyle === 'dark' ? <MoonOutlined /> : <BgColorsOutlined />}
                    />
                  </Tooltip>
                </Dropdown>
                <Flex className="header-profile" align="center" gap={9}>
                  <Avatar className="profile-avatar" icon={<UserOutlined />} />
                  <div className="profile-copy">
                    <Text strong>Admin</Text>
                    <Text type="secondary">Administrator</Text>
                  </div>
                </Flex>
              </Space>
            </Flex>
          </Header>

          <Content className="app-content">
            {selectedKey === 'counterparties' ? (
              <CounterpartiesPage />
            ) : selectedKey.startsWith('bank-') ? (
              <BankAccountsPage workspace={selectedKey.replace('bank-', '') as 'inbound' | 'outbound' | 'internal' | 'loans' | 'deposit' | 'conversion'} />
            ) : selectedKey === 'nomenclature' ? (
              <NomenclaturePage />
            ) : (
              <section className="content-panel" aria-labelledby="page-title">
                <Flex vertical gap={8}>
                  <Text type="secondary">FinSoft / İş sahəsi</Text>
                  <Title id="page-title" level={2}>{pageTitle}</Title>
                  <Text type="secondary">Bu bölmə biznes məlumatlarınız və iş prosesləriniz üçün hazırdır.</Text>
                </Flex>
                <Empty className="content-empty" image={Empty.PRESENTED_IMAGE_SIMPLE} description="Hələ heç bir məlumat əlavə edilməyib" />
              </section>
            )}
          </Content>
        </Layout>

        {isDesktop && (dock === 'right' || dock === 'bottom') && dockNavigation}
        {isDesktop && <DockDropZones target={navDock.dragTarget} />}

        <Drawer
          rootClassName="navigation-drawer"
          placement="left"
          size="min(88vw, 320px)"
          open={!isDesktop && drawerOpen}
          onClose={() => setDrawerOpen(false)}
          afterOpenChange={(open) => { if (!open) setDrawerOpen(false) }}
          title={<Brand />}
          closable={{ placement: 'end', closeIcon: <CloseOutlined /> }}
          styles={{ body: { padding: '8px 0 24px' } }}
        >
          <nav id="mobile-navigation" aria-label="Əsas naviqasiya"><NavigationMenu selectedKey={selectedKey} onSelect={handleSelect} /></nav>
        </Drawer>
      </Layout>
    </ConfigProvider>
  )
}
