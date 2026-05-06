import { addUser, getUsers } from "../db/repositories.js";

type UsersArgs = {
  action: "fetch" | "add";
  name?: string;
  email?: string;
};

export async function usersTool(args: UsersArgs): Promise<unknown> {
  if (args.action === "fetch") {
    return { users: getUsers() };
  }

  if (!args.name || !args.email) {
    throw new Error("name and email are required when action is add");
  }

  return { user: addUser(args.name.trim(), args.email.trim().toLowerCase()) };
}
