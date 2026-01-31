
export class CanvaIntegration {
  static async createDesign(accessToken: string, title: string, templateId?: string) {
    const response = await fetch("https://api.canva.com/rest/v1/designs", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: title || "New TaskClarify Design",
        design_type: {
          type: "preset",
          name: templateId || "doc"
        },
      }),
    });

    const data = await response.json();
    console.log('[Canva API] Create Response:', data);

    if (!response.ok) {
      throw new Error(data.message || `Canva API error: ${response.status}`);
    }

    return {
      success: true,
      url: data.url,
      id: data.id,
    };
  }
}
