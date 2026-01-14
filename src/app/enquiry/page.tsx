import type { Metadata } from "next";
import EnquiryFormClient from "./EnquiryFormClient";
import PageHero from "@/components/website/ui/PageHero";
import { enquiryMetaConfig } from "./metaConfig";

const { title, description, keywords, canonical, image } = enquiryMetaConfig;

export const metadata: Metadata = {
  title,
  description,
  keywords,
  alternates: {
    canonical,
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: canonical,
    siteName: "Adysun Ventures",
    images: [
      {
        url: image,
        width: 1200,
        height: 630,
        alt: "Adysun Ventures",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [image],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function EnquiryPage() {
  return (
    <>
      <PageHero
        title="Enquiry"
        titleHighlight="Form"
        description="Share your profile for internship and job openings — we’ll reach out if there’s a match."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Enquiry", isActive: true },
        ]}
        className="pt-30"
      />

      <EnquiryFormClient
        useGoogleForm
        formUrl="https://docs.google.com/forms/d/e/1FAIpQLSeAUrMrLSeLhItVXcMeI_8S9b8ixCeqxTN-a4k1r27ib_g2Sg/viewform?embedded=true"
        mobileHeight={1140}
        desktopHeight={0}
      />
    </>
  );
}
