import React from 'react';
import DashboardLayout from './DashboardLayout';
import { Home, Users, Building, ShieldAlert, Settings, Activity, BarChart3 } from 'lucide-react';

const AdminLayout = () => {
  const navigationParams = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: Home },
    { name: 'Manage Users', path: '/admin/users', icon: Users },
    { name: 'Moderation', path: '/admin/moderation', icon: ShieldAlert }
  ];

  return <DashboardLayout navigationParams={navigationParams} />;
};

export default AdminLayout;
