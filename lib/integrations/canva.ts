const SUPPORTED_PRESETS = ["doc", "whiteboard", "presentation"];

const COMMON_DIMENSIONS: Record<string, { width: number; height: number }> = {
  "flyer": { width: 816, height: 1056 }, // Standard US Letter portrait
  "poster": { width: 1728, height: 2304 }, // 18x24 Standard Poster
  "social": { width: 1080, height: 1080 }, // Square Social Media Post
  "card": { width: 1500, height: 1050 }, // 5x7 Landscape Card
  "birthday_card": { width: 1500, height: 1050 },
  "instagram": { width: 1080, height: 1080 },
  "story": { width: 1080, height: 1920 },
};

export class CanvaIntegration {
  /**
   * Check status of an asset upload job
   */
  static async getUploadStatus(accessToken: string, jobId: string) {
    const response = await fetch(`https://api.canva.com/rest/v1/asset-uploads/${jobId}`, {
      headers: { "Authorization": `Bearer ${accessToken}` }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to check upload status");
    return data.job; // Returns { status: "success" | "failed" | "in_progress", asset_id?: string }
  }

  /**
   * Upload an image from a URL to Canva Assets and wait for success (polling)
   */
  static async uploadAssetFromUrl(accessToken: string, imageUrl: string, fileName: string) {
    console.log(`[Canva Integration] Fetching image from: ${imageUrl}`);
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error("Failed to fetch image from URL");

    const buffer = await imgRes.arrayBuffer();
    const metadata = JSON.stringify({
      name_base64: Buffer.from(fileName).toString("base64")
    });

    console.log(`[Canva Integration] Uploading asset to Canva...`);
    const uploadRes = await fetch("https://api.canva.com/rest/v1/asset-uploads", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/octet-stream",
        "Asset-Upload-Metadata": metadata
      },
      body: Buffer.from(buffer)
    });

    const uploadData = await uploadRes.json();
    if (!uploadRes.ok) throw new Error(uploadData.message || "Canva asset upload failed");

    const jobId = uploadData.jobId;
    console.log(`[Canva Integration] Polling for Job: ${jobId}`);

    // Poll for status (max 5 attempts, 1s apart)
    for (let i = 0; i < 5; i++) {
      await new Promise(r => setTimeout(r, 1000));
      const job = await this.getUploadStatus(accessToken, jobId);
      if (job.status === "success") {
        console.log(`[Canva Integration] Upload successful: ${job.assetId}`); // NOTE: Documentation says asset_id but actual API might return assetId
        return job.assetId || job.asset_id;
      }
      if (job.status === "failed") throw new Error("Canva asset upload job failed");
    }

    throw new Error("Canva asset upload timed out");
  }

  static async createDesign(accessToken: string, title: string, templateId?: string, assetId?: string) {
    const tid = templateId?.toLowerCase() || "doc";
    let design_type: any;

    if (SUPPORTED_PRESETS.includes(tid)) {
      design_type = {
        type: "preset",
        name: tid
      };
    } else {
      const dims = COMMON_DIMENSIONS[tid] || COMMON_DIMENSIONS["flyer"];
      design_type = {
        type: "custom",
        width: dims.width,
        height: dims.height
      };
    }

    const body: any = {
      title: title || "New TaskClarify Design",
    };

    if (assetId) {
      // ASSET-FIRST STRATEGY: 
      // If we have an asset, create the design FROM the asset.
      // Do NOT send design_type (preset/custom) as it conflicts/overrides the asset.
      body.asset_id = assetId;
      console.log('[Canva Integration] Creating design FROM ASSET:', assetId);
    } else {
      // PRESET/CUSTOM STRATEGY:
      // Only send design_type if we are NOT starting from an asset.
      body.design_type = design_type;
    }

    console.log('[Canva Integration] Creating design with body:', JSON.stringify(body));

    const response = await fetch("https://api.canva.com/rest/v1/designs", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const rawResponse = await response.text();
    console.log('[Canva API] Raw Response:', rawResponse);

    let data;
    try {
      data = JSON.parse(rawResponse);
    } catch (e) {
      throw new Error(`Canva returned non-JSON response: ${rawResponse.substring(0, 100)}`);
    }

    if (!response.ok) {
      throw new Error(data.message || `Canva API error: ${response.status} - ${rawResponse}`);
    }

    const design = data.design || data;

    return {
      success: true,
      url: design.url || design.urls?.edit_url,
      id: design.id,
    };
  }
}
