import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';

function ThrowError() {
  throw new Error('boom');
}

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>ok-content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('ok-content')).toBeInTheDocument();
  });

  it('renders fallback UI when child throws', () => {
    render(
      <ErrorBoundary fallback={<div>fallback-content</div>}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('fallback-content')).toBeInTheDocument();
  });
});
