import { Observable, from, switchMap, throwError } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { FileUploadService } from './file-upload.service';

const MALE_AVATARS = [
  'man (1).png',
  'man (2).png',
  'man (3).png',
  'man (4).png',
];

const FEMALE_AVATARS = [
  'woman (1).png',
  'woman (2).png',
  'woman (3).png',
  'woman (4).png',
  'woman (5).png',
  'woman (6).png',
];

const AVATAR_BASE_PATH = '/assets/avators';

export function pickDefaultAvatarFilename(gender: string): string {
  const normalized = gender.trim().toLowerCase();
  const pool = normalized === 'female' ? FEMALE_AVATARS : MALE_AVATARS;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

export function pickDefaultAvatarPath(gender: string): string {
  const filename = pickDefaultAvatarFilename(gender);
  return `${AVATAR_BASE_PATH}/${encodeURIComponent(filename)}`;
}

export function loadDefaultAvatarFile(gender: string): Observable<File> {
  const filename = pickDefaultAvatarFilename(gender);
  const url = `${AVATAR_BASE_PATH}/${encodeURIComponent(filename)}`;

  return from(fetch(url)).pipe(
    switchMap((response) => {
      if (!response.ok) {
        return throwError(() => new Error(`Failed to load default avatar: ${filename}`));
      }
      return from(response.blob());
    }),
    map((blob) => new File([blob], filename, { type: blob.type || 'image/png' })),
  );
}

export function uploadDefaultAvatar(
  fileUploadService: FileUploadService,
  gender: string,
): Observable<string> {
  return loadDefaultAvatarFile(gender).pipe(
    switchMap((file) => fileUploadService.uploadFile(file)),
    filter((progress) => !!progress.file),
    take(1),
    map((progress) => progress.file!.id),
  );
}
