import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { AppSidebar } from '@/components/AppSidebar';
import { StatsCard } from '@/components/StatsCard';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Clock, CheckCircle2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useToast } from '@/hooks/use-toast';

const DepartmentReports = () => {
  const { toast } = useToast();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- NORMALIZE FUNCTION ---
  const normalizeComplaint = (c) => ({
    ...c,
    status: c.status?.toLowerCase().replace(' ', '-'),
    priority: c.priority?.toLowerCase(),
    category: c.category?.toLowerCase().replace(' ', '-'),
  });

  // --- DATA FETCHING ---
  const fetchDepartmentComplaints = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch("http://127.0.0.1:8000/api/complaints/department/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setComplaints(data.map(normalizeComplaint));
      } else {
        toast({ title: "Error fetching complaints", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Network Error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartmentComplaints();
  }, []);

  // --- CALCULATE STATS ---
  const stats = {
    total: complaints.length,
    inProgress: complaints.filter(c => ['in-progress', 'assigned'].includes(c.status)).length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
  };

  // --- PREPARE CHART DATA ---
  const statusData = [
    { name: "Pending/Assigned", value: stats.total - stats.inProgress - stats.resolved, color: "#fbbf24" },
    { name: "In Progress", value: stats.inProgress, color: "#3b82f6" },
    { name: "Resolved", value: "resolved" ? stats.resolved : 0, color: "#22c55e" },
  ].filter(item => item.value > 0); // Only show sections with data

  const categoryData = [
    { name: "Road Damage", value: complaints.filter(c => c.category === "road-damage").length },
    { name: "Water Supply", value: complaints.filter(c => c.category === "water-supply").length },
    { name: "Streetlight", value: complaints.filter(c => c.category === "streetlight").length },
    { name: "Garbage", value: complaints.filter(c => c.category === "garbage").length },
    { name: "Drainage", value: complaints.filter(c => c.category === "drainage").length },
    { name: "Other", value: complaints.filter(c => c.category === "other").length },
  ].filter(item => item.value > 0); // Only show categories with data

  // --- LOADING UI ---
  if (loading) {
    return (
       <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <Navbar />
            <main className="flex-1 p-6">
              <h1 className="text-3xl font-bold">Loading reports...</h1>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <main className="flex-1 p-6 space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Department Reports</h1>
              <p className="text-muted-foreground">Analytics for your assigned complaints</p>
            </div>
            
            {/* --- STATS CARDS --- */}
            <div className="grid gap-4 md:grid-cols-3">
              <StatsCard
                title="Total Assigned"
                value={stats.total}
                icon={FileText}
              />
              <StatsCard
                title="In Progress"
                value={stats.inProgress}
                icon={Clock}
              />
              <StatsCard
                title="Resolved"
                value={stats.resolved}
                icon={CheckCircle2}
                variant="success"
              />
            </div>

            {/* --- CHARTS --- */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Complaints by Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Complaints by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DepartmentReports;