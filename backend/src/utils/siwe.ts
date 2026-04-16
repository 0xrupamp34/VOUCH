import { SiweMessage } from "siwe";
import { config } from "../config/env";

export function createSiweMessage(wallet: string, nonce: string): string {
  const message = new SiweMessage({
    domain: config.siwe.domain,
    address: wallet,
    statement: config.siwe.statement,
    uri: `https://${config.siwe.domain}`,
    version: "1",
    chainId: config.blockchain.chainId,
    nonce,
    issuedAt: new Date().toISOString(),
    expirationTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });

  return message.prepareMessage();
}

export async function verifySignature(
  message: string,
  signature: string
): Promise<{ valid: boolean; address: string; error?: string }> {
  try {
    const siweMessage = new SiweMessage(message);

    const { data, success, error } = await siweMessage.verify({
      signature,
      domain: config.siwe.domain,
    });

    if (!success) {
      return { valid: false, address: "", error: error?.type || "Verification failed" };
    }

    if (data.expirationTime && new Date(data.expirationTime) < new Date()) {
      return { valid: false, address: data.address, error: "Message expired" };
    }

    return { valid: true, address: data.address };
  } catch (err) {
    return { valid: false, address: "", error: (err as Error).message };
  }
}

export function generateNonce(): string {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
