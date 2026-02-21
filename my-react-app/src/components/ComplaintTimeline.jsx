import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, isValid } from 'date-fns'; // Import isValid for safe date handling
import { CheckCircle2, Clock, User, AlertCircle } from 'lucide-react';

export const ComplaintTimeline = ({ updates }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'assigned':
        return <User className="h-5 w-5 text-blue-600" />;
      case 'pending': // Added 'pending' as a valid status
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
  };

  // Helper to format date strings safely
  const formatUpdateDate = (dateString) => {
    const date = new Date(dateString);
    return isValid(date) ? format(date, 'MMM dd, yyyy HH:mm') : 'Invalid date';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complaint Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {updates.map((update, index) => (
            <div key={update.id} className="flex gap-4">
              <div className="relative flex flex-col items-center">
                <div className="rounded-full bg-background border-2 p-1">
                  {/* ✅ FIX 1: Use new_status from our serializer */}
                  {getStatusIcon(update.new_status)}
                </div>
                {index < updates.length - 1 && (
                  <div className="w-0.5 h-full bg-border absolute top-8" />
                )}
              </div>
              <div className="flex-1 pb-8">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{update.message}</p>
                    {/* ✅ FIX 2: Use user_name from our serializer */}
                    <p className="text-sm text-muted-foreground">by {update.user_name || 'System'}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {/* ✅ FIX 3: Use created_at and format it safely */}
                    {formatUpdateDate(update.created_at)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};