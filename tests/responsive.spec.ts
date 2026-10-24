import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { Buffer } from 'node:buffer'

let browserErrors: string[] = []

test.beforeEach(async ({ page }) => {
  browserErrors = []
  page.on('pageerror', (error) => browserErrors.push(error.message))
  page.on('console', (entry) => { if (entry.type() === 'error') browserErrors.push(entry.text()) })
  await page.goto('/')
})

test.afterEach(() => expect(browserErrors).toEqual([]))

async function navigate(page: Page, name: string) {
  const toggle = page.getByRole('button', { name: 'Naviqasiya menyusunu aç' })
  if (await toggle.isVisible()) await toggle.click()
  await page.getByRole('menuitem', { name: new RegExp(name) }).click()
  await expect(page.locator('.navigation-drawer.ant-drawer-open')).toHaveCount(0)
}

async function pageFits(page: Page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1)
}

async function drawerFits(page: Page) {
  const drawer = page.locator('.ant-drawer-open .ant-drawer-section').last()
  await expect(drawer).toBeVisible()
  await expect.poll(() => drawer.evaluate((element) => {
    const bounds = element.getBoundingClientRect()
    const body = element.querySelector('.ant-drawer-body')!
    return Math.max(body.scrollWidth - body.clientWidth, bounds.right - innerWidth, -bounds.left)
  })).toBeLessThanOrEqual(1)
  await expect.poll(() => drawer.locator('.ant-drawer-footer button').evaluateAll((buttons) => buttons.every((button) => {
    const bounds = button.getBoundingClientRect()
    return bounds.left >= 0 && bounds.right <= innerWidth + 1 && bounds.bottom <= innerHeight + 1
  }))).toBe(true)
}

async function selectOption(page: Page, field: Locator, label: string) {
  await field.scrollIntoViewIfNeeded()
  if (await field.isEditable()) {
    await field.fill(label)
    await field.press('ArrowDown')
  } else {
    await page.locator('.ant-select').filter({ has: field }).click()
  }
  await page.locator('.ant-select-dropdown:visible .ant-select-item-option').filter({ hasText: label }).first().click()
}

async function closeDrawer(page: Page) {
  await page.locator('.ant-drawer-open .ant-drawer-close').last().click()
  await expect(page.locator('.ant-drawer-open')).toHaveCount(0)
}

test('startup intro completes and opens the workspace with and without WebGL', async ({ page }, testInfo) => {
  for (const fallback of [false, true]) {
    if (fallback) await page.goto('/?webgl=0')
    const intro = page.locator('.fsi')
    await expect(intro).toBeVisible()
    await expect(page.getByRole('progressbar')).toBeVisible()
    await expect.poll(async () => Number(await page.getByRole('progressbar').getAttribute('aria-valuenow'))).toBeGreaterThan(0)
    await expect(intro.locator('canvas, .fsi__svg')).toBeVisible()
    if (fallback) await expect(intro).toHaveAttribute('data-mode', 'css')
    await pageFits(page)
    await page.screenshot({ path: testInfo.outputPath(`intro-${fallback ? 'fallback' : 'default'}.png`) })
    await expect(intro).toHaveCount(0, { timeout: 12000 })
    await expect(page.locator('.header-title')).toBeVisible()
    await pageFits(page)
  }
})

test('lists, cards, empty states, filters, pagination and column settings', async ({ page }, testInfo) => {
  for (const route of ['Counterparties', 'Inbound payment', 'Nomenclature']) {
    await navigate(page, route)
    await pageFits(page)
    const search = page.locator('.counterparty-search input')
    await search.fill('unmatched-search-value')
    await expect(page.locator('.ant-empty')).toBeVisible()
    await pageFits(page)
    await search.clear()
    if (route !== 'Nomenclature') {
      const filter = page.locator('.app-content .ant-table-thead input').first()
      await filter.fill('unmatched-column-value')
      await expect(page.locator('.app-content .ant-empty')).toBeVisible()
      await filter.clear()
      const sorter = page.locator('.app-content th.ant-table-column-has-sorters').first()
      await sorter.click({ position: { x: 24, y: 20 } })
      await expect(page.locator('.app-content th[aria-sort="ascending"]')).toHaveCount(1)
      await sorter.click({ position: { x: 24, y: 20 } })
      await expect(page.locator('.app-content th[aria-sort="descending"]')).toHaveCount(1)
    } else {
      const trigger = page.locator('.app-content .ant-table-filter-trigger').first()
      await trigger.click()
      const filter = page.locator('.ant-dropdown:visible .table-filter-dropdown')
      await filter.locator('input').fill('unmatched-column-value')
      await filter.getByRole('button', { name: /Axtar$/ }).click()
      await expect(page.locator('.app-content .ant-empty')).toBeVisible()
      await trigger.click()
      await page.locator('.ant-dropdown:visible').getByRole('button', { name: 'Təmizlə', exact: true }).click()
    }
    const table = page.locator('.app-content .ant-table-content').first()
    await expect(table).toBeVisible()
    await table.evaluate((element) => { element.scrollLeft = element.scrollWidth })
    await pageFits(page)
    await table.evaluate((element) => { element.scrollLeft = 0 })
    const settings = page.getByRole('button', { name: route === 'Inbound payment' ? 'Cədvəl sütunlarını tənzimlə' : 'Cədvəl sütunları', exact: true })
    await settings.click()
    await drawerFits(page)
    const firstLabel = await page.locator('.ant-drawer-open .column-settings-row .ant-checkbox-wrapper').first().innerText()
    await page.locator('.ant-drawer-open').getByRole('button', { name: /sütununu aşağı köçür/ }).first().click()
    await expect(page.locator('.ant-drawer-open .column-settings-row .ant-checkbox-wrapper').nth(1)).toHaveText(firstLabel)
    const checkboxes = page.locator('.ant-drawer-open .column-settings-row input[type=checkbox]:not(:disabled)')
    await checkboxes.first().uncheck()
    await checkboxes.first().check()
    if (route !== 'Inbound payment') {
      const fixedRow = page.locator('.ant-drawer-open .column-fixed-row').filter({ hasText: firstLabel })
      await fixedRow.getByRole('checkbox').uncheck()
      await closeDrawer(page)
      await expect(page.getByRole('columnheader').filter({ hasText: firstLabel }).first()).not.toHaveClass(/ant-table-cell-fix/)
      await settings.click()
    }
    await page.locator('.ant-drawer-open').getByRole('button', { name: 'Standarta qaytar' }).click()
    await closeDrawer(page)
    const next = page.locator('.app-content .ant-pagination-next:not(.ant-pagination-disabled)')
    if (await next.count()) {
      await next.first().click()
      await pageFits(page)
    }
    await page.getByText('Kartlar', { exact: true }).click()
    await expect(page.locator('.counterparty-card,.bank-record-card').first()).toBeVisible()
    await pageFits(page)
    await page.screenshot({ path: testInfo.outputPath(`${route}-cards.png`), fullPage: true })
    await page.getByText('Cədvəl', { exact: true }).click()
    await page.getByRole('button', { name: /^Excel/ }).click()
    const menu = page.locator('.ant-dropdown:visible')
    await expect(menu).toBeVisible()
    await expect.poll(() => menu.evaluate((element) => element.getBoundingClientRect().right <= innerWidth + 1)).toBe(true)
    await page.keyboard.press('Escape')
    await page.locator('.header-title').click()
  }
})

test('counterparty create, validation, bank accounts, contact and edit', async ({ page }) => {
  await page.getByRole('button', { name: /Yeni Counterparties/ }).click()
  await drawerFits(page)
  await page.getByRole('button', { name: /Yarat$/ }).click()
  await expect(page.getByText('Hüquqi adı daxil edin', { exact: true })).toBeVisible()
  const longName = 'Uzun kontragent adı '.repeat(8).trim()
  await page.getByLabel('Tam / hüquqi adı', { exact: true }).fill(longName)
  await page.getByRole('tab', { name: 'Bank', exact: true }).click()
  await selectOption(page, page.locator('#bankAccounts_0_bankId'), 'Kapital Bank')
  await page.getByRole('button', { name: /Yeni bank hesabı əlavə et/ }).click()
  await expect(page.locator('.bank-account-collapse')).toBeVisible()
  await drawerFits(page)
  const primary = page.getByRole('switch', { name: /Bank hesabı 2 əsas hesab seçimi/ })
  await primary.check()
  await expect(page.getByRole('switch', { name: /Bank hesabı 1 əsas hesab seçimi/ })).toBeChecked()
  await expect(page.getByRole('switch', { name: /Bank hesabı 2 əsas hesab seçimi/ })).not.toBeChecked()
  await page.getByRole('tab', { name: 'Əlaqə məlumatları', exact: true }).click()
  await page.getByLabel('Əlaqədar şəxs', { exact: true }).fill('Test istifadəçisi')
  await page.locator('.counterparty-drawer #email').fill('invalid-address')
  await page.getByRole('button', { name: /Yarat$/ }).click()
  await expect(page.getByText('Düzgün e-poçt ünvanı daxil edin', { exact: true })).toBeVisible()
  await drawerFits(page)
  await page.locator('.counterparty-drawer #email').fill('test@example.com')
  await page.getByRole('button', { name: /Yarat$/ }).click()
  await expect(page.locator('.counterparty-drawer')).toBeHidden()
  await pageFits(page)
  const content = page.locator('.app-content .ant-table-content')
  await content.evaluate((element) => { element.scrollLeft = element.scrollWidth })
  await page.getByRole('button', { name: `${longName} məlumatlarını redaktə et`, exact: true }).click()
  await expect(page.getByLabel('Tam / hüquqi adı', { exact: true })).toHaveValue(longName)
  await drawerFits(page)
})

test('nomenclature folders, policies, items, inheritance and delete confirmation', async ({ page }, testInfo) => {
  await navigate(page, 'Nomenclature')
  await page.getByText('Kateqoriya qaydaları', { exact: true }).click()
  await expect(page.locator('.category-policy-table')).toBeVisible()
  await pageFits(page)
  await page.getByText('Elementlər', { exact: true }).click()
  await page.getByRole('button', { name: /Yeni qovluq$/ }).click()
  await drawerFits(page)
  await page.getByRole('button', { name: /Qovluq yarat/ }).click()
  await expect(page.getByText('Qovluğun adını daxil edin', { exact: true })).toBeVisible()
  await page.getByLabel('Ad', { exact: true }).fill('Responsive qovluq')
  await page.getByRole('button', { name: /Qovluq yarat/ }).click()
  await expect(page.locator('.ant-drawer-open')).toHaveCount(0)
  await page.getByRole('button', { name: /Yeni element/ }).click()
  await drawerFits(page)
  await page.getByRole('button', { name: /Element yarat/ }).click()
  await expect(page.getByText('Elementin adını daxil edin', { exact: true })).toBeVisible()
  await page.locator('.ant-drawer-open').getByLabel('Ad', { exact: true }).fill('Responsive xidmət')
  await selectOption(page, page.getByLabel('Qovluq (category)', { exact: true }), 'Responsive qovluq')
  await selectOption(page, page.locator('#nomenclature-item_itemKind'), 'Xidmət')
  await expect(page.getByText('Anbar icazələri (Goods / WIP / Finished üçün)', { exact: true })).toHaveCount(0)
  await drawerFits(page)
  await page.getByRole('button', { name: /Element yarat/ }).click()
  await expect(page.locator('.ant-drawer-open')).toHaveCount(0)
  await page.locator('.counterparty-search input').fill('Responsive xidmət')
  const table = page.locator('.app-content .ant-table-content')
  await table.evaluate((element) => { element.scrollLeft = element.scrollWidth })
  await page.getByRole('button', { name: 'Responsive xidmət elementini redaktə et', exact: true }).click()
  await drawerFits(page)
  await page.screenshot({ path: testInfo.outputPath('item-edit.png') })
  await closeDrawer(page)
  await page.getByRole('button', { name: 'Responsive xidmət elementini sil', exact: true }).click()
  const confirmation = page.locator('.ant-popconfirm:visible')
  await expect(confirmation).toBeVisible()
  expect(await confirmation.evaluate((element) => element.getBoundingClientRect().right <= innerWidth + 1)).toBe(true)
  await confirmation.getByRole('button', { name: 'Ləğv et' }).click()
  await pageFits(page)
})

test('payment types, distributions, currency, VAT, validation and saved details', async ({ page }, testInfo) => {
  await navigate(page, 'Inbound payment')
  await page.getByRole('button', { name: /Yeni daxilolma/ }).click()
  await drawerFits(page)
  for (const type of ['counterparty', 'supplierRefund', 'other']) {
    await page.locator(`.bank-operation-option-${type}`).press('Enter')
    await drawerFits(page)
    await selectOption(page, page.locator('#recipientAccount'), 'AZ21NABZ00000000000000123450')
    await expect(page.locator('.bank-read-only-data[aria-label^="Məzənnə:"]')).toHaveCount(0)
    await selectOption(page, page.locator('#recipientAccount'), 'AZ21PAHA00000000000000123453')
    await expect(page.locator('.bank-read-only-data[aria-label="Məzənnə: 1.8500"]')).toBeVisible()
    await page.locator('#amountInCurrency').fill('118')
    await selectOption(page, page.locator('#vatRate'), '18%')
    await expect(page.locator('#vatAmount')).toHaveValue('18')
    if (type === 'supplierRefund') {
      await selectOption(page, page.locator('#paymentType'), 'Avansın geri qaytarılması')
      await expect(page.locator('.bank-distribution-table').getByText('OP-2026-000125', { exact: true })).toBeVisible()
      await selectOption(page, page.locator('#paymentType'), 'Malın/xidmətin geri qaytarılması üzrə ödəniş')
      await expect(page.locator('.bank-distribution-table').getByText('GQ-2026-000018', { exact: true })).toBeVisible()
      await page.getByRole('button', { name: /Avtomatik bölüşdür/ }).click()
      await expect(page.locator('#distributionRows_0_payment')).toHaveValue('118.00')
      await drawerFits(page)
    }
    await page.screenshot({ path: testInfo.outputPath(`${type}-form.png`) })
    if (type !== 'other') await page.getByRole('button', { name: 'Geri', exact: true }).click()
  }
  await page.getByRole('button', { name: /Yadda saxla/ }).click()
  await expect(page.getByText('Daxilolmanın növü seçilməlidir', { exact: true })).toBeVisible()
  await drawerFits(page)
  await selectOption(page, page.locator('#paymentType'), 'Bank faiz gəlirləri')
  await selectOption(page, page.locator('#payer'), 'Kapital Bank ASC')
  await selectOption(page, page.locator('#cashFlowItem'), 'Faiz gəlirləri')
  await page.locator('#note').fill('Responsive saxlanma yoxlaması')
  await page.getByRole('button', { name: /Yadda saxla/ }).click()
  await expect(page.locator('.ant-drawer-open')).toHaveCount(0)
  await page.locator('.app-content .ant-table-content').evaluate((element) => { element.scrollLeft = element.scrollWidth })
  await page.getByRole('button', { name: 'Digər daxilolma əməliyyatına bax', exact: true }).first().click()
  await expect(page.locator('.bank-record-details')).toContainText('Responsive saxlanma yoxlaması')
  await drawerFits(page)
})

test('sidebar focus, backdrop, Escape, resize and desktop collapse', async ({ page }) => {
  const width = page.viewportSize()!.width
  if (width >= 992) {
    await page.getByRole('button', { name: 'Yan menyunu bağla' }).click()
    await expect(page.locator('.app-sider')).toHaveClass(/ant-layout-sider-collapsed/)
    await page.getByRole('button', { name: 'Yan menyunu aç' }).click()
    await pageFits(page)
    return
  }
  const toggle = page.getByRole('button', { name: 'Naviqasiya menyusunu aç' })
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).overflowY)).toBe('hidden')
  await page.keyboard.press('Escape')
  await expect(page.locator('.navigation-drawer.ant-drawer-open')).toHaveCount(0)
  await expect(toggle).toBeFocused()
  await toggle.click()
  await page.locator('.navigation-drawer .ant-drawer-mask').click({ position: { x: width - 2, y: 8 } })
  await expect(page.locator('.navigation-drawer.ant-drawer-open')).toHaveCount(0)
  await toggle.click()
  await page.setViewportSize({ width: 1280, height: 800 })
  await expect(page.locator('.app-sider')).toBeVisible()
  await expect(page.locator('.navigation-drawer.ant-drawer-open')).toHaveCount(0)
  await page.setViewportSize({ width, height: 740 })
  await expect(page.locator('.navigation-drawer.ant-drawer-open')).toHaveCount(0)
  await navigate(page, 'Nomenclature')
  await pageFits(page)
})

test('large imports, long values, error feedback, export and pageable cards', async ({ page }, testInfo) => {
  for (const route of ['Counterparties', 'Inbound payment', 'Nomenclature']) {
    await navigate(page, route)
    await page.getByRole('button', { name: /^Excel/ }).click()
    const download = page.waitForEvent('download')
    await page.getByRole('menuitem', { name: /Excel şablonu yüklə/ }).click()
    expect((await download).suggestedFilename()).toMatch(/\.xls$/)
    const upload = page.locator('.app-content input[type=file]')
    await upload.setInputFiles({ name: 'empty.csv', mimeType: 'text/csv', buffer: Buffer.from('header\n') })
    await expect(page.locator('.ant-message-error').last()).toContainText('Fayl oxunmadı')
    await pageFits(page)
    const longValue = `Responsive import ${'UzunSoz'.repeat(35)}`
    const header = route === 'Nomenclature' ? 'Ad,Qovluq ID,UoM,Status,Növ,Metod,SKU' : 'Ad,Tarix,Ödəyici,Məbləğ,Valyuta,Status'
    const rows = Array.from({ length: 48 }, (_, index) => route === 'Nomenclature'
      ? `${longValue} ${index},1,pcs,active,stock,fifo,${'SKU'.repeat(40)}${index}`
      : route === 'Inbound payment'
        ? `Responsive import ${index},2026-09-01,${longValue},1234567890123.45,AZN,Qaralama`
        : `${longValue} ${index},Əlaqədar şəxs,Müştəri,Hüquqi şəxs`)
    await upload.setInputFiles({ name: 'responsive.csv', mimeType: 'text/csv', buffer: Buffer.from([header, ...rows].join('\n')) })
    await expect(page.locator('.ant-message-success').last()).toContainText('48')
    await page.locator('.counterparty-search input').fill('Responsive import')
    await expect(page.locator('.app-content .ant-pagination-total-text')).toContainText('48')
    await selectOption(page, page.locator('.app-content .ant-pagination-options .ant-select input'), '20')
    await expect(page.locator('.app-content .ant-table-tbody .ant-table-row')).toHaveCount(20)
    await pageFits(page)
    await page.getByRole('button', { name: /^Excel/ }).click()
    const filteredDownload = page.waitForEvent('download')
    await page.getByRole('menuitem', { name: /Filterli yüklə/ }).click()
    expect((await filteredDownload).suggestedFilename()).toMatch(/\.xls$/)
    await page.getByText('Kartlar', { exact: true }).click()
    const cards = page.locator('.counterparty-card,.bank-record-card')
    await expect(cards.first()).toBeVisible()
    expect(await cards.count()).toBeLessThanOrEqual(route === 'Counterparties' ? 20 : 6)
    await pageFits(page)
    await page.locator('.app-content .ant-pagination-next:not(.ant-pagination-disabled)').click()
    await expect(page.locator('.app-content .ant-pagination-item-active')).toHaveText('2')
    await pageFits(page)
    await page.screenshot({ path: testInfo.outputPath(`${route}-long-cards.png`), fullPage: true })
  }
})