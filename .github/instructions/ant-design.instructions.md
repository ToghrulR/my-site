---
name: "Ant Design UI"
description: "Use when building, modifying, reviewing, or refactoring React UI, frontend components, pages, forms, tables, dialogs, navigation, responsive layouts, loading states, or styling with TypeScript and Ant Design."
applyTo: "**/*.tsx"
---

# Ant Design UI Instructions

## Required design-system context

- Before creating, modifying, reviewing, or refactoring UI, read and follow `DESIGN_SYSTEM.md` at the repository root.
- Treat `DESIGN_SYSTEM.md` as the authoritative standard for all components, data tables, forms, drawers, trees, navigation, icons, responsive behavior, and feedback states.

## Project UI stack

- Use React and TypeScript.
- Treat Ant Design as the primary UI library.
- Prefer an Ant Design component whenever an appropriate component exists.
- Do not introduce another UI library unless explicitly requested.
- Do not recreate components already provided by Ant Design.

## Component usage

Prefer these Ant Design components:

- `Button` for actions.
- `Form` for forms.
- `Input` for text input and `Input.TextArea` for multiline text.
- `Select` for option selection and `AutoComplete` for searchable suggestions.
- `DatePicker` and `DatePicker.RangePicker` for dates; `TimePicker` for time selection.
- `Table` for tabular data.
- `Modal` for dialogs and `Drawer` for side panels.
- `Card` for grouped content.
- `Tabs` for section navigation.
- `Menu` for navigation, `Layout` for page structure, and `Breadcrumb` for hierarchical navigation.
- `Dropdown` for action menus.
- `Popconfirm` for destructive-action confirmation.
- `Tooltip` for helpful hints.
- `Tag` and `Badge` for statuses.
- `Avatar` for users.
- `Pagination` when appropriate.
- `Empty` for empty states.
- `Spin` or `Skeleton` for loading states.
- `Alert` for important messages.
- `message` or `notification` for user feedback.

## Layout and responsiveness

- Build clean, modern, responsive interfaces.
- Prefer `Flex` and `Space` for alignment and spacing.
- Use `Row` and `Col` for responsive grids.
- Use Ant Design responsive breakpoints.
- Ensure every page works on mobile, tablet, and desktop.
- Avoid unnecessary custom CSS; prefer Ant Design props, design tokens, and built-in layout capabilities.

## Icons

- Use only `@ant-design/icons` for UI icons.
- Choose meaningful icons.
- Do not use random emoji as interface icons unless explicitly requested.

## Forms

- Use Ant Design `Form` for complex forms.
- Define a TypeScript type for form values.
- Add appropriate validation rules and clear validation messages.
- Handle loading and submission states.
- Disable submit actions when appropriate.
- Use `Popconfirm` before dangerous or irreversible actions when appropriate.

## Tables

- Use Ant Design `Table` for structured data.
- Always provide a stable, unique `rowKey`.
- Add loading and empty states.
- Add pagination when appropriate.
- Use `Space` for row actions.
- Add responsive behavior where necessary.
- Keep column definitions properly typed with Ant Design types.

## TypeScript

- Always use TypeScript.
- Define interfaces or types for props, API responses, table data, and form values.
- Avoid `any`.
- Prefer explicit, reusable types and proper Ant Design TypeScript types.

## Code quality

- Create reusable components when appropriate.
- Keep components focused and maintainable; avoid overly large components.
- Follow existing architecture and coding patterns.
- Do not refactor unrelated code or modify unrelated files.
- Reuse existing components and utilities when possible.

## Accessibility

- Use descriptive labels.
- Ensure interactive elements have understandable names and behavior.
- Add ARIA attributes when necessary.
- Do not communicate important information using color alone.

## UI states

For every significant UI, consider and implement as applicable:

- Loading state.
- Empty state.
- Error state.
- Success or feedback state.
- Disabled state.

## Styling

- Prefer Ant Design components and theme tokens.
- Avoid excessive inline styles.
- Avoid hardcoded colors when project theme tokens exist.
- Keep spacing, typography, and border radius consistent with the existing design system.
- Do not create custom CSS for functionality already supported by Ant Design.

## Final review

Before completing a UI task:

1. Check whether Ant Design already provides the required component.
2. Verify TypeScript types.
3. Verify responsive behavior.
4. Verify loading states.
5. Verify empty states.
6. Verify error handling.
7. Verify accessibility.
8. Remove unnecessary CSS.
9. Ensure no unnecessary UI libraries were added.
10. Ensure the implementation follows existing project conventions.
