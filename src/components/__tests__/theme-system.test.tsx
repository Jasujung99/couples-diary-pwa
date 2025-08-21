/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { Button, Card, Input } from '@/components/ui';

// Mock component to test theme context
function TestComponent() {
  const { mode, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-mode">{mode}</span>
      <button data-testid="toggle-theme" onClick={toggleTheme}>
        Toggle
      </button>
    </div>
  );
}

describe('Theme System', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  it('provides theme context correctly', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-mode')).toHaveTextContent('light');
  });

  it('toggles theme correctly', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const toggleButton = screen.getByTestId('toggle-theme');
    const themeMode = screen.getByTestId('theme-mode');

    expect(themeMode).toHaveTextContent('light');
    
    fireEvent.click(toggleButton);
    expect(themeMode).toHaveTextContent('dark');
  });

  it('renders Button component correctly', () => {
    render(
      <ThemeProvider>
        <Button>Test Button</Button>
      </ThemeProvider>
    );

    expect(screen.getByRole('button')).toHaveTextContent('Test Button');
  });

  it('renders Card component correctly', () => {
    render(
      <ThemeProvider>
        <Card>Test Card Content</Card>
      </ThemeProvider>
    );

    expect(screen.getByText('Test Card Content')).toBeInTheDocument();
  });

  it('renders Input component correctly', () => {
    render(
      <ThemeProvider>
        <Input placeholder="Test input" />
      </ThemeProvider>
    );

    expect(screen.getByPlaceholderText('Test input')).toBeInTheDocument();
  });
});