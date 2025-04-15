import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationButton,
  PaginationNext,
  PaginationPrevious,
  PaginationFirst,
  PaginationLast,
  PaginationEllipsis,
} from '../ui/pagination'

interface SessionPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function SessionPagination({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: SessionPaginationProps) {
  // Don't show pagination if there's only 1 page
  if (totalPages <= 1) return null

  // Generate array of visible page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = []

    // Always show first page
    pageNumbers.push(1)

    // Logic for middle pages
    if (totalPages <= 7) {
      // If fewer than 7 pages, show them all
      for (let i = 2; i < totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // Add ellipsis and pages around current
      if (currentPage > 3) {
        pageNumbers.push('ellipsis1')
      }

      // Pages around current
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pageNumbers.push(i)
      }

      if (currentPage < totalPages - 2) {
        pageNumbers.push('ellipsis2')
      }
    }

    // Always show last page if more than 1 page
    if (totalPages > 1) {
      pageNumbers.push(totalPages)
    }

    return pageNumbers
  }

  const pageNumbers = getPageNumbers()
  const isFirstPage = currentPage === 1
  const isLastPage = currentPage === totalPages

  return (
    <Pagination className="mt-6">
      <PaginationContent>
        <PaginationItem>
          <PaginationFirst 
            onClick={() => onPageChange(1)} 
            disabled={isFirstPage}
          />
        </PaginationItem>
        <PaginationItem>
          <PaginationPrevious 
            onClick={() => onPageChange(currentPage - 1)} 
            disabled={isFirstPage}
          />
        </PaginationItem>
        
        {pageNumbers.map((pageNumber, index) => (
          <PaginationItem key={`${pageNumber}-${index}`}>
            {pageNumber === 'ellipsis1' || pageNumber === 'ellipsis2' ? (
              <PaginationEllipsis />
            ) : (
              <PaginationButton
                isActive={currentPage === pageNumber}
                onClick={() => onPageChange(pageNumber as number)}
              >
                {pageNumber}
              </PaginationButton>
            )}
          </PaginationItem>
        ))}
        
        <PaginationItem>
          <PaginationNext 
            onClick={() => onPageChange(currentPage + 1)} 
            disabled={isLastPage}
          />
        </PaginationItem>
        <PaginationItem>
          <PaginationLast 
            onClick={() => onPageChange(totalPages)} 
            disabled={isLastPage}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
} 