export type SavedAudio = { id: number; name: string; url: string };
type StoredAudio = { id: number; name: string; blob: Blob };

const AUDIO_DB_NAME = "echo-delay-audio";
const AUDIO_STORE_NAME = "recordings";

function openAudioDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(AUDIO_DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(AUDIO_STORE_NAME, { keyPath: "id", autoIncrement: true });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getStoredAudios(): Promise<SavedAudio[]> {
  const database = await openAudioDatabase();
  return new Promise((resolve, reject) => {
    const request = database.transaction(AUDIO_STORE_NAME, "readonly").objectStore(AUDIO_STORE_NAME).getAll();
    request.onsuccess = () => {
      database.close();
      resolve((request.result as StoredAudio[]).map((audio) => ({ ...audio, url: URL.createObjectURL(audio.blob) })));
    };
    request.onerror = () => {
      database.close();
      reject(request.error);
    };
  });
}

export async function storeAudio(audio: Omit<StoredAudio, "id">): Promise<SavedAudio> {
  const database = await openAudioDatabase();
  return new Promise((resolve, reject) => {
    const request = database.transaction(AUDIO_STORE_NAME, "readwrite").objectStore(AUDIO_STORE_NAME).add(audio);
    request.onsuccess = () => {
      database.close();
      resolve({ ...audio, id: request.result as number, url: URL.createObjectURL(audio.blob) });
    };
    request.onerror = () => {
      database.close();
      reject(request.error);
    };
  });
}
