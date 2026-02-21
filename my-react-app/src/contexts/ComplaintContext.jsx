import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const ComplaintContext = createContext(undefined);

export const ComplaintProvider = ({ children }) => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // 🔥 Utility to normalize complaint data from backend
  const normalizeComplaint = (c) => ({
    ...c,
    status: c.status?.toLowerCase().replace(' ', '-'), // "In Progress" → "in-progress"
    priority: c.priority?.toLowerCase(),
    category: c.category?.toLowerCase(),
  });

  // ✅ Fetch all complaints
  const fetchComplaints = async () => {
    const token = localStorage.getItem('access_token');
    if (!token || !user) return;

    setLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/complaints/my/', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        let data = await res.json();

        // Normalize each complaint 🔥
        data = data.map(normalizeComplaint);

        setComplaints(data);
      } else {
        toast({
          title: 'Error fetching complaints',
          description: 'Unable to load complaints from the server.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: 'Network Error',
        description: 'Failed to connect to the server.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchComplaints();
  }, [user]);

  // ✅ Add complaint
  const addComplaint = async (complaintData) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const formData = new FormData();
    formData.append('title', complaintData.title);
    formData.append('category', complaintData.category);
    formData.append('description', complaintData.description);
    formData.append('location', complaintData.location);
    formData.append('priority', complaintData.priority);
   if (complaintData.images && complaintData.images.length > 0) {
      // Loop through the array of files
      complaintData.images.forEach((image) => {
        // Append each file with the *same key* 'images' (plural)
        formData.append('images', image);
      });
    }
    try {
      const res = await fetch('http://127.0.0.1:8000/api/complaints/', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        toast({
          title: 'Complaint Submitted',
          description: 'Your complaint has been registered successfully.',
        });

        // REFRESH COMPLAINT LIST 🔥
        await fetchComplaints();
      } else {
        const errData = await res.json();
        toast({
          title: 'Submission Failed',
          description: errData.detail || 'Please check your inputs.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: 'Network Error',
        description: 'Unable to reach the server.',
        variant: 'destructive',
      });
    }
  };

  // ✅ Fetch single complaint
  const getComplaintById = async (id) => {
    const token = localStorage.getItem('access_token');
    if (!token) return null;

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/complaints/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        return normalizeComplaint(data); // 🔥 Normalize single complaint
      } else {
        return null;
      }
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  // ✅ Dashboard Stats
  const getStats = () => {
    return {
      total: complaints.length,
      pending: complaints.filter((c) => c.status === 'pending').length,
      inProgress: complaints.filter((c) =>
        ['in-progress', 'assigned'].includes(c.status)
      ).length,
      resolved: complaints.filter((c) => c.status === 'resolved').length,
    };
  };

  return (
    <ComplaintContext.Provider
      value={{
        complaints,
        loading,
        fetchComplaints,
        addComplaint,
        getComplaintById,
        getStats,
      }}
    >
      {children}
    </ComplaintContext.Provider>
  );
};

export const useComplaints = () => {
  const context = useContext(ComplaintContext);
  if (context === undefined) {
    throw new Error('useComplaints must be used within a ComplaintProvider');
  }
  return context;
};
