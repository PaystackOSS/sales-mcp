import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { initDb } from "./db/index.js";
import { getItemById, getItems, getPurchases, getUsers } from "./db/repositories.js";
import { itemsTool } from "./tools/items.js";
import { purchasesTool } from "./tools/purchases.js";
import { usersTool } from "./tools/users.js";

initDb();

const server = new McpServer({
  name: "sales-mcp",
  version: "0.1.0"
});

const usersSchema = {
  action: z.enum(["fetch", "add"]),
  name: z.string().optional(),
  email: z.string().email().optional()
};

const itemsSchema = {
  action: z.enum(["fetch", "add"]),
  name: z.string().optional(),
  price: z.number().optional(),
  imageUrl: z.string().url().optional()
};

const purchasesSchema = {
  action: z.enum(["fetch", "add"]),
  userId: z.number().int().optional(),
  itemId: z.number().int().optional(),
  quantity: z.number().int().optional()
};

server.registerTool(
  "users",
  {
    description: "Fetch users or add a new user",
    inputSchema: usersSchema
  },
  async (args: { action: "fetch" | "add"; name?: string; email?: string }) => {
    try {
      const data = await usersTool(args);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown users tool error";
      return { content: [{ type: "text", text: JSON.stringify({ error: message }) }], isError: true };
    }
  }
);

server.registerTool(
  "items",
  {
    description: "Fetch items or add a new item",
    inputSchema: itemsSchema
  },
  async (args: { action: "fetch" | "add"; name?: string; price?: number; imageUrl?: string }) => {
    try {
      const data = await itemsTool(args);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown items tool error";
      return { content: [{ type: "text", text: JSON.stringify({ error: message }) }], isError: true };
    }
  }
);

server.registerTool(
  "purchases",
  {
    description: "Fetch purchases or add a new purchase",
    inputSchema: purchasesSchema
  },
  async (args: {
    action: "fetch" | "add";
    userId?: number;
    itemId?: number;
    quantity?: number;
  }) => {
    try {
      const data = await purchasesTool(args);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown purchases tool error";
      return { content: [{ type: "text", text: JSON.stringify({ error: message }) }], isError: true };
    }
  }
);

server.registerResource(
  "users",
  "sales://users",
  {
    title: "All users",
    description: "List of every registered user in the sales database (JSON).",
    mimeType: "application/json"
  },
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify({ users: getUsers() }, null, 2)
      }
    ]
  })
);

server.registerResource(
  "items",
  "sales://items",
  {
    title: "Item catalog",
    description: "Full catalog of items available for purchase (JSON).",
    mimeType: "application/json"
  },
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify({ items: getItems() }, null, 2)
      }
    ]
  })
);

server.registerResource(
  "purchases",
  "sales://purchases",
  {
    title: "All purchases",
    description: "Every purchase recorded in the sales database (JSON).",
    mimeType: "application/json"
  },
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify({ purchases: getPurchases() }, null, 2)
      }
    ]
  })
);

server.registerResource(
  "item",
  new ResourceTemplate("sales://items/{id}", { list: undefined }),
  {
    title: "Item by id",
    description: "Fetch a single item by its numeric id, e.g. sales://items/1 (JSON).",
    mimeType: "application/json"
  },
  async (uri, { id }) => {
    const itemId = Number(Array.isArray(id) ? id[0] : id);
    if (!Number.isInteger(itemId)) {
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify({ error: "id must be an integer" })
          }
        ]
      };
    }

    const item = getItemById(itemId);
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(item ?? { error: "item not found", id: itemId }, null, 2)
        }
      ]
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
