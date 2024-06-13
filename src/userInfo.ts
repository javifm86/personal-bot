import fs from "fs";
import path from "path";

const filePath = path.join(__dirname, "info.json");

interface UserInfo {
  lat: string;
  lon: string;
  time: string;
}

export function getUserInfo(): UserInfo {
  const dataFromFile = fs.readFileSync(filePath, "utf8");
  return JSON.parse(dataFromFile);
}

export function updateUserInfo(userInfo: UserInfo) {
  fs.writeFileSync(filePath, JSON.stringify(userInfo, null, 2), "utf8");
}
