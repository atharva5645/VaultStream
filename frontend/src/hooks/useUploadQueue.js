import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { formatBytes } from './useVideoValidation';
import { useTenant } from '../context/TenantContext';
import { useNotifications } from '../context/NotificationContext';

const STORAGE_KEY = 'mockVideos';
const SAMPLE_VIDEO_URL = 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
const MOCK_UPLOAD_ENDPOINT = '/mock/uploads';

const createUploadId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `upload-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const formatEta = (secondsRemaining) => {
  if (!Number.isFinite(secondsRemaining) || secondsRemaining <= 0) return 'Calculating';
  if (secondsRemaining < 60) return `${Math.ceil(secondsRemaining)}s remaining`;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = Math.ceil(secondsRemaining % 60);
  return `${minutes}m ${String(seconds).padStart(2, '0')}s remaining`;
};

const uploadClient = axios.create({
  adapter: (config) =>
    new Promise((resolve, reject) => {
      const isFormData = config.data instanceof FormData;
      const file = isFormData ? config.data.get('file') : config.data?.file;
      const totalBytes = file?.size ?? 0;
      const startedAt = performance.now();
      let loadedBytes = 0;

      if (!file) {
        reject(new axios.AxiosError('No file attached to upload request.', 'ERR_BAD_REQUEST', config));
        return;
      }

      const failUpload = () => {
        reject(new axios.AxiosError('Upload canceled.', 'ERR_CANCELED', config));
      };

      if (config.signal?.aborted) {
        failUpload();
        return;
      }

      const handleAbort = () => {
        clearInterval(intervalId);
        config.signal?.removeEventListener('abort', handleAbort);
        failUpload();
      };

      config.signal?.addEventListener('abort', handleAbort);

      const intervalId = window.setInterval(() => {
        const chunkSize = Math.max(totalBytes * (0.04 + Math.random() * 0.09), 256 * 1024);
        loadedBytes = Math.min(totalBytes, loadedBytes + chunkSize);

        config.onUploadProgress?.({
          loaded: loadedBytes,
          total: totalBytes,
          progress: totalBytes ? loadedBytes / totalBytes : 0,
          bytes: chunkSize,
          rate: loadedBytes / ((performance.now() - startedAt) / 1000),
          estimated: totalBytes ? (totalBytes - loadedBytes) / Math.max(loadedBytes / ((performance.now() - startedAt) / 1000), 1) : 0,
          upload: true,
        });

        if (loadedBytes >= totalBytes) {
          clearInterval(intervalId);
          config.signal?.removeEventListener('abort', handleAbort);

          window.setTimeout(() => {
            resolve({
              data: {
                id: createUploadId(),
                url: SAMPLE_VIDEO_URL,
                mock: true,
              },
              status: 200,
              statusText: 'OK',
              headers: {},
              config,
            });
          }, 500 + Math.random() * 700);
        }
      }, 280);
    }),
});

const persistCompletedUpload = (item, currentTenant) => {
  const existingVideos = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const newVideo = {
    id: item.libraryId,
    tenantId: currentTenant?.id ?? 'default-tenant',
    tenantName: currentTenant?.name ?? 'Default Workspace',
    title: item.title,
    fileName: item.file.name,
    size: item.file.size,
    date: new Date().toISOString(),
    status: 'Processed',
    videoUrl: item.remoteUrl || SAMPLE_VIDEO_URL,
    thumbnail: item.thumbnailDataUrl,
    duration: item.duration,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify([newVideo, ...existingVideos]));
};

export const useUploadQueue = () => {
  const [queue, setQueue] = useState([]);
  const controllersRef = useRef(new Map());
  const queueRef = useRef(queue);
  const { currentTenant } = useTenant();
  const { notifyError, notifySuccess, notifyWarning } = useNotifications();

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  const updateQueueItem = (id, updater) => {
    setQueue((currentQueue) =>
      currentQueue.map((item) => {
        if (item.id !== id) return item;
        return typeof updater === 'function' ? updater(item) : { ...item, ...updater };
      }),
    );
  };

  const addFiles = (validatedFiles) => {
    const nextItems = validatedFiles.map((entry) => ({
      id: createUploadId(),
      libraryId: createUploadId(),
      file: entry.file,
      title: entry.suggestedTitle,
      thumbnailDataUrl: entry.thumbnailDataUrl,
      previewUrl: URL.createObjectURL(entry.file),
      duration: entry.duration,
      tenantId: currentTenant?.id ?? 'default-tenant',
      progress: 0,
      uploadedBytes: 0,
      speedBytesPerSecond: 0,
      etaSeconds: null,
      status: 'queued',
      error: null,
      remoteUrl: null,
      addedAt: Date.now(),
    }));

    setQueue((currentQueue) => [...nextItems, ...currentQueue]);
  };

  const updateTitle = (id, title) => {
    updateQueueItem(id, { title });
  };

  const releaseQueueItem = (item) => {
    if (item?.previewUrl) {
      URL.revokeObjectURL(item.previewUrl);
    }
  };

  const removeFile = (id) => {
    const targetItem = queueRef.current.find((item) => item.id === id);
    controllersRef.current.get(id)?.abort();
    controllersRef.current.delete(id);

    if (targetItem) {
      releaseQueueItem(targetItem);
    }

    setQueue((currentQueue) => currentQueue.filter((item) => item.id !== id));
  };

  const cancelUpload = (id) => {
    const controller = controllersRef.current.get(id);

    if (controller) {
      controller.abort();
      controllersRef.current.delete(id);
      updateQueueItem(id, {
        status: 'canceled',
        error: 'Upload canceled by user.',
      });
      return;
    }

    updateQueueItem(id, {
      status: 'canceled',
      error: 'Upload canceled before it started.',
    });
  };

  const retryUpload = (id) => {
    controllersRef.current.get(id)?.abort();
    controllersRef.current.delete(id);
    updateQueueItem(id, (item) => ({
      ...item,
      progress: 0,
      uploadedBytes: 0,
      speedBytesPerSecond: 0,
      etaSeconds: null,
      status: 'queued',
      error: null,
      remoteUrl: null,
      addedAt: Date.now(),
    }));
  };

  const clearCompleted = () => {
    const completedItems = queueRef.current.filter((item) => item.status === 'completed');
    completedItems.forEach(releaseQueueItem);
    setQueue((currentQueue) => currentQueue.filter((item) => item.status !== 'completed'));
  };

  useEffect(() => {
    const activeItem = queue.find((item) => item.status === 'uploading' || item.status === 'processing');
    if (activeItem) return;

    const nextQueuedItem = queue.find((item) => item.status === 'queued');
    if (!nextQueuedItem) return;

    const controller = new AbortController();
    controllersRef.current.set(nextQueuedItem.id, controller);

    updateQueueItem(nextQueuedItem.id, {
      status: 'uploading',
      error: null,
    });

    const startTime = performance.now();

    const formData = new FormData();
    formData.append('file', nextQueuedItem.file);
    formData.append('title', nextQueuedItem.title || '');

    uploadClient
      .post(
        MOCK_UPLOAD_ENDPOINT,
        formData,
        {
          signal: controller.signal,
          onUploadProgress: (event) => {
            const total = event.total || nextQueuedItem.file.size;
            const loaded = Math.min(event.loaded || 0, total);
            const elapsedSeconds = Math.max((performance.now() - startTime) / 1000, 0.1);
            const speed = loaded / elapsedSeconds;
            const eta = total > loaded ? (total - loaded) / Math.max(speed, 1) : 0;

            updateQueueItem(nextQueuedItem.id, {
              progress: total ? Math.round((loaded / total) * 100) : 0,
              uploadedBytes: loaded,
              speedBytesPerSecond: speed,
              etaSeconds: eta,
            });
          },
        },
      )
      .then((response) => {
        controllersRef.current.delete(nextQueuedItem.id);
        updateQueueItem(nextQueuedItem.id, {
          progress: 100,
          uploadedBytes: nextQueuedItem.file.size,
          speedBytesPerSecond: nextQueuedItem.file.size / Math.max((performance.now() - startTime) / 1000, 1),
          etaSeconds: 0,
          status: 'processing',
          remoteUrl: response.data?.url || SAMPLE_VIDEO_URL,
        });

        window.setTimeout(() => {
          const latestItem = queueRef.current.find((item) => item.id === nextQueuedItem.id);
          if (!latestItem || latestItem.status === 'canceled') return;

          updateQueueItem(nextQueuedItem.id, {
            status: 'completed',
            error: null,
          });

          persistCompletedUpload(
            {
              ...latestItem,
              remoteUrl: response.data?.url || SAMPLE_VIDEO_URL,
            },
            currentTenant,
          );
          notifySuccess('Upload completed', `${latestItem.title} was uploaded to ${currentTenant?.name || 'your workspace'}.`, false);
        }, 1000 + Math.random() * 1000);
      })
      .catch((error) => {
        controllersRef.current.delete(nextQueuedItem.id);
        if (axios.isCancel(error) || error.code === 'ERR_CANCELED') {
          updateQueueItem(nextQueuedItem.id, {
            status: 'canceled',
            error: 'Upload canceled by user.',
          });
          notifyWarning('Upload canceled', `${nextQueuedItem.title} was canceled.`, false);
          return;
        }

        updateQueueItem(nextQueuedItem.id, {
          status: 'failed',
          error: error.message || 'Upload failed before the server accepted the file.',
        });
        notifyError('Processing failed', error.message || `${nextQueuedItem.title} could not be uploaded.`, true);
      });
  }, [currentTenant, queue]);

  useEffect(() => {
    return () => {
      controllersRef.current.forEach((controller) => controller.abort());
      queueRef.current.forEach(releaseQueueItem);
    };
  }, []);

  const stats = useMemo(() => {
    const queued = queue.filter((item) => item.status === 'queued').length;
    const uploading = queue.filter((item) => item.status === 'uploading').length;
    const completed = queue.filter((item) => item.status === 'completed').length;
    const failed = queue.filter((item) => item.status === 'failed').length;
    const totalBytes = queue.reduce((sum, item) => sum + item.file.size, 0);

    return {
      queued,
      uploading,
      completed,
      failed,
      totalBytes,
      totalLabel: formatBytes(totalBytes),
    };
  }, [queue]);

  const decoratedQueue = useMemo(
    () =>
      queue.map((item) => ({
        ...item,
        etaLabel:
          item.status === 'processing'
            ? 'Finalizing upload'
            : item.status === 'completed'
              ? 'Ready in library'
              : formatEta(item.etaSeconds),
      })),
    [queue],
  );

  return {
    queue: decoratedQueue,
    stats,
    addFiles,
    updateTitle,
    cancelUpload,
    retryUpload,
    removeFile,
    clearCompleted,
  };
};

export default useUploadQueue;
