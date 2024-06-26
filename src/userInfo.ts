import { promises as fs } from "fs";
import path from "path";

const filePath = path.join(__dirname, "info.json");

interface UserInfo {
  lat: number;
  lon: number;
  time: string;
}

export async function getUserInfo(): Promise<UserInfo | null> {
  try {
    await fs.access(filePath);
    const dataFromFile = await fs.readFile(filePath, "utf8");
    return JSON.parse(dataFromFile);
  } catch (error) {
    return null;
  }
}

export async function updateUserInfo(userInfo: Partial<UserInfo>) {
  const currentUserInfo = await getUserInfo();
  const nextUserInfo = { ...currentUserInfo, ...userInfo };

  try {
    await fs.writeFile(filePath, JSON.stringify(nextUserInfo, null, 2), "utf8");
  } catch (error) {
    console.error("Failed to update user info:", error);
  }
}
