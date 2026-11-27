/**
 * Sukoon AI — Sensitive Information Filter for Memory Vault
 *
 * Prevents accidental or automatic storage of high-risk sensitive data
 * in the memory vault, such as financial numbers, national ID numbers,
 * authentication credentials, and API secrets.
 */

export interface SensitiveScanResult {
  hasSensitiveData: boolean;
  detectedTypes: string[];
  reasons: string[];
}

export function scanSensitiveContent(text: string): SensitiveScanResult {
  const detectedTypes: string[] = [];
  const reasons: string[] = [];

  if (!text || text.trim().length === 0) {
    return { hasSensitiveData: false, detectedTypes: [], reasons: [] };
  }

  // 1. Credit Card / Debit Card Numbers (13 to 19 digits with optional hyphens/spaces)
  const creditCardPattern =
    /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9]{2})[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11}|[0-9]{4}[-\s]?[0-9]{4}[-\s]?[0-9]{4}[-\s]?[0-9]{4})\b/;
  if (creditCardPattern.test(text)) {
    detectedTypes.push("financial_card");
    reasons.push("Payment card or credit/debit card numbers cannot be stored in memories.");
  }

  // 2. Bank Account / IBAN / UPI PINs / CVV
  const cvvPattern = /\b(?:cvv|cvc|security code)(?:\s+is|[\s:=]+)\s*[0-9]{3,4}\b/i;
  const pinPattern = /\b(?:atm pin|upi pin|bank pin|pin)(?:\s+is|[\s:=]+)\s*[0-9]{4,6}\b/i;
  if (cvvPattern.test(text) || pinPattern.test(text)) {
    detectedTypes.push("financial_auth");
    reasons.push("Banking PINs and CVV security codes cannot be saved.");
  }

  // 3. Indian Aadhaar Number (12 digits, often formatted as 4-4-4)
  const aadhaarPattern = /\b[2-9]{1}[0-9]{3}[\s-]?[0-9]{4}[\s-]?[0-9]{4}\b/;
  if (aadhaarPattern.test(text)) {
    // Check if context hints at Aadhaar or national identity
    if (/aadhaar|aadhar|uidai|identity number|id number/i.test(text) || !text.includes(" ")) {
      detectedTypes.push("national_id_aadhaar");
      reasons.push("Aadhaar or national identification numbers cannot be stored.");
    }
  }

  // 4. Indian PAN Card Number (5 letters, 4 digits, 1 letter)
  const panPattern = /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/i;
  if (panPattern.test(text)) {
    detectedTypes.push("national_id_pan");
    reasons.push("Income Tax PAN numbers cannot be stored.");
  }

  // 5. Passwords / Auth Secrets / API Keys
  const passwordPattern =
    /\b(?:password|passwd|pwd|secret key|access_token|bearer token)(?:\s+is|[\s:=]+)\s*[^\s]{4,}\b/i;
  const apiKeyPattern =
    /\b(?:sk-[a-zA-Z0-9_.-]{20,}|ghp_[a-zA-Z0-9]{20,}|eyJh[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)\b/;
  if (passwordPattern.test(text) || apiKeyPattern.test(text)) {
    detectedTypes.push("credentials");
    reasons.push("Passwords, API keys, and security credentials cannot be saved.");
  }

  return {
    hasSensitiveData: detectedTypes.length > 0,
    detectedTypes,
    reasons,
  };
}
