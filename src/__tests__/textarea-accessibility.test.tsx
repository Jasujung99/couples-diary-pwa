import React from 'react';
import { render, screen } from '@testing-library/react';
import { Textarea } from '@/components/ui/Textarea';

describe('Textarea Accessibility', () => {
  it('should render with label and helper text', () => {
    render(
      <Textarea
        label="Message"
        helperText="Enter your message here"
        placeholder="Type your message"
      />
    );
    
    const textarea = screen.getByLabelText('Message');
    const helperText = screen.getByText('Enter your message here');
    
    expect(textarea).toBeInTheDocument();
    expect(helperText).toBeInTheDocument();
    expect(textarea).toHaveAttribute('aria-describedby');
  });

  it('should show error message when error is true', () => {
    render(
      <Textarea
        label="Description"
        error={true}
        errorMessage="Description is required"
        placeholder="Enter description"
      />
    );
    
    const textarea = screen.getByLabelText(/Description/);
    const errorMessage = screen.getByText('Description is required');
    
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
    expect(errorMessage).toHaveAttribute('role', 'alert');
  });

  it('should show required indicator', () => {
    render(
      <Textarea
        label="Comments"
        required={true}
        placeholder="Enter comments"
      />
    );
    
    const label = screen.getByText(/Comments/);
    expect(label).toBeInTheDocument();
    
    // Check for required asterisk
    const asterisk = screen.getByText('*');
    expect(asterisk).toBeInTheDocument();
  });

  it('should have proper ARIA attributes', () => {
    render(
      <Textarea
        label="Feedback"
        helperText="Share your thoughts"
        placeholder="Type your feedback"
        required={true}
      />
    );
    
    const textarea = screen.getByLabelText(/Feedback/);
    
    expect(textarea).toHaveAttribute('aria-describedby');
    expect(textarea).toHaveAttribute('aria-label');
    expect(textarea).toHaveAttribute('required');
  });
});