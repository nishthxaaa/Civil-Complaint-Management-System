import { Navbar } from '@/components/Navbar';
import { AppSidebar } from '@/components/AppSidebar';
import { StatsCard } from '@/components/StatsCard';
import { ComplaintCard } from '@/components/ComplaintCard';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useComplaints } from '@/contexts/ComplaintContext';
import { FileText, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const Dashboard = () => {
  const { complaints, getStats } = useComplaints();
  const stats = getStats();
  const recentComplaints = complaints.slice(0, 3);

  // ===============================
  // ⭐ NORMALIZE CATEGORY FUNCTION
  // ===============================
  const normalizeCategory = (cat) => {
    if (!cat) return "other";

    return cat
      .toLowerCase()
      .replace(/\s+/g, "-")      // "Road Damage" → "road-damage"
      .replace(/_/g, "-")         // "road_damage" → "road-damage"
      .trim();
  };

  const normalizedCategories = complaints.map(c => normalizeCategory(c.category));

  // ===============================
  // ⭐ CATEGORY DATA FOR BAR CHART
  // ===============================
  const categoryData = [
    { name: "Road Damage", value: normalizedCategories.filter(c => c === "road-damage").length },
    { name: "Water Supply", value: normalizedCategories.filter(c => c === "water-supply").length },
    { name: "Street Light", value: normalizedCategories.filter(c => c === "streetlight").length },
    { name: "Garbage", value: normalizedCategories.filter(c => c === "garbage").length },
    { name: "Drainage", value: normalizedCategories.filter(c => c === "drainage").length },
    { name: "Other", value: normalizedCategories.filter(c => c === "other").length },
  ];

  // ===============================
  // ⭐ STATUS DATA FOR PIE CHART
  // ===============================
  const statusData = [
    { name: "Pending", value: stats.pending, color: "#fbbf24" },
    { name: "In Progress", value: stats.inProgress, color: "#3b82f6" },
    { name: "Resolved", value: stats.resolved, color: "#22c55e" },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <main className="flex-1 p-6 space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold">Dashboard Overview</h1>
              <p className="text-muted-foreground">Welcome back! Here's your complaint summary.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatsCard title="Total Complaints" value={stats.total} icon={FileText} variant="default" trend={{ value: 12, isPositive: true }} />
              <StatsCard title="Pending" value={stats.pending} icon={AlertCircle} variant="warning" />
              <StatsCard title="In Progress" value={stats.inProgress} icon={Clock} variant="default" />
              <StatsCard title="Resolved" value={stats.resolved} icon={CheckCircle2} variant="success" />
            </div>

            {/* Charts */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Pie Chart */}
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
                        outerRadius={80}
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

              {/* Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Complaints by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Recent complaints */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Recent Complaints</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recentComplaints.map((complaint) => (
                  <ComplaintCard key={complaint.id} complaint={complaint} />
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
