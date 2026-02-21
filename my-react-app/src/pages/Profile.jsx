import * as React from 'react';
import { Navbar } from '@/components/Navbar';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext'; // ✅ CHANGED
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const Profile = () => {
  const { user, login } = useAuth(); // ✅ Get the 'login' function

  // --- Profile Form State ---
  const [profileData, setProfileData] = React.useState({ name: '', email: '', phone: '' });
  const [isSubmittingProfile, setIsSubmittingProfile] = React.useState(false);
  const [profileMessage, setProfileMessage] = React.useState({ type: '', content: '' });

  // ... (Password Form State remains the same) ...
  const [passwordData, setPasswordData] = React.useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSubmittingPassword, setIsSubmittingPassword] = React.useState(false);
  const [passwordMessage, setPasswordMessage] = React.useState({ type: '', content: '' });


  // Populate the profile form once the user data is loaded
  React.useEffect(() => {
    if (user) {
      setProfileData({
        name: user.username || user.name || '', // ✅ Use 'username' from user object
        email: user.email || '',
        phone: user.phone || '', // This field will be ignored by backend, but that's ok
      });
    }
  }, [user]);

  if (!user) {
    return null; // Or a loading spinner
  }

  // --- Event Handlers ---
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  // --- ✅ FIXED Profile form submission ---
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingProfile(true);
    setProfileMessage({ type: '', content: '' });

    const token = localStorage.getItem('access_token');
    if (!token) {
        setProfileMessage({ type: 'error', content: 'You are not logged in.' });
        setIsSubmittingProfile(false);
        return;
    }

    try {
      // --- REAL API CALL ---
      const response = await fetch('http://127.0.0.1:8000/api/profile/', {
        method: 'PATCH', // Use PATCH for partial updates
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: profileData.name, // This maps to 'username' on the backend
          email: profileData.email
          // 'phone' is sent but will be safely ignored by the serializer
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        let msg = 'Failed to update profile.';
        if (errorData.email) msg = `Email: ${errorData.email[0]}`;
        if (errorData.name) msg = `Name: ${errorData.name[0]}`; // 'name' is what we sent
        throw new Error(msg);
      }

      // --- Success ---
      const updatedUser = await response.json();
      
      // ✅ CRITICAL STEP: Update the user in your React app
      // This will update the Navbar and Avatar header
      login(updatedUser); 
      
      setProfileMessage({ type: 'success', content: 'Profile updated successfully!' });

    } catch (error) {
      console.error(error);
      setProfileMessage({ type: 'error', content: error.message });
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  // --- ✅ FIXED Password form submission ---
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', content: "New passwords don't match." });
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setPasswordMessage({ type: 'error', content: 'Password must be at least 8 characters.' });
      return;
    }

    setIsSubmittingPassword(true);
    setPasswordMessage({ type: '', content: '' });

    const token = localStorage.getItem('access_token');
    if (!token) {
        setPasswordMessage({ type: 'error', content: 'You are not logged in.' });
        setIsSubmittingPassword(false);
        return;
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/api/change-password/', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = 'Failed to change password.';
        if (errorData.currentPassword) {
          errorMessage = errorData.currentPassword[0]; 
        } else if (errorData.newPassword) {
          errorMessage = errorData.newPassword[0];
        }
        throw new Error(errorMessage);
      }

      setPasswordMessage({ type: 'success', content: 'Password changed successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });

    } catch (error) {
      console.error(error);
      setPasswordMessage({ type: 'error', content: error.message });
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  // Helper for Avatar Fallback
  const getInitials = (name) => {
    // Use user.username as it's the real "name"
    const nameToUse = user.username || user.name || 'User'; 
    return nameToUse?.split(' ').map(n => n[0]).join('').toUpperCase() || '';
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <main className="flex-1 p-6">
            <div className="max-w-3xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-bold">Account Settings</h1>
                <p className="text-muted-foreground">Manage your account and password</p>
              </div>

              {/* --- Card 1: Edit Profile --- */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile</CardTitle>
                  <CardDescription>Update your personal information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar/Name Header (from your original code) */}
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={user.avatar} alt={user.username} />
                      <AvatarFallback className="text-2xl">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      {/* ✅ Use user.username here */}
                      <h3 className="text-2xl font-semibold">{user.username}</h3>
                      <Badge variant="outline" className="mt-1">
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    </div>
                  </div>

                  {/* Profile Edit Form */}
                  <form onSubmit={handleProfileSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={profileData.name}
                        onChange={handleProfileChange}
                        placeholder="Your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={profileData.email}
                        onChange={handleProfileChange}
                        placeholder="your@email.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone (Optional)</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleProfileChange}
                        placeholder="Your phone number (not saved)"
                      />
                    </div>
                    
                    {profileMessage.content && (
                      <p className={profileMessage.type === 'error' ? 'text-sm text-red-600' : 'text-sm text-green-600'}>
                        {profileMessage.content}
                      </p>
                    )}

                    <Button type="submit" disabled={isSubmittingProfile}>
                      {isSubmittingProfile ? "Saving..." : "Save Changes"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* --- Card 2: Change Password --- */}
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Set a new password for your account.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                    </div>
                    
                    {passwordMessage.content && (
                      <p className={passwordMessage.type === 'error' ? 'text-sm text-red-600' : 'text-sm text-green-600'}>
                        {passwordMessage.content}
                      </p>
                    )}

                    <Button type="submit" disabled={isSubmittingPassword}>
                      {isSubmittingPassword ? "Updating..." : "Update Password"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Profile;