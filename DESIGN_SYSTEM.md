# FinSoft Ant Design System

This document is the authoritative UI standard for FinSoft. Read it before creating or modifying any page, component, form, table, navigation, modal, drawer, card, filter, status, responsive layout, or UI style.

## 1. Technology and principles

- Use React, TypeScript, Ant Design, and `@ant-design/icons` only.
- Prefer an Ant Design component over custom markup when an equivalent exists.
- Keep visible application text in Azerbaijani; sidebar navigation labels remain English.
- Reuse existing patterns before introducing a new visual treatment.
- Use Ant Design theme tokens and CSS variables instead of duplicating hardcoded colors.
- Every UI must work on mobile, tablet, and desktop.
- Preserve accessibility: labels, keyboard behavior, focus states, semantic controls, and ARIA names for icon-only actions.

## 2. Visual language

### Color

- Primary action: `var(--ant-color-primary)`.
- Primary soft surface: `var(--ant-color-primary-bg)`.
- Page/container backgrounds: `var(--ant-color-bg-layout)` and `var(--ant-color-bg-container)`.
- Borders: `var(--ant-color-border-secondary)`.
- Secondary copy: Ant Design `Typography.Text type="secondary"`.
- Success, warning, and error states must use Ant Design semantic tokens/components.
- Excel icons use official Excel green `#217346`.
- Decorative icons use soft tinted backgrounds with a darker icon; avoid saturated blocks unless the element is a primary action.

### Spacing and radius

- Use the 4px spacing system. Common gaps: 8, 12, 16, 24, and 32px.
- Standard control radius follows the app theme (`10px`).
- Cards and major panels use 12–16px radius.
- Avoid dense layouts; group related fields into clear sections.

### Typography

- Font stack comes from the global Ant Design theme.
- Use `Typography.Title` and `Typography.Text`; do not create arbitrary heading styles.
- Page titles live in the application header. Avoid repeating the same page title inside content.
- Section titles should be concise and may use a small soft-background icon for scanning.

## 3. Canonical data table

All data tables must use Ant Design `Table` and follow this pattern:

- Provide a stable `rowKey`.
- Define columns with `ColumnsType<T>`; never use `any`.
- Use a toolbar above the table for search, filters, view controls, Excel, and create actions.
- Keep the search input first and the primary create action last.
- Use one visible **Excel** dropdown button with:
  - `Excel-ə ixrac et`
  - `Excel-dən idxal et`
- Excel actions use `FileExcelOutlined`, `DownloadOutlined`, and `UploadOutlined`.
- Use `Empty` for no results and an appropriate loading state when data is asynchronous.
- Use icon-only row actions only with `Tooltip` and an Azerbaijani `aria-label`.
- Table icons use soft backgrounds and clearly visible foreground colors.
- Use horizontal scrolling (`scroll={{ x: ... }}`) for narrow screens.
- Pagination is required for pageable datasets and must not be hidden merely because one page is currently present.
- Default pagination:
  - sensible default page size (5 or 10 depending on density),
  - `showSizeChanger: true`,
  - `showQuickJumper: true` where useful,
  - Azerbaijani `showTotal` text.
- Keep status values in semantic `Tag` components.

## 4. Forms and drawers

- Use Ant Design `Form` with a typed values interface.
- Use `Drawer` for create/edit flows that need context from the current page.
- Drawer title contains a soft icon, title, and short subtitle.
- Place close controls on the right.
- Footer actions align right: secondary **Ləğv et**, then primary save/create action.
- Group long forms into `Card`, `Tabs`, or `Collapse` sections.
- Section headers use meaningful Ant Design icons with the shared soft icon treatment.
- Use Azerbaijani validation messages.
- Optional inherited/default values use `allowClear` and an `İrsiyyət / Sistem standartı` placeholder.
- Explanatory alerts must be compact and actionable; avoid large description alerts for a single sentence.
- Disable or show loading on submit to prevent duplicate saves.

## 5. Trees, accordions, and hierarchy

- Use Ant Design `Tree` for hierarchical navigation and `Collapse` for accordion content.
- Expansion controls must be visually obvious using chevrons and hover/focus feedback.
- Use `blockNode` where the complete row is selectable.
- Selected nodes use the primary soft surface.
- Long node titles use ellipsis and retain an accessible title/tooltip.
- Parent-child hierarchy must remain visually readable through indentation and expand/collapse affordances.

## 6. Buttons and actions

- Use `Button type="primary"` only for the main action in a group.
- Secondary actions use default buttons; low-emphasis row actions use text buttons.
- Use meaningful `@ant-design/icons` icons.
- Destructive operations require `Popconfirm` and danger styling.
- Icon-only buttons require `Tooltip` and `aria-label`.

## 7. Cards, tags, and feedback

- Use `Card` for meaningful grouped content, not for every small element.
- Card hover effects indicate interactivity only.
- Use `Tag` for short statuses/classifications and `Badge` for compact state indicators.
- Use `message` or `notification` after imports, exports, creates, updates, and failures.
- Use compact `Alert` for persistent contextual guidance.

## 8. Navigation and responsive behavior

- Sidebar labels remain English; page content remains Azerbaijani.
- Sidebar collapse/expand must preserve smooth width and content transitions.
- Toolbars wrap on small screens; search becomes full width.
- Tables scroll horizontally rather than crushing columns.
- Drawers use viewport-safe responsive widths.
- Hide only nonessential decorative content on small screens, never required actions.

## 9. Required implementation workflow

Before changing UI:

1. Read this document.
2. Inspect nearby existing components and reuse their patterns.
3. Check whether Ant Design already provides the required component.
4. Implement the smallest consistent change.
5. Validate TypeScript, build, ESLint, responsive layout, empty states, and accessibility.
6. Visually verify the changed flow in the browser when available.

If existing code conflicts with this document, new and modified UI should move toward this standard without unrelated refactoring.
