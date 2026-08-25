import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Toaster, toast } from '../Toast';

describe('Toast', () => {
  it('renders a toast emitted through the public toast API', async () => {
    render(<Toaster />);
    toast({ title: 'Saved', description: 'Order updated' });
    await waitFor(() => {
      expect(screen.getByText('Saved')).toBeVisible();
      expect(screen.getByText('Order updated')).toBeVisible();
    });
  });
});
