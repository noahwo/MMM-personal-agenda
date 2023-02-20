/* MagicMirror²
 * Module: Personal Agenda
 *
 * By Guanghan Wu and Kalle Paananen
 * MIT Licensed.
 */

Module.register("personal_agenda", {
  defaults: {
    // publisher of detected person
    publisher: "https://3fa63cf9-c25c-4bea-ad55-3a8b87658c97.mock.pstmn.io"
  },
  start() {
    this.viewModel = {
      personId: "...",
      agendaEvs: "loading..."
    };
    //   sends initialization notification to node_helper.js
    this._initCommunication();
  },
  //   specifies template file
  getTemplate: function () {
    return "personal_agenda.njk";
  },

  // This is called when data updated
  getTemplateData: function () {
    return this.viewModel;
  },
  
  //  auto invocation
  // wait is this funtion really useful?
  notificationReceived(notification, payload, sender) {
    switch (notification) {
      case "PERSONAL_AGENDA.PERSON_RECOGNIZED":
        this.sendSocketNotification("PERSONAL_AGENDA.PERSON_DETECTED", {
          personId: payload.personId
        });
        break;
      case "PERSONAL_AGENDA.PERSON_DISMISSED":
        this.sendSocketNotification("PERSONAL_AGENDA.PERSON_DISMISSED", {});
        break;
      default:
        // do nothing for other cases
        break;
    }
  },

  // socketNotificationReceived from helper
  socketNotificationReceived(notificationName, payload) {
    switch (notificationName) {
      case "PERSONAL_AGENDA.DATA_RECEIVED":
        if (payload) {
          this.viewModel = {
            personId: payload.personId,
            agendaEvs: payload.agendaEvs
          };
          console.log(this.viewModel);
          // this.getCalendar();
          this.sendSocketNotification("PERSONAL_AGENDA.GETCAL", {
            personId: payload.personId
          });
          this.updateDom();
        }
        break;
      case "PERSONAL_AGENDA.AGENDA_RECEIVED":
        if (payload) {
          this.viewModel = {
            personId: payload.personId,
            agendaEvs: payload.agendaEvs
          };
          console.log(this.viewModel);
          this.updateDom();
        }
        break;

      default:
        break;
    }
  },
  _initCommunication() {
    this.sendSocketNotification("PERSONAL_AGENDA.INIT", {
      url: this.config.publisher
    });
  }
});
