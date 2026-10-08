# Servika customer app: pre-launch test pass

Started 2026-10-08. Tick a box only after the flow worked on a real phone against
the production API (`EXPO_PUBLIC_API_URL=https://api.servika.com.ng`). Write the bug
under the flow and fix it before moving on. Pro-side steps need a verified artisan
account (approve it in the admin console) on a second phone, or the Pro app on the same phone.

## 0. Build and boot
- [ ] `npx expo prebuild -p android --clean && npx expo run:android` succeeds with package `com.servika.app`
- [ ] Splash: orange tile, then text appears under a logo that never moved
- [ ] First launch shows onboarding; a signed-in relaunch skips it
- [ ] Home loads with airplane mode on: bundled categories, skeletons, no error text

## 1. Auth
- [ ] Register (name, email, password) -> 6-digit code arrives -> "You are in" -> Home
- [ ] Wrong code 3x, expired code, resend cooldown, paste from mail
- [ ] Login; returning-account variant ("Not you?" clears it)
- [ ] Login with an unverified account reopens the code screen
- [ ] Forgot password: code -> new password -> lands signed in
- [ ] Continue with Google (needs the Android OAuth client for `com.servika.app`)
- [ ] Leave the app 16+ minutes, come back: a request silently refreshes the token
- [ ] Log out; guest wall appears on Bookings / Messages / Profile tabs
- [ ] Delete account (double confirm) -> login afterwards fails

## 2. Discovery
- [ ] Home: popular services, "Services close to you" rail (hidden when none), artisans near you
- [ ] Location pill -> sheet: current location, quick picks, search (LocationIQ / Photon suggestions)
- [ ] Set on map: MapLibre tiles render, pin drags, area name resolves, Home re-sorts
- [ ] Explore tab: pins on the map, bottom sheet list, category chips, locate me
- [ ] Categories -> category listing -> artisan profile (gallery opens the viewer, reviews, save heart)
- [ ] Service profile page -> "Book for N" (auth-gated)
- [ ] Chat from a profile before any booking; phone numbers / emails get hidden

## 3. Booking creation
- [ ] Direct request: photos (camera + library), short video, date + time window, address autocomplete, summary -> "Request sent", nothing to pay
- [ ] Open request from a category: "Artisan inspects first" and "Get price offers now"
- [ ] Fixed-price booking from a service listing -> Pending -> pay only after the artisan accepts
- [ ] Back from the success screen goes Home, not back through the forms

## 4. Price agreement and payment
- [ ] Artisan quotes -> customer sees the quote card (labour / materials) -> Accept -> pay sheet
- [ ] Pay online: in-app Paystack checkout, card, bank transfer, OPay hop and return, "waiting" state, success screen with reference
- [ ] Paystack Cancel returns to the booking unpaid
- [ ] Pay cash instead; switch cash -> online before work starts
- [ ] Counter-offer on labour (3 rounds), artisan accepts -> booking priced at your number
- [ ] Offers list on a bidding request: sort chips, badges, accept one offer
- [ ] Rejected direct request -> "Ask other artisans" -> becomes Open
- [ ] Materials advance request shows; approve -> "Materials released" row

## 5. Live job
- [ ] Artisan on the way -> "Track artisan live": puck moves, ETA, your blue dot, recenter
- [ ] Arrived with no price: the keep-it-in-Servika notice shows; on-site quote arrives
- [ ] Work cannot start until paid or cash chosen (artisan side shows the gate)
- [ ] Chat during the job: live receive, unread badge, notification tap opens the thread
- [ ] Push notification tap (app closed) opens the right booking
- [ ] Proof review: work photos, materials receipt, Confirm -> review screen -> review shows on the profile

## 6. Problems and money back
- [ ] Cancel at Pending / Accepted / OnMyWay / Arrived; a paid booking shows Refunded
- [ ] Report an issue on an in-progress or completed job -> card shows status -> admin resolves -> outcome and refund visible
- [ ] Wallet screen lists the payment, fee line and refund

## 7. Account
- [ ] Edit profile (name, phone); Saved artisans; Payments; Notifications feed (mark all read)
- [ ] Refer: code copies and shares; withdraw: bank picker, account name resolves on the 10th digit
- [ ] Settings rows all open something; Terms / Privacy / Help open

## 8. Device edge cases
- [ ] Keyboard never covers a button or the chat composer (edge-to-edge Android)
- [ ] Bottom buttons clear the gesture bar on every stack screen
- [ ] Slow network: skeletons, retries, no infinite spinners
- [ ] Rotate / background / kill the app mid-checkout and come back
- [ ] Small phone (5.5") and large phone: nothing clipped, labels never truncated

## Bugs found
(flow -> what happened -> fix commit)
