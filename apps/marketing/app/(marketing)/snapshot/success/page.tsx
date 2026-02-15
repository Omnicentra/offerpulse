import Link from "next/link";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export default function SuccessPage() {
  return (
    <div className="min-h-screen">
      <section className="border-b border-slate-200 bg-gradient-to-b from-green-50 to-white py-24">
        <Container className="max-w-2xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="mt-6 text-4xl font-bold text-slate-900">Slot Reserved ✅</h1>
          <p className="mt-4 text-xl text-slate-700">
            You've reserved early access to OfferPulse. We'll email you when your slot is ready.
          </p>
        </Container>
      </section>

      <section className="py-16">
        <Container className="max-w-3xl">
          <Card>
            <CardContent className="p-8">
              <h2 className="mb-6 text-xl font-semibold text-slate-900">What happens next</h2>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <CheckCircle className="h-6 w-6 flex-shrink-0 text-green-600" />
                  <span className="text-slate-700">You'll receive an email confirmation now</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="h-6 w-6 flex-shrink-0 text-green-600" />
                  <span className="text-slate-700">Early access slots are opened in batches</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="h-6 w-6 flex-shrink-0 text-green-600" />
                  <span className="text-slate-700">Your £19 will be credited to your first paid month at launch</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="h-6 w-6 flex-shrink-0 text-green-600" />
                  <span className="text-slate-700">Want a refund before launch? Reply to the email and we'll sort it</span>
                </li>
              </ul>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Button asChild size="lg" className="flex-1">
                  <Link href="/">Back to homepage</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="flex-1">
                  <Link href="/how-it-works">View what OfferPulse tracks</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>
    </div>
  );
}
