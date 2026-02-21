import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
// ✅ 1. Import Select components
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AdminAssignComplaints = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ 2. Add state for departments
  const [departments, setDepartments] = useState([]);

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    resolved: 'bg-green-100 text-green-800',
  };

  const priorityColors = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-orange-100 text-orange-800',
    low: 'bg-gray-100 text-gray-800',
  };

  // ✅ 3. Function to fetch departments (from AdminComplaintDetails)
  const fetchDepartments = async () => {
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/departments/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      }
    } catch (error) {
      console.error("Failed to fetch departments", error);
    }
  };

  // ✅ 4. Function to assign a complaint (from AdminComplaintDetails)
  const handleAssign = async (complaintId, deptId) => {
    if (!deptId) return; // Ignore if they don't select one

    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/complaints/update/${complaintId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ department: deptId })
      });

      if (res.ok) {
        toast({ title: `Complaint #${complaintId} Assigned!` });
        // Refresh the list to remove the complaint we just assigned
        fetchUnassignedComplaints(); 
      } else {
        toast({ title: "Assignment Failed", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Network Error", variant: "destructive" });
    }
  };

  // Fetch ALL complaints and then filter for unassigned ones
  const fetchUnassignedComplaints = async () => {
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
        
        // Filter for complaints where 'department' is null
        const unassigned = data.filter(c => c.department === null);
        
        setComplaints(unassigned.map(c => ({
          ...c,
          status: c.status?.toLowerCase().replace(" ", "-"),
          priority: c.priority?.toLowerCase(),
          category: c.category?.toLowerCase().replace(" ", "-"),
        })));
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
    fetchUnassignedComplaints();
    fetchDepartments(); // ✅ 5. Fetch departments on page load
  }, []);

  if (loading) {
     return (
       <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <Navbar />
            <main className="flex-1 p-6">
              <h1 className="text-3xl font-bold">Loading unassigned complaints...</h1>
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
              <h1 className="text-3xl font-bold">Assign Complaints</h1>
              <p className="text-muted-foreground">
                Review new complaints and assign them to a department.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Unassigned Complaints ({complaints.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assign To</TableHead> {/* ✅ 6. Changed header */}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {complaints.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan="6" className="text-center h-24">
                          No unassigned complaints. Great job!
                        </TableCell>
                      </TableRow>
                    ) : (
                      complaints.map((complaint) => (
                        <TableRow key={complaint.id}>
                          <TableCell>#{complaint.id}</TableCell>
                          <TableCell className="font-medium">{complaint.title}</TableCell>
                          <TableCell className="capitalize">{complaint.category.replace('-', ' ')}</TableCell>
                          <TableCell>
                            <Badge className={priorityColors[complaint.priority]}>
                              {complaint.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[complaint.status]}>
                              {complaint.status.replace('-', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {/* ✅ 7. Replaced Button with Select */}
                            <Select 
                              onValueChange={(deptId) => handleAssign(complaint.id, deptId)}
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Assign..." />
                              </SelectTrigger>
                              <SelectContent>
                                {departments.length === 0 ? (
                                  <SelectItem value="null" disabled>Loading...</SelectItem>
                                ) : (
                                  departments.map((dept) => (
                                    <SelectItem key={dept.id} value={dept.id}>
                                      {dept.email}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminAssignComplaints;