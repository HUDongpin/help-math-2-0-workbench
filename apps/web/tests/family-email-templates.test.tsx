import assert from 'node:assert/strict';
import test from 'node:test';

import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

import {
  FamilyAccountSecurityEmail,
  FamilyMessageNotificationEmail,
  GuardianInvitationEmail,
  WeeklyFamilyDigestEmail,
} from '../emails/family-email-templates';

const portalLink = 'https://family.example.test/family';

test('Family notification templates are bilingual and keep private details in the portal', () => {
  const english = renderToStaticMarkup(<FamilyMessageNotificationEmail
    locale="en"
    portalLink={portalLink}
  />);
  const spanish = renderToStaticMarkup(<FamilyMessageNotificationEmail
    locale="es"
    portalLink={`${portalLink.replace('/family', '')}/es/family`}
  />);
  assert.match(english, /New secure message/u);
  assert.match(english, /message content is not included/u);
  assert.match(spanish, /Mensaje nuevo/u);
  assert.match(spanish, /contenido no se incluye/u);
});

test('weekly digest contains high-level counts and no sensitive canary values', () => {
  const output = renderToStaticMarkup(<WeeklyFamilyDigestEmail
    activityCount={4}
    locale="en"
    openAssignmentCount={2}
    portalLink={portalLink}
    unreadThreadCount={1}
  />);
  assert.match(output, /4 recent activities/u);
  assert.match(output, /2 open assignments/u);
  assert.match(output, /1 unread conversations/u);
  for (const sensitive of [
    'Maya Rivera',
    '83%',
    'Growing',
    'August 28',
    'Here is the private message body',
  ]) assert.doesNotMatch(output, new RegExp(sensitive, 'u'));
});

test('invitation and security notices disclose no child or school-record detail', () => {
  const invitation = renderToStaticMarkup(<GuardianInvitationEmail
    locale="en"
    secureLink="https://family.example.test/family/invitations/accept#token=opaque"
  />);
  const security = renderToStaticMarkup(<FamilyAccountSecurityEmail
    locale="es"
    portalLink={`${portalLink.replace('/family', '')}/es/family`}
  />);
  assert.match(invitation, /expires in seven days/u);
  assert.match(security, /Aviso de seguridad de la cuenta/u);
  for (const sensitive of [
    'Maya Rivera',
    'Grade 4',
    'Ms. Rivera',
    '83%',
  ]) {
    assert.doesNotMatch(invitation, new RegExp(sensitive, 'u'));
    assert.doesNotMatch(security, new RegExp(sensitive, 'u'));
  }
});
