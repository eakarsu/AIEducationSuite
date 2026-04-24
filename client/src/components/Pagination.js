import React from 'react';

function Pagination({ page, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '2rem' }}>
      <button
        className="btn btn-secondary btn-sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </button>
      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
        let pageNum;
        if (totalPages <= 5) {
          pageNum = i + 1;
        } else if (page <= 3) {
          pageNum = i + 1;
        } else if (page >= totalPages - 2) {
          pageNum = totalPages - 4 + i;
        } else {
          pageNum = page - 2 + i;
        }
        return (
          <button
            key={pageNum}
            className={`btn btn-sm ${pageNum === page ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onPageChange(pageNum)}
          >
            {pageNum}
          </button>
        );
      })}
      <button
        className="btn btn-secondary btn-sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
    </div>
  );
}

export default Pagination;
