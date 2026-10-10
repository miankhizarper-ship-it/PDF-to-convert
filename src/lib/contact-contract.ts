import type { ContactErrors } from "./validation";

/**
 * Shared contract between `POST /api/contact` and the browser form, so the UI
 * can type its response handling without duplicating shapes.
 */

export const CONTACT_ENDPOINT = "/api/contact";

export type ContactSuccess = {
  ok: true;
  /** False when the submission was logged but not written to MongoDB (dev without a URI). */
  persisted: boolean;
  id?: string;
  receivedAt: string;
};

export type ContactFailure = {
  ok: false;
  error: string;
  fieldErrors?: ContactErrors;
  retryAfterMs?: number;
};

export type ContactResponse = ContactSuccess | ContactFailure;

/** Payload the browser sends. `token` and `website` are anti-spam fields. */
export type ContactPayload = {
  name: unknown;
  email: unknown;
  subject: unknown;
  message: unknown;
  projectType: unknown;
  budget: unknown;
  timeline: unknown;
  /** Honeypot: rendered off-screen, must remain empty. */
  website: unknown;
  /** HMAC-signed issue timestamp rendered by the server component. */
  token: unknown;
};
