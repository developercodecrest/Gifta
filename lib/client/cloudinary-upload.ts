export type CloudinarySignedUploadConfig = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  resourceType: "image" | "video" | "raw" | "auto";
};

export async function getCloudinarySignedConfig(folder: string, resourceType: "image" | "video" | "raw" | "auto" = "auto") {
  const response = await fetch("/api/uploads/cloudinary/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder, resourceType }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    data?: CloudinarySignedUploadConfig;
    error?: { message?: string };
  };

  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.error?.message ?? "Unable to fetch upload signature");
  }

  return payload.data;
}

export async function uploadFileToCloudinary(
  file: File,
  options: {
    folder: string;
    resourceType?: "image" | "video" | "raw" | "auto";
    onProgress?: (value: number) => void;
  },
) {
  const config = await getCloudinarySignedConfig(options.folder, options.resourceType ?? "auto");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", config.apiKey);
  formData.append("timestamp", String(config.timestamp));
  formData.append("signature", config.signature);
  formData.append("folder", config.folder);

  const secureUrl = await new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${config.cloudName}/${config.resourceType}/upload`);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !options.onProgress) {
        return;
      }
      const percent = Math.round((event.loaded / event.total) * 100);
      options.onProgress(percent);
    };

    xhr.onerror = () => reject(new Error("Media upload failed"));
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText) as { secure_url?: string; error?: { message?: string } };
        if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) {
          resolve(data.secure_url);
          return;
        }
        reject(new Error(data.error?.message ?? "Media upload failed"));
      } catch {
        reject(new Error("Invalid media upload response"));
      }
    };

    xhr.send(formData);
  });

  options.onProgress?.(100);
  return secureUrl;
}
