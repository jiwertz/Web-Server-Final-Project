function init(mode) {
    //Run the calendar from 8am to 9pm
    scheduler.config.first_hour = 8;
    scheduler.config.last_hour = 21;

    //Set the 'day' and 'week' views to be broken down into 10 minute intervals
    var step = 10;
    var format = scheduler.date.date_to_str("%h:%i %A");    
    scheduler.config.hour_size_px=(60/step)*22;
    
    //Display multiple events on a day for the 'month' calendar view
    scheduler.config.multi_day = true;
    //Set a maximum number of events to display on a day for the 'month' calendar view
    scheduler.config.max_month_events = 3;

    //default height is 40 for 60 mins, therefore 1.5=1min, so 15 is the height for a 10 min interval
    scheduler.xy.min_event_height = 15
    
    scheduler.templates.event_class = function(start, end, event) {
        //Return different css class labels based on status of event. See CalendarStyle.css for styling options.
        if (event.booked==true){
            return "booked_event";
        }else{
            return "my_event";
        }
    };
    scheduler.renderEvent = function(container, ev, width, height, header_content, body_content) {
        var container_width = container.style.width; // e.g. "105px"

        // move section
        var html = "<div class='dhx_event_move my_event_move' style='width: " + container_width + "></div>";

        // container for event contents
        html+= "<div class='my_event_body'>";
            html += "<span class='event_date'>";
                html += scheduler.templates.event_header(ev.start_date, ev.end_date, ev);
                html += "</span>";
            // displaying event text
            html += "<span>" + scheduler.templates.event_text(ev.start_date, ev.end_date, ev) + "</span>";
        html += "</div>";

        container.innerHTML = html;
        return true; // required, true - we've created custom form; false - display default one instead
    };
    //Returns the text of the event to display in the event box
    scheduler.templates.event_text = function(start, end, ev){
        return " " + ev.text
    }

    //Keep events separate if their times overlap
    scheduler.config.separate_short_events = true;

    //Sets the hour_scale to 10 minute intervals
    scheduler.templates.hour_scale = function(date){
        html="";
        for (var i=0; i<60/step; i++){
            html+="<div style='height:22px;line-height:22px;'>"+format(date)+"</div>";
            date = scheduler.date.add(date,step,"minute");
        }
        return html;
    }

    //Initialize the calendar to the current date
    scheduler.init('scheduler_here', new Date() ,mode);

    scheduler.config.xml_date="%Y-%m-%d %h:%i %A";
    
    //Get the event data from the hidden element
    let data = document.getElementById("eventData").value
    //Load the event data to the calendar
    scheduler.parse(data, "json");  

    //Make the details lightbox appear on double click
    scheduler.config.details_on_dblclick = true;
    //Hide the menu bar
    scheduler.xy.menu_width = 0

    //Disable dragging of events
    scheduler.config.drag_resize = false;
    scheduler.config.drag_move = false;
    scheduler.config.drag_create = false;

    //Only display the details small icon on left hand side when in calendar day/week view
    scheduler.config.icons_select = []

    //Check to see if current user is a verified faculty member
    if (isFaculty()){
        //Display the edit and delete icons as well on the day/week view when hovering on calendar event
        //scheduler.config.icons_select = ["icon_details","icon_edit", "icon_delete"]
    }
    else if (isStudent()){
        //Enable some drag events for a faculty member
        scheduler.config.drag_move = false;
        scheduler.config.drag_create = false;
        //Remove the delete button
        scheduler.config.buttons_right = []
        //Modify the left side buttons with a custom sign_up button, and the default cancel button
        scheduler.config.buttons_left = ["sign_up","dhx_cancel_btn"]
        //Set the label of the sign_up button
        scheduler.locale.labels["sign_up"] = "Sign Up"
    }
    else {
        //Remove the delete button
        scheduler.config.buttons_right = []
        //Only allow this type of user to see the cancel button
        scheduler.config.buttons_left = ["dhx_cancel_btn"]
    }

    //Add an event listener that prevents the light box from appearing if the event is already booked.
    scheduler.attachEvent("onBeforeLightBox", function(id){
        let event = scheduler.getEvent(id)
        if (event.booked == true){
            return false;   
        } 
        else{
            return true;
        }
    })
    
    //This adds an event listener to custom buttons, which in this case is only the sign_up button
    scheduler.attachEvent("onLightboxButton", function(button_id, node, e){
        //If user used the sign up feature, then simulate a form POST request to the server
        if(button_id == "sign_up"){
            //Create a form element with a hidden element that contains the mongoDB record id of the event
            let form = document.createElement("form")
            form.setAttribute("method", "POST")
            form.setAttribute("action", "/SignUpAdvisement")
            let appointmentID = createHiddenInput("id",scheduler.getState().lightbox_id)
            form.appendChild(appointmentID)
            document.body.appendChild(form)
            //Send the form with POST method to the server!!!
            form.submit()
        }
        //Close the popup lightbox
        scheduler.endLightbox(false,scheduler.getLightbox());
    });
    //Before allowing an event change, validate the current user is a validated faculty member
    scheduler.attachEvent("onBeforeEventChanged",(id,e)=>{
        if (isFaculty()){
            return true;
        }
        else{
            return false;
        }
    })
    //Before allowing an event creation, validate the current user is a validated faculty member
    scheduler.attachEvent("onBeforeEventCreated",(id,e)=>{
        if (isFaculty()){
            return true;
        }
        else{
            return false
        }
    })
    //Before allowing an event deletion, validate the current user is a validated faculty member
    scheduler.attachEvent("onBeforeEventDelete",(id,e)=>{
        if (isFaculty()){
            return true;
        }
        else{
            return false
        }
    })
    scheduler.attachEvent("onEventChanged",(id,e)=>{
        //Send message back to the server to update the event's details in the database
    })
    scheduler.attachEvent("onEventCreated",(id,e)=>{
        //Send message back to the server to add a new event to the database

    })
    scheduler.attachEvent("onEventDeleted",(id,e)=>{
        //Send message back to the server to delete the event from the database
    })
}

function createHiddenInput(name, value){
    let element = document.createElement("input")
    element.setAttribute("type", "hidden")
    element.setAttribute("name", name)
    element.setAttribute("value",value)
    return element
}

function isFaculty(){
    //Get references to the hidden fields to determine if the current user is a verified faculty member
    let isFaculty = document.getElementById("isFaculty")
    let facultyVerified = document.getElementById("isFacultyVerified")
    if (isFaculty.value == 'true' && facultyVerified.value == 'true'){
        return true;
    }
    else {
        return false;
    }
}

function isStudent(){
    //Get references to the hidden fields used to determine if the current user is a verified stduent
    let isFaculty = document.getElementById("isFaculty")
    let isVerified = document.getElementById("isVerified")
    if (isFaculty.value == 'false' && isVerified.value == 'true'){
        return true;
    }
    else{
        return false;
    }
}
