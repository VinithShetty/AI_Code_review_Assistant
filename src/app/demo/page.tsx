import type { Metadata } from 'next';
import DemoExperience from '@/components/demo/DemoExperience';

export const metadata: Metadata = {
  title: 'Interactive Demo | CodeReview AI',
  description:
    'Explore a guided sample pull-request review and see how CodeReview AI turns a real code diff into prioritized, actionable feedback.',
};

export default function DemoPage() {
  return <DemoExperience />;
}
