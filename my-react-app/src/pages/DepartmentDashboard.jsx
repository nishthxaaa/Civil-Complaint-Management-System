import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { AppSidebar } from '@/components/AppSidebar';
import { StatsCard } from '@/components/StatsCard';
import { SidebarProvider } from '@/components/ui/sidebar';
import { FileText, Clock, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const DepartmentDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  // --- STATE ---
  const [assignedComplaints, setAssignedComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [newStatus, setNewStatus] = useState('in-progress');
  const [updateMessage, setUpdateMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // ✅ Added submitting state

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
        setAssignedComplaints(data.map(normalizeComplaint));
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

  // --- STATS CALCULATION ---
  const stats = {
    total: assignedComplaints.length,
    inProgress: assignedComplaints.filter(c => c.status === 'in-progress' || c.status === 'assigned').length,
    resolved: assignedComplaints.filter(c => c.status === 'resolved').length,
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    assigned: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  };

  // --- ✅ FIXED UPDATE FUNCTION ---
  const handleUpdateStatus = async () => {
    if (!selectedComplaint) {
      toast({ title: 'Error', description: 'No complaint selected', variant: 'destructive' });
      return;
    }
    
    // Prevent double-click
    setIsSubmitting(true);
    const token = localStorage.getItem("access_token");

    try {
      // --- Call 1: Update the Complaint Status (PATCH) ---
      const resStatus = await fetch(`http://127.0.0.1:8000/api/complaints/update/${selectedComplaint}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newStatus,
        })
      });

      if (!resStatus.ok) {
        throw new Error("Failed to update status");
      }

      // --- Call 2: Post the Update Message (POST) ---
      // Only post a message if one was typed
      if (updateMessage.trim() !== "") {
        const resLog = await fetch(`http://127.0.0.1:8000/api/complaints/${selectedComplaint}/updates/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            message: updateMessage,
            new_status: newStatus // Pass the new status to the log
          })
        });

        if (!resLog.ok) {
          // Note: Status was updated, but message failed. Inform user.
          throw new Error("Status updated, but failed to save update message.");
        }
      }

      // --- If all successful ---
      toast({
        title: 'Status Updated',
        description: 'Complaint status and timeline have been updated.',
      });

      setSelectedComplaint(null); // Close dialog
      setUpdateMessage('');       // Clear message box
      fetchDepartmentComplaints(); // Refresh the list

    } catch (err) {
      console.error("Update error:", err);
      toast({ title: 'Update Failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false); // Re-enable button
    }
  };
  
  // --- LOADING UI ---
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
    );
  }

  // --- MAIN COMPONENT ---
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <main className="flex-1 p-6 space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Department Dashboard</h1>
              <p className="text-muted-foreground">Manage your assigned complaints</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <StatsCard
                title="Assigned Complaints"
                value={stats.total}
                icon={FileText}
                variant="default"
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
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Assigned Complaints</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignedComplaints.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan="6" className="text-center h-24">
                          No complaints assigned to this department.
                        </TableCell>
                      </TableRow>
                    ) : (
                      assignedComplaints.map((complaint) => (
                        <TableRow key={complaint.id}>
                          <TableCell>#{complaint.id}</TableCell>
                          <TableCell className="font-medium">{complaint.title}</TableCell>
                          <TableCell>{complaint.location}</TableCell>
                          <TableCell className="capitalize">{complaint.priority}</TableCell>
                          <TableCell>
                            <Badge className={statusColors[complaint.status]}>
                              {complaint.status.replace('-', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Dialog onOpenChange={(open) => {
                              if (!open) {
                                setSelectedComplaint(null);
                                setUpdateMessage('');
                              }
                            }}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedComplaint(complaint.id);
                                    setNewStatus(complaint.status);
                                  }}
                                >
                                  Update
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Update Complaint Status</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">New Status</label>
                                    <Select value={newStatus} onValueChange={(v) => setNewStatus(v)}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="assigned">Assigned</SelectItem>
                                        <SelectItem value="in-progress">In Progress</SelectItem>
                                        <SelectItem value="resolved">Resolved</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Update Message (Optional)</label>
                                    <Textarea
                                      placeholder="Describe the update..."
                                      value={updateMessage}
                                      onChange={(e) => setUpdateMessage(e.target.value)}
                                      rows={4}
                                    />
                                  </div>
                                  <Button onClick={handleUpdateStatus} className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? "Updating..." : "Update Status"}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
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

export default DepartmentDashboard;