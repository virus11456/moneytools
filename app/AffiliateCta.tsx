/** TODO: replace href with a real broker affiliate tracking URL when a partner is live. Do not invent a tracking ID. */
export const AFFILIATE_PLACEHOLDER_HREF = '#broker-signup-placeholder';

export function AffiliateCta() {
  return (
    <aside className="guide-cta" id="broker-signup-placeholder">
      <span className="eyebrow">券商／開戶導購 placeholder</span>
      <h2>開戶導購尚未啟用</h2>
      <p>
        這裡預留給未來的合作券商開戶出口。目前沒有追蹤代碼，也不會把你帶到任何券商網站。
      </p>
      <a href={AFFILIATE_PLACEHOLDER_HREF}>前往開戶（尚未啟用）</a>
    </aside>
  );
}
