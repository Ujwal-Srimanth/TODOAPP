import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the daily tracker heading', () => {
  render(<App />);
  expect(screen.getByText(/daily tracker/i)).toBeInTheDocument();
});
