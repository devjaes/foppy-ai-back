import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const bunPasswordApi =
  typeof globalThis !== "undefined" &&
  typeof (globalThis as any).Bun?.password?.hash === "function" &&
  typeof (globalThis as any).Bun?.password?.verify === "function"
    ? (globalThis as any).Bun.password
    : null;

const hashWithNodeCrypto = (password: string): string => {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
};

const verifyWithNodeCrypto = (password: string, hashedValue: string): boolean => {
  const [salt, storedKey] = hashedValue.split(":");
  if (!salt || !storedKey) {
    return false;
  }

  const derivedKey = scryptSync(password, salt, 64);
  const storedKeyBuffer = Buffer.from(storedKey, "hex");

  if (derivedKey.length !== storedKeyBuffer.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, storedKeyBuffer);
};

export const hash = async (password: string): Promise<string> => {
  if (bunPasswordApi) {
    return bunPasswordApi.hash(password);
  }

  return hashWithNodeCrypto(password);
};

export const verify = async (
  password: string,
  hashedValue: string
): Promise<boolean> => {
  if (bunPasswordApi) {
    return bunPasswordApi.verify(password, hashedValue);
  }

  try {
    return verifyWithNodeCrypto(password, hashedValue);
  } catch {
    return false;
  }
};
