import { SITE_DOA, type Duty } from './doaData';
import { PERSONNEL, STUDY_GAP_ROWS, type GapRow } from './personnelData';
import { LIBRARY_COURSES, LEARNING_PLANS, planCourseNames } from './libraryData';

// The user profile's model.
//
// Almost nothing here is typed out: a user's courses, plans, certificates and
// tasks are DERIVED from what the study already holds — the site's signed DOA
// log says which duties their role carries, the matrix says which course
// qualifies each duty, and the gap list says which of those they are missing.
// So the profile cannot claim training the rest of the prototype denies.

/** Site Role as the personnel list writes it → the role code on a DOA log. */
const ROLE_CODE: Record<string, string> = {
  'Principal Investigator': 'PI',
  'Sub-Investigator': 'Sub-I',
  'Study Coordinator': 'Coordinator',
  'Research Nurse': 'Study Nurse',
  Pharmacist: 'Pharmacist',
  'Data Entry': 'Data Entry',
  'Lab Technician': 'Lab Technician',
};

/**
 * Four ways a task's training can stand, and two of them are gaps somebody
 * has to close. NOT ENROLLED is an administrator's — nobody assigned it.
 * OVERDUE is the learner's — they have it and have not finished. NO COURSE is
 * the study's: the duty is delegated and nothing in the library qualifies it.
 */
export type UserCourseState = 'Completed' | 'In Progress' | 'Not Started' | 'Not Enrolled' | 'Overdue' | 'No Course';

export interface UserTask {
  no: number;
  name: string;
  site: string;
  role: string;
  courses: string[];
  state: UserCourseState;
  /** Set when the enrolment exists but is late. */
  due?: string;
}

export interface UserCourse {
  name: string;
  requirement: 'Required' | 'Optional';
  state: UserCourseState;
  /** Activities done of activities in the course. */
  done: number;
  total: number;
  /** The learner view's pair: the kind on top, what it came through under it. */
  enrollment: string;
  enrollmentDetail?: string;
  due: string;
  dueRule?: string;
}

export interface UserPlan {
  name: string;
  courses: number;
  state: UserCourseState;
  done: number;
  total: number;
  due: string;
  enrollment: string;
  enrollmentDetail?: string;
}

export interface UserGroup {
  name: string;
  type: 'Study-Specific' | 'Site-Specific' | 'Non-Specific';
  room?: string;
  courses: number;
  owner: boolean;
}

export interface UserCertificate {
  course: string;
  study: string;
  site: string;
  group: string;
  issued: string;
  emailed: boolean;
}

export interface UserProfile {
  name: string;
  /** The round avatar's portrait, or none when the person is unresolved. */
  photo?: string;
  email: string;
  status: string;
  site: string;
  siteRole: string;
  mainRole: string;
  additionalRole?: string;
  location: string;
  timeZone: string;
  description: string;
  firstAccess: string;
  lastAccess: string;
  tasks: UserTask[];
  courses: UserCourse[];
  plans: UserPlan[];
  groups: UserGroup[];
  certificates: UserCertificate[];
}

const STUDY = 'Bivivid';

/**
 * Each person's portrait, named here rather than derived. A face is picked to
 * match the person the rest of the prototype describes; guessing it from the
 * name in code would be a heuristic that gets people wrong, and a profile
 * photo is the worst place to be wrong about someone.
 *
 * A. Delgado has none on purpose: the log's name resolves to no single user,
 * so there is nobody to show — the avatar falls back to its glyph.
 */
const PORTRAIT: Record<string, string> = {
  'Dr. Helena Miles': 'women/65',
  'Jacob Jones': 'men/12',
  'Dr. Elena Ruiz': 'women/44',
  'Javier Moreno': 'men/45',
  'Lucía Ferrer': 'women/26',
  'Dr. Andrés Gil': 'men/76',
  'Carmen Ortega': 'women/8',
  'Pablo Navarro': 'men/32',
  'Sofía Márquez': 'women/17',
  'Dr. Min-Ho Park': 'men/56',
  'Dr. Soo-Jin Hwang': 'women/33',
  'Marta Quintero': 'women/50',
};

const portraitOf = (name: string) => {
  const face = PORTRAIT[name];
  return face ? `https://randomuser.me/api/portraits/${face}.jpg` : undefined;
};

/** The gaps the study holds for this person at this site. */
const gapsOf = (name: string, site: string): GapRow[] => STUDY_GAP_ROWS.filter(g => g.name === name && g.site === site);

/**
 * The duties that site's log delegates to their role — or to ANY of their
 * roles: someone who is both Coordinator and Data Entry carries the union of
 * the two, which is exactly why holding several roles is worth naming.
 */
function dutiesOf(site: string, siteRoles: string[]): Duty[] {
  const codes = siteRoles.map(r => ROLE_CODE[r] ?? r);
  return SITE_DOA.find(d => d.site.label === site)?.duties.filter(duty => duty.roles.some(r => codes.includes(r))) ?? [];
}

/** Courses the library lists study-wide, held by everyone with an account. */
const STUDY_WIDE = ['GCP Refresher 2026', 'Protocol Amendment 3 — What Changed'];

const dueOf = (course: string) => LIBRARY_COURSES.find(c => c.name === course)?.due ?? { value: 'No Due Date' };

/**
 * The roles a person holds at a site, for a profile opened from a URL that
 * carries only who and where. The roster names them when it has the person;
 * otherwise the gap list does, which is how someone at a site whose roster is
 * not loaded still opens with the duties they actually carry.
 */
export function rolesFor(name: string, site: string): string[] {
  const person = PERSONNEL.find(p => p.name === name);
  if (person?.siteRoles) return person.siteRoles;
  if (person?.siteRole) return [person.siteRole];
  const gap = STUDY_GAP_ROWS.find(g => g.name === name && g.site === site);
  return gap ? [gap.siteRole] : [];
}

/**
 * One person's profile. Anyone the gap list names can be opened, whether or
 * not this site's roster is loaded — the DOA log is enough to say what they
 * carry and therefore what they owe.
 */
export function userProfile(name: string, site: string, role: string | string[]): UserProfile {
  const person = PERSONNEL.find(p => p.name === name);
  const roles = Array.isArray(role) ? role : [role];
  const siteRole = roles.join(' · ');
  const gaps = gapsOf(name, site);
  const duties = dutiesOf(site, roles);

  const stateFor = (duty: Duty): { state: UserCourseState; due?: string } => {
    // A duty nothing qualifies cannot be trained for at all — that is the
    // study's gap, not the person's, and it is said rather than shown green.
    if (duty.courses.length === 0) return { state: 'No Course' };
    const gap = gaps.find(g => g.duty === duty.name);
    if (!gap) return { state: 'Completed' };
    return gap.kind === 'not-enrolled' ? { state: 'Not Enrolled' } : { state: 'Overdue', due: gap.due };
  };

  const tasks: UserTask[] = duties.map(duty => ({
    no: duty.no,
    name: duty.name,
    site,
    // Which of their roles puts this duty on them — the reason it is theirs.
    role: roles.find(r => duty.roles.includes(ROLE_CODE[r] ?? r)) ?? siteRole,
    courses: duty.courses.map(c => c.name),
    ...stateFor(duty),
  }));

  // A course is REQUIRED when a delegated task needs it, which is the only
  // reason this prototype's model ever makes one mandatory.
  const required = [...new Set(tasks.flatMap(t => t.courses.map(c => ({ course: c, task: t }))).map(x => JSON.stringify(x)))].map(
    x => JSON.parse(x) as { course: string; task: UserTask },
  );

  const byCourse = new Map<string, UserCourse>();
  for (const { course, task } of required) {
    const existing = byCourse.get(course);
    // A course a person needs for two tasks is still one enrolment; the worse
    // of the two states is the one that matters.
    if (existing && existing.state === 'Not Enrolled') continue;
    const total = 4 + (course.length % 5);
    const done = task.state === 'Completed' ? total : task.state === 'Not Enrolled' ? 0 : Math.max(1, Math.floor(total / 2));
    // An overdue enrolment still has a due date to show; the others take the
    // library's rule.
    byCourse.set(course, {
      name: course,
      requirement: 'Required',
      state: task.state,
      done,
      total,
      // Enrolled BY the site, through the role that carries the duty — the
      // same "type over detail" the study's learner view writes.
      enrollment: 'Site',
      enrollmentDetail: `${task.role} • ${site}`,
      due: dueOf(course).value,
      dueRule: dueOf(course).rule,
    });
  }
  for (const course of STUDY_WIDE) {
    byCourse.set(course, {
      name: course,
      requirement: 'Optional',
      state: 'Completed',
      done: 6,
      total: 6,
      enrollment: 'Direct Enrollment',
      due: dueOf(course).value,
      dueRule: dueOf(course).rule,
    });
  }
  const courses = [...byCourse.values()];

  // The plans that bundle any course they hold.
  const names = courses.map(c => c.name);
  const plans: UserPlan[] = LEARNING_PLANS.filter(p => planCourseNames(p.id).some(c => names.includes(c)))
    .slice(0, 2)
    .map(p => {
      const inPlan = planCourseNames(p.id);
      const done = inPlan.filter(c => courses.find(x => x.name === c)?.state === 'Completed').length;
      return {
        name: p.name,
        courses: p.courses ?? inPlan.length,
        state: done === inPlan.length ? 'Completed' : done === 0 ? 'Not Started' : 'In Progress',
        done,
        total: inPlan.length,
        due: p.due.value,
        enrollment: 'Site',
        enrollmentDetail: `${roles[0]} • ${site}`,
      };
    });

  const groups: UserGroup[] = [
    { name: `${STUDY} — ${siteRole}s`, type: 'Study-Specific', room: `${STUDY} Training`, courses: courses.length, owner: false },
    { name: `Site ${site.split(' - ')[0]} Staff`, type: 'Site-Specific', room: site, courses: tasks.length, owner: false },
    { name: 'Onboarding Group', type: 'Non-Specific', courses: 2, owner: true },
  ];

  const certificates: UserCertificate[] = courses
    .filter(c => c.state === 'Completed')
    .map((c, i) => ({
      course: c.name,
      study: STUDY,
      site,
      group: i % 2 === 0 ? `${STUDY} Training` : 'Onboarding Group',
      issued: ['24 Oct 2025', '31 Dec 2025', '11 Sep 2025', '3 Jan 2026'][i % 4],
      emailed: true,
    }));

  return {
    name,
    photo: portraitOf(name),
    email: person?.email ?? `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@site${site.split(' - ')[0]}.example`,
    status: person?.status ?? 'Active',
    site,
    siteRole,
    mainRole: person?.userRole ?? 'Learner',
    additionalRole: person?.siteCoordinator ? 'Site Coordinator' : undefined,
    location: 'Europe',
    timeZone: 'UTC+01:00',
    description: `${siteRole} at ${site}, delegated ${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'} on the site's DOA log.`,
    firstAccess: 'Wednesday, 12 November 2025, 7:39 AM',
    lastAccess: 'Tuesday, 15 September 2026, 6:04 AM',
    tasks,
    courses,
    plans,
    groups,
    certificates,
  };
}
