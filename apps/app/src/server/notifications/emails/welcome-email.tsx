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

export interface WelcomeEmailProps {
  userName: string | null;
  dashboardUrl: string;
  logoUrl: string;
}

export function WelcomeEmail({ userName, dashboardUrl, logoUrl }: WelcomeEmailProps) {
  const firstName = userName?.split(/\s+/)[0] ?? "there";
  const addCompetitorUrl = `${dashboardUrl}/competitors?onboarding=1`;

  return (
    <Html>
      <Head />
      <Preview>You're in — here's how to get the most out of OfferPulse</Preview>
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
              Welcome, {firstName}
            </Heading>
            <Text style={paragraph}>
              You're all set. OfferPulse will track your competitors' offers, detect
              changes, and suggest actions so you can stay ahead.
            </Text>

            <Text style={subheading}>Get the most out of OfferPulse</Text>
            <Text style={paragraph}>
              <strong>Add your first competitor</strong> — Enter their product or
              promo page URL. We'll capture their current offer and start monitoring
              for changes. The sooner you add competitors, the sooner you get
              actionable alerts and recommendations.
            </Text>

            <Section style={buttonWrapper}>
              <Button style={button} href={addCompetitorUrl}>
                Add your first competitor
              </Button>
            </Section>

            <Text style={paragraph}>
              After that, we'll run periodic snapshots, highlight what changed, and
              surface AI-powered recommendations. You can tune alert frequency and
              channels in your dashboard anytime.
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              Need help? Reply to this email or visit{" "}
              <Link href="https://offerpulse.io" style={link}>
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

export default WelcomeEmail;

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
  padding: "32px 40px 40px",
};

const heading = {
  fontSize: "24px",
  lineHeight: "1.3",
  fontWeight: "600",
  color: "#0f172a",
  margin: "0 0 16px",
};

const subheading = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#0f172a",
  margin: "24px 0 8px",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#475569",
  margin: "0 0 16px",
};

const buttonWrapper = {
  textAlign: "center" as const,
  margin: "28px 0",
};

const button = {
  backgroundColor: "#0f172a",
  color: "#ffffff",
  padding: "14px 28px",
  borderRadius: "6px",
  fontWeight: "600",
  fontSize: "16px",
  textDecoration: "none",
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

const link = {
  color: "#2563eb",
  textDecoration: "underline",
};
