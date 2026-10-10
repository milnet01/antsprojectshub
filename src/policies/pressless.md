Pressless is an app you run on your own computer to write and publish
your website. This page says what it does with your information.

## The short version

- Pressless has no server. Nothing you write, and nothing it reads from
  Google or GitHub, is sent to the people who make Pressless.
- Your information stays on your computer, apart from what you publish
  to your own website and what Pressless sends to GitHub and Google to do
  the jobs you ask of it.

## Google

If you choose to see your visitor numbers in Pressless, you sign in with
Google. Pressless then asks Google for one thing: permission to read your
Google Analytics reports. It cannot change your Analytics settings or
see anything else in your Google account.

With that permission, Pressless reads:

- the list of Analytics properties your account can see, so you can
  choose your site;
- the web streams of the property you choose, to find the id your
  site's counting code needs;
- your site's visitor numbers: how many people visited, from which
  countries, which pages they read and for how long, and how they found
  your site.

These numbers are shown to you in Pressless and nowhere else. Pressless
keeps the latest numbers in a file in its own folder on your computer,
so it does not have to ask Google again every time. That file is never
put in your website's folder, so it is never published.

Google's sign-in gives Pressless a key. Pressless keeps that key in your
computer's own password store (Windows Credential Manager, or your Linux
desktop's keyring), not in an ordinary file.

You can stop this at any time. In Pressless's Settings, follow the link
to change or turn off visitor numbers, then choose Turn off visitor
numbers. Pressless asks Google to cancel the key and forgets which
property you chose. You can also remove Pressless's
access on Google's own page: https://myaccount.google.com/permissions

Pressless's use of information it receives from Google APIs follows the
Google API Services User Data Policy, including its Limited Use
requirements. It does not sell this information, use it for
advertising, or share it with anyone.

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
