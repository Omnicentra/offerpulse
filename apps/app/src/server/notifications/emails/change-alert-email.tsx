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

export interface ChangeAlertEmailProps {
  competitorName: string;
  competitorUrl: string;
  changeType: string;
  changeSummary: string;
  confidence: "low" | "medium" | "high";
  recommendationTitle?: string;
  recommendationStrategy?: string;
  dashboardUrl: string;
  logoUrl?: string;
}

const confidenceEmoji = {
  high: "🔴",
  medium: "🟡",
  low: "⚪",
};

export function ChangeAlertEmail({
  competitorName,
  competitorUrl,
  changeType,
  changeSummary,
  confidence,
  recommendationTitle,
  recommendationStrategy,
  dashboardUrl,
  logoUrl,
}: ChangeAlertEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {confidenceEmoji[confidence]} {competitorName} changed their {changeType}{" "}
        offer
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {logoUrl && (
            <Section style={logoSection}>
              <Img src={logoUrl} width={40} height={40} alt="OfferPulse" />
            </Section>
          )}
          <Heading style={heading}>
            {confidenceEmoji[confidence]} Competitor Change Detected
          </Heading>

          <Section style={section}>
            <Text style={label}>Competitor</Text>
            <Text style={value}>{competitorName}</Text>
            <Link href={competitorUrl} style={linkStyle}>
              {competitorUrl}
            </Link>
          </Section>

          <Section style={section}>
            <Text style={label}>Change Type</Text>
            <Text style={value}>{changeType}</Text>
          </Section>

          <Section style={section}>
            <Text style={label}>What Changed</Text>
            <Text style={description}>{changeSummary}</Text>
          </Section>

          {recommendationTitle && (
            <Section style={recommendationSection}>
              <Text style={recommendationLabel}>Recommended Action</Text>
              <Text style={recommendationText}>{recommendationTitle}</Text>
              {recommendationStrategy && (
                <Text style={strategyText}>
                  Strategy: {recommendationStrategy}
                </Text>
              )}
            </Section>
          )}

          <Section style={buttonSection}>
            <Button style={button} href={dashboardUrl}>
              View in Dashboard
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            You&apos;re receiving this because you have alerts enabled for
            competitor changes. Manage your alert settings in the dashboard.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default ChangeAlertEmail;

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
  fontSize: "24px",
  fontWeight: "600",
  color: "#1a1a1a",
  margin: "0 0 24px",
};

const section = {
  marginBottom: "24px",
};

const label = {
  fontSize: "14px",
  color: "#666",
  margin: "0 0 8px",
};

const value = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#1a1a1a",
  margin: "0",
};

const description = {
  fontSize: "16px",
  color: "#1a1a1a",
  lineHeight: "1.5",
  margin: "0",
};

const linkStyle = {
  color: "#3b82f6",
  fontSize: "14px",
  margin: "4px 0 0",
  display: "block",
};

const recommendationSection = {
  marginBottom: "24px",
  padding: "16px",
  backgroundColor: "#f0f9ff",
  borderLeft: "4px solid #3b82f6",
  borderRadius: "4px",
};

const recommendationLabel = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#1e40af",
  margin: "0 0 8px",
};

const recommendationText = {
  fontSize: "16px",
  color: "#1a1a1a",
  margin: "0",
};

const strategyText = {
  fontSize: "14px",
  color: "#666",
  margin: "8px 0 0",
};

const buttonSection = {
  marginTop: "32px",
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
