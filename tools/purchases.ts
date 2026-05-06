import { addPurchase, getItemById, getPurchases, userExists } from "../db/repositories.js";
import { authorizePayment } from "../services/payments.js";

type PurchasesArgs = {
  action: "fetch" | "add";
  userId?: number;
  itemId?: number;
  quantity?: number;
};

export async function purchasesTool(args: PurchasesArgs): Promise<unknown> {
  if (args.action === "fetch") {
    console.error("fetching purchases");
    return { purchases: getPurchases() };
  }

  if (!Number.isInteger(args.userId) || !Number.isInteger(args.itemId) || !Number.isInteger(args.quantity)) {
    throw new Error("userId, itemId, and quantity are required integers when action is add");
  }

  if ((args.quantity as number) <= 0) {
    throw new Error("quantity must be greater than 0");
  }

  if (!userExists(args.userId as number)) {
    throw new Error("user not found");
  }

  const item = getItemById(args.itemId as number);
  if (!item) {
    throw new Error("item not found");
  }

  const total = Number((item.price * (args.quantity as number)).toFixed(2));
  const payment = authorizePayment({
    amount: total,
    reference: `user_${args.userId}_item_${args.itemId}`
  });

  return {
    purchase: addPurchase({
      userId: args.userId as number,
      itemId: args.itemId as number,
      quantity: args.quantity as number,
      total,
      paymentId: payment.id
    }),
    payment
  };
}
