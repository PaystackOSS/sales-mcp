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

## Notes

- SQLite database file is created at db/sales.sqlite.
- Purchase creation validates user and item, then authorizes payment before insert.
- On first run, sample items are seeded with image URLs if the items table is empty.
