"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const billingFaqs = [
  {
    question: "How often am I billed?",
    answer:
      "All plans are billed monthly in GBP. Your first payment is due after the 14-day free trial ends. You can cancel before the trial ends and you won't be charged.",
  },
  {
    question: "Can I change plans?",
    answer:
      "Yes. You can upgrade or downgrade at any time. When you upgrade, we'll prorate the difference. When you downgrade, the new rate applies at the start of your next billing cycle.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit and debit cards (Visa, Mastercard, American Express). Invoicing is available for Agency plans on request.",
  },
]

export function BillingFaq() {
  return (
    <Accordion type="single" collapsible className="w-full">
      {billingFaqs.map((faq, index) => (
        <AccordionItem key={index} value={`billing-${index}`}>
          <AccordionTrigger className="text-left text-base">
            {faq.question}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            {faq.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
