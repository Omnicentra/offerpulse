"use client";

import { Button } from "@/components/ui/button";
import { buildAppSignupUrl } from "@offerpulse/lib/routing";
import type { ButtonProps } from "@/components/ui/button";

interface SignupCtaButtonProps extends Omit<ButtonProps, "onClick"> {
  source?: string;
  competitorUrl?: string;
}

export function SignupCtaButton({
  source = "marketing",
  competitorUrl,
  children,
  ...buttonProps
}: SignupCtaButtonProps) {
  const handleClick = () => {
    window.location.href = buildAppSignupUrl({
      competitorUrl,
      source,
    });
  };

  return (
    <Button {...buttonProps} onClick={handleClick}>
      {children}
    </Button>
  );
}
