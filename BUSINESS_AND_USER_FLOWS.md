# FinSoft business and user-flow guide

This document explains the FinSoft product domain and required interaction patterns. Read it before building or changing business features, forms, data models, validation, navigation, import/export, or user workflows.

## 1. Product purpose

FinSoft is a business-management workspace for Azerbaijani organizations. It centralizes the operational master data that accounting, purchasing, sales, warehouse, and reporting processes depend on.

The product helps a staff member create reliable reference data once, then reuse it in operational documents. The application must make the next action clear, keep data entry approachable, and avoid forcing users to understand internal technical terminology.

## 2. Core business concepts

### Counterparties

A **counterparty** is any external business party the organization works with:

- Customer
- Supplier
- Both customer and supplier

Each counterparty has a legal identity, an owner/contact, and optional bank and communication details. Counterparty data supports commercial documents, payments, invoicing, purchasing, and reporting.

#### Counterparty lifecycle

1. User searches the list to avoid duplicates.
2. User chooses **Yeni Counterparties**.
3. User completes the three focused tabs:
   - **Ümumi** — legal identity, counterparty role, and VAT status.
   - **Bank** — one or more selected bank accounts and settlement data.
   - **Əlaqə məlumatları** — contact person, address, phone, email, web site, and notes.
4. User saves the record and receives a success message.
5. User can later open the row/card edit action and update the record in the same Drawer.

Only `name`, `role`, `legalStatus`, and `contact` are currently required in the frontend flow. The interface must return the user to the tab containing any invalid required field.

Each counterparty can have an unlimited number of bank accounts. Selecting a known bank automatically fills verified bank code, tax ID, correspondent account, SWIFT/BIC, and country in read-only fields. The user enters the IBAN/account number manually.

For every currency, at most one account can be designated as the primary account. Enabling the primary toggle on one account automatically removes the primary designation from another account using the same currency. A user may leave a currency without a primary account. Accounts in different currencies can each be primary.

### Nomenclature

**Nomenclature** is the organization’s catalog of goods, services, work-in-progress, and finished products. It has two connected entities:

- **Folders (categories):** a hierarchy that organizes catalog items and supplies reusable defaults.
- **Items (elements):** concrete goods or services used in business documents.

#### Folder behavior

- A folder may have a parent folder and inherits defaults through the hierarchy.
- A folder can define defaults for item kind, income/expense behavior, purchase/sales tax, bill of materials, and warehouse tracking.
- A child folder falls back to its parent’s values; an item falls back to its folder chain; the system fallback is used only when no higher value exists.

#### Item behavior

- Each item belongs to a folder and requires a name, status, and base unit of measure.
- An item can explicitly override inherited folder defaults.
- Goods, work-in-progress, and finished products may use batch, expiry, and serial tracking.
- Services must not display warehouse tracking controls because stock tracking does not apply to them.
- SKU and barcodes are optional identifiers.

### Inbound bank payments

- The create flow offers customer payments, supplier refunds, and other receipts.
- Supplier refunds support advance returns and goods/service returns. Changing the refund type replaces distribution rows with the corresponding initial payments or return documents and resets allocated amounts.
- Currency and exchange rate follow the recipient bank account. Show the exchange rate only for USD and EUR; AZN amounts use a rate of 1 without a visible rate field.
- Other receipts group document, date, receipt type, payer/source, account, bank, amount, and currency into basic information; cash-flow item and bank reference into accounting/classification; and purpose and notes into additional information. Notes are limited to 500 characters.
- Other receipt types are bank interest, dividends, insurance, fines/compensation, founder funds, and other receipts.
- All three forms have an optional VAT rate (18% or 0%) and a read-only VAT amount in the payment currency. VAT is included in the entered gross amount: `VAT = amount * rate / (100 + rate)`, rounded to two decimals. Clearing the rate resets VAT to zero.
- Derived bank, currency, rate, AZN amount, VAT, and distribution document values are retained when saving. Records and source documents remain local prototype data.

## 3. Primary user roles

The current interface is designed for office users who maintain master data:

- **Administrator:** configures master data and system structure.
- **Accountant / finance employee:** maintains legal, tax, bank, and payment-related information.
- **Sales or purchasing employee:** creates and updates counterparties used in customer or supplier documents.
- **Warehouse / product employee:** creates catalog folders and items, including stock tracking rules.

Roles are business context, not yet an implemented permissions system. Do not imply an action is permission-protected unless access control is added explicitly.

## 4. Interaction principles

- Use Azerbaijani for visible product text; sidebar navigation remains English.
- Start with the user’s business task, not the database model.
- Show only inputs relevant to the current entity and selected type.
- Use short tab names and logical field grouping.
- Keep create/edit context in a Drawer; do not navigate away from a list unless the user needs a dedicated workspace.
- Use clear placeholders that describe the expected value.
- Preserve typed values when the user moves between tabs.
- Validate required fields at save time and focus the relevant tab.
- Confirm successful saves, imports, and exports with a concise message.
- Do not duplicate actions: master-list Excel actions belong in the list toolbar, not inside every form tab.

## 5. Data-list workflow

For Counterparties and Nomenclature, list pages follow the same sequence:

1. Search first.
2. Optionally change view or apply filters.
3. Use the single **Excel** menu to export the visible entity or import records.
4. Create a new record with the primary action at the end of the toolbar.
5. Review concise cards or a responsive table.
6. Edit through the row/card action.

Lists must retain pagination, empty states, and responsive horizontal table scrolling. Import/export operates on the active entity and should report the result to the user.

## 6. Current implementation boundaries

- Data is held in local React state; there is no backend, database, authentication, or persistence yet.
- Imports currently support system-exported HTML `.xls`, `.csv`, and `.tsv` text formats, not native binary `.xlsx` parsing.
- Bank data is a local curated list used for form auto-fill.
- Treat the interfaces and validation as a product prototype. When an API is introduced, retain the business terminology and user flow described here.

## 7. Change checklist for AI

Before implementing a business change:

1. Identify the user role and business goal.
2. Identify the relevant master-data entity and lifecycle step.
3. Determine which values are required, optional, derived, or inherited.
4. Keep conditional fields out of the UI until they apply.
5. Follow [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) for components, visuals, responsiveness, accessibility, feedback, and tables.
6. Preserve the existing local-state architecture unless the task specifically adds persistence.