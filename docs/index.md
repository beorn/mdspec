---
layout: home

hero:
  name: mdtest
  tagline: Write tests in markdown. Run them as code.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: GitHub
      link: https://github.com/beorn/mdtest

features:
  - title: Executable Docs
    details: Turn CLI documentation into tests. Console code fences become runnable test cases with expected output assertions.
  - title: Pattern Matching
    details: Match dynamic output with ellipsis wildcards, regular expressions, and named captures that can be reused across commands.
  - title: Persistent Context
    details: Environment variables, working directory, and bash functions persist across code blocks within a test file.
  - title: Plugin System
    details: Replace bash subprocess execution with in-process plugins for up to 8x faster test runs.
  - title: REPL Testing
    details: Test interactive shells and REPLs with persistent subprocess mode, PTY support, and OSC 133 completion detection.
  - title: Framework Integration
    details: Run markdown tests through Vitest or Bun alongside your TypeScript test suite.
---
