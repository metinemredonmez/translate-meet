"use client";

import { SearchX } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { buttonClass, EmptyState } from "./ui";

export default function NotFoundView() {
  const { t } = useI18n();
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 px-4">
      <h1 className="sr-only">{t("notFound.title")}</h1>
      <EmptyState icon={<SearchX aria-hidden className="h-5 w-5" />} title={t("notFound.title")} description={t("notFound.body")} />
      <Link href="/" className={buttonClass("secondary", "self-start")}>
        {t("notFound.home")}
      </Link>
    </main>
  );
}
