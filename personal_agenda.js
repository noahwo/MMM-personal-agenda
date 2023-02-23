/* MagicMirror²
 * Module: personal_agenda
 *
 * By noahwo and Kalle Paananen
 * MIT Licensed.
 */

Module.register("personal_agenda", {
  defaults: {},
  start() {
    this.viewModel = {
      personId: null,
      agendaEvs: null
    };
  },
  //   specifies template file
  getTemplate: function () {
    return "personal_agenda.njk";
  },

  // This is called when data updated
  getTemplateData: function () {
    return this.viewModel;
  },

  //   notificationReceived from other modules
  notificationReceived: function (notification, payload) {
    switch (notification) {
      case "PERSON_RECOGNIZED":
        this.sendSocketNotification("PERSONAL_AGENDA.GETCAL", {
          personId: payload.personId
        });
        this.updateDom();
        break;
      case "PERSON_DISMISSED":
        this.updateDom();
        break;
      default: {
        break;
      }
    }
  },

  // socketNotificationReceived from helper
  socketNotificationReceived(notificationName, payload) {
    switch (notificationName) {
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
  }
});
