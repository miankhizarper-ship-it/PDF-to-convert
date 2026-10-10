import type { Metadata } from "next";
import { TriangleAlert } from "lucide-react";
import { site } from "@/data";
import { buildMetadata } from "@/lib/seo";
import { createFormToken } from "@/lib/security";
import { ContactForm } from "@/components/sections/ContactForm";
import { ContactPanel } from "@/components/sections/ContactPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/ui/Reveal";

/**
 * The form token is signed per request with a server-side secret, so this route
 * is always rendered dynamically — never cached or statically prerendered.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Contact",
  description: `Start a transmission — send ${site.name} a message about a project, a role or a collaboration. Validated, rate limited and stored server-side.`,
  path: "/contact",
  keywords: ["contact developer", "hire full-stack developer", "freelance developer contact"],
});

export default function ContactPage() {
  const secret = process.env.CONTACT_FORM_SECRET;
  const token = secret ? createFormToken(secret) : null;

  return (
    <>
      <PageHeader
        index="07"
        eyebrow="TRANSMISSION CHANNEL"
        title="CONTACT"
        description="Tell me what you're building — the constraints, the deadline and the part that feels hard. Messages go straight to a MongoDB collection through a validated, rate-limited API route."
        meta={["Replies within 48h", "No newsletter, no CRM", "Freelance · contract · full-time"]}
      />

      <section
        aria-label="Contact form"
        id="availability"
        className="relative mx-auto w-full max-w-[1440px] scroll-mt-28 px-5 pb-24 lg:px-10 lg:pb-32"
      >
        <div className="grid items-start gap-6 lg:grid-cols-[1.12fr_0.88fr] lg:gap-8">
          <Reveal y={26}>
            {token ? (
              <ContactForm token={token} />
            ) : (
              <div className="panel panel-flat p-8" role="alert">
                <span className="flex h-12 w-12 items-center justify-center border border-acid/45 bg-acid/10 text-acid">
                  <TriangleAlert className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </span>
                <h2 className="mt-6 font-display text-2xl font-bold tracking-tight uppercase">Form not configured</h2>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-ash">
                  <span className="font-mono text-frost">CONTACT_FORM_SECRET</span> is missing, so the
                  anti-spam token cannot be signed and the form is disabled rather than silently
                  dropping messages.
                </p>
                <ol className="mt-6 space-y-2 font-mono text-[0.6875rem] text-ash">
                  <li>1 · copy <span className="text-frost">.env.example</span> to <span className="text-frost">.env.local</span></li>
                  <li>2 · set <span className="text-frost">CONTACT_FORM_SECRET</span> to a long random string</li>
                  <li>3 · add <span className="text-frost">MONGODB_URI</span> to store submissions</li>
                  <li>4 · restart the dev server</li>
                </ol>
                <p className="mt-6 border-t border-edge/70 pt-5 text-sm text-ash">
                  In the meantime, email{" "}
                  <a href={`mailto:${site.email}`} className="text-acid underline decoration-acid/40 underline-offset-4">
                    {site.email}
                  </a>
                  .
                </p>
              </div>
            )}
          </Reveal>

          <ContactPanel />
        </div>
      </section>
    </>
  );
}
