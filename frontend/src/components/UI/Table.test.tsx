import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Table, Column } from './Table';

interface TestData {
  id: number;
  name: string;
  email: string;
  status: string;
}

describe('Table Component', () => {
  const mockData: TestData[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'inactive' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'active' },
  ];

  const columns: Column<TestData>[] = [
    { key: 'name', title: 'Name' },
    { key: 'email', title: 'Email' },
    { key: 'status', title: 'Status' },
  ];

  describe('Rendering', () => {
    it('should render table with data', () => {
      render(<Table columns={columns} data={mockData} />);

      // Check headers
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();

      // Check data
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
      expect(screen.getByText('active')).toBeInTheDocument();
    });

    it('should render empty state when no data', () => {
      render(<Table columns={columns} data={[]} />);

      expect(screen.getByText(/không có dữ liệu/i)).toBeInTheDocument();
    });

    it('should show loading skeleton', () => {
      render(<Table columns={columns} data={[]} loading={true} />);

      // Should show skeleton rows
      const skeletonRows = screen.getAllByRole('row').slice(1); // Skip header
      expect(skeletonRows.length).toBeGreaterThan(0);
    });

    it('should show error state', () => {
      const errorMessage = 'Failed to load data';
      render(<Table columns={columns} data={[]} error={errorMessage} />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should show retry button on error', () => {
      const onRetry = vi.fn();
      render(
        <Table
          columns={columns}
          data={[]}
          error="Error occurred"
          onRetry={onRetry}
        />
      );

      const retryButton = screen.getByRole('button', { name: /thử lại/i });
      expect(retryButton).toBeInTheDocument();
    });
  });

  describe('Custom Rendering', () => {
    it('should use custom render function', () => {
      const customColumns: Column<TestData>[] = [
        {
          key: 'status',
          title: 'Status',
          render: (value) => (
            <span className={value === 'active' ? 'active-badge' : 'inactive-badge'}>
              {value}
            </span>
          ),
        },
      ];

      render(<Table columns={customColumns} data={mockData} />);

      const badges = screen.getAllByText('active');
      expect(badges[0].parentElement).toHaveClass('active-badge');
    });

    it('should use custom renderHeader function', () => {
      const customColumns: Column<TestData>[] = [
        {
          key: 'name',
          title: 'Name',
          renderHeader: () => <span data-testid="custom-header">Custom Name Header</span>,
        },
      ];

      render(<Table columns={customColumns} data={mockData} />);

      expect(screen.getByTestId('custom-header')).toBeInTheDocument();
      expect(screen.getByText('Custom Name Header')).toBeInTheDocument();
    });
  });

  describe('Row Interaction', () => {
    it('should call onRowClick when row is clicked', async () => {
      const user = userEvent.setup();
      const onRowClick = vi.fn();

      render(
        <Table columns={columns} data={mockData} onRowClick={onRowClick} />
      );

      const firstRow = screen.getByText('John Doe').closest('tr');
      if (firstRow) {
        await user.click(firstRow);
      }

      expect(onRowClick).toHaveBeenCalledWith(mockData[0]);
    });

    it('should add hover class to clickable rows', () => {
      const onRowClick = vi.fn();
      render(
        <Table columns={columns} data={mockData} onRowClick={onRowClick} />
      );

      const firstRow = screen.getByText('John Doe').closest('tr');
      expect(firstRow).toHaveClass('cursor-pointer');
    });
  });

  describe('Sorting', () => {
    it('should show sort icon for sortable columns', () => {
      const sortableColumns: Column<TestData>[] = [
        { key: 'name', title: 'Name', sortable: true },
        { key: 'email', title: 'Email', sortable: false },
      ];

      render(<Table columns={sortableColumns} data={mockData} />);

      // Name column should be sortable
      const nameHeader = screen.getByText('Name').closest('th');
      expect(nameHeader).toHaveAttribute('role', 'button');
    });

    it('should call onSort when sortable column is clicked', async () => {
      const user = userEvent.setup();
      const onSort = vi.fn();

      const sortableColumns: Column<TestData>[] = [
        { key: 'name', title: 'Name', sortable: true, onSort },
      ];

      render(<Table columns={sortableColumns} data={mockData} />);

      const nameHeader = screen.getByText('Name').closest('th');
      if (nameHeader) {
        await user.click(nameHeader);
      }

      expect(onSort).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<Table columns={columns} data={mockData} />);

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      const headers = screen.getAllByRole('columnheader');
      expect(headers).toHaveLength(columns.length);

      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(0);
    });

    it('should have accessible retry button', () => {
      const onRetry = vi.fn();
      render(
        <Table
          columns={columns}
          data={[]}
          error="Error"
          onRetry={onRetry}
        />
      );

      const retryButton = screen.getByRole('button', { name: /thử lại/i });
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).toHaveAccessibleName();
    });
  });

  describe('Performance', () => {
    it('should handle large datasets', () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        status: i % 2 === 0 ? 'active' : 'inactive',
      }));

      const { container } = render(<Table columns={columns} data={largeData} />);

      const rows = container.querySelectorAll('tbody tr');
      expect(rows.length).toBe(1000);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty columns array', () => {
      render(<Table columns={[]} data={mockData} />);

      // Should still render table structure
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should handle undefined values in data', () => {
      const dataWithUndefined: TestData[] = [
        { id: 1, name: 'John', email: 'john@example.com', status: 'active' },
        { id: 2, name: '', email: '', status: '' },
      ];

      render(<Table columns={columns} data={dataWithUndefined} />);

      expect(screen.getByText('John')).toBeInTheDocument();
    });

    it('should handle null data prop', () => {
      render(<Table columns={columns} data={null as any} />);

      expect(screen.getByText(/không có dữ liệu/i)).toBeInTheDocument();
    });
  });
});
