Pressless is an app you run on your own computer to write and publish
your website. This page says what it does with your information.

## The short version

- Pressless has no server. Nothing you write, and nothing it reads from
  Google or GitHub, is sent to the people who make Pressless.
- Your information stays on your computer, apart from what you publish
  to your own website and what Pressless sends to GitHub and Google to do
  the jobs you ask of it.

## Google user data

Signing in with Google is optional. It is used only to show you your own
website's visitor numbers inside Pressless.

### What Google user data Pressless accesses

Pressless asks Google for one permission: to read your Google Analytics
data (`https://www.googleapis.com/auth/analytics.readonly`). It cannot
change anything in your Analytics or your Google account, and it cannot
see your email, contacts, files or anything else.

With that permission it reads:

- the names and ids of the Analytics accounts and properties your Google
  account can see, so you can choose your site;
- the web data streams of the property you choose, to find the
  measurement id your site's counting code needs;
- your site's visitor figures: how many people visited, from which
  countries, on which days (or months, for spans longer than 90 days),
  which pages they read and for how long, and
  how they found your site (for example, a search engine or a link).

These are totals. Google Analytics does not give Pressless the names,
email addresses or internet addresses of your visitors.

### How Pressless uses it

Only to show these figures to you, inside Pressless, on your own
computer, and to fill in your site's measurement id. Pressless does not
use Google user data for advertising, does not sell it, and does not use
it to train any AI or machine-learning model.

### Who it is shared with

No one. Pressless has no server, and its makers never receive any of
your data. Pressless talks to Google only to ask for the figures above,
and it does not send Google user data to anyone else.

### How it is protected

- Everything that passes between Pressless and Google's servers travels
  over an encrypted connection (HTTPS). When you sign in, Google's answer
  comes back to Pressless through your browser on your own computer,
  and never leaves it.
- The key Google gives Pressless when you sign in is kept in your
  computer's own password store: Windows Credential Manager, or your
  Linux desktop's keyring. On a Linux computer with no keyring, it is
  kept in a file in Pressless's own folder that only your user account
  can read.
- The visitor figures are kept in one file in Pressless's own folder
  (`Pressless-data`). That folder is never part of your website, so the
  figures are never published.

### How long it is kept, and how to delete it

- **Visitor figures:** Pressless keeps only the latest answer for each
  time span you look at, and replaces it when it asks Google again. It
  never keeps a history.
- **Turning it off:** in Pressless, open Settings, follow the link to
  your visitor numbers, and choose **Turn off visitor numbers**.
  Pressless asks Google to cancel its key, so it can no longer read
  anything, and forgets which property you chose. If Google cannot be
  reached, Pressless says so and links you to Google's permissions page
  below, where you can cancel it yourself.
- **Deleting what is left:** two things stay on your computer until you
  delete them. The visitor figures stay in the file `insights.json` in
  the `Pressless-data` folder; delete that file to remove them. The
  cancelled key, which no longer works, stays in your password store as
  the entry "Pressless" / "google"; delete that entry to remove it (the
  "Pressless" / "github" entry is your publishing key, so keep it). On a
  Linux computer with no keyring, both keys are in `credentials.json` in
  the same folder; the cancelled Google key there can no longer be used.
- You can also remove Pressless's access from Google's side at any time:
  <https://myaccount.google.com/permissions>.

Pressless's use and transfer of information received from Google APIs
adheres to the
[Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy),
including the Limited Use requirements.

## GitHub

Pressless publishes your website through GitHub. When you sign in with
GitHub, Pressless keeps GitHub's key in your computer's password store
too. It uses the key to create your site's repository, switch the site
on, and publish the pages you press. You can remove Pressless's access
from your GitHub settings, under Applications.

## Checking for updates

Pressless asks GitHub whether a newer version of Pressless has been
released. That request carries nothing about you or your site; like any
visit to a web page, it shows GitHub your internet address.

## Reporting a problem

If you choose to report a problem, Pressless links to GitHub's own form,
filled in with your Pressless version and your system's name (such as
"Windows 11"). You can read and change it before you send it, and
nothing is sent unless you send it. Reports there are public.

## Your website's own visitors

Your published website is yours. If you turn on visitor counting, your
pages carry Google's counting code, and Google's own privacy terms
apply to your visitors. When you turn visitor counting on,
Pressless adds a Privacy page to your site that says so, if it has
none.

## Questions

Ask on the Pressless project page: https://github.com/milnet01/Pressless/issues
