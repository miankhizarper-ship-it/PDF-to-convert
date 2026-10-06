/* ==========================================================================
   contact.js — turns the contact form into a mailto: link.
   There is deliberately no backend, so nothing is posted anywhere.
   ========================================================================== */
(function () {
  "use strict";

  var FT = window.FT;
  var form = FT.$("#contact-form");
  if (!form) return;

  var SUPPORT_EMAIL = "hello@filetools.app";
  var statusEl = FT.$('[data-component="status"]');

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var name = FT.$("#contact-name").value.trim();
    var email = FT.$("#contact-email").value.trim();
    var topic = FT.$("#contact-topic").value;
    var message = FT.$("#contact-message").value.trim();

    var problems = [];
    if (!name) problems.push("your name");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) problems.push("a valid email address");
    if (message.length < 10) problems.push("a message of at least 10 characters");

    if (problems.length) {
      statusEl.textContent = "Please add " + problems.join(", ") + ".";
      FT.toast("Check the form", "warning", "Please add " + problems.join(", ") + ".");
      return;
    }

    var subject = "[" + topic + "] from " + name;
    var body = message + "\n\n—\n" + name + "\n" + email + "\nSent from filetools.app/contact.html";
    var href =
      "mailto:" +
      SUPPORT_EMAIL +
      "?subject=" +
      encodeURIComponent(subject) +
      "&body=" +
      encodeURIComponent(body);

    window.location.href = href;
    statusEl.textContent = "Your email app should open with the message ready to send.";
    FT.toast("Message prepared", "success", "Finish sending it from your email app.");
  });
})();
