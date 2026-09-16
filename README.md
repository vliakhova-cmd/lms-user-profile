# lms-site-user-profile — the user level

One person at one site: General Info, the **Tasks** that site's DOA log
delegates to them, and their Courses, Learning Plans, Groups and Certificates.

```bash
npm install
npm run dev      # http://localhost:5178/?site=0982&user=Pablo%20Navarro
```

**Live:** https://vliakhova-cmd.github.io/lms-user-profile/?site=0982&user=Pablo%20Navarro

Almost nothing here is typed out. The site's log says which duties the
person's role carries, the training matrix says which course qualifies each,
and the gap list says which of those they are missing — so Tasks can state
plainly that somebody is carrying a delegated duty with no enrolment in the
course it requires, which is the reason this level exists.

## How the levels connect

A study, a site and a user are three apps in three repositories. Moving
between them is a navigation, not a route change — each level owns its data
and its URL:

| Level | Repository | Opened with |
| --- | --- | --- |
| Study | [lms-study-profile](https://github.com/vliakhova-cmd/lms-study-profile) | `?section=` |
| Site | [lms-site-profile](https://github.com/vliakhova-cmd/lms-site-profile) | `?site=<number>&section=` |
| User | [lms-user-profile](https://github.com/vliakhova-cmd/lms-user-profile) | `?site=<number>&user=<name>&section=` |

Two more apps sit beside them, linked the same way:
[doa-log](https://github.com/vliakhova-cmd/doa-log-report) holds the signed
DOA logs the tasks are read from, and
[ai-course-authoring-flow](https://github.com/vliakhova-cmd/ai-course-authoring-flow)
writes the courses.

`src/links.ts` is where every one of those URLs is built — dev-server ports
locally, sibling Pages sites once published.

## Conventions

- **Inline styles only.** No Tailwind, no CSS modules.
- **`src/tokens.ts` is the single source of DS values**, each entry commented
  with the Figma variable it comes from. Components read tokens, never literals.
- Components come from **DS Base 2.0** and **DS Advanced 2.0**.
- A DS `icon-size` token is the **container**; the glyph inside it is smaller
  (a 30px box holds a 20px glyph, a 20px box holds a 15px one).
