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
  Row,
  Column,
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

  const steps = [
    {
      number: "1",
      title: "Add a competitor",
      description: "Paste any competitor product or promo page URL. We capture their current offer instantly.",
    },
    {
      number: "2",
      title: "We monitor changes",
      description: "OfferPulse runs periodic snapshots and detects pricing, promotion, and copy changes automatically.",
    },
    {
      number: "3",
      title: "Get AI recommendations",
      description: "Receive actionable suggestions on how to respond to every change — straight to your inbox or Slack.",
    },
  ];

  return (
    <Html>
      <Head />
      <Preview>Welcome to OfferPulse, {firstName} — get started in 3 easy steps</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
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

          {/* Main content */}
          <Section style={content}>
            <Heading as="h1" style={heading}>
              Welcome to OfferPulse, {firstName}!
            </Heading>
            <Text style={paragraph}>
              You&apos;re now part of a community of e-commerce sellers who stay one step ahead of
              the competition. OfferPulse tracks your competitors&apos; offers, detects changes, and
              surfaces AI-powered recommendations so you can act fast.
            </Text>

            {/* Get started steps card */}
            <Section style={stepsCard}>
              <Text style={stepsTitle}>Get started in 3 easy steps:</Text>

              {steps.map((step) => (
                <Row key={step.number} style={stepRow}>
                  <Column style={stepNumberCol}>
                    <div style={stepBadge}>{step.number}</div>
                  </Column>
                  <Column style={stepContentCol}>
                    <Text style={stepTitle}>{step.title}</Text>
                    <Text style={stepDescription}>{step.description}</Text>
                  </Column>
                </Row>
              ))}
            </Section>

            <Section style={buttonWrapper}>
              <Button style={button} href={addCompetitorUrl}>
                Add your first competitor
              </Button>
            </Section>

            <Text style={helpText}>
              You can tune alert frequency and notification channels (email, Slack) in your
              dashboard settings at any time.
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
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
  backgroundColor: "#f1f5f9",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "32px auto",
  padding: "0",
  maxWidth: "600px",
  borderRadius: "12px",
  overflow: "hidden" as const,
  boxShadow: "0 4px 24px rgba(0, 0, 0, 0.08)",
};

const header = {
  padding: "36px 40px 28px",
  background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
  textAlign: "center" as const,
};

const logoImg = {
  display: "block",
  margin: "0 auto 10px",
};

const logo = {
  fontSize: "26px",
  fontWeight: "800",
  color: "#f8fafc",
  margin: "0 0 6px",
  letterSpacing: "-0.03em",
};

const tagline = {
  fontSize: "13px",
  color: "#94a3b8",
  margin: "0",
  letterSpacing: "0.01em",
};

const content = {
  padding: "36px 40px 32px",
};

const heading = {
  fontSize: "26px",
  lineHeight: "1.3",
  fontWeight: "700",
  color: "#0f172a",
  margin: "0 0 14px",
};

const paragraph = {
  fontSize: "15px",
  lineHeight: "1.65",
  color: "#475569",
  margin: "0 0 28px",
};

const stepsCard = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  padding: "24px 24px 8px",
  margin: "0 0 28px",
};

const stepsTitle = {
  fontSize: "15px",
  fontWeight: "700",
  color: "#0f172a",
  margin: "0 0 20px",
};

const stepRow = {
  marginBottom: "18px",
};

const stepNumberCol = {
  width: "36px",
  verticalAlign: "top" as const,
  paddingRight: "14px",
};

const stepBadge = {
  width: "28px",
  height: "28px",
  borderRadius: "50%",
  backgroundColor: "#0f172a",
  color: "#ffffff",
  fontSize: "13px",
  fontWeight: "700",
  textAlign: "center" as const,
  lineHeight: "28px",
  display: "inline-block",
};

const stepContentCol = {
  verticalAlign: "top" as const,
};

const stepTitle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#0f172a",
  margin: "0 0 3px",
};

const stepDescription = {
  fontSize: "13px",
  lineHeight: "1.55",
  color: "#64748b",
  margin: "0 0 0",
};

const buttonWrapper = {
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const button = {
  backgroundColor: "#0f172a",
  color: "#ffffff",
  padding: "14px 32px",
  borderRadius: "8px",
  fontWeight: "600",
  fontSize: "15px",
  textDecoration: "none",
  display: "inline-block",
};

const helpText = {
  fontSize: "13px",
  lineHeight: "1.6",
  color: "#94a3b8",
  margin: "0",
  textAlign: "center" as const,
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
  fontSize: "13px",
  lineHeight: "1.6",
  color: "#64748b",
  margin: "0 0 8px",
};

const footerNote = {
  fontSize: "12px",
  color: "#94a3b8",
  margin: "8px 0 0",
};

const link = {
  color: "#2563eb",
  textDecoration: "underline",
};
