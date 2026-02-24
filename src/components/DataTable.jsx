export default function DataTable({ columns, rows, onRowClick }) {
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
          {rows.map((row, index) => (
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
    </div>
  )
}
