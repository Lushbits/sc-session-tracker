import * as React from "react"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { Button } from "./button"
import { cn } from "../../lib/utils"

// Pagination container
const Pagination = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex justify-center items-center gap-1", className)} {...props} />
)
Pagination.displayName = "Pagination"

// Page numbers display
const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
))
PaginationContent.displayName = "PaginationContent"

// Page item wrapper
const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.LiHTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

// Page navigation buttons and indicators
type PaginationButtonProps = {
  isActive?: boolean
} & React.ButtonHTMLAttributes<HTMLButtonElement>

const PaginationButton = ({
  className,
  isActive,
  ...props
}: PaginationButtonProps) => (
  <Button
    aria-current={isActive ? "page" : undefined}
    variant={isActive ? "default" : "outline"}
    size="icon"
    className={cn(
      "h-8 w-8",
      isActive && "pointer-events-none",
      className
    )}
    {...props}
  />
)
PaginationButton.displayName = "PaginationButton"

// Next page navigation button
const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationButton>) => (
  <PaginationButton
    className={cn("", className)}
    title="Next page"
    {...props}
  >
    <ChevronRight className="h-4 w-4" />
  </PaginationButton>
)
PaginationNext.displayName = "PaginationNext"

// Previous page navigation button
const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationButton>) => (
  <PaginationButton
    className={cn("", className)}
    title="Previous page"
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
  </PaginationButton>
)
PaginationPrevious.displayName = "PaginationPrevious"

// First page navigation button
const PaginationFirst = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationButton>) => (
  <PaginationButton
    className={cn("", className)}
    title="First page"
    {...props}
  >
    <ChevronsLeft className="h-4 w-4" />
  </PaginationButton>
)
PaginationFirst.displayName = "PaginationFirst"

// Last page navigation button
const PaginationLast = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationButton>) => (
  <PaginationButton
    className={cn("", className)}
    title="Last page"
    {...props}
  >
    <ChevronsRight className="h-4 w-4" />
  </PaginationButton>
)
PaginationLast.displayName = "PaginationLast"

// Ellipsis indicator for skipped pages
const PaginationEllipsis = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    aria-hidden
    className={cn("flex h-8 w-8 items-center justify-center", className)}
    {...props}
  >
    ...
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationButton,
  PaginationNext,
  PaginationPrevious,
  PaginationFirst,
  PaginationLast,
  PaginationEllipsis,
} 