import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const webRoot = path.resolve(import.meta.dirname, '..');

test('local auth UI is bilingual, non-indexable, accessible, and fail closed', async () => {
  const [
    signInRoute,
    signUpRoute,
    accountRoute,
    authPage,
    authProvider,
    authUi,
    authStyles,
  ] = await Promise.all([
    readFile(path.join(
      webRoot,
      'app/[locale]/sign-in/[[...sign-in]]/page.tsx',
    ), 'utf8'),
    readFile(path.join(
      webRoot,
      'app/[locale]/sign-up/[[...sign-up]]/page.tsx',
    ), 'utf8'),
    readFile(path.join(webRoot, 'app/[locale]/account/page.tsx'), 'utf8'),
    readFile(path.join(webRoot, 'components/auth/local-auth-page.tsx'), 'utf8'),
    readFile(path.join(
      webRoot,
      'components/auth/clerk-local-auth-provider.tsx',
    ), 'utf8'),
    readFile(path.join(webRoot, 'components/auth/clerk-auth-ui.tsx'), 'utf8'),
    readFile(path.join(webRoot, 'components/auth/local-auth.module.css'), 'utf8'),
  ]);

  for (const route of [signInRoute, signUpRoute, accountRoute]) {
    assert.match(route, /robots: \{follow: false, index: false\}/u);
    assert.match(route, /!isLocale\(locale\) \|\| !isLocalAuthEnabled\(\)/u);
    assert.match(route, /locale === 'es'/u);
  }

  assert.doesNotMatch(
    authPage,
    /This local registration uses a Clerk development instance\./u,
  );
  assert.doesNotMatch(
    authPage,
    /Este registro local usa una instancia de desarrollo de Clerk\./u,
  );
  assert.doesNotMatch(authPage, /Create your learning account/u);
  assert.doesNotMatch(authPage, /Crea tu cuenta de aprendizaje/u);
  assert.match(authPage, /signUp \? styles\.signUpPage : ''/u);
  assert.match(authPage, /Never use historical HELP Math credentials\./u);
  assert.match(authPage, /No uses credenciales históricas de HELP Math\./u);
  assert.match(authPage, /id="main-content" tabIndex=\{-1\}/u);

  assert.match(authProvider, /if \(!isLocalAuthEnabled\(\)\) return children;/u);

  assert.match(authUi, /fontSize: '16px'/u);
  assert.match(authUi, /localizedAuthPath\(locale, '\/sign-up'\)/u);
  assert.match(authUi, /localizedAuthPath\(locale, '\/sign-in'\)/u);
  assert.match(authUi, /locale === 'es' \? 'Cerrar sesión' : 'Sign out'/u);

  assert.match(authStyles, /min-height: 44px/u);
  assert.match(authStyles, /min-height: 46px/u);
  assert.match(
    authStyles,
    /\.signUpPage \{[\s\S]*?align-items: flex-start;[\s\S]*?padding-top: clamp\(12px, 2\.5vw, 32px\);/u,
  );
  assert.match(
    authStyles,
    /box-shadow: 0 0 0 2px #fff, 0 0 0 5px #14213d/u,
  );
  assert.match(authStyles, /@media \(max-width: 480px\)/u);
  assert.match(authStyles, /flex-direction: column/u);
});
