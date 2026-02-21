import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { AppSidebar } from '../components/AppSidebar';
import { ComplaintTimeline } from '../components/ComplaintTimeline';
import { SidebarProvider } from '../components/ui/sidebar';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useComplaints } from '../contexts/ComplaintContext';
import { 
  ArrowLeft, MapPin, Calendar, User, Building2, 
  AlertCircle, Mail, MessageSquare // ✅ Import MessageSquare
} from 'lucide-react'; 
import { format, isValid } from 'date-fns';
import { useToast } from '../hooks/use-toast';
import { StarRating } from '../components/StarRating'; // ✅ Import StarRating

const ComplaintDetails = () => {
  const { id } = useParams(); // gets complaint ID from URL
  const navigate = useNavigate();
  const { getComplaintById } = useComplaints();
  const { toast } = useToast();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updates, setUpdates] = useState([]); // ✅ NEW: State for timeline updates

  // ✅ CORRECTED useEffect: Fetches complaint and its updates
  useEffect(() => {
    // 1. Define your update-fetching function INSIDE the useEffect
    const fetchUpdates = async (complaintId) => {
      const token = localStorage.getItem("access_token");
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/complaints/${complaintId}/updates/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUpdates(data);
        }
      } catch (err) {
        console.error("Failed to fetch updates:", err);
      }
    };

    // 2. Define your main complaint-fetching function
    const fetchComplaint = async () => {
      try {
        setLoading(true); // Set loading true at the start
        const data = await getComplaintById(id); // This is from your useComplaints context
        
        if (data) {
          setComplaint(data);
          // 3. Call fetchUpdates *after* you have the complaint
          fetchUpdates(id); 
        } else {
          toast({
            title: 'Complaint Not Found',
            description: 'The complaint does not exist or you do not have access.',
            variant: 'destructive',
          });
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error fetching complaint:', error);
        toast({
          title: 'Error Fetching Complaint',
          description: 'Unable to load complaint details.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false); // Set loading false at the end
      }
    };

    // 4. Call the main function to start everything
    fetchComplaint();
    
  }, [id, getComplaintById, toast, navigate]); // These are the correct dependencies

  // ✅ Loading UI
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading complaint details...
      </div>
    );
  }

  // ✅ If complaint not found
  if (!complaint) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Complaint Not Found</h1>
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  // ✅ Color maps for status and priority
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    assigned: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  };

  const priorityColors = {
    high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    medium: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    low: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  };

  const categoryLabels = {
    'road-damage': 'Road Damage',
    'water-supply': 'Water Supply',
    'streetlight': 'Street Light',
    'garbage': 'Garbage',
    'drainage': 'Drainage',
    'other': 'Other',
  };

  // ✅ Convert created_at safely
  const formattedDate = complaint.created_at
    ? format(new Date(complaint.created_at), 'MMM dd, yyyy')
    : 'N/A';
  
  // Use the department_name from your updated serializer
  const departmentName = complaint.department_name || (complaint.department ? `Dept. ID: ${complaint.department}` : null);
  
  // ✅ --- LOGIC FOR FEEDBACK ---
  const isResolved = complaint.status?.toLowerCase() === 'resolved';
  // Check if the feedback object (which you added in the backend) exists
  const hasFeedback = complaint.feedback != null; 

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <main className="flex-1 p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Complaint Details</h1>
                <p className="text-muted-foreground">Complaint ID: #{complaint.id}</p>
              </div>
            </div>

            {/* Main Grid */}
            <div className="grid gap-6 md:grid-cols-3">
              {/* Left: Complaint Info */}
              <div className="md:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl mb-2">{complaint.title}</CardTitle>
                        <div className="flex flex-wrap gap-2">
                          <Badge className={statusColors[complaint.status?.toLowerCase()]}>
                            {complaint.status?.replace('-', ' ').toUpperCase()}
                          </Badge>
                          <Badge className={priorityColors[complaint.priority?.toLowerCase()]}>
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {complaint.priority?.toUpperCase()} PRIORITY
                          </Badge>
                          <Badge variant="outline">
                            {categoryLabels[complaint.category] || 'Other'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Description */}
                    <div>
                      <h3 className="font-semibold mb-2">Description</h3>
                      <p className="text-muted-foreground">{complaint.description}</p>
                    </div>

                    {/* Location + Date */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Location</p>
                          <p className="text-sm text-muted-foreground">{complaint.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Submitted On</p>
                          <p className="text-sm text-muted-foreground">{formattedDate}</p>
                        </div>
                      </div>
                    </div>

                    {/* Optional Image */}
                    {complaint.images && complaint.images.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">Attached Images</h3>
                        <div className="flex flex-wrap gap-4">
                          {complaint.images.map((img) => (
                            <img
                              key={img.id}
                              src={img.image}
                              alt="Complaint evidence"
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

              {/* Right: Additional Info */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Complaint Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Citizen Info */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium">Citizen</p>
                      </div>
                      <p className="text-sm text-muted-foreground pl-6">
                        {complaint.citizen_name || 'N/A'}
                      </p>
                    </div>

                    {/* Optional Department Info */}
                    {departmentName && (
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm font-medium">Assigned Department</p>
                        </div>
                        <p className="text-sm text-muted-foreground pl-6">
                          {departmentName}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* ✅ --- THIS IS THE NEW/MODIFIED FEEDBACK SECTION --- ✅ */}

                {/* 1. If complaint is resolved AND feedback HAS been given, show the feedback */}
                {isResolved && hasFeedback && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Your Feedback
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm font-medium mb-2">Your Rating</p>
                        {/* Use the StarRating component in read-only mode */}
                        <StarRating rating={complaint.feedback.rating} readonly={true} />
                      </div>
                      {/* Only show comment section if a comment was left */}
                      {complaint.feedback.comment && (
                        <div>
                          <p className="text-sm font-medium mb-2">Your Comment</p>
                          <p className="text-sm text-gray-700 p-3 bg-gray-50 border border-gray-100 rounded-md">
                            "{complaint.feedback.comment}"
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* 2. If complaint is resolved AND feedback has NOT been given, show the button */}
                {isResolved && !hasFeedback && (
                  <Card>
                    <CardContent className="pt-6">
                      <Button
                        className="w-full"
                        onClick={() => navigate(`/feedback/${complaint.id}`)}
                      >
                        Provide Feedback
                      </Button>
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

export default ComplaintDetails;