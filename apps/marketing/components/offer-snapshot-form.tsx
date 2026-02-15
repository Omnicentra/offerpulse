"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Loader2, Search } from "lucide-react"
import { offerSnapshotSchema, type OfferSnapshotInput } from "@offerpulse/lib/validators"
import { track } from "@/lib/analytics"
import { extractDomain } from "@offerpulse/lib/utils"
import { buildAppSignupUrl, storeCompetitorUrl } from "@offerpulse/lib/routing"

interface OfferSnapshotFormProps {
  /** Optional: called when URL input changes for hero preview domain */
  onUrlChange?: (url: string) => void
}

export function OfferSnapshotForm({
  onUrlChange,
}: OfferSnapshotFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<OfferSnapshotInput>({
    resolver: zodResolver(offerSnapshotSchema),
    defaultValues: {
      url: "",
    },
  })

  const onSubmit = async (data: OfferSnapshotInput) => {
    setIsSubmitting(true)
    track("marketing_competitor_submitted", { url: data.url })

    try {
      // Store competitor URL in session storage as fallback
      storeCompetitorUrl(data.url)

      // Route to snapshot early access page
      const toolUrl = `/snapshot?url=${encodeURIComponent(data.url)}&utm_source=homepage&utm_medium=cta&utm_campaign=free_snapshot`

      track("marketing_cta_clicked", { 
        url: data.url, 
        source: "hero",
        destination: toolUrl 
      })

      // Navigate to public snapshot tool
      window.location.href = toolUrl
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong"
      track("marketing_routing_error", { url: data.url, error: message })
      form.setError("url", { message })
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="https://competitor-store.com"
                      className="h-14 pl-12 pr-4 text-base sm:h-12"
                      {...field}
                      disabled={isSubmitting}
                      onChange={(e) => {
                        field.onChange(e)
                        const url = e.target.value.trim()
                        onUrlChange?.(url ? (extractDomain(url) || url) : "")
                      }}
                      aria-label="Competitor store URL"
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-sm" />
              </FormItem>
            )}
          />
          <div className="flex flex-col gap-2">
            <Button
              type="submit"
              size="lg"
              className="h-14 w-full px-8 sm:h-12 sm:w-auto"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Get my free snapshot"
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground sm:text-left">
              Free. No credit card. Takes 60 seconds.
            </p>
          </div>
        </div>
      </form>
    </Form>
  )
}
