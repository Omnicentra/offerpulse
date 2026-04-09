import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@offerpulse/ui/components/progress';
import type { TooltipRenderProps } from 'react-tourlight'

export function ShadcnTooltip({
  step,
  next,
  previous,
  skip,
  currentIndex,
  totalSteps,
}: TooltipRenderProps) {
  const isFirstStep = currentIndex === 0
  const isLastStep = currentIndex === totalSteps - 1
  const progress = ((currentIndex + 1) / totalSteps) * 100

  return (
    <Card className="w-[380px] shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{step.title}</CardTitle>
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {totalSteps}
          </span>
        </div>
        <Progress value={progress} className="h-1" />
      </CardHeader>

      <CardContent className="text-sm text-muted-foreground">
        {step.content}
      </CardContent>

      <CardFooter className="flex justify-between pt-3">
        <Button variant="ghost" size="sm" onClick={skip}>
          Skip
        </Button>
        <div className="flex gap-2">
          {!isFirstStep && (
            <Button variant="outline" size="sm" onClick={previous}>
              Back
            </Button>
          )}
          <Button size="sm" onClick={next}>
            {isLastStep ? 'Done' : 'Next'}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}