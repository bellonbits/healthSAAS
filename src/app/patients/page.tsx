'use client';
import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, User, Edit, Trash2, Download, Upload, Eye } from 'lucide-react';
import { api, Patient, Household, getErrorMessage } from '@/lib/api';
import { useApi } from '@/lib/hooks/useApi';
import { toast } from 'sonner';

interface PatientFormData {
  household_id: string;
  full_name: string;
  gender: string;
  date_of_birth: string;
  phone: string;
  medical_condition: string;
  risk_level: 'Low' | 'Medium' | 'High';
  created_by: string; // Add this field
}

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
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

  const [formData, setFormData] = useState<PatientFormData>({
    household_id: '',
    full_name: '',
    gender: '',
    date_of_birth: '',
    phone: '',
    medical_condition: '',
    risk_level: 'Low',
    created_by: getCurrentUser().username, // Set default created_by
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [patientsResult, householdsResult] = await Promise.all([
      handleApiCall(
        () => api.getPatients().then(res => res.data.data.patients || []),
        { showError: false }
      ),
      handleApiCall(
        () => api.getHouseholds().then(res => res.data.data.households || []),
        { showError: false }
      )
    ]);

    if (patientsResult) setPatients(patientsResult);
    if (householdsResult) setHouseholds(householdsResult);
    setLoading(false);
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

      if (editingPatient) {
        // For updates, remove created_by as it might not be needed
        const { created_by, ...updateData } = submitData;
        const result = await handleApiCall(
          () => api.updatePatient(editingPatient._id, updateData),
          { 
            successMessage: 'Patient updated successfully',
            onSuccess: () => {
              setDialogOpen(false);
              resetForm();
              loadData();
            }
          }
        );
      } else {
        // For creation, include created_by
        const result = await handleApiCall(
          () => api.createPatient(submitData),
          { 
            successMessage: 'Patient registered successfully',
            onSuccess: () => {
              setDialogOpen(false);
              resetForm();
              loadData();
            }
          }
        );
      }
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      toast.error(`Failed to save patient: ${errorMessage}`);
      console.error('Failed to save patient:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleCreateNew = () => {
    setEditingPatient(null);
    resetForm();
    setDialogOpen(true);
  };

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setFormData({
      household_id: patient.household_id,
      full_name: patient.full_name,
      gender: patient.gender,
      date_of_birth: patient.date_of_birth.split('T')[0],
      phone: patient.phone || '',
      medical_condition: patient.medical_condition || '',
      risk_level: patient.risk_level,
      created_by: getCurrentUser().username,
    });
    setDialogOpen(true);
  };

  const handleView = (patient: Patient) => {
    setSelectedPatient(patient);
    setDetailDialogOpen(true);
  };

  const handleDelete = async (patientId: string) => {
    if (!confirm('Are you sure you want to delete this patient? This action cannot be undone.')) return;
    
    await handleApiCall(
      () => api.deletePatient(patientId),
      { 
        successMessage: 'Patient deleted successfully',
        onSuccess: () => loadData()
      }
    );
  };

  const handleImportCSV = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    const fileInput = document.getElementById('csv-file') as HTMLInputElement;
    
    if (!fileInput.files?.[0]) {
      toast.error('Please select a CSV file');
      return;
    }

    formData.append('file', fileInput.files[0]);

    try {
      await api.importPatientsCSV(formData);
      toast.success('Patients imported successfully');
      setImportDialogOpen(false);
      loadData();
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      toast.error(`Failed to import patients: ${errorMessage}`);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await api.downloadCSVTemplate();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'patients_template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Template downloaded successfully');
    } catch (error: any) {
      toast.error('Failed to download template');
    }
  };

  const resetForm = () => {
    setFormData({
      household_id: '',
      full_name: '',
      gender: '',
      date_of_birth: '',
      phone: '',
      medical_condition: '',
      risk_level: 'Low',
      created_by: getCurrentUser().username,
    });
    setEditingPatient(null);
  };

  const getRiskBadge = (risk: string) => {
    const variants = {
      High: 'destructive',
      Medium: 'warning',
      Low: 'success'
    } as const;

    return (
      <Badge variant={variants[risk as keyof typeof variants]}>
        {risk} Risk
      </Badge>
    );
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const getHouseholdName = (householdId: string) => {
    const household = households.find(h => h._id === householdId);
    return household ? `${household.code} - ${household.head_name}` : 'Unknown Household';
  };

  const filteredPatients = patients.filter(p =>
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.medical_condition?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getHouseholdName(p.household_id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Patients</h1>
            <p className="text-muted-foreground">
              Manage patient registrations and health records
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Import CSV Button */}
            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="sm:w-auto">
                  <Upload className="h-4 w-4 mr-2" />
                  Import CSV
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Patients from CSV</DialogTitle>
                  <DialogDescription>
                    Upload a CSV file to import multiple patients at once
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleImportCSV} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="csv-file">CSV File</Label>
                    <Input
                      id="csv-file"
                      type="file"
                      accept=".csv"
                      required
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button type="button" variant="outline" onClick={downloadTemplate} className="sm:flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Download Template
                    </Button>
                    <Button type="submit" className="sm:flex-1">
                      Import Patients
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Add Patient Button */}
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
                  Add Patient
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingPatient ? 'Edit Patient' : 'Register New Patient'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingPatient ? 'Update patient information' : 'Add a new patient to the health monitoring system'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="date_of_birth">Date of Birth *</Label>
                      <Input
                        id="date_of_birth"
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender *</Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(value) => setFormData({ ...formData, gender: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="household_id">Household *</Label>
                    <Select
                      value={formData.household_id}
                      onValueChange={(value) => setFormData({ ...formData, household_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select household" />
                      </SelectTrigger>
                      <SelectContent>
                        {households.map((household) => (
                          <SelectItem key={household._id} value={household._id}>
                            {household.code} - {household.head_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+254712345678"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="medical_condition">Medical Conditions</Label>
                    <Input
                      id="medical_condition"
                      placeholder="e.g., Diabetes, Hypertension"
                      value={formData.medical_condition}
                      onChange={(e) => setFormData({ ...formData, medical_condition: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="risk_level">Risk Assessment</Label>
                    <Select
                      value={formData.risk_level}
                      onValueChange={(value: 'Low' | 'Medium' | 'High') => 
                        setFormData({ ...formData, risk_level: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low Risk</SelectItem>
                        <SelectItem value="Medium">Medium Risk</SelectItem>
                        <SelectItem value="High">High Risk</SelectItem>
                      </SelectContent>
                    </Select>
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
                        {editingPatient ? 'Updating...' : 'Registering...'}
                      </>
                    ) : (
                      editingPatient ? 'Update Patient' : 'Register Patient'
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search */}
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patients by name, condition, phone, or household..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Patients Table */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Registered Patients ({filteredPatients.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Household</TableHead>
                    <TableHead>Medical Conditions</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Registered By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          <span className="ml-2">Loading patients...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredPatients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        {patients.length === 0 ? (
                          <div className="text-center">
                            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-lg font-medium">No patients registered yet</p>
                            <p className="text-muted-foreground mb-4">
                              Get started by creating your first patient
                            </p>
                            <Button onClick={handleCreateNew} className="bg-gradient-primary">
                              <Plus className="h-4 w-4 mr-2" />
                              Create First Patient
                            </Button>
                          </div>
                        ) : (
                          'No patients match your search'
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPatients.map((patient) => (
                      <TableRow key={patient._id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
                              <User className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-semibold">{patient.full_name}</div>
                              <div className="text-xs text-muted-foreground">
                                {patient.phone || 'No phone'}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {calculateAge(patient.date_of_birth)} years
                        </TableCell>
                        <TableCell>{patient.gender}</TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {getHouseholdName(patient.household_id)}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {patient.medical_condition || 'None'}
                        </TableCell>
                        <TableCell>{getRiskBadge(patient.risk_level)}</TableCell>
                       <TableCell>
  {(patient as any).created_by || (patient.created_at ? new Date(patient.created_at).toLocaleDateString() : 'System')}
</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleView(patient)}
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(patient)}
                              title="Edit patient"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(patient._id)}
                              title="Delete patient"
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

        {/* Patient Detail Dialog */}
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Patient Details</DialogTitle>
              <DialogDescription>
                Complete information for {selectedPatient?.full_name}
              </DialogDescription>
            </DialogHeader>
            {selectedPatient && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                    <p className="text-lg font-semibold">{selectedPatient.full_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Age</Label>
                    <p className="text-lg">{calculateAge(selectedPatient.date_of_birth)} years</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Gender</Label>
                    <p className="text-lg">{selectedPatient.gender}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Risk Level</Label>
                    <div className="mt-1">{getRiskBadge(selectedPatient.risk_level)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                    <p className="text-lg">{selectedPatient.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Household</Label>
                    <p className="text-lg">{getHouseholdName(selectedPatient.household_id)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Registered By</Label>
                    <p className="text-lg">Current User</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Registration Date</Label>
                    <p className="text-lg">{new Date(selectedPatient.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Medical Conditions</Label>
                  <p className="text-lg mt-1">{selectedPatient.medical_condition || 'None reported'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Date of Birth</Label>
                  <p className="text-lg mt-1">{new Date(selectedPatient.date_of_birth).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}