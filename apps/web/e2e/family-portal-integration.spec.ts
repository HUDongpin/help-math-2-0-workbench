import AxeBuilder from '@axe-core/playwright';
import {
  expect,
  test,
  type APIRequestContext,
  type BrowserContext,
  type Page,
} from '@playwright/test';

test.describe.configure({mode: 'serial', timeout: 600_000});
test.skip(
  process.env.FAMILY_INTEGRATION_E2E_ENABLED !== 'true',
  'The protected product integration profile is explicit and local-only.',
);

function requiredEnvironment(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing protected E2E configuration: ${name}`);
  return value;
}

function allStrings(value: unknown, output: string[] = []): string[] {
  if (typeof value === 'string') output.push(value);
  else if (Array.isArray(value)) value.forEach((item) => allStrings(item, output));
  else if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => allStrings(item, output));
  }
  return output;
}

function normalizedMailText(value: unknown) {
  return allStrings(value).join('\n')
    .replace(/=\r?\n/gu, '')
    .replace(/=3D/giu, '=')
    .replace(/&amp;/giu, '&')
    .replace(/&#x3d;|&#61;/giu, '=')
    .replace(/&quot;/giu, '"');
}

function safeLoopbackUrlShapes(text: string) {
  const shapes: string[] = [];
  for (const match of text.match(/https?:\/\/[^\s<>"']+/gu) ?? []) {
    try {
      const url = new URL(match.replace(/[),.;]+$/u, ''));
      if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) continue;
      const keys = [...new Set(url.searchParams.keys())].sort();
      shapes.push(`${url.protocol}${url.pathname}${keys.length > 0 ? `?${keys.join(',')}` : ''}${url.hash ? '#fragment' : ''}`);
    } catch {
      // Only normalized loopback URL shapes are useful failure diagnostics.
    }
  }
  return shapes;
}

async function mailpitMessages() {
  const base = requiredEnvironment('FAMILY_E2E_MAILPIT_URL');
  const response = await fetch(`${base}/api/v1/messages`, {
    redirect: 'error',
    signal: AbortSignal.timeout(2_000),
  });
  if (!response.ok) throw new Error('Mailpit message inventory unavailable.');
  const payload = await response.json() as Record<string, unknown>;
  const messages = Array.isArray(payload.messages) ? payload.messages : [];
  return {base, messages};
}

async function waitForMail(
  recipient: string,
  predicate: (text: string) => boolean,
) {
  const candidateIds = new Set<string>();
  const candidateTextById = new Map<string, string>();
  const candidateUrlShapes = new Set<string>();
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    const {base, messages} = await mailpitMessages();
    for (const summary of [...messages].reverse()) {
      if (!normalizedMailText(summary).includes(recipient)) continue;
      const record = summary as Record<string, unknown>;
      const id = record.ID ?? record.Id ?? record.id;
      if (typeof id !== 'string' || !id) continue;
      candidateIds.add(id);
      let text = candidateTextById.get(id);
      if (text === undefined) {
        const response = await fetch(
          `${base}/api/v1/message/${encodeURIComponent(id)}`,
          {redirect: 'error', signal: AbortSignal.timeout(2_000)},
        );
        if (!response.ok) continue;
        const detail = await response.json();
        text = normalizedMailText(detail);
        candidateTextById.set(id, text);
      }
      safeLoopbackUrlShapes(text).forEach((shape) => candidateUrlShapes.add(shape));
      if (predicate(text)) return text;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(
    `Expected loopback Mailpit message was not observed; recipient_candidates=${candidateIds.size}; url_shapes=${[...candidateUrlShapes].sort().join('|') || 'none'}.`,
  );
}

function mailUrl(text: string, requiredMarker: string) {
  const matches = text.match(/https?:\/\/[^\s<>"']+/gu) ?? [];
  for (const candidate of matches) {
    try {
      const parsed = new URL(candidate.replace(/[),.;]+$/u, ''));
      if (
        parsed.protocol === 'http:'
        && ['127.0.0.1', 'localhost', '[::1]'].includes(parsed.hostname)
        && parsed.toString().includes(requiredMarker)
      ) return parsed.toString();
    } catch {
      // Keep scanning; malformed and non-loopback candidates are never used.
    }
  }
  throw new Error(
    `Expected secure loopback email URL was not found; url_shapes=${safeLoopbackUrlShapes(text).sort().join('|') || 'none'}.`,
  );
}

async function runNotificationCron(request: APIRequestContext) {
  const response = await request.get('/api/cron/family-notifications', {
    headers: {
      Authorization: `Bearer ${requiredEnvironment('FAMILY_E2E_CRON_SECRET')}`,
    },
  });
  expect(response.status()).toBe(200);
  const result = await response.json() as {ok?: boolean; sent?: number};
  expect(result.ok).toBe(true);
  expect(result.sent ?? 0).toBeGreaterThanOrEqual(1);
}

async function signIn(page: Page, email: string, password: string, target: string) {
  await page.goto(`/sign-in?redirect_url=${encodeURIComponent(target)}`);
  await page.getByLabel('Verified email address').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', {name: 'Sign in'}).click();
  await expect(page).toHaveURL(new RegExp(`${target.replaceAll('/', '\\/')}(?:\\?|$)`, 'u'));
}

async function newRoleContext(
  context: BrowserContext,
  email: string,
  password: string,
  target: string,
) {
  const page = await context.newPage();
  await signIn(page, email, password, target);
  return page;
}

async function expectNoBlockingAxeViolations(page: Page, label: string) {
  const results = await new AxeBuilder({page})
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const blocking = results.violations.filter((violation) => (
    violation.impact === 'serious' || violation.impact === 'critical'
  ));
  expect(blocking, `${label}: ${blocking.map((item) => item.id).join(', ')}`)
    .toEqual([]);
}

test('school invite to verified Family access, two-way message, Mailpit notice, and revoke', async ({
  browser,
  request,
}) => {
  const adminEmail = requiredEnvironment('FAMILY_E2E_ADMIN_EMAIL');
  const adminPassword = requiredEnvironment('FAMILY_E2E_ADMIN_PASSWORD');
  const districtEmail = requiredEnvironment('FAMILY_E2E_DISTRICT_EMAIL');
  const districtPassword = requiredEnvironment('FAMILY_E2E_DISTRICT_PASSWORD');
  const guardianEmail = requiredEnvironment('FAMILY_E2E_GUARDIAN_EMAIL');
  const guardianPassword = requiredEnvironment('FAMILY_E2E_GUARDIAN_PASSWORD');
  const guardianRecoveredPassword = `${guardianPassword}R`;
  const teacherEmail = requiredEnvironment('FAMILY_E2E_TEACHER_EMAIL');
  const teacherPassword = requiredEnvironment('FAMILY_E2E_TEACHER_PASSWORD');

  const adminContext = await browser.newContext({reducedMotion: 'reduce'});
  const districtContext = await browser.newContext({reducedMotion: 'reduce'});
  const guardianContext = await browser.newContext({reducedMotion: 'reduce'});
  const teacherContext = await browser.newContext({reducedMotion: 'reduce'});
  try {
    const admin = await newRoleContext(
      adminContext,
      adminEmail,
      adminPassword,
      '/admin/family-access',
    );
    await expect(admin.locator('[data-family-data-mode="authorized"]')).toBeVisible();
    await admin.getByLabel('Synthetic adult address').fill(guardianEmail);
    await admin.getByRole('button', {name: 'Create synthetic invitation'}).click();
    await expect(admin.getByText(
      'The synthetic invitation was created. This view does not confirm external delivery.',
    )).toBeAttached();

    await runNotificationCron(request);
    const invitationMail = await waitForMail(
      guardianEmail,
      (text) => text.includes('/family/invitations/accept#token='),
    );
    const invitationUrl = mailUrl(
      invitationMail,
      '/family/invitations/accept#token=',
    );

    const guardian = await guardianContext.newPage();
    await guardian.goto(invitationUrl, {waitUntil: 'networkidle'});
    expect(guardian.url()).not.toContain('#token=');
    await expect(guardian.getByRole('heading', {
      level: 1,
      name: 'Sign in to review the invitation',
    })).toBeVisible();
    await guardian.getByRole('link', {name: 'Go to sign in'}).click();
    await guardian.getByRole('link', {name: 'Create an invited account'}).click();
    await guardian.getByLabel('Verified email address').fill(guardianEmail);
    await guardian.getByLabel('Password').fill(guardianPassword);
    await guardian.getByRole('button', {name: 'Create account'}).click();
    await expect(guardian.getByText(
      'Check your email to verify the account and continue.',
    )).toBeVisible();

    const verificationMail = await waitForMail(
      guardianEmail,
      (text) => text.includes('/auth/v1/verify?'),
    );
    await guardian.goto(mailUrl(verificationMail, '/auth/v1/verify?'), {
      waitUntil: 'networkidle',
    });
    await expect(guardian).toHaveURL(/\/family\/invitations\/accept$/u);
    await expect(guardian.getByRole('heading', {
      level: 1,
      name: 'Accept a family invitation safely',
    })).toBeVisible();
    await guardian.getByRole('checkbox').check();
    await guardian.getByRole('button', {name: 'Accept invitation'}).click();
    await expect(guardian.getByRole('heading', {
      level: 1,
      name: 'Invitation accepted',
    })).toBeVisible();

    await guardian.goto('/family', {waitUntil: 'networkidle'});
    await expect(guardian.locator(
      '[data-family-portal-kind="authorized-family-portal"]',
    )).toBeVisible();
    await expect(guardian.getByText('Finley Student', {exact: true}).first())
      .toBeVisible();
    await expect(guardian.getByText('Synthetic demo', {exact: true}))
      .toHaveCount(0);
    await expectNoBlockingAxeViolations(guardian, 'Authorized Family overview');

    await test.step('recover the accepted guardian account without changing identity', async () => {
      await guardian.goto('/account', {waitUntil: 'networkidle'});
      await guardian.getByRole('button', {name: 'Sign out this session'})
        .click({timeout: 15_000});
      await expect(guardian).toHaveURL(/\/sign-in/u, {timeout: 15_000});

      await guardian.goto('/recover', {waitUntil: 'networkidle'});
      await guardian.getByLabel('Verified email address')
        .fill(guardianEmail, {timeout: 15_000});
      await guardian.getByRole('button', {name: 'Request link'})
        .click({timeout: 15_000});
      await expect(guardian.getByText(
        'If an account exists, you will receive a recovery link.',
      )).toBeVisible({timeout: 15_000});
      const recoveryMail = await waitForMail(
        guardianEmail,
        (text) => text.includes('/auth/v1/verify?') && text.includes('type=recovery'),
      );
      await guardian.goto(mailUrl(recoveryMail, 'type=recovery'), {
        timeout: 15_000,
        waitUntil: 'networkidle',
      });
      await expect(guardian).toHaveURL(/\/update-password$/u, {timeout: 15_000});
      const newPassword = guardian.locator('input[name="password"]');
      await expect(newPassword).toBeVisible({timeout: 15_000});
      await newPassword.fill(guardianRecoveredPassword, {timeout: 15_000});
      await guardian.locator('input[name="passwordConfirmation"]')
        .fill(guardianRecoveredPassword, {timeout: 15_000});
      await guardian.getByRole('button', {name: 'Update password'})
        .click({timeout: 15_000});
      await expect(guardian.getByText('Your password was updated.'))
        .toBeVisible({timeout: 15_000});
    });

    await test.step('duplicate signup stays generic and only the recovered password signs in', async () => {
      await guardian.goto('/account', {waitUntil: 'networkidle'});
      await guardian.getByRole('button', {name: 'Sign out this session'})
        .click({timeout: 15_000});
      await expect(guardian).toHaveURL(/\/sign-in/u, {timeout: 15_000});

      await guardian.goto('/sign-up?redirect_url=%2Ffamily', {waitUntil: 'networkidle'});
      await guardian.getByLabel('Verified email address')
        .fill(guardianEmail, {timeout: 15_000});
      await guardian.getByLabel('Password')
        .fill(guardianRecoveredPassword, {timeout: 15_000});
      await guardian.getByRole('button', {name: 'Create account'})
        .click({timeout: 15_000});
      await expect(guardian.getByText(
        'Check your email to verify the account and continue.',
      )).toBeVisible({timeout: 15_000});

      await guardian.goto('/sign-in?redirect_url=%2Ffamily', {waitUntil: 'networkidle'});
      await guardian.getByLabel('Verified email address')
        .fill(guardianEmail, {timeout: 15_000});
      await guardian.getByLabel('Password')
        .fill(guardianPassword, {timeout: 15_000});
      await guardian.getByRole('button', {name: 'Sign in'})
        .click({timeout: 15_000});
      await expect(guardian.getByText(
        'We could not complete that request. Check the fields and try again.',
      )).toBeVisible({timeout: 15_000});
      await signIn(guardian, guardianEmail, guardianRecoveredPassword, '/family');
      await expect(guardian.locator(
        '[data-family-portal-kind="authorized-family-portal"]',
      )).toBeVisible({timeout: 15_000});
    });

    await guardian.goto('/family?view=settings', {waitUntil: 'networkidle'});
    const messageEmail = guardian.getByRole('switch', {name: 'New message email'});
    await expect(messageEmail).toHaveAttribute('aria-checked', 'false');
    await messageEmail.click();
    await expect(messageEmail).toHaveAttribute('aria-checked', 'true');

    await guardian.goto('/family?view=messages', {waitUntil: 'networkidle'});
    const firstMessage = 'Could you share one strategy we can practice at home?';
    await guardian.locator('#family-new-thread-message').fill(firstMessage);
    await guardian.getByRole('button', {name: 'Start conversation'}).click();

    const teacher = await newRoleContext(
      teacherContext,
      teacherEmail,
      teacherPassword,
      '/teacher/messages',
    );
    await expect(teacher.locator('[data-family-data-mode="authorized"]')).toBeVisible();
    const productThread = teacher.getByRole('button')
      .filter({hasText: 'Family member'})
      .filter({hasText: 'Finley Student'});
    await expect(productThread).toHaveCount(1);
    await productThread.click();
    await expect(teacher.getByText(firstMessage, {exact: true})).toBeVisible();
    const teacherReply = 'Yes. Ask Finley to compare the two quantities aloud.';
    await teacher.getByLabel('Plain-text teacher reply').fill(teacherReply);
    await teacher.getByRole('button', {name: 'Send reply'}).click();
    await expect(teacher.getByText(teacherReply, {exact: true})).toBeVisible();
    await expectNoBlockingAxeViolations(teacher, 'Authorized teacher inbox');

    await runNotificationCron(request);
    await waitForMail(
      guardianEmail,
      (text) => text.includes('You have a new HELP Math message'),
    );
    await guardian.reload({waitUntil: 'networkidle'});
    await expect(guardian.getByText(firstMessage, {exact: true})).toBeVisible();
    await expect(guardian.getByText(teacherReply, {exact: true})).toBeVisible();

    const messageCard = guardian.locator('[data-family-thread-id]')
      .filter({hasText: firstMessage});
    const threadId = await messageCard.getAttribute('data-family-thread-id');
    expect(threadId).toMatch(/^[0-9a-f-]{36}$/u);

    await guardian.goto('/family/requests?kind=correction', {waitUntil: 'networkidle'});
    await guardian.getByLabel('Optional details').fill(
      'Please review the fictional learner display label.',
    );
    await guardian.getByRole('button', {name: 'Send for review'}).click();
    await expect(guardian.getByText('Request sent for school review.')).toBeVisible();
    await expectNoBlockingAxeViolations(guardian, 'Authorized family requests');

    await teacher.goto('/teacher/family-access', {waitUntil: 'networkidle'});
    await teacher.getByLabel('Optional note').fill(
      'The family requested help with portal access.',
    );
    await teacher.getByRole('button', {name: 'Send suggestion'}).click();
    await expect(teacher.getByText(
      'Suggestion sent to the school administrator.',
    )).toBeVisible();
    await expectNoBlockingAxeViolations(teacher, 'Authorized invitation suggestion');

    await admin.goto('/admin/family-operations', {waitUntil: 'networkidle'});
    const rightsRequest = admin.getByRole('listitem')
      .filter({hasText: 'Please review the fictional learner display label.'});
    await expect(rightsRequest).toBeVisible();
    await rightsRequest.getByRole('button', {name: 'Complete'}).click();
    await expect(rightsRequest).toContainText('completed');
    const invitationSuggestion = admin.getByRole('listitem')
      .filter({hasText: 'The family requested help with portal access.'});
    await expect(invitationSuggestion).toBeVisible();
    await invitationSuggestion.getByRole('button', {name: 'Mark reviewed'}).click();
    await expect(invitationSuggestion).toContainText('reviewed');

    expect(threadId).not.toBeNull();
    await admin.getByLabel('Thread ID').fill(threadId!);
    const supportReason = 'Investigate the documented synthetic message complaint.';
    await admin.getByLabel('Reason').fill(supportReason);
    await admin.getByRole('button', {name: 'Request review'}).click();
    const pendingSupport = admin.getByRole('listitem').filter({hasText: supportReason});
    await expect(pendingSupport).toContainText('pending');
    await expectNoBlockingAxeViolations(admin, 'Authorized family operations');

    const district = await newRoleContext(
      districtContext,
      districtEmail,
      districtPassword,
      '/admin/family-operations',
    );
    const supportDecision = district.getByRole('listitem')
      .filter({hasText: supportReason});
    await supportDecision.getByRole('button', {name: 'Approve 15 min'}).click();
    await expect(supportDecision).toContainText('approved');

    await admin.goto('/admin/family-operations', {waitUntil: 'networkidle'});
    const approvedSupport = admin.getByRole('listitem').filter({hasText: supportReason});
    await approvedSupport.getByRole('link', {name: 'Open exact case'}).click();
    await expect(admin.getByRole('heading', {
      level: 1,
      name: 'Time-limited support case',
    })).toBeVisible();
    const replyToRedact = admin.getByRole('article').filter({hasText: teacherReply});
    await replyToRedact.getByRole('button', {name: 'Select for redaction'}).click();
    await admin.getByLabel('Required reason').fill(
      'Documented synthetic complaint resolution.',
    );
    await admin.getByRole('button', {name: 'Apply redaction tombstone'}).click();
    await expect(admin.getByText(
      'The message was replaced with an audited tombstone.',
    )).toBeVisible();

    await guardian.goto('/family?view=messages', {waitUntil: 'networkidle'});
    await expect(guardian.getByText(teacherReply, {exact: true})).toHaveCount(0);
    await expect(guardian.getByText(
      'Message removed by an authorized administrator',
    )).toBeVisible();

    await admin.goto('/admin/family-access', {waitUntil: 'networkidle'});
    const familyAccess = admin.getByRole('article')
      .filter({hasText: 'Family member'})
      .filter({hasText: 'Finley Student'})
      .first();
    await expect(familyAccess).toContainText('Accepted');
    await familyAccess.getByRole('button', {name: 'Revoke access'}).click();
    await expect(familyAccess).toContainText('Revoked');

    const revoked = await guardian.goto('/family', {waitUntil: 'domcontentloaded'});
    expect(revoked?.status()).toBe(404);
    await expect(guardian.getByText('Finley Student', {exact: true})).toHaveCount(0);

    await guardian.setViewportSize({height: 844, width: 390});
    const overflow = await guardian.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
  } finally {
    await Promise.all([
      adminContext.close(),
      districtContext.close(),
      guardianContext.close(),
      teacherContext.close(),
    ]);
  }
});
