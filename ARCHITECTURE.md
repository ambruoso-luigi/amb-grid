# AMB Grid Architecture


This document describes the current architecture of AMB Grid: the main responsibilities of the library, the ownership boundaries between its parts, and the dependency rules that should remain stable as the project evolves.


It is intentionally not an API reference, a changelog, or a roadmap. Public methods and options belong in the generated API documentation and, where appropriate, in the README; implementation history belongs in the changelog and internal audits.


## 1. Purpose and scope


AMB Grid is a framework-agnostic JavaScript library for editable CRUD data grids used in business applications.


The library owns the public grid contract exposed through the `AMB` namespace and, in particular, the controller returned by `AMB.table(...)`. It coordinates the application-level behavior around the grid, including row lifecycle, editing rules, validation, lookup behavior, rollback, selection, search and filtering, calculations, save payload generation, feedback UI, and lifecycle cleanup.


Tabulator is the internal table engine. It provides the low-level table runtime and component primitives, but it is not the primary application-facing API. Normal application code should use the AMB Grid controller and public helpers. Direct access to the internal engine is an advanced escape hatch and may bypass AMB Grid coordination.


AMB Grid does not own the application backend. The consuming application remains responsible for API calls, persistence, authentication, authorization, authoritative business rules, server-side validation, and database security. AMB Grid prepares and exposes data and CRUD payloads, but it does not decide how or where those payloads are persisted.


React, Vue, Angular, classic JavaScript pages, and server-rendered applications are integration environments around the same core library. They do not define separate AMB Grid cores.


## 2. Architectural principles


- **Framework agnostic.** The reusable core must not depend on React, Vue, Angular, or any other application framework.
- **AMB-owned public API.** The stable application-facing contract belongs to AMB Grid. The internal table engine remains an implementation detail except for explicitly documented advanced access.
- **Clear ownership.** The application or framework owns the surrounding view, container, backend communication, and view lifecycle. AMB Grid owns the grid runtime inside that container and must release its resources through `grid.destroy()`.
- **Separation of concerns.** Formatting, editing, validation, and payload normalization are different responsibilities. A formatter does not validate, an editor does not define backend normalization, and a parser does not replace validation.
- **Demo isolation.** Demo pages, fake backends, example data, and site-only presentation must not become runtime dependencies of the reusable library.
- **Backend neutrality.** The library may prepare structured CRUD payloads, but backend transport and persistence remain application concerns.
- **Explicit lifecycle cleanup.** Resources created by an AMB Grid instance must be released by that instance. Framework integrations map their own mount/unmount lifecycle to AMB Grid creation and destruction.
- **Public contract before implementation detail.** New capabilities should be exposed through AMB Grid abstractions when they are part of the supported product surface, rather than requiring normal consumers to reach into the internal engine.


## 3. High-level architecture


The main runtime path is intentionally layered:


    Application / framework
            |
            v
    AMB Grid public package surface
            |
            v
    AMB.table(...)
            |
            v
    AMBTableController
            |
            +-- CRUD lifecycle and row state
            +-- row, cell, and column operations
            +-- validation, editing, and parsing coordination
            +-- lookup and Multifield Lookup
            +-- selection, search, filtering, and pagination
            +-- calculations and history
            +-- AMB-owned UI and lifecycle cleanup
            |
            v
    AMB Grid internal runtime/modules
            |
            +-- CrudHelper
            +-- column pipeline and column runtime
            +-- search controller
            +-- history runtime
            +-- calculation runtime
            +-- lookup coordination
            +-- UI components and binders
            |
            v
    Third-party runtime dependencies
            |
            +-- Tabulator
            +-- Awesomplete
            +-- vanilla-datepicker


The package exposes the `AMB` namespace together with selected named exports. `AMB.table(...)` is the primary grid creation path and returns the controller that applications should normally use for grid operations.


The controller is not a second table engine. It is the AMB Grid coordination layer around the internal table runtime: it composes focused method groups and connects CRUD state, validation, lookup behavior, UI helpers, navigation, calculations, history, and cleanup to the same grid instance.


The external runtime libraries remain implementation dependencies of AMB Grid. Tabulator supplies the table engine, Awesomplete supports autocomplete behavior, and vanilla-datepicker supplies calendar selection. Consumers should normally interact with AMB Grid abstractions rather than those runtimes directly.


## 4. Repository structure


The repository separates reusable library code, distribution entrypoints, demo code, examples, and tests.


- `src/index.js` defines the selected named exports of the reusable JavaScript API.
- `src/lib/amb.js` assembles the public `AMB` namespace, including `AMB.table(...)`, editors, validators, formatters, parsers, lookup helpers, date helpers, and reusable public UI classes.
- `src/lib/` contains the reusable library core and application-level behavior, including `CrudHelper`, lookup, Multifield Lookup, validators, parsers, formatters, date helpers, and editor infrastructure.
- `src/lib/table/` contains table construction and runtime coordination. Its `controller/` modules implement focused groups of methods that are composed into the flat controller returned by `AMB.table(...)`.
- `src/lib/editors/` contains concrete cell-editor implementations and their supporting logic.
- `src/ui/` contains reusable AMB Grid UI components and helpers such as dialogs, toolbar, feedback, floating messages, cell-message binding, and focus management.
- `src/amb-grid.css` is the reusable library stylesheet. Demo/site styling must remain separate from it.
- `src/library-entry.js` is the modern library-build entrypoint; it imports the required library/runtime styles and re-exports the public JavaScript surface.
- `src/library-legacy-entry.js` is the standalone UMD/legacy build entrypoint.
- `src/demo/` and `demo/fake-backend/` are demo-only code and data simulation. They are not part of the reusable library runtime.
- `examples/frameworks/` contains framework integration examples for React, Vue, and Angular. These demonstrate lifecycle integration; they are not framework-specific AMB Grid cores.
- `tests/` contains the automated test suites for library behavior and contracts, primarily Vitest tests together with Playwright E2E coverage under `tests/e2e/`, while `test/` contains the browser technical test page used by project test/demo workflows.
- `docs/` contains generated API documentation and internal documentation.
- `scripts/` contains build, packaging, verification, demo-data, and release-support tooling.


The key repository boundary is that reusable code may support demo and integration code, but demo, framework-example, and fake-backend code must not become dependencies of the reusable library build.


## 5. Main internal components and responsibilities


AMB Grid is organized around a small number of cooperating subsystems. The controller returned by `AMB.table(...)` is the application-facing coordination layer; the components below provide the state, transformation, runtime, and UI behavior that the controller composes.


### Table factory and controller composition


`src/lib/table/table-factory.js` creates the AMB-managed grid instance. It normalizes supported options, prepares the column pipeline, creates and wires the internal table engine, CRUD layer, AMB runtimes and UI helpers, and composes the focused controller method groups into the flat `AMBTableController`.


Architecturally, the factory is the composition root of each AMB Grid instance: `AMB.table(...)` assembles the engine, CRUD layer, column pipeline/runtime, internal services, UI resources, and controller methods into one managed grid instance rather than requiring application code to create those subsystems independently.


The controller modules under `src/lib/table/controller/` are organized by responsibility rather than by separate controller objects. They expose focused groups such as CRUD, data, row, cell, column, validation, selection, filtering, search, pagination, calculations, history, navigation, lifecycle, export, grouping, persistence, ranges, spreadsheet support, and other runtime operations. Their public methods are composed onto one controller so consumers interact with one grid object.


### CrudHelper


`CrudHelper` owns the AMB Grid CRUD state model for managed rows. It tracks the lifecycle states `clean`, `new`, `modified`, `deleted`, and `saved`, together with original row snapshots, modified fields, validation errors, temporary identifiers, backend identifiers, and save-state transitions.


It is also responsible for producing change reports and save payloads, applying rollback semantics, reconciling backend-generated identifiers, and maintaining AMB application-level validation state. It listens to relevant table events so runtime edits can be translated into AMB row and cell state.


`CrudHelper` is not the backend persistence layer. It classifies and prepares changes; the consuming application decides when and how those changes are sent to a backend.


### Column pipeline and column runtime


The column pipeline converts application column definitions into runtime definitions that preserve AMB Grid behavior. It clones and enriches application columns, extracts declarative validation rules, prepares lookup and checkbox behavior, applies AMB defaults where appropriate, and prepares calculation-related configuration before the internal table engine receives the final definitions.


The column runtime keeps AMB-managed column behavior synchronized when columns are added, updated, removed, or replaced after grid creation. This separation is important because changing a runtime column must not silently bypass AMB validation, lookup, formatting, calculation, or CRUD coordination.


### Editors, validators, parsers, and formatters


These four families deliberately have different responsibilities:


    Formatter  -> how a stored value is presented
    Editor     -> how the user changes a value
    Validator  -> whether a value is acceptable
    Parser     -> how a value is normalized into a predictable representation, especially for payload/backend use


Editors manage user interaction and commit behavior. Validators evaluate values and produce validation results. Parsers normalize values into predictable representations, especially for payload-oriented use, without replacing validation. Formatters control presentation and must not become the authoritative source of stored data.


Some components cooperate internally—for example date formatters and validators can reuse AMB parsers—but their public responsibilities remain distinct.


### Lookup and Multifield Lookup


The lookup subsystem represents external value sets independently from the table engine. A lookup can load records, match values, cache results, expose descriptions, and support editor or dialog-based selection.


Multifield Lookup builds on that model for record-oriented mappings. Instead of updating only one cell value, it coordinates a master field and one or more dependent row fields so selection of one external record can update the row as one AMB-managed change.


Lookup metadata and mapping remain part of the AMB Grid lifecycle so editing, validation, rollback, search, payload generation, and reload behavior can remain coherent.


### Runtime services


Several focused runtime modules support behavior that spans multiple controller methods or engine events. Examples include search coordination, history reconciliation, calculation presentation and recalculation, lookup metadata initialization, hover binders, and other column/runtime synchronization helpers.


These modules are internal implementation units. They should not become separate application-facing engines unless a capability is intentionally promoted to the public AMB Grid contract.


### AMB-owned UI components


Reusable UI components under `src/ui/` provide AMB-owned interaction surfaces such as confirmation dialogs, lookup dialogs, search-filter dialogs, toolbar controls, feedback regions, floating messages, cell-message binding, and focus management.


These components are not demo widgets. When used by the reusable grid runtime they are part of AMB Grid itself and therefore participate in its lifecycle and cleanup responsibilities.


## 6. Public surface, ownership, and lifecycle boundaries


AMB Grid exposes several public layers, but they do not have the same role.


### Public API layers


The primary package-facing namespace is `AMB`. It exposes the main factories and helpers used by normal consumers, including `AMB.table(...)`, editors, validators, formatters, parsers, date helpers, lookup factories, and selected reusable UI classes.


`AMB.table(...)` returns the `AMBTableController`, which is the primary API for one managed grid instance. Application code should normally use controller methods for data access, CRUD operations, rows, cells, columns, selection, validation, search, filtering, pagination, calculations, history, navigation, events, feedback, and lifecycle cleanup.


The package also exposes selected named exports from `src/index.js`, including `CrudHelper`, `ROW_STATE`, editor/validator/parser/formatter collections, lookup factories, and reusable UI classes. These exports are part of the package surface, but they do not replace the controller as the normal coordination point for an AMB-managed grid.


Two controller properties provide intentionally lower-level access:


    Normal application use
            |
            v
    AMB namespace / AMBTableController
            |
            +-- grid.table  -> advanced access to the internal table engine
            |
            +-- grid.crud   -> advanced compatible access to CrudHelper


`grid.table` and `grid.crud` exist for integration scenarios and compatibility, but normal application code should prefer controller methods where AMB Grid already exposes the required behavior. Direct engine or CRUD-layer calls can bypass controller-level coordination if used outside the documented contract.


Underscored fields on the returned controller are internal integration objects and are not part of the stable public API.


### Event boundaries


AMB Grid separates application event subscriptions from its own internal runtime bindings.


`grid.on(...)` and `grid.off(...)` manage application listeners for public grid events while AMB Grid tracks those listeners separately from the bindings it uses internally for lifecycle, lookup, validation, and other coordination. Removing an application listener through the public controller therefore does not dismantle AMB-owned event wiring.


CRUD lifecycle events form a separate channel exposed through `grid.onCrud(...)` and `grid.offCrud(...)`. This keeps application observers of AMB CRUD state distinct from generic grid runtime events.


Direct event management through `grid.table` remains advanced engine access and should not be used as a substitute for the public event APIs when AMB Grid already exposes the required event boundary.


### Application and framework ownership


The application or framework owns the surrounding view and the container into which AMB Grid is mounted. It also owns backend communication, routing, application state outside the grid, and the lifecycle of the surrounding screen, component, tab, or modal.


AMB Grid owns the grid runtime created inside that container. This includes the internally managed table engine, CRUD state, runtime services, AMB-owned UI resources, event bindings, lookup coordination and subscriptions, search helpers, feedback, and other resources assembled for that grid instance.


The ownership boundary is therefore:


    Application / framework
            |
            +-- owns view/component/container
            +-- owns backend calls and surrounding application state
            |
            v
    AMB.table(...)
            |
            +-- owns the AMB Grid instance inside the container
            +-- owns internal runtime resources
            +-- returns the controller


Framework integrations follow the same model rather than introducing framework-specific grid ownership. React creates the grid after mount and destroys it during effect cleanup; Vue maps creation and destruction to its mount/unmount lifecycle; Angular creates the grid after the view exists and destroys it from the component lifecycle.


### Resource lifecycle


Resources created for one AMB Grid instance are released through that instance's `grid.destroy()`.


The destroy path releases AMB-owned resources before destroying the internal table engine. This includes calculation and history runtimes, toolbar resources, column and lookup subscriptions, binders, search, feedback, messages, dialogs, CRUD bindings, and finally the table engine itself.


    AMB.table(...)
         |
         v
    managed grid instance
         |
         +-- controller
         +-- CRUD layer
         +-- runtime services
         +-- UI resources
         +-- internal engine
         |
         v
    grid.destroy()
         |
         v
    release owned resources and destroy the engine


A controller should not normally be reused after destruction.


### Dependency direction


The intended dependency direction is one-way:


    Application / framework
            |
            v
    Public AMB Grid API
            |
            v
    AMB Grid internal runtime/modules
            |
            v
    Third-party runtime dependencies


The inverse direction must not become an architectural dependency: the reusable core must not depend on demo code, fake backends, framework examples, or application-specific backend logic. Third-party runtime details should not leak into normal application code when an AMB Grid abstraction already exists.


## 7. Data, validation, and save lifecycle


AMB Grid treats loaded data, local edits, validation state, and backend persistence as related but distinct concerns.


### CRUD baseline and row states


When data is initially loaded or deliberately replaced through the managed controller, AMB Grid establishes a CRUD baseline. Persisted rows are compared against that baseline to determine whether application data has changed.


The main lifecycle states are:


    clean      -> row matches the current baseline
    new        -> row exists only on the client and has not yet been confirmed by the backend
    modified   -> persisted row differs from its baseline
    deleted    -> persisted row is marked for deletion but remains available for rollback
    saved      -> a pending row was explicitly acknowledged as saved


New rows receive AMB-managed temporary identifiers when no backend identifier exists. A new row that is removed before being saved can be physically removed immediately; a persisted row is normally marked as `deleted` so it can still participate in rollback and save reporting.


Rollback restores the AMB baseline for modified or deleted persisted rows. Rolling back a new unsaved row removes it because no persisted baseline exists.


### Validation and state reporting


Validation does not replace CRUD state, and CRUD state does not imply validity. AMB Grid tracks application-level row and field errors separately from row lifecycle state.


`grid.validate(...)`, `grid.validateChanges()`, and row-level validation APIs evaluate configured AMB validators. Validation of pending changes primarily concerns `new` and `modified` rows, while deleted rows are excluded from normal change validation unless explicitly included for a technical audit.


`grid.getStateReport()` provides a read-only snapshot that combines lifecycle state, validation errors, changed fields, and grouped change information. Reading the report does not save data or change the CRUD baseline.


### Payload generation and backend handoff


`grid.getSavePayload()` derives a backend-oriented snapshot from the current AMB Grid state. By default it uses valid changes and reports inserted, updated, and deleted data without performing network communication or mutating row state.


The save boundary is therefore:


    managed rows and CRUD state
            |
            v
    validation / state report
            |
            v
    getSavePayload()
            |
            v
    application-owned transport
            |
            v
    backend persistence


AMB Grid stops at payload preparation. The application decides whether, when, and how to call the backend.


### Backend reconciliation


Backend success is reconciled explicitly rather than assumed.


For inserted rows, `grid.applyBackendIds(...)` can replace AMB temporary identifiers with identifiers generated by the backend while keeping AMB tracking coherent.


After the application has received successful persistence confirmation, `grid.markRowSaved(...)`, `grid.markRowsSaved(...)`, or `grid.markValidChangesSaved()` can advance the relevant local rows. New and modified rows receive a new saved baseline; successfully deleted persisted rows can then be physically removed.


This keeps the direction explicit:


    AMB Grid prepares changes
            |
            v
    application sends them
            |
            v
    backend confirms persistence
            |
            v
    application reconciles ids / saved state with AMB Grid


AMB Grid never treats payload generation itself as proof that persistence succeeded.


## 8. Build and distribution architecture


The repository produces separate distribution forms from the same reusable source code.


### Modern package build


The modern library build starts from `src/library-entry.js` and produces the ESM library artifacts in `dist-lib/`.


The modern ESM build produces the JavaScript module, the complete AMB Grid stylesheet, and source maps where configured. TypeScript declarations are produced separately by the declaration build; `build:dist` combines the modern ESM build, the standalone/legacy build, and the type-declaration build into the complete distribution output. The modern JavaScript build keeps the main third-party runtime packages as external package dependencies rather than embedding them into the ESM bundle.


The npm package exposes the root JavaScript API, the stylesheet subpath, and TypeScript declarations. The package allowlist is intentionally centered on `dist-lib/`, so demo source, tests, internal documentation, and development tooling do not become part of the runtime package surface.


### Standalone / legacy build


The standalone build starts from `src/library-legacy-entry.js` and produces `amb-grid.umd.js`. It exposes the public browser global directly as `AMB` and is intended for applications that do not use ESM imports or a bundler.


Unlike the modern ESM build, the standalone artifact incorporates the JavaScript runtime dependencies needed by AMB Grid so consumers do not load Tabulator, Awesomplete, or the datepicker as separate scripts.


The standalone release archive is built from the verified distribution artifacts and contains the UMD bundle, AMB Grid stylesheet, README, license, version metadata, and optional source maps. It is a release artifact, not a separate implementation of the library.


### Type declarations


TypeScript declarations are generated from the public JavaScript/JSDoc surface rooted at `src/index.js`. The declaration build is therefore another representation of the public package contract, not a separate TypeScript implementation of AMB Grid.


Changes to runtime public behavior, JSDoc, and declarations should remain aligned so JavaScript behavior and TypeScript consumer expectations describe the same API.


### Release boundary


Release artifacts are generated from verified source and version metadata. The release process uses an annotated version tag; pushing a matching `vX.Y.Z` tag triggers the GitHub release workflow, which verifies package/legacy distributions and attaches the standalone archive.


npm publication is a separate distribution action. GitHub Releases and npm therefore publish different delivery forms of the same AMB Grid public contract; neither should introduce demo or development-only code into the reusable runtime.


## 9. Testing architecture


AMB Grid uses different test layers for different architectural risks.


### Module and contract tests


Vitest suites cover focused library behavior such as CRUD state, editors, validators, parsers, lookup behavior, controller methods, column runtime behavior, UI helpers, lifecycle cleanup, and public/engine API contracts.


These tests are also used to protect architectural boundaries: controller method composition, public API coverage, internal-engine encapsulation assumptions, and reusable UI contracts can be checked without depending on the demo application.


### Browser interaction tests


Playwright E2E tests under `tests/e2e/` cover behavior that depends on real browser interaction, focus, keyboard navigation, dialogs, editing, and other runtime integration details that unit-level tests cannot fully represent.


The technical browser page under `test/` is a development/test surface and is distinct from the automated test suite under `tests/`.


### Distribution verification


Packaging has its own verification layer because a source tree can be correct while a published artifact is not.


Package checks verify the export map, expected files, package allowlist, absence of demo/development paths, stylesheet/type entries, and the ability to install the generated package into a clean consumer project.


Standalone verification checks the UMD bundle in a browser-like flow, including the public `AMB` global and the absence of unresolved module imports or separately required runtime dependency assets.


Type declaration generation and consumer type-checks protect the TypeScript-facing contract.


Conceptually, the test layers map to change types as follows:


    library behavior / contracts
            -> Vitest


    browser interaction and focus behavior
            -> Playwright E2E


    npm package surface and consumer installation
            -> package verification / smoke tests


    standalone browser distribution
            -> legacy package and browser smoke tests


    TypeScript public contract
            -> declaration build and consumer type-check


No single test layer replaces the others; each protects a different architectural boundary.


## 10. Architectural invariants for future changes


The following rules summarize the boundaries that future changes should preserve:


- Normal application functionality should be exposed through AMB Grid APIs when it belongs to the supported product surface; direct internal-engine access remains an advanced escape hatch.
- Managed data mutations should go through AMB Grid coordination when CRUD state, validation, rollback, history, lookup metadata, or payload generation must remain coherent.
- New per-grid runtime resources, subscriptions, dialogs, binders, or controllers must have explicit ownership and participate in `grid.destroy()`.
- Demo, fake-backend, framework-example, and site-only code may consume the reusable library but must not become dependencies of the reusable core or package build.
- Framework integrations should adapt framework lifecycle to `AMB.table(...)` and `grid.destroy()` rather than introducing separate framework-specific AMB Grid cores.
- Backend transport, authorization, authoritative business rules, persistence, and server-side validation remain outside the library.
- Runtime public behavior, documented public API, package exports, and TypeScript declarations should evolve together as one public contract.
- Third-party runtimes remain implementation dependencies. Their APIs should not leak into normal application code when AMB Grid already provides an owned abstraction.