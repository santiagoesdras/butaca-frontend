
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const badgeVariants = cva(
  "group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
        variant: {
            default:
            "border-primary/40 bg-primary/25 text-[#d4eeee]",
            secondary:
            "border-border bg-muted text-muted-foreground",
            destructive:
            "border-[#ff5545] bg-transparent text-[#ff5545]",
            outline:
            "border-border bg-transparent text-foreground",
            ghost:
            "border-transparent bg-transparent text-muted-foreground",
            link:
            "border-transparent bg-transparent text-[#70c5c0] underline-offset-4 hover:text-[#a0e0db] hover:underline",
            terracotta:
            "border-accent/40 bg-accent/20 text-[#ffb18b]",
        },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
