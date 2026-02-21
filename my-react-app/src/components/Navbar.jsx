import React, { useState, useEffect } from 'react';
import { Bell, LogOut, User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns'; // For pretty dates

export const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // --- 1. State for notifications ---
  const [notifications, setNotifications] = useState([]);

  // --- 2. Fetch notifications ---
  const fetchNotifications = async () => {
    const token = localStorage.getItem('access_token');
    if (!token || !user) return;

    try {
      const res = await fetch('http://127.0.0.1:8000/api/notifications/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  // --- 3. Fetch on mount and when user changes ---
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // --- 4. Function to mark all as read ---
  const handleMarkAsRead = async () => {
    const token = localStorage.getItem('access_token');
    try {
      await fetch('http://127.0.0.1:8000/api/notifications/mark-read/', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      // Optimistically update the UI
      setNotifications(
        notifications.map((n) => ({ ...n, read: true }))
      );
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  // --- 5. Calculate unread count ---
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Safe name handling
  const userName = user?.name || user?.username || user?.email || 'User';
  const userInitials = userName
    ? userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="flex h-16 items-center px-4">
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 md:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">CC</span>
          </div>
          <span className="text-xl font-bold hidden sm:inline-block">
            Civil Complaints
          </span>
        </div>

        <div className="ml-auto flex items-center space-x-4">
          {/* 🔔 Notifications */}
          <DropdownMenu onOpenChange={(open) => {
            // --- 6. When dropdown opens, mark as read ---
            if (open && unreadCount > 0) {
              handleMarkAsRead();
            }
          }}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {/* --- 7. Use dynamic unread count --- */}
                {unreadCount > 0 && (
                  <Badge
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center"
                    variant="destructive"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-80 overflow-y-auto">
                {/* --- 8. Render dynamic notifications --- */}
                {notifications.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">
                    No new notifications.
                  </p>
                ) : (
                  notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className="flex flex-col items-start p-4 cursor-pointer"
                      onClick={() => {
                        // Navigate to the specific complaint if it exists
                        if (notification.complaint_id) {
                            navigate(`/complaint/${notification.complaint_id}`);
                        }
                      }}
                    >
                      <p className="text-sm font-medium whitespace-normal">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 👤 User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar || ''} alt={userName} />
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
                <span className="hidden md:inline-block">{userName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};