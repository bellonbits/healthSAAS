'use client';
import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search, Edit, Trash2, Users, Eye, MapPin, Phone } from 'lucide-react';
import { api, Household, getErrorMessage } from '@/lib/api';
import { useApi } from '@/lib/hooks/useApi';
import { toast } from 'sonner';

interface HouseholdFormData {
  code: string;
  location: string;
  head_name: string;
  phone: string;
  created_by: string; // Add this field
}

export default function Households() {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(null);
  const [editingHousehold, setEditingHousehold] = useState<Household | null>(null);
  const [creating, setCreating] = useState(false);
  const { handleApiCall } = useApi();

  // Get current user from localStorage or use a default
  const getCurrentUser = () => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : { username: 'admin' }; // Fallback user
    }
    return { username: 'admin' };
  };

  const [formData, setFormData] = useState<HouseholdFormData>({
    code: '',
    location: '',
    head_name: '',
    phone: '',
    created_by: getCurrentUser().username, // Set default created_by
  });

  useEffect(() => {
    loadHouseholds();
  }, []);

  const loadHouseholds = async () => {
    setLoading(true);
    try {
      const result = await handleApiCall(
        () => api.getHouseholds().then(res => res.data.data.households || []),
        { showError: true }
      );
      if (result) setHouseholds(result);
    } catch (error) {
      console.error('Failed to load households:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      // Ensure created_by is set
      const submitData = {
        ...formData,
        created_by: getCurrentUser().username
      };

      if (editingHousehold) {
        // For updates, you might not need created_by, but check your API
        const { created_by, ...updateData } = submitData; // Remove created_by for updates
        const result = await handleApiCall(
          () => api.updateHousehold(editingHousehold._id, updateData),
          { 
            successMessage: 'Household updated successfully',
            onSuccess: () => {
              setDialogOpen(false);
              resetForm();
              loadHouseholds();
            }
          }
        );
      } else {
        // For creation, include created_by
        const result = await handleApiCall(
          () => api.createHousehold(submitData),
          { 
            successMessage: 'Household created successfully',
            onSuccess: () => {
              setDialogOpen(false);
              resetForm();
              loadHouseholds();
            }
          }
        );
      }
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      toast.error(`Failed to save household: ${errorMessage}`);
      console.error('Failed to save household:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleCreateNew = () => {
    setEditingHousehold(null);
    resetForm();
    setDialogOpen(true);
  };

  const handleEdit = (household: Household) => {
    setEditingHousehold(household);
    setFormData({
      code: household.code,
      location: household.location,
      head_name: household.head_name,
      phone: household.phone || '',
      created_by: getCurrentUser().username, // Set current user for edits too
    });
    setDialogOpen(true);
  };

  const handleView = (household: Household) => {
    setSelectedHousehold(household);
    setDetailDialogOpen(true);
  };

  const handleDelete = async (householdId: string) => {
    if (!confirm('Are you sure you want to delete this household? This will also remove all associated patients.')) return;
    
    await handleApiCall(
      () => api.deleteHousehold(householdId),
      { 
        successMessage: 'Household deleted successfully',
        onSuccess: () => loadHouseholds()
      }
    );
  };

  const resetForm = () => {
    setFormData({
      code: '',
      location: '',
      head_name: '',
      phone: '',
      created_by: getCurrentUser().username, // Reset with current user
    });
    setEditingHousehold(null);
  };

  const generateHouseholdCode = () => {
    const existingCodes = households.map(h => h.code);
    let newCode = '';
    let counter = 1;
    
    do {
      newCode = `HH-${counter.toString().padStart(3, '0')}`;
      counter++;
    } while (existingCodes.includes(newCode) && counter < 1000);
    
    setFormData(prev => ({ ...prev, code: newCode }));
  };

  const filteredHouseholds = households.filter(h =>
    h.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.head_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Households</h1>
            <p className="text-muted-foreground">
              Manage household registrations and family units
            </p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 bg-gradient-primary hover:opacity-90 sm:w-auto"
                onClick={handleCreateNew}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Household
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingHousehold ? 'Edit Household' : 'Register New Household'}
                </DialogTitle>
                <DialogDescription>
                  {editingHousehold ? 'Update household information' : 'Add a new household to the system'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Household Code *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="code"
                      placeholder="HH-001"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      required
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={generateHouseholdCode}
                      disabled={!!editingHousehold}
                    >
                      Generate
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Unique identifier for the household
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    placeholder="Kibera, Nairobi"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="head_name">Head of Household *</Label>
                  <Input
                    id="head_name"
                    placeholder="Jane Smith"
                    value={formData.head_name}
                    onChange={(e) => setFormData({ ...formData, head_name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="+254712345678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                {/* Hidden field for created_by */}
                <input 
                  type="hidden" 
                  value={formData.created_by}
                  onChange={(e) => setFormData({ ...formData, created_by: e.target.value })}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-primary hover:opacity-90"
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                      {editingHousehold ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingHousehold ? 'Update Household' : 'Register Household'
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Rest of the component remains the same */}
        {/* Search */}
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search households by code, location, head name, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Households Table */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Registered Households ({filteredHouseholds.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Household Code</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Head of Household</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Registered By</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          <span className="ml-2">Loading households...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredHouseholds.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {households.length === 0 ? (
                          <div className="text-center">
                            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-lg font-medium">No households registered yet</p>
                            <p className="text-muted-foreground mb-4">
                              Get started by creating your first household
                            </p>
                            <Button onClick={handleCreateNew} className="bg-gradient-primary">
                              <Plus className="h-4 w-4 mr-2" />
                              Create First Household
                            </Button>
                          </div>
                        ) : (
                          'No households match your search'
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredHouseholds.map((household) => (
                      <TableRow key={household._id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            {household.code}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            {household.location}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">{household.head_name}</TableCell>
                        <TableCell>
                          {household.phone ? (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              {household.phone}
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {household.created_by || 'System'}
                        </TableCell>
                        <TableCell>
                          {new Date(household.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleView(household)}
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(household)}
                              title="Edit household"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(household._id)}
                              title="Delete household"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Household Detail Dialog remains the same */}
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Household Details</DialogTitle>
              <DialogDescription>
                Complete information for {selectedHousehold?.code}
              </DialogDescription>
            </DialogHeader>
            {selectedHousehold && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Household Code</Label>
                    <p className="text-lg font-semibold">{selectedHousehold.code}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Location</Label>
                    <p className="text-lg">{selectedHousehold.location}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Head of Household</Label>
                    <p className="text-lg font-semibold">{selectedHousehold.head_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Phone Number</Label>
                    <p className="text-lg">{selectedHousehold.phone || 'Not provided'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Registered By</Label>
                    <p className="text-lg">{selectedHousehold.created_by}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Registration Date</Label>
                    <p className="text-lg">{new Date(selectedHousehold.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <Label className="text-sm font-medium text-muted-foreground">Household ID</Label>
                  <p className="text-sm font-mono bg-gray-100 p-2 rounded mt-1">
                    {selectedHousehold._id}
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}