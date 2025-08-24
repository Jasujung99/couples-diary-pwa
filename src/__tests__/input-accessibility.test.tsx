import React from 'react';
import { render, screen } from '@testing-library/react';
import { Input } from '@/components/ui/Input';

describe('Input Accessibility', () => {
  it('should render with label and helper text', () => {
    render(
      <Input
        label="Email"
        helperText="We'll never share your email"
        placeholder="Enter your email"
      />
    );
    
    const input = screen.getByLabelText('Email');
    const helperText = screen.getByText("We'll never share your email");
    
    expect(input).toBeInTheDocument();
    expect(helperText).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-describedby');
  });

  it('should show error message when error is true', () => {
    render(
      <Input
        label="Password"
        error={true}
        errorMessage="Password is required"
        placeholder="Enter password"
      />
    );
    
    const input = screen.getByLabelText(/Password/);
    const errorMessage = screen.getByText('Password is required');
    
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(errorMessage).toHaveAttribute('role', 'alert');
  });

  it('should show required indicator', () => {
    render(
      <Input
        label="Username"
        required={true}
        placeholder="Enter username"
      />
    );
    
    const label = screen.getByText(/Username/);
    expect(label).toBeInTheDocument();
    
    // Check for required asterisk
    const asterisk = screen.getByText('*');
    expect(asterisk).toBeInTheDocument();
  });

  it('should have proper ARIA attributes', () => {
    render(
      <Input
        label="Search"
        helperText="Search for items"
        placeholder="Type to search"
        required={true}
      />
    );
    
    const input = screen.getByLabelText(/Search/);
    
    expect(input).toHaveAttribute('aria-describedby');
    expect(input).toHaveAttribute('aria-label');
    expect(input).toHaveAttribute('required');
  });
});