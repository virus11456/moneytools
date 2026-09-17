import assert from 'node:assert/strict';
import {
  FIRSTRADE_OPEN_URL,
  affiliateUrl,
  resolveAffiliateUrl,
} from '../app/affiliate.ts';

const REFERRAL =
  'https://www.firstrade.com/accounts/referral?im_ref=bIQJ59ginr1r';

assert.equal(FIRSTRADE_OPEN_URL, REFERRAL);
assert.equal(affiliateUrl(), REFERRAL);

assert.equal(resolveAffiliateUrl(undefined), '');
assert.equal(resolveAffiliateUrl(''), '');
assert.equal(resolveAffiliateUrl('   '), '');
assert.equal(resolveAffiliateUrl('not-a-url'), '');
assert.equal(
  resolveAffiliateUrl('https://example.com/override'),
  'https://example.com/override',
);
assert.equal(
  resolveAffiliateUrl('https://broker.example/open?ref=abc'),
  'https://broker.example/open?ref=abc',
);
assert.equal(
  resolveAffiliateUrl(REFERRAL) || FIRSTRADE_OPEN_URL,
  REFERRAL,
);

console.log(
  'Affiliate CTA default is the Firstrade referral URL; env override still resolves.',
);
