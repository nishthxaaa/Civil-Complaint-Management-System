import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, MapPin, Calendar, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { format, isValid } from 'date-fns';

export const ComplaintCard = ({ complaint }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

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
    streetlight: 'Street Light',
    garbage: 'Garbage',
    drainage: 'Drainage',
    other: 'Other',
  };

  // --- Safe date formatting ---
  const rawDate = complaint.created_at || complaint.createdAt;
  let formattedDate = 'Date not available';

  if (rawDate) {
    const parsed = new Date(rawDate);
    if (isValid(parsed)) {
      formattedDate = format(parsed, 'MMM dd, yyyy');
    }
  }

  // --- Role-based navigation ---
  const handleViewDetails = () => {
    if (user?.role === 'admin') {
      navigate(`/admin-dashboard/complaint/${complaint.id}`);
    } else {
      navigate(`/complaint/${complaint.id}`);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">
              {complaint.title || 'Untitled Complaint'}
            </CardTitle>

            <div className="flex flex-wrap gap-2 mt-2">
              <Badge className={statusColors[complaint.status?.toLowerCase()] || 'bg-gray-200 text-gray-800'}>
                {complaint.status ? complaint.status.replace('-', ' ').toUpperCase() : 'UNKNOWN'}
              </Badge>

              <Badge className={priorityColors[complaint.priority?.toLowerCase()] || 'bg-gray-200 text-gray-800'}>
                <AlertCircle className="h-3 w-3 mr-1" />
                {complaint.priority ? complaint.priority.toUpperCase() : 'N/A'}
              </Badge>

              <Badge variant="outline">
                {categoryLabels[complaint.category?.toLowerCase()] || 'Other'}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {complaint.description || 'No description provided.'}
        </p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-2" />
            {complaint.location || 'Location not specified'}
          </div>

          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2" />
            {formattedDate}
          </div>
        </div>

        <Button
          onClick={handleViewDetails}
          className="w-full"
          variant="outline"
        >
          <Eye className="h-4 w-4 mr-2" />
          View Details
        </Button>
      </CardContent>
    </Card>
  );
};
