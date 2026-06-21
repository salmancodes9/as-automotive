import { OWNER_PHONE_DISPLAY, OWNER_PHONE_TEL, OWNER_WHATSAPP } from "@/lib/contact";

export function Footer() {
  return (
    <footer className="mt-16 bg-primary text-primary-foreground">
      <div className="mx-auto max-w-5xl px-5 py-10">
        <h3 className="text-lg font-bold tracking-wide">AS Automobiles</h3>
        <p className="mt-2 text-sm text-primary-foreground/80">
          Genuine Maruti Suzuki Parts &amp; Accessories
        </p>
        <p className="text-sm text-primary-foreground/80">
          Tengpora, Srinagar, Jammu &amp; Kashmir
        </p>

        <div className="mt-5 space-y-2 text-sm">
          <a
            href={`tel:${OWNER_PHONE_TEL}`}
            className="flex items-center gap-2 text-primary-foreground/90 hover:text-accent"
          >
            <span aria-hidden>📞</span> {OWNER_PHONE_DISPLAY}
          </a>
          <a
            href={`https://wa.me/${OWNER_WHATSAPP}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-primary-foreground/90 hover:text-accent"
          >
            <span aria-hidden>💬</span> WhatsApp {OWNER_PHONE_DISPLAY}
          </a>
          <a
            href="mailto:asautomobiles@gmail.com"
            className="flex items-center gap-2 text-primary-foreground/90 hover:text-accent"
          >
            <span aria-hidden>✉️</span> asautomobiles@gmail.com
          </a>
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-primary-foreground/10">
          <iframe
            title="AS Automobiles location"
            src="https://www.google.com/maps?q=Tengpora,Srinagar&output=embed"
            className="h-56 w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <p className="mt-8 text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} AS Automobiles. All rights reserved.
        </p>
      </div>
    </footer>
  );
}