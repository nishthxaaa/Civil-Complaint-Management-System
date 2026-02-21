import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { AppSidebar } from '@/components/AppSidebar';
import { StatsCard } from '@/components/StatsCard';
import { SidebarProvider } from '@/components/ui/sidebar';
import { FileText, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { format, getMonth, getYear } from 'date-fns';

const AdminDashboard = () => {
  const { toast } = useToast();

  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [monthlyChartData, setMonthlyChartData] = useState([]);
  
  // ✅ Renamed state to hold department data
  const [departmentChartData, setDepartmentChartData] = useState([]); 

  const chartConfig = {
    complaints: { label: "Complaints", color: "hsl(var(--primary))" },
    resolved: { label: "Resolved", color: "hsl(var(--success))" },
    // We can add department colors here if we want, but "complaints" works fine
  };

  const fetchAllComplaints = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("http://127.0.0.1:8000/api/complaints/all/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        let data = await res.json();
        const normalizedData = data.map((c) => ({
          ...c,
          status: c.status?.toLowerCase().replace(" ", "-"),
          // department_name is now coming from our serializer
        }));

        // --- 1. Calculate Stats (Correct) ---
        const newStats = {
          total: normalizedData.length,
          pending: normalizedData.filter((c) => c.status === 'pending').length,
          inProgress: normalizedData.filter((c) =>
            ['in-progress', 'assigned'].includes(c.status)
          ).length,
          resolved: normalizedData.filter((c) => c.status === 'resolved').length,
        };
        setStats(newStats);

        // --- 2. Calculate Monthly Chart Data (Correct) ---
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const currentYear = getYear(new Date());
        const monthlyCounts = monthNames.map(month => ({
          month: month,
          complaints: 0,
          resolved: 0,
        }));
        
        normalizedData.forEach(complaint => {
          const complaintDate = new Date(complaint.created_at);
          if (getYear(complaintDate) === currentYear) {
            const monthIndex = getMonth(complaintDate);
            monthlyCounts[monthIndex].complaints += 1;
            if (complaint.status === 'resolved') {
              monthlyCounts[monthIndex].resolved += 1;
            }
          }
        });
        setMonthlyChartData(monthlyCounts);

        // --- ✅ 3. Calculate Department Chart Data ---
        const deptCounts = {}; // Use an object for flexible grouping
        
        normalizedData.forEach(complaint => {
          // Group by department_name. If it's null/undefined, call it "Unassigned"
          const deptName = complaint.department_name || "Unassigned"; 
          
          if (!deptCounts[deptName]) {
            deptCounts[deptName] = 0;
          }
          deptCounts[deptName]++;
        });

        // Convert object { "Unassigned": 4, "dept@gmail.com": 2 } to array
        const deptData = Object.keys(deptCounts).map(name => ({
          name: name,
          count: deptCounts[name],
        }));
        
        setDepartmentChartData(deptData); // Set the new data
        
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
    fetchAllComplaints();
  }, []);

  if (loading) {
     return (
       <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <Navbar />
            <main className="flex-1 p-6">
              <h1 className="text-3xl font-bold">Loading dashboard...</h1>
            </main>
          </div>
        </div>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <main className="flex-1 p-6 space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">System-wide complaint management overview</p>
            </div>

            {/* Stats Cards (with working data) */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Total Complaints"
                value={stats.total}
                icon={FileText}
                variant="default"
                trend={{ value: 12, isPositive: true }}
              />
              <StatsCard
                title="Pending"
                value={stats.pending}
                icon={AlertCircle}
                variant="warning"
              />
              <StatsCard
                title="In Progress"
                value={stats.inProgress}
                icon={Clock}
                variant="default"
              />
              <StatsCard
                title="Resolved"
                value={stats.resolved}
                icon={CheckCircle2}
                variant="success"
                trend={{ value: 8, isPositive: true }}
              />
            </div>

            {/* Charts */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis allowDecimals={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line
                          type="monotone"
                          dataKey="complaints"
                          stroke="var(--color-complaints)"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="resolved"
                          stroke="var(--color-resolved)"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  {/* ✅ Title is correct */}
                  <CardTitle>Complaints by Department</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      {/* ✅ Use new data state */}
                      <BarChart data={departmentChartData}> 
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar
                          dataKey="count"
                          fill="var(--color-complaints)"
                          radius={4}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
            
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;