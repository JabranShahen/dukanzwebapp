# Dukanz Web Migration Boundary

## What moved into `dukanzwebapp-next`

- Route-first Angular 21 SPA foundation
- Shared management shell and reusable UI primitives
- Centralized Dukanz services for `ProductCategory`, `DukanzProduct`, and `DukanzConfig`
- Dedicated auth boundary with auth service, token storage, guard, and interceptor seam
- Public landing, privacy, login, sign-in, dashboard, category, product, account, settings, and UI reference routes
- Full category/product/settings CRUD workflows (create, edit, delete, initialize, save)

## What stayed reference-only in `dukanzwebapp`

- `src/app/entities/product.ts`
- `src/app/entities/product_catagory.ts`
- `src/app/shared/services/auth/jwt-auth.service.ts`
- `src/app/shared/interceptors/token.interceptor.ts`
- `src/app/shared/guards/auth.guard.ts`
- `src/app/views/managment/catagory/services/apiservice.ts`
- `src/app/views/managment/catagory/services/catagory.service.ts`
- `src/app/views/managment/product/services/product.service.ts`
- Legacy Matx layout, dialogs, and table patterns

## Extraction notes

- Product and category entity fields were preserved, then normalized into cleaner TypeScript interfaces.
- Legacy hardcoded service strings were replaced with environment-driven endpoint mapping.
- Legacy folder structure was not reused. Feature routes now own their screens directly.
- Category/product/settings now follow modal CRUD + confirm dialog + mutation feedback workflows in the new shell.

## Deletion criteria for legacy `dukanzwebapp`

- `dukanzwebapp-next` passes `npm install`, `npm run build`, and `npm test`
- Real Dukanz auth contract is implemented behind the current auth service seam
- Category and product CRUD flows reach parity with current operator expectations
- Required public and protected routes are validated with stakeholders
- Remaining legacy-only logic is either migrated or explicitly retired

## Known gaps and deferred work

- Real backend auth endpoint selection and response contract
- Production smoke verification for all newly enabled mutation endpoints (`ProductCategory`, `DukanzProduct`, `DukanzConfig`)
- Final retirement choreography for `dukanzwebapp`
