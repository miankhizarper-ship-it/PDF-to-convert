"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, LoaderCircle, Send, TriangleAlert } from "lucide-react";
import {
  BUDGETS,
  CONTACT_ENDPOINT,
  LIMITS,
  PROJECT_TYPES,
  TIMELINES,
  emptyContactValues,
  validateContact,
  type ContactErrors,
  type ContactResponse,
  type ContactValues,
} from "@/lib/contact-form-shared";
import { Button } from "@/components/ui/NeonButton";
import { cn } from "@/lib/utils";

type Status = "idle" | "submitting" | "success" | "error";

type ContactFormProps = {
  /** HMAC-signed issue timestamp, rendered server-side. */
  token: string;
};

type FieldName = "name" | "email" | "subject" | "message" | "projectType" | "budget" | "timeline";

/**
 * Contact form with client validation, honeypot, cooldown after rate limiting,
 * and explicit loading / success / error states. The signed token proves the
 * form was served by this server; the secret never reaches the browser.
 */
export function ContactForm({ token }: ContactFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  const [values, setValues] = useState<ContactValues>(emptyContactValues);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  const [persisted, setPersisted] = useState(true);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);

  /* Rate-limit cooldown ticker. */
  useEffect(() => {
    if (cooldownUntil === null) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) setCooldownUntil(null);
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [cooldownUntil]);

  const setValue = <K extends keyof ContactValues>(key: K, value: ContactValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    if (errors[key as keyof ContactErrors]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[key as keyof ContactErrors];
        return next;
      });
    }
  };

  const remainingChars = useMemo(() => LIMITS.message.max - values.message.length, [values.message.length]);

  const validateField = (field: FieldName) => {
    const { errors: fieldErrors } = validateContact(values);
    setErrors((current) => ({ ...current, [field]: fieldErrors[field] }));
    setTouched((current) => ({ ...current, [field]: true }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "submitting" || cooldownUntil !== null) return;

    const { errors: fieldErrors, valid } = validateContact(values);
    setErrors(fieldErrors);
    setTouched({ name: true, email: true, subject: true, message: true });

    if (!valid) {
      setStatus("error");
      setServerError("Check the highlighted fields and send again.");
      const firstInvalid = (Object.keys(fieldErrors)[0] ?? null) as FieldName | null;
      if (firstInvalid) formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    setStatus("submitting");
    setServerError(null);

    try {
      const response = await fetch(CONTACT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, token }),
      });

      const data = (await response.json()) as ContactResponse;

      if (data.ok) {
        setStatus("success");
        setPersisted(data.persisted);
        window.requestAnimationFrame(() => statusRef.current?.focus());
        return;
      }

      setStatus("error");
      setServerError(data.error);
      if (data.fieldErrors) setErrors(data.fieldErrors);
      if (response.status === 429 && data.retryAfterMs) setCooldownUntil(Date.now() + data.retryAfterMs);
    } catch {
      setStatus("error");
      setServerError("Could not reach the server. Check your connection and try again.");
    }
  };

  const reset = () => {
    setValues(emptyContactValues);
    setErrors({});
    setTouched({});
    setStatus("idle");
    setServerError(null);
    setPersisted(true);
  };

  /* ── success state ─────────────────────────────────────────── */
  if (status === "success") {
    return (
      <div
        ref={statusRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className="panel panel-flat flex flex-col items-start gap-6 p-8 focus:outline-none lg:p-10"
      >
        <span className="flex h-14 w-14 items-center justify-center border border-volt/45 bg-volt/10 text-volt">
          <Check className="h-6 w-6" strokeWidth={2} aria-hidden />
        </span>

        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight uppercase">Transmission received</h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-ash">
            Thanks for reaching out — your message is in the queue. I read everything myself and reply
            within 48 hours, usually much sooner.
          </p>
          {!persisted ? (
            <p className="mt-4 border-l-2 border-acid/60 pl-4 font-mono text-[0.6875rem] leading-relaxed text-acid">
              Notice: no MONGODB_URI is configured on this server, so your message was logged to the
              server console rather than stored in the database. Nothing was lost, but add a
              connection string in <span className="text-frost">.env.local</span> to persist
              submissions.
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="ghost" onClick={reset}>
            Send another message
          </Button>
        </div>
      </div>
    );
  }

  /* ── form state ────────────────────────────────────────────── */
  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="panel panel-flat p-6 sm:p-8 lg:p-10">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-edge/70 pb-6">
        <h2 className="font-display text-2xl font-bold tracking-tight uppercase">Send a message</h2>
        <p className="hud text-[0.5625rem] text-ash/70">ENCRYPTED IN TRANSIT · NO TRACKERS</p>
      </div>

      {/* Honeypot — visually hidden, unfocusable, must stay empty */}
      <div aria-hidden className="absolute h-0 w-0 overflow-hidden opacity-0">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={(event) => setValue("website", event.target.value)}
        />
      </div>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <TextField
          label="Name"
          name="name"
          value={values.name}
          error={errors.name}
          touched={Boolean(touched.name)}
          placeholder="Ada Lovelace"
          autoComplete="name"
          required
          onChange={(value) => setValue("name", value)}
          onBlur={() => validateField("name")}
        />

        <TextField
          label="Email"
          name="email"
          type="email"
          value={values.email}
          error={errors.email}
          touched={Boolean(touched.email)}
          placeholder="you@company.com"
          autoComplete="email"
          required
          onChange={(value) => setValue("email", value)}
          onBlur={() => validateField("email")}
        />
      </div>

      <div className="mt-5">
        <TextField
          label="Subject"
          name="subject"
          value={values.subject}
          error={errors.subject}
          touched={Boolean(touched.subject)}
          placeholder="Project enquiry — orbital dashboard"
          required
          onChange={(value) => setValue("subject", value)}
          onBlur={() => validateField("subject")}
        />
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-3">
        <SelectField
          label="Project type"
          name="projectType"
          value={values.projectType}
          options={PROJECT_TYPES as readonly string[]}
          onChange={(value) => setValue("projectType", value as ContactValues["projectType"])}
        />
        <SelectField
          label="Budget"
          name="budget"
          value={values.budget}
          options={BUDGETS as readonly string[]}
          onChange={(value) => setValue("budget", value as ContactValues["budget"])}
        />
        <SelectField
          label="Timeline"
          name="timeline"
          value={values.timeline}
          options={TIMELINES as readonly string[]}
          onChange={(value) => setValue("timeline", value as ContactValues["timeline"])}
        />
      </div>

      <div className="mt-5">
        <div className="flex items-baseline justify-between gap-4">
          <label htmlFor="message" className="hud text-[0.5625rem] text-ash">
            MESSAGE <span className="text-acid">*</span>
          </label>
          <span
            className={cn(
              "font-mono text-[0.625rem]",
              remainingChars < 0 ? "text-[#ff8f8f]" : remainingChars < 200 ? "text-acid" : "text-ash/60",
            )}
          >
            {values.message.length}/{LIMITS.message.max}
          </span>
        </div>
        <textarea
          id="message"
          name="message"
          rows={7}
          required
          minLength={LIMITS.message.min}
          maxLength={LIMITS.message.max + 200}
          placeholder="What are you building, what's the deadline, and which part feels hard?"
          value={values.message}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "message-error" : "message-hint"}
          onChange={(event) => setValue("message", event.target.value)}
          onBlur={() => validateField("message")}
          className="field mt-2.5 resize-y font-sans leading-relaxed"
        />
        {errors.message ? (
          <p id="message-error" className="field-error mt-2">
            {errors.message}
          </p>
        ) : (
          <p id="message-hint" className="mt-2 font-mono text-[0.625rem] text-ash/60">
            Minimum {LIMITS.message.min} characters. Plain text only — markup is rejected server-side.
          </p>
        )}
      </div>

      {/* Server / network error */}
      {serverError ? (
        <div
          role="alert"
          className="mt-6 flex items-start gap-3 border border-[#ff6b6b]/40 bg-[#ff6b6b]/8 px-4 py-3.5"
        >
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#ff8f8f]" strokeWidth={1.75} aria-hidden />
          <p className="font-mono text-[0.6875rem] leading-relaxed text-[#ffdede]">{serverError}</p>
        </div>
      ) : null}

      <div className="mt-8 flex flex-col gap-4 border-t border-edge/70 pt-7 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="submit"
          disabled={status === "submitting" || cooldownUntil !== null}
          aria-disabled={status === "submitting" || cooldownUntil !== null}
          icon={
            status === "submitting" ? (
              <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2} aria-hidden />
            ) : (
              <Send className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            )
          }
        >
          {status === "submitting" ? "Transmitting…" : cooldownUntil !== null ? `Wait ${remaining}s` : "Send message"}
        </Button>

        <p className="hud max-w-xs text-[0.5625rem] leading-relaxed text-ash/60">
          Rate limited to a few messages per visit. Fields marked <span className="text-acid">*</span> are required.
        </p>
      </div>

      <p aria-live="polite" className="sr-only">
        {status === "submitting" ? "Sending your message" : status === "error" ? (serverError ?? "Message not sent") : ""}
      </p>
    </form>
  );
}

/* ── field primitives ─────────────────────────────────────────── */

type TextFieldProps = {
  label: string;
  name: FieldName;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string;
  touched?: boolean;
  type?: "text" | "email";
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
};

function TextField({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  touched,
  type = "text",
  placeholder,
  autoComplete,
  required,
}: TextFieldProps) {
  const errorId = `${name}-error`;
  const showError = Boolean(error) && Boolean(touched);

  return (
    <div>
      <label htmlFor={name} className="hud text-[0.5625rem] text-ash">
        {label} {required ? <span className="text-acid">*</span> : null}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={showError}
        aria-describedby={showError ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        className="field mt-2.5"
      />
      {showError ? (
        <p id={errorId} className="field-error mt-2">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type SelectFieldProps = {
  label: string;
  name: FieldName;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
};

function SelectField({ label, name, value, options, onChange }: SelectFieldProps) {
  return (
    <div>
      <label htmlFor={name} className="hud text-[0.5625rem] text-ash">
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="field mt-2.5 appearance-none pr-10"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23A1A1AA' stroke-width='1.4' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 1rem center",
        }}
      >
        <option value="">Optional</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
