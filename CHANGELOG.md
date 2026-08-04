# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
The site deploys continuously from `main` rather than in numbered releases,
so dated sections stand in for versions. Planned work lives in
[ROADMAP.md](ROADMAP.md).

## [Unreleased]

### Added

- Private stats dashboard leaves an OS column blank when a project has no
  build for that system, instead of printing a misleading `0`. A zero now
  means "offered, nobody downloaded it"; a blank means "no such build".
  Screen readers get "not offered for macOS", and blanks sort below real
  figures.

### Changed

- **MAME Curator is listed as a self-hosted web app rather than a Windows/macOS/Linux download.**
  Its releases carry a Python package and a source archive, not per-OS
  installers, so the three OS badges promised downloads the site could
  never offer and the button quietly fell back to the Releases page. It
  now shows a single "Download · Self-host" button and a WEB badge, which
  is how the app is actually installed: fetch it, run `run.sh` (or
  `run.bat`), and it opens in your browser.
