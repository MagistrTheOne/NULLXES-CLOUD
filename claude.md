1. Архитектура продукта
NULLXES CLOUD
Customer platform · Control plane · Billing


Frontend
Next.js 16+ · React · shadcn/ui · Tailwind


Identity & Access
Better Auth · RBAC · Server-side authorization


Data layer
Neon PostgreSQL · Drizzle ORM · Migrations


Billing engine
Usage · Rates · Ledger · Limits




Provider integration layer
Provider adapter · Job orchestration · Reconciliation


RunPod
GPU / CPU resources, deployment and usage — according to verified API capabilities.


NULLXES Cloud API
Customer-facing API, resource management and usage reporting.




Это логическая схема, а не утверждение, что все модули уже реализованы. Их предстоит подключить к существующему проекту.
Принципиальное разделение
- Frontend отвечает за интерфейс и пользовательский опыт.
- Backend проверяет права, валидирует запросы, управляет ресурсами и биллингом.
- Neon хранит пользователей, тарифы, конфигурации, заказы и финансовые записи.
- RunPod предоставляет фактическую инфраструктуру, если выбранный продукт доступен через подтверждённый API.
- NULLXES CLOUD управляет наценкой, отображаемыми тарифами, клиентским кабинетом и коммерческими правилами.
Ключи провайдера никогда не передаются браузеру. Все операции с ресурсами выполняются через серверную часть.
2. Что делаем с существующим проектом
По твоему дереву файлов уже есть хорошая база:
Текущий файл	Его роль в продукте
app/page.tsx	Главная страница Cloud
components/site/hero.tsx	Главный экран инфраструктуры
components/site/gpu-section.tsx	Каталог GPU
components/site/configurator.tsx	Конфигуратор ресурсов
components/site/navbar.tsx	Навигация
components/site/footer.tsx	Подвал
lib/data.ts	Пока каталог и демоданные
lib/utils.ts	Общие утилиты
public/images/gpu-*.svg	Изображения оборудования
Не нужно переписывать всё. Агент должен сначала изучить текущие компоненты, зависимости и конфигурацию, а затем расширять проект без разрушения существующего дизайна.
Целевой стек
- Frontend: Next.js 16+, App Router, TypeScript, React, shadcn/ui, Tailwind CSS.
- Auth: Better Auth, подключённый к PostgreSQL через Drizzle.
- Database: Neon PostgreSQL, Drizzle ORM и версионируемые SQL-миграции. 
  
  Better Auth
  +2
- Infrastructure: серверный адаптер провайдера, первоначально RunPod.
- Deployment: сохранить существующий способ развёртывания; не менять хостинг без необходимости.
- Validation: строгая типизация, серверная валидация входных данных и автоматические тесты критических операций.
3. Модель продукта: что продаём

GPU Compute
B300, B200, H200, H100, A100 и RTX PRO 6000 — только те модели и конфигурации, которые реально доступны у поставщика.




CPU Compute
Виртуальные CPU-ресурсы с конфигурацией ядер, RAM и диска по возможностям поставщика.




Clusters & Dedicated
Кластерные и выделенные конфигурации. Отдельный продуктовый тип, а не декоративная вкладка.




Storage & Network
Хранилище, трафик, дополнительные ресурсы и их стоимость — при наличии подтверждённой поддержки.



Коммерческая модель: ×2
Базовое правило для тарифа:
\[
P_{\text{NULLXES}}=2\times C_{\text{provider}}
\]

Например, если сопоставимая единица вычислений обходится NULLXES в $0.40 за час, клиентская ставка составляет $0.80 за час.
Но в архитектуре нужно разделить:
- себестоимость провайдера;
- публичный тариф NULLXES;
- фактическую стоимость потребления;
- отдельные расходы на хранение, сеть и дополнительные услуги;
- налоги, комиссии платежей и корректировки.
Наценка ×2 не означает гарантированную прибыль ×2. Себестоимость и розничный тариф должны храниться раздельно. Сервер считает начисления по зафиксированной версии тарифа, а не по цене, которую клиент может передать в запросе.
До проверки условий RunPod также нельзя автоматически считать, что любой тариф или ресурс разрешено перепродавать на любых условиях.
4. База данных и серверные модули
Предлагаю организовать приложение по бизнес-доменам, сохранив текущий каталог components/site.
Домен	Что в нём находится
auth	Пользователи, сессии, роли
catalog	GPU/CPU, конфигурации, доступность
providers	Адаптеры провайдеров, внешние ID, ошибки API
instances	Создание, состояние, остановка и удаление ресурсов
pricing	Себестоимость, публичные тарифы, версии ставок
billing	Кошелёк, ledger, начисления, лимиты
usage	Потребление, синхронизация, сверка с провайдером
admin	Управление каталогом, тарифами и операциями
Основные таблицы PostgreSQL
- user, session, account, verification — схема Better Auth, с точным соответствием конфигурации библиотеки.
- organizations, members — если поддерживаем команды и общие ресурсы.
- provider_accounts — подключения к поставщикам; секреты не выдаются клиенту.
- products, configurations — каталог ресурсов.
- pricing_plans, price_versions — себестоимость и клиентские тарифы.
- instances — заказанные ресурсы и их состояние.
- usage_records — потребление с привязкой к источнику и периоду.
- wallets, ledger_entries — финансовые остатки и неизменяемая история движений.
- orders — заказы и результаты операций.
- audit_logs — действия администратора и критические изменения.
Все денежные величины храним в точных числовых типах, а не в JavaScript float. У записей потребления и начислений должны быть уникальные ключи для защиты от повторной обработки. Баланс нельзя менять простым присваиванием числа: движения проходят через финансовый ledger.
5. Промпт для coding-агента
Мага, вот основной промпт для Cursor Agent, Claude Code или другого агента, работающего непосредственно с репозиторием. Он рассчитан на доработку уже развёрнутого проекта, а не на генерацию новой демоверсии.
NULLXES CLOUD — Production Architecture & Implementation
ROLE
Act as a senior full-stack engineer, cloud infrastructure architect, backend engineer, and security-focused technical lead.
You are working on an EXISTING, DEPLOYED Next.js project named NULLXES CLOUD.
Your task is to evolve the current demonstration website into a production-oriented GPU / CPU as a Service platform.
Do not rebuild the application from scratch. Inspect the existing repository, preserve working components, and implement changes incrementally.
1. PRODUCT
NULLXES CLOUD is an independent cloud compute platform for AI, machine learning, inference, robotics, research, and general-purpose compute workloads.
Initial infrastructure provider: RunPod, subject to verification of API access, account permissions, reseller terms, supported operations, and actual resource availability.
NULLXES owns the customer-facing product, authentication, catalog, pricing, billing, resource orchestration, and customer experience.
Provider infrastructure is an implementation detail behind a provider abstraction.
2. REQUIRED STACK
- Next.js 16+ using App Router.
- React and TypeScript with strict type checking.
- shadcn/ui and Tailwind CSS.
- Better Auth for authentication and sessions.
- Neon PostgreSQL as the database.
- Drizzle ORM and version-controlled migrations.
- Server-side provider integration.
- Automated tests for critical business logic.
Inspect the existing package.json, lockfile, installed dependencies, Next.js version, deployment environment, and project conventions before changing dependencies.
Do not upgrade or replace working infrastructure without a demonstrated technical reason.
3. EXISTING PROJECT
Preserve and evolve these existing modules:
- app/page.tsx
- app/layout.tsx
- app/globals.css
- components/site/navbar.tsx
- components/site/hero.tsx
- components/site/gpu-section.tsx
- components/site/configurator.tsx
- components/site/footer.tsx
- components/ui/*
- lib/data.ts
- lib/utils.ts
- public/images/*
Inspect the actual source code before editing. The listed files describe the existing project structure and are not permission to assume their implementation details.
Keep the existing premium NULLXES CLOUD identity.
4. VISUAL DESIGN
Design language:
- Black, white, graphite, glass, and brushed metal.
- Premium enterprise infrastructure.
- Minimalist typography and precise spacing.
- Realistic server hardware imagery.
- Clean tables, resource cards, configuration panels, and status indicators.
- Responsive desktop and mobile layouts.
- Accessible interactions and clear loading, empty, and error states.
No cyberpunk aesthetics, neon effects, holograms, generic AI imagery, excessive gradients, or unnecessary visual decoration.
Do not replace the current design with a generic SaaS dashboard template.
5. ARCHITECTURE
Implement distinct modules for:
1. Authentication and authorization.
2. Resource catalog.
3. Provider integration.
4. Resource provisioning and lifecycle.
5. Pricing and price versioning.
6. Usage collection and reconciliation.
7. Wallet and financial ledger.
8. Customer orders and instances.
9. Administrative controls.
10. Audit logging.
Keep business logic outside React components and HTTP route handlers.
Use server-only modules for credentials, provider API calls, pricing calculations, and privileged database operations.
Define typed interfaces between domains.
6. PROVIDER ABSTRACTION
Define a provider-neutral interface for capabilities such as:
- Discovering available resource types.
- Retrieving current provider prices.
- Validating resource configurations.
- Creating resources.
- Retrieving resource status.
- Starting and stopping resources where supported.
- Terminating resources.
- Retrieving usage and operational metadata where supported.
The interface must distinguish supported operations from unsupported operations.
Implement a RunPod adapter only for endpoints and capabilities verified against the official documentation and the actual authorized account.
Do not invent endpoints, response fields, API capabilities, or provider guarantees.
Normalize provider responses into internal NULLXES domain models.
Persist external provider IDs and map external lifecycle states to internal states.
Handle timeouts, rate limits, retries, duplicate requests, partial failures, and provider-side state changes.
Use idempotency keys for resource creation and other non-repeatable operations.
If provider capabilities cannot be verified, document the limitation and keep the affected operation unavailable.
7. DEMO MODE VS PRODUCTION MODE
The existing project contains demonstration data.
Establish explicit, isolated DEMO and PRODUCTION modes.
DEMO:
- Uses clearly identified demonstration data.
- Never creates real provider resources.
- Never charges customers.
- Never presents simulated actions as completed real operations.
PRODUCTION:
- Requires valid server-side configuration.
- Uses real provider data and real provider operations.
- Returns explicit errors when required configuration is missing.
- Never silently falls back to demonstration data.
A mock provider may be used in tests or an explicitly selected demo environment only.
Never use mock data as a fallback for a production provider failure.
Every unavailable capability must be clearly marked as unavailable rather than represented by a fake working control.
8. PRICING
Implement a configurable pricing engine.
Default commercial rule:
customer_rate = provider_cost × 2
This rule must be configurable by resource, product, or pricing plan.
Store provider cost and customer-facing price separately.
Support:
- Versioned prices.
- Hourly and other supported billing intervals.
- Explicit currency.
- Exact decimal arithmetic.
- Price snapshots for orders and usage.
- Separate pricing for storage and networking when supported.
- Administrative price changes with audit history.
Never trust client-supplied prices or totals.
Never expose provider credentials or private provider account pricing data to unauthorized customers.
Define and document rounding rules.
9. BILLING AND USAGE
Implement a financial ledger rather than directly editing wallet balances.
Ledger entries must be auditable and protected against duplicate posting.
Associate usage records with:
- Customer or organization.
- Internal resource ID.
- Provider resource ID where available.
- Usage interval.
- Source and synchronization time.
- Applicable price version.
- Calculated charge.
- Reconciliation status.
Support idempotent usage ingestion and provider reconciliation.
Do not claim that usage-based billing is accurate until the actual provider metering source and billing semantics have been verified.
Define a safe policy for insufficient funds, spending limits, and resource termination failures.
Do not create real paid resources until the applicable authorization, spending limit, and provisioning policy checks pass.
10. DATABASE AND AUTH
Use Neon PostgreSQL with Drizzle ORM.
Integrate Better Auth through its supported Drizzle adapter.
Create explicit schemas, foreign keys, unique constraints, indexes, and version-controlled migrations.
Use database-backed authorization for privileged operations.
Enforce customer ownership or organization membership on every protected resource operation.
Never rely on hidden UI elements or client-side role checks as authorization.
Protect administrative routes and all billing-sensitive operations.
Do not apply destructive schema changes to a production database without reviewing the migration and its impact.
11. SECURITY
- Keep all provider API keys server-side.
- Validate environment configuration at startup or during the relevant operation.
- Validate all incoming payloads.
- Enforce authentication, authorization, ownership, and resource limits.
- Prevent duplicate provisioning and billing operations.
- Avoid logging secrets, session tokens, or sensitive customer information.
- Record administrative actions and sensitive lifecycle operations.
- Use secure session and cookie configuration appropriate to the deployment environment.
- Implement rate limiting where required by the exposure and operational risk.
- Return safe, structured errors without leaking internal credentials or stack traces.
12. API AND UI
Use Next.js App Router server components and Route Handlers where appropriate.
Implement typed service boundaries and validated request and response schemas.
Build the customer experience incrementally:
- Public resource catalog.
- GPU/CPU configurator.
- Authentication.
- Customer dashboard.
- Resource creation and lifecycle controls.
- Instance details and status.
- Usage and billing history.
- API credentials and account settings where supported.
- Administrative catalog and pricing management.
A UI action must correspond to a real implemented operation in its current mode.
Display loading, success, failure, unavailable, and pending states accurately.
Do not expose unfinished production operations as functional.
13. IMPLEMENTATION WORKFLOW
PHASE A — REPOSITORY AUDIT
Inspect the complete relevant repository, package scripts, existing components, current mock data, deployment configuration, and installed dependencies.
Identify the existing implementation, missing modules, risks, and the smallest safe migration path.
PHASE B — FOUNDATION
Establish configuration validation, database connectivity, Drizzle schemas, migrations, Better Auth, and server-side authorization.
PHASE C — CATALOG AND PRICING
Move resource catalog data into a structured domain model. Implement pricing and configuration validation without assuming unverified provider capabilities.
PHASE D — PROVIDER INTEGRATION
Verify the official API, credentials, permissions, resource lifecycle operations, pricing data, and metering behavior. Implement and test the provider adapter.
PHASE E — RESOURCE LIFECYCLE
Implement provisioning, status synchronization, failure handling, idempotency, and safe termination.
PHASE F — BILLING
Implement usage ingestion, ledger entries, price snapshots, spending limits, and reconciliation.
PHASE G — CUSTOMER AND ADMIN UI
Connect the existing design to real server-side services. Preserve the current visual identity.
PHASE H — VALIDATION
Run applicable lint, type-check, unit tests, integration tests, and production build checks.
Test authorization boundaries, duplicate requests, provider failures, missing configuration, and billing invariants.
Do not claim that a check passed unless it was actually executed and its result observed.
14. ENGINEERING RULES
- No fake functionality.
- No placeholder implementations presented as production-ready.
- No invented provider API capabilities.
- No silent demo fallback in production.
- No hardcoded secrets.
- No direct client-side provider calls.
- No client-trusted prices or balances.
- No destructive production migrations without review.
- No unrelated rewrites or unnecessary dependency changes.
- No deletion of working project functionality without justification.
If a capability cannot be completed because credentials, documentation, permissions, or external services are unavailable, report the exact blocker and leave the capability explicitly unavailable.
15. REQUIRED DELIVERABLES
At completion, provide:
1. Repository audit and identified risks.
2. Implemented architecture and module boundaries.
3. Files created or modified.
4. Database schemas and migration status.
5. Authentication and authorization status.
6. Provider operations verified and implemented.
7. Pricing and billing implementation status.
8. Tests and build results, including failures.
9. Required environment variables without their secret values.
10. Deployment and migration instructions.
11. Outstanding blockers and unsupported capabilities.
Start with PHASE A. Inspect the repository and report the findings before making broad architectural changes. Proceed incrementally, preserving the working application and verifying each completed phase.




6. Рекомендуемая структура каталогов
Агент может адаптировать её под текущую структуру. Это целевая организация, а не требование немедленно переместить все файлы.
app/
├── (marketing)/
│   └── page.tsx
├── (auth)/
│   ├── sign-in/
│   └── sign-up/
├── dashboard/
│   ├── page.tsx
│   ├── instances/
│   ├── usage/
│   ├── billing/
│   └── settings/
├── admin/
├── api/
│   ├── auth/[...all]/
│   ├── catalog/
│   ├── instances/
│   ├── usage/
│   └── billing/
├── globals.css
└── layout.tsx

components/
├── site/
│   ├── hero.tsx
│   ├── gpu-section.tsx
│   ├── configurator.tsx
│   ├── navbar.tsx
│   └── footer.tsx
├── dashboard/
├── catalog/
├── instances/
├── billing/
└── ui/

lib/
├── auth/
├── db/
│   ├── schema/
│   ├── index.ts
│   └── migrations/
├── providers/
│   ├── types.ts
│   ├── capabilities.ts
│   └── runpod/
├── catalog/
├── pricing/
├── instances/
├── billing/
├── usage/
├── permissions/
├── validation/
└── utils.ts

tests/
├── unit/
├── integration/
└── contracts/


7. Что проверяем первым делом
Не надо сразу поручать агенту всю платформу одним огромным изменением. Начни с аудита, затем двигайся по этим этапам.
План реализации
0 из 7



[ ] 1. Аудит существующего приложения
Зависимости, реальные моки, текущие страницы, переменные окружения, деплой.


[ ] 2. Neon + Drizzle + Better Auth
Подключение БД, миграции, регистрация, сессии и серверная авторизация.


[ ] 3. Каталог и конфигуратор
Сохранить визуальный стиль, отделить каталог от статических данных.


[ ] 4. Проверка RunPod API
Доступ аккаунта, доступные модели, цены, создание и остановка ресурсов, учёт потребления.


[ ] 5. Провайдер и жизненный цикл
Реальные операции, состояния, идемпотентность и обработка ошибок.


[ ] 6. Биллинг ×2
Тарифы, ledger, лимиты расходов, сверка начислений.


[ ] 7. Production-проверки
Тесты, безопасность, миграции и сборка.



Документация для реализации: Next.js App Router, Better Auth + Drizzle, Drizzle + Neon. 

Next.js
+2



Мой приоритет: сначала довести до реального состояния авторизацию, каталог и серверную основу. Параллельно проверить RunPod. Только после подтверждения доступных операций подключать создание инстансов и реальные начисления.
И ещё один момент: ×2 от цены провайдера — это коммерческое правило NULLXES, но доступность конкретного GPU, право его перепродажи и фактическая модель биллинга должны подтверждаться отдельно. Так мы строим собственный сервис, а не интерфейс, который красиво выглядит, но не контролирует реальную инфраструктуру.