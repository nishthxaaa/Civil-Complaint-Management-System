import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { AppSidebar } from '../components/AppSidebar';
import { StarRating } from '../components/StarRating';
import { SidebarProvider } from '../components/ui/sidebar';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useComplaints } from '../contexts/ComplaintContext';
import { useToast } from '../hooks/use-toast';
import { ArrowLeft, Send } from 'lucide-react';
import { Label } from '../components/ui/label';

const FeedbackPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getComplaintById } = useComplaints();
  const { toast } = useToast();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // To disable button

  // Fetch complaint DETAILS correctly
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await getComplaintById(id);
      setComplaint(data);
      setLoading(false);
    };
    loadData();
  }, [id, getComplaintById]);

  // THIS IS THE REAL SUBMIT FUNCTION
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true); // Disable button

    if (rating === 0) {
      toast({
        title: 'Rating Required',
        description: 'Please provide a star rating before submitting.',
        variant: 'destructive',
      });
      setIsSubmitting(false); // Re-enable button
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      toast({ title: 'Not Authenticated', variant: 'destructive' });
      setIsSubmitting(false);
      return;
    }

    try {
      // This is the REAL API call
      // Uses the endpoint from backend/myproject/myapp/urls.py
      const response = await fetch(`http://127.0.0.1:8000/api/complaints/${id}/feedback/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rating: rating,
          comment: comment
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        // Handle specific validation errors from the backend
        let msg = "Failed to submit feedback.";
        if (errData.detail) msg = errData.detail; // e.g. "Permission denied"
        if (errData.non_field_errors) msg = errData.non_field_errors[0]; // e.g. "Feedback already submitted"
        throw new Error(msg);
      }

      // This part only runs if the API call was successful
      toast({
        title: 'Feedback Submitted',
        description: 'Thank you for your feedback!',
      });

      navigate('/dashboard'); // Send user back to dashboard

    } catch (error) {
      console.error("Feedback error:", error);
      toast({
        title: 'Submission Failed',
        description: error.message,
        variant: 'destructive',
      });
      setIsSubmitting(false); // Re-enable button on error
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading complaint...
      </div>
    );
  }

  // Check for complaint resolution status
  if (!complaint || complaint.status !== 'resolved') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Cannot Submit Feedback</h1>
          <p className="text-muted-foreground mb-4">
            {complaint ? "This complaint is not yet resolved." : "This complaint could not be loaded."}
          </p>
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <main className="flex-1 p-6">
            <div className="max-w-2xl mx-auto">

              <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-3xl font-bold">Provide Feedback</h1>
                  <p className="text-muted-foreground">
                    Complaint: {complaint.title}
                  </p>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Rate Your Experience</CardTitle>
                  <CardDescription>
                    Help us improve by rating the resolution service.
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Service Rating *</Label>
                      <div className="flex justify-center p-4">
                        <StarRating rating={rating} onRatingChange={setRating} size="lg" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="comment">Additional Comments (Optional)</Label>
                      <Textarea
                        id="comment"
                        placeholder="What went well? What could be improved?"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={6}
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      <Send className="h-4 w-4 mr-2" />
                      {isSubmitting ? "Submitting..." : "Submit Feedback"}
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

export default FeedbackPage;