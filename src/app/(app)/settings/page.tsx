'use client';

import SettingsView from '@/components/SettingsView';
import { useTyme } from '../../providers';

export default function SettingsPage() {
  const {
    projects,
    tags,
    handleUpdateSingleProject,
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
      onUpdateSingleProject={handleUpdateSingleProject}
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
