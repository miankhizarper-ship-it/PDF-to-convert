/**
 * Browser-safe subset of the contact contract + validation rules.
 *
 * Never re-export `./security` or `./mongodb` here: those pull in `node:crypto`
 * and the Mongo driver, which must not reach the client bundle.
 */
export * from "./validation";
export { CONTACT_ENDPOINT } from "./contact-contract";
export type { ContactFailure, ContactPayload, ContactResponse, ContactSuccess } from "./contact-contract";
