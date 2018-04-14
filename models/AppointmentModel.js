const moment = require('moment')

class AppointmentModel{

    constructor(appointment_entry) {
        let offset = (new Date()).getTimezoneOffset()* 60000
        let stdt= new Date(new Date(appointment_entry.start_date)-offset).toISOString().substring(0,16).replace('T',' ').replace("-","/").replace("-","/")
        let etdt = new Date(new Date(appointment_entry.end_date)-offset).toISOString().substring(0,16).replace('T',' ').replace("-","/").replace("-","/")
        this.id = '' + appointment_entry._id + ''
        this.text = appointment_entry.text
        this.start_date = stdt.substring(5,10) + '/' +stdt.substring(0,4) + ' ' + stdt.substring(11,16)
        this.end_date = etdt.substring(5,10) + '/' +etdt.substring(0,4) + ' ' + etdt.substring(11,16)
        this.studentID = appointment_entry.studentID
        this.booked = appointment_entry.booked
    }

    serialize(){
        return {
            _id: this.id,
            text: this.text,
            start_date: this.start_date,
            end_date: this.end_date,
            studentID: this.studentID ,
            booked: (this.booked) ?"1":"0"
        }
    }

    static deserialize(sAppointment) {
        return new AppointmentModel({
            _id: sAppointment._id,
            text: sAppointment.text,
            start_date: sAppointment.start_date ,
            end_date: sAppointment.end_date ,
            studentID: sAppointment.studentID ,
            booked: (sAppointment.booked=="1") ?true:false
        })
    }
}

module.exports = AppointmentModel