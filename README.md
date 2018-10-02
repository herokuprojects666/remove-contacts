This script automates removing pending invites in LinkedIn from people who never responded. LinkedIn has some pretty strict rules around the amount of pending invites you can have. This script accomplishes a secondary task: keeping track of all the people you uninvited. This is useful in order to avoid sending new invite requests to users that ignored you in the past. 

You will want to add the following to your bash profile (or whatever the equivalent is that you're using) for MacOS. You will likely need to update your path variable if you're on Windows to point at where Chrome is installed.
1) `export CHROME_PATH=/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome`

You may need to add the following as well: `export NODE_PATH=/usr/local/lib/node_modules` or add it to path variable if you're on Windows.

In order to run the script you will need to execute it in node. The bits you need to input are a bit gnarly so I would advise sticking those in your bash profile as well. Here is an example alias:

`alias dev="node path/to/script -s \"cookie_session\""`

`-s` is a required paramter. This is the session cookie LinkedIn uses to determine if you're logged in. This can be found in dev tools by looking at the cookies and copy/pasting the value in `li_at` key.

At current, the amount of pages of pending invites that get removed is limited to 2. I will be updating this in the future to support removing more a user supplied amount of pages instead.
