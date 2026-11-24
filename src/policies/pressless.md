Pressless is a program that runs on your own computer. It sends the
people who make Pressless nothing, unless you say yes to usage reports or
press Send my log (see Usage reports and Send my log below).

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
  countries and which provinces or states, on which days (or months,
  for spans longer than 90 days), which pages they read and for how
  long, and
  how they found your site (for example, a search engine or a link).

These are totals. Google Analytics does not give Pressless the names,
email addresses or internet addresses of your visitors.

### How Pressless uses it

Only to show these figures to you, inside Pressless, on your own
computer, and to fill in your site's measurement id. Pressless does not
use Google user data for advertising, does not sell it, and does not use
it to train any AI or machine-learning model.

### Who it is shared with

No one. Its makers never receive your visitor figures or any other
Google user data, with one exception you control: if Google refused a
request, the log keeps Google's own short error message, which can name
your Analytics property or YouTube channel. That message reaches the
developer only if you press Send my log. Usage reports carry none of it. Pressless talks
to Google only to ask for the figures above, and it does not send Google
user data to anyone else.

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
  anything, and forgets which property you chose. It also deletes the key
  and the visitor figures from your computer; your publishing key is left
  alone. If Google cannot be reached, Pressless still deletes them, says
  so, and links you to Google's permissions page below, where you can
  cancel the key yourself. If either cannot be deleted, Pressless says so.
- You can also remove Pressless's access from Google's side at any time:
  <https://myaccount.google.com/permissions>.

Pressless's use and transfer of information received from Google APIs
adheres to the
[Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy),
including the Limited Use requirements.

## GitHub

Pressless publishes your website through GitHub. When you sign in with
GitHub, Pressless keeps GitHub's key in your computer's password store
too. If your computer has none, Pressless keeps it in a file only your account
can read, in its own Pressless-data folder, and tells you so. It uses the key to create your site's repository, switch the site
on, and publish the pages you press. You can remove Pressless's access
from your GitHub settings, under Applications.

## YouTube figures

Insights can show your YouTube channel's figures. For that you make your
own YouTube key, and Pressless keeps it in your computer's password store,
like the GitHub key. If your computer has none, Pressless keeps it in a file
only your account can read, in its own Pressless-data folder, and tells you so. Pressless sends the key to Google's YouTube Data API,
which reads your channel's public counts. Pressless keeps what YouTube
returned for at most 30 days, as YouTube's policies require. Nothing is
sent to the people who make Pressless.

## Usage reports

Pressless can send anonymous usage reports. They are off unless you say
yes. Setup asks, with the box unticked. If you set Pressless up before
reports existed, it asks once, on Your site, and leaving the question
unanswered counts as no. A copy of Pressless built without the reports'
key never asks and never sends.

### What a report holds

Each report says one of these things happened:

- a Pressless screen was opened, and its address inside Pressless, such
  as `/usage`;
- a step of a guided task, such as setup, was shown, and the task's and
  the step's names;
- a guided task was finished, and its name;
- a publish or an undo ended, and whether it worked;
- something went wrong, and the kind of error, the screen, and whether
  it happened while publishing.

Each report also carries Pressless's version, your operating system's
name (with its version, where the system gives one), a random code
made when you said yes, a random number made each time Pressless
starts, and a fixed number, always 1, that Google needs to count a report.

A report never holds your writing, your pages' names, your site's
address, your files or your settings.

### Where it goes

Straight from your computer to a Google Analytics property kept for
Pressless alone, never your website's. It goes to Google's European
address, `region1.google-analytics.com`, over an encrypted connection
(HTTPS). Pressless's makers read the reports there. Like any request,
it shows Google your computer's internet address.

The property's settings, as checked on 2026-11-17:

- Google works out your country and region, such as a province, from
  that address. It does not record your city.
- Google keeps each report's details for two months. After that, only
  totals remain, such as how often a screen was opened.
- The reports cannot be used for advertising, and Google signals is
  off, so they are not linked to any Google account.

### Seeing them

The **Usage reports** link at the top of every Pressless screen opens a
screen listing the latest reports sent, word for word, newest first.

### Turning them off

On the Usage reports screen, choose **Turn usage reports off**.
Pressless stops sending, forgets its random code, and deletes its list
of sent reports from your computer. Reports already sent stay with
Google. If you turn reports on again, Pressless makes a new random code.

## Checking for updates

Each time it starts, Pressless asks GitHub whether a newer version of
Pressless has been released. That request carries nothing about you or your site; like any
visit to a web page, it shows GitHub your internet address.

## Bringing in a WordPress site

If you bring a WordPress site into Pressless, Pressless reads the export
file you chose on your own computer. It then asks your old website for
each photograph and file the export names, at the addresses written in
it. If your old website sends one of those requests on somewhere else,
such as a storage service, Pressless follows it there.

Each request asks for one file and names the Pressless version. It
carries no password, cookie or sign-in. Like any visit to a web page, it
shows that website your internet address. It is encrypted (HTTPS) where
the address in your export is. Nothing is sent to the people who make
Pressless.

## Bringing in a website by its address

If you bring in a live website by typing its address, Pressless asks that
website for its pages and files. As with a WordPress site, each request
names the Pressless version and carries no password, cookie or sign-in,
and it shows that website your internet address. Pressless never reaches
an address inside your own network, such as your router or another
computer at home. Nothing is sent to the people who make Pressless.

## Reporting a problem

If you choose to report a problem, Pressless links to GitHub's own form,
filled in with your Pressless version and your system's name (such as
"Windows 11"). You can read and change it before you send it, and
nothing is sent unless you send it. Reports there are public.

## Send my log

From Pressless 1.1.1. Pressless never sends its log by itself. When
something goes wrong, a failure page and the Report a problem page offer a
**Send my log** button. It opens a box saying what will be sent and where.
Nothing is sent unless you press **Send** in that box.

**What is sent:** Pressless's two log files, your Pressless version, and
the name of your system (for example "Windows 11"). The log records what
Pressless did and what went wrong. It names your site, its pages and its
files. Pressless writes it to leave out keys, passwords, account names and
full paths, and before sending, Pressless also removes the known shapes
of keys and tokens. If Google refused a request, the log also holds Google's short
error message, which can name your Analytics property or YouTube channel.
It never holds your visitor figures.

**Where it goes:** over an encrypted connection to a small relay the
developer runs on Cloudflare Workers. The relay files the log, and an issue
quoting the log's last lines, in a private GitHub repository that only the developer can read, and shows you a short
reference.

**Your internet address:** Cloudflare uses it to limit sends to about one a
minute from each address. The relay does not store it, and it is not part
of the stored log.

**How long it is kept:** until the developer deletes it. Nothing deletes
logs automatically yet. To have a log deleted, contact the developer and
quote its reference.

## Your website's own visitors

Your published website is yours. If you turn on visitor counting, your
pages carry Google's counting code, and Google's own privacy terms
apply to your visitors. When you turn visitor counting on,
Pressless adds a Privacy page to your site that says so, if it has
none.

If you turn on Like and Dislike buttons, they use your own Firebase
project, a Google service. Your visitors' browsers talk to that project
directly; Pressless itself never connects to it. Your site's Privacy page
covers the buttons too.

## Questions

Ask on the Pressless project page: https://github.com/milnet01/Pressless/issues
