import express from "express";
import session from "express-session";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { initDb } from "./db/index.js";
import {
  addPurchase,
  addUser,
  getItemById,
  getItems,
  getUserByEmail,
  type ItemRow,
  type PurchaseRow,
  type UserRow
} from "./db/repositories.js";
import { authorizePayment } from "./services/payments.js";

type CartLine = {
  itemId: number;
  quantity: number;
};

type CheckoutOrderLine = {
  item: ItemRow;
  quantity: number;
  lineTotal: number;
};

type CheckoutSummary = {
  user: UserRow;
  purchases: PurchaseRow[];
  total: number;
};

declare module "express-session" {
  interface SessionData {
    cart?: CartLine[];
    confirmation?: CheckoutSummary;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = fileURLToPath(new URL(".", import.meta.url));

initDb();

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.set("view engine", "ejs");
app.set("views", join(__dirname, "views"));

app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    secret: process.env.SESSION_SECRET ?? "sales-demo-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 4
    }
  })
);
app.use(express.static(join(__dirname, "public")));

function getCart(sessionCart: CartLine[] | undefined): CartLine[] {
  if (!Array.isArray(sessionCart)) {
    return [];
  }

  return sessionCart.filter((line) => Number.isInteger(line.itemId) && Number.isInteger(line.quantity) && line.quantity > 0);
}

function buildOrderLines(cart: CartLine[]): CheckoutOrderLine[] {
  return cart
    .map((line) => {
      const item = getItemById(line.itemId);
      if (!item) {
        return null;
      }

      return {
        item,
        quantity: line.quantity,
        lineTotal: Number((item.price * line.quantity).toFixed(2))
      };
    })
    .filter((line): line is CheckoutOrderLine => line !== null);
}

function sumLines(lines: CheckoutOrderLine[]): number {
  return Number(lines.reduce((total, line) => total + line.lineTotal, 0).toFixed(2));
}

app.get("/", (_req, res) => {
  res.redirect("/store");
});

app.get("/store", (req, res) => {
  const items = getItems();
  const cart = getCart(req.session.cart);
  const cartCount = cart.reduce((acc, line) => acc + line.quantity, 0);

  res.render("store", {
    title: "Minimalist Store",
    items,
    cartCount
  });
});

app.post("/cart/add", (req, res) => {
  const itemId = Number(req.body.itemId);
  const quantity = Number(req.body.quantity);

  if (!Number.isInteger(itemId) || !Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).send("Invalid item or quantity");
  }

  if (!getItemById(itemId)) {
    return res.status(404).send("Item not found");
  }

  const cart = getCart(req.session.cart);
  const existing = cart.find((line) => line.itemId === itemId);

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ itemId, quantity });
  }

  req.session.cart = cart;
  return res.redirect("/cart");
});

app.get("/cart", (req, res) => {
  const cart = getCart(req.session.cart);
  const lines = buildOrderLines(cart);

  res.render("cart", {
    title: "Your Cart",
    lines,
    total: sumLines(lines)
  });
});

app.post("/cart/remove", (req, res) => {
  const itemId = Number(req.body.itemId);

  if (!Number.isInteger(itemId)) {
    return res.status(400).send("Invalid item");
  }

  req.session.cart = getCart(req.session.cart).filter((line) => line.itemId !== itemId);
  return res.redirect("/cart");
});

app.get("/checkout", (req, res) => {
  const cart = getCart(req.session.cart);
  const lines = buildOrderLines(cart);

  if (lines.length === 0) {
    return res.redirect("/store");
  }

  res.render("checkout", {
    title: "Checkout",
    lines,
    total: sumLines(lines)
  });
});

app.post("/checkout", (req, res) => {
  const name = String(req.body.name ?? "").trim();
  const email = String(req.body.email ?? "").trim().toLowerCase();
  const cart = getCart(req.session.cart);
  const lines = buildOrderLines(cart);

  if (!name || !email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).send("Name and valid email are required");
  }

  if (lines.length === 0) {
    return res.status(400).send("Cart is empty");
  }

  const user = getUserByEmail(email) ?? addUser(name, email);
  const purchases: PurchaseRow[] = [];

  for (const line of lines) {
    const payment = authorizePayment({
      amount: line.lineTotal,
      reference: `web_user_${user.id}_item_${line.item.id}_${Date.now()}`
    });

    purchases.push(
      addPurchase({
        userId: user.id,
        itemId: line.item.id,
        quantity: line.quantity,
        total: line.lineTotal,
        paymentId: payment.id
      })
    );
  }

  req.session.cart = [];
  req.session.confirmation = {
    user,
    purchases,
    total: sumLines(lines)
  };

  return res.redirect("/confirmation");
});

app.get("/confirmation", (req, res) => {
  const confirmation = req.session.confirmation;
  if (!confirmation) {
    return res.redirect("/store");
  }

  const itemMap = new Map(getItems().map((item) => [item.id, item]));
  const detailedPurchases = confirmation.purchases.map((purchase) => ({
    purchase,
    item: itemMap.get(purchase.item_id)
  }));

  res.render("confirmation", {
    title: "Order Confirmed",
    user: confirmation.user,
    purchases: detailedPurchases,
    total: confirmation.total
  });
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Store running at http://localhost:${port}`);
});
// Flip the script.. Start with the store then move to MCP... 