import { useEffect, useRef, useState } from 'react';
import { useInterval } from 'react-use';
import { getUserInstances } from '@/services/dockerService';
import { fetchProfile } from '@/services/authService';
import ax from '@/conf/ax';
import type { Message as VisionMessage } from '@/lib/types';

export interface VisionInstance {
  id: string;
  modelId: string;
  modelName: string | null;
  modelCategory?: string | null;
  containerName: string;
  port: number;
  status: string;
}

export interface UploadedImage {
  file: File;
  preview: string;
  base64: string;
}

export type ImageSource = 'upload' | 'url' | 'camera';

type OllamaMessage = {
  role: 'user' | 'assistant';
  content: string;
  images?: string[];
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Failed to read file'));
        return;
      }
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
  });
};

export const useVisionPlayground = () => {
  // Instance State
  const [selectedInstance, setSelectedInstance] = useState<VisionInstance | null>(null);
  const [visionInstances, setVisionInstances] = useState<VisionInstance[]>([]);
  const [isHealthy, setIsHealthy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Image State
  const [imageSource, setImageSource] = useState<ImageSource>('upload');
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);

  // Model Parameters
  const [temperature, setTemperature] = useState([0.7]);
  const [maxTokens, setMaxTokens] = useState(1024);

  // Chat State
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<VisionMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const uploadedImagesRef = useRef<UploadedImage[]>([]);

  // Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const clearImages = () => {
    setUploadedImages((prev) => {
      prev.forEach((img) => URL.revokeObjectURL(img.preview));
      return [];
    });
    setActiveImageIndex(0);
  };

  const addFilesAsImages = async (files: File[]) => {
    if (files.length === 0) return;

    const remainingSlots = Math.max(0, 5 - uploadedImages.length);
    if (remainingSlots === 0) return;

    const filesToAdd = files.slice(0, remainingSlots);
    const activeIndexBeforeAdd = uploadedImages.length;

    setIsLoadingImage(true);
    setError(null);

    try {
      const newImages = await Promise.all(
        filesToAdd.map(async (file) => {
          const preview = URL.createObjectURL(file);
          const base64 = await fileToBase64(file);
          return { file, preview, base64 } satisfies UploadedImage;
        })
      );

      setUploadedImages((prev) => [...prev, ...newImages]);
      setActiveImageIndex(Math.min(activeIndexBeforeAdd + newImages.length - 1, 4));
    } catch {
      setError('Failed to process images');
    } finally {
      setIsLoadingImage(false);
    }
  };

  const handleAddImageFromUrl = async () => {
    if (!imageUrl.trim()) return;
    if (uploadedImages.length >= 5) return;
    if (isFetchingUrl) return;

    setIsFetchingUrl(true);
    setError(null);

    try {
      const url = new URL(imageUrl.trim());
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error('URL must start with http:// or https://');
      }

      const response = await ax.get(url.toString(), {
        responseType: 'blob',
        validateStatus: () => true,
      });

      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Failed to fetch image (HTTP ${response.status})`);
      }

      const blob = response.data as Blob;
      if (!blob.type.startsWith('image/')) {
        throw new Error('URL does not point to an image');
      }

      const filenameFromUrl = url.pathname.split('/').filter(Boolean).pop();
      const filename = filenameFromUrl || `image-${Date.now()}`;
      const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });

      const preview = URL.createObjectURL(blob);
      const base64 = await fileToBase64(file);

      const activeIndexBeforeAdd = uploadedImages.length;
      setUploadedImages((prev) => [...prev, { file, preview, base64 }]);
      setActiveImageIndex(Math.min(activeIndexBeforeAdd, 4));
      setImageUrl('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load image URL';
      setError(message);
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const stopCamera = () => {
    const stream = cameraStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraFacingMode },
        audio: false,
      });

      cameraStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      setIsCameraActive(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to access camera';
      setCameraError(message);
      setIsCameraActive(false);
    }
  };

  const captureFromCamera = async () => {
    if (uploadedImages.length >= 5) return;

    const video = videoRef.current;
    if (!video) return;

    if (!video.videoWidth || !video.videoHeight) {
      setCameraError('Camera is not ready yet');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setCameraError('Failed to capture image');
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.92)
    );

    if (!blob) {
      setCameraError('Failed to capture image');
      return;
    }

    const file = new File([blob], `camera-${Date.now()}.jpg`, {
      type: blob.type || 'image/jpeg',
    });
    const preview = URL.createObjectURL(blob);
    const base64 = await fileToBase64(file);

    const activeIndexBeforeAdd = uploadedImages.length;
    setUploadedImages((prev) => [...prev, { file, preview, base64 }]);
    setActiveImageIndex(Math.min(activeIndexBeforeAdd, 4));
  };

  // Keep refs in sync for cleanup
  useEffect(() => {
    uploadedImagesRef.current = uploadedImages;
  }, [uploadedImages]);

  // Cleanup previews and camera on unmount
  useEffect(() => {
    return () => {
      uploadedImagesRef.current.forEach((img) => URL.revokeObjectURL(img.preview));
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clamp active image index when list changes
  useEffect(() => {
    setActiveImageIndex((prev) =>
      Math.min(prev, Math.max(0, uploadedImages.length - 1))
    );
  }, [uploadedImages.length]);

  // Stop camera when leaving camera mode
  useEffect(() => {
    if (imageSource !== 'camera') {
      stopCamera();
      setCameraError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSource]);

  // Restart camera when facing mode changes
  useEffect(() => {
    if (!isCameraActive) return;
    startCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraFacingMode]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load instances
  useEffect(() => {
    const fetchInstances = async () => {
      try {
        const user = await fetchProfile();
        if (!user) return;

        const response = await getUserInstances(String(user.id), {
          engineId: 'ollama',
        });
        if (!response.success) return;

        const instances = Array.isArray(response.data)
          ? (response.data as VisionInstance[])
          : [];
        const visionOnly = instances.filter(
          (inst) => String(inst.modelCategory ?? '').toLowerCase() === 'vision'
        );
        setVisionInstances(visionOnly);
        if (visionOnly.length > 0) setSelectedInstance(visionOnly[0]);
      } catch (err) {
        console.error('Failed to fetch instances:', err);
        setError('Failed to load instances');
      }
    };

    fetchInstances();
  }, []);

  const checkHealth = async (port: number): Promise<boolean> => {
    try {
      const response = await ax.get('/ollama/tags', {
        params: { port },
        timeout: 5000,
        validateStatus: () => true,
      });
      return response.status >= 200 && response.status < 300;
    } catch {
      return false;
    }
  };

  useInterval(
    () => {
      if (!selectedInstance) return;
      checkHealth(selectedInstance.port).then((healthy) => {
        setIsHealthy(healthy);
        if (!healthy && !isLoading) {
          setError(`Instance ${selectedInstance.containerName} is not responding`);
        } else if (healthy && error?.includes('not responding')) {
          setError(null);
        }
      });
    },
    selectedInstance ? 30000 : null
  );

  // Initial health check on instance change
  useEffect(() => {
    if (!selectedInstance) {
      setIsHealthy(false);
      setError(null);
      return;
    }

    checkHealth(selectedInstance.port).then((healthy) => {
      setIsHealthy(healthy);
      if (!healthy) {
        setError(`Instance ${selectedInstance.containerName} is not responding`);
      } else if (error?.includes('not responding')) {
        setError(null);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedInstance]);

  const handleSendMessage = async (overridePrompt?: string) => {
    const effectivePrompt = (overridePrompt ?? prompt).trim();
    if (
      (!effectivePrompt && uploadedImages.length === 0) ||
      !selectedInstance ||
      isLoading ||
      !isHealthy
    )
      return;

    const imagesToSend = uploadedImages.map((img) => img.base64);
    const contentToSend = effectivePrompt || 'Describe this image';
    const messageBaseId = Date.now();
    const assistantMessageId = `assistant-${messageBaseId}`;

    setPrompt('');
    setError(null);
    setIsLoading(true);

    const userMsg: VisionMessage = {
      id: `user-${messageBaseId}`,
      role: 'user',
      content: contentToSend,
      images: imagesToSend.length > 0 ? imagesToSend : undefined,
      timestamp: messageBaseId,
    };

    const assistantMsg: VisionMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: messageBaseId,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);

    try {
      const apiMessages: OllamaMessage[] = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        ...(msg.images && msg.images.length > 0 ? { images: msg.images } : {}),
      }));

      apiMessages.push({
        role: 'user',
        content: contentToSend,
        ...(imagesToSend.length > 0 ? { images: imagesToSend } : {}),
      });

      let lastResponseLength = 0;
      let buffer = '';
      let fullResponse = '';

      const processText = (text: string) => {
        buffer += text;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const json = JSON.parse(line);
            if (json.message?.content) {
              fullResponse += json.message.content;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessageId ? { ...m, content: fullResponse } : m
                )
              );
            }
          } catch (e) {
            console.error('Error parsing JSON:', e);
          }
        }
      };

      const response = await ax.post(
        '/ollama/chat',
        {
          model: selectedInstance.modelName || selectedInstance.modelId,
          messages: apiMessages,
          stream: true,
          options: {
            temperature: temperature[0],
            num_predict: Math.max(1, maxTokens),
          },
        },
        {
          params: { port: selectedInstance.port },
          responseType: 'text',
          transformResponse: (v) => v,
          validateStatus: () => true,
          onDownloadProgress: (pe: any) => {
            const xhr = pe?.event?.currentTarget as XMLHttpRequest | undefined;
            const responseText = xhr?.responseText;
            if (typeof responseText !== 'string') return;
            const chunk = responseText.substring(lastResponseLength);
            lastResponseLength = responseText.length;
            if (chunk) processText(chunk);
          },
        }
      );

      if (response.status < 200 || response.status >= 300) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (buffer.trim()) processText('\n');
    } catch (err) {
      console.error('Vision chat error:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Error: ${errorMessage}`);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? { ...m, content: `Error: ${errorMessage}` }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearConversation = () => {
    if (confirm('Clear conversation and images?')) {
      setMessages([]);
      clearImages();
      setPrompt('');
      setError(null);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => {
      const img = prev[index];
      if (img) URL.revokeObjectURL(img.preview);
      return prev.filter((_, i) => i !== index);
    });

    setActiveImageIndex((prev) => {
      if (prev === index) return Math.max(0, prev - 1);
      if (prev > index) return prev - 1;
      return prev;
    });
  };

  return {
    selectedInstance,
    visionInstances,
    isHealthy,
    error,
    imageSource,
    uploadedImages,
    isLoadingImage,
    activeImageIndex,
    imageUrl,
    isFetchingUrl,
    temperature,
    maxTokens,
    prompt,
    messages,
    isLoading,
    isCameraActive,
    cameraFacingMode,
    cameraError,
    messagesEndRef,
    textareaRef,
    videoRef,
    setSelectedInstance,
    setImageSource,
    setActiveImageIndex,
    setImageUrl,
    setTemperature,
    setMaxTokens,
    setPrompt,
    setCameraFacingMode,
    addFilesAsImages,
    handleAddImageFromUrl,
    startCamera,
    stopCamera,
    captureFromCamera,
    handleSendMessage,
    handleClearConversation,
    removeImage,
    clearImages,
  };
};
