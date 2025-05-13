import React from 'react';
import './Table.css';

/**
 * Reusable Table component for displaying tabular data
 * 
 * @param {Object} props - Component props
 * @param {Array} props.columns - Array of column definitions {id, label, render, className}
 * @param {Array} props.data - Array of data objects to display
 * @param {String} props.className - Optional additional CSS class for the table
 * @param {Function} props.keyExtractor - Function to extract a unique key from each row
 * @param {Function} props.rowClassName - Optional function to get class name for a row
 * @param {String} props.emptyMessage - Message to display when data is empty
 * @param {Number} props.colSpan - Number of columns for empty message row
 */
const Table = ({
  columns,
  data,
  className = '',
  keyExtractor = (item) => item.id,
  rowClassName = () => '',
  emptyMessage = 'No data available',
  colSpan = 0
}) => {
  // Determine actual colSpan (use columns length if not specified)
  const actualColSpan = colSpan || columns.length;

  return (
    <div className={`table-container ${className}`}>
      <table className="common-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th 
                key={column.id} 
                className={column.className || ''}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data && data.length > 0 ? (
            data.map((item) => {
              // Skip null or undefined items
              if (!item) return null;
              
              return (
                <tr 
                  key={keyExtractor(item)} 
                  className={rowClassName(item)}
                >
                  {columns.map((column) => (
                    <td 
                      key={`${keyExtractor(item)}-${column.id}`}
                      className={column.className || ''}
                    >
                      {column.render(item)}
                    </td>
                  ))}
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={actualColSpan} className="empty-message">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;