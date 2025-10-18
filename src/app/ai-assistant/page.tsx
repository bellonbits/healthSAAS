'use client';
import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Brain, Sparkles, AlertTriangle, Stethoscope } from 'lucide-react';
import { api, getFallbackHealthRecommendation, getErrorMessage } from '@/lib/api';
import { useApi } from '@/lib/hooks/useApi';
import { toast } from 'sonner';

interface AIResponse {
  recommendation?: {
    possible_diagnosis?: string;
    follow_up_action?: string;
    risk_level?: string;
    advice?: string;
  };
  data?: {
    recommendation?: {
      possible_diagnosis?: string;
      follow_up_action?: string;
      risk_level?: string;
      advice?: string;
    };
  };
  model_used?: string;
  timestamp?: string;
}

// Fallback recommendations for when AI service is down
const getFallbackRecommendation = (formData: any): AIResponse => {
  const symptoms = formData.symptoms.toLowerCase();
  const age = parseInt(formData.age);
  const gender = formData.gender;
  
  let diagnosis = 'Common Viral Infection';
  let action = 'Rest, hydrate, and monitor symptoms. Follow up if condition worsens.';
  let risk = 'Low';
  let advice = 'Get plenty of rest and drink fluids. Use over-the-counter medications as needed for symptom relief.';

  // Basic symptom-based logic
  if (symptoms.includes('fever') && symptoms.includes('cough')) {
    diagnosis = 'Upper Respiratory Infection';
    action = 'Consider COVID-19 test if recent exposure. Use fever reducers and cough suppressants.';
    risk = age > 60 ? 'Medium' : 'Low';
  }
  
  if (symptoms.includes('chest pain') || symptoms.includes('shortness of breath')) {
    diagnosis = 'Cardiac or Respiratory Concern';
    action = 'Seek immediate medical attention for evaluation.';
    risk = 'High';
    advice = 'Do not ignore chest pain or breathing difficulties. Emergency evaluation recommended.';
  }
  
  if (symptoms.includes('headache') && symptoms.includes('vision')) {
    diagnosis = 'Possible Migraine or Neurological Issue';
    action = 'Consult with healthcare provider for proper diagnosis.';
    risk = 'Medium';
  }

  return {
    recommendation: {
      possible_diagnosis: diagnosis,
      follow_up_action: action,
      risk_level: risk,
      advice: advice
    },
    model_used: 'Standard Medical Protocol',
    timestamp: new Date().toISOString()
  };
};

// Helper function to safely extract recommendation from response
const extractRecommendation = (response: any) => {
  console.log('🔍 Raw API Response:', response);
  
  // Try different possible response structures
  if (response?.recommendation) {
    return response.recommendation;
  } else if (response?.data?.recommendation) {
    return response.data.recommendation;
  } else if (response?.data) {
    return response.data;
  } else if (response) {
    return response;
  }
  
  console.warn('❌ No recommendation found in response');
  return null;
};

export default function AIAssistant() {
  const [formData, setFormData] = useState({
    patient_name: '',
    age: '',
    gender: '',
    condition_history: '',
    symptoms: ''
  });
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usingFallback, setUsingFallback] = useState(false);
  const { handleApiCall } = useApi();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResponse(null);
    setUsingFallback(false);

    try {
      const requestData = {
        ...formData,
        age: parseInt(formData.age),
        condition_history: formData.condition_history || 'None reported'
      };

      console.log('🚀 Sending AI request:', requestData);

      // Use the API helper with proper error handling
      const result = await api.getAIHealthRecommendation(requestData);
      
      console.log('✅ AI Response received:', result.data);

      if (result.data) {
        const recommendation = extractRecommendation(result.data);
        
        if (recommendation) {
          setResponse({
            recommendation: recommendation,
            model_used: result.data.model_used || 'AI Model',
            timestamp: result.data.timestamp || new Date().toISOString()
          });
          setUsingFallback(false);
          toast.success('AI recommendation generated successfully');
        } else {
          throw new Error('Invalid response format from AI service');
        }
      } else {
        throw new Error('No data received from AI service');
      }

    } catch (err: any) {
      console.warn('❌ AI service error, using fallback:', err);
      const errorMessage = getErrorMessage(err);
      setError(`AI service temporarily unavailable: ${errorMessage}`);
      
      // Use fallback recommendations
      const fallbackResponse = getFallbackRecommendation(formData);
      setResponse(fallbackResponse);
      setUsingFallback(true);
      
      toast.warning('Using standard medical recommendations (AI service unavailable)');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    if (!risk) return 'default';
    
    switch (risk.toLowerCase()) {
      case 'high': return 'destructive';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getSafeRiskLevel = (response: AIResponse | null) => {
    if (!response?.recommendation?.risk_level) {
      return 'Not Specified';
    }
    return response.recommendation.risk_level;
  };

  const getSafeDiagnosis = (response: AIResponse | null) => {
    if (!response?.recommendation?.possible_diagnosis) {
      return 'Unable to determine diagnosis based on provided information.';
    }
    return response.recommendation.possible_diagnosis;
  };

  const getSafeAction = (response: AIResponse | null) => {
    if (!response?.recommendation?.follow_up_action) {
      return 'Please consult with a healthcare provider for appropriate follow-up actions.';
    }
    return response.recommendation.follow_up_action;
  };

  const getSafeAdvice = (response: AIResponse | null) => {
    if (!response?.recommendation?.advice) {
      return 'Monitor symptoms and seek medical attention if condition worsens.';
    }
    return response.recommendation.advice;
  };

  const clearForm = () => {
    setFormData({
      patient_name: '',
      age: '',
      gender: '',
      condition_history: '',
      symptoms: ''
    });
    setResponse(null);
    setError('');
    setUsingFallback(false);
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-primary rounded-2xl">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">AI Health Assistant</h1>
              <p className="text-muted-foreground text-lg">
                AI-powered clinical decision support for healthcare professionals
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <Card className="shadow-card border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Patient Assessment
              </CardTitle>
              <CardDescription>
                Enter patient details for AI-powered clinical insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="patient_name">Patient Name</Label>
                  <Input
                    id="patient_name"
                    name="patient_name"
                    value={formData.patient_name}
                    onChange={handleChange}
                    placeholder="Enter patient name"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      name="age"
                      type="number"
                      min="0"
                      max="120"
                      value={formData.age}
                      onChange={handleChange}
                      placeholder="Age"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => handleSelectChange('gender', value)}
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
                  <Label htmlFor="condition_history">Medical History</Label>
                  <Input
                    id="condition_history"
                    name="condition_history"
                    value={formData.condition_history}
                    onChange={handleChange}
                    placeholder="Hypertension, diabetes, asthma, etc."
                  />
                  <p className="text-xs text-muted-foreground">
                    Known conditions, allergies, or relevant medical history
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="symptoms">
                    Presenting Symptoms *
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Textarea
                    id="symptoms"
                    name="symptoms"
                    value={formData.symptoms}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Describe symptoms in detail including:
• Type and location of symptoms
• Duration and severity
• Triggers or relieving factors
• Associated symptoms
• Recent exposures or travel"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Be specific about symptom duration, severity, and characteristics
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={loading || !formData.symptoms.trim()}
                    className="flex-1 bg-gradient-primary hover:opacity-90"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Analyzing with AI...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Get Clinical Insights
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearForm}
                    disabled={loading}
                  >
                    Clear
                  </Button>
                </div>
              </form>

              {error && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="text-yellow-800">
                      <p className="font-medium">AI Service Notice</p>
                      <p className="text-sm mt-1">{error}</p>
                      <p className="text-xs mt-2">
                        Showing recommendations based on standard medical protocols.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Panel */}
          <Card className="shadow-card border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Clinical Assessment</CardTitle>
                {usingFallback && (
                  <Badge variant="warning" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Standard Protocol
                  </Badge>
                )}
              </div>
              <CardDescription>
                {usingFallback 
                  ? 'Based on standard medical guidelines'
                  : 'AI-powered clinical insights and recommendations'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-6 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="h-6 bg-gray-200 rounded w-32"></div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-24 bg-gray-200 rounded"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              ) : response ? (
                <div className="space-y-6">
                  {/* Risk Assessment */}
                  <div className="p-4 rounded-lg border-2 border-gray-200 bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg">Risk Assessment</h3>
                      <Badge 
                        variant={getRiskColor(getSafeRiskLevel(response))} 
                        className="text-sm"
                      >
                        {getSafeRiskLevel(response)} Risk
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Clinical urgency level based on presented symptoms
                    </p>
                  </div>

                  {/* Possible Diagnosis */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      Differential Diagnosis
                    </h3>
                    <p className="text-blue-800 leading-relaxed">
                      {getSafeDiagnosis(response)}
                    </p>
                  </div>

                  {/* Recommended Action */}
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Clinical Recommendations
                    </h3>
                    <p className="text-green-800 leading-relaxed">
                      {getSafeAction(response)}
                    </p>
                  </div>

                  {/* Health Advice */}
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <h3 className="font-semibold text-orange-900 mb-3">Patient Management</h3>
                    <p className="text-orange-800 leading-relaxed">
                      {getSafeAdvice(response)}
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="text-xs text-muted-foreground pt-4 border-t">
                    <div className="flex justify-between">
                      <span>Source: {response.model_used || 'Clinical Protocol'}</span>
                      <span>{new Date(response.timestamp || new Date()).toLocaleString()}</span>
                    </div>
                    {usingFallback && (
                      <p className="mt-2 text-yellow-600">
                        ⚠️ Based on standard medical protocols - verify with clinical judgment
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Brain className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="font-semibold mb-2 text-lg">Awaiting Assessment</h3>
                  <p className="max-w-sm mx-auto">
                    Enter patient information and symptoms to receive clinical insights and recommendations
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Clinical Disclaimer */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">Clinical Decision Support Disclaimer</p>
                <p className="leading-relaxed">
                  This AI Health Assistant provides clinical decision support based on the information provided. 
                  It is designed to assist healthcare professionals and should not replace clinical judgment, 
                  physical examination, or appropriate diagnostic testing. Always verify recommendations with 
                  current clinical guidelines and consult with specialists when appropriate. The healthcare 
                  provider retains full responsibility for patient care decisions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}