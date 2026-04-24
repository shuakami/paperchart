---
name: paperchart-er-diagram
description: Render an entity-relationship diagram (Mermaid `erDiagram` equivalent). Each entity is a table-style box with a header (name + caption) and a list of typed fields with PK / FK markers. Relationships are drawn as bézier curves with crow's-foot cardinality markers at each end ("1", "0..1", "M", "1..M", "0..M"). Good for database schema diagrams in technical posts.
license: MIT
metadata:
  parent: paperchart
  slug: er-diagram
  file: src/charts/ErDiagramChart.tsx
---

# paperchart &mdash; ER diagram

Table-style entity boxes with typed fields and PK / FK markers, connected by
relationship lines with crow's-foot cardinality.

## When to use

- Database schema walkthroughs.
- Explaining multi-table joins in a blog post.
- Any entity-with-attributes diagram.

## Input shape

```json
{
  "data": {
    "entities": [
      { "id": "user", "label": "user", "caption": "account", "fields": [
        { "name": "id",         "type": "uuid",      "pk": true },
        { "name": "email",      "type": "text",                "note": "unique" },
        { "name": "created_at", "type": "timestamp" }
      ] },
      { "id": "org",  "label": "organization", "fields": [
        { "name": "id",   "type": "uuid", "pk": true },
        { "name": "name", "type": "text" }
      ] },
      { "id": "membership", "label": "membership", "accent": true, "fields": [
        { "name": "user_id", "type": "uuid", "pk": true, "fk": true },
        { "name": "org_id",  "type": "uuid", "pk": true, "fk": true },
        { "name": "role",    "type": "enum" }
      ] }
    ],
    "relationships": [
      { "from": "user", "to": "membership", "fromCard": "1", "toCard": "0..M", "label": "joins" },
      { "from": "org",  "to": "membership", "fromCard": "1", "toCard": "0..M", "label": "contains" }
    ]
  }
}
```

## Cardinality codes

| code    | meaning          | marker                     |
|---------|------------------|----------------------------|
| `"1"`   | exactly one      | single tick                |
| `"0..1"`| zero or one      | circle + tick              |
| `"M"`   | many             | crow's foot                |
| `"1..M"`| one or many      | tick + crow's foot         |
| `"0..M"`| zero or many     | circle + crow's foot       |

## Field options

- `pk: true` — adds a bold `PK` marker and uses medium weight for the name.
- `fk: true` — adds `FK` marker.
- `type` — right-aligned type label (uuid, text, enum, timestamp, ...).
- `note` — reserved for future rendering (currently stored, not drawn).

## Layout

Entities are arranged in a fixed grid (default 3 columns). Override with
`layout.columns` if you need a different split.

## CLI

```bash
paperchart er-diagram -i data.json -o er.png
paperchart er-diagram --defaults -o er.png
```
