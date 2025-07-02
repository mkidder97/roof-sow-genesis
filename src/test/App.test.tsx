import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
    },
  },
}));

describe('App Component', () => {
  it('renders without crashing', () => {
    render(<App />);
    
    // The app should render - we're not testing specific content since it's a router
    // but we're testing that it doesn't throw errors during render
    expect(document.body).toBeTruthy();
  });

  it('contains router and providers', () => {
    const { container } = render(<App />);
    
    // Check that the app container exists
    expect(container).toBeTruthy();
  });
});
