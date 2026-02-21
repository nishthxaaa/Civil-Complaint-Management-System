import { loginUser } from "../lib/api";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  // --- State for Login ---
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  
  // --- State for Sign Up ---
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPassword2, setRegPassword2] = useState("");
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);

  // --- Hooks ---
  const [activeTab, setActiveTab] = useState("signin");
  const [uiRole, setUiRole] = useState("citizen"); // For the inner tabs
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  // --- Sign In Handler (Works for all roles) ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoginLoading(true);

    try {
      const user = await loginUser(loginEmail, loginPassword,uiRole);

      localStorage.setItem("user", JSON.stringify(user));

      toast({
        title: "Login Successful",
        description: `Welcome ${user.username || user.email}`,
      });
      login(user);

      // Redirect based on real backend role
      if (user.role === "admin") {
        navigate("/admin-dashboard");
      } else if (user.role === "department") {
        navigate("/department-dashboard");
      } else {
        navigate("/dashboard");
      }

    } catch (error) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoginLoading(false);
    }
  };

  // --- Sign Up Handler ---
  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (regPassword !== regPassword2) {
      toast({ title: "Registration Failed", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    
    setIsRegisterLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: regName,
          email: regEmail,
          password: regPassword,
          password2: regPassword2,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        let msg = "Registration failed. Please try again.";
        if (errorData.email) msg = errorData.email[0];
        if (errorData.password) msg = errorData.password[0];
        if (errorData.username) msg = errorData.username[0];
        throw new Error(msg);
      }

      toast({
        title: "Registration Successful",
        description: "Please sign in to continue.",
      });
      
      setRegName("");
      setRegEmail("");
      setRegPassword("");
      setRegPassword2("");
      setActiveTab("signin"); // Switch back to sign-in tab

    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRegisterLoading(false);
    }
  };

  // --- Helper to update Card Description ---
  const getDescription = () => {
    if (activeTab === 'signup') {
      return "Create a new citizen account";
    }
    // activeTab is 'signin'
    if (uiRole === 'citizen') {
      return "Sign in to your Citizen account";
    }
    if (uiRole === 'department') {
      return "Sign in as a Department user";
    }
    if (uiRole === 'admin') {
      return "Sign in as a System Administrator";
    }
    return "Sign in to access your account";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-lg bg-primary flex items-center justify-center mb-4">
            <span className="text-primary-foreground font-bold text-xl">CC</span>
          </div>
          <CardTitle className="text-2xl">Civil Complaint Management</CardTitle>
          <CardDescription>
            {getDescription()}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* --- 1. OUTER TABS (Sign In / Sign Up) --- */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {/* --- "SIGN IN" CONTENT --- */}
            <TabsContent value="signin">
              {/* --- 2. INNER TABS (Citizen / Dept / Admin) --- */}
              <Tabs value={uiRole} onValueChange={setUiRole} className="w-full">
                
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="citizen">Citizen</TabsTrigger>
                  <TabsTrigger value="department">Department</TabsTrigger>
                  <TabsTrigger value="admin">Admin</TabsTrigger>
                </TabsList>

                {/* This single form will be used for all 3 inner tabs */}
                <form onSubmit={handleLogin} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full mt-2" disabled={isLoginLoading}>
                    {isLoginLoading ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
                
                {/* We render 3 identical <TabsContent> to make the tabs work, 
                    but they all share the same form and state. */}
                <TabsContent value="citizen"></TabsContent>
                <TabsContent value="department"></TabsContent>
                <TabsContent value="admin"></TabsContent>

              </Tabs>
            </TabsContent>
            
            {/* --- "SIGN UP" CONTENT --- */}
            <TabsContent value="signup">
              <form onSubmit={handleRegister} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-name">Full Name</Label>
                  <Input
                    id="reg-name"
                    placeholder="Enter your full name"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="Enter your email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    placeholder="Minimum 8 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password2">Confirm Password</Label>
                  <Input
                    id="reg-password2"
                    type="password"
                    placeholder="Repeat your password"
                    value={regPassword2}
                    onChange={(e) => setRegPassword2(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full mt-2" disabled={isRegisterLoading}>
                  {isRegisterLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>

          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;