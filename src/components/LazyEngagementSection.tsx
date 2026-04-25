import { LazyLoadWrapper, LoadingFallback } from './LazyLoadWrapper';
import { lazyWithRetry } from '../utils/lazyLoad';

const EngagementSection = lazyWithRetry(() => import('./EngagementSection'));

const LazyEngagementSection = ({ letterId, title }: { letterId: number; title: string }) => {
  return (
    <LazyLoadWrapper fallback={<LoadingFallback variant="skeleton" height={140} />}>
      <EngagementSection letterId={letterId} title={title} />
    </LazyLoadWrapper>
  );
};

export default LazyEngagementSection;
