import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface ResetPasswordEmailProps {
  userName: string | null;
  resetUrl: string;
  logoUrl: string;
}

export function ResetPasswordEmail({ userName, resetUrl, logoUrl }: ResetPasswordEmailProps) {
  const firstName = userName?.split(/\s+/)[0] ?? "there";

  return (
    <Html>
      <Head />
      <Preview>Reset your OfferPulse password — link expires in 1 hour</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img
              src={logoUrl}
              alt="OfferPulse"
              width={40}
              height={40}
              style={logoImg}
            />
            <Heading style={logo}>OfferPulse</Heading>
            <Text style={tagline}>Competitor intelligence that moves the needle</Text>
          </Section>

          <Section style={content}>
            <Heading as="h1" style={heading}>
              Reset your password
            </Heading>
            <Text style={paragraph}>
              Hi {firstName}, we received a request to reset the password for your OfferPulse
              account. Click the button below to choose a new password.
            </Text>

            <Section style={buttonWrapper}>
              <Button style={button} href={resetUrl}>
                Reset password
              </Button>
            </Section>

            <Section style={infoBox}>
              <Text style={infoText}>
                This link will expire in <strong>1 hour</strong>. If you didn&apos;t request a
                password reset, you can safely ignore this email — your account is still secure.
              </Text>
            </Section>

            <Text style={paragraph}>
              If the button above doesn&apos;t work, copy and paste this URL into your browser:
            </Text>
            <Text style={linkText}>
              <Link href={resetUrl} style={link}>
                {resetUrl}
              </Link>
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              Need help? Reply to this email or visit{" "}
              <Link href="https://offerpulse.io" style={footerLink}>
                offerpulse.io
              </Link>
            </Text>
            <Text style={footerNote}>OfferPulse · Competitor monitoring that drives action</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default ResetPasswordEmail;

const main = {
  backgroundColor: "#f8fafc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "0",
  marginBottom: "64px",
  maxWidth: "600px",
  borderRadius: "8px",
  overflow: "hidden" as const,
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
};

const header = {
  padding: "32px 40px 24px",
  background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
  textAlign: "center" as const,
};

const logoImg = {
  display: "block",
  margin: "0 auto 8px",
};

const logo = {
  fontSize: "24px",
  fontWeight: "700",
  color: "#f8fafc",
  margin: "0 0 4px",
  letterSpacing: "-0.02em",
};

const tagline = {
  fontSize: "14px",
  color: "#94a3b8",
  margin: "0",
};

const content = {
  padding: "40px 40px 32px",
};

const heading = {
  fontSize: "26px",
  lineHeight: "1.3",
  fontWeight: "700",
  color: "#0f172a",
  margin: "0 0 16px",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#475569",
  margin: "0 0 16px",
};

const buttonWrapper = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#2563eb",
  color: "#ffffff",
  padding: "14px 32px",
  borderRadius: "6px",
  fontWeight: "600",
  fontSize: "16px",
  textDecoration: "none",
  display: "inline-block",
};

const infoBox = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  padding: "16px 20px",
  margin: "0 0 24px",
};

const infoText = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#64748b",
  margin: "0",
};

const linkText = {
  fontSize: "13px",
  lineHeight: "1.6",
  color: "#94a3b8",
  margin: "0 0 8px",
  wordBreak: "break-all" as const,
};

const link = {
  color: "#2563eb",
  textDecoration: "underline",
};

const hr = {
  borderColor: "#e2e8f0",
  margin: "0 40px",
};

const footer = {
  padding: "24px 40px 32px",
  textAlign: "center" as const,
};

const footerText = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#64748b",
  margin: "0 0 8px",
};

const footerNote = {
  fontSize: "12px",
  color: "#94a3b8",
  margin: "16px 0 0",
};

const footerLink = {
  color: "#2563eb",
  textDecoration: "underline",
};
