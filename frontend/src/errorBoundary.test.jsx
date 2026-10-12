import React, { useState } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from './components/common/ErrorBoundary';

function FaultyComponent({ shouldThrow }) {
  if (shouldThrow) {
    throw new Error('Test render crash simulation');
  }
  return <div>Healthy Component Content</div>;
}

function WrapperWithState() {
  const [shouldThrow, setShouldThrow] = useState(true);
  return (
    <ErrorBoundary onRetry={() => setShouldThrow(false)}>
      <FaultyComponent shouldThrow={shouldThrow} />
    </ErrorBoundary>
  );
}

describe('Task 3: ErrorBoundary Component Tests', () => {
  let originalError;

  beforeEach(() => {
    originalError = console.error;
    console.error = vi.fn(); // Suppress React error boundary log in test output
  });

  afterEach(() => {
    console.error = originalError;
    vi.restoreAllMocks();
  });

  it('1. Renders children normally when no error occurs', () => {
    render(
      <ErrorBoundary>
        <FaultyComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Healthy Component Content')).toBeDefined();
  });

  it('2. Catches render crash, shows friendly UI with Retry and logs error', () => {
    render(<WrapperWithState />);

    // Friendly error screen should be shown
    expect(screen.getByText('Something went wrong')).toBeDefined();
    expect(screen.getByText(/An unexpected error occurred while loading this page/i)).toBeDefined();
    expect(screen.getByText(/Test render crash simulation/i)).toBeDefined();

    // Verify console.error was called
    expect(console.error).toHaveBeenCalled();

    // Click Retry
    const retryBtn = screen.getByRole('button', { name: /Retry/i });
    fireEvent.click(retryBtn);

    // Component should recover
    expect(screen.getByText('Healthy Component Content')).toBeDefined();
  });
});
