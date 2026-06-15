# Security notes

AMB Grid renders editable tabular data in the browser and generates structured CRUD payloads for application code to submit to a backend.

AMB Grid does not generate SQL queries, does not replace backend validation, and does not replace backend authorization.

## Frontend output safety

Textual formatters escape HTML by default. Values such as `<b>test</b>` or `<img src=x onerror=alert(1)>` must be displayed as text, not interpreted as HTML.

If intentional HTML rendering is introduced in the future, it must be explicit and documented as an advanced and unsafe-by-default capability. Plain text formatters should remain safe by default.

## SQL injection

AMB Grid does not build SQL queries. CRUD payloads produced by AMB Grid must be treated as untrusted input by the backend.

Backend code must use parameterized queries, prepared statements, safe ORM methods, or properly constructed stored procedures. Developers must not concatenate values received from AMB Grid into SQL strings.

Client-side validation is useful for usability and data quality, but it is not a SQL injection defense.

```js
// Bad: do not build SQL by concatenating payload values
const sql = "UPDATE customers SET name = '" + row.name + "' WHERE id = " + row.id;
```

```js
// Good: use parameters / prepared statements on the server
execute(
  "UPDATE customers SET name = ? WHERE id = ?",
  [row.name, row.id]
);
```

## Server-side validation

All data must be validated again on the server. Required fields, max lengths, numeric ranges, date formats, and permissions must be enforced by the backend.

Client-side validators are not a trust boundary.

## Recommended responsibility split

AMB Grid responsibility:

* safe textual formatter output
* structured CRUD payload generation
* client-side validation for usability
* clear row states
* rollback and state tracking

Backend responsibility:

* authentication
* authorization
* persistence
* server-side validation
* SQL injection prevention
* database constraints
* audit/logging if required
