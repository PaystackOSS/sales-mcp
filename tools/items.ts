import { addItem, getItems } from "../db/repositories.js";

type ItemsArgs = {
  action: "fetch" | "add";
  name?: string;
  price?: number;
  imageUrl?: string;
};

export async function itemsTool(args: ItemsArgs): Promise<unknown> {
  if (args.action === "fetch") {
    return { items: getItems() };
  }

  if (!args.name || !Number.isFinite(args.price)) {
    throw new Error("name and price are required when action is add");
  }

  if ((args.price as number) < 0) {
    throw new Error("price must be >= 0");
  }

  const imageUrl = args.imageUrl?.trim();
  if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
    throw new Error("imageUrl must be an http or https URL");
  }

  return { item: addItem(args.name.trim(), Number(args.price), imageUrl || null) };
}
