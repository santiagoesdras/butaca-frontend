
import { EMOTIONS } from "@/lib/emotions"
import type { Emotion } from "@/types/history"

export function EmotionLegend() {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-3">
      {(Object.entries(EMOTIONS) as [Emotion, typeof EMOTIONS[Emotion]][]).map(
        ([emotion, info]) => (
          <div key={emotion} className="flex items-center gap-2">
            <span
              className="size-3 rounded-sm"
              style={{ backgroundColor: info.color }}
            />
            <span className="text-xs text-muted-foreground">
              {info.label}
            </span>
          </div>
        )
      )}
    </div>
  )
}