import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pill, Edit, Trash2, Repeat, Activity, CalendarDays, CheckCircle2, Stethoscope, FileEdit } from "lucide-react";

// A simplified version of the VisitLog component that we can include in PatientRecordRedesigned
export default function VisitLog({ 
  visits = [], 
  isLoadingVisits = false, 
  selectedVisitId = null,
  onCreateVisit = () => {},
  onViewVisit = () => {},
  onEditVisit = () => {},
  onDeleteVisit = () => {},
  onCreateFollowUp = () => {},
  formatDate = (date) => date,
  getChiefComplaint = (visit) => visit.chiefComplaint || "Unknown"
}) {
  return (
    <Card className="overflow-hidden border-none shadow-md">
      <CardHeader className="pb-3 bg-gradient-to-r from-white to-blue-50/50 border-b">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="bg-primary/10 p-2 rounded-lg mr-3">
              <FileEdit className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg">Visit Log</CardTitle>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onCreateVisit} 
            className="create-button flex items-center shadow-sm"
          >
            <Pill className="h-3.5 w-3.5 mr-1 prescription-icon" /> New Rx
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoadingVisits ? (
          <div className="p-8 flex flex-col items-center justify-center">
            <div className="relative w-14 h-14 mb-3">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Activity className="h-5 w-5 text-primary/70" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Loading visit history...</p>
          </div>
        ) : visits.length === 0 ? (
          <div className="empty-state p-8">
            <div className="empty-state-icon">
              <Activity className="h-6 w-6 tooth-icon" />
            </div>
            <h3 className="text-base font-medium mb-1">No Visit Records</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
              Create your first visit record to start tracking patient treatments and prescriptions.
            </p>
            <Button 
              variant="outline" 
              onClick={onCreateVisit} 
              className="bg-primary/5 border-primary/20 hover:bg-primary/10"
            >
              <Pill className="h-4 w-4 mr-2 prescription-icon" /> Create First Visit
            </Button>
          </div>
        ) : (
          <div className="visit-list">
            {[...visits].reverse().map((visit) => {
              // Determine visit type icon based on chief complaint
              let VisitIcon = Activity;
              let visitStatusColor = "bg-neutral-200";
              
              if (visit.chiefComplaint) {
                const complaint = visit.chiefComplaint.toLowerCase();
                if (complaint.includes('pain') || complaint.includes('ache')) {
                  visitStatusColor = "bg-red-400";
                  VisitIcon = Activity;
                } else if (complaint.includes('check') || complaint.includes('exam')) {
                  visitStatusColor = "bg-blue-400";
                  VisitIcon = Stethoscope;
                } else if (complaint.includes('clean') || complaint.includes('scaling')) {
                  visitStatusColor = "bg-green-400";
                  VisitIcon = CheckCircle2;
                }
              }
              
              // Check if visit has treatment completed
              const hasTreatment = visit.treatmentDone && visit.treatmentDone.length > 0;
              
              return (
                <div 
                  key={visit.id} 
                  className={`visit-item p-4 ${selectedVisitId === visit.id ? 'active' : ''}`}
                  onClick={() => onViewVisit(visit.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start">
                      <div className="visit-icon">
                        <VisitIcon className="h-4 w-4" />
                      </div>
                      <div className="ml-1">
                        <div className="visit-title flex items-center">
                          <span className="truncate max-w-[160px]">
                            {getChiefComplaint(visit)}
                          </span>
                          <div className={`w-2 h-2 rounded-full ml-2 ${visitStatusColor}`}></div>
                        </div>
                        <div className="mt-1 flex items-center gap-3">
                          <div className="visit-date">
                            <CalendarDays className="h-3 w-3 inline-block mr-1 opacity-70" /> 
                            {formatDate(visit.date)}
                          </div>
                          {hasTreatment && (
                            <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4">
                              Treated
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1 items-center action-buttons">
                      {visit.nextAppointment && (
                        <Badge variant="outline" className="visit-badge text-xs font-normal mr-1 border-dashed">
                          <CalendarDays className="h-3 w-3 mr-1" />
                          Follow-up
                        </Badge>
                      )}
                      <Button
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditVisit(visit.id);
                        }}
                        className="h-7 w-7 hover:bg-primary/10 hover:text-primary"
                        title="Edit visit"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteVisit(visit.id, e);
                        }}
                        className="h-7 w-7 hover:bg-red-50 hover:text-red-500"
                        title="Delete visit"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCreateFollowUp(visit.id);
                        }}
                        className="h-7 w-7 hover:bg-primary/10 hover:text-primary"
                        title="Create follow-up"
                      >
                        <Repeat className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}