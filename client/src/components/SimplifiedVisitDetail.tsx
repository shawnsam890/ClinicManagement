import React, { useState } from 'react';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ExternalLink } from 'lucide-react';

interface SimplifiedVisitDetailProps {
  visit: any;
  onAddFollowUp?: () => void;
  onGenerateInvoice?: () => void;
}

export default function SimplifiedVisitDetail({ visit }: SimplifiedVisitDetailProps) {
  if (!visit) return null;
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch (error) {
      return dateString;
    }
  };
  
  return (
    <div className="bg-white rounded-md border shadow-sm">
      <div className="p-4 border-b">
        <h2 className="text-lg font-medium">{visit.chiefComplaint || 'Consultation'}</h2>
        <p className="text-sm text-muted-foreground">{formatDate(visit.date)}</p>
      </div>
      
      <Tabs defaultValue="visit-details">
        <TabsList className="w-full border-b grid grid-cols-3">
          <TabsTrigger value="visit-details">Visit Details</TabsTrigger>
          <TabsTrigger value="prescription">Prescription</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
        </TabsList>
        
        <TabsContent value="visit-details">
          <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Chief Complaint</h4>
              <div className="p-3 bg-muted/30 rounded-md text-sm min-h-[40px]">
                {visit.chiefComplaint || 'No complaint recorded'}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Area of Complaint</h4>
              <div className="p-3 bg-muted/30 rounded-md text-sm min-h-[40px]">
                {visit.areaOfComplaint || 'Not specified'}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Oral Examination</h4>
              <div className="p-3 bg-muted/30 rounded-md text-sm min-h-[80px]">
                {visit.oralExamination || 'No examination data recorded'}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Investigation</h4>
              <div className="p-3 bg-muted/30 rounded-md text-sm min-h-[80px]">
                {visit.investigation || 'No investigation data recorded'}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Treatment Plan</h4>
              <div className="p-3 bg-muted/30 rounded-md text-sm min-h-[80px]">
                {visit.treatmentPlan || 'No treatment plan recorded'}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Treatment Done</h4>
              <div className="p-3 bg-muted/30 rounded-md text-sm min-h-[80px]">
                {visit.treatmentDone || 'No treatment recorded'}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Advice</h4>
              <div className="p-3 bg-muted/30 rounded-md text-sm min-h-[80px]">
                {visit.advice || 'No advice recorded'}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Notes</h4>
              <div className="p-3 bg-muted/30 rounded-md text-sm min-h-[80px]">
                {visit.notes || 'No notes recorded'}
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="prescription">
          <div className="p-4">
            {visit.prescription ? (
              <div className="p-3 border rounded-md">
                <pre className="text-sm whitespace-pre-wrap">{visit.prescription}</pre>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                No prescription recorded for this visit
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="files">
          <div className="p-4">
            {visit.attachments && typeof visit.attachments === 'string' && JSON.parse(visit.attachments).length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {JSON.parse(visit.attachments).map((file: string, index: number) => (
                  <div key={index} className="p-2 border rounded-md flex justify-between items-center">
                    <span className="text-sm truncate">
                      {file.split('-').pop()}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={() => window.open(`/uploads/${file}`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                No files attached to this visit
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}