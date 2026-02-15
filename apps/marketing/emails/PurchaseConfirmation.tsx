import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface PurchaseConfirmationEmailProps {
  customerEmail: string;
  sessionId: string;
}

export const PurchaseConfirmationEmail = ({
  sessionId,
}: PurchaseConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Your OfferPulse Snapshot Report - Slot Reserved ✅</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={heading}>
            Slot Reserved ✅
          </Heading>
          <Text style={paragraph}>
            Thank you for reserving your early access slot! Your £19 payment has been confirmed.
          </Text>
        </Section>

        <Section style={box}>
          <Heading as="h2" style={subheading}>
            What happens next
          </Heading>
          <Text style={listItem}>
            ✅ <strong>Email confirmation</strong> - You&apos;re reading it now!
          </Text>
          <Text style={listItem}>
            ✅ <strong>Early access slots</strong> - We&apos;ll open slots in batches and email you when yours is ready
          </Text>
          <Text style={listItem}>
            ✅ <strong>£19 credit</strong> - Your payment will be credited to your first paid month at launch
          </Text>
          <Text style={listItem}>
            ✅ <strong>Full refund available</strong> - Want a refund before launch? Just reply to this email
          </Text>
        </Section>

        <Section style={box}>
          <Heading as="h2" style={subheading}>
            What you&apos;ll get
          </Heading>
          <Text style={paragraph}>
            Your Competitor Promo Report includes:
          </Text>
          <Text style={listItem}>
            • Full promo stack (discounts, shipping, bundles, gifts, cart incentives)
          </Text>
          <Text style={listItem}>
            • Evidence screenshots + where it appears (PDP/cart/checkout)
          </Text>
          <Text style={listItem}>
            • Codes and thresholds detected
          </Text>
          <Text style={listItem}>
            • 3 suggested counter-moves to protect CVR and AOV
          </Text>
          <Text style={listItem}>
            • Priority access when automated monitoring opens
          </Text>
        </Section>

        <Section style={footer}>
          <Text style={footerText}>
            Questions? Just reply to this email and we&apos;ll help you out.
          </Text>
          <Text style={footerText}>
            <Link href="https://offerpulse.io" style={link}>
              OfferPulse
            </Link>
            {" · "}
            <Link href="https://offerpulse.io/how-it-works" style={link}>
              How it works
            </Link>
            {" · "}
            <Link href="https://offerpulse.io/pricing" style={link}>
              Pricing
            </Link>
          </Text>
          <Text style={footerNote}>
            Order ID: {sessionId}
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default PurchaseConfirmationEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
};

const header = {
  padding: "32px 24px",
  textAlign: "center" as const,
  backgroundColor: "#f0fdf4",
  borderBottom: "2px solid #bbf7d0",
};

const box = {
  padding: "0 24px",
  marginTop: "24px",
};

const heading = {
  fontSize: "32px",
  lineHeight: "1.3",
  fontWeight: "700",
  color: "#0f172a",
  margin: "0 0 16px",
};

const subheading = {
  fontSize: "20px",
  lineHeight: "1.4",
  fontWeight: "600",
  color: "#0f172a",
  margin: "0 0 12px",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#475569",
  margin: "0 0 16px",
};

const listItem = {
  fontSize: "15px",
  lineHeight: "1.6",
  color: "#475569",
  margin: "0 0 8px",
};

const footer = {
  padding: "24px",
  textAlign: "center" as const,
  borderTop: "1px solid #e2e8f0",
  marginTop: "32px",
};

const footerText = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#64748b",
  margin: "0 0 8px",
};

const footerNote = {
  fontSize: "12px",
  lineHeight: "1.6",
  color: "#94a3b8",
  margin: "16px 0 0",
};

const link = {
  color: "#2563eb",
  textDecoration: "underline",
};
