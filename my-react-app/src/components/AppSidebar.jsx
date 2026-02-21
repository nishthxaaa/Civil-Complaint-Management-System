import React from 'react'; // Add this line at the top of your file
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Search,
  PlusCircle,
  MessageSquare,
  Users,
  BarChart3,
  Settings,
  Building2,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";

export const AppSidebar = () => {
  const { state } = useSidebar();
  const { user } = useAuth();
  const collapsed = state === 'collapsed';

  // Define items based on the user's role
  const citizenItems = [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'My Complaints', url: '/my-complaints', icon: FileText },
    //{ title: 'Track Complaint', url: '/track', icon: Search },
    { title: 'Submit Complaint', url: '/submit', icon: PlusCircle },
    //{ title: 'Feedback', url: '/my-complaints', icon: MessageSquare },
  ];

 const adminItems = [
  { title: 'Admin Dashboard', url: '/admin-dashboard', icon: LayoutDashboard },
  { title: 'All Complaints', url: '/admin-dashboard/complaints', icon: FileText },
  { title: 'Assign Complaints', url: '/admin-dashboard/assign', icon: Building2 },
  // { title: 'User Management', url: '/admin-dashboard/users', icon: Users },
  // { title: 'Settings', url: '/admin-dashboard/settings', icon: Settings },
];


  const departmentItems = [
    { title: 'Department Dashboard', url: '/department-dashboard', icon: Building2 },
    { title: 'Assigned Complaints', url: '/department/complaints', icon: FileText },
    { title: 'Reports', url: '/department/reports', icon: BarChart3 },
  ];

  const items = user?.role === 'admin' ? adminItems : user?.role === 'department' ? departmentItems : citizenItems;

  return (
    <Sidebar className={collapsed ? 'w-14' : 'w-64'}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {user?.role === 'admin' ? 'Admin Menu' : user?.role === 'department' ? 'Department Menu' : 'Main Menu'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
                      }
                    >
                      {React.createElement(item.icon, { className: "h-4 w-4" })}
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
