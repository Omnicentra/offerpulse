"use client"

import { Button } from "@/components/ui/button"

interface ExampleUrlChipsProps {
  onSelect: (url: string) => void
}

const exampleUrls = [
  { label: "ASOS", url: "www.asos.com" },
  { label: "Gymshark", url: "gymshark.com" },
  { label: "Charlotte Tilbury", url: "charlottetilbury.com" },
]

export function ExampleUrlChips({ onSelect }: ExampleUrlChipsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-body/70">Try an example:</span>
      {exampleUrls.map((example) => (
        <Button
          key={example.url}
          variant="outline"
          size="sm"
          className="h-7 rounded-full text-xs"
          onClick={() => onSelect(example.url)}
          type="button"
        >
          {example.label}
        </Button>
      ))}
    </div>
  )
}
