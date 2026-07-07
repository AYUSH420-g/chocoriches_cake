import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function SEO({ title, description, name = "ChocoRiches", type = "website", url }) {
  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : "https://chocoriches.in/");
  const finalTitle = title ? `${title} | ChocoRiches` : "ChocoRiches | Best Custom Cakes";
  const finalDescription = description || "Buy the best custom cakes online at ChocoRiches. Fresh, delicious, and made to order.";

  return (
    <Helmet>
      { /* Standard metadata tags */ }
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      
      { /* OpenGraph tags */ }
      <meta property="og:type" content={type} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:url" content={currentUrl} />
      
      { /* Twitter tags */ }
      <meta name="twitter:creator" content={name} />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      
      <link rel="canonical" href={currentUrl} />
    </Helmet>
  );
}
