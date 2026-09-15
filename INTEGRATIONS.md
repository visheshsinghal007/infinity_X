# Integration configuration

## Registry records

`server/integrations.mjs` defines the mock and imported-record adapter boundary. `lib/compliance.mjs` contains category definitions, validation, explainable matching and scoring. The application never silently contacts an official government portal. Use a reference JSON file or enter records obtained through an authorized process, with the receipt/reference source and page.

An approved live registry adapter must normalize responses to the existing category record contract, preserve provider receipt IDs and timestamps, identify its provenance, handle downtime as Unclear, and implement the provider's actual authentication and permitted scope. None is configured in this release.

## Optional LLM adapter

The deployment owner can configure an OpenAI-compatible chat-completions endpoint with these **server environment variables**:

```
EPSILON_AI_URL=https://your-approved-provider.example/v1/chat/completions
EPSILON_AI_TOKEN=YOUR_SERVER_SIDE_SECRET
EPSILON_AI_MODEL=YOUR_APPROVED_MODEL
EPSILON_AI_LABEL=Your approved provider name
```

Do not place secrets in public code, a browser form, GitHub, or the ZIP. Configure Netlify environment variables and redeploy. For local use, provide variables to the Node process through your usual secret-management method. These variables are optional: deterministic extraction and verification work without them.

The UI shows whether the adapter is configured. An officer must explicitly consent to sending a selected document's extracted text before using semantic suggestions. The server sends at most ten pages, each capped at 12,000 characters, over HTTPS, with a 25-second timeout. Returned claims must use allowed categories and match a literal excerpt on the stated source page. Unsupported claims are discarded. Suggestions do not alter reference records, scores, or officer decisions automatically. No live AI endpoint was configured or validated during this release; fixture tests validate the adapter contract and evidence filter.

## OCR

Tesseract.js performs English OCR in the browser. Scanned PDFs are rendered with PDF.js. First use downloads engine/language assets from public CDNs; document images remain in browser processing. The extracted text and the original document are saved to the app database when the user uses the extraction workflow. OCR output is unverified and can contain errors. Limit: ten scanned pages and 3 MB. Text PDFs use pdf-parse on the server, at most twenty pages. Split longer documents to avoid unnoticed omissions. The app displays the processed pages.

Technical references: [pdf-parse](https://github.com/greenforceai/pdf-parse/blob/main/README.md), [Tesseract.js API](https://github.com/naptha/tesseract.js/blob/master/docs/api.md).
