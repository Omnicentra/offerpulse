import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface CaptureCompleteEmailProps {
  competitorName: string;
  competitorUrl: string;
  status: "success" | "failed" | "changes_detected";
  snapshotUrl: string;
  timestamp: Date;
  errorMessage?: string;
  logoUrl?: string;
}

const statusConfig = {
  success: { emoji: "✅", label: "Completed" },
  failed: { emoji: "❌", label: "Failed" },
  changes_detected: { emoji: "📋", label: "Changes detected" },
};

export function CaptureCompleteEmail({
  competitorName,
  competitorUrl,
  status,
  snapshotUrl,
  timestamp,
  errorMessage,
  logoUrl,
}: CaptureCompleteEmailProps) {
  const { emoji, label } = statusConfig[status];

  return (
    <Html>
      <Head />
      <Preview>
        {emoji} Capture {label}: {competitorName}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {logoUrl && (
            <Section style={logoSection}>
              <Img src={logoUrl} width={40} height={40} alt="OfferPulse" />
            </Section>
          )}
          <Heading style={heading}>
            {emoji} Capture {label}
          </Heading>

          <Section style={section}>
            <Text style={labelStyle}>Competitor</Text>
            <Text style={valueStyle}>{competitorName}</Text>
            <Text style={urlStyle}>
              <a href={competitorUrl} style={linkStyle}>
                {competitorUrl}
              </a>
            </Text>
          </Section>

          <Section style={section}>
            <Text style={labelStyle}>Time</Text>
            <Text style={valueStyle}>{timestamp.toLocaleString()}</Text>
          </Section>

          {errorMessage && (
            <Section style={errorSection}>
              <Text style={errorText}>{errorMessage}</Text>
            </Section>
          )}

          <Section style={buttonSection}>
            <Button style={button} href={snapshotUrl}>
              View Snapshot
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            OfferPulse · Competitor monitoring that drives action
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default CaptureCompleteEmail;

const main = {
  backgroundColor: "#f6f6f6",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px",
  maxWidth: "600px",
  borderRadius: "8px",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
};

const logoSection = {
  padding: "0 0 16px",
};

const heading = {
  fontSize: "20px",
  fontWeight: "600",
  color: "#1a1a1a",
  margin: "0 0 24px",
};

const section = {
  marginBottom: "24px",
};

const labelStyle = {
  fontSize: "14px",
  color: "#666",
  margin: "0 0 8px",
};

const valueStyle = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#1a1a1a",
  margin: "0",
};

const urlStyle = {
  fontSize: "14px",
  margin: "4px 0 0",
};

const linkStyle = {
  color: "#3b82f6",
  textDecoration: "none",
};

const errorSection = {
  marginBottom: "24px",
  padding: "16px",
  backgroundColor: "#fef2f2",
  borderRadius: "4px",
};

const errorText = {
  fontSize: "14px",
  color: "#dc2626",
  margin: "0",
};

const buttonSection = {
  marginTop: "24px",
};

const button = {
  backgroundColor: "#3b82f6",
  color: "#ffffff",
  padding: "12px 24px",
  borderRadius: "6px",
  fontWeight: "600",
  fontSize: "16px",
  textDecoration: "none",
};

const hr = {
  borderColor: "#e2e8f0",
  margin: "24px 0",
};

const footer = {
  fontSize: "12px",
  color: "#999",
  margin: "0",
};
