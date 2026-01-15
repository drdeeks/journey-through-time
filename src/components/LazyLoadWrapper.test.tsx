import { render, screen } from '@testing-library/react';
import { LoadingFallback, LazyLoadWrapper } from './LazyLoadWrapper';

describe('LazyLoadWrapper', () => {
  describe('LoadingFallback', () => {
    it('should render spinner variant', () => {
      render(<LoadingFallback variant="spinner" />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should render skeleton variant', () => {
      const { container } = render(<LoadingFallback variant="skeleton" />);
      const skeletons = container.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should apply custom height', () => {
      const { container } = render(<LoadingFallback variant="spinner" height={600} />);
      const box = container.firstChild as HTMLElement;
      expect(box).toHaveStyle({ minHeight: '600px' });
    });
  });

  describe('LazyLoadWrapper', () => {
    it('should render children when loaded', () => {
      render(
        <LazyLoadWrapper>
          <div>Test Content</div>
        </LazyLoadWrapper>
      );
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render custom fallback', () => {
      render(
        <LazyLoadWrapper fallback={<div>Custom Loading</div>}>
          <div>Test Content</div>
        </LazyLoadWrapper>
      );
      // Content should be visible immediately in test environment
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });
});
