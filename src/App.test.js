import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

test('renders the daily tracker heading', async () => {
  global.fetch = jest.fn(() => Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
  }));

  render(<App />);
  expect(await screen.findByText(/daily tracker/i)).toBeInTheDocument();
});

test('renders custom events returned without an id field', async () => {
  global.fetch = jest.fn((url) => Promise.resolve({
    ok: true,
    json: () => Promise.resolve(url.endsWith('/custom-events')
      ? [{ _id: 'mongo-id', label: 'Evening walk', type: 'checkbox', recurrenceType: 'daily' }]
      : []),
  }));

  render(<App />);

  await waitFor(() => {
    expect(screen.getByText('Evening walk', { selector: 'strong' })).toBeInTheDocument();
  });
});
