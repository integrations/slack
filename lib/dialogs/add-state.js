/*
This function adds a state property for dialogs, in order to carry additional, hidden,
information to the webhook received when the dialog is submitted. Typically this information will
be used in middleware functions and injected into attributes of res.locals.
*/
module.exports = (dialog, channel, resource) => {
  const state = JSON.stringify({ resource, channel });
  return { state, ...dialog };
};
