/**
 * What the customer typed on the later booking steps, kept outside the screens. Going back
 * pops a screen and drops its state, so without this the address was lost every time the
 * customer went back to add photos and came forward again. The request screen resets it
 * when a new booking starts. (Photos and video live in mediaStore.)
 */
export type BookingLocationDraft = {
  addressText: string;
  instructions: string;
  coords: { lat: number; lng: number } | null;
};

const empty = (): BookingLocationDraft => ({ addressText: '', instructions: '', coords: null });

let location = empty();

export const bookingDraft = {
  location: () => location,
  setLocation(next: Partial<BookingLocationDraft>) {
    location = { ...location, ...next };
  },
  reset() {
    location = empty();
  },
};
