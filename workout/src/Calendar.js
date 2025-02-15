import React from 'react';
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid' // a plugin!


function Calendar() {
  return (
    <div>
      <h2>Team Calendar</h2>

      <FullCalendar
      plugins={[ dayGridPlugin ]}
      initialView="dayGridMonth"
    />

    </div>
    


  );
}

export default Calendar;
