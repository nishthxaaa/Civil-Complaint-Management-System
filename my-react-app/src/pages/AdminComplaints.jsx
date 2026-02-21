import { Navbar } from "@/components/Navbar";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useState, useEffect } from "react"; // ✅ Import hooks
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectItem, SelectContent, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ComplaintCard } from "@/components/ComplaintCard";
import { useToast } from "@/hooks/use-toast"; // ✅ Import toast

const AdminComplaints = () => {
  const { toast } = useToast(); // ✅ Get toast
  const [complaints, setComplaints] = useState([]); // ✅ State for complaints
  const [loading, setLoading] = useState(true); // ✅ Loading state

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // ✅ Fetch ALL complaints from the new admin endpoint
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
        // Normalize data
        data = data.map((c) => ({
          ...c,
          status: c.status?.toLowerCase().replace(" ", "-"),
          priority: c.priority?.toLowerCase(),
          category: c.category?.toLowerCase().replace(" ", "-"),
        }));
        setComplaints(data);
      } else {
        toast({
          title: "Error fetching complaints",
          description: "Unable to load complaints from the server.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({ title: "Network Error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch data when the page loads
  useEffect(() => {
    fetchAllComplaints();
  }, []);

  // FILTERING
  const filtered = complaints.filter((c) => {
    const matchSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());

    const matchStatus =
      statusFilter === "all" ||
      c.status === statusFilter.toLowerCase().replace(" ", "-");
    
    const matchCategory =
      categoryFilter === "all" ||
      c.category === categoryFilter.toLowerCase().replace(" ", "-");

    return matchSearch && matchStatus && matchCategory;
  });

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <Navbar />
            <main className="p-6">
              <h1 className="text-3xl font-bold">Loading complaints...</h1>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Navbar />

          <main className="p-6 space-y-4">
            <h1 className="text-3xl font-bold">All Complaints</h1>
            <p className="text-muted-foreground">Search and filter all citizen complaints</p>

            {/* FILTER BAR */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Search complaints..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <Select onValueChange={setStatusFilter} defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>

              <Select onValueChange={setCategoryFilter} defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="road-damage">Road Damage</SelectItem>
                  <SelectItem value="water-supply">Water Supply</SelectItem>
                  <SelectItem value="streetlight">Street Light</SelectItem>
                  <SelectItem value="garbage">Garbage</SelectItem>
                  <SelectItem value="drainage">Drainage</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* COMPLAINT CARDS */}
            <p className="text-sm text-muted-foreground">
              Showing {filtered.length} of {complaints.length} complaints
            </p>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((complaint) => (
                <ComplaintCard key={complaint.id} complaint={complaint} />
              ))}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminComplaints;