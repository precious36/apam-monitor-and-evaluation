import { useMemo, useState } from 'react'

export default function DataTable({ columns, rows, onRowClick, pageSize = 10 }) {
  const normalizedPageSize = Number.isInteger(pageSize) && pageSize > 0 ? pageSize : 10
  const totalRows = rows.length
  const totalPages = Math.max(1, Math.ceil(totalRows / normalizedPageSize))
  const [currentPage, setCurrentPage] = useState(1)
  const activePage = Math.min(currentPage, totalPages)

  const paginatedRows = useMemo(() => {
    const startIndex = (activePage - 1) * normalizedPageSize
    return rows.slice(startIndex, startIndex + normalizedPageSize)
  }, [activePage, normalizedPageSize, rows])

  const startRow = totalRows === 0 ? 0 : (activePage - 1) * normalizedPageSize + 1
  const endRow = Math.min(activePage * normalizedPageSize, totalRows)

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key || col.label} style={col.style} scope="col">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedRows.map((row, index) => (
            <tr
              key={row.id || index}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={onRowClick ? 'is-clickable' : ''}
            >
              {columns.map((col) => (
                <td
                  key={col.key || col.label}
                  data-label={typeof col.label === 'string' ? col.label : String(col.key || '')}
                >
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {totalRows > 0 ? (
        <div className="table-pagination">
          <p className="table-meta">
            Showing {startRow}-{endRow} of {totalRows} records
          </p>
          <div className="table-pagination-controls">
            <button
              type="button"
              className="table-pagination-button"
              onClick={() =>
                setCurrentPage((previousPage) => Math.max(Math.min(previousPage, totalPages) - 1, 1))
              }
              disabled={activePage === 1}
            >
              Previous
            </button>
            <span className="table-pagination-page">
              Page {activePage} of {totalPages}
            </span>
            <button
              type="button"
              className="table-pagination-button"
              onClick={() =>
                setCurrentPage((previousPage) => Math.min(Math.min(previousPage, totalPages) + 1, totalPages))
              }
              disabled={activePage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
