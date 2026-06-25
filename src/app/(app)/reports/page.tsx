'use client';

import ReportsView from '@/components/ReportsView';
import { useTyme } from '../../providers';

export default function ReportsPage() {
  const {
    entries,
    projects,
    tags,
    handleDeleteEntry,
    handleAddEntry,
    hourlyRate,
  } = useTyme();

  return (
    <ReportsView
      entries={entries}
      projects={projects}
      tags={tags}
      onDeleteEntry={handleDeleteEntry}
      onDuplicateEntry={handleAddEntry}
      hourlyRate={hourlyRate}
    />
  );
}
