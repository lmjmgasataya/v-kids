import sharp from "sharp";
import { PHOTO_MAX_PX } from "./constants";

// PhotoCapture resizes to PHOTO_MAX_PX in the browser, so normally the upload is already
// final and sharp never runs here.
const JPEG_QUALITY = 82;

// Width/height of a baseline or progressive JPEG with no EXIF block, read from its header
// without decoding. Null for anything else — not a JPEG, or it carries EXIF (which may hold
// an orientation sharp's .rotate() has to apply). Canvas-encoded JPEGs never have EXIF.
function plainJpegSize(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) return null;
    const marker = buf[i + 1];
    if (marker === 0xe1 && buf.toString("ascii", i + 4, i + 8) === "Exif") return null;
    // SOF0–SOF15, minus DHT (C4), JPG (C8) and DAC (CC), which share the range.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    if (marker === 0xda) return null; // start of scan with no frame header seen
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return null;
}

// The bytes to store for an uploaded photo: as-is when the browser already resized it,
// otherwise resized/re-encoded with sharp (.rotate() first, to apply phone EXIF orientation).
export async function preparePhotoUpload(photo: File): Promise<Buffer> {
  const buf = Buffer.from(await photo.arrayBuffer());
  const size = plainJpegSize(buf);
  if (size && size.width <= PHOTO_MAX_PX && size.height <= PHOTO_MAX_PX) return buf;
  return sharp(buf)
    .rotate()
    .resize({ width: PHOTO_MAX_PX, height: PHOTO_MAX_PX, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer();
}
