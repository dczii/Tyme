'use client';

import CalendarView from '@/components/CalendarView';
import { useTyme } from '../../providers';

export default function CalendarPage() {
  const {
    entries,
    projects,
    tags,
    handleAddEntry,
    handleUpdateEntry,
    handleDeleteEntry,
    handleAddTag,
    theme,
  } = useTyme();

  return (
    <CalendarView
      entries={entries}
      projects={projects}
      tags={tags}
      onAddEntry={handleAddEntry}
      onUpdateEntry={handleUpdateEntry}
      onDeleteEntry={handleDeleteEntry}
      onAddProject={(name, color, client) => ({ id: 'proj-dummy', name, color, client })} // Singular project locked
      onAddTag={handleAddTag}
      theme={theme}
    />
  );
}
