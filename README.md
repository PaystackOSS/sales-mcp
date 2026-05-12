# sales-mcp

Simple TypeScript MCP server for sales operations with a SQLite backend, plus a local minimalist ecommerce storefront.

## What it includes

- users tool: fetch and add users
- items tool: fetch and add items (supports image URLs)
- purchases tool: fetch and add purchases
- simple payment authorization service (local stub)
- local Express + EJS store UI with cart and checkout

## Project structure

- server.ts
- web-server.ts
- tools/users.ts
- tools/items.ts
- tools/purchases.ts
- services/payments.ts
- db/index.ts
- db/repositories.ts
- views/*.ejs
- public/styles.css

## Run

1. Install dependencies:

   npm install

2. Run MCP server in development mode:

   npm run dev

3. Run local web store:

  npm run web-dev

4. Build:

   npm run build

## Demo flow

- Open http://localhost:3000/store for the local storefront.
- Add items with quantity to cart, then checkout using name and email.
- Keep MCP server and web store running in separate terminals to demo both AI and user storefront access against the same SQLite database.

## Tool inputs

### users

- Fetch users:

  { "action": "fetch" }

- Add user:

  { "action": "add", "name": "Ada Lovelace", "email": "ada@example.com" }

### items

- Fetch items:

  { "action": "fetch" }

- Add item:

  { "action": "add", "name": "Keyboard", "price": 99.99, "imageUrl": "https://example.com/keyboard.jpg" }

### purchases

- Fetch purchases:

  { "action": "fetch" }

- Add purchase:

  { "action": "add", "userId": 1, "itemId": 1, "quantity": 2 }

## Database location

By default the SQLite database is created at `db/sales.sqlite`, resolved relative to the running `db/index.js` module. This means the MCP server and the web server can end up reading different files depending on how they are launched (e.g. `tsx` from source vs `node dist/server.js` from the build output, or an MCP client launching the server from a different working directory).

To guarantee both processes share the same database, set the `SALES_DB_PATH` environment variable to an absolute path in every place that launches the server.

Shell (web server, dev MCP server, inspector):

```sh
export SALES_DB_PATH="/absolute/path/to/sales-mcp/db/sales.sqlite"
npm run web-dev
# or
npm run dev
# or
SALES_DB_PATH="/absolute/path/to/sales-mcp/db/sales.sqlite" npm run inspect
```

Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "sales-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/sales-mcp/dist/server.js"],
      "env": {
        "SALES_DB_PATH": "/absolute/path/to/sales-mcp/db/sales.sqlite"
      }
    }
  }
}
```

VS Code (`mcp.json`):

```json
{
  "servers": {
    "sales-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/sales-mcp/dist/server.js"],
      "env": {
        "SALES_DB_PATH": "/absolute/path/to/sales-mcp/db/sales.sqlite"
      }
    }
  }
}
```

After changing the env var you must fully restart the MCP client (or use its "Restart Server" command) so the server process is respawned with the new value.

## Notes

- SQLite database file defaults to `db/sales.sqlite`; override with `SALES_DB_PATH` (see above).
- Purchase creation validates user and item, then authorizes payment before insert.
- On first run, sample items are seeded with image URLs if the items table is empty.
