import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

test('does not carry yesterday checkbox values into today', async () => {
  let savedPayload;
  window.alert = jest.fn();
  global.fetch = jest.fn((url, options = {}) => {
    if (options.method === 'POST') {
      savedPayload = JSON.parse(options.body);
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }

    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(url.endsWith('/records')
        ? [
          {
            date: '2026-10-14',
            entries: {
              tablet1: { label: 'Tablet 1', type: 'checkbox', value: true },
              tablet2: { label: 'Tablet 2', type: 'checkbox', value: true },
              capsule1: { label: 'Capsule 1', type: 'checkbox', value: true },
            },
          },
          {
            date: '2026-10-15',
            entries: { tablet1: { label: 'Tablet 1', type: 'checkbox', value: true } },
          },
        ]
        : []),
    });
  });

  const { container } = render(<App />);
  await screen.findByText(/daily tracker/i);
  fireEvent.change(container.querySelector('input[type="date"]'), { target: { value: '2026-10-15' } });

  const tabletOneCard = screen.getByText('Tablet 1', { selector: 'strong' }).closest('.event-card');
  await waitFor(() => expect(tabletOneCard.querySelector('input[type="checkbox"]').checked).toBe(true));
  fireEvent.click(tabletOneCard.querySelector('input[type="checkbox"]'));
  fireEvent.click(screen.getByRole('button', { name: 'Submit day' }));

  await waitFor(() => expect(savedPayload).toBeDefined());
  expect(savedPayload.entries.tablet1.value).toBe(false);
  expect(savedPayload.entries.tablet2).toBeUndefined();
  expect(savedPayload.entries.capsule1).toBeUndefined();
});
