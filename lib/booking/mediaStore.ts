/**
 * Draft job-media store for the booking flow. The photos screen collects
 * compressed base64 photos (+ an optional short video and the pricing mode);
 * the confirm step reads them into the create-booking request. A tiny module
 * store — base64 blobs are far too big to thread through route params.
 * Cleared after a successful submit (or when a new flow starts).
 *
 * The VIDEO is deliberately held as a file URI, not as base64. Base64 inflates
 * a clip by a third, and the encoded string used to be created on the photos
 * screen and then carried — in component state and again in this store —
 * through location and summary before it was ever sent. At the old 25 MB cap
 * that was a ~33 MB string kept alive across three screens, copied again by
 * JSON.stringify and once more by axios. Reading it here, at the moment of
 * submit, keeps the peak brief instead of sustained.
 *
 * The remaining base64 in the request body is a limitation of the API
 * contract: POST /bookings takes `videoBase64`. The proper fix is multipart
 * (or a presigned upload) so the bytes stream from disk and never enter the JS
 * heap — that needs the endpoint to accept it.
 */

export type AssessmentChoice = 'Inspection' | 'RemoteQuote';

type DraftMedia = {
  /** Compressed job photos as raw base64 (no data: prefix needed server-side). */
  photosBase64: string[];
  /** Local URIs matching photosBase64, for thumbnails on later steps. */
  photoUris: string[];
  /** Local URI of the short job clip, or null. Encoded only at submit. */
  videoUri: string | null;
  assessment: AssessmentChoice;
};

const empty = (): DraftMedia => ({
  photosBase64: [],
  photoUris: [],
  videoUri: null,
  assessment: 'Inspection',
});

let draft: DraftMedia = empty();

/** Reads a local file into raw base64 (no data: prefix). */
async function fileToBase64(uri: string): Promise<string | null> {
  try {
    const res = await fetch(uri);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = String(reader.result ?? '');
        const comma = dataUri.indexOf(',');
        resolve(comma >= 0 ? dataUri.slice(comma + 1) : null);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export const bookingMedia = {
  get: () => draft,
  setPhotos(photosBase64: string[], photoUris: string[]) {
    draft = { ...draft, photosBase64, photoUris };
  },
  setVideo(videoUri: string | null) {
    draft = { ...draft, videoUri };
  },
  setAssessment(assessment: AssessmentChoice) {
    draft = { ...draft, assessment };
  },
  /** Encode the clip for the request. Called once, at submit. */
  async readVideoBase64(): Promise<string | null> {
    if (!draft.videoUri) return null;
    return fileToBase64(draft.videoUri);
  },
  reset() {
    draft = empty();
  },
};
