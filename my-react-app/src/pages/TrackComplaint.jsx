import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { AppSidebar } from '@/components/AppSidebar';
import { ComplaintCard } from '@/components/ComplaintCard';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useComplaints } from '@/contexts/ComplaintContext';
import { Search, Filter } from 'lucide-react';

const TrackComplaint = () => {
  const { complaints } = useComplaints();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const normalize = (value) =>
  value?.toString().trim().toLowerCase().replace(/\s+/g, '-');

const filteredComplaints = complaints.filter((complaint) => {
  const search = searchQuery.toLowerCase();

  const matchesSearch =
    complaint.title.toLowerCase().includes(search) ||
    complaint.description.toLowerCase().includes(search);

  const complaintStatus = normalize(complaint.status);
  const complaintCategory = normalize(complaint.category);

  const matchesStatus =
    statusFilter === 'all' || complaintStatus === statusFilter;

  const matchesCategory =
    categoryFilter === 'all' || complaintCategory === categoryFilter;

  return matchesSearch && matchesStatus && matchesCategory;
});


  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <main className="flex-1 p-6 space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Track Complaints</h1>
              <p className="text-muted-foreground">Search and filter your complaints</p>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search complaints..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by category" />
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

            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredComplaints.length} of {complaints.length} complaints
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setCategoryFilter('all');
                  }}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>

              {filteredComplaints.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-lg text-muted-foreground">No complaints found</p>
                  <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredComplaints.map((complaint) => (
                    <ComplaintCard key={complaint.id} complaint={complaint} />
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default TrackComplaint;
