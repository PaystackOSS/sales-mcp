import { db } from "./index.js";

export type UserRow = {
  id: number;
  name: string;
  email: string;
  created_at: string;
};

export type ItemRow = {
  id: number;
  name: string;
  price: number;
  image_url: string | null;
  created_at: string;
};

export type PurchaseRow = {
  id: number;
  user_id: number;
  item_id: number;
  quantity: number;
  total: number;
  payment_id: string;
  created_at: string;
};

export function getUsers(): UserRow[] {
  return db.prepare("SELECT id, name, email, created_at FROM users ORDER BY id DESC").all() as UserRow[];
}

export function addUser(name: string, email: string): UserRow {
  const stmt = db.prepare("INSERT INTO users (name, email) VALUES (?, ?)");
  const result = stmt.run(name, email);

  return db
    .prepare("SELECT id, name, email, created_at FROM users WHERE id = ?")
    .get(result.lastInsertRowid) as UserRow;
}

export function getUserByEmail(email: string): UserRow | undefined {
  return db.prepare("SELECT id, name, email, created_at FROM users WHERE email = ?").get(email) as
    | UserRow
    | undefined;
}

export function getItems(): ItemRow[] {
  return db
    .prepare("SELECT id, name, price, image_url, created_at FROM items ORDER BY id DESC")
    .all() as ItemRow[];
}

export function addItem(name: string, price: number, imageUrl?: string | null): ItemRow {
  const stmt = db.prepare("INSERT INTO items (name, price, image_url) VALUES (?, ?, ?)");
  const result = stmt.run(name, price, imageUrl ?? null);

  return db
    .prepare("SELECT id, name, price, image_url, created_at FROM items WHERE id = ?")
    .get(result.lastInsertRowid) as ItemRow;
}

export function getPurchases(): PurchaseRow[] {
  return db
    .prepare(
      "SELECT id, user_id, item_id, quantity, total, payment_id, created_at FROM purchases ORDER BY id DESC"
    )
    .all() as PurchaseRow[];
}

export function addPurchase(input: {
  userId: number;
  itemId: number;
  quantity: number;
  total: number;
  paymentId: string;
}): PurchaseRow {
  const stmt = db.prepare(
    "INSERT INTO purchases (user_id, item_id, quantity, total, payment_id) VALUES (?, ?, ?, ?, ?)"
  );
  const result = stmt.run(input.userId, input.itemId, input.quantity, input.total, input.paymentId);

  return db
    .prepare(
      "SELECT id, user_id, item_id, quantity, total, payment_id, created_at FROM purchases WHERE id = ?"
    )
    .get(result.lastInsertRowid) as PurchaseRow;
}

export function getItemById(itemId: number): ItemRow | undefined {
  return db.prepare("SELECT id, name, price, image_url, created_at FROM items WHERE id = ?").get(itemId) as
    | ItemRow
    | undefined;
}

export function userExists(userId: number): boolean {
  const row = db.prepare("SELECT 1 as found FROM users WHERE id = ?").get(userId) as { found: number } | undefined;
  return Boolean(row?.found);
}
