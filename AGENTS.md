<!-- BEGIN:nextjs-agent-rules -->
# Next.js App Router Rules

1. This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
2. **NEVER import components or utilities from a `page.tsx` file** (e.g., `import ... from '../login/page'`). `page.tsx` files in `src/app/` are strict route entry points. Always place shared components (like `AuthPortal`) in `src/components/` and import them from there.
<!-- END:nextjs-agent-rules -->

