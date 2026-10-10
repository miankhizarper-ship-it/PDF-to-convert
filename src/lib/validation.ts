/**
 * Contact form contract. Isomorphic on purpose: the browser validates for
 * instant feedback, the API route validates again after sanitisation.
 * No Node-only imports here.
 */

export const LIMITS = {
  name: { min: 2, max: 80 },
  email: { max: 254 },
  subject: { min: 3, max: 120 },
  message: { min: 24, max: 2000 },
} as const;

export const PROJECT_TYPES = [
  "Website / Portfolio",
  "Web application",
  "Backend or API",
  "AI-powered feature",
  "3D / Creative build",
  "Something else",
] as const;

export const BUDGETS = ["Not sure yet", "Under $5k", "$5k – $15k", "$15k – $50k", "$50k+", "Just saying hello"] as const;

export const TIMELINES = ["ASAP", "1 – 3 months", "3 – 6 months", "Exploring"] as const;

export type ProjectType = (typeof PROJECT_TYPES)[number];
export type Budget = (typeof BUDGETS)[number];
export type Timeline = (typeof TIMELINES)[number];

export type ContactValues = {
  name: string;
  email: string;
  subject: string;
  message: string;
  projectType: ProjectType | "";
  budget: Budget | "";
  timeline: Timeline | "";
  /** Honeypot — must stay empty. Rendered off-screen, never filled by humans. */
  website: string;
};

export type ContactField = keyof Omit<ContactValues, "website">;
export type ContactErrors = Partial<Record<ContactField, string>>;

export const emptyContactValues: ContactValues = {
  name: "",
  email: "",
  subject: "",
  message: "",
  projectType: "",
  budget: "",
  timeline: "",
  website: "",
};

const EMAIL_RE = /^[^\s@,;:<>()[\]\\]+@[^\s@,;:<>()[\]\\]+\.[A-Za-z]{2,}$/;

/**
 * Validates already-sanitised values.
 * Returns field-keyed, human-readable messages suitable for `aria-describedby`.
 */
export function validateContact(values: Omit<ContactValues, "website">): {
  errors: ContactErrors;
  valid: boolean;
} {
  const errors: ContactErrors = {};

  const name = values.name.trim();
  if (name.length < LIMITS.name.min) errors.name = `Please enter at least ${LIMITS.name.min} characters.`;
  else if (name.length > LIMITS.name.max) errors.name = `Keep it under ${LIMITS.name.max} characters.`;

  const email = values.email.trim();
  if (!email) errors.email = "An email address is required so I can reply.";
  else if (email.length > LIMITS.email.max) errors.email = "That address is too long.";
  else if (!EMAIL_RE.test(email)) errors.email = "That doesn't look like a valid email address.";

  const subject = values.subject.trim();
  if (subject.length < LIMITS.subject.min) errors.subject = `Add a short subject (${LIMITS.subject.min}+ characters).`;
  else if (subject.length > LIMITS.subject.max) errors.subject = `Keep the subject under ${LIMITS.subject.max} characters.`;

  const message = values.message.trim();
  if (message.length < LIMITS.message.min) {
    errors.message = `A little more detail helps — ${LIMITS.message.min} characters minimum.`;
  } else if (message.length > LIMITS.message.max) {
    errors.message = `Please keep it under ${LIMITS.message.max} characters.`;
  }

  if (values.projectType && !PROJECT_TYPES.includes(values.projectType as ProjectType)) {
    errors.subject = "Please pick a valid project type.";
  }
  if (values.budget && !BUDGETS.includes(values.budget as Budget)) {
    errors.subject = "Please pick a valid budget range.";
  }
  if (values.timeline && !TIMELINES.includes(values.timeline as Timeline)) {
    errors.subject = "Please pick a valid timeline.";
  }

  return { errors, valid: Object.keys(errors).length === 0 };
}
