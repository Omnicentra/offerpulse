"use client";

import { logger } from "@offerpulse/lib";
import Script from "next/script";
import { useEffect } from "react";

interface TawkUser {
  id: string;
  name?: string | null;
  email?: string | null;
}

interface TawkWidgetProps {
  propertyId: string;
  widgetId: string;
  user?: TawkUser | null;
}

declare global {
  interface Window {
    Tawk_API?: {
      onLoad?: () => void;
      setAttributes?: (
        attrs: Record<string, string>,
        callback?: (err: unknown) => void
      ) => void;
    };
    Tawk_LoadStart?: Date;
  }
}

export function TawkWidget({ propertyId, widgetId, user }: TawkWidgetProps) {
  useEffect(() => {
    if (!user) return;

    const applyIdentity = () => {
      const attrs: Record<string, string> = { id: user.id };
      if (user.name) attrs.name = user.name;
      if (user.email) attrs.email = user.email;

      window.Tawk_API?.setAttributes?.(attrs, (err) => {
        if (err) console.warn("[tawk.to] setAttributes error", err);
      });
    };

    if (window.Tawk_API) {
      const prev = window.Tawk_API.onLoad;
      window.Tawk_API.onLoad = prev
        ? () => { prev(); applyIdentity(); }
        : applyIdentity;
    } else {
      window.Tawk_API = { onLoad: applyIdentity };
    }
  }, [user]);

  if (!propertyId || !widgetId) {
    logger.error("[tawk.to] missing propertyId or widgetId", { propertyId, widgetId });
    return null;
  }

  const embedScript = `
    var Tawk_API=Tawk_API||{},Tawk_LoadStart=new Date();
    (function(){
      var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
      s1.async=true;
      s1.src='https://embed.tawk.to/${propertyId}/${widgetId}';
      s1.charset='UTF-8';
      s1.setAttribute('crossorigin','*');
      s0.parentNode.insertBefore(s1,s0);
    })();
  `;

  return (
    <Script
      id="tawk-to"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: embedScript }}
    />
  );
}
