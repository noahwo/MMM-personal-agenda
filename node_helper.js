/* MagicMirror²
 * Node Helper: Personal Agenda
 *
 * By Guanghan Wu and Kalle Paananen
 * MIT Licensed.
 */

// The file helps the module to fetch recognized person and sends back to personal_agenda.js

const NodeHelper = require("node_helper");
const Log = require("logger");
const fetch = require("node-fetch");
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
const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const today_ = new Date();

// For demo or dwbugging, the data can be shifted to see agenda of different dates
const today = new Date(today_.getTime() + 2 * (24 * 60 * 60 * 1000));

const ical = require("node-ical");
const calendarLink =
  "https://sisu.helsinki.fi:443/ilmo/api/calendar-share/74e0b648-8278-413a-825f-16d5bad8250c";

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
      case "PERSONAL_AGENDA.INIT":
        _self.url = payload.url;
        _self._fetchData();
        setTimeout(function () {
          _self._fetchData();
        }, 1000 * 60);
        break;
      case "PERSONAL_AGENDA.PERSON_DETECTED":
        clearTimeout();
        _self._person_id = payload.personId;
        _self._fetchData();
        setTimeout(function () {
          //   to fetch data
          _self._fetchData();
        }, 1000 * 60);
        break;
      case "PERSONAL_AGENDA.PERSON_DISMISSED":
        clearTimeout();
        _self._person_id = payload.personId;
        _self._fetchData();
        setTimeout(function () {
          _self._fetchData();
        }, 1000 * 60);
        break;
      case "PERSONAL_AGENDA.GETCAL":
        _self._getCalendar(payload.personId);
    }
  },

  // _fetchData() {
  //   _self._fetchData();
  // },

  _fetchData() {
    var options = { method: "GET" };
    var url = _self._person_id
      ? _self.url + "?person_id=" + _self.person_id
      : _self.url;

    //	start to fetch and wait for data
    fetch(url, options)
      .then((resp) => resp.json())
      .then((json) => _self._onPersonalAgendaReceived(json))
      .catch((error) => Log.log(error));
  },

  // process the fetched recgonition data from API
  _onPersonalAgendaReceived(resp) {
    const params = resp;
    Log.log("ID: " + params.person_id + " TITLE: " + params.title);
    const payload = {
      personId: params.person_id,
      title: params.title
    };
    // publish event to inform that data is received, and sends back the data to personal_agenda.js
    _self.sendSocketNotification("PERSONAL_AGENDA.DATA_RECEIVED", payload);
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
        personId: personId,
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
  _parseDate(date) {
    return `${weekdays[date.getDay()]} ${date.getDate()} ${
      months[date.getMonth()]
    }, ${1900 + date.getYear()}`;
  },
  _parseTime(time) {
    return time.toLocaleTimeString("en-GB").replace(/:(00)$/, "");
  },
  _parseLocation(location) {
    if (location === undefined) {
      return "";
    } else {
      return location.split(",")[1].trim();
    }
  },
  _parseCourseName(str) {
    return (
      str.split(",")[0] +
      str.split(",")[1] +
      ": " +
      str.split(",")[3].split(" ")[1]
    );
  }
});
