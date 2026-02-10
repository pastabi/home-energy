import path from "node:path";
import { readDataFromFile, writeDataToFile } from "../utils.js";

// ----- TYPES START -----
type User = {
  username: string;
  chatId: number;
};
type UserStorage = {
  users: User[];
};
// ----- TYPES END -----

const storageFileName = "telegram-users.json";
const storageLocation = path.resolve(import.meta.dirname, storageFileName);

export async function addUser(user: User): Promise<void> {
  let userStorage = await readDataFromFile<UserStorage>(storageLocation);
  if (!userStorage || !userStorage.users) {
    userStorage = { users: [] };
  }
  userStorage.users = userStorage.users.filter(
    (existingUser) => existingUser.chatId !== user.chatId,
  );
  userStorage.users.push(user);
  await writeDataToFile(storageLocation, userStorage);
}

export async function getAllUsers(): Promise<User[]> {
  let userStorage = await readDataFromFile<UserStorage>(storageLocation);
  if (!userStorage || !userStorage.users) {
    userStorage = { users: [] };
  }
  return userStorage.users;
}

export async function deleteUser(chatId: number): Promise<void> {
  let userStorage = await readDataFromFile<UserStorage>(storageLocation);
  if (!userStorage || !userStorage.users) {
    userStorage = { users: [] };
  }
  userStorage.users = userStorage.users.filter((user) => user.chatId !== chatId);

  await writeDataToFile(storageLocation, userStorage);
}
