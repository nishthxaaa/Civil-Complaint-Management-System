import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useComplaints } from '@/contexts/ComplaintContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Upload, MapPin } from 'lucide-react';

const SubmitComplaint = () => {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('road-damage');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState('medium');
  
  // ✅ FIX 1: Must be an empty array [] for multiple files
  const [images, setImages] = useState([]); 

  const { addComplaint } = useComplaints();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const handleNext = () => step < totalSteps && setStep(step + 1);
  const handleBack = () => step > 1 && setStep(step - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    // Call backend through context
    await addComplaint({
      title,
      category,
      description,
      location,
      priority,
      // ✅ FIX 2: The key must be 'images' (plural)
      images: images, 
    });

    // Show success toast
    toast({
      title: 'Complaint Submitted',
      description: 'Your complaint has been registered successfully.',
    });

    // Navigate back to dashboard
    navigate('/dashboard');
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <main className="flex-1 p-6">
            <div className="max-w-3xl mx-auto">
              <div className="mb-6">
                <h1 className="text-3xl font-bold">Submit New Complaint</h1>
                <p className="text-muted-foreground">
                  Fill out the form to register your civic complaint
                </p>
              </div>

              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span>
                    Step {step} of {totalSteps}
                  </span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>
                    {step === 1 && 'Basic Information'}
                    {step === 2 && 'Complaint Details'}
                    {step === 3 && 'Additional Information'}
                  </CardTitle>
                  <CardDescription>
                    {step === 1 && 'Provide basic details about your complaint'}
                    {step === 2 && 'Describe the issue in detail'}
                    {step === 3 && 'Add location, priority, and images'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* STEP 1 */}
                    {step === 1 && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">Complaint Title *</Label>
                          <Input
                            id="title"
                            placeholder="Brief title for your complaint"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="category">Category *</Label>
                          <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="road-damage">Road Damage</SelectItem>
                              <SelectItem value="water-supply">Water Supply</SelectItem>
                              <SelectItem value="streetlight">Street Light</SelectItem>
                              <SelectItem value="garbage">Garbage Collection</SelectItem>
                              <SelectItem value="drainage">Drainage</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {/* STEP 2 */}
                    {step === 2 && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="description">Description *</Label>
                          <Textarea
                            id="description"
                            placeholder="Provide detailed description of the issue"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={6}
                            required
                          />
                        </div>
                      </div>
                    )}

                    {/* STEP 3 */}
                    {step === 3 && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="location">Location *</Label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="location"
                              placeholder="Street address or landmark"
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                              className="pl-10"
                              required
                            />
                          </div>
                        </div>
                        
                        {/* File Upload is here */}
                        <div className="space-y-2">
                          <Label htmlFor="images">Upload Evidence (Optional)</Label>
                          <Input
                            type="file"
                            id="images"
                            accept="image/*"
                            multiple
                            onChange={(e) => setImages(Array.from(e.target.files))}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="priority">Priority Level *</Label>
                          <Select value={priority} onValueChange={setPriority}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high">High - Urgent attention</SelectItem>
                              <SelectItem value="medium">Medium - Important</SelectItem>
                              <SelectItem value="low">Low - Can be addressed later</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {/* Buttons */}
                    <div className="flex justify-between pt-4">
                      {step > 1 && (
                        <Button type="button" variant="outline" onClick={handleBack}>
                          Back
                        </Button>
                      )}
                      {step < totalSteps ? (
                        <Button 
                          // ✅ FIX 3: This 'type="button"' is critical
                          type="button" 
                          onClick={handleNext} 
                          className="ml-auto"
                        >
                          Next
                        </Button>
                      ) : (
                        <Button type="submit" className="ml-auto">
                          Submit Complaint
                        </Button>
                      )}
                    </div>
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

export default SubmitComplaint;