import { randomUUID } from 'node:crypto';

/**
 * Provider-agnostic object storage abstraction.
 *
 * Sprint 2 ships a local, no-network stub so the profile domain never couples
 * to a specific provider (S3 / R2 / Cloudinary / GCS). A real provider can be
 * plugged in later by implementing this interface — the profile code does not
 * change.
 */
export interface UploadTarget {
  /** URL/endpoint the client uploads bytes to (abstract for the stub). */
  uploadUrl: string;
  /** Server-issued object key the client must commit verbatim. */
  objectKey: string;
}

export interface StorageService {
  /** Derive the object key for a user's avatar. Server controls the key. */
  buildAvatarKey(userId: string, extension: string): string;
  /** Create an upload target for a server-issued key. */
  createUploadTarget(objectKey: string, contentType: string): Promise<UploadTarget>;
  /** Resolve the public URL for a committed object key. */
  resolvePublicUrl(objectKey: string): string;
  /** Best-effort existence check. Returns true when unknown (stub). */
  head(objectKey: string): Promise<boolean>;
  /** Best-effort delete. Never throws for a missing object. */
  delete(objectKey: string): Promise<void>;
}

const AVATAR_PREFIX = 'avatars';

/** Map an allowed content type to a canonical file extension. */
export function extensionForContentType(contentType: string): string | null {
  switch (contentType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return null;
  }
}

/**
 * Local stub implementation. Generates deterministic keys and abstract URLs
 * without touching any external provider. Suitable for development and tests.
 */
class LocalStubStorage implements StorageService {
  private readonly baseUrl: string;

  constructor(baseUrl = 'https://storage.local/aura') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  buildAvatarKey(userId: string, extension: string): string {
    return `${AVATAR_PREFIX}/${userId}/${randomUUID()}.${extension}`;
  }

  async createUploadTarget(objectKey: string): Promise<UploadTarget> {
    // A real provider would return a pre-signed PUT URL here.
    return { uploadUrl: `${this.baseUrl}/upload/${objectKey}`, objectKey };
  }

  resolvePublicUrl(objectKey: string): string {
    return `${this.baseUrl}/${objectKey}`;
  }

  async head(): Promise<boolean> {
    // The stub cannot verify existence; treat as present so commit is allowed.
    return true;
  }

  async delete(): Promise<void> {
    // No-op for the stub.
  }
}

export const storageService: StorageService = new LocalStubStorage();
