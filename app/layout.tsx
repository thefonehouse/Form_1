import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

interface ExtendedMetadata extends Metadata {
  verification: {
    google: string;
    bing?: string;
  };
  openGraph: {
    title: string;
    description: string;
    url: string;
    type: string;
    images: {
      url: string;
      width: number;
      height: number;
      alt: string;
    }[];
  };
}

const inter = Inter({ subsets: ["latin"] });

export const metadata: ExtendedMetadata = {
  metadataBase: new URL("https://thefonehouse.com/"),
  title: 'Detail Form | Mobile Phone Companies UK | thefonehouse',
  description:
    "Find top mobile phone brands and deals in the UK at thefonehouse. Explore the latest smartphones, series, visit Now.",
  verification: {
    google: "w0_Gx1BxdxNWxhjjCX5JZ3xi8L_tCnJr8pHBDU4VrGo", // Google
    bing: "BAEE953253739AE12DC726DBB54CCFA0", // Bing
  },
  alternates: {
    canonical: "./",
  },
  openGraph: {
    title: 'Detail Form | Mobile Phone Companies UK | thefonehouse',
    description:
      "Find top mobile phone brands and deals in the UK at thefonehouse. Explore the latest smartphones, series, visit Now.",
    url: "https://thefonehouse.com/",
    type: "website",
    images: [
      {
        url: "https://thefonehouse.com/images/logo.svg",
        width: 1200,
        height: 630,
        alt: "TheFoneHouse Mobile Phones",
      },
    ],
  },
};

const homepageSchema = {
  "@context": "https://schema.org",
  "@type": "MobileSelling",
  name: "thefonehouse",
  alternateName: "TFH",
  url: "https://thefonehouse.com/",
  logo: "https://thefonehouse.com/images/logo.svg",
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "0 (333) 303 0916",
    contactType: "technical support",
    areaServed: ["UK"],
  },
  sameAs: [
    "https://www.facebook.com/",
    "https://www.instagram.com/",
    "https://www.linkedin.com/",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta
          name="google-site-verification"
          content={metadata.verification.google}
        />
        <meta name="msvalidate.01" content={metadata.verification.bing} />
        <meta property="og:title" content={metadata.openGraph.title} />
        <meta
          property="og:description"
          content={metadata.openGraph.description}
        />
        <meta property="og:url" content={metadata.openGraph.url} />
        <meta property="og:type" content={metadata.openGraph.type} />
        <meta property="og:image" content={metadata.openGraph.images[0].url} />
        <meta
          property="og:image:width"
          content={metadata.openGraph.images[0].width.toString()}
        />
        <meta
          property="og:image:height"
          content={metadata.openGraph.images[0].height.toString()}
        />
        <meta
          property="og:image:alt"
          content={metadata.openGraph.images[0].alt}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageSchema) }}
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}