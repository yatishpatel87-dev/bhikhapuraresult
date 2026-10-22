import { auth } from './config';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };

  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Translates Firestore and Auth errors into clear, polite Gujarati messages for teachers.
 */
export function getGujaratiErrorMessage(error: unknown): string {
  if (!error) return 'અજાણી ક્ષતિ આવી છે. કૃપા કરીને ફરી પ્રયાસ કરો.';

  let raw = '';
  if (error instanceof Error) {
    raw = error.message;
  } else if (typeof error === 'string') {
    raw = error;
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.error) {
      raw = parsed.error;
    }
  } catch {
    // raw was not json
  }

  const lower = raw.toLowerCase();

  if (lower.includes('permission-denied') || lower.includes('insufficient permissions')) {
    return 'પરવાનગી નકારી દેવામાં આવી છે. કૃપા કરીને ખાતરી કરો કે તમે તમારા ગૂગલ એકાઉન્ટથી લૉગિન છો.';
  }
  if (lower.includes('popup-closed-by-user')) {
    return 'ગૂગલ લૉગિન વિન્ડો વપરાશકર્તા દ્વારા બંધ કરવામાં આવી હતી.';
  }
  if (lower.includes('network-request-failed') || lower.includes('offline') || lower.includes('client is offline')) {
    return 'ઇન્ટરનેટ કનેક્શન ઉપલબ્ધ નથી અથવા ધીમું છે. સ્થાનિક મોડમાં ડેટા સુરક્ષિત છે.';
  }
  if (lower.includes('quota exceeded')) {
    return 'ફાયરબેઝ ક્વોટા મર્યાદા પૂર્ણ થઈ ગઈ છે. કૃપા કરીને થોડા સમય પછી ફરી પ્રયાસ કરો.';
  }
  if (lower.includes('unauthorized-domain')) {
    return 'આ ડોમેન ફાયરબેઝ કન્સોલમાં અધિકૃત (Authorized Domain) તરીકે ઉમેરાયેલ નથી. કન્સોલમાં ડોમેન ઉમેરો.';
  }

  return `ક્લાઉડ ઑપરેશનમાં ભૂલ આવી: ${raw}`;
}
