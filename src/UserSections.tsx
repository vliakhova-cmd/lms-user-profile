import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGraduationCap,
  faBookOpen,
  faUserGroup,
  faFileContract,
  faFilePdf,
  faCircleCheck,
  faCircleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import type { UserProfile, UserCourseState } from './userData';
import { Dashlet, Field } from './dashlet';
import { HEAD, CELL, Chip, CellLink, TableSurface } from './tableKit';
import { color, type, status as st, progressBar as pb, sysMsg, icon } from './tokens';

// The user profile's sections. Same chrome as every other listing here —
// tableKit on a TableSurface — and the site profile's dashlets for General
// Info, so a user reads like the study and the site it sits under.

const STATE_TONE: Record<UserCourseState, string> = {
  Completed: color.statusSolidGreen,
  'In Progress': color.statusSolidBlue,
  'Not Started': color.statusSolidGrey,
  // Two failures, not stages of progress: nobody assigned it, and nobody
  // wrote a course for it. Both read as problems rather than as a state.
  'Not Enrolled': color.statusSolidRed,
  Overdue: color.statusOrange,
  'No Course': color.statusSolidGrey,
};

export function StateChip({ state }: { state: UserCourseState }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        maxWidth: st.labelMaxWidth,
        padding: `0 ${st.paddingX}px`,
        borderRadius: st.radius,
        backgroundColor: STATE_TONE[state],
        color: color.text,
        ...type.status,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {state}
    </span>
  );
}

/** progress-bar/small — the count above its bar, as the site grids draw it. */
function Progress({ done, total, tone = color.confirmation }: { done: number; total: number; tone?: string }) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 90 }}>
      <span style={{ ...type.captionRegular, color: color.text }}>
        {done} of {total}
        <span style={{ color: color.textMuted }}> · {percent}%</span>
      </span>
      <span style={{ height: pb.height, borderRadius: pb.radius, backgroundColor: color.progressTrack, overflow: 'hidden' }}>
        <span style={{ display: 'block', width: `${percent}%`, height: '100%', borderRadius: pb.radius, backgroundColor: tone }} />
      </span>
    </span>
  );
}

export function UserGeneralInfo({ user }: { user: UserProfile }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 15, minHeight: 0, overflowY: 'auto' }}>
      <Dashlet title="User Details">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 15, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 280px', minWidth: 220 }}>
              <Field label="Name" value={user.name} />
            </div>
            <div style={{ flex: '1 1 200px', minWidth: 160 }}>
              <Field label="Location" value={user.location} />
            </div>
            <Field label="Time Zone" value={user.timeZone} width={150} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 15, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 280px', minWidth: 220 }}>
              <Field label="Email" value={user.email} />
            </div>
            <div style={{ flex: '2 1 400px', minWidth: 260 }}>
              <Field label="Description" value={user.description} />
            </div>
          </div>
        </div>
      </Dashlet>

      <Dashlet title="Profile Attributes">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 15, flexWrap: 'wrap' }}>
            <Field label="Main Role" value={user.mainRole} width={260} />
            <span style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ ...type.captionRegular, color: color.textMuted }}>Additional Role</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 30, ...type.body, color: color.text }}>
                <FontAwesomeIcon
                  icon={faCircleCheck}
                  style={{ width: icon.s, height: icon.s, color: user.additionalRole ? color.primary : color.confirmation }}
                />
                {user.additionalRole ?? 'No Additional Role'}
              </span>
            </span>
          </div>
        </div>
      </Dashlet>

      <Dashlet title="Login Activity">
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 15, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 320px', minWidth: 240 }}>
            <Field label="First Access to site" value={user.firstAccess} />
          </div>
          <div style={{ flex: '1 1 320px', minWidth: 240 }}>
            <Field label="Last Access to site" value={user.lastAccess} />
          </div>
        </div>
      </Dashlet>
    </div>
  );
}

/**
 * The fact the Tasks grid can only imply one row at a time: this person is
 * carrying a delegated duty with no enrolment in the course that qualifies it.
 * Said at the top, in the tone the site and study banners use for the same
 * thing, because it is not the learner's failure — nobody assigned it to them.
 */
export function NotEnrolledBanner({ user }: { user: UserProfile }) {
  const missing = user.tasks.filter(t => t.state === 'Not Enrolled');
  if (missing.length === 0) return null;

  return (
    <div
      role="status"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: sysMsg.gapS,
        padding: sysMsg.paddingXY,
        borderRadius: sysMsg.radius,
        backgroundColor: '#fdf0ef',
        border: `1px solid ${color.statusSolidRed}`,
        flexShrink: 0,
      }}
    >
      <FontAwesomeIcon icon={faCircleExclamation} style={{ width: icon.m, height: icon.m, color: color.critical, flexShrink: 0 }} />
      <span style={{ ...type.body, color: color.sysMsgText, minWidth: 0 }}>
        <b style={{ color: color.text }}>
          {user.name} is not enrolled in the {missing.length === 1 ? 'course' : 'courses'} required for{' '}
          {missing.length === 1 ? 'a task' : `${missing.length} tasks`}
        </b>{' '}
        delegated to them on {user.site}&apos;s DOA log — {missing.map(t => t.name).join(', ')}. Assigning the training is what closes it.
      </span>
    </div>
  );
}

/**
 * Tasks — the section the source frames do not have, and the reason a study
 * admin opens a user at all: which duties this site's log delegates to them,
 * and whether they hold the training each one requires.
 */
export function UserTasks({ user }: { user: UserProfile }) {
  return (
    <TableSurface>
      <div style={{ flex: '1 0 0', minHeight: 0, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...HEAD, width: 45 }}>#</th>
              <th style={HEAD}>Delegated Task</th>
              <th style={{ ...HEAD, width: 150 }}>Role</th>
              <th style={{ ...HEAD, width: 140 }}>Qualifying Course</th>
              <th style={{ ...HEAD, width: 160 }}>Training</th>
            </tr>
          </thead>
          <tbody>
            {user.tasks.map(task => (
              <tr key={task.no}>
                <td style={{ ...CELL, width: 45, color: color.textMuted }}>{task.no}</td>
                <td style={CELL}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
                    <FontAwesomeIcon icon={faFileContract} style={{ width: icon.s, height: icon.s, color: color.iconFaint, flexShrink: 0 }} />
                    {task.name}
                  </span>
                </td>
                {/* Plain text: the role is a fact about the row, not a
                    countable thing like the courses beside it. */}
                <td style={{ ...CELL, width: 150 }}>{task.role}</td>
                {/* A count, as the Delegated Tasks grid writes it — the names
                    are on hover, and an empty cell is the duty nothing
                    qualifies, which the Training column already states. */}
                <td style={{ ...CELL, width: 140 }} title={task.courses.join('\n')}>
                  {task.courses.length > 0 && <Chip glyph={faGraduationCap} label={task.courses.length} theme="info" />}
                </td>
                <td style={{ ...CELL, width: 160 }}>
                  <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                    <StateChip state={task.state} />
                    {task.due && <span style={{ ...type.captionRegular, color: color.cellAdditionalText }}>due {task.due}</span>}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TableSurface>
  );
}

export function UserCourses({ user }: { user: UserProfile }) {
  return (
    <TableSurface>
      <div style={{ flex: '1 0 0', minHeight: 0, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={HEAD}>Course Name</th>
              <th style={{ ...HEAD, width: 110 }}>Requirement</th>
              <th style={{ ...HEAD, width: 160 }}>Learner Progress</th>
              <th style={{ ...HEAD, width: 150 }}>Activity Progress</th>
              <th style={{ ...HEAD, width: 200 }}>Enrollment Type</th>
              <th style={{ ...HEAD, width: 140 }}>Due</th>
            </tr>
          </thead>
          <tbody>
            {user.courses.map(course => (
              <tr key={course.name}>
                <td style={CELL}>
                  <CellLink glyph={faGraduationCap} label={course.name} />
                </td>
                <td style={{ ...CELL, width: 110 }}>
                  <span style={{ ...type.captionSemibold, color: course.requirement === 'Required' ? color.critical : color.textMuted, textTransform: 'uppercase' }}>
                    {course.requirement}
                  </span>
                </td>
                <td style={{ ...CELL, width: 160 }}>
                  <StateChip state={course.state} />
                </td>
                {/* Nobody enrolled has no activities to have done */}
                <td style={{ ...CELL, width: 150 }}>
                  {course.state !== 'Not Enrolled' && <Progress done={course.done} total={course.total} />}
                </td>
                <td style={{ ...CELL, width: 200, whiteSpace: 'normal' }}>
                  <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                    <span style={{ ...type.bodySemibold, color: color.text }}>{course.enrollment}</span>
                    {course.enrollmentDetail && (
                      <span style={{ ...type.captionRegular, color: color.cellAdditionalText }}>{course.enrollmentDetail}</span>
                    )}
                  </span>
                </td>
                <td style={{ ...CELL, width: 140 }}>
                  <span style={{ display: 'flex', flexDirection: 'column' }}>
                    {course.due}
                    {course.dueRule && <span style={{ ...type.captionRegular, color: color.cellAdditionalText }}>{course.dueRule}</span>}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TableSurface>
  );
}

export function UserPlans({ user }: { user: UserProfile }) {
  return (
    <TableSurface>
      <div style={{ flex: '1 0 0', minHeight: 0, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={HEAD}>Learning Plan</th>
              <th style={{ ...HEAD, width: 110 }}>Courses</th>
              <th style={{ ...HEAD, width: 160 }}>Learner Progress</th>
              <th style={{ ...HEAD, width: 150 }}>Training Progress</th>
              <th style={{ ...HEAD, width: 200 }}>Enrollment Type</th>
              <th style={{ ...HEAD, width: 140 }}>Due</th>
            </tr>
          </thead>
          <tbody>
            {user.plans.map(plan => (
              <tr key={plan.name}>
                <td style={CELL}>
                  <CellLink glyph={faBookOpen} label={plan.name} />
                </td>
                <td style={{ ...CELL, width: 110 }}>
                  <Chip glyph={faGraduationCap} label={plan.courses} theme="info" />
                </td>
                <td style={{ ...CELL, width: 160 }}>
                  <StateChip state={plan.state} />
                </td>
                <td style={{ ...CELL, width: 150 }}>
                  <Progress done={plan.done} total={plan.total} />
                </td>
                <td style={{ ...CELL, width: 200, whiteSpace: 'normal' }}>
                  <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                    <span style={{ ...type.bodySemibold, color: color.text }}>{plan.enrollment}</span>
                    {plan.enrollmentDetail && (
                      <span style={{ ...type.captionRegular, color: color.cellAdditionalText }}>{plan.enrollmentDetail}</span>
                    )}
                  </span>
                </td>
                <td style={{ ...CELL, width: 140 }}>{plan.due}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TableSurface>
  );
}

export function UserGroups({ user, view }: { user: UserProfile; view: 'Owner of' | 'Member of' }) {
  const rows = user.groups.filter(g => (view === 'Owner of' ? g.owner : !g.owner));
  return (
    <TableSurface>
      <div style={{ flex: '1 0 0', minHeight: 0, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={HEAD}>Training Group Name</th>
              <th style={{ ...HEAD, width: 180 }}>Type</th>
              <th style={{ ...HEAD, width: 240 }}>Room Name</th>
              <th style={{ ...HEAD, width: 110 }}>Courses</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(group => (
              <tr key={group.name}>
                <td style={CELL}>
                  <CellLink glyph={faUserGroup} label={group.name} />
                </td>
                <td style={{ ...CELL, width: 180, color: color.cellAdditionalText }}>{group.type}</td>
                <td style={{ ...CELL, width: 240, color: color.cellAdditionalText }}>{group.room}</td>
                <td style={{ ...CELL, width: 110 }}>
                  <Chip glyph={faGraduationCap} label={group.courses} theme="info" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TableSurface>
  );
}

export function UserCertificates({ user }: { user: UserProfile }) {
  return (
    <TableSurface>
      <div style={{ flex: '1 0 0', minHeight: 0, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...HEAD, width: 180 }}>Certificate</th>
              <th style={HEAD}>Course Name</th>
              <th style={{ ...HEAD, width: 120 }}>Study</th>
              <th style={{ ...HEAD, width: 170 }}>Site</th>
              <th style={{ ...HEAD, width: 180 }}>Group</th>
              <th style={{ ...HEAD, width: 120 }}>Issued</th>
              <th style={{ ...HEAD, width: 110 }}>Email Sent</th>
            </tr>
          </thead>
          <tbody>
            {user.certificates.map(cert => (
              <tr key={cert.course}>
                <td style={{ ...CELL, width: 180 }}>
                  <CellLink glyph={faFilePdf} label="Certificate" />
                </td>
                <td style={CELL}>{cert.course}</td>
                <td style={{ ...CELL, width: 120, color: color.cellAdditionalText }}>{cert.study}</td>
                <td style={{ ...CELL, width: 170, color: color.cellAdditionalText }}>{cert.site}</td>
                <td style={{ ...CELL, width: 180, color: color.cellAdditionalText }}>{cert.group}</td>
                <td style={{ ...CELL, width: 120 }}>{cert.issued}</td>
                <td style={{ ...CELL, width: 110 }}>
                  {cert.emailed && <FontAwesomeIcon icon={faCircleCheck} style={{ width: icon.m, height: icon.m, color: color.confirmation }} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TableSurface>
  );
}
