import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Section } from '../Section';

describe('Section', () => {
  it('renders optional heading content and children', () => {
    render(<Section title="Account" description="Profile" actions={<button>Edit</button>}>Fields</Section>);
    expect(screen.getByRole('heading', { name: 'Account' })).toBeVisible();
    expect(screen.getByText('Fields')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeVisible();
  });
});
