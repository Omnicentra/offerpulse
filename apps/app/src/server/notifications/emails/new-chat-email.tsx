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

export interface NewChatEmailProps {
  visitorName: string;
  visitorEmail?: string | null;
  chatId: string;
  propertyName: string;
  tawkInboxUrl?: string;
  logoUrl?: string;
}

export function NewChatEmail({
  visitorName,
  visitorEmail,
  chatId,
  propertyName,
  tawkInboxUrl = "https://dashboard.tawk.to",
  logoUrl,
}: NewChatEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>💬 New chat started by {visitorName} on {propertyName}</Preview>
      <Body style={main}>
        <Container style={container}>
          {logoUrl && (
            <Section style={logoSection}>
              <Img src={logoUrl} width={40} height={40} alt="OfferPulse" />
            </Section>
          )}
          <Heading style={heading}>💬 New Chat Started</Heading>

          <Section style={section}>
            <Text style={label}>Visitor</Text>
            <Text style={value}>{visitorName}</Text>
            {visitorEmail && <Text style={subValue}>{visitorEmail}</Text>}
          </Section>

          <Section style={section}>
            <Text style={label}>Property</Text>
            <Text style={value}>{propertyName}</Text>
          </Section>

          <Section style={section}>
            <Text style={label}>Chat ID</Text>
            <Text style={chatIdText}>{chatId}</Text>
          </Section>

          <Section style={buttonSection}>
            <Button style={button} href={tawkInboxUrl}>
              Open tawk.to Inbox
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            You&apos;re receiving this because you have new chat notifications enabled for
            OfferPulse. Manage notification settings in your tawk.to dashboard.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default NewChatEmail;

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
  marginBottom: "20px",
};

const label = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#666",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0 0 4px",
};

const value = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#1a1a1a",
  margin: "0",
};

const subValue = {
  fontSize: "14px",
  color: "#555",
  margin: "2px 0 0",
};

const chatIdText = {
  fontSize: "13px",
  color: "#888",
  fontFamily: "monospace",
  margin: "0",
};

const buttonSection = {
  marginTop: "28px",
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
