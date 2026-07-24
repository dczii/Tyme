'use client';

import FeedbackView from '@/components/FeedbackView';
import { useTyme } from '../../providers';

export default function FeedbackPage() {
  const { user, handleSubmitFeedback } = useTyme();

  if (!user) return null;

  return <FeedbackView user={user} onSubmitFeedback={handleSubmitFeedback} />;
}
