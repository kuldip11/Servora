import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Table } from '../Table';

type Row = { id: string; name: string; score: number };
const columns = [
  { id: 'name', header: 'Name', cell: (row: Row) => row.name, sortValue: (row: Row) => row.name, sortable: true },
  { id: 'score', header: 'Score', cell: (row: Row) => row.score },
];

describe('Table', () => {
  it('renders headers and rows', () => {
    render(<Table<Row> columns={columns} data={[{ id: '1', name: 'Alice', score: 10 }]} getRowId={(r) => r.id} />);
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeVisible();
    expect(screen.getByText('Alice')).toBeVisible();
  });
  it('sorts when a sortable header is activated', async () => {
    const user = userEvent.setup();
    render(<Table<Row> columns={columns} data={[{ id: '1', name: 'B', score: 2 }, { id: '2', name: 'A', score: 1 }]} getRowId={(r) => r.id} />);
    await user.click(screen.getByRole('button', { name: 'Name' }));
    const cells = screen.getAllByRole('cell');
    expect(cells.map((cell) => cell.textContent)).toContain('A');
  });
});
