/**
 * Draft job-media store for the booking flow. The photos screen collects
 * compressed base64 photos (+ an optional short video and the pricing mode);
 * the confirm step reads them into the create-booking request. A tiny module
 * store — base64 blobs are far too big to thread through route params.
 * Cleared after a successful submit (or when a new flow starts).
 */

export type AssessmentChoice = 'Inspection' | 'RemoteQuote';

type DraftMedia = {
  /** Compressed job photos as raw base64 (no data: prefix needed server-side). */
  photosBase64: string[];
  /** Local URIs matching photosBase64, for thumbnails on later steps. */
  photoUris: string[];
  /** Short job clip as base64, or null. */
  videoBase64: string | null;
  videoUri: string | null;
  assessment: AssessmentChoice;
};

const empty = (): DraftMedia => ({
  photosBase64: [],
  photoUris: [],
  videoBase64: null,
  videoUri: null,
  assessment: 'Inspection',
});

let draft: DraftMedia = empty();

export const bookingMedia = {
  get: () => draft,
  setPhotos(photosBase64: string[], photoUris: string[]) {
    draft = { ...draft, photosBase64, photoUris };
  },
  setVideo(videoBase64: string | null, videoUri: string | null) {
    draft = { ...draft, videoBase64, videoUri };
  },
  setAssessment(assessment: AssessmentChoice) {
    draft = { ...draft, assessment };
  },
  reset() {
    draft = empty();
  },
};
