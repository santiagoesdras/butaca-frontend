import { EMOTIONS, toFrontendEmotion } from "@/lib/emotions";
import type { HistoryEntry } from "@/types/history";

interface EmotionHeatmapProps {
  year: number;
  entries: HistoryEntry[];
  selectedDate: string | null;
  onSelectDay: (date: string) => void;
}

const weekdays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const months = [
  "Ene", "Feb", "Mar", "Abr",
  "May", "Jun", "Jul", "Ago",
  "Sep", "Oct", "Nov", "Dic",
];

/** Genera las fechas del año calendario, para pintar el grid completo. */
function createCalendarDays(year: number): string[] {
  const days: string[] = [];
  const current = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);
  while (current < end) {
    days.push(
      [
        current.getFullYear(),
        String(current.getMonth() + 1).padStart(2, "0"),
        String(current.getDate()).padStart(2, "0"),
      ].join("-")
    );
    current.setDate(current.getDate() + 1);
  }
  return days;
}

export function EmotionHeatmap({
  year,
  entries,
  selectedDate,
  onSelectDay,
}: EmotionHeatmapProps) {
  const firstDay = new Date(year, 0, 1);
  const leadingDays = firstDay.getDay();

  const calendarDays = createCalendarDays(year);
  const totalWeeks = Math.ceil((leadingDays + calendarDays.length) / 7);

  const entryMap = new Map(entries.map((entry) => [entry.date, entry]));

  const monthPositions = months.map((month, index) => {
    const date = new Date(year, index, 1);
    const dayOffset = Math.floor((date.getTime() - firstDay.getTime()) / 86400000);
    const week = Math.floor((leadingDays + dayOffset) / 7);
    return { month, week };
  });

  return (
    <div className="relative">
      <div className="w-full overflow-x-auto pb-3">
        <div
          className="grid w-full min-w-[1000px] gap-x-0.5 gap-y-1 sm:min-w-[760px] sm:gap-x-1 sm:gap-y-1.5"
          style={{
            gridTemplateColumns: `1.75rem repeat(${totalWeeks}, minmax(0, 1fr))`,
            gridTemplateRows: "1.25rem repeat(7, 1.5rem)",
          }}
        >
          {monthPositions.map(({ month, week }) => (
            <span
              key={month}
              className="whitespace-nowrap text-[10px] text-muted-foreground"
              style={{ gridColumn: week + 2, gridRow: 1 }}
            >
              {month}
            </span>
          ))}

          {weekdays.map((weekday, index) => (
            <span
              key={weekday}
              className="self-center text-[9px] text-muted-foreground"
              style={{ gridColumn: 1, gridRow: index + 2 }}
            >
              {index % 2 === 0 ? weekday : ""}
            </span>
          ))}

          {calendarDays.map((date, index) => {
            const position = leadingDays + index;
            const week = Math.floor(position / 7);
            const weekday = position % 7;

            const entry = entryMap.get(date);
            const emotion = entry ? toFrontendEmotion(entry.mood) : null;
            const emotionInfo = emotion ? EMOTIONS[emotion] : null;
            const selected = selectedDate === date;

            return (
              <button
                key={date}
                type="button"
                title={
                  entry
                    ? `${date} · ${entry.name}`
                    : `${date} · Sin registros`
                }
                aria-label={
                  entry
                    ? `${date}: ${entry.name}`
                    : `${date}: Sin registros`
                }
                aria-pressed={selected}
                onClick={() => onSelectDay(date)}
                className={`h-full w-full rounded-[3px] border transition-all hover:scale-125 ${
                  selected
                    ? "z-10 ring-2 ring-accent ring-offset-2 ring-offset-background"
                    : "border-transparent"
                } ${
                  emotionInfo ? "" : "border-border/50 bg-muted/70 hover:bg-muted"
                }`}
                style={{
                  gridColumn: week + 2,
                  gridRow: weekday + 2,
                  ...(emotionInfo ? { backgroundColor: emotionInfo.color } : {}),
                }}
              />
            );
          })}
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent sm:hidden"
      />
    </div>
  );
}