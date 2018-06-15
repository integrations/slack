# Private unfurls

Below are mockups for potential flows that need to be implemented before we can make private unfurls generally available.

## Current flow

Show Rich preview
![Rich preview demo](https://d2mxuefqeaa7sj.cloudfront.net/s_4ACE98FACF4997A859FBDCF23940D470F9FBABA31346EEED9CA69C21A513E7A0_1522849637496_rich+preview.gif)

Dismiss
![Dismiss demo](https://d2mxuefqeaa7sj.cloudfront.net/s_4ACE98FACF4997A859FBDCF23940D470F9FBABA31346EEED9CA69C21A513E7A0_1522849647345_dismiss.gif)

## Potential flow

`1`. Initial prompt
[![initial prompt](https://d2mxuefqeaa7sj.cloudfront.net/s_4ACE98FACF4997A859FBDCF23940D470F9FBABA31346EEED9CA69C21A513E7A0_1522849956096_image.png)](https://api.slack.com/docs/messages/builder?msg=%7B%22attachments%22%3A%5B%7B%22actions%22%3A%5B%7B%22name%22%3A%22unfurl%22%2C%22style%22%3A%22primary%22%2C%22text%22%3A%22Show%20rich%20preview%22%2C%22type%22%3A%22button%22%7D%2C%7B%22name%22%3A%22unfurl-dismiss%22%2C%22text%22%3A%22Dismiss%22%2C%22type%22%3A%22button%22%7D%5D%2C%22callback_id%22%3A%22unfurl-1%22%2C%22color%22%3A%22%2324292f%22%2C%22text%22%3A%22The%20link%20you%20shared%20is%20private%2C%20so%20not%20everyone%20in%20this%20workspace%20may%20have%20access%20to%20it.%22%2C%22title%22%3A%22Do%20you%20want%20to%20show%20a%20rich%20preview%20for%20https%3A%2F%2Fgithub.com%2Felectron%2Felectron%3F%22%7D%5D%7D)


[Message builder link](https://api.slack.com/docs/messages/builder?msg=%7B%22attachments%22%3A%5B%7B%22actions%22%3A%5B%7B%22name%22%3A%22unfurl%22%2C%22style%22%3A%22primary%22%2C%22text%22%3A%22Show%20rich%20preview%22%2C%22type%22%3A%22button%22%7D%2C%7B%22name%22%3A%22unfurl-dismiss%22%2C%22text%22%3A%22Dismiss%22%2C%22type%22%3A%22button%22%7D%5D%2C%22callback_id%22%3A%22unfurl-1%22%2C%22color%22%3A%22%2324292f%22%2C%22text%22%3A%22The%20link%20you%20shared%20is%20private%2C%20so%20not%20everyone%20in%20this%20workspace%20may%20have%20access%20to%20it.%22%2C%22title%22%3A%22Do%20you%20want%20to%20show%20a%20rich%20preview%20for%20https%3A%2F%2Fgithub.com%2Felectron%2Felectron%3F%22%7D%5D%7D)



`2`.  After clicking “Show rich preview” in initial prompt
[![automatic?](https://d2mxuefqeaa7sj.cloudfront.net/s_4ACE98FACF4997A859FBDCF23940D470F9FBABA31346EEED9CA69C21A513E7A0_1522850526140_image.png)](https://api.slack.com/docs/messages/builder?msg=%7B%22attachments%22%3A%5B%7B%22actions%22%3A%5B%7B%22name%22%3A%22unfurl-always-for-org%22%2C%22style%22%3A%22primary%22%2C%22text%22%3A%22Enable%20only%20for%20org%20listed%20above%22%2C%22type%22%3A%22button%22%7D%2C%7B%22name%22%3A%22unfurl-dismiss%22%2C%22text%22%3A%22Enable%20for%20all%20links%20I%20paste%22%2C%22type%22%3A%22button%22%7D%5D%2C%22callback_id%22%3A%22unfurl-1%22%2C%22color%22%3A%22%2324292f%22%2C%22text%22%3A%22Do%20you%20want%20to%20enable%20automatic%20previews%20for%20links%20you%20paste%20in%20Slack%3F%20You%20can%20enable%20this%20behavior%20either%20for%20all%20repos%20in%20the%20%60electron%60%20organization%2C%20or%20for%20all%20private%20links.%5CnThis%20settings%20only%20applies%20to%20you%20and%20the%20%60someteamdomain%60%20workspace.%22%2C%22title%22%3A%22Automatically%20show%20rich%20previews%3F%22%2C%22mrkdwn_in%22%3A%5B%22text%22%5D%7D%5D%7D)


[Message builder link](https://api.slack.com/docs/messages/builder?msg=%7B%22attachments%22%3A%5B%7B%22actions%22%3A%5B%7B%22name%22%3A%22unfurl-always-for-org%22%2C%22style%22%3A%22primary%22%2C%22text%22%3A%22Enable%20only%20for%20org%20listed%20above%22%2C%22type%22%3A%22button%22%7D%2C%7B%22name%22%3A%22unfurl-dismiss%22%2C%22text%22%3A%22Enable%20for%20all%20links%20I%20paste%22%2C%22type%22%3A%22button%22%7D%5D%2C%22callback_id%22%3A%22unfurl-1%22%2C%22color%22%3A%22%2324292f%22%2C%22text%22%3A%22Do%20you%20want%20to%20enable%20automatic%20previews%20for%20links%20you%20paste%20in%20Slack%3F%20You%20can%20enable%20this%20behavior%20either%20for%20all%20repos%20in%20the%20%60electron%60%20organization%2C%20or%20for%20all%20private%20links.%5CnThis%20settings%20only%20applies%20to%20you%20and%20the%20%60someteamdomain%60%20workspace.%22%2C%22title%22%3A%22Automatically%20show%20rich%20previews%3F%22%2C%22mrkdwn_in%22%3A%5B%22text%22%5D%7D%5D%7D)




`2`. After clicking “Dismiss” in initial prompt
[![getting too many prompts?](https://d2mxuefqeaa7sj.cloudfront.net/s_4ACE98FACF4997A859FBDCF23940D470F9FBABA31346EEED9CA69C21A513E7A0_1522850742455_image.png)](https://api.slack.com/docs/messages/builder?msg=%7B%22attachments%22%3A%5B%7B%22actions%22%3A%5B%7B%22name%22%3A%22unfurl-prompt-stop-today%22%2C%22text%22%3A%22Don%27t%20prompt%20me%20again%20today%22%2C%22type%22%3A%22button%22%7D%2C%7B%22name%22%3A%22unfurl-prompt-always%22%2C%22text%22%3A%22Don%27t%20prompt%20me%20again%22%2C%22type%22%3A%22button%22%7D%5D%2C%22callback_id%22%3A%22unfurl-1%22%2C%22color%22%3A%22%2324292f%22%2C%22text%22%3A%22If%20you%27re%20getting%20too%20many%20of%20these%20prompts%2C%20you%20can%20disable%20them.%20Either%20for%20the%20next%2024h%20or%20indefinitely.%22%2C%22title%22%3A%22Getting%20too%20many%20prompts%3F%22%2C%22mrkdwn_in%22%3A%5B%22text%22%5D%7D%5D%7D)


[Message builder link](https://api.slack.com/docs/messages/builder?msg=%7B%22attachments%22%3A%5B%7B%22actions%22%3A%5B%7B%22name%22%3A%22unfurl-prompt-stop-today%22%2C%22text%22%3A%22Don%27t%20prompt%20me%20again%20today%22%2C%22type%22%3A%22button%22%7D%2C%7B%22name%22%3A%22unfurl-prompt-always%22%2C%22text%22%3A%22Don%27t%20prompt%20me%20again%22%2C%22type%22%3A%22button%22%7D%5D%2C%22callback_id%22%3A%22unfurl-1%22%2C%22color%22%3A%22%2324292f%22%2C%22text%22%3A%22If%20you%27re%20getting%20too%20many%20of%20these%20prompts%2C%20you%20can%20disable%20them.%20Either%20for%20the%20next%2024h%20or%20indefinitely.%22%2C%22title%22%3A%22Getting%20too%20many%20prompts%3F%22%2C%22mrkdwn_in%22%3A%5B%22text%22%5D%7D%5D%7D)


`3`. After selecting an option in `2`
[![saved](https://d2mxuefqeaa7sj.cloudfront.net/s_4ACE98FACF4997A859FBDCF23940D470F9FBABA31346EEED9CA69C21A513E7A0_1522850922482_image.png)](https://api.slack.com/docs/messages/builder?msg=%7B%22attachments%22%3A%5B%7B%22color%22%3A%22%2324292f%22%2C%22text%22%3A%22Links%20to%20private%20resources%20you%20paste%20in%20Slack%20will%20automatically%20get%20a%20rich%20preview%2FYou%20won%27t%20get%20another%20prompt%20for%2024h.%5Cn%5Cn%20You%20can%20always%20adjust%20this%20and%20other%20settings%20by%20running%20%60%2Fgithub%20settings%60%22%2C%22title%22%3A%22Done%20%3Awhite_check_mark%3A%20%22%2C%22mrkdwn_in%22%3A%5B%22text%22%2C%22title%22%5D%7D%5D%7D)


[Message builder link](https://api.slack.com/docs/messages/builder?msg=%7B%22attachments%22%3A%5B%7B%22color%22%3A%22%2324292f%22%2C%22text%22%3A%22Links%20to%20private%20resources%20you%20paste%20in%20Slack%20will%20automatically%20get%20a%20rich%20preview%2FYou%20won%27t%20get%20another%20prompt%20for%2024h.%5Cn%5Cn%20You%20can%20always%20adjust%20this%20and%20other%20settings%20by%20running%20%60%2Fgithub%20settings%60%22%2C%22title%22%3A%22Done%20%3Awhite_check_mark%3A%20%22%2C%22mrkdwn_in%22%3A%5B%22text%22%2C%22title%22%5D%7D%5D%7D)
