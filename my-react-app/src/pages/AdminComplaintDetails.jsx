import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  AlertCircle,
  Mail,
  Building, 
  Phone,
  MessageSquare // ✅ 1. Import new icon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ComplaintTimeline } from "@/components/ComplaintTimeline"; 
import { StarRating } from "@/components/StarRating"; // ✅ 2. Import StarRating

const AdminComplaintDetails = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [updates, setUpdates] = useState([]); 

  // This function fetches all departments for the dropdown
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

  // This function handles assigning/re-assigning a complaint
  const handleAssign = async () => {
    if (!selectedDept) {
      toast({ title: "No department selected", variant: "destructive" });
      return;
    }
    
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/complaints/update/${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          department: selectedDept
        })
      });

      if (res.ok) {
        toast({ title: "Complaint Assigned!" });
        // Re-fetch complaint to show updated info
        fetchComplaintAndUpdates(); 
      } else {
        toast({ title: "Assignment Failed", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Network Error", variant: "destructive" });
    }
  };

  // This fetches both the complaint details and its timeline updates
  const fetchComplaintAndUpdates = async () => {
    setLoading(true);
    const token = localStorage.getItem("access_token");
    
    try {
      // Fetch Complaint Details
      const complaintRes = await fetch(`http://127.0.0.1:8000/api/complaints/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!complaintRes.ok) {
        toast({ title: "Error", description: "Complaint not found", variant: "destructive" });
        navigate("/admin-dashboard/complaints");
        return;
      }

      const complaintData = await complaintRes.json();
      setComplaint(complaintData);
      setSelectedDept(complaintData.department); // This is just the ID, which is fine

      // Fetch Complaint Updates (Timeline)
      const updatesRes = await fetch(`http://127.0.0.1:8000/api/complaints/${id}/updates/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (updatesRes.ok) {
        const updatesData = await updatesRes.json();
        setUpdates(updatesData);
      } else {
        console.error("Failed to fetch timeline updates");
      }

    } catch (error) {
      console.error(error);
      toast({ title: "Error fetching complaint details", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Load all data on page load
  useEffect(() => {
    fetchComplaintAndUpdates();
    fetchDepartments();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  }

  if (!complaint) return null;
  
  // Helper objects and variables
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    'in-progress': "bg-blue-100 text-blue-800",
    'assigned': "bg-blue-100 text-blue-800",
    resolved: "bg-green-100 text-green-800",
  };
  const priorityColors = {
    high: "bg-red-100 text-red-800",
    medium: "bg-orange-100 text-orange-800",
    low: "bg-gray-100 text-gray-800",
  };
  const categoryLabel = complaint.category ? complaint.category.replace('-', ' ') : "Other";
  const formattedDate = complaint.created_at
    ? new Date(complaint.created_at).toLocaleDateString()
    : "N/A";

  const isResolved = complaint.status === 'resolved';
  // ✅ 3. Check if feedback (from backend serializer) exists
  const hasFeedback = complaint.feedback != null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <main className="flex-1 p-6 space-y-6">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold">Complaint Details (Admin)</h1>
            <div className="grid gap-6 md:grid-cols-3">
              
              {/* Left Section */}
              <div className="md:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">{complaint.title}</CardTitle>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge className={statusColors[complaint.status]}>
                        {complaint.status}
                      </Badge>
                      <Badge className={priorityColors[complaint.priority]}>
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {complaint.priority} Priority
                      </Badge>
                      <Badge variant="outline" className="capitalize">{categoryLabel}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     <h3 className="font-semibold">Description</h3>
                    <p className="text-muted-foreground">{complaint.description}</p>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">{complaint.location}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">{formattedDate}</span>
                      </div>
                    </div>

                  {complaint.images && complaint.images.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <h3 className="font-semibold">Attached Images</h3>
                      <div className="flex flex-wrap gap-4">
                        {complaint.images.map((img) => (
                          <img
                            key={img.id}
                            src={img.image}
                            alt="Complaint"
                            className="rounded-lg h-32 w-32 object-cover"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  </CardContent>
                </Card>

                {/* Complaint Timeline */}
                {updates && updates.length > 0 && (
                  <ComplaintTimeline updates={updates} />
                )}
              </div>

              {/* Right Section (Citizen Info + Admin Actions) */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Citizen Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{complaint.citizen_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{complaint.citizen_email}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* --- Admin Actions Card --- */}
                <Card>
                  <CardHeader>
                    <CardTitle>Admin Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* This shows the assigned dept name (or "Not yet assigned") */}
                    {complaint.department_name ? (
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <span className="text-muted-foreground">Assigned to:</span>
                        <Badge variant="secondary">
                          {complaint.department_name}
                        </Badge>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">Not yet assigned.</div>
                    )}

                    {/* This shows the assignment dropdown */}
                    {!isResolved && (
                      <>
                        <div className="mt-4">
                          <label className="text-sm font-medium">
                            {complaint.department_name ? "Change Assignment" : "Assign to Department"}
                          </label>
                          <Select
                            value={selectedDept || ""}
                            onValueChange={(val) => setSelectedDept(val === "null" ? null : val)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a department" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="null">Unassigned</SelectItem>
                              {departments.map((dept) => (
                                <SelectItem key={dept.id} value={dept.id}>
                                  {dept.email}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <Button
                          className="w-full"
                          variant="default"
                          onClick={handleAssign}
                          disabled={selectedDept === complaint.department} 
                        >
                          Save Assignment
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* ✅ 4. ADD THE NEW FEEDBACK CARD */}
                {/* If complaint is resolved AND feedback exists, show this card */}
                {isResolved && hasFeedback && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Citizen Feedback
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm font-medium mb-2">Rating</p>
                        <StarRating rating={complaint.feedback.rating} readonly={true} />
                      </div>
                      {complaint.feedback.comment && (
                        <div>
                          <p className="text-sm font-medium mb-2">Comment</p>
                          <p className="text-sm text-gray-700 p-3 bg-gray-50 border border-gray-100 rounded-md">
                            "{complaint.feedback.comment}"
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminComplaintDetails;