import { randomBytes } from "node:crypto";

export function createPublicUserId() {
  return `WM-${randomBytes(6).toString("hex").toUpperCase()}`;
}
