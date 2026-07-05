const USER_ID_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

export function isValidUserId(userId) {
  return typeof userId === "string" && USER_ID_PATTERN.test(userId);
}

export function normalizeUserId(userId) {
  return userId.trim().toLowerCase();
}

export const USER_ID_HELP_TEXT =
  "3-20 characters: letters, numbers, underscore (_) only.";
