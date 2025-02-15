import React from 'react';
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid' // a plugin!


function Calendar() {
  return (
    <div>
      <h2>Calendar Page</h2>
      <p>This is where the Calendar functionality will be implemented.</p>

      <FullCalendar
      plugins={[ dayGridPlugin ]}
      initialView="dayGridMonth"
    />

    </div>
    


  );
}

export default Calendar;
