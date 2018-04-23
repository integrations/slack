# Style Guide

- shorter messages are better than longer messages
- For attachments with a multi-line body no more than 2 short fields or 1 long field (each with title) should be displayed
- every attachment needs a color. We use this to display the state of the github object behind the attachment (ie: PR, issue, status)
  - if there is no state, the attachment color should be GitHub black (#24292f)
- fallback should be the same as text or pretext or title
- always show View it on GitHub, even if unfurl for consistency
- if there is a `pretext` it should appear only once per message and must appear in the first attachment (in order to sit at the top of the entire message)
- unfurls should always be major unless multiple links are shared in the same message, in which case they should be minor
