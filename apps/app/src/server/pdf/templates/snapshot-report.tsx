import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

interface ExtractedSignals {
  promoText?: string;
  discountPercent?: number;
  discountCode?: string;
  shippingThreshold?: number;
  shippingText?: string;
  bundleText?: string;
  cartIncentiveText?: string;
  deliveryText?: string;
  returnsText?: string;
  confidence: "low" | "medium" | "high";
}

export interface SnapshotPdfModel {
  snapshotId: string;
  competitorName: string;
  competitorDomain: string;
  capturedAt: string;
  screenshotUrl?: string | null;
  current: ExtractedSignals;
  previous?: ExtractedSignals | null;
}

const styles = StyleSheet.create({
  page: {
    fontSize: 11,
    padding: 24,
    fontFamily: "Helvetica",
    color: "#0f172a",
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 4,
  },
  subtitle: {
    color: "#475569",
    marginBottom: 16,
  },
  section: {
    border: "1 solid #e2e8f0",
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 8,
  },
  row: {
    marginBottom: 4,
  },
  label: {
    fontWeight: 700,
  },
  screenshot: {
    width: "100%",
    objectFit: "contain",
    marginTop: 8,
  },
});

function SignalsBlock({
  title,
  signals,
}: {
  title: string;
  signals: ExtractedSignals;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.row}>
        <Text style={styles.label}>Confidence: </Text>
        {signals.confidence}
      </Text>
      {!!signals.promoText && (
        <Text style={styles.row}>
          <Text style={styles.label}>Promotion: </Text>
          {signals.promoText}
        </Text>
      )}
      {signals.discountPercent != null && (
        <Text style={styles.row}>
          <Text style={styles.label}>Discount: </Text>
          {signals.discountPercent}%
        </Text>
      )}
      {!!signals.discountCode && (
        <Text style={styles.row}>
          <Text style={styles.label}>Code: </Text>
          {signals.discountCode}
        </Text>
      )}
      {!!signals.shippingText && (
        <Text style={styles.row}>
          <Text style={styles.label}>Shipping: </Text>
          {signals.shippingText}
        </Text>
      )}
      {signals.shippingThreshold != null && (
        <Text style={styles.row}>
          <Text style={styles.label}>Shipping Threshold: </Text>${signals.shippingThreshold}
        </Text>
      )}
      {!!signals.bundleText && (
        <Text style={styles.row}>
          <Text style={styles.label}>Bundle: </Text>
          {signals.bundleText}
        </Text>
      )}
      {!!signals.cartIncentiveText && (
        <Text style={styles.row}>
          <Text style={styles.label}>Cart Incentive: </Text>
          {signals.cartIncentiveText}
        </Text>
      )}
      {!!signals.deliveryText && (
        <Text style={styles.row}>
          <Text style={styles.label}>Delivery: </Text>
          {signals.deliveryText}
        </Text>
      )}
      {!!signals.returnsText && (
        <Text style={styles.row}>
          <Text style={styles.label}>Returns: </Text>
          {signals.returnsText}
        </Text>
      )}
    </View>
  );
}

export function SnapshotReportPdf({ model }: { model: SnapshotPdfModel }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Snapshot Report</Text>
        <Text style={styles.subtitle}>
          {model.competitorName} ({model.competitorDomain}) - {model.capturedAt}
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Metadata</Text>
          <Text style={styles.row}>
            <Text style={styles.label}>Snapshot ID: </Text>
            {model.snapshotId}
          </Text>
          <Text style={styles.row}>
            <Text style={styles.label}>Captured At: </Text>
            {model.capturedAt}
          </Text>
        </View>

        {model.previous ? (
          <>
            <SignalsBlock title="Before" signals={model.previous} />
            <SignalsBlock title="After (Current)" signals={model.current} />
          </>
        ) : (
          <SignalsBlock title="Captured Data" signals={model.current} />
        )}

        {!!model.screenshotUrl && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Screenshot</Text>
            <Image src={model.screenshotUrl} style={styles.screenshot} />
          </View>
        )}
      </Page>
    </Document>
  );
}
