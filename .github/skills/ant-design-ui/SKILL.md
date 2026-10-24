---
name: ant-design-ui
description: Build, modify, review, or refactor React and TypeScript user interfaces using Ant Design. Use for UI components, pages, forms, tables, modals, drawers, navigation, responsive layouts, styling, accessibility, and frontend loading, empty, error, feedback, or disabled states.
user-invocable: true
disable-model-invocation: false
---

# Ant Design UI

Use this skill whenever a task creates, modifies, reviews, or refactors project UI.

Before any UI work, read `DESIGN_SYSTEM.md` at the repository root and apply it as the authoritative component and visual standard.

Apply these rules to the existing project architecture and do not build unrelated examples or modify unrelated code.

## Workflow

1. Inspect the existing UI architecture, nearby components, utilities, hooks, theme configuration, and coding patterns.
2. Reuse existing project components and patterns whenever possible.
3. Identify the Ant Design components that satisfy the requirement before considering custom UI.
4. Define explicit TypeScript types for component props, form values, API data, table rows, and other domain data.
5. Implement the smallest focused change.
6. Use Ant Design components, props, theme tokens, and layout primitives where appropriate.
7. Cover responsive behavior, accessibility, and applicable loading, empty, error, feedback, and disabled states.
8. Review the implementation using the final checklist before completion.

## Project UI Stack

- Use React and TypeScript.
- Ant Design is the primary UI library.
- Prefer Ant Design components whenever an appropriate component exists.
- Do not introduce another UI library unless explicitly requested.
- Do not recreate components that Ant Design already provides.
- Follow the project's existing architecture and conventions.

## Preferred Components

- Actions: `Button`
- Forms: `Form`
- Text input: `Input`
- Multiline input: `Input.TextArea`
- Options: `Select`
- Searchable suggestions: `AutoComplete`
- Dates: `DatePicker` and `DatePicker.RangePicker`
- Times: `TimePicker`
- Structured data: `Table`
- Dialogs: `Modal`
- Side panels: `Drawer`
- Grouped content: `Card`
- Section navigation: `Tabs`
- Navigation: `Menu`
- Page structure: `Layout`
- Hierarchical navigation: `Breadcrumb`
- Action menus: `Dropdown`
- Destructive-action confirmation: `Popconfirm`
- Helpful hints: `Tooltip`
- Statuses: `Tag` and `Badge`
- User representation: `Avatar`
- Pagination: `Pagination` when appropriate
- Empty states: `Empty`
- Loading states: `Spin` or `Skeleton`
- Important messages: `Alert`
- User feedback: `message` or `notification`

Before creating custom UI, check whether Ant Design already provides a suitable component.

## Layout and Responsiveness

- Build clean, modern, responsive interfaces.
- Prefer `Flex` and `Space` for alignment and spacing.
- Use `Row` and `Col` for responsive grid layouts when appropriate.
- Use Ant Design responsive breakpoints.
- Ensure pages work on mobile, tablet, and desktop.
- Avoid unnecessary custom CSS.
- Prefer Ant Design props, theme tokens, and built-in layout capabilities.
- Do not create desktop-only layouts unless explicitly requested.

## Icons

- Use icons from `@ant-design/icons`.
- Use meaningful icons that clearly communicate the action.
- Do not use random emoji as interface icons unless explicitly requested.

## Forms

- Use Ant Design `Form` for complex forms.
- Use proper validation rules.
- Provide clear validation messages.
- Define TypeScript types for form values.
- Handle submission and loading states.
- Prevent duplicate submissions when appropriate.
- Disable controls when interaction is not currently allowed.
- Use `Popconfirm` before dangerous or irreversible actions when appropriate.
- Preserve existing form patterns in the project.

## Tables

- Use Ant Design `Table` for structured data.
- Always provide a stable unique `rowKey`.
- Properly type column definitions.
- Add loading states.
- Add empty states.
- Add pagination when appropriate.
- Use `Space` for row action buttons.
- Consider horizontal scrolling or alternative layouts for small screens.
- Do not overload tables with unnecessary columns.

## TypeScript

- Always use TypeScript.
- Define interfaces or types for:
  - Component props
  - API responses
  - Table data
  - Form values
  - Domain models
- Avoid `any`.
- Prefer explicit and reusable types.
- Use Ant Design TypeScript types when necessary.
- Do not introduce unsafe type assertions unless necessary.

## Code Quality

- Create reusable components when appropriate.
- Keep components focused and maintainable.
- Avoid overly large components.
- Separate UI concerns from business logic when appropriate.
- Do not refactor unrelated code.
- Do not modify unrelated files.
- Reuse existing components, hooks, utilities, constants, and types when possible.
- Avoid duplication.

## Accessibility

- Use descriptive labels.
- Ensure interactive elements are understandable.
- Provide accessible names for icon-only buttons.
- Use ARIA attributes when necessary.
- Ensure keyboard interaction works where applicable.
- Do not communicate important information using color alone.

## Required UI States

Every significant UI must consider applicable states:

- Loading state
- Empty state
- Error state
- Success or feedback state
- Disabled state
- Permission or unavailable state when applicable

Do not add states that are irrelevant to the feature.

## Styling

- Prefer Ant Design components and theme tokens.
- Avoid excessive inline styles.
- Avoid hardcoded colors when project theme tokens exist.
- Keep spacing, typography, shadows, and border radius consistent with the existing design system.
- Do not create custom CSS for functionality already supported by Ant Design.
- Reuse existing project styles and design tokens before creating new styles.

## Final Checklist

Before completing any UI task:

1. Check whether Ant Design already provides the required component.
2. Verify TypeScript types.
3. Verify existing project components and utilities were reused where appropriate.
4. Verify responsive behavior.
5. Verify applicable loading states.
6. Verify applicable empty states.
7. Verify applicable error handling.
8. Verify accessibility.
9. Remove unnecessary CSS.
10. Ensure no unnecessary UI libraries were added.
11. Ensure no unrelated files were modified.
12. Ensure the implementation follows existing project conventions.