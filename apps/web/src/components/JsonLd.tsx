import { serializeJsonLd } from "@/lib/jsonld";

/** Structured data tag; content is escaped by serializeJsonLd so it can never close the <script>. */
export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
