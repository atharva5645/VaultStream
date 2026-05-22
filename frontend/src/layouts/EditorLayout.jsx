import React from 'react';
import DashboardLayout from './DashboardLayout';
import { Home, UploadCloud, Film, BarChart2, Building2, Users, MailPlus, SlidersHorizontal } from 'lucide-react';

const EditorLayout = () => {
  const navigationParams = [
    { name: 'Dashboard', path: '/editor/dashboard', icon: Home },
    { name: 'Upload Video', path: '/editor/upload', icon: UploadCloud },
    { name: 'Library', path: '/editor/library', icon: Film }
  ];

  return <DashboardLayout navigationParams={navigationParams} />;
};

export default EditorLayout;
