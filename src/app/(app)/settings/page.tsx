'use client';

import SettingsView from '@/components/SettingsView';
import { useTyme } from '../../providers';

export default function SettingsPage() {
  const {
    projects,
    tags,
    entries,
    handleAddProject,
    handleUpdateProject,
    handleDeleteProject,
    handleAddTag,
    handleDeleteTag,
    workdayTargetHours,
    saveTargetHours,
    hourlyRate,
    saveHourlyRate,
    logoStyle,
    saveLogoStyle,
    user,
    handleLogout,
    contacts,
  } = useTyme();

  if (!user) return null;

  return (
    <SettingsView
      projects={projects}
      tags={tags}
      entries={entries}
      onAddProject={handleAddProject}
      onUpdateProject={handleUpdateProject}
      onDeleteProject={handleDeleteProject}
      onAddTag={handleAddTag}
      onDeleteTag={handleDeleteTag}
      workdayTargetHours={workdayTargetHours}
      onUpdateTargetHours={saveTargetHours}
      hourlyRate={hourlyRate}
      onUpdateHourlyRate={saveHourlyRate}
      logoStyle={logoStyle}
      onLogoStyleChange={saveLogoStyle}
      user={user}
      onLogout={handleLogout}
      contacts={contacts}
    />
  );
}
