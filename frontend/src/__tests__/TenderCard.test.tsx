import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TenderCard } from '../components/TenderCard';
import type { Tender } from '../types';

const baseTender: Tender = {
  id: 't1',
  title: 'Supply Office Equipment',
  description: 'Looking for a vendor to supply office chairs and desks',
  referenceNumber: 'TND-2024-001',
  categoryId: 'c1',
  organizationId: 'org1',
  budgetMin: 10000,
  budgetMax: 50000,
  deadline: new Date(Date.now() + 10 * 86400000).toISOString(),
  status: 'OPEN',
  location: 'Addis Ababa',
  requirements: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  categoryName: 'Office Supplies',
  categorySlug: 'office-supplies',
  organizationName: 'Ministry of Education',
  bidCount: 5,
};

const renderCard = (tender: Tender = baseTender) =>
  render(
    <MemoryRouter>
      <TenderCard tender={tender} />
    </MemoryRouter>
  );

describe('TenderCard', () => {
  it('renders tender title', () => {
    renderCard();
    expect(screen.getByText('Supply Office Equipment')).toBeDefined();
  });

  it('renders reference number', () => {
    renderCard();
    expect(screen.getByText('TND-2024-001')).toBeDefined();
  });

  it('renders organization name', () => {
    renderCard();
    expect(screen.getByText('Ministry of Education')).toBeDefined();
  });

  it('renders category name', () => {
    renderCard();
    expect(screen.getByText('Office Supplies')).toBeDefined();
  });

  it('renders bid count', () => {
    renderCard();
    expect(screen.getByText('5 bids')).toBeDefined();
  });

  it('renders location when present', () => {
    renderCard();
    expect(screen.getByText('Addis Ababa')).toBeDefined();
  });

  it('renders status badge', () => {
    renderCard();
    expect(screen.getByText('OPEN')).toBeDefined();
  });

  it('renders description text', () => {
    renderCard();
    expect(
      screen.getByText('Looking for a vendor to supply office chairs and desks')
    ).toBeDefined();
  });

  it('links to tender detail page', () => {
    renderCard();
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('/tenders/t1');
  });

  it('formats budget range', () => {
    renderCard();
    expect(screen.getByText('$10,000 - $50,000')).toBeDefined();
  });

  it('shows days left for future deadline', () => {
    renderCard();
    const daysText = screen.getByText(/days? left/);
    expect(daysText).toBeDefined();
  });

  it('shows "Deadline passed" for past deadlines', () => {
    const pastTender = {
      ...baseTender,
      deadline: new Date('2020-01-01').toISOString(),
    };
    renderCard(pastTender);
    expect(screen.getByText('Deadline passed')).toBeDefined();
  });

  it('does not render location when null', () => {
    const noLocationTender = { ...baseTender, location: null };
    renderCard(noLocationTender);
    expect(screen.queryByText('Addis Ababa')).toBeNull();
  });
});
