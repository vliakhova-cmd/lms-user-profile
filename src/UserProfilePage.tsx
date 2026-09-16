import { useState } from 'react';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import TopHeaderBar from './appShell/TopHeaderBar';
import LeftIconNav from './appShell/LeftIconNav';
import CollapsiblePanel from './appShell/CollapsiblePanel';
import StudySidebar, { USER_ITEMS, USER_SECTION_LABELS, type UserSectionId } from './StudySidebar';
import TrainingToolbar, { userActions } from './TrainingToolbar';
import FilterRow, { USER_FILTERS } from './FilterRow';
import ViewTabs from './ViewTabs';
import { UserGeneralInfo, UserTasks, UserCourses, UserPlans, UserGroups, UserCertificates, NotEnrolledBanner } from './UserSections';
import { userProfile, rolesFor } from './userData';
import { SITES } from './sitesData';
import { studyUrl, siteUrl, siteNumberOf, go } from './links';
import { color, type, page, subNav, pageHeader } from './tokens';

// The USER profile — one person at one site, its own app and its own repo.
//
// Reached with ?site=<number>&user=<name>, from the site's personnel list or
// from a training gap. The levels above it live in other apps, so its crumbs
// and its panel's Site row are links out rather than state changes.

const params = () => new URLSearchParams(window.location.search);

/** ?site= — which site's log this person is being read against. */
function requestedSite(): string {
  const asked = params().get('site');
  const found = SITES.find(s => s.name === asked || siteNumberOf(s.name) === asked);
  return (found ?? SITES[0]).name;
}

/** ?user= — who. Falls back to the first person the site's roster names. */
function requestedUser(site: string): string {
  return params().get('user') ?? (rolesFor('Dr. Elena Ruiz', site).length > 0 ? 'Dr. Elena Ruiz' : '');
}

function requestedSection(): UserSectionId {
  const asked = params().get('section') ?? '';
  return asked in USER_SECTION_LABELS ? (asked as UserSectionId) : 'general-info';
}

export function UserProfilePage() {
  const [site] = useState(requestedSite);
  const [name] = useState(() => requestedUser(site));
  const [section, setSection] = useState<UserSectionId>(requestedSection);
  const [groupView, setGroupView] = useState<'Owner of' | 'Member of'>('Member of');

  const user = userProfile(name, site, rolesFor(name, site));
  const number = siteNumberOf(site);
  const isInfo = section === 'general-info';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: color.pageBg,
        fontFamily: type.body.fontFamily,
      }}
    >
      <TopHeaderBar
        crumbs={[
          { label: 'Company Dashboard', value: 'Manage Studies & Sites', onClick: () => go(studyUrl('sites')) },
          { label: 'Studies', value: 'Bivivid', onClick: () => go(studyUrl('general-info')) },
          { label: 'Sites', value: site, onClick: () => go(siteUrl(number, 'general-info')) },
          { label: 'Users', value: user.name, onClick: () => setSection('general-info') },
          { value: USER_SECTION_LABELS[section], isEnd: true },
        ]}
        avatarInitials="SL"
        role="S. Admin"
        notifCount={2}
      />

      <div style={{ display: 'flex', flex: '1 0 0', minHeight: 0 }}>
        <LeftIconNav />

        <CollapsiblePanel defaultWidth={subNav.width}>
          <StudySidebar
            name={user.name}
            level="USER"
            statusLabel={user.status}
            glyph={faUser}
            photo={user.photo}
            round
            info={[
              { label: 'Site', value: user.site, link: true, onClick: () => go(siteUrl(number, 'site-personnel')) },
              { label: 'Site Role', value: user.siteRole },
            ]}
            items={USER_ITEMS}
            selected={section}
            onSelect={id => setSection(id as UserSectionId)}
          />
        </CollapsiblePanel>

        <div style={{ display: 'flex', flexDirection: 'column', flex: '1 0 0', minWidth: 0, minHeight: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: pageHeader.gapM,
              padding: `${pageHeader.paddingY}px ${pageHeader.paddingX}px`,
              backgroundColor: color.pageHeaderBg,
              flexShrink: 0,
              minWidth: 0,
            }}
          >
            <h1 style={{ margin: 0, ...type.h1, color: color.pageHeaderText, flexShrink: 0 }}>{USER_SECTION_LABELS[section]}</h1>
          </div>

          <div
            style={{
              flex: '1 0 0',
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              padding: `${page.paddingY}px ${page.paddingX}px`,
              gap: 15,
              minHeight: 0,
            }}
          >
            {!isInfo && (
              <>
                <TrainingToolbar {...userActions(section)} searchPlaceholder="Search" />
                <FilterRow filters={USER_FILTERS} />
              </>
            )}

            {/* Owner of / Member of, as the source frames split groups */}
            {section === 'groups' && (
              <ViewTabs tabs={['Member of', 'Owner of']} value={groupView} onChange={v => setGroupView(v as 'Owner of' | 'Member of')} />
            )}

            {/* Said once at the top of the section, not left to be inferred
                from a chip on one row. */}
            {section === 'tasks' && <NotEnrolledBanner user={user} />}

            {isInfo ? (
              <UserGeneralInfo user={user} />
            ) : (
              <>
                <span style={{ ...type.bodyBold, color: color.text }}>
                  {section === 'tasks' && `${user.tasks.length} Delegated Tasks`}
                  {section === 'courses' && `${user.courses.length} Courses`}
                  {section === 'learning-plans' && `${user.plans.length} Learning Plans`}
                  {section === 'groups' && `${user.groups.filter(g => (groupView === 'Owner of' ? g.owner : !g.owner)).length} Groups`}
                  {section === 'certificates' && `${user.certificates.length} Certificates`}
                </span>

                {section === 'tasks' && <UserTasks user={user} />}
                {section === 'courses' && <UserCourses user={user} />}
                {section === 'learning-plans' && <UserPlans user={user} />}
                {section === 'groups' && <UserGroups user={user} view={groupView} />}
                {section === 'certificates' && <UserCertificates user={user} />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfilePage;
