// Temp code for visit item
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
      setSelectedVisitId(visit.id);
      setActiveTab('visit');
    }}
    className="h-7 w-7 hover:bg-primary/10 hover:text-primary"
    title="Edit visit"
  >
    <Edit className="h-3.5 w-3.5" />
  </Button>
  <Button
    variant="ghost" 
    size="icon"
    onClick={(e) => handleDeleteVisit(visit.id, e)}
    className="h-7 w-7 hover:bg-red-50 hover:text-red-500"
    title="Delete visit"
  >
    <Trash2 className="h-3.5 w-3.5" />
  </Button>
</div>