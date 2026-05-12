# Ingestion SOP (MVP)

## Supported source types

- JSON: `POST /api/import/json` with `{ "filePath": "/abs/path/file.json" }`
- CSV: `POST /api/import/csv` with `{ "filePath": "/abs/path/file.csv" }`
- XLSX: `POST /api/import/xlsx` with `{ "filePath": "/abs/path/file.xlsx" }`
- PDF: `POST /api/import/pdf` with `{ "filePath": "/abs/path/file.pdf" }`
- PPT/PPTX: `POST /api/import/ppt` with `{ "filePath": "/abs/path/file.pptx" }`
- URL: `POST /api/import/url` with `{ "url": "https://..." }`

## Output behavior

- The service writes normalization results to `data/normalized/review-needed.json`.
- `accepted` entries passed schema validation.
- `rejected` entries include structured field errors.
- Imported entries should be reviewed before merging into `mappings.json`.
