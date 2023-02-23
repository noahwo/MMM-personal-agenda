/* MagicMirror²
 * Node Helper: personal_agenda
 *
 * By noahwo
 * MIT Licensed.
 */

// The file helps the module to fetch recognized person and sends back to personal_agenda.js
const Log = require("logger");
const ical = require("node-ical");
const NodeHelper = require("node_helper");

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const today_ = new Date();
const namelist = ["User1", "User2", "User3", "User4"]; // hard-coded name list for demo
const today = new Date(today_.getTime() + 0 * (24 * 60 * 60 * 1000)); // For demo or debugging, the date can be shifted to see agenda of different dates
const calendarLink =
  "https://ac7ad1dc-4af3-4a8c-b0b0-34ddc090803c.mock.pstmn.io";

module.exports = NodeHelper.create({
  _self: null,
  _person_id: null,
  start: function () {
    Log.log("Starting node helper for: " + this.name);
    _self = this;
  },

  //  notification received from personal_agenda.js
  socketNotificationReceived: function (notification, payload) {
    switch (notification) {
      case "PERSONAL_AGENDA.GETCAL":
        _self._getCalendar(payload.personId);
    }
  },

  _getCalendar(personId) {
    var agenda = [];
    ical.fromURL(calendarLink, {}, function (err, data) {
      if (err) {
        console.error(err);
        return;
      }
      for (let k in data) {
        if (data.hasOwnProperty(k)) {
          const ev = data[k];
          if (data[k].type == "VEVENT") {
            var event = _self._processDate(ev);
            if (event) {
              agenda.push(event);
            }
          }
        }
      }
      _self.sendSocketNotification("PERSONAL_AGENDA.AGENDA_RECEIVED", {
        personId: `${namelist[personId - 1]}`,
        agendaEvs: agenda
      });
      Log.log({ personId: personId, agendaEvs: agenda });
    });
  },
  // Unformatted ev.start: ddd MMM DD YYYY HH:mm:ss GMTZZZZZ (Timezone Name)
  _processDate(ev) {
    var _location = _self._parseLocation(ev.location);
    var _classname = _self._parseCourseName(ev.summary);
    var _date = _self._parseDate(ev.start);
    var _time = _self._parseTime(ev.start);
    var _thisDate = new Date(ev.start);
    var _isToday =
      _thisDate.getDate() === today.getDate() &&
      _thisDate.getMonth() === today.getMonth() &&
      _thisDate.getFullYear() === today.getFullYear();

    if (_isToday) {
      // Log.info(`${_classname} ${_location}at ${_time} on ${_date}`);

      // return a json object including cname, location, time, date
      return {
        cname: _classname,
        location: _location,
        time: _time,
        date: _date
      };
    }
  },

  // parse date to a string, used to compare if the event is today
  _parseDate(date) {
    return `${weekdays[date.getDay()]} ${date.getDate()} ${
      months[date.getMonth()]
    }, ${1900 + date.getYear()}`;
  },

  // parse time to a string, used to display on the screen
  _parseTime(time) {
    return time.toLocaleTimeString("en-GB").replace(/:(00)$/, "");
  },

  // parse location to a string, used to display on the screen
  _parseLocation(location) {
    if (location === undefined) {
      return "";
    } else {
      return location.split(",")[1].trim();
    }
  },

  // parse course name to a string, used to display on the screen
  _parseCourseName(str) {
    return (
      str.split(",")[0] +
      str.split(",")[1] +
      ": " +
      str.split(",")[3].split(" ")[1]
    );
  }
});
