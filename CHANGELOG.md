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
