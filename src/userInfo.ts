import fs from "fs";
import path from "path";

const filePath = path.join(__dirname, "info.json");

interface UserInfo {
  lat: number;
  lon: number;
  time: string;
}

export function getUserInfo(): UserInfo {
  const dataFromFile = fs.readFileSync(filePath, "utf8");
  return JSON.parse(dataFromFile);
}

export function updateUserInfo(userInfo: Partial<UserInfo>) {
  const nextUserInfo = { ...getUserInfo(), ...userInfo };
  fs.writeFileSync(filePath, JSON.stringify(nextUserInfo, null, 2), "utf8");
}
