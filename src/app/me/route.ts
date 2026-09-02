import { NextResponse } from "next/server";

// Where the QR code on the business card lands.
//
// The card could have carried instagram.com/alimran.ask directly, and then the
// printed cards would point there for as long as they exist. Printing is the
// one step that cannot be taken back: change the handle, decide the code should
// open a portfolio page instead, want to know how many people actually scan —
// none of that is possible once the destination is inked onto someone else's
// domain. Pointing at our own and forwarding from here keeps every one of those
// choices open with a one-line edit.
//
// This is a static route, so it wins over [slug] and can never be mistaken for
// a restaurant. "me" is not a slug any restaurant may take.
const DESTINATION = "https://www.instagram.com/alimran.ask";

// 307, deliberately not 301. A permanent redirect is cached by the browser and
// often by the scanning app, so the first person to scan would keep landing on
// today's destination even after this file changed — which is the whole thing
// the indirection exists to avoid.
export function GET() {
  return NextResponse.redirect(DESTINATION, 307);
}
