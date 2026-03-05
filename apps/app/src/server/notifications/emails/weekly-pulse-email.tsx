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

export interface WeeklyPulseEmailProps {
  weekOf: Date;
  totalChanges: number;
  topChanges: Array<{
    competitorName: string;
    changeType: string;
    summary: string;
  }>;
  dashboardUrl: string;
  logoUrl?: string;
}

export function WeeklyPulseEmail({
  weekOf,
  totalChanges,
  topChanges,
  dashboardUrl,
  logoUrl,
}: WeeklyPulseEmailProps) {
  const weekLabel = weekOf.toLocaleDateString("en-GB", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Html>
      <Head />
      <Preview>
        {`Your Weekly Pulse — ${totalChanges} changes detected`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {logoUrl && (
            <Section style={logoSection}>
              <Img src={logoUrl} width={40} height={40} alt="OfferPulse" />
            </Section>
          )}
          <Heading style={heading}>📊 Your Weekly Pulse</Heading>
          <Text style={weekLabelStyle}>Week of {weekLabel}</Text>

          <Section style={statsSection}>
            <Text style={statsNumber}>{String(totalChanges)}</Text>
            <Text style={statsLabel}>Competitor changes detected</Text>
          </Section>

          {topChanges.length > 0 && (
            <Section style={section}>
              <Heading as="h2" style={subheading}>
                Top Moves This Week
              </Heading>
              {topChanges.slice(0, 5).map((change, idx) => (
                <Section key={idx} style={changeCard}>
                  <Text style={changeTitle}>
                    {idx + 1}. {change.competitorName}
                  </Text>
                  <Text style={changeType}>{change.changeType}</Text>
                  <Text style={changeSummary}>{change.summary}</Text>
                </Section>
              ))}
            </Section>
          )}

          <Section style={buttonSection}>
            <Button style={button} href={dashboardUrl}>
              View Full Report
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Your weekly competitive intelligence summary. Manage your settings
            in the dashboard.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default WeeklyPulseEmail;

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
  margin: "0 0 8px",
};

const weekLabelStyle = {
  fontSize: "14px",
  color: "#666",
  margin: "0 0 24px",
};

const statsSection = {
  textAlign: "center" as const,
  padding: "24px",
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  marginBottom: "24px",
};

const statsNumber = {
  fontSize: "48px",
  fontWeight: "700",
  color: "#1a1a1a",
  margin: "0",
};

const statsLabel = {
  fontSize: "16px",
  color: "#666",
  margin: "8px 0 0",
};

const section = {
  marginBottom: "24px",
};

const subheading = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#1a1a1a",
  margin: "0 0 16px",
};

const changeCard = {
  marginBottom: "16px",
  padding: "16px",
  backgroundColor: "#f9fafb",
  borderLeft: "4px solid #3b82f6",
  borderRadius: "4px",
};

const changeTitle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#1a1a1a",
  margin: "0 0 4px",
};

const changeType = {
  fontSize: "12px",
  color: "#666",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 4px",
};

const changeSummary = {
  fontSize: "14px",
  color: "#1a1a1a",
  margin: "0",
};

const buttonSection = {
  textAlign: "center" as const,
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
